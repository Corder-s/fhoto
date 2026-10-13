import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';
import { cleanText, isUuid, matchesSessionUser } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/create-intent
 * Creates (or returns, idempotently) a payment for a booking owned by the caller.
 * The amount is always the booking's stored total. Without live gateway credentials
 * a clearly labelled development sandbox payment is created; live gateway order
 * creation is not implemented in this build and returns 501 rather than a fake order.
 */
export async function POST(request: NextRequest) {
  const auth = await authorize({ roles: ['customer'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON payload.');
  }

  const { bookingId } = body;
  const idempotencyKey = cleanText(body.idempotencyKey, 120);
  if (!bookingId || !idempotencyKey) return jsonError(400, 'Missing bookingId or idempotencyKey.');
  if (!isUuid(bookingId)) return jsonError(400, 'Invalid bookingId.');
  if (!matchesSessionUser(user.id, body.customerId)) {
    return jsonError(403, 'You can only pay for your own bookings.');
  }

  const paymentSecret = process.env.PAYMENT_PROVIDER_SECRET_KEY;
  const isGatewayConfigured = Boolean(paymentSecret && !paymentSecret.includes('placeholder'));

  const { data: booking, error: bErr } = await admin
    .from('bookings')
    .select('id, customer_id, total_amount, booking_status, payment_status')
    .eq('id', bookingId)
    .maybeSingle();

  if (bErr) return jsonError(500, 'Could not load booking.');
  if (!booking || booking.customer_id !== user.id) return jsonError(404, 'Booking not found.');
  if (booking.booking_status === 'cancelled' || booking.booking_status === 'rejected') {
    return jsonError(409, 'This booking is no longer payable.');
  }
  if (booking.payment_status === 'paid') {
    return jsonError(409, 'This booking has already been paid.');
  }

  const { data: existingPayment } = await admin
    .from('payments')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (existingPayment) {
    if (existingPayment.booking_id !== bookingId) {
      return jsonError(409, 'Idempotency key already used for another booking.');
    }
    return NextResponse.json({
      success: true,
      paymentId: existingPayment.provider_payment_id,
      idempotencyKey,
      amount: existingPayment.amount,
      status: existingPayment.payment_status,
      message: 'Existing payment intent retrieved (Idempotent response).',
      isSandbox: existingPayment.provider === 'dev_sandbox',
    });
  }

  const totalAmount = Number(booking.total_amount);

  if (isGatewayConfigured) {
    return jsonError(
      501,
      'Live payment gateway order creation is not implemented in this build. Configure the sandbox or complete the gateway integration.'
    );
  }

  const sandboxPaymentId = `pay_dev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const { error: insertErr } = await admin.from('payments').insert({
    booking_id: bookingId,
    customer_id: user.id,
    provider: 'dev_sandbox',
    provider_payment_id: sandboxPaymentId,
    idempotency_key: idempotencyKey,
    amount: totalAmount,
    currency: 'INR',
    payment_status: 'pending',
    payment_method: 'sandbox_test_card',
  });
  if (insertErr) return jsonError(500, 'Could not create the payment record.');

  return NextResponse.json({
    success: true,
    paymentId: sandboxPaymentId,
    idempotencyKey,
    amount: totalAmount,
    currency: 'INR',
    isSandbox: true,
    notice:
      'DEVELOPMENT SANDBOX ENVIRONMENT: No live payment gateway credentials configured in PAYMENT_PROVIDER_SECRET_KEY. Test transaction initialized.',
  });
}
