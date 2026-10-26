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
 * server from the creator's active service package and duration selection; client-supplied
 * amounts are ignored. The creator must be approved and the time window must not overlap
 * an existing accepted/confirmed/in-progress booking.
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
    durationHours: rawDurationHours,
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

  // Determine Duration
  let durationHours = rawDurationHours && Number(rawDurationHours) > 0 ? Number(rawDurationHours) : 2;
  const startTime = startAt || `${eventDate}T10:00:00Z`;
  let endTime = endAt;
  if (!endTime) {
    const startHour = Number(startTime.substring(11, 13)) || 10;
    const endHour = Math.min(23, startHour + durationHours);
    endTime = `${eventDate}T${endHour.toString().padStart(2, '0')}:00:00Z`;
  } else if (!rawDurationHours) {
    const parsedDiff = Math.round((Date.parse(endTime) - Date.parse(startTime)) / 3600000);
    if (parsedDiff > 0) durationHours = parsedDiff;
  }

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
    let basePackagePrice = 0;
    let serviceBaseHours = 2;
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
      basePackagePrice = Number(service.base_price);
      if (service.duration_minutes && service.duration_minutes > 0) {
        serviceBaseHours = Math.max(1, Math.round(service.duration_minutes / 60));
      }
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

    // Server-Authoritative Distance and Pricing Calculation with Duration Scaling
    const pricing = calculateAuthoritativePricing({
      basePackagePrice,
      durationHours,
      serviceBaseHours,
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
        duration_hours: durationHours,
        start_at: startTime,
        end_at: endTime,
        event_location: eventLocation,
        location_latitude: venueLat,
        location_longitude: venueLng,
        customer_notes: customerNotes,
        agreed_service_price: pricing.serviceSubtotal,
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
      change_reason: 'Booking requested by customer with authoritative distance and duration pricing snapshot',
    });
    if (historyErr) console.error('Could not record booking history:', historyErr.message);

    // Note: Escrow payouts are allocated dynamically upon verified payment in /api/payments/verify
    // and payment webhooks, ensuring unpaid bookings never register premature in_escrow liabilities.

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
      body: `${customerName} requested a ${durationHours}-hour shoot "${eventTitle}" for ${eventDate}. Agreed: ₹${pricing.serviceSubtotal.toLocaleString('en-IN')}, Total: ₹${pricing.totalAmount.toLocaleString('en-IN')}`,
      relatedBookingId: created.id,
      actionUrl: '/photographer/bookings',
      metadata: { bookingReference: bookingRef, distanceKm: pricing.calculatedDistanceKm, durationHours },
    });

    await createInAppNotification({
      userId: user.id,
      type: 'booking_placed',
      title: 'Booking Request Placed',
      body: `Your ${durationHours}-hour shoot request with ${creatorName} for "${eventTitle}" on ${eventDate} is placed. Total Quoted: ₹${pricing.totalAmount.toLocaleString('en-IN')}`,
      relatedBookingId: created.id,
      actionUrl: '/customer/bookings',
      metadata: { bookingReference: bookingRef, durationHours },
    });

    // 2. Email Notifications (Non-blocking)
    if (creatorUser?.email) {
      const creatorTmpl = EmailTemplates.bookingRequested(
        customerName,
        'creator',
        bookingRef,
        eventTitle,
        eventDate,
        startTime,
        eventLocation,
        pricing.totalAmount,
        pricing.calculatedDistanceKm,
        pricing.travelFee
      );
      sendPlatformEmail({
        to: { email: creatorUser.email, name: creatorName, userId: creator.user_id },
        subject: creatorTmpl.subject,
        templateName: 'booking_request_creator',
        eventType: 'booking.created',
        html: creatorTmpl.html,
        relatedEntityId: created.id,
      }).catch((e) => console.error('Failed to email creator for new booking:', e));
    }

    if (customerUser?.email) {
      const customerTmpl = EmailTemplates.bookingRequested(
        customerName,
        'customer',
        bookingRef,
        eventTitle,
        eventDate,
        startTime,
        eventLocation,
        pricing.totalAmount,
        pricing.calculatedDistanceKm,
        pricing.travelFee
      );
      sendPlatformEmail({
        to: { email: customerUser.email, name: customerName, userId: user.id },
        subject: customerTmpl.subject,
        templateName: 'booking_created_customer',
        eventType: 'booking.created',
        html: customerTmpl.html,
        relatedEntityId: created.id,
      }).catch((e) => console.error('Failed to email customer for new booking:', e));
    }

    return NextResponse.json(
      {
        success: true,
        booking: created,
        pricingSnapshot: pricing,
        message: 'Booking request placed successfully with authoritative duration and pricing snapshot.',
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Unhandled booking creation error:', err);
    return jsonError(500, err.message || 'Internal server error while placing booking.');
  }
}
