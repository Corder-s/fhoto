import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';
import { cleanText, isUuid } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

/**
 * Administrative booking management. Every handler requires an active account
 * with the 'admin' role; the acting admin is taken from the session, never from the body.
 */
export async function GET(req: NextRequest) {
  const auth = await authorize({ roles: ['admin', 'owner'], permission: 'manage_bookings' });
  if (!auth.ok) return auth.response;
  const { admin } = auth;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = admin
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
        cancellation_reason,
        created_at,
        payments:payments!booking_id (
          id,
          provider,
          provider_payment_id,
          provider_order_id,
          amount,
          currency,
          payment_status,
          payment_mode,
          installment_number,
          paid_at,
          created_at
        ),
        customer:profiles!customer_id (
          id,
          full_name,
          email,
          phone_number,
          avatar_url
        ),
        creator:creator_profiles!creator_id (
          id,
          professional_name,
          city,
          average_rating,
          user:profiles!user_id (
            id,
            full_name,
            phone_number,
            email,
            avatar_url
          )
        ),
        service:creator_services!service_id (
          id,
          title,
          duration_minutes
        )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'ALL') {
      if (status === 'CANCELLATION_REQUESTED') {
        query = query.eq('booking_status', 'disputed');
      } else {
        query = query.eq('booking_status', status.toLowerCase());
      }
    }

    const { data: bookings, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    let filtered = bookings || [];
    if (search && search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((b: any) =>
        b.booking_reference?.toLowerCase().includes(q) ||
        b.customer?.full_name?.toLowerCase().includes(q) ||
        b.creator?.professional_name?.toLowerCase().includes(q) ||
        b.event_location?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, bookings: filtered });
  } catch (err) {
    console.error('Admin bookings GET failed:', err);
    return jsonError(500, 'Could not load bookings.');
  }
}

/**
 * PATCH /api/admin/bookings
 * Body: { bookingId, action: 'resolve_cancellation' | 'force_cancel' | 'force_confirm', decision?, adminNotes? }
 */
export async function PATCH(req: NextRequest) {
  const auth = await authorize({ roles: ['admin', 'owner'], permission: 'manage_bookings' });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid JSON payload.');
  }

  const { bookingId, action, decision } = body;
  const adminNotes = cleanText(body.adminNotes, 500);

  if (!bookingId || !action) {
    return NextResponse.json({ success: false, error: 'Missing bookingId or action' }, { status: 400 });
  }
  if (!isUuid(bookingId)) {
    return jsonError(400, 'Invalid bookingId.');
  }

  try {
    const { data: currentBooking, error: fetchErr } = await admin
      .from('bookings')
      .select('id, booking_status, cancellation_reason')
      .eq('id', bookingId)
      .maybeSingle();

    if (fetchErr || !currentBooking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    let targetStatus: string = currentBooking.booking_status;
    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
    let historyReason = '';

    if (action === 'resolve_cancellation') {
      if (currentBooking.booking_status !== 'disputed') {
        return jsonError(409, 'Only bookings with a pending cancellation request can be resolved.');
      }
      if (decision === 'approve') {
        targetStatus = 'cancelled';
        updateFields.booking_status = targetStatus;
        updateFields.cancellation_reason = `Admin Approved Cancellation: ${adminNotes || 'Photographer emergency accepted'}`;
        updateFields.payment_status = 'refunded';
        historyReason = `Admin approved photographer cancellation: ${adminNotes || 'Emergency accepted'}`;
      } else if (decision === 'reject') {
        targetStatus = 'confirmed';
        updateFields.booking_status = targetStatus;
        historyReason = `Admin rejected photographer cancellation request: ${adminNotes || 'Photographer must fulfill commitment'}`;
      } else {
        return jsonError(400, 'decision must be "approve" or "reject".');
      }
    } else if (action === 'force_cancel') {
      targetStatus = 'cancelled';
      updateFields.booking_status = targetStatus;
      updateFields.cancellation_reason = `Administrative Override: ${adminNotes || 'Cancelled by Admin Operations'}`;
      updateFields.payment_status = 'refunded';
      historyReason = `Admin forcefully cancelled booking: ${adminNotes || 'Administrative discretion'}`;
    } else if (action === 'force_confirm') {
      targetStatus = 'confirmed';
      updateFields.booking_status = targetStatus;
      historyReason = `Admin forcefully confirmed booking: ${adminNotes || 'Admin override'}`;
    } else {
      return jsonError(400, `Unknown action: ${action}`);
    }

    const { data: updated, error: updateErr } = await admin
      .from('bookings')
      .update(updateFields)
      .eq('id', bookingId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    const { error: historyErr } = await admin.from('booking_status_history').insert({
      booking_id: bookingId,
      previous_status: currentBooking.booking_status,
      new_status: targetStatus,
      changed_by: user.id,
      change_reason: historyReason,
    });
    if (historyErr) console.error('Could not record admin history:', historyErr.message);

    return NextResponse.json({ success: true, booking: updated });
  } catch (err) {
    console.error('Admin bookings PATCH failed:', err);
    return jsonError(500, 'Could not update booking.');
  }
}
