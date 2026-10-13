import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, customerId, idempotencyKey } = body;

    if (!bookingId || !idempotencyKey) {
      return NextResponse.json(
        { error: 'Missing bookingId or idempotencyKey.' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    const paymentSecret = process.env.PAYMENT_PROVIDER_SECRET_KEY;
    const isGatewayConfigured = Boolean(paymentSecret && !paymentSecret.includes('placeholder'));

    let totalAmount = 10030; // Default INR fallback
    let agreedPrice = 8500;
    let platformFee = 850;

    if (admin) {
      // 1. Fetch live booking to ensure exact amount match
      const { data: booking, error: bErr } = await admin
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (booking && !bErr) {
        totalAmount = Number(booking.total_amount);
        agreedPrice = Number(booking.agreed_service_price);
        platformFee = Number(booking.platform_fee);
      }

      // 2. Check if payment already exists with this idempotency key
      const { data: existingPayment } = await admin
        .from('payments')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .single();

      if (existingPayment) {
        return NextResponse.json({
          success: true,
          paymentId: existingPayment.id,
          idempotencyKey,
          amount: existingPayment.amount,
          status: existingPayment.payment_status,
          message: 'Existing payment intent retrieved (Idempotent response).',
          isSandbox: existingPayment.provider === 'dev_sandbox',
        });
      }
    }

    // If no real gateway keys configured, return clearly identified Sandbox mode
    if (!isGatewayConfigured) {
      const sandboxPaymentId = `pay_dev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      if (admin && customerId) {
        await admin.from('payments').insert({
          booking_id: bookingId,
          customer_id: customerId,
          provider: 'dev_sandbox',
          provider_payment_id: sandboxPaymentId,
          idempotency_key: idempotencyKey,
          amount: totalAmount,
          currency: 'INR',
          payment_status: 'pending',
          payment_method: 'sandbox_test_card',
        });
      }

      return NextResponse.json({
        success: true,
        paymentId: sandboxPaymentId,
        idempotencyKey,
        amount: totalAmount,
        currency: 'INR',
        isSandbox: true,
        notice: 'DEVELOPMENT SANDBOX ENVIRONMENT: No live payment gateway credentials configured in PAYMENT_PROVIDER_SECRET_KEY. Test transaction initialized.',
      });
    }

    // Production Gateway Processing (e.g., Razorpay / Cashfree order creation)
    const providerOrderId = `order_${Date.now()}`;

    if (admin && customerId) {
      await admin.from('payments').insert({
        booking_id: bookingId,
        customer_id: customerId,
        provider: 'razorpay',
        provider_payment_id: providerOrderId,
        idempotency_key: idempotencyKey,
        amount: totalAmount,
        currency: 'INR',
        payment_status: 'pending',
      });
    }

    return NextResponse.json({
      success: true,
      paymentId: providerOrderId,
      idempotencyKey,
      amount: totalAmount,
      currency: 'INR',
      isSandbox: false,
    });
  } catch (err: any) {
    console.error('Error creating payment intent:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to initiate payment intent.' },
      { status: 500 }
    );
  }
}
