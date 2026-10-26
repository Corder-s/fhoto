import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';
import { isUuid } from '@/lib/server/policy';
import { verifyPaymentSignature } from '@/lib/server/payment';
import { createInAppNotification } from '@/lib/server/notifications';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/verify
 * Cryptographically verifies Razorpay payment signature on the server, updates
 * payment and booking records, and secures creator escrow funds.
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

  const {
    bookingId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
    paymentId,
    signature,
  } = body;

  const targetOrderId = razorpay_order_id || orderId;
  const targetPaymentId = razorpay_payment_id || paymentId;
  const targetSignature = razorpay_signature || signature;

  if (!bookingId || !targetOrderId || !targetPaymentId || !targetSignature) {
    return jsonError(400, 'Missing payment verification credentials (bookingId, orderId, paymentId, or signature).');
  }

  if (!isUuid(bookingId)) {
    return jsonError(400, 'Invalid bookingId.');
  }

  try {
    // 1. Fetch and authenticate booking ownership
    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .select(`
        id,
        booking_reference,
        customer_id,
        creator_id,
        event_title,
        event_date,
        total_amount,
        platform_fee,
        booking_status,
        payment_status
      `)
      .eq('id', bookingId)
      .maybeSingle();

    if (bErr || !booking) return jsonError(404, 'Booking not found.');
    if (booking.customer_id !== user.id) {
      return jsonError(403, 'You are not authorized to verify payments for this booking.');
    }

    // 2. Cryptographic signature verification
    const verification = verifyPaymentSignature({
      orderId: targetOrderId,
      paymentId: targetPaymentId,
      signature: targetSignature,
    });

    if (!verification.isValid) {
      console.error('[Payment Verification Failed]', verification.error, { targetOrderId, targetPaymentId });
      return jsonError(400, verification.error || 'Payment signature verification failed.');
    }

    const now = new Date().toISOString();

    // 3. Find payment record and update payment state
    const { data: existingPayment } = await admin
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .or(`provider_order_id.eq.${targetOrderId},provider_payment_id.eq.${targetPaymentId}`)
      .maybeSingle();

    if (existingPayment) {
      await admin
        .from('payments')
        .update({
          payment_status: 'paid',
          provider_payment_id: targetPaymentId,
          signature: targetSignature,
          paid_at: now,
          updated_at: now,
        })
        .eq('id', existingPayment.id);
    } else {
      await admin.from('payments').insert({
        booking_id: bookingId,
        customer_id: user.id,
        provider: targetOrderId.startsWith('order_dev_') ? 'dev_sandbox' : 'razorpay',
        provider_order_id: targetOrderId,
        provider_payment_id: targetPaymentId,
        signature: targetSignature,
        idempotency_key: `pay_ver_${targetPaymentId}`,
        amount: Number(booking.total_amount),
        currency: 'INR',
        payment_status: 'paid',
        payment_method: targetOrderId.startsWith('order_dev_') ? 'dev_sandbox' : 'razorpay_standard',
        paid_at: now,
      });
    }

    // 4. Update booking state: payment_status = 'paid', booking_status = 'confirmed'
    const prevStatus = booking.booking_status;
    const nextStatus = 'confirmed';

    await admin
      .from('bookings')
      .update({
        payment_status: 'paid',
        booking_status: nextStatus,
        updated_at: now,
      })
      .eq('id', bookingId);

    if (prevStatus !== nextStatus) {
      await admin.from('booking_status_history').insert({
        booking_id: bookingId,
        previous_status: prevStatus,
        new_status: nextStatus,
        changed_by: user.id,
        change_reason: `Payment verified via ${targetOrderId.startsWith('order_dev_') ? 'Sandbox' : 'Razorpay Gateway'} (${targetPaymentId})`,
      });
    }

    // 5. Idempotent Creator Escrow Allocation
    const totalAmount = Number(booking.total_amount) || 0;
    const platformFee = Number(booking.platform_fee) || 0;
    const netAmount = Math.max(0, totalAmount - platformFee);

    const { data: existingPayout } = await admin
      .from('creator_payouts')
      .select('id')
      .eq('booking_id', booking.id)
      .maybeSingle();

    if (!existingPayout && booking.creator_id) {
      await admin.from('creator_payouts').insert({
        booking_id: booking.id,
        creator_id: booking.creator_id,
        gross_amount: totalAmount,
        platform_fee: platformFee,
        net_amount: netAmount,
        payout_status: 'in_escrow',
      });
    }

    // 6. Record System Audit Log
    await admin.from('system_logs').insert({
      category: 'PAYMENTS',
      level: 'SUCCESS',
      action: 'PAYMENT_CAPTURED_VERIFIED',
      actor: user.id,
      target: `booking:${booking.id}`,
      details: `Verified payment ${targetPaymentId} of ₹${totalAmount}. Escrow net ₹${netAmount} allocated.`,
      metadata: {
        orderId: targetOrderId,
        paymentId: targetPaymentId,
        totalAmount,
        netAmount,
      },
    });

    // 7. Dispatch In-App Notifications
    await createInAppNotification({
      userId: user.id,
      type: 'payment_success',
      title: 'Payment Secured in Escrow',
      body: `Your payment of ₹${totalAmount.toLocaleString('en-IN')} for "${booking.event_title}" is confirmed and safely held in REEPY Escrow.`,
      relatedBookingId: booking.id,
      actionUrl: '/customer/bookings',
      metadata: { bookingReference: booking.booking_reference, paymentId: targetPaymentId },
    });

    // Look up creator user_id to notify creator
    const { data: creatorProfile } = await admin
      .from('creator_profiles')
      .select('user_id, professional_name')
      .eq('id', booking.creator_id)
      .maybeSingle();

    if (creatorProfile?.user_id) {
      await createInAppNotification({
        userId: creatorProfile.user_id,
        type: 'booking_paid',
        title: 'Shoot Booking Payment Received',
        body: `Client payment of ₹${totalAmount.toLocaleString('en-IN')} is secured in escrow. Shoot is confirmed for ${booking.event_date}.`,
        relatedBookingId: booking.id,
        actionUrl: '/photographer/bookings',
        metadata: { bookingReference: booking.booking_reference, paymentId: targetPaymentId },
      });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      bookingId: booking.id,
      bookingStatus: nextStatus,
      paymentStatus: 'paid',
      orderId: targetOrderId,
      paymentId: targetPaymentId,
      amount: totalAmount,
      message: 'Payment verified and booking confirmed in escrow.',
    });
  } catch (err: any) {
    console.error('[verify] Exception during payment verification:', err);
    return jsonError(500, err?.message || 'Failed to verify payment signature.');
  }
}
