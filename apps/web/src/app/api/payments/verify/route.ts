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
        payment_status,
        amount_paid,
        payment_mode
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

    // 4. Update booking state: payment_status, amount_paid, payment_mode, and unlocked_perks
    const paymentMode =
      existingPayment?.payment_mode ||
      existingPayment?.metadata?.paymentMode ||
      body.paymentMode ||
      'full';

    const paidThisTxn = Number(existingPayment?.amount || body.amount || booking.total_amount);
    const prevPaid = Number(booking.amount_paid) || 0;
    const totalAmount = Number(booking.total_amount) || 0;
    const newTotalPaid = Math.min(totalAmount, prevPaid + paidThisTxn);

    const isFullyPaid =
      paymentMode === 'full' ||
      paymentMode === 'remaining' ||
      newTotalPaid >= totalAmount;

    const nextPaymentStatus = isFullyPaid ? 'paid' : 'partially_paid';
    const unlockedPerks = isFullyPaid && paymentMode === 'full' ? [
      '5% Instant Prepayment Discount Applied',
      '⚡ Priority 48-Hour Delivery',
      '📸 10 Extra Pro-Edited Photos',
      '🛡️ 100% Escrow Protection Guarantee',
      '🔄 1 Free Complimentary Reschedule'
    ] : [];

    const prevStatus = booking.booking_status;
    const nextStatus = 'confirmed';

    await admin
      .from('bookings')
      .update({
        payment_status: nextPaymentStatus,
        amount_paid: newTotalPaid,
        payment_mode: paymentMode,
        booking_status: nextStatus,
        unlocked_perks: unlockedPerks,
        updated_at: now,
      })
      .eq('id', bookingId);

    if (prevStatus !== nextStatus) {
      await admin.from('booking_status_history').insert({
        booking_id: bookingId,
        previous_status: prevStatus,
        new_status: nextStatus,
        changed_by: user.id,
        change_reason: `Payment verified via ${targetOrderId.startsWith('order_dev_') ? 'Sandbox' : 'Razorpay Gateway'} (${targetPaymentId}) - Mode: ${paymentMode}`,
      });
    }

    // 5. Idempotent Creator Escrow Allocation
    const platformFee = Number(booking.platform_fee) || 0;
    const feeToDeduct = isFullyPaid ? platformFee : Math.round(platformFee * (newTotalPaid / totalAmount));
    const netAmount = Math.max(0, newTotalPaid - feeToDeduct);

    const { data: existingPayout } = await admin
      .from('creator_payouts')
      .select('id')
      .eq('booking_id', booking.id)
      .maybeSingle();

    if (existingPayout) {
      await admin
        .from('creator_payouts')
        .update({
          gross_amount: newTotalPaid,
          platform_fee: feeToDeduct,
          net_amount: netAmount,
          updated_at: now,
        })
        .eq('id', existingPayout.id);
    } else if (booking.creator_id) {
      await admin.from('creator_payouts').insert({
        booking_id: booking.id,
        creator_id: booking.creator_id,
        gross_amount: newTotalPaid,
        platform_fee: feeToDeduct,
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
      details: `Verified payment ${targetPaymentId} of ₹${paidThisTxn} (Mode: ${paymentMode}). Escrow net ₹${netAmount} allocated. Total Paid: ₹${newTotalPaid}/${totalAmount}.`,
      metadata: {
        orderId: targetOrderId,
        paymentId: targetPaymentId,
        totalAmount,
        amountPaid: newTotalPaid,
        paymentMode,
        netAmount,
      },
    });

    // 7. Dispatch In-App Notifications
    await createInAppNotification({
      userId: user.id,
      type: 'payment_success',
      title: isFullyPaid ? 'Full Payment Secured in Escrow' : '50% Advance Deposit Received',
      body: isFullyPaid
        ? `Your full payment of ₹${paidThisTxn.toLocaleString('en-IN')} for "${booking.event_title}" is confirmed and safely held in REEPY Escrow. VIP perks unlocked!`
        : `Your 50% deposit of ₹${paidThisTxn.toLocaleString('en-IN')} for "${booking.event_title}" is confirmed in escrow. Remaining ₹${Math.max(0, totalAmount - newTotalPaid).toLocaleString('en-IN')} due at shoot.`,
      relatedBookingId: booking.id,
      actionUrl: '/customer/bookings',
      metadata: { bookingReference: booking.booking_reference, paymentId: targetPaymentId, paymentMode },
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
        title: isFullyPaid ? 'Shoot Fully Paid by Customer' : '50% Advance Deposit Received',
        body: isFullyPaid
          ? `Client full payment of ₹${paidThisTxn.toLocaleString('en-IN')} is secured in escrow. Shoot is confirmed for ${booking.event_date}.`
          : `Client paid 50% advance deposit of ₹${paidThisTxn.toLocaleString('en-IN')} into escrow. Shoot is confirmed for ${booking.event_date}.`,
        relatedBookingId: booking.id,
        actionUrl: '/photographer/bookings',
        metadata: { bookingReference: booking.booking_reference, paymentId: targetPaymentId, paymentMode },
      });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      bookingId,
      paymentStatus: nextPaymentStatus,
      amountPaid: newTotalPaid,
      totalAmount,
      remainingDue: Math.max(0, totalAmount - newTotalPaid),
      paymentMode,
      unlockedPerks,
      bookingStatus: nextStatus,
      orderId: targetOrderId,
      paymentId: targetPaymentId,
      message: isFullyPaid
        ? 'Payment verified successfully. Full booking confirmed and VIP perks unlocked!'
        : '50% advance deposit verified. Booking confirmed! Remaining balance due at shoot.',
    });
  } catch (err: any) {
    console.error('[verify] Exception during payment verification:', err);
    return jsonError(500, err?.message || 'Failed to verify payment signature.');
  }
}
