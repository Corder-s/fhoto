import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/webhook
 * Server-side payment gateway webhook handler.
 * Verifies gateway signature (HMAC SHA-256) and idempotently processes payment & refund events.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.PAYMENT_PROVIDER_WEBHOOK_SECRET;

  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || req.headers.get('x-webhook-signature');

  // Signature verification when live secret is configured
  if (webhookSecret && !webhookSecret.includes('placeholder')) {
    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature header.' }, { status: 401 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
    }
  }

  let event: Record<string, any>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const eventType = event.event || event.type || 'payment.captured';
  const paymentEntity = event.payload?.payment?.entity || event.data?.object || event;

  const providerPaymentId = paymentEntity.id || paymentEntity.payment_id;
  const bookingId = paymentEntity.notes?.booking_id || event.booking_id;

  if (!providerPaymentId) {
    return NextResponse.json({ received: true, message: 'Unhandled event payload structure.' });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable.' }, { status: 500 });
  }

  try {
    // 1. Payment Captured / Succeeded
    if (eventType === 'payment.captured' || eventType === 'order.paid' || eventType === 'charge.succeeded') {
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('provider_payment_id', providerPaymentId)
        .maybeSingle();

      if (existingPayment && existingPayment.payment_status === 'paid') {
        // Idempotent: already marked as paid
        return NextResponse.json({ received: true, status: 'already_processed' });
      }

      const now = new Date().toISOString();

      if (existingPayment) {
        await supabase
          .from('payments')
          .update({
            payment_status: 'paid',
            paid_at: now,
          })
          .eq('id', existingPayment.id);
      }

      const targetBookingId = bookingId || existingPayment?.booking_id;
      if (targetBookingId) {
        const { data: booking } = await supabase
          .from('bookings')
          .select('id, total_amount, platform_fee, creator_id, customer_id')
          .eq('id', targetBookingId)
          .maybeSingle();

        if (booking) {
          // Confirm booking
          await supabase
            .from('bookings')
            .update({
              booking_status: 'confirmed',
              payment_status: 'paid',
            })
            .eq('id', booking.id);

          // Idempotent Creator Escrow Payout creation
          const totalAmount = Number(booking.total_amount) || 0;
          const platformFee = Number(booking.platform_fee) || 0;
          const netAmount = Math.max(0, totalAmount - platformFee);

          const { data: existingPayout } = await supabase
            .from('creator_payouts')
            .select('id')
            .eq('booking_id', booking.id)
            .maybeSingle();

          if (!existingPayout) {
            await supabase.from('creator_payouts').insert({
              booking_id: booking.id,
              creator_id: booking.creator_id,
              gross_amount: totalAmount,
              platform_fee: platformFee,
              net_amount: netAmount,
              payout_status: 'in_escrow',
            });
          }

          // System audit log
          await supabase.from('system_logs').insert({
            category: 'BOOKINGS',
            level: 'SUCCESS',
            action: 'PAYMENT_WEBHOOK_VERIFIED',
            actor: 'payment_gateway',
            target: `booking:${booking.id}`,
            details: `Verified payment ${providerPaymentId} of ₹${totalAmount}. Payout ₹${netAmount} placed in escrow.`,
            metadata: { eventType, providerPaymentId, totalAmount, platformFee },
          });

          // Dispatch notifications
          await supabase.from('notifications').insert([
            {
              user_id: booking.customer_id,
              type: 'booking_confirmed',
              title: 'Payment Verified & Booking Confirmed',
              body: `Your payment has been verified. Your photographer has been notified.`,
              action_url: `/customer/bookings`,
            },
          ]);
        }
      }

      return NextResponse.json({ received: true, status: 'processed_payment' });
    }

    // 2. Refund Processed
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
      }

      return NextResponse.json({ received: true, status: 'processed_refund', refundId });
    }

    return NextResponse.json({ received: true, status: 'ignored_event_type', eventType });
  } catch (err: any) {
    console.error('[webhook] Payment webhook processing error:', err);
    return NextResponse.json({ error: err?.message || 'Webhook processing failed.' }, { status: 500 });
  }
}
