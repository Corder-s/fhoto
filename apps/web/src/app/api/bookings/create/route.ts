import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';
import { cleanText, isApprovedCreator, isUuid, matchesSessionUser } from '@/lib/server/policy';
import {
  calculateAuthoritativePricing,
  DEFAULT_TRAVEL_SETTINGS,
  KNOWN_HUBS,
  resolveCoordinatesFromText,
} from '@/lib/server/pricing';
import { createInAppNotification } from '@/lib/server/notifications';
import { EmailTemplates, sendPlatformEmail } from '@/lib/server/email';

export const dynamic = 'force-dynamic';

const DEFAULT_PLATFORM_FEE_PERCENT = 10;
const GST_PERCENT = 18;

/**
 * POST /api/bookings/create
 *
 * Creates a booking for the authenticated customer. Pricing is computed on the
 * server from the creator's active service package; client-supplied amounts are
 * ignored. The creator must be approved and the time window must not overlap an
 * existing accepted/confirmed/in-progress booking.
 */
export async function POST(request: NextRequest) {
  const auth = await authorize({ roles: ['customer'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON payload received.');
  }

  if (!matchesSessionUser(user.id, body.customerId)) {
    return jsonError(403, 'You can only create bookings for your own account.');
  }

  const {
    creatorId,
    serviceId,
    eventDate,
    startAt,
    endAt,
    locationLatitude,
    locationLongitude,
    bookingType = 'scheduled',
  } = body;
  const eventTitle = cleanText(body.eventTitle, 150);
  const eventLocation = cleanText(body.eventLocation, 300);
  const customerNotes = cleanText(body.customerNotes, 1000);

  if (!isUuid(creatorId) || !eventTitle || !eventDate || !eventLocation) {
    return jsonError(400, 'Missing required booking information (creator, event title, date, or location).');
  }
  if (serviceId !== undefined && serviceId !== null && !isUuid(serviceId)) {
    return jsonError(400, 'Invalid service identifier.');
  }
  if (bookingType !== 'scheduled' && bookingType !== 'instant') {
    return jsonError(400, 'Invalid booking type.');
  }

  const startTime = startAt || `${eventDate}T10:00:00Z`;
  const endTime = endAt || `${eventDate}T14:00:00Z`;
  if (Number.isNaN(Date.parse(startTime)) || Number.isNaN(Date.parse(endTime)) || Date.parse(endTime) <= Date.parse(startTime)) {
    return jsonError(400, 'The booking end time must be after its start time.');
  }
  if (Date.parse(startTime) < Date.now() - 5 * 60 * 1000) {
    return jsonError(400, 'Bookings cannot be placed in the past.');
  }

  try {
    const { data: creator, error: creatorErr } = await admin
      .from('creator_profiles')
      .select(`
        id,
        professional_name,
        verification_status,
        is_available,
        user_id,
        city,
        state,
        service_radius,
        base_address,
        base_latitude,
        base_longitude,
        included_travel_km,
        travel_fee_per_km,
        min_travel_fee,
        max_travel_fee,
        allow_out_of_area
      `)
      .eq('id', creatorId)
      .maybeSingle();

    if (creatorErr) return jsonError(500, 'Could not verify the selected photographer.');
    if (!creator || !isApprovedCreator(creator.verification_status)) {
      return jsonError(404, 'This photographer is not available for bookings.');
    }
    if (creator.user_id === user.id) {
      return jsonError(400, 'You cannot book your own studio.');
    }

    // Price comes from the database, never from the client.
    let agreedServicePrice = 0;
    let serviceDuration = 120;
    let resolvedServiceId: string | null = null;
    if (serviceId) {
      const { data: service } = await admin
        .from('creator_services')
        .select('id, base_price, duration_minutes, is_active')
        .eq('id', serviceId)
        .eq('creator_id', creatorId)
        .maybeSingle();
      if (!service || !service.is_active) {
        return jsonError(400, 'The selected package is not available from this photographer.');
      }
      agreedServicePrice = Number(service.base_price);
      serviceDuration = service.duration_minutes || serviceDuration;
      resolvedServiceId = service.id;
    } else {
      return jsonError(400, 'Please select a photography package.');
    }

    const [feeSettingRes, distanceSettingRes] = await Promise.all([
      admin
        .from('platform_fee_settings')
        .select('fee_value')
        .eq('is_active', true)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from('platform_distance_settings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const feeSetting = feeSettingRes.data;
    const platformDistance = distanceSettingRes.data;

    const platformFeeRate = feeSetting ? Number(feeSetting.fee_value) : DEFAULT_PLATFORM_FEE_PERCENT;
    const freeKm = platformDistance ? Number(platformDistance.free_travel_km) : DEFAULT_TRAVEL_SETTINGS.includedTravelKm;
    const platformRate = platformDistance ? Number(platformDistance.travel_fee_per_km) : DEFAULT_TRAVEL_SETTINGS.travelFeePerKm;
    const allowOverride = platformDistance ? platformDistance.allow_photographer_override : true;
    const roundTrip = platformDistance ? Boolean(platformDistance.round_trip_billing) : false;

    const effectiveTravelRate =
      allowOverride && creator.travel_fee_per_km !== null && Number(creator.travel_fee_per_km) > 0
        ? Number(creator.travel_fee_per_km)
        : platformRate;

    // Availability: reject overlapping commitments for this creator.
    const { data: conflicts, error: conflictErr } = await admin
      .from('bookings')
      .select('id')
      .eq('creator_id', creatorId)
      .in('booking_status', ['confirmed', 'in_progress', 'accepted'])
      .lt('start_at', endTime)
      .gt('end_at', startTime)
      .limit(1);

    if (conflictErr) return jsonError(500, 'Could not check availability.');
    if (conflicts && conflicts.length > 0) {
      return jsonError(409, 'Selected creator is already reserved for this timeframe. Please pick another slot.');
    }

    // Resolve Photographer Base Coordinates
    let photogLat = creator.base_latitude !== null ? Number(creator.base_latitude) : null;
    let photogLng = creator.base_longitude !== null ? Number(creator.base_longitude) : null;
    if (photogLat === null || photogLng === null || Number.isNaN(photogLat) || Number.isNaN(photogLng)) {
      const hubCoords = resolveCoordinatesFromText(creator.base_address || creator.city || 'Delhi NCR');
      photogLat = hubCoords?.lat ?? KNOWN_HUBS['delhi'].lat;
      photogLng = hubCoords?.lng ?? KNOWN_HUBS['delhi'].lng;
    }

    // Resolve Venue Coordinates
    let venueLat: number | null = null;
    let venueLng: number | null = null;
    if (typeof locationLatitude === 'number' && typeof locationLongitude === 'number') {
      venueLat = locationLatitude;
      venueLng = locationLongitude;
    } else {
      const resolvedVenue = resolveCoordinatesFromText(eventLocation);
      venueLat = resolvedVenue?.lat ?? photogLat;
      venueLng = resolvedVenue?.lng ?? photogLng;
    }

    // Server-Authoritative Distance and Pricing Calculation
    const pricing = calculateAuthoritativePricing({
      basePackagePrice: agreedServicePrice,
      photographerCoords: { lat: photogLat, lng: photogLng },
      venueCoords: { lat: venueLat, lng: venueLng },
      photographerBaseAddress: creator.base_address || creator.city || 'Delhi NCR',
      customerEventAddress: eventLocation,
      travelSettings: {
        includedTravelKm: freeKm,
        travelFeePerKm: effectiveTravelRate,
        roundTripBilling: roundTrip,
        minTravelFee: creator.min_travel_fee !== null ? Number(creator.min_travel_fee) : DEFAULT_TRAVEL_SETTINGS.minTravelFee,
        maxTravelFee: creator.max_travel_fee !== null ? Number(creator.max_travel_fee) : null,
        serviceRadiusKm: creator.service_radius || DEFAULT_TRAVEL_SETTINGS.serviceRadiusKm,
        allowOutOfArea: creator.allow_out_of_area ?? true,
      },
      platformFeePercent: platformFeeRate,
      gstPercent: GST_PERCENT,
    });

    if (pricing.isOutOfArea && creator.allow_out_of_area === false) {
      return jsonError(
        400,
        `Venue is ${pricing.calculatedDistanceKm} km away, which exceeds the photographer's maximum allowed travel radius (${creator.service_radius} km).`
      );
    }

    const bookingRef = `INST-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const initialStatus = bookingType === 'instant' ? 'confirmed' : 'pending';

    const { data: created, error: insertErr } = await admin
      .from('bookings')
      .insert({
        booking_reference: bookingRef,
        customer_id: user.id,
        creator_id: creatorId,
        service_id: resolvedServiceId,
        event_title: eventTitle,
        event_date: eventDate,
        start_at: startTime,
        end_at: endTime,
        event_location: eventLocation,
        location_latitude: venueLat,
        location_longitude: venueLng,
        customer_notes: customerNotes,
        agreed_service_price: agreedServicePrice,
        travel_distance_km: pricing.calculatedDistanceKm,
        distance_method: pricing.distanceMethod,
        included_travel_km: pricing.includedTravelKm,
        chargeable_distance_km: pricing.chargeableDistanceKm,
        travel_rate_per_km: pricing.travelRatePerKm,
        travel_fee: pricing.travelFee,
        platform_fee: pricing.platformFee,
        taxes: pricing.taxes,
        discount_amount: pricing.discountAmount,
        total_amount: pricing.totalAmount,
        pricing_breakdown: pricing,
        currency: 'INR',
        booking_type: bookingType,
        booking_status: initialStatus,
        payment_status: 'unpaid',
      })
      .select()
      .single();

    if (insertErr || !created) {
      console.error('Booking insert failed:', insertErr?.message);
      return jsonError(500, 'Could not create the booking. Please try again.');
    }

    // Audit trail and escrow record.
    const { error: historyErr } = await admin.from('booking_status_history').insert({
      booking_id: created.id,
      previous_status: null,
      new_status: initialStatus,
      changed_by: user.id,
      change_reason: 'Booking requested by customer with authoritative distance pricing snapshot',
    });
    if (historyErr) console.error('Could not record booking history:', historyErr.message);

    const { error: payoutErr } = await admin.from('creator_payouts').insert({
      creator_id: creatorId,
      booking_id: created.id,
      gross_amount: agreedServicePrice + pricing.travelFee,
      platform_fee: pricing.platformFee,
      adjustment_amount: 0,
      net_amount: agreedServicePrice + pricing.travelFee - pricing.platformFee,
      payout_status: 'in_escrow',
    });
    if (payoutErr) console.error('Could not create escrow record:', payoutErr.message);

    // Fetch Photographer's User Profile for Notifications
    const { data: creatorUser } = await admin
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', creator.user_id)
      .maybeSingle();

    const { data: customerUser } = await admin
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    const customerName = customerUser?.full_name || user.email || 'Valued Client';
    const creatorName = creator.professional_name || creatorUser?.full_name || 'Photographer';

    // 1. In-App Notifications
    await createInAppNotification({
      userId: creator.user_id,
      type: 'booking_request',
      title: 'New Booking Request',
      body: `${customerName} requested a shoot "${eventTitle}" for ${eventDate} (${pricing.calculatedDistanceKm} km away). Total: ₹${pricing.totalAmount.toLocaleString('en-IN')}`,
      relatedBookingId: created.id,
      actionUrl: '/photographer/bookings',
      metadata: { bookingReference: bookingRef, distanceKm: pricing.calculatedDistanceKm },
    });

    await createInAppNotification({
      userId: user.id,
      type: 'booking_placed',
      title: 'Booking Request Placed',
      body: `Your shoot request with ${creatorName} for "${eventTitle}" on ${eventDate} is placed. Total Quoted: ₹${pricing.totalAmount.toLocaleString('en-IN')}`,
      relatedBookingId: created.id,
      actionUrl: '/customer/bookings',
      metadata: { bookingReference: bookingRef },
    });

    // 2. Transactional Email Notifications
    if (creatorUser?.email) {
      const email = EmailTemplates.bookingRequested(
        customerName,
        'creator',
        bookingRef,
        eventTitle,
        eventDate,
        startTime.split('T')[1]?.slice(0, 5) || '10:00',
        eventLocation,
        pricing.totalAmount,
        pricing.calculatedDistanceKm,
        pricing.travelFee
      );
      await sendPlatformEmail({
        to: { email: creatorUser.email, name: creatorName, userId: creatorUser.id },
        subject: email.subject,
        templateName: 'booking_requested_creator',
        eventType: 'booking.requested',
        html: email.html,
        relatedEntityId: created.id,
        idempotencyKey: `book_req_creator_${created.id}`,
      });
    }

    if (customerUser?.email) {
      const email = EmailTemplates.bookingRequested(
        customerName,
        'customer',
        bookingRef,
        eventTitle,
        eventDate,
        startTime.split('T')[1]?.slice(0, 5) || '10:00',
        eventLocation,
        pricing.totalAmount,
        pricing.calculatedDistanceKm,
        pricing.travelFee
      );
      await sendPlatformEmail({
        to: { email: customerUser.email, name: customerName, userId: customerUser.id },
        subject: email.subject,
        templateName: 'booking_requested_customer',
        eventType: 'booking.requested',
        html: email.html,
        relatedEntityId: created.id,
        idempotencyKey: `book_req_customer_${created.id}`,
      });
    }

    return NextResponse.json({
      success: true,
      booking: created,
      breakdown: {
        agreedServicePrice,
        travelDistanceKm: pricing.calculatedDistanceKm,
        distanceMethod: pricing.distanceMethod,
        includedTravelKm: pricing.includedTravelKm,
        chargeableDistanceKm: pricing.chargeableDistanceKm,
        travelFee: pricing.travelFee,
        platformFee: pricing.platformFee,
        taxes: pricing.taxes,
        totalAmount: pricing.totalAmount,
        currency: 'INR',
        serviceDurationMinutes: serviceDuration,
        snapshot: pricing,
      },
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    return jsonError(500, 'Internal server error processing booking.');
  }
}
