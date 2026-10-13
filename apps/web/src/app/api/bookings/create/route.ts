import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';
import { cleanText, isApprovedCreator, isUuid, matchesSessionUser } from '@/lib/server/policy';

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
      .select('id, verification_status, is_available, user_id')
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

    const { data: feeSetting } = await admin
      .from('platform_fee_settings')
      .select('fee_value')
      .eq('is_active', true)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle();
    const platformFeeRate = feeSetting ? Number(feeSetting.fee_value) : DEFAULT_PLATFORM_FEE_PERCENT;

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

    // Server-authoritative financials.
    const platformFee = Math.round((agreedServicePrice * platformFeeRate) / 100);
    const taxes = Math.round((agreedServicePrice + platformFee) * (GST_PERCENT / 100));
    const discountAmount = 0;
    const totalAmount = agreedServicePrice + platformFee + taxes - discountAmount;
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
        location_latitude: typeof locationLatitude === 'number' ? locationLatitude : null,
        location_longitude: typeof locationLongitude === 'number' ? locationLongitude : null,
        customer_notes: customerNotes,
        agreed_service_price: agreedServicePrice,
        platform_fee: platformFee,
        taxes,
        discount_amount: discountAmount,
        total_amount: totalAmount,
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

    // Audit trail and escrow record. Failures here are logged; the booking itself is already persisted.
    const { error: historyErr } = await admin.from('booking_status_history').insert({
      booking_id: created.id,
      previous_status: null,
      new_status: initialStatus,
      changed_by: user.id,
      change_reason: 'Booking requested by customer',
    });
    if (historyErr) console.error('Could not record booking history:', historyErr.message);

    const { error: payoutErr } = await admin.from('creator_payouts').insert({
      creator_id: creatorId,
      booking_id: created.id,
      gross_amount: agreedServicePrice,
      platform_fee: platformFee,
      adjustment_amount: 0,
      net_amount: agreedServicePrice - platformFee,
      payout_status: 'in_escrow',
    });
    if (payoutErr) console.error('Could not create escrow record:', payoutErr.message);

    return NextResponse.json({
      success: true,
      booking: created,
      breakdown: {
        agreedServicePrice,
        platformFee,
        taxes,
        totalAmount,
        currency: 'INR',
        serviceDurationMinutes: serviceDuration,
      },
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    return jsonError(500, 'Internal server error processing booking.');
  }
}
