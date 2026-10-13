import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';
import { isUuid } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/confirm-sandbox
 * Body: { paymentId, bookingId }
 *
 * Development sandbox only. Confirms a 'dev_sandbox' payment for a booking owned
 * by the caller (or any booking for an admin). Disabled entirely when live gateway
 * credentials are configured, where payment confirmation must come from the gateway webhook.
 */
export async function POST(request: NextRequest) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const paymentSecret = process.env.PAYMENT_PROVIDER_SECRET_KEY;
  const isGatewayConfigured = Boolean(paymentSecret && !paymentSecret.includes('placeholder'));
  if (isGatewayConfigured) {
    return jsonError(403, 'Manual sandbox confirmation is disabled when a live gateway is configured.');
  }

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON payload.');
  }
  const { paymentId, bookingId } = body;
  if (!paymentId || !bookingId) return jsonError(400, 'Missing paymentId or bookingId.');
  if (!isUuid(bookingId)) return jsonError(400, 'Invalid bookingId.');

  try {
    const { data: booking } = await admin
      .from('bookings')
      .select('id, customer_id, booking_status')
      .eq('id', bookingId)
      .maybeSingle();
    if (!booking || (booking.customer_id !== user.id && !user.roles.includes('admin'))) {
      return jsonError(404, 'Payment intent record not found.');
    }

    const { data: payment, error: pErr } = await admin
      .from('payments')
      .select('*')
      .eq('provider_payment_id', paymentId)
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (pErr || !payment) return jsonError(404, 'Payment intent record not found.');
    if (payment.provider !== 'dev_sandbox') {
      return jsonError(403, 'Cannot manually confirm a non-sandbox payment. Webhook verification required.');
    }
    if (payment.payment_status === 'paid') {
      return NextResponse.json({ success: true, message: 'Sandbox payment already confirmed.', bookingId, paymentId, status: 'confirmed' });
    }

    const now = new Date().toISOString();
    const { error: payErr } = await admin
      .from('payments')
      .update({ payment_status: 'paid', paid_at: now, updated_at: now })
      .eq('id', payment.id);
    if (payErr) return jsonError(500, 'Could not record the payment.');

    // A paid booking is confirmed only if the photographer has not already declined or cancelled it.
    const nextStatus = booking.booking_status === 'pending' ? 'confirmed' : booking.booking_status;
    const { error: bookErr } = await admin
      .from('bookings')
      .update({ payment_status: 'paid', booking_status: nextStatus, updated_at: now })
      .eq('id', bookingId);
    if (bookErr) return jsonError(500, 'Could not update the booking.');

    if (nextStatus !== booking.booking_status) {
      await admin.from('booking_status_history').insert({
        booking_id: bookingId,
        previous_status: booking.booking_status,
        new_status: nextStatus,
        changed_by: user.id,
        change_reason: 'Sandbox payment successfully completed and verified',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Sandbox payment verified and booking confirmed.',
      bookingId,
      paymentId,
      status: nextStatus,
    });
  } catch (err) {
    console.error('Error confirming sandbox payment:', err);
    return jsonError(500, 'Failed to confirm sandbox payment.');
  }
}
