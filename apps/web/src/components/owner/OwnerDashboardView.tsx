'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  IndianRupee,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { AdministratorPanel } from '../admin/AdministratorPanel';
import { Card } from '../ui/Card';

/**
 * Owner (platform executive) dashboard.
 *
 * Two jobs, both backed by the production database:
 *  1. Executive figures read from /api/owner/stats (counts and money from
 *     profiles, user_roles, creator_profiles, creator_verification_submissions,
 *     bookings, payments — no cached or invented numbers).
 *  2. Administrator and permission management through /api/admin/roles, which is
 *     the only way an account becomes an admin besides a manual SQL insert.
 *
 * The previous build of this page printed a fixed "Combined Platform Net
 * Revenue" figure, tier-by-tier MRR, a churn rate and growth arrows that nothing
 * computed. Those numbers are gone: subscription billing is not part of this
 * schema, so there is nothing to derive them from, and an executive dashboard
 * that shows invented money is worse than one that says "not wired".
 */

interface OwnerStats {
  totalUsers: number;
  administrators: number;
  owners: number;
  verificationQueue: number;
  photographers: number;
  byVerificationStatus: Record<string, number>;
  totalBookings: number;
  bookingsThisMonth: number;
  byBookingStatus: Record<string, number>;
  grossBookedValue: number;
  platformFees: number;
  totalRevenue: number;
  revenueThisMonth: number;
  cities: Array<{ city: string; photographers: number; approved: number }>;
  currency: string;
  generatedAt: string;
  subscriptionRevenueNote?: string;
}

const inr = (value: number | null | undefined) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const VERIFICATION_ORDER = ['pending', 'approved', 'rejected', 'suspended', 'unsubmitted'] as const;
const VERIFICATION_TONE: Record<string, string> = {
  pending: 'bg-amber-50 border-amber-200 text-amber-900',
  approved: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  rejected: 'bg-red-50 border-red-200 text-red-800',
  suspended: 'bg-stone-100 border-stone-200 text-stone-700',
  unsubmitted: 'bg-white border-[#E8E2D8] text-[#736B63]',
};

