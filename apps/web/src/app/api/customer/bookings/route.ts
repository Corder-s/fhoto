import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';
import { canCustomerCancel, cleanText, matchesSessionUser } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

const BOOKING_LIST_SELECT = `
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
        distance_method,
        included_travel_km,
        chargeable_distance_km,
        travel_rate_per_km,
        travel_fee,
        platform_fee,
        taxes,
        discount_amount,
        total_amount,
        pricing_breakdown,
        booking_status,
        payment_status,
        customer_notes,
        cancellation_reason,
        created_at,
        creator:creator_profiles!creator_id (
          id,
          professional_name,
          city,
          average_rating,
          total_reviews,
          user:profiles!user_id (
            id,
            full_name,
            phone_number,
            avatar_url
          )
        ),
        service:creator_services!service_id (
          id,
          title,
          duration_minutes
        )
      `;

/**
 * GET /api/customer/bookings
 * Lists the authenticated customer's own bookings.
 */
export async function GET(req: NextRequest) {
  const auth = await authorize({ roles: ['customer'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const requested = new URL(req.url).searchParams.get('userId');
  if (!matchesSessionUser(user.id, requested)) {
    return jsonError(403, 'You can only view your own bookings.');
  }

  const { data: bookings, error } = await admin
    .from('bookings')
    .select(BOOKING_LIST_SELECT)
    .eq('customer_id', user.id)
    .order('event_date', { ascending: false });

  if (error) {
    console.error('Could not load customer bookings:', error.message);
    return jsonError(500, 'Could not load bookings.');
  }

  return NextResponse.json({ success: true, bookings: bookings || [] });
}

/**
 * PATCH /api/customer/bookings
 * Body: { bookingId, action: 'cancel', reason? }
 * Only the booking's customer may cancel, and only before the shoot has started.
 */
export async function PATCH(req: NextRequest) {
  const auth = await authorize({ roles: ['customer'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid JSON payload.');
  }

  const { bookingId, action } = body;
  if (!bookingId || !action) {
    return jsonError(400, 'Missing bookingId or action');
  }
  if (!matchesSessionUser(user.id, body.userId)) {
    return jsonError(403, 'Unauthorized to modify this booking');
  }

  const { data: booking, error: fetchErr } = await admin
    .from('bookings')
    .select('id, customer_id, booking_status')
    .eq('id', bookingId)
    .maybeSingle();

  if (fetchErr) return jsonError(500, 'Could not load booking.');
  // Same response for "not found" and "not yours" so IDs cannot be probed.
  if (!booking || booking.customer_id !== user.id) {
    return jsonError(404, 'Booking not found');
  }

  if (action !== 'cancel') {
    return jsonError(400, `Invalid action: ${action}`);
  }
  if (!canCustomerCancel(booking.booking_status)) {
    return jsonError(
      400,
      `Bookings in status "${booking.booking_status}" cannot be cancelled.`
    );
  }

  const reason = cleanText(body.reason, 500) || 'Customer request';
  const { data: updated, error: updateErr } = await admin
    .from('bookings')
    .update({
      booking_status: 'cancelled',
      cancellation_reason: `Customer cancelled booking: ${reason}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .eq('customer_id', user.id)
    .select()
    .single();

  if (updateErr || !updated) {
    console.error('Could not cancel booking:', updateErr?.message);
    return jsonError(500, 'Could not cancel the booking.');
  }

  const { error: historyErr } = await admin.from('booking_status_history').insert({
    booking_id: bookingId,
    previous_status: booking.booking_status,
    new_status: 'cancelled',
    changed_by: user.id,
    change_reason: `Customer cancelled booking: ${reason}`,
  });
  if (historyErr) console.error('Could not record cancellation history:', historyErr.message);

  return NextResponse.json({ success: true, booking: updated });
}
