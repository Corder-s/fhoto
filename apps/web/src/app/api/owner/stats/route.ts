import { NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

const BOOKING_STATUSES = [
  'pending',
  'accepted',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'rejected',
  'disputed',
] as const;

const VERIFICATION_STATUSES = ['unsubmitted', 'pending', 'approved', 'rejected', 'suspended'] as const;

/**
 * GET /api/owner/stats
 *
 * Executive figures for /owner/dashboard, computed from the production tables on
 * every request. Owner-only: the admin role, however broad, cannot read it, and
 * there is no self-service path to the owner role.
 *
 * Deliberately absent: recurring-subscription revenue (MRR/ARR). The Supabase
 * schema has no subscription table — SaaS billing lives in the optional NestJS
 * service — so publishing a subscription figure here would be an invented
 * number. Marketplace revenue below comes from `payments` and `bookings`.
 */
export async function GET() {
  const auth = await authorize({ roles: ['owner'] });
  if (!auth.ok) return auth.response;
  const { admin } = auth;

  try {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthIso = monthStart.toISOString();

    type CountResult = { count: number | null; error: { message: string } | null };
    const unwrap = (label: string) => (result: CountResult) => {
      if (result.error) throw new Error(`${label}: ${result.error.message}`);
      return result.count ?? 0;
    };

    const [
      totalUsers,
      administratorRows,
      ownerRows,
      queueRows,
      verificationRows,
      bookingRows,
      monthBookingRows,
      paidPayments,
      bookedValueRows,
    ] = await Promise.all([
      admin.from('profiles').select('id', { count: 'exact', head: true }),
      admin.from('user_roles').select('id', { count: 'exact', head: true }).in('role', ['admin', 'owner']),
      admin.from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'owner'),
      admin
        .from('creator_verification_submissions')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'needs_info']),
      Promise.all(
        VERIFICATION_STATUSES.map((status) =>
          admin.from('creator_profiles').select('id', { count: 'exact', head: true }).eq('verification_status', status)
        )
      ),
      Promise.all(
        BOOKING_STATUSES.map((status) =>
          admin.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_status', status)
        )
      ),
      admin.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', monthIso),
      admin.from('payments').select('amount, paid_at').eq('payment_status', 'paid'),
      admin
        .from('bookings')
        .select('total_amount, platform_fee')
        .in('booking_status', ['confirmed', 'in_progress', 'completed'])
        .limit(2000),
    ]);

    const byVerificationStatus: Record<string, number> = {};
    verificationRows.forEach((result, index) => {
      byVerificationStatus[VERIFICATION_STATUSES[index]] = unwrap(`creator_profiles.${VERIFICATION_STATUSES[index]}`)(result);
    });

    const byBookingStatus: Record<string, number> = {};
    bookingRows.forEach((result, index) => {
      byBookingStatus[BOOKING_STATUSES[index]] = unwrap(`bookings.${BOOKING_STATUSES[index]}`)(result);
    });

    const totalBookings = Object.values(byBookingStatus).reduce((sum, value) => sum + value, 0);
    const photographers = Object.values(byVerificationStatus).reduce((sum, value) => sum + value, 0);

    let totalRevenue = 0;
    let revenueThisMonth = 0;
    for (const payment of paidPayments.data || []) {
      const amount = Number(payment.amount) || 0;
      totalRevenue += amount;
      if (payment.paid_at && payment.paid_at >= monthIso) revenueThisMonth += amount;
    }

    let grossBookedValue = 0;
    let platformFees = 0;
    for (const booking of bookedValueRows.data || []) {
      grossBookedValue += Number(booking.total_amount) || 0;
      platformFees += Number(booking.platform_fee) || 0;
    }

    // City-level supply, aggregated here rather than in SQL: the directory is a
    // few hundred rows and the dashboard only needs the ranking.
    const { data: creatorRows, error: creatorErr } = await admin
      .from('creator_profiles')
      .select('city, verification_status')
      .limit(2000);
    if (creatorErr) throw new Error(`creator_profiles: ${creatorErr.message}`);

    const cityMap = new Map<string, { city: string; photographers: number; approved: number }>();
    for (const row of creatorRows || []) {
      const city = (row.city || 'Unspecified').trim() || 'Unspecified';
      const entry = cityMap.get(city) || { city, photographers: 0, approved: 0 };
      entry.photographers += 1;
      if (row.verification_status === 'approved') entry.approved += 1;
      cityMap.set(city, entry);
    }
    const cities = Array.from(cityMap.values())
      .sort((a, b) => b.photographers - a.photographers || b.approved - a.approved)
      .slice(0, 6);

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalUsers,
          administrators: unwrap('user_roles')(administratorRows),
          owners: unwrap('user_roles')(ownerRows),
          verificationQueue: unwrap('creator_verification_submissions')(queueRows),
          photographers,
          byVerificationStatus,
          totalBookings,
          bookingsThisMonth: unwrap('bookings month')(monthBookingRows),
          byBookingStatus,
          grossBookedValue,
          platformFees,
          totalRevenue,
          revenueThisMonth,
          cities,
          currency: 'INR',
          generatedAt: new Date().toISOString(),
          // Surfaced so a reviewer of the dashboard can see the money numbers are
          // live and how fresh they are, not an estimate.
          source: 'database: profiles, user_roles, creator_profiles, creator_verification_submissions, bookings, payments',
          // Recorded honestly instead of estimated: recurring SaaS billing is not
          // part of this database, so there is no MRR to display.
          subscriptionRevenue: null,
          subscriptionRevenueNote:
            'Creator subscription billing is not implemented in the production database (it belongs to the optional NestJS service), so no MRR/ARR figure is shown.',
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('Owner stats failed:', err);
    return jsonError(500, 'Could not load platform statistics.');
  }
}
