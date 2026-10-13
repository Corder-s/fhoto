import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { paymentId, bookingId } = await request.json();

    if (!paymentId || !bookingId) {
      return NextResponse.json(
        { error: 'Missing paymentId or bookingId.' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();

    if (admin) {
      // 1. Fetch payment to ensure it is genuinely dev_sandbox
      const { data: payment, error: pErr } = await admin
        .from('payments')
        .select('*')
        .eq('provider_payment_id', paymentId)
        .eq('booking_id', bookingId)
        .single();

      if (pErr || !payment) {
        return NextResponse.json(
          { error: 'Payment intent record not found.' },
          { status: 404 }
        );
      }

      if (payment.provider !== 'dev_sandbox') {
        return NextResponse.json(
          { error: 'Cannot manually confirm a non-sandbox payment. Webhook verification required.' },
          { status: 403 }
        );
      }

      // 2. Mark payment paid
      await admin
        .from('payments')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      // 3. Mark booking confirmed & paid
      await admin
        .from('bookings')
        .update({
          payment_status: 'paid',
          booking_status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      // 4. Record history
      await admin.from('booking_status_history').insert({
        booking_id: bookingId,
        previous_status: 'pending',
        new_status: 'confirmed',
        change_reason: 'Sandbox payment successfully completed and verified',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Sandbox payment verified and booking confirmed.',
      bookingId,
      paymentId,
      status: 'confirmed',
    });
  } catch (err: any) {
    console.error('Error confirming sandbox payment:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to confirm sandbox payment.' },
      { status: 500 }
    );
  }
}
