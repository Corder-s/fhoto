import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';
import { cleanText, isUuid, matchesSessionUser } from '@/lib/server/policy';
import {
  createGatewayOrder,
  getRazorpayCredentials,
} from '@/lib/server/payment';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/create-intent
 * Creates (or returns, idempotently) a verified payment order for a booking owned by the caller.
 * The amount is always the booking's authoritative stored total_amount snapshot.
 *
 * If Razorpay keys are configured, creates an authentic Razorpay order via the orders API.
 * In development or when keys are unset, initializes a test sandbox order seamlessly.
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
  const rawIdempotency = body.idempotencyKey || `idem_${bookingId}_${Date.now()}`;
  const idempotencyKey = cleanText(rawIdempotency, 120);

  if (!bookingId) return jsonError(400, 'Missing required bookingId.');
  if (!isUuid(bookingId)) return jsonError(400, 'Invalid bookingId.');
  if (!matchesSessionUser(user.id, body.customerId)) {
    return jsonError(403, 'You can only initialize payments for your own bookings.');
  }

  try {
    // 1. Fetch authorized booking with authoritative pricing snapshot
    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .select(`
        id,
        booking_reference,
        customer_id,
        creator_id,
        event_title,
        event_date,
        duration_hours,
        total_amount,
        agreed_service_price,
        platform_fee,
        taxes,
        booking_status,
        payment_status,
        amount_paid,
        payment_mode
      `)
      .eq('id', bookingId)
      .maybeSingle();

    if (bErr) return jsonError(500, 'Could not load booking details.');
    if (!booking || booking.customer_id !== user.id) {
      return jsonError(404, 'Booking not found or not owned by caller.');
    }

    // 2. Validate eligibility
    if (booking.booking_status === 'cancelled' || booking.booking_status === 'rejected') {
      return jsonError(409, 'This shoot booking has been cancelled or rejected and is no longer payable.');
    }
    if (booking.payment_status === 'paid') {
      return jsonError(409, 'This booking has already been paid in full and secured in escrow.');
    }

    const totalAmount = Number(booking.total_amount);
    if (!totalAmount || totalAmount <= 0) {
      return jsonError(400, 'Invalid booking total amount for payment processing.');
    }

    const amountPaidSoFar = Number(booking.amount_paid) || 0;
    const requestedMode = body.paymentMode || 'full';
    const paymentMode = requestedMode === 'half' ? 'half' : (requestedMode === 'remaining' ? 'remaining' : 'full');

    let payableAmount = totalAmount;
    let discountApplied = 0;
    let remainingDue = 0;
    let unlockedPerks: string[] = [];

    if (paymentMode === 'half') {
      // 50% deposit now, remaining due on shoot day
      payableAmount = Math.round(totalAmount * 0.5);
      remainingDue = totalAmount - payableAmount;
    } else if (paymentMode === 'remaining') {
      // Paying remaining balance
      payableAmount = Math.max(0, totalAmount - amountPaidSoFar);
      remainingDue = 0;
    } else {
      // Full Payment (100%): 5% Instant Prepayment Discount + VIP Perks
      discountApplied = Math.round(totalAmount * 0.05);
      payableAmount = Math.max(1, totalAmount - discountApplied);
      remainingDue = 0;
      unlockedPerks = [
        '5% Instant Prepayment Discount Applied',
        '⚡ Priority 48-Hour Delivery',
        '📸 10 Extra Pro-Edited Photos',
        '🛡️ 100% Escrow Protection Guarantee',
        '🔄 1 Free Complimentary Reschedule'
      ];
    }

    const amountInPaise = Math.round(payableAmount * 100);
    const creds = getRazorpayCredentials();

    // 3. Check for existing pending payment with active order ID for same mode & amount
    const { data: existingPayment } = await admin
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('payment_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch customer profile for checkout prefill
    const { data: customerProfile } = await admin
      .from('profiles')
      .select('full_name, email, phone_number')
      .eq('id', user.id)
      .maybeSingle();

    const customerPrefill = {
      name: customerProfile?.full_name || 'Valued Customer',
      email: customerProfile?.email || user.email || 'customer@reepy.in',
      phone: customerProfile?.phone_number || '+91 98101 23456',
    };

    if (
      existingPayment &&
      existingPayment.provider_order_id &&
      Number(existingPayment.amount) === payableAmount &&
      existingPayment.payment_mode === paymentMode
    ) {
      return NextResponse.json({
        success: true,
        orderId: existingPayment.provider_order_id,
        paymentRecordId: existingPayment.id,
        keyId: creds.keyId || 'rzp_test_sandbox_mode',
        amount: amountInPaise,
        amountInr: payableAmount,
        currency: 'INR',
        paymentMode,
        discountApplied,
        remainingDue,
        unlockedPerks,
        booking: {
          id: booking.id,
          bookingReference: booking.booking_reference,
          title: booking.event_title,
          totalAmount,
          payableAmount,
        },
        customer: customerPrefill,
        isSandbox: existingPayment.provider === 'dev_sandbox',
        provider: existingPayment.provider,
        message: 'Active payment order retrieved.',
      });
    }

    // 4. Create new Order with Gateway or Sandbox
    const receiptRef = (booking.booking_reference || booking.id.substring(0, 8)).toUpperCase();
    const gatewayOrder = await createGatewayOrder({
      amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${receiptRef}_${paymentMode}`,
      notes: {
        booking_id: booking.id,
        customer_id: user.id,
        booking_reference: booking.booking_reference || booking.id,
        event_title: booking.event_title || 'Shoot Booking',
        payment_mode: paymentMode,
        discount_applied: String(discountApplied),
        payable_amount: String(payableAmount),
      },
    });

    // 5. Persist Payment Intent Record
    const { data: insertedPayment, error: insertErr } = await admin
      .from('payments')
      .insert({
        booking_id: bookingId,
        customer_id: user.id,
        provider: gatewayOrder.provider,
        provider_order_id: gatewayOrder.orderId,
        idempotency_key: idempotencyKey,
        amount: payableAmount,
        currency: 'INR',
        payment_status: 'pending',
        payment_mode: paymentMode,
        payment_method: gatewayOrder.isSandbox ? 'dev_sandbox' : 'razorpay_standard',
        metadata: {
          orderId: gatewayOrder.orderId,
          isSandbox: gatewayOrder.isSandbox,
          bookingReference: booking.booking_reference,
          paymentMode,
          discountApplied,
          remainingDue,
          unlockedPerks,
          rawGatewayResponse: gatewayOrder.rawResponse || null,
        },
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('[create-intent] Failed to record payment intent:', insertErr);
      return jsonError(500, 'Could not persist payment record.');
    }

    return NextResponse.json({
      success: true,
      orderId: gatewayOrder.orderId,
      paymentRecordId: insertedPayment.id,
      keyId: creds.keyId || 'rzp_test_sandbox_mode',
      amount: amountInPaise,
      amountInr: payableAmount,
      currency: 'INR',
      paymentMode,
      discountApplied,
      remainingDue,
      unlockedPerks,
      booking: {
        id: booking.id,
        bookingReference: booking.booking_reference,
        title: booking.event_title,
        totalAmount,
        payableAmount,
      },
      customer: customerPrefill,
      isSandbox: gatewayOrder.isSandbox,
      provider: gatewayOrder.provider,
      message: 'New payment order created successfully.',
    });
  } catch (err: any) {
    console.error('[create-intent] Error creating payment order:', err);
    return jsonError(500, err?.message || 'Failed to create payment order.');
  }
}
