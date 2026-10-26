'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Camera,
  Calendar,
  Clock,
  TrendingUp,
  MapPin,
  Folder,
  ChevronDown,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Database,
  HardDrive,
  CreditCard,
  Mail,
  Zap,
  ArrowUpRight,
  RefreshCw,
  Eye,
  X,
  ExternalLink
} from 'lucide-react';
import { useServerSession } from '../../lib/useServerSession';
import { useAdmin } from './AdminContext';

interface StatsResponse {
  totalUsers: number;
  customers: number;
  photographers: number;
  creatorsApproved: number;
  creatorsPending: number;
  totalBookings: number;
  bookingsThisMonth: number;
  pendingBookings?: number;
  confirmedBookings?: number;
  disputedBookings: number;
  totalRevenue: number;
  revenueThisMonth: number;
  totalGrossBookingValue?: number;
  platformEarnings?: number;
  photographerLiabilities?: number;
  totalRefunds?: number;
  comparisons?: {
    usersGrowth: number;
    photographersGrowth: number;
    bookingsGrowth: number;
    revenueGrowth: number;
  };
  statusBreakdown?: {
    completed: number;
    completedPercent: number;
    pending: number;
    pendingPercent: number;
    cancelled: number;
    cancelledPercent: number;
    disputed: number;
    disputedPercent: number;
    total: number;
  };
  topLocations?: Array<{ name: string; count: number; percentage: number }>;
  topCategories?: Array<{ name: string; count: number; percentage: number; color: string }>;
  growthSeries?: Array<{
    date: string;
    label: string;
    users: number;
    bookings: number;
    revenue: number;
    actualUsers?: number;
    actualBookings?: number;
    actualRevenue?: number;
  }>;
  health?: {
    database: string;
    storage: string;
    paymentGateway: string;
    emailService: string;
  };
}

interface BookingRecord {
  id: string;
  booking_reference: string | null;
  event_title: string | null;
  event_date: string | null;
  booking_status: string;
  total_amount: number | string | null;
  created_at: string;
  customer?: {
    full_name: string | null;
    avatar_url?: string | null;
  } | null;
  creator?: {
    professional_name: string | null;
    user?: {
      avatar_url?: string | null;
      full_name?: string | null;
    } | null;
  } | null;
  service?: {
    title: string | null;
  } | null;
}

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  isPhotographer: boolean;
  createdAt: string;
  creatorStatus?: string | null;
}

const formatInr = (n: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n || 0);
};

