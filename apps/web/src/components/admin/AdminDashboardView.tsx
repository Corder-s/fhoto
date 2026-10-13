'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  DollarSign,
  ShieldCheck,
  Scale,
  ArrowRight,
  Activity,
  Check,
  Clock,
  RefreshCw,
  Ban,
  RotateCcw,
} from 'lucide-react';

/*
 * Admin overview. Every figure and row is loaded from the admin API routes
 * (/api/admin/stats, /creators, /users, /bookings); nothing is hardcoded.
 * Access is enforced by those routes, so this view is only a presentation layer.
 */

interface Stats {
  totalUsers: number;
  customers: number;
  photographers: number;
  creatorsApproved: number;
  creatorsPending: number;
  totalBookings: number;
  bookingsThisMonth: number;
  disputedBookings: number;
  totalRevenue: number;
  revenueThisMonth: number;
}

interface CreatorRow {
  id: string;
  user_id: string;
  professional_name: string;
  city: string | null;
  state: string | null;
  verification_status: string;
  user: { full_name: string; email: string; account_status: string } | null;
}

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  accountStatus: string;
  roles: string[];
  isPhotographer: boolean;
  createdAt: string;
}

interface BookingRow {
  id: string;
  booking_reference: string | null;
  event_title: string | null;
  event_date: string | null;
  booking_status: string;
  total_amount: number | string | null;
  customer: { full_name: string | null } | null;
  creator: { professional_name: string | null } | null;
}

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

// Parses a JSON body, tolerating empty or non-JSON error responses.
async function readJson<T>(res: Response): Promise<T> {
  return (await res.json().catch(() => ({}))) as T;
}

