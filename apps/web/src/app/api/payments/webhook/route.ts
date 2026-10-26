import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyWebhookSignature } from '@/lib/server/payment';
import { createInAppNotification } from '@/lib/server/notifications';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/webhook
 * Server-side payment gateway webhook handler for Razorpay.
 * Verifies gateway signature (HMAC SHA-256 via x-razorpay-signature)
 * and idempotently processes payment, failure & refund events.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || req.headers.get('x-webhook-signature');

  // Verify HMAC signature
  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid && signature) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }

  let event: Record<string, any>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const eventType = event.event || event.type || 'payment.captured';
  const paymentEntity = event.payload?.payment?.entity || event.data?.object || event;
  const orderEntity = event.payload?.order?.entity;

  const providerPaymentId = paymentEntity?.id || paymentEntity?.payment_id;
  const providerOrderId = paymentEntity?.order_id || orderEntity?.id;
  const bookingId =
    paymentEntity?.notes?.booking_id ||
    orderEntity?.notes?.booking_id ||
    event.booking_id;

  if (!providerPaymentId && !providerOrderId) {
    return NextResponse.json({ received: true, message: 'Event ignored: no payment or order identifiers.' });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable.' }, { status: 500 });
  }

  try {
    // 1. Payment Captured / Order Paid / Succeeded
    if (eventType === 'payment.captured' || eventType === 'order.paid' || eventType === 'charge.succeeded') {
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .or(`provider_payment_id.eq.${providerPaymentId},provider_order_id.eq.${providerOrderId}`)
        .maybeSingle();

      if (existingPayment && existingPayment.payment_status === 'paid') {
        return NextResponse.json({ received: true, status: 'already_processed' });
      }

      const now = new Date().toISOString();

      if (existingPayment) {
        await supabase
          .from('payments')
          .update({
            payment_status: 'paid',
            provider_payment_id: providerPaymentId || existingPayment.provider_payment_id,
            paid_at: now,
            updated_at: now,
          })
          .eq('id', existingPayment.id);
      }

      const targetBookingId = bookingId || existingPayment?.booking_id;
      if (targetBookingId) {
        const { data: booking } = await supabase
          .from('bookings')
          .select('id, total_amount, platform_fee, discount_amount, creator_id, customer_id, event_title, booking_reference, amount_paid, payment_mode, pricing_breakdown')
          .eq('id', targetBookingId)
          .maybeSingle();

        if (booking) {
          const paymentMode = existingPayment?.payment_mode || existingPayment?.metadata?.paymentMode || 'full';
          const totalAmount = Number(booking.total_amount) || 0;
          const paidThisTxn = Number(existingPayment?.amount || paymentEntity?.amount ? Number(paymentEntity.amount) / 100 : 0);
          const prevPaid = Number(booking.amount_paid) || 0;

          let newTotalPaid = 0;
          let discountAmount = 0;
          let remainingDue = 0;
          let nextPaymentStatus: 'paid' | 'partially_paid' = 'paid';

          if (paymentMode === 'full') {
            discountAmount = Math.round(totalAmount * 0.10);
            newTotalPaid = Math.max(1, totalAmount - discountAmount);
            remainingDue = 0;
            nextPaymentStatus = 'paid';
          } else if (paymentMode === 'half') {
            discountAmount = Math.round(totalAmount * 0.05);
            const halfTotal = totalAmount - discountAmount;
            const firstInstallment = Math.round(halfTotal * 0.5);
            newTotalPaid = firstInstallment;
            remainingDue = halfTotal - firstInstallment;
            nextPaymentStatus = 'partially_paid';
          } else if (paymentMode === 'remaining') {
            discountAmount = Number(booking.discount_amount) || Math.round(totalAmount * 0.05);
            newTotalPaid = totalAmount - discountAmount;
            remainingDue = 0;
            nextPaymentStatus = 'paid';
          } else {
            newTotalPaid = Math.min(totalAmount, prevPaid + paidThisTxn);
            nextPaymentStatus = newTotalPaid >= totalAmount ? 'paid' : 'partially_paid';
            remainingDue = Math.max(0, totalAmount - newTotalPaid);
          }

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
              lastPaymentId: providerPaymentId,
            },
          };

          // Confirm booking
          await supabase
            .from('bookings')
            .update({
              booking_status: 'confirmed',
              payment_status: nextPaymentStatus,
              amount_paid: newTotalPaid,
              discount_amount: discountAmount,
              payment_mode: paymentMode === 'remaining' ? 'half' : paymentMode,
              pricing_breakdown: updatedPricingBreakdown,
              updated_at: now,
            })
            .eq('id', booking.id);

          // Escrow Allocation
          const platformFee = Number(booking.platform_fee) || 0;
          const feeToDeduct = nextPaymentStatus === 'paid' ? platformFee : Math.round(platformFee * (newTotalPaid / totalAmount));
          const netAmount = Math.max(0, newTotalPaid - feeToDeduct);

          const { data: existingPayout } = await supabase
            .from('creator_payouts')
            .select('id')
            .eq('booking_id', booking.id)
            .maybeSingle();

          if (existingPayout) {
            await supabase
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
            await supabase.from('creator_payouts').insert({
              booking_id: booking.id,
              creator_id: booking.creator_id,
              gross_amount: newTotalPaid,
              platform_fee: feeToDeduct,
              net_amount: netAmount,
              payout_status: 'in_escrow',
            });
          }

          // System audit log
          await supabase.from('system_logs').insert({
            category: 'PAYMENTS',
            level: 'SUCCESS',
            action: 'PAYMENT_WEBHOOK_VERIFIED',
            actor: 'razorpay_webhook',
            target: `booking:${booking.id}`,
            details: `Webhook verified payment ${providerPaymentId} of ₹${paidThisTxn} (Mode: ${paymentMode}). Escrow net ₹${netAmount} allocated. Total Paid: ₹${newTotalPaid}.`,
            metadata: { eventType, providerPaymentId, providerOrderId, totalAmount, discountAmount, amountPaid: newTotalPaid, platformFee },
          });

          // In-App Notification
          await createInAppNotification({
            userId: booking.customer_id,
            type: 'payment_success',
            title: nextPaymentStatus === 'paid' ? 'Payment Confirmed by Gateway' : 'Advance Deposit Confirmed',
            body: `Your payment of ₹${paidThisTxn.toLocaleString('en-IN')} for "${booking.event_title}" was confirmed via payment gateway webhook.`,
            relatedBookingId: booking.id,
            actionUrl: '/customer/bookings',
          });
        }
      }

      return NextResponse.json({ received: true, status: 'processed_payment' });
    }

    // 2. Payment Failed
    if (eventType === 'payment.failed') {
      const errorDescription = paymentEntity?.error_description || 'Payment transaction failed at gateway.';
      if (providerOrderId || providerPaymentId) {
        await supabase
          .from('payments')
          .update({
            payment_status: 'failed',
            metadata: { error: errorDescription, failureEvent: paymentEntity },
          })
          .or(`provider_order_id.eq.${providerOrderId},provider_payment_id.eq.${providerPaymentId}`);
      }

      await supabase.from('system_logs').insert({
        category: 'PAYMENTS',
        level: 'WARNING',
        action: 'PAYMENT_WEBHOOK_FAILED',
        actor: 'razorpay_webhook',
        details: `Payment failure recorded for order ${providerOrderId}: ${errorDescription}`,
        metadata: { eventType, providerPaymentId, providerOrderId, errorDescription },
      });

      return NextResponse.json({ received: true, status: 'processed_failure' });
    }

    // 3. Refund Processed
    if (eventType === 'refund.processed' || eventType === 'charge.refunded') {
      const refundEntity = event.payload?.refund?.entity || paymentEntity;
      const refundId = refundEntity.id;
      const refundAmount = (Number(refundEntity.amount) || 0) / 100;

      await supabase
        .from('payments')
        .update({ payment_status: 'refunded' })
        .eq('provider_payment_id', providerPaymentId);

      if (bookingId) {
        await supabase
          .from('bookings')
          .update({
            booking_status: 'cancelled',
            payment_status: 'refunded',
          })
          .eq('id', bookingId);

        const { data: paymentRec } = await supabase
          .from('payments')
          .select('id')
          .eq('booking_id', bookingId)
          .maybeSingle();

        if (paymentRec) {
          await supabase.from('refunds').insert({
            payment_id: paymentRec.id,
            booking_id: bookingId,
            refund_amount: refundAmount,
            refund_reason: refundEntity?.notes?.reason || 'Customer cancellation refund',
            provider_refund_id: refundId,
          });
        }
      }

      return NextResponse.json({ received: true, status: 'processed_refund', refundId });
    }

    return NextResponse.json({ received: true, status: 'ignored_event_type', eventType });
  } catch (err: any) {
    console.error('[webhook] Payment webhook processing error:', err);
    return NextResponse.json({ error: err?.message || 'Webhook processing failed.' }, { status: 500 });
  }
}