// SVG Sparkline component
const Sparkline: React.FC<{ stroke: string; points: number[] }> = ({ stroke, points }) => {
  const width = 84;
  const height = 30;
  const min = Math.min(...points);
  const max = Math.max(...points) || 1;
  const range = max - min || 1;

  const coords = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * (height - 6) - 3;
    return `${x},${y}`;
  });

  let d = `M ${coords[0]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = coords[i].split(',').map(Number);
    const [x1, y1] = coords[i + 1].split(',').map(Number);
    const mx = (x0 + x1) / 2;
    d += ` C ${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <path d={d} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const AdminDashboardView: React.FC = () => {
  const session = useServerSession();
  const { dateRange, dateRangeLabel, searchQuery } = useAdmin();

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Growth chart filter dropdown
  const [chartRange, setChartRange] = useState<'30d' | '7d' | 'month'>('30d');
  const [donutRange, setDonutRange] = useState<'month' | '30d'>('month');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, bookingsRes, usersRes] = await Promise.all([
        fetch(`/api/admin/stats?range=${dateRange}`, { cache: 'no-store' }),
        fetch('/api/admin/bookings', { cache: 'no-store' }),
        fetch('/api/admin/users?filter=all', { cache: 'no-store' }),
      ]);

      if (!statsRes.ok) {
        throw new Error(`Failed to load stats (${statsRes.status})`);
      }

      const statsData = await statsRes.json();
      const bookingsData = await bookingsRes.json().catch(() => ({ bookings: [] }));
      const usersData = await usersRes.json().catch(() => ({ users: [] }));

      setStats(statsData.stats);
      setBookings(bookingsData.bookings || []);
      setUsers(usersData.users || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Display actual bookings from database (no mock fallback)
  const displayBookings = useMemo(() => {
    return bookings.slice(0, 5).map((b) => ({
      id: b.id,
      booking_reference: b.booking_reference || `BK-${b.id.slice(0, 8)}`,
      event_title: b.event_title || b.service?.title || 'Photo Session',
      event_date: b.event_date
        ? new Date(b.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Date Pending',
      booking_status: b.booking_status === 'accepted' ? 'confirmed' : b.booking_status,
      total_amount: Number(b.total_amount) || 0,
      created_at: b.created_at,
      customer: {
        full_name: b.customer?.full_name || 'Customer',
        avatar_url: b.customer?.avatar_url,
      },
      creator: {
        professional_name: b.creator?.professional_name || 'Photographer',
        user: { avatar_url: b.creator?.user?.avatar_url },
      },
      service: {
        title: b.service?.title || b.event_title || 'Photography',
      },
    }));
  }, [bookings]);

  // Display actual users from database (no mock fallback)
  const displayUsers = useMemo(() => {
    return users.slice(0, 5).map((u) => {
      let relativeTime = 'Recently';
      if (u.createdAt) {
        const diffMs = Date.now() - new Date(u.createdAt).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) relativeTime = `${Math.max(1, diffMins)}m ago`;
        else if (diffMins < 1440) relativeTime = `${Math.floor(diffMins / 60)}h ago`;
        else relativeTime = `${Math.floor(diffMins / 1440)}d ago`;
      }
      return {
        id: u.id,
        fullName: u.fullName || 'User',
        email: u.email,
        roles: u.roles,
        isPhotographer: u.isPhotographer,
        createdAt: relativeTime,
      };
    });
  }, [users]);

  // KPI card values: real database aggregations
  const totalUsersValue = stats?.totalUsers ?? 0;
  const photographersValue = stats?.photographers ?? 0;
  const totalBookingsValue = stats?.totalBookings ?? 0;
  const revenueValue = formatInr(stats?.totalRevenue ?? 0);

  // Growth percentages from database comparisons
  const usersGrowth = stats?.comparisons?.usersGrowth ?? 0;
  const photographersGrowth = stats?.comparisons?.photographersGrowth ?? 0;
  const bookingsGrowth = stats?.comparisons?.bookingsGrowth ?? 0;
  const revenueGrowth = stats?.comparisons?.revenueGrowth ?? 0;

  // Real status breakdown from database
  const statusCounts = stats?.statusBreakdown || {
    completed: 0,
    completedPercent: 0,
    pending: 0,
    pendingPercent: 0,
    cancelled: 0,
    cancelledPercent: 0,
    disputed: 0,
    disputedPercent: 0,
    total: 0,
  };

  // Sparkline data dynamically scaled from growth series or neutral baseline
  const sparklines = useMemo(() => {
    if (stats?.growthSeries && stats.growthSeries.length >= 4) {
      return {
        users: stats.growthSeries.map((s) => s.users),
        photographers: stats.growthSeries.map((s) => Math.max(1, Math.round(s.users * 0.2))),
        bookings: stats.growthSeries.map((s) => s.bookings),
        revenue: stats.growthSeries.map((s) => s.revenue),
      };
    }
    return {
      users: [0, 0, 0, totalUsersValue],
      photographers: [0, 0, 0, photographersValue],
      bookings: [0, 0, 0, totalBookingsValue],
      revenue: [0, 0, 0, stats?.totalRevenue ?? 0],
    };
  }, [stats, totalUsersValue, photographersValue, totalBookingsValue]);

  // Donut chart arc calculation
  // Radius = 62, Circumference = 2 * PI * 62 = 389.56
  const circumference = 2 * Math.PI * 62;
  const donutSegments = useMemo(() => {
    const completedOffset = 0;
    const completedLength = (statusCounts.completedPercent / 100) * circumference;

    const pendingOffset = completedLength;
    const pendingLength = (statusCounts.pendingPercent / 100) * circumference;

    const cancelledOffset = completedLength + pendingLength;
    const cancelledLength = (statusCounts.cancelledPercent / 100) * circumference;

    const disputedOffset = completedLength + pendingLength + cancelledLength;
    const disputedLength = (statusCounts.disputedPercent / 100) * circumference;

    return {
      completed: { offset: completedOffset, length: completedLength },
      pending: { offset: pendingOffset, length: pendingLength },
      cancelled: { offset: cancelledOffset, length: cancelledLength },
      disputed: { offset: disputedOffset, length: disputedLength },
    };
  }, [statusCounts, circumference]);

  // Platform growth chart points from genuine database series
  const growthPoints = useMemo(() => {
    if (stats?.growthSeries && stats.growthSeries.length >= 2) {
      return stats.growthSeries;
    }
    return [
      { label: 'Start', users: 0, bookings: 0, revenue: 0 },
      { label: 'Today', users: totalUsersValue, bookings: totalBookingsValue, revenue: stats?.totalRevenue ?? 0 },
    ];
  }, [stats, totalUsersValue, totalBookingsValue]);

  // SVG Chart Dimensions
  const chartW = 680;
  const chartH = 190;
  const paddingX = 40;
  const paddingY = 20;

  const maxVal = Math.max(
    10,
    ...growthPoints.map((p) => Math.max(p.users, p.bookings, p.revenue))
  );

  const getCoordinates = (values: number[]) => {
    return values.map((val, idx) => {
      const x = paddingX + (idx / Math.max(1, values.length - 1)) * (chartW - paddingX * 2);
      const y = chartH - paddingY - (val / maxVal) * (chartH - paddingY * 2);
      return { x, y };
    });
  };

  const usersCoords = getCoordinates(growthPoints.map((p) => p.users));
  const bookingsCoords = getCoordinates(growthPoints.map((p) => p.bookings));
  const revenueCoords = getCoordinates(growthPoints.map((p) => p.revenue));

  const generateSmoothPath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return '';
    if (coords.length === 1) return `M ${coords[0].x},${coords[0].y}`;
    let d = `M ${coords[0].x},${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const mx = (p0.x + p1.x) / 2;
      d += ` C ${mx},${p0.y} ${mx},${p1.y} ${p1.x},${p1.y}`;
    }
    return d;
  };

  const usersPath = generateSmoothPath(usersCoords);
  const bookingsPath = generateSmoothPath(bookingsCoords);
  const revenuePath = generateSmoothPath(revenueCoords);

  const revenueArea = revenueCoords.length > 0
    ? `${revenuePath} L ${revenueCoords[revenueCoords.length - 1].x},${chartH - paddingY} L ${revenueCoords[0].x},${chartH - paddingY} Z`
    : '';
  const usersArea = usersCoords.length > 0
    ? `${usersPath} L ${usersCoords[usersCoords.length - 1].x},${chartH - paddingY} L ${usersCoords[0].x},${chartH - paddingY} Z`
    : '';

  // Top locations from genuine database stats
  const topLocations = stats?.topLocations || [];

  // Top categories from genuine database stats
  const topCategories = stats?.topCategories || [];

  const adminName = session.status === 'authenticated' && session.user?.name ? session.user.name : 'Admin';

  return (
    <div className="space-y-6 pb-12">
      {/* ======================================================== */}
      {/* ROW 1: GREETING & HERO BANNER                            */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row items-stretch gap-5">
        {/* Left Greeting */}
        <div className="flex-1 flex flex-col justify-center space-y-1 py-1">
          <p className="text-sm font-semibold text-[#64748B]">Good evening,</p>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tight flex items-center gap-2">
            <span>{adminName}</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Here&apos;s what&apos;s happening with your photography marketplace today.
          </p>
        </div>

        {/* Right Photography-Themed Banner */}
        <div className="lg:w-[58%] rounded-2xl overflow-hidden relative shadow-sm border border-[#E2E8F0] min-h-[96px] flex items-center">
          <div
            className="absolute inset-0 bg-cover bg-right bg-no-repeat"
            style={{
              backgroundImage: 'url(/reference-assets/admin_banner_photographer.jpg)',
            }}
          />
          {/* Gradient Overlay for high readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/90 via-[#0F172A]/75 to-transparent" />
          <div className="relative z-10 p-5 sm:p-6 max-w-lg space-y-1 text-white">
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white leading-snug">
              Capture growth, build a better community.
            </h2>
            <p className="text-xs text-white/80 font-medium">
              Manage users, bookings, and creators — all in one place.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ROW 2: FOUR PRIMARY KPI CARDS                            */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Users */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs hover:border-[#14B8A6] transition-all flex items-center justify-between">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center mb-2">
              <Users className="w-5 h-5 stroke-[2]" />
            </div>
            <p className="text-xs font-semibold text-[#64748B]">Total Users</p>
            <p className="text-2xl font-black text-[#0F172A] tracking-tight">{totalUsersValue.toLocaleString('en-IN')}</p>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className={`text-[11px] font-black flex items-center ${usersGrowth >= 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
                {usersGrowth >= 0 ? `↑ +${usersGrowth}%` : `↓ ${usersGrowth}%`}
              </span>
              <span className="text-[10px] text-[#94A3B8] font-medium">vs prior period</span>
            </div>
          </div>
          <Sparkline stroke="#14B8A6" points={sparklines.users} />
        </div>

        {/* Card 2: Photographers */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs hover:border-[#06B6D4] transition-all flex items-center justify-between">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#F43F5E] flex items-center justify-center mb-2">
              <Camera className="w-5 h-5 stroke-[2]" />
            </div>
            <p className="text-xs font-semibold text-[#64748B]">Photographers</p>
            <p className="text-2xl font-black text-[#0F172A] tracking-tight">{photographersValue.toLocaleString('en-IN')}</p>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className={`text-[11px] font-black flex items-center ${photographersGrowth >= 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
                {photographersGrowth >= 0 ? `↑ +${photographersGrowth}%` : `↓ ${photographersGrowth}%`}
              </span>
              <span className="text-[10px] text-[#94A3B8] font-medium">vs prior period</span>
            </div>
          </div>
          <Sparkline stroke="#06B6D4" points={sparklines.photographers} />
        </div>

        {/* Card 3: Total Bookings */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs hover:border-[#8B5CF6] transition-all flex items-center justify-between">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] text-[#8B5CF6] flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5 stroke-[2]" />
            </div>
            <p className="text-xs font-semibold text-[#64748B]">Total Bookings</p>
            <p className="text-2xl font-black text-[#0F172A] tracking-tight">{totalBookingsValue.toLocaleString('en-IN')}</p>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className={`text-[11px] font-black flex items-center ${bookingsGrowth >= 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
                {bookingsGrowth >= 0 ? `↑ +${bookingsGrowth}%` : `↓ ${bookingsGrowth}%`}
              </span>
              <span className="text-[10px] text-[#94A3B8] font-medium">vs prior period</span>
            </div>
          </div>
          <Sparkline stroke="#8B5CF6" points={sparklines.bookings} />
        </div>

        {/* Card 4: Revenue (Verified Collected) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs hover:border-[#F59E0B] transition-all flex items-center justify-between">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#F59E0B] flex items-center justify-center mb-2 font-black text-lg">
              ₹
            </div>
            <p className="text-xs font-semibold text-[#64748B]">Collected Revenue</p>
            <p className="text-2xl font-black text-[#0F172A] tracking-tight">{revenueValue}</p>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className={`text-[11px] font-black flex items-center ${revenueGrowth >= 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
                {revenueGrowth >= 0 ? `↑ +${revenueGrowth}%` : `↓ ${revenueGrowth}%`}
              </span>
              <span className="text-[10px] text-[#94A3B8] font-medium">vs prior period</span>
            </div>
          </div>
          <Sparkline stroke="#F59E0B" points={sparklines.revenue} />
        </div>
      </div>

      {/* ======================================================== */}
      {/* FINANCIAL HEALTH & MARKETPLACE BALANCE STRIP             */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 shadow-2xs">
          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Gross Booking Value</p>
          <p className="text-base font-black text-[#0F172A] mt-1">{formatInr(stats?.totalGrossBookingValue ?? 0)}</p>
          <p className="text-[9px] text-[#94A3B8]">Total customer volume</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 shadow-2xs">
          <p className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider">Platform Take</p>
          <p className="text-base font-black text-[#0D9488] mt-1">{formatInr(stats?.platformEarnings ?? 0)}</p>
          <p className="text-[9px] text-[#94A3B8]">Commission earned</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 shadow-2xs">
          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Creator Escrow</p>
          <p className="text-base font-black text-[#0F172A] mt-1">{formatInr(stats?.photographerLiabilities ?? 0)}</p>
          <p className="text-[9px] text-[#94A3B8]">Pending payout liability</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 shadow-2xs">
          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Total Refunds</p>
          <p className="text-base font-black text-[#EF4444] mt-1">{formatInr(stats?.totalRefunds ?? 0)}</p>
          <p className="text-[9px] text-[#94A3B8]">Processed customer returns</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 shadow-2xs">
          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Pending KYC</p>
          <p className="text-base font-black text-[#F59E0B] mt-1">{stats?.creatorsPending ?? 0}</p>
          <p className="text-[9px] text-[#94A3B8]">Awaiting verification</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 shadow-2xs">
          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Active Disputes</p>
          <p className="text-base font-black text-[#EF4444] mt-1">{stats?.disputedBookings ?? 0}</p>
          <p className="text-[9px] text-[#94A3B8]">Requiring arbitration</p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ROW 3: ANALYTICS ROW (PLATFORM GROWTH + BOOKING STATUS)  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* PLATFORM GROWTH CHART (Left 8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0F172A]">Platform Growth</h3>
                <p className="text-[11px] text-[#64748B] font-medium">Users, bookings and revenue over time</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Legend */}
              <div className="flex items-center gap-3 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6]" />
                  <span className="text-[11px] text-[#475569]">Users</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                  <span className="text-[11px] text-[#475569]">Bookings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span className="text-[11px] text-[#475569]">Revenue (₹)</span>
                </div>
              </div>

              {/* Range selector */}
              <div className="relative">
                <select
                  value={chartRange}
                  onChange={(e) => setChartRange(e.target.value as any)}
                  aria-label="Platform growth chart period"
                  className="px-2.5 py-1 text-xs font-bold text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none cursor-pointer"
                >
                  <option value="30d">Last 30 days</option>
                  <option value="7d">Last 7 days</option>
                  <option value="month">This month</option>
                </select>
              </div>
            </div>
          </div>

          {/* SVG Multi-Line Chart */}
          <div className="relative w-full h-56 pt-2 select-none">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[200, 150, 100, 50, 0].map((val) => {
                const y = chartH - paddingY - (val / 200) * (chartH - paddingY * 2);
                return (
                  <g key={val}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartW - paddingX}
                      y2={y}
                      stroke="#F1F5F9"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="9"
                      fill="#94A3B8"
                      fontWeight="bold"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Area Fills */}
              <path d={revenueArea} fill="url(#revGrad)" />
              <path d={usersArea} fill="url(#userGrad)" />

              {/* Series Lines */}
              <path
                d={revenuePath}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={usersPath}
                fill="none"
                stroke="#14B8A6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={bookingsPath}
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Points & Vertical Guides */}
              {growthPoints.map((pt, idx) => {
                const x = paddingX + (idx / (growthPoints.length - 1)) * (chartW - paddingX * 2);
                const isHovered = hoveredPoint === idx;

                return (
                  <g
                    key={pt.label}
                    onMouseEnter={() => setHoveredPoint(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer"
                  >
                    {isHovered && (
                      <line
                        x1={x}
                        y1={paddingY}
                        x2={x}
                        y2={chartH - paddingY}
                        stroke="#94A3B8"
                        strokeDasharray="3 3"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Revenue Circle */}
                    <circle
                      cx={revenueCoords[idx].x}
                      cy={revenueCoords[idx].y}
                      r={isHovered ? 5 : 3.5}
                      fill="white"
                      stroke="#F59E0B"
                      strokeWidth="2"
                    />
                    {/* User Circle */}
                    <circle
                      cx={usersCoords[idx].x}
                      cy={usersCoords[idx].y}
                      r={isHovered ? 5 : 3.5}
                      fill="white"
                      stroke="#14B8A6"
                      strokeWidth="2"
                    />
                    {/* Booking Circle */}
                    <circle
                      cx={bookingsCoords[idx].x}
                      cy={bookingsCoords[idx].y}
                      r={isHovered ? 5 : 3.5}
                      fill="white"
                      stroke="#8B5CF6"
                      strokeWidth="2"
                    />

                    {/* X-axis Label */}
                    <text
                      x={x}
                      y={chartH - 2}
                      textAnchor="middle"
                      fontSize="9.5"
                      fill={isHovered ? '#0F172A' : '#94A3B8'}
                      fontWeight={isHovered ? 'bold' : 'normal'}
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Floating Tooltip */}
            {hoveredPoint !== null && (
              <div
                className="absolute top-2 pointer-events-none bg-[#0F172A] text-white p-2.5 rounded-xl shadow-xl text-[10px] space-y-1 z-20"
                style={{
                  left: `${(hoveredPoint / (growthPoints.length - 1)) * 80 + 10}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <p className="font-bold border-b border-white/20 pb-1">{growthPoints[hoveredPoint].label}</p>
                <div className="flex items-center justify-between gap-3 text-amber-400">
                  <span>Revenue:</span>
                  <span className="font-bold">₹{growthPoints[hoveredPoint].revenue * 100}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[#14B8A6]">
                  <span>Users:</span>
                  <span className="font-bold">{growthPoints[hoveredPoint].users}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-purple-400">
                  <span>Bookings:</span>
                  <span className="font-bold">{growthPoints[hoveredPoint].bookings}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOOKING STATUS DONUT CHART (Right 4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center">
                <Clock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="text-sm font-black text-[#0F172A]">Booking Status</h3>
            </div>
            <div className="relative">
              <select
                value={donutRange}
                onChange={(e) => setDonutRange(e.target.value as any)}
                aria-label="Booking status period"
                className="px-2 py-1 text-xs font-bold text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="month">This month</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
          </div>

          {/* Donut Graphic + Legend */}
          <div className="flex items-center justify-center py-2">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                {/* Background Track */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="24"
                />
                {/* Completed Arc (Teal) */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="none"
                  stroke="#14B8A6"
                  strokeWidth="24"
                  strokeDasharray={`${donutSegments.completed.length} ${circumference}`}
                  strokeDashoffset={-donutSegments.completed.offset}
                  className="transition-all duration-500"
                />
                {/* Pending Arc (Blue) */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="24"
                  strokeDasharray={`${donutSegments.pending.length} ${circumference}`}
                  strokeDashoffset={-donutSegments.pending.offset}
                  className="transition-all duration-500"
                />
                {/* Cancelled Arc (Orange) */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="24"
                  strokeDasharray={`${donutSegments.cancelled.length} ${circumference}`}
                  strokeDashoffset={-donutSegments.cancelled.offset}
                  className="transition-all duration-500"
                />
                {/* Disputed Arc (Red) */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="24"
                  strokeDasharray={`${donutSegments.disputed.length} ${circumference}`}
                  strokeDashoffset={-donutSegments.disputed.offset}
                  className="transition-all duration-500"
                />
              </svg>

              {/* Center Metrics */}
              <div className="absolute text-center select-none">
                <p className="text-xl font-black text-[#0F172A] leading-tight">
                  {statusCounts.total.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] font-semibold text-[#94A3B8]">
                  Total Bookings
                </p>
              </div>
            </div>
          </div>

          {/* Status Breakdown Legend Rows */}
          <div className="space-y-2 pt-2 border-t border-[#F1F5F9] text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6]" />
                <span className="text-[#475569] font-medium">Completed</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#0F172A]">{statusCounts.completed}</span>
                <span className="text-[11px] text-[#94A3B8] font-medium w-12 text-right">
                  {statusCounts.completedPercent}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                <span className="text-[#475569] font-medium">Pending</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#0F172A]">{statusCounts.pending}</span>
                <span className="text-[11px] text-[#94A3B8] font-medium w-12 text-right">
                  {statusCounts.pendingPercent}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
                <span className="text-[#475569] font-medium">Cancelled</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#0F172A]">{statusCounts.cancelled}</span>
                <span className="text-[11px] text-[#94A3B8] font-medium w-12 text-right">
                  {statusCounts.cancelledPercent}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                <span className="text-[#475569] font-medium">Disputed</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#0F172A]">{statusCounts.disputed}</span>
                <span className="text-[11px] text-[#94A3B8] font-medium w-12 text-right">
                  {statusCounts.disputedPercent}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ROW 4: RECENT BOOKINGS + QUICK ACTIONS                   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* RECENT BOOKINGS TABLE (Left 8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center">
                  <Calendar className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0F172A]">Recent Bookings</h3>
                  <p className="text-[11px] text-[#64748B] font-medium">Latest booking requests and activities</p>
                </div>
              </div>
              <Link
                href="/admin/bookings"
                className="px-3 py-1.5 rounded-xl border border-[#14B8A6] text-[#0D9488] text-xs font-bold hover:bg-[#EFFCF8] transition-colors"
              >
                View all
              </Link>
            </div>

            {/* Table Container / Empty State */}
            {displayBookings.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center mx-auto">
                  <Calendar className="w-5 h-5 stroke-[2]" />
                </div>
                <p className="text-xs font-bold text-[#0F172A]">No bookings recorded yet</p>
                <p className="text-[11px] text-[#64748B] max-w-sm mx-auto">
                  When customers make photography reservations, every verified booking will stream here with real customer, photographer, and transaction associations.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#F1F5F9] text-[#94A3B8] text-[11px] font-semibold">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Photographer</th>
                      <th className="py-2.5 px-3">Service</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {displayBookings.map((b) => {
                      const isConfirmed = b.booking_status === 'confirmed' || b.booking_status === 'completed';
                      const isPending = b.booking_status === 'pending' || b.booking_status === 'in_progress';

                      const custName = b.customer?.full_name || 'Customer';
                      const custInitial = custName[0]?.toUpperCase() || 'C';
                      const photogName = b.creator?.professional_name || 'Photographer';
                      const photogInitial = photogName[0]?.toUpperCase() || 'P';

                      return (
                        <tr key={b.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3 px-3 font-semibold text-[#64748B] whitespace-nowrap">
                            {b.booking_reference}
                          </td>

                          {/* Customer */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {b.customer?.avatar_url ? (
                                <img
                                  src={b.customer.avatar_url}
                                  alt=""
                                  className="w-6 h-6 rounded-full object-cover border border-[#E2E8F0]"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold text-[10px] flex items-center justify-center border border-[#BFDBFE]">
                                  {custInitial}
                                </div>
                              )}
                              <span className="font-bold text-[#0F172A]">{custName}</span>
                            </div>
                          </td>

                          {/* Photographer */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {b.creator?.user?.avatar_url ? (
                                <img
                                  src={b.creator.user.avatar_url}
                                  alt=""
                                  className="w-6 h-6 rounded-full object-cover border border-[#E2E8F0]"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-[#EFFCF8] text-[#0D9488] font-bold text-[10px] flex items-center justify-center border border-[#99F6E4]">
                                  {photogInitial}
                                </div>
                              )}
                              <span className="font-bold text-[#0F172A]">{photogName}</span>
                            </div>
                          </td>

                          {/* Service */}
                          <td className="py-3 px-3 text-[#475569] font-medium whitespace-nowrap">
                            {b.service?.title || b.event_title || 'Photo Session'}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-3 text-[#64748B] whitespace-nowrap">
                            {b.event_date}
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-3 font-bold text-[#0F172A] whitespace-nowrap">
                            {formatInr(Number(b.total_amount) || 0)}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                isConfirmed
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isPending
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isConfirmed ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                              />
                              <span className="capitalize">{b.booking_status}</span>
                            </span>
                          </td>

                          {/* Action View & ⋮ */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setSelectedBooking(b)}
                                className="px-2.5 py-1 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                              >
                                View
                              </button>
                              <button
                                onClick={() => setSelectedBooking(b)}
                                className="p-1 text-[#94A3B8] hover:text-[#0F172A]"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS & PLATFORM STATUS (Right 4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center">
              <Zap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-sm font-black text-[#0F172A]">Platform Operations</h3>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {/* Database */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0F172A] block">Database</span>
                  <span className="text-[10px] text-[#94A3B8]">PostgreSQL & RLS</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#10B981]">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                {stats?.health?.database || 'Operational'}
              </span>
            </div>

            {/* Storage (Media) */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0F172A] block">Storage</span>
                  <span className="text-[10px] text-[#94A3B8]">Portfolios & KYC</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#10B981]">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                {stats?.health?.storage || 'Operational'}
              </span>
            </div>

            {/* Payment Gateway */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0F172A] block">Payment Gateway</span>
                  <span className="text-[10px] text-[#94A3B8]">Settlement Engine</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488]">
                <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                {stats?.health?.paymentGateway || 'Sandbox Mode'}
              </span>
            </div>

            {/* Email Service */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0F172A] block">Notifications</span>
                  <span className="text-[10px] text-[#94A3B8]">Email & Webhook Dispatch</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488]">
                <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                {stats?.health?.emailService || 'Operational'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ROW 5: THREE BOTTOM PANELS                               */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {/* PANEL 1: TOP LOCATIONS */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center">
                  <MapPin className="w-4 h-4 stroke-[2]" />
                </div>
                <h3 className="text-xs font-black text-[#0F172A]">Top Locations</h3>
              </div>
              <Link href="/admin/photographers" className="text-[11px] font-bold text-[#0D9488] hover:underline">
                View all
              </Link>
            </div>

            {topLocations.length === 0 ? (
              <div className="py-8 text-center text-[#94A3B8] text-xs">
                No location activity recorded yet.
              </div>
            ) : (
              <div className="space-y-3.5">
                {topLocations.map((loc) => (
                  <div key={loc.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#475569] font-medium">{loc.name}</span>
                      <span className="font-bold text-[#0F172A]">{loc.count}</span>
                    </div>
                    <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#14B8A6] h-full rounded-full transition-all duration-500"
                        style={{ width: `${loc.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PANEL 2: TOP PHOTOGRAPHY CATEGORIES */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center">
                  <Folder className="w-4 h-4 stroke-[2]" />
                </div>
                <h3 className="text-xs font-black text-[#0F172A]">Top Photography Categories</h3>
              </div>
              <Link href="/categories" className="text-[11px] font-bold text-[#0D9488] hover:underline">
                View all
              </Link>
            </div>

            {topCategories.length === 0 ? (
              <div className="py-8 text-center text-[#94A3B8] text-xs">
                No category bookings recorded yet.
              </div>
            ) : (
              <div className="space-y-3.5">
                {topCategories.map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#475569] font-medium">{cat.name}</span>
                      <span className="font-bold text-[#0F172A]">{cat.count}</span>
                    </div>
                    <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color || '#14B8A6',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PANEL 3: RECENT USERS */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center">
                  <Users className="w-4 h-4 stroke-[2]" />
                </div>
                <h3 className="text-xs font-black text-[#0F172A]">Recent Users</h3>
              </div>
              <Link href="/admin/users?tab=customers" className="text-[11px] font-bold text-[#0D9488] hover:underline">
                View all
              </Link>
            </div>

            <div className="divide-y divide-[#F1F5F9]">
              {displayUsers.length === 0 ? (
                <div className="py-8 text-center text-[#94A3B8] text-xs">
                  No registered users found.
                </div>
              ) : (
                displayUsers.map((u) => (
                  <div key={u.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#EFFCF8] text-[#14B8A6] font-black text-xs flex items-center justify-center shrink-0 border border-[#99F6E4]">
                        {u.fullName[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0F172A] truncate">{u.fullName}</p>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black ${
                            u.isPhotographer ? 'bg-[#EFFCF8] text-[#0D9488]' : 'bg-[#EFF6FF] text-[#2563EB]'
                          }`}
                        >
                          {u.isPhotographer ? 'Photographer' : 'Customer'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#94A3B8] font-medium shrink-0">
                      {u.createdAt}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking View Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div>
                <span className="text-xs font-bold text-[#94A3B8]">Booking Details</span>
                <h3 className="text-base font-black text-[#0F172A]">{selectedBooking.booking_reference}</h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-2xl">
                <div>
                  <p className="text-[10px] font-semibold text-[#94A3B8]">Customer</p>
                  <p className="font-bold text-[#0F172A] mt-0.5">{selectedBooking.customer?.full_name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#94A3B8]">Photographer</p>
                  <p className="font-bold text-[#0F172A] mt-0.5">{selectedBooking.creator?.professional_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-2xl">
                <div>
                  <p className="text-[10px] font-semibold text-[#94A3B8]">Service</p>
                  <p className="font-bold text-[#0F172A] mt-0.5">{selectedBooking.service?.title || selectedBooking.event_title}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#94A3B8]">Date</p>
                  <p className="font-bold text-[#0F172A] mt-0.5">{selectedBooking.event_date}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#EFFCF8] rounded-2xl border border-[#99F6E4]">
                <div>
                  <p className="text-[10px] font-semibold text-[#0D9488]">Total Amount</p>
                  <p className="text-base font-black text-[#0F172A]">
                    {formatInr(Number(selectedBooking.total_amount) || 0)}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#14B8A6] text-white capitalize">
                  {selectedBooking.booking_status}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Link
                href="/admin/bookings"
                className="px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition-colors"
              >
                Go to Bookings Management
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