export const AdminDashboardView: React.FC = () => {
  const [userFilter, setUserFilter] = useState<'all' | 'customers' | 'photographers'>('all');
  const [stats, setStats] = useState<Stats | null>(null);
  const [creators, setCreators] = useState<CreatorRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const notify = useCallback((text: string, tone: 'ok' | 'error' = 'ok') => {
    setActionToast({ text, tone });
    setTimeout(() => setActionToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [statsRes, creatorsRes, usersRes, bookingsRes] = await Promise.all([
        fetch('/api/admin/stats', { cache: 'no-store' }),
        fetch('/api/admin/creators?status=pending', { cache: 'no-store' }),
        fetch(`/api/admin/users?filter=${userFilter}`, { cache: 'no-store' }),
        fetch('/api/admin/bookings', { cache: 'no-store' }),
      ]);

      const failed = [statsRes, creatorsRes, usersRes, bookingsRes].find((r) => !r.ok);
      if (failed) {
        const body = await readJson<{ error?: string }>(failed);
        throw new Error(body.error || `Request failed (${failed.status})`);
      }

      const statsBody = await readJson<{ stats: Stats }>(statsRes);
      const creatorsBody = await readJson<{ creators: CreatorRow[] }>(creatorsRes);
      const usersBody = await readJson<{ users: UserRow[] }>(usersRes);
      const bookingsBody = await readJson<{ bookings: BookingRow[] }>(bookingsRes);

      setStats(statsBody.stats);
      setCreators(creatorsBody.creators || []);
      setUsers(usersBody.users || []);
      setBookings((bookingsBody.bookings || []).slice(0, 6));
    } catch (err: any) {
      setLoadError(err?.message || 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [userFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const reviewCreator = async (creatorProfileId: string, action: 'approve' | 'reject') => {
    setBusyId(creatorProfileId);
    try {
      const res = await fetch('/api/admin/creators', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorProfileId, action }),
      });
      const body = await readJson<{ error?: string }>(res);
      if (!res.ok) throw new Error(body.error || 'Could not update the application.');
      notify(action === 'approve' ? 'Photographer approved' : 'Application rejected');
      await load();
    } catch (err: any) {
      notify(err?.message || 'Could not update the application.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const setAccountStatus = async (userId: string, accountStatus: 'active' | 'suspended') => {
    setBusyId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, accountStatus }),
      });
      const body = await readJson<{ error?: string }>(res);
      if (!res.ok) throw new Error(body.error || 'Could not update the account.');
      notify(accountStatus === 'suspended' ? 'Account suspended' : 'Account reinstated');
      await load();
    } catch (err: any) {
      notify(err?.message || 'Could not update the account.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const kpiCards = stats
    ? [
        {
          id: 'kpi-users',
          title: 'Total Users',
          value: stats.totalUsers.toLocaleString('en-IN'),
          subtext: `${stats.customers.toLocaleString('en-IN')} customers • ${stats.photographers.toLocaleString('en-IN')} photographers`,
          icon: Users,
          iconColor: 'bg-[#FFF2E8] text-[#FF6E00] border-[#FFDFC6]',
        },
        {
          id: 'kpi-bookings',
          title: 'Total Bookings',
          value: stats.totalBookings.toLocaleString('en-IN'),
          subtext: `${stats.bookingsThisMonth.toLocaleString('en-IN')} this month • ${stats.disputedBookings} disputed`,
          icon: Calendar,
          iconColor: 'bg-red-50 text-red-500 border-red-200',
        },
        {
          id: 'kpi-revenue',
          title: 'Paid Revenue',
          value: inr(stats.totalRevenue),
          subtext: `${inr(stats.revenueThisMonth)} this month`,
          icon: DollarSign,
          iconColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        },
        {
          id: 'kpi-pending',
          title: 'Pending Photographers',
          value: stats.creatorsPending.toLocaleString('en-IN'),
          subtext: `${stats.creatorsApproved.toLocaleString('en-IN')} approved`,
          icon: ShieldCheck,
          iconColor: 'bg-purple-50 text-purple-600 border-purple-200',
        },
      ]
    : [];

  const quickActions = [
    { label: 'Verify Photographer', icon: ShieldCheck, href: '#pending-photographers', color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
    { label: 'Manage Bookings', icon: Calendar, href: '/admin/bookings', color: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
    { label: 'Resolve Dispute', icon: Scale, href: '/admin/bookings', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
    { label: 'Refresh Data', icon: RefreshCw, href: '#refresh', color: 'text-stone-600 bg-stone-100 hover:bg-stone-200' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {actionToast && (
        <div
          role="status"
          className={`fixed top-20 right-8 z-50 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 ${
            actionToast.tone === 'error' ? 'bg-red-600' : 'bg-[#1A1816]'
          }`}
        >
          {actionToast.tone === 'ok' && <Check className="w-4 h-4 text-emerald-400" />}
          <span>{actionToast.text}</span>
        </div>
      )}

      {/* ROW 1: WELCOME & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 relative rounded-3xl bg-[#FFF8F2] border border-[#FFDFC6] p-6 sm:p-8 overflow-hidden flex flex-col justify-between shadow-2xs">
          <div
            className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-5/12 bg-cover bg-center pointer-events-none opacity-90 hidden sm:block"
            style={{
              backgroundImage: 'url(/reference-assets/admin_banner_photographer.jpg)',
              maskImage: 'linear-gradient(to right, transparent, black 35%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 35%)',
            }}
          />
          <div className="relative z-10 max-w-md space-y-2">
            <span className="text-sm font-semibold text-[#8C847A]">Welcome back,</span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1A1816] tracking-tight">Admin!</h1>
            <p className="text-xs sm:text-sm text-[#736B63] font-medium">
              Review photographer applications, manage accounts and monitor bookings.
            </p>
          </div>
          <div className="relative z-10 pt-4 mt-6 border-t border-[#F3E7DC] flex items-center gap-4 text-xs font-semibold text-[#736B63]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E8E2D8] text-[11px] font-bold text-[#1A1816]">
              <span className={`w-2 h-2 rounded-full ${loadError ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
              <span>{loadError ? 'Data unavailable' : 'Live data'}</span>
            </span>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8E2D8] p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-[#FFF2E8] text-[#FF6E00] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-black text-[#1A1816]">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1">
            {quickActions.map((act) => {
              const Icon = act.icon;
              const className = `p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${act.color}`;
              if (act.href === '#refresh') {
                return (
                  <button key={act.label} type="button" onClick={load} className={className} title={act.label}>
                    <Icon className="w-5 h-5 mb-1.5" />
                    <span className="text-[10px] font-bold leading-tight">{act.label}</span>
                  </button>
                );
              }
              return (
                <Link key={act.label} href={act.href} className={className} title={act.label}>
                  <Icon className="w-5 h-5 mb-1.5" />
                  <span className="text-[10px] font-bold leading-tight">{act.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {loadError}
        </div>
      )}

      {/* ROW 2: KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !stats &&
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E8E2D8] p-5 h-32 animate-pulse" />
          ))}
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              className="bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-2xs hover:border-[#FF6E00] transition-all space-y-3"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${kpi.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#736B63] font-medium">{kpi.title}</p>
                <p className="text-2xl font-black text-[#1A1816] tracking-tight mt-0.5">{kpi.value}</p>
                <p className="text-[11px] text-[#8C847A] font-medium mt-1 truncate">{kpi.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ROW 3: PENDING PHOTOGRAPHERS, USERS, BOOKINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* PENDING PHOTOGRAPHERS */}
        <div
          id="pending-photographers"
          className="lg:col-span-4 bg-white rounded-3xl border border-[#E8E2D8] p-5 shadow-2xs flex flex-col justify-between scroll-mt-24"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-[#FF6E00]" />
              <h3 className="text-sm font-black text-[#1A1816]">Photographer Applications</h3>
            </div>
            {creators.length === 0 ? (
              <p className="text-xs text-[#8C847A] py-6 text-center">No applications are waiting for review.</p>
            ) : (
              <div className="divide-y divide-[#F2ECE3]">
                {creators.map((c) => (
                  <div key={c.id} className="py-2.5 space-y-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1A1816] truncate">{c.professional_name}</p>
                      <p className="text-[10px] text-[#8C847A] truncate">
                        {c.user?.full_name || 'Unknown'} • {c.user?.email || '—'}
                      </p>
                      <p className="text-[10px] text-[#A69F96] truncate">
                        {[c.city, c.state].filter(Boolean).join(', ') || 'Location not set'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyId === c.id}
                        onClick={() => reviewCreator(c.id, 'approve')}
                        className="px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 text-white disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === c.id}
                        onClick={() => reviewCreator(c.id, 'reject')}
                        className="px-3 py-1 rounded-lg text-[11px] font-bold bg-white border border-red-200 text-red-600 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RECENT USERS */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8E2D8] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FF6E00]" />
                <h3 className="text-sm font-black text-[#1A1816]">Users</h3>
              </div>
              <div className="flex items-center gap-1">
                {(['all', 'customers', 'photographers'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setUserFilter(t)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize cursor-pointer ${
                      userFilter === t ? 'bg-[#FF6E00] text-white shadow-2xs' : 'text-[#736B63] hover:text-[#1A1816]'
                    }`}
                  >
                    {t === 'all' ? 'All' : t === 'customers' ? 'Customers' : 'Photographers'}
                  </button>
                ))}
              </div>
            </div>
            {users.length === 0 ? (
              <p className="text-xs text-[#8C847A] py-6 text-center">No users match this filter.</p>
            ) : (
              <div className="divide-y divide-[#F2ECE3]">
                {users.slice(0, 8).map((u) => (
                  <div key={u.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1A1816] truncate">{u.fullName || 'Unnamed user'}</p>
                      <p className="text-[10px] text-[#8C847A] truncate">
                        {u.isPhotographer ? 'Photographer' : 'Customer'} • {u.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          u.accountStatus === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {u.accountStatus}
                      </span>
                      {u.accountStatus === 'active' ? (
                        <button
                          type="button"
                          title="Suspend account"
                          disabled={busyId === u.id}
                          onClick={() => setAccountStatus(u.id, 'suspended')}
                          className="p-1 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          title="Reinstate account"
                          disabled={busyId === u.id}
                          onClick={() => setAccountStatus(u.id, 'active')}
                          className="p-1 rounded-md text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RECENT BOOKINGS */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8E2D8] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FF6E00]" />
                <h3 className="text-sm font-black text-[#1A1816]">Recent Bookings</h3>
              </div>
              <Link href="/admin/bookings" className="text-xs font-bold text-[#FF6E00] hover:underline inline-flex items-center gap-1">
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {bookings.length === 0 ? (
              <p className="text-xs text-[#8C847A] py-6 text-center">No bookings yet.</p>
            ) : (
              <div className="divide-y divide-[#F2ECE3]">
                {bookings.map((b) => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1A1816] truncate">{b.event_title || b.booking_reference || 'Booking'}</p>
                      <p className="text-[10px] text-[#8C847A] truncate">
                        {b.customer?.full_name || 'Customer'} → {b.creator?.professional_name || 'Photographer'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-[#1A1816]">{inr(Number(b.total_amount) || 0)}</p>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#736B63] capitalize">
                        <Clock className="w-2.5 h-2.5" />
                        {b.booking_status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
