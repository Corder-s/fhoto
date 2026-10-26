'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart2,
  TrendingUp,
  Calendar,
  RefreshCw,
  MapPin,
  Folder,
  Clock,
  IndianRupee,
  Users,
  Camera,
} from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  customers: number;
  photographers: number;
  totalBookings: number;
  totalRevenue: number;
  totalGrossBookingValue?: number;
  platformEarnings?: number;
  photographerLiabilities?: number;
  totalRefunds?: number;
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
  }>;
}

const formatInr = (n: number | undefined | null) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n || 0);
};

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<'30d' | '7d' | 'month' | 'today'>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stats?range=${range}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load analytics (${res.status})`);
      const body = await res.json();
      setData(body.stats);
    } catch (err: any) {
      setError(err?.message || 'Could not load analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const topLocations = data?.topLocations || [];
  const topCategories = data?.topCategories || [];
  const status = data?.statusBreakdown;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Marketplace Analytics & Reports</h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Data-driven performance breakdown of booking volume, platform revenue, and city hubs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs font-bold text-[#0F172A] shadow-2xs focus:outline-none focus:border-[#14B8A6] cursor-pointer"
          >
            <option value="30d">Last 30 Days</option>
            <option value="7d">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="today">Today</option>
          </select>

          <button
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#14B8A6]' : 'text-[#64748B]'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs">
          <p className="text-xs font-bold text-[#64748B]">Gross Booking Value</p>
          <p className="text-2xl font-black text-[#0F172A] mt-1">{formatInr(data?.totalGrossBookingValue ?? 0)}</p>
          <p className="text-[10px] text-[#94A3B8] mt-0.5">Total customer spend</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs">
          <p className="text-xs font-bold text-[#0D9488]">Platform Revenue</p>
          <p className="text-2xl font-black text-[#0D9488] mt-1">{formatInr(data?.platformEarnings ?? 0)}</p>
          <p className="text-[10px] text-[#94A3B8] mt-0.5">Retained commission</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs">
          <p className="text-xs font-bold text-[#64748B]">Verified Collected</p>
          <p className="text-2xl font-black text-[#0F172A] mt-1">{formatInr(data?.totalRevenue ?? 0)}</p>
          <p className="text-[10px] text-[#94A3B8] mt-0.5">Cleared gateway settlements</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs">
          <p className="text-xs font-bold text-[#64748B]">Total Bookings</p>
          <p className="text-2xl font-black text-[#0F172A] mt-1">{data?.totalBookings ?? 0}</p>
          <p className="text-[10px] text-[#94A3B8] mt-0.5">Across all services</p>
        </div>
      </div>

      {/* Two Column Section: Booking Status Breakdown & City Hubs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Status Distribution */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#F1F5F9]">
            <Clock className="w-5 h-5 text-[#14B8A6]" />
            <h3 className="text-sm font-black text-[#0F172A]">Booking Status Distribution</h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#0F172A]">Completed</span>
                <span className="font-bold text-[#0F172A]">{status?.completed ?? 0} ({status?.completedPercent ?? 0}%)</span>
              </div>
              <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                <div className="bg-[#14B8A6] h-full rounded-full" style={{ width: `${status?.completedPercent ?? 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#0F172A]">Pending / In Progress</span>
                <span className="font-bold text-[#0F172A]">{status?.pending ?? 0} ({status?.pendingPercent ?? 0}%)</span>
              </div>
              <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                <div className="bg-[#3B82F6] h-full rounded-full" style={{ width: `${status?.pendingPercent ?? 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#0F172A]">Cancelled / Declined</span>
                <span className="font-bold text-[#0F172A]">{status?.cancelled ?? 0} ({status?.cancelledPercent ?? 0}%)</span>
              </div>
              <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                <div className="bg-[#F97316] h-full rounded-full" style={{ width: `${status?.cancelledPercent ?? 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#0F172A]">Disputed</span>
                <span className="font-bold text-[#0F172A]">{status?.disputed ?? 0} ({status?.disputedPercent ?? 0}%)</span>
              </div>
              <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                <div className="bg-[#EF4444] h-full rounded-full" style={{ width: `${status?.disputedPercent ?? 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Top Location Hubs */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#F1F5F9]">
            <MapPin className="w-5 h-5 text-[#14B8A6]" />
            <h3 className="text-sm font-black text-[#0F172A]">Top Geographic Hubs</h3>
          </div>

          {topLocations.length === 0 ? (
            <div className="py-8 text-center text-[#94A3B8] text-xs">
              No geographical activity recorded in this period.
            </div>
          ) : (
            <div className="space-y-3">
              {topLocations.map((loc) => (
                <div key={loc.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#475569]">{loc.name}</span>
                    <span className="font-bold text-[#0F172A]">{loc.count} bookings</span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#14B8A6] h-full rounded-full transition-all"
                      style={{ width: `${loc.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
