import { NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customer/payments
 * Returns authentic payment and escrow transactions for the authenticated customer.
 */
export async function GET() {
  const auth = await authorize({ roles: ['customer'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  try {
    const { data: payments, error } = await admin
      .from('payments')
      .select(`
        id,
        booking_id,
        provider,
        provider_order_id,
        provider_payment_id,
        amount,
        currency,
        payment_status,
        payment_method,
        paid_at,
        created_at,
        booking:bookings!booking_id (
          id,
          booking_reference,
          event_title,
          event_date,
          agreed_service_price,
          platform_fee,
          total_amount,
          booking_status,
          creator:creator_profiles!creator_id (
            id,
            professional_name,
            user:profiles!user_id ( full_name, avatar_url )
          )
        )
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[customer/payments] Failed to load customer payments:', error);
      return jsonError(500, 'Could not load payment ledger.');
    }

    const rows = payments || [];
    let totalPaid = 0;
    let inEscrow = 0;
    let settled = 0;

    for (const p of rows) {
      const amt = Number(p.amount) || 0;
      if (p.payment_status === 'paid' || p.payment_status === 'captured') {
        totalPaid += amt;
        const b = p.booking as any;
        if (b?.booking_status === 'completed') {
          settled += amt;
        } else {
          inEscrow += amt;
        }
      }
    }

    return NextResponse.json({
      success: true,
      payments: rows,
      summary: {
        totalPaid,
        inEscrow,
        settled,
        count: rows.length,
      },
    });
  } catch (err: any) {
    console.error('[customer/payments] Exception:', err);
    return jsonError(500, err?.message || 'Failed to fetch payments.');
  }
}
