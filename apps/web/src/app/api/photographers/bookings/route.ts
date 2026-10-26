import { NextRequest, NextResponse } from 'next/server';
import { authorize, getOwnCreatorProfile, jsonError } from '@/lib/server/session';
import { cleanText, isUuid, matchesSessionUser, photographerBookingAction } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/photographers/bookings
 * Lists bookings assigned to the authenticated photographer's own creator profile.
 * `creatorId` / `userId` parameters are accepted for compatibility but must belong to the caller.
 */
export async function GET(req: NextRequest) {
  const auth = await authorize({ roles: ['creator'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const { searchParams } = new URL(req.url);
  if (!matchesSessionUser(user.id, searchParams.get('userId'))) {
    return jsonError(403, 'You can only view your own bookings.');
  }

  const creator = await getOwnCreatorProfile(admin, user.id);
  if (!creator) return NextResponse.json({ success: true, bookings: [] });

  const requestedCreator = searchParams.get('creatorId');
  if (requestedCreator && requestedCreator !== creator.id) {
    return jsonError(403, 'You can only view bookings for your own studio.');
  }

  const { data: bookings, error } = await admin
    .from('bookings')
    .select(`

        id,
        booking_reference,
        event_title,
        event_date,
        duration_hours,
        start_at,
        end_at,
        event_location,
        agreed_service_price,
        travel_distance_km,
        travel_fee,
        platform_fee,
        taxes,
        total_amount,
        amount_paid,
        payment_mode,
        discount_amount,
        pricing_breakdown,
        booking_status,
        payment_status,
        customer_notes,
        created_at,
        customer:profiles!customer_id (
          id,
          full_name,
          email,
          phone_number,
          avatar_url
        ),
        service:creator_services!service_id (
          id,
          title,
          duration_minutes
        )
      `)
    .eq('creator_id', creator.id)
    .order('event_date', { ascending: false });

  if (error) {
    console.error('Could not load photographer bookings:', error.message);
    return jsonError(500, 'Could not load bookings.');
  }

  return NextResponse.json({ success: true, bookings: bookings || [] });
}

/**
 * PATCH /api/photographers/bookings
 * Body: { bookingId, action, reason?, newStatus? }
 * Allowed actions are defined in photographerBookingAction (lib/server/policy.ts).
 * A photographer can act only on bookings where booking.creator_id is their own studio.
 */
export async function PATCH(req: NextRequest) {
  const auth = await authorize({ roles: ['creator'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid JSON payload.');
  }

  const { bookingId, action, newStatus } = body;
  if (!bookingId || !action) {
    return jsonError(400, 'Missing bookingId or action');
  }
  if (!isUuid(bookingId)) return jsonError(400, 'Invalid bookingId.');
  if (!matchesSessionUser(user.id, body.userId)) {
    return jsonError(403, 'You can only manage your own bookings.');
  }

  const creator = await getOwnCreatorProfile(admin, user.id);
  if (!creator) return jsonError(403, 'Creator profile not found for this account.');
  if (creator.verification_status !== 'approved') {
    return jsonError(403, 'Your photographer account must be approved before managing bookings.');
  }

  const { data: currentBooking, error: fetchErr } = await admin
    .from('bookings')
    .select('id, booking_status, creator_id')
    .eq('id', bookingId)
    .maybeSingle();

  // Same answer for "missing" and "belongs to another photographer".
  if (fetchErr) return jsonError(500, 'Could not load booking.');
  if (!currentBooking || currentBooking.creator_id !== creator.id) {
    return jsonError(404, 'Booking not found');
  }

  const reason = cleanText(body.reason, 500) || undefined;
  const transition = photographerBookingAction(currentBooking.booking_status, action, newStatus, reason);
  if (!transition.ok) {
    return jsonError(transition.status, transition.error);
  }

  const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (transition.nextStatus) updateFields.booking_status = transition.nextStatus;
  if (action === 'decline' || action === 'reject') {
    updateFields.cancellation_reason = reason || 'Photographer unavailable for requested schedule';
  }
  if (action === 'request_cancellation') {
    updateFields.cancellation_reason = transition.historyReason;
  }

  const { data: updated, error: updateErr } = await admin
    .from('bookings')
    .update(updateFields)
    .eq('id', bookingId)
    .eq('creator_id', creator.id)
    .select()
    .single();

  if (updateErr || !updated) {
    console.error('Could not update booking:', updateErr?.message);
    return jsonError(500, 'Could not update the booking.');
  }

  // Milestones (on_the_way / arrived_at_venue) do not change booking_status, so the history
  // row records the previous status for both cases.
  const { error: historyErr } = await admin.from('booking_status_history').insert({
    booking_id: bookingId,
    previous_status: currentBooking.booking_status,
    new_status: transition.nextStatus || currentBooking.booking_status,
    changed_by: user.id,
    change_reason: transition.historyReason,
  });
  if (historyErr) console.error('Could not record status history:', historyErr.message);

  return NextResponse.json({ success: true, booking: updated, milestone: transition.milestone });
}