export const OwnerDashboardView: React.FC = () => {
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/owner/stats', { cache: 'no-store', credentials: 'same-origin' });
      const body = (await res.json().catch(() => ({}))) as { stats?: OwnerStats; error?: string };
      if (res.status === 401 || res.status === 403) {
        setForbidden(true);
        setError(body.error || 'Your account is not a platform owner.');
        return;
      }
      if (!res.ok || !body.stats) throw new Error(body.error || `Could not load owner metrics (${res.status}).`);
      setStats(body.stats);
      setError(null);
      setForbidden(false);
    } catch (err: any) {
      setError(err?.message || 'Could not load owner metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (forbidden) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-6 space-y-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-ink-primary">Owner access not granted</h2>
          <p className="text-xs text-ink-secondary">{error}</p>
          <p className="text-[11px] text-ink-muted">
            Ownership is a database role (<code className="font-mono">user_roles.role = &#39;owner&#39;</code>) and is
            never self-service. Ask an existing owner to grant it from this page, or run the documented SQL in the
            Supabase editor to create the first owner.
          </p>
          <Link href="/" className="inline-block text-xs font-bold text-brand hover:underline">
            Back to the marketplace
          </Link>
        </Card>
      </div>
    );
  }

  const kpis = stats
    ? [
        { id: 'owner-kpi-users', label: 'Registered accounts', value: stats.totalUsers.toLocaleString('en-IN'), hint: `${stats.photographers.toLocaleString('en-IN')} photographer profiles` },
        { id: 'owner-kpi-admins', label: 'Administrators', value: stats.administrators.toLocaleString('en-IN'), hint: `${stats.owners} with ownership` },
        { id: 'owner-kpi-queue', label: 'Verifications awaiting review', value: stats.verificationQueue.toLocaleString('en-IN'), hint: 'open applications in the admin queue' },
        { id: 'owner-kpi-bookings', label: 'Bookings', value: stats.totalBookings.toLocaleString('en-IN'), hint: `${stats.bookingsThisMonth} created this month` },
        { id: 'owner-kpi-gbv', label: 'Gross booked value', value: inr(stats.grossBookedValue), hint: 'confirmed, in progress and completed' },
        { id: 'owner-kpi-fees', label: 'Platform fees booked', value: inr(stats.platformFees), hint: 'sum of bookings.platform_fee' },
        { id: 'owner-kpi-revenue', label: 'Paid revenue', value: inr(stats.totalRevenue), hint: `${inr(stats.revenueThisMonth)} this month` },
        {
          id: 'owner-kpi-verified-share',
          label: 'Published photographer share',
          value: `${stats.photographers ? Math.round(((stats.byVerificationStatus.approved || 0) / stats.photographers) * 100) : 0}%`,
          hint: `${stats.byVerificationStatus.approved || 0} of ${stats.photographers} profiles approved`,
        },
      ]
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand/10 text-brand">
              Platform Executive Suite
            </span>
            <span className="text-xs text-ink-muted">· Live production data</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary tracking-tight mt-1">
            Ownership, access and marketplace health
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Administrator permissions and the photographer verification pipeline, read from the same tables the
            dashboards write to.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${
              error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
            <span>{error ? 'Using cached data' : 'Live data'}</span>
          </span>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D8] text-[11px] font-bold text-ink-secondary hover:text-ink-primary cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !stats && [0, 1, 2, 3, 4, 5, 6, 7].map((index) => <div key={index} className="h-28 rounded-2xl bg-white border border-[#E8E2D8] animate-pulse" />)}
        {kpis.map((kpi) => (
          <div key={kpi.id} id={kpi.id} className="bg-white rounded-2xl border border-[#E8E2D8] p-4 space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-ink-muted">{kpi.label}</p>
            <p className="text-2xl font-black text-ink-primary tracking-tight">{kpi.value}</p>
            <p className="text-[10px] text-ink-secondary">{kpi.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card id="verification-pipeline" className="lg:col-span-7 p-5 space-y-3 scroll-mt-24">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand" />
            <h2 className="text-sm font-black text-ink-primary">Photographer verification pipeline</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {VERIFICATION_ORDER.map((status) => (
              <div key={status} className={`rounded-xl border p-2.5 ${VERIFICATION_TONE[status]}`}>
                <p className="text-[9px] font-black uppercase tracking-wider">{status.replace('_', ' ')}</p>
                <p className="text-xl font-black mt-0.5">{stats?.byVerificationStatus?.[status] ?? '—'}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-ink-secondary">
            Only <strong>approved</strong> profiles appear in /explore and on public profile pages. Pending, rejected and
            suspended profiles are hidden by the same predicate the directory uses
            (<code className="font-mono">verification_status = &#39;approved&#39;</code>).
          </p>
          <Link
            href="/admin/dashboard#verification-queue"
            className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Open the review queue in the admin dashboard</span>
          </Link>
        </Card>

        <Card id="marketplace-ledger" className="lg:col-span-5 p-5 space-y-3 scroll-mt-24">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-brand" />
            <h2 className="text-sm font-black text-ink-primary">Marketplace ledger</h2>
          </div>
          <dl className="text-[11px] space-y-1.5">
            <LedgerRow label="Gross booked value" value={stats ? inr(stats.grossBookedValue) : '—'} />
            <LedgerRow label="Platform fees on those bookings" value={stats ? inr(stats.platformFees) : '—'} />
            <LedgerRow label="Payments marked paid (lifetime)" value={stats ? inr(stats.totalRevenue) : '—'} />
            <LedgerRow label="Payments marked paid (this month)" value={stats ? inr(stats.revenueThisMonth) : '—'} />
            <LedgerRow
              label="Disputed bookings"
              value={stats ? String(stats.byBookingStatus.disputed ?? 0) : '—'}
            />
          </dl>
          <p className="text-[10px] text-ink-muted leading-relaxed">
            {stats?.subscriptionRevenueNote ||
              'Subscription revenue is not part of this database, so no MRR or ARR figure is shown here.'}
          </p>
          <p className="text-[10px] text-ink-muted">
            {stats ? `Computed ${new Date(stats.generatedAt).toLocaleString('en-IN')}` : '—'}
          </p>
        </Card>
      </div>

      <Card id="supply-by-city" className="p-5 space-y-3 scroll-mt-24">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand" />
          <h2 className="text-sm font-black text-ink-primary">Supply by city</h2>
          <span className="text-[10px] text-ink-muted font-semibold">from creator_profiles</span>
        </div>
        {!stats || stats.cities.length === 0 ? (
          <p className="text-xs text-ink-muted py-4 text-center">No photographer locations recorded yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {stats.cities.map((entry) => (
              <div key={entry.city} className="rounded-xl border border-[#E8E2D8] p-2.5">
                <p className="text-[11px] font-black text-ink-primary truncate" title={entry.city}>
                  {entry.city}
                </p>
                <p className="text-[10px] text-ink-secondary">
                  {entry.photographers} profile{entry.photographers === 1 ? '' : 's'} · {entry.approved} published
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-brand" />
          <h2 className="text-sm font-black text-ink-primary">Access control</h2>
        </div>
        <AdministratorPanel canManage />
      </Card>
    </div>
  );
};

const LedgerRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-2 border-b border-dashed border-[#F0EAE1] pb-1">
    <dt className="text-ink-secondary">{label}</dt>
    <dd className="font-black text-ink-primary">{value}</dd>
  </div>
);

export default OwnerDashboardView;
