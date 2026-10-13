import { NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats
 * Platform totals computed from the database (no cached or estimated figures).
 */
export async function GET() {
  const auth = await authorize({ roles: ['admin', 'owner'] });
  if (!auth.ok) return auth.response;
  const { admin } = auth;

  try {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthIso = monthStart.toISOString();

    const openSubmissionCount = async (client: typeof admin): Promise<number> => {
      const result = await client
        .from('creator_verification_submissions')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'needs_info']);
      if (result.error) {
        console.warn('Open verification count unavailable:', result.error.message);
        return 0;
      }
      return result.count ?? 0;
    };

    const count = async (build: (c: typeof admin) => PromiseLike<{ count: number | null; error: { message: string } | null }>) => {
      const { count: n, error } = await build(admin);
      if (error) throw new Error(error.message);
      return n ?? 0;
    };

    const [
      totalUsers,
      customers,
      creatorsApproved,
      creatorsPending,
      totalBookings,
      bookingsThisMonth,
      disputedBookings,
      openSubmissions,
    ] = await Promise.all([
      count((t) => t.from('profiles').select('id', { count: 'exact', head: true })),
      count((t) => t.from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'customer')),
      count((t) => t.from('creator_profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'approved')),
      count((t) => t.from('creator_profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending')),
      count((t) => t.from('bookings').select('id', { count: 'exact', head: true })),
      count((t) => t.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', monthIso)),
      count((t) => t.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_status', 'disputed')),
      // Applications awaiting a reviewer, including ones sent back for more
      // information. This is the number the queue header shows. It must not take
      // the whole dashboard down on a database that has not applied
      // 20261013000002 yet, so it is resolved separately and tolerantly.
      openSubmissionCount(admin),
    ]);

    // Revenue = successfully paid payments (gross customer amount, INR).
    const { data: paid, error: paidErr } = await admin
      .from('payments')
      .select('amount, paid_at')
      .eq('payment_status', 'paid');
    if (paidErr) throw new Error(paidErr.message);

    let totalRevenue = 0;
    let revenueThisMonth = 0;
    for (const p of paid || []) {
      const amount = Number(p.amount) || 0;
      totalRevenue += amount;
      if (p.paid_at && p.paid_at >= monthIso) revenueThisMonth += amount;
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        customers,
        photographers: creatorsApproved + creatorsPending,
        creatorsApproved,
        creatorsPending,
        totalBookings,
        bookingsThisMonth,
        disputedBookings,
        openVerificationSubmissions: openSubmissions,
        totalRevenue,
        revenueThisMonth,
        currency: 'INR',
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Admin stats failed:', err);
    return jsonError(500, 'Could not load platform statistics.');
  }
}
