import { NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/payments
 * Reads verified transactions, creator payouts, and financial aggregates directly from the database.
 */
export async function GET() {
  const auth = await authorize({ roles: ['admin', 'owner'] });
  if (!auth.ok) return auth.response;
  const { admin } = auth;

  try {
    const [paymentsRes, payoutsRes, refundsRes] = await Promise.all([
      admin
        .from('payments')
        .select(`
          id,
          booking_id,
          customer_id,
          provider,
          provider_payment_id,
          amount,
          currency,
          payment_status,
          paid_at,
          created_at,
          customer:profiles!customer_id ( full_name, email ),
          booking:bookings!booking_id ( booking_reference, total_amount, platform_fee, booking_status )
        `)
        .order('created_at', { ascending: false })
        .limit(100),
      admin
        .from('creator_payouts')
        .select(`
          id,
          booking_id,
          creator_id,
          gross_amount,
          platform_fee,
          net_amount,
          payout_status,
          paid_at,
          created_at,
          creator:creator_profiles!creator_id ( professional_name, city, user_id )
        `)
        .order('created_at', { ascending: false })
        .limit(100),
      admin
        .from('refunds')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    const paymentRows = paymentsRes.data || [];
    const payoutRows = payoutsRes.data || [];
    const refundRows = refundsRes.data || [];

    let totalCollected = 0;
    let totalGrossValue = 0;
    let totalPlatformCommission = 0;
    let totalEscrowLiability = 0;
    let totalCompletedPayouts = 0;
    let totalRefunds = 0;

    for (const p of paymentRows) {
      const amt = Number(p.amount) || 0;
      totalGrossValue += amt;
      if (p.payment_status === 'paid') {
        totalCollected += amt;
        const b = p.booking as any;
        if (b?.platform_fee) {
          totalPlatformCommission += Number(b.platform_fee) || 0;
        }
      }
    }

    for (const po of payoutRows) {
      const net = Number(po.net_amount) || 0;
      if (po.payout_status === 'in_escrow' || po.payout_status === 'queued') {
        totalEscrowLiability += net;
      } else if (po.payout_status === 'paid') {
        totalCompletedPayouts += net;
      }
    }

    for (const ref of refundRows) {
      if (ref.refund_status === 'processed') {
        totalRefunds += Number(ref.refund_amount) || 0;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalCollected,
        totalGrossValue,
        totalPlatformCommission,
        totalEscrowLiability,
        totalCompletedPayouts,
        totalRefunds,
        currency: 'INR',
      },
      payments: paymentRows,
      payouts: payoutRows,
      refunds: refundRows,
    });
  } catch (err: any) {
    return jsonError(500, err?.message || 'Could not load payment ledger.');
  }
}
