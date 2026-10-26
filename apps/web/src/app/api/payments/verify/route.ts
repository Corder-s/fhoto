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
        discount_amount,
        booking_status,
        payment_status,
        amount_paid,
        payment_mode,
        pricing_breakdown
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
      .eq('booking_id', booking.id)
      .or(`provider_order_id.eq.${targetOrderId},provider_payment_id.eq.${targetPaymentId}`)
      .maybeSingle();

    const paymentMode =
      existingPayment?.payment_mode ||
      existingPayment?.metadata?.paymentMode ||
      body.paymentMode ||
      'full';

    const totalAmount = Number(booking.total_amount) || 0;
    const prevPaid = Number(booking.amount_paid) || 0;

    let paidThisTxn = Number(existingPayment?.amount || body.amount || 0);
    let newTotalPaid = 0;
    let discountAmount = 0;
    let remainingDue = 0;
    let nextPaymentStatus: 'paid' | 'partially_paid' = 'paid';
    let unlockedPerks: string[] = [];

    if (paymentMode === 'full') {
      // Option A — Full Payment: 10% discount on eligible total
      // fullPaymentDiscount = eligibleBookingTotal * 10%
      // fullPaymentTotal = eligibleBookingTotal - fullPaymentDiscount
      discountAmount = Math.round(totalAmount * 0.10);
      const finalDiscountedTotal = Math.max(1, totalAmount - discountAmount);
      if (!paidThisTxn) paidThisTxn = finalDiscountedTotal;
      newTotalPaid = finalDiscountedTotal;
      remainingDue = 0;
      nextPaymentStatus = 'paid';
      unlockedPerks = [
        '10% Instant Prepayment Discount Applied',
        '⚡ Priority 48-Hour Rush Delivery',
        '📸 10 Extra Pro-Edited Photos Included',
        '🛡️ 100% REEPY Escrow Protection Guarantee',
        '🔄 1 Free Complimentary Reschedule'
      ];
    } else if (paymentMode === 'half') {
      // Option B — Half Payment: 5% discount on eligible total
      // halfPaymentDiscount = eligibleBookingTotal * 5%
      // halfPaymentTotal = eligibleBookingTotal - halfPaymentDiscount
      // firstInstallment = Math.round(halfPaymentTotal * 0.5)
      // secondInstallment = halfPaymentTotal - firstInstallment
      discountAmount = Math.round(totalAmount * 0.05);
      const halfTotal = totalAmount - discountAmount;
      const firstInstallment = Math.round(halfTotal * 0.5);
      const secondInstallment = halfTotal - firstInstallment;

      if (!paidThisTxn) paidThisTxn = firstInstallment;
      newTotalPaid = firstInstallment;
      remainingDue = secondInstallment;
      nextPaymentStatus = 'partially_paid';
      unlockedPerks = [];
    } else if (paymentMode === 'remaining') {
      // Second Installment of Half Payment
      // Preserve previously calculated 5% discount; do NOT apply discount a second time!
      discountAmount =
        Number(booking.discount_amount) ||
        (booking.pricing_breakdown?.paymentPlan?.discountAmount
          ? Number(booking.pricing_breakdown.paymentPlan.discountAmount)
          : Math.round(totalAmount * 0.05));
      const halfTotal = totalAmount - discountAmount;
      if (!paidThisTxn) paidThisTxn = Math.max(0, halfTotal - prevPaid);
      newTotalPaid = halfTotal;
      remainingDue = 0;
      nextPaymentStatus = 'paid';
      unlockedPerks = [];
    } else {
      // Fallback
      newTotalPaid = Math.min(totalAmount, prevPaid + paidThisTxn);
      nextPaymentStatus = newTotalPaid >= totalAmount ? 'paid' : 'partially_paid';
      remainingDue = Math.max(0, totalAmount - newTotalPaid);
    }

    const installmentNumber = paymentMode === 'remaining' ? 2 : 1;

    if (existingPayment) {
      await admin
        .from('payments')
        .update({
          payment_status: 'paid',
          provider_payment_id: targetPaymentId,
          signature: targetSignature,
          installment_number: installmentNumber,
          paid_at: now,
          updated_at: now,
        })
        .eq('id', existingPayment.id);
    } else {
      await admin.from('payments').insert({
        booking_id: booking.id,
        customer_id: user.id,
        provider: targetOrderId.startsWith('order_dev_') ? 'dev_sandbox' : 'razorpay',
        provider_order_id: targetOrderId,
        provider_payment_id: targetPaymentId,
        signature: targetSignature,
        idempotency_key: `pay_ver_${targetPaymentId}`,
        amount: paidThisTxn,
        currency: 'INR',
        payment_status: 'paid',
        payment_mode: paymentMode,
        installment_number: installmentNumber,
        payment_method: targetOrderId.startsWith('order_dev_') ? 'dev_sandbox' : 'razorpay_standard',
        paid_at: now,
      });
    }

    // 4. Update booking state: payment_status, amount_paid, payment_mode, pricing_breakdown snapshot
    const prevStatus = booking.booking_status;
    const nextStatus = 'confirmed';
    const prevBreakdown = (booking.pricing_breakdown as Record<string, any>) || {};

    const updatedPricingBreakdown = {
      ...prevBreakdown,
      paymentPlan: {
        selectedPlan: paymentMode === 'remaining' ? 'half' : paymentMode,
        eligibleBookingTotal: totalAmount,
        discountRatePercent: paymentMode === 'full' ? 10 : 5,
        discountAmount,
        finalDiscountedTotal: totalAmount - discountAmount,
        firstInstallment: paymentMode === 'full' ? totalAmount - discountAmount : Math.round((totalAmount - discountAmount) * 0.5),
        secondInstallment: paymentMode === 'full' ? 0 : (totalAmount - discountAmount) - Math.round((totalAmount - discountAmount) * 0.5),
        amountPaid: newTotalPaid,
        remainingDue,
        currency: 'INR',
        verifiedAt: now,
        lastPaymentId: targetPaymentId,
        lastOrderId: targetOrderId,
      },
    };

    await admin
      .from('bookings')
      .update({
        payment_status: nextPaymentStatus,
        amount_paid: newTotalPaid,
        discount_amount: discountAmount,
        payment_mode: paymentMode === 'remaining' ? 'half' : paymentMode,
        booking_status: nextStatus,
        unlocked_perks: unlockedPerks,
        pricing_breakdown: updatedPricingBreakdown,
        updated_at: now,
      })
      .eq('id', booking.id);

    if (prevStatus !== nextStatus) {
      await admin.from('booking_status_history').insert({
        booking_id: booking.id,
        previous_status: prevStatus,
        new_status: nextStatus,
        changed_by: user.id,
        change_reason: `Payment verified via ${targetOrderId.startsWith('order_dev_') ? 'Sandbox' : 'Razorpay Gateway'} (${targetPaymentId}) - Mode: ${paymentMode} - Paid: ₹${paidThisTxn}`,
      });
    }

    // 5. Idempotent Creator Escrow Allocation
    const platformFee = Number(booking.platform_fee) || 0;
    const feeToDeduct = nextPaymentStatus === 'paid' ? platformFee : Math.round(platformFee * (newTotalPaid / totalAmount));
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
          payout_status: 'in_escrow',
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
      details: `Verified payment ${targetPaymentId} of ₹${paidThisTxn} (Mode: ${paymentMode}). Escrow net ₹${netAmount} allocated. Cumulative Paid: ₹${newTotalPaid}/${totalAmount - discountAmount}.`,
      metadata: {
        orderId: targetOrderId,
        paymentId: targetPaymentId,
        eligibleBookingTotal: totalAmount,
        discountAmount,
        amountPaid: newTotalPaid,
        remainingDue,
        paymentMode,
        netAmount,
      },
    });

    // 7. Dispatch In-App Notifications
    const notificationTitle =
      paymentMode === 'full'
        ? 'Full Payment Secured in Escrow (10% Discount Applied)'
        : paymentMode === 'remaining'
        ? 'Final Installment Verified — Booking Fully Paid'
        : '50% Advance Deposit Secured in Escrow (5% Discount Applied)';

    const notificationBody =
      paymentMode === 'full'
        ? `Your full payment of ₹${paidThisTxn.toLocaleString('en-IN')} for "${booking.event_title}" is confirmed and safely held in REEPY Escrow. You saved 10% (₹${discountAmount.toLocaleString('en-IN')}) with VIP perks unlocked!`
        : paymentMode === 'remaining'
        ? `Your final installment of ₹${paidThisTxn.toLocaleString('en-IN')} for "${booking.event_title}" is verified. Booking is 100% paid in escrow!`
        : `Your 50% deposit of ₹${paidThisTxn.toLocaleString('en-IN')} for "${booking.event_title}" is secured in escrow (5% discount applied). Remaining ₹${remainingDue.toLocaleString('en-IN')} is due before shoot.`;

    await createInAppNotification({
      userId: user.id,
      type: 'payment_success',
      title: notificationTitle,
      body: notificationBody,
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
        title: nextPaymentStatus === 'paid' ? 'Shoot Fully Paid by Customer' : '50% Advance Deposit Received',
        body: nextPaymentStatus === 'paid'
          ? `Client payment of ₹${paidThisTxn.toLocaleString('en-IN')} is secured in escrow. Shoot is confirmed for ${booking.event_date}.`
          : `Client paid 50% advance deposit of ₹${paidThisTxn.toLocaleString('en-IN')} into escrow. Shoot is confirmed for ${booking.event_date}.`,
        relatedBookingId: booking.id,
        actionUrl: '/photographer/bookings',
        metadata: { bookingReference: booking.booking_reference, paymentId: targetPaymentId, paymentMode },
      });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      bookingId: booking.id,
      paymentStatus: nextPaymentStatus,
      amountPaid: newTotalPaid,
      totalAmount,
      discountAmount,
      finalDiscountedTotal: totalAmount - discountAmount,
      remainingDue,
      paymentMode,
      unlockedPerks,
      bookingStatus: nextStatus,
      orderId: targetOrderId,
      paymentId: targetPaymentId,
      message:
        nextPaymentStatus === 'paid'
          ? 'Payment verified successfully. Full booking confirmed and secured in escrow!'
          : '50% advance deposit verified. Booking confirmed! Remaining balance due before shoot.',
    });
  } catch (err: any) {
    console.error('[verify] Exception during payment verification:', err);
    return jsonError(500, err?.message || 'Failed to verify payment signature.');
  }
}
