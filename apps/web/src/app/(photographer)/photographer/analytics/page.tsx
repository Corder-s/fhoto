'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Download,
  ShieldCheck,
  Zap,
  Sparkles,
  Lock,
  Eye,
  Users,
  Award,
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { DemoNoticeBanner } from '../../../../components/photographer/DemoNoticeBanner';
import {
  getStoredSubscription,
  hasEntitlement,
  getPlanDetails,
} from '../../../../lib/subscriptionService';
import { PlanTier } from '@snapshoot/shared';

export default function PhotographerAnalyticsPage() {
  const [subscription, setSubscription] = useState(getStoredSubscription);
  const [hasAdvancedAnalytics, setHasAdvancedAnalytics] = useState(true);

  useEffect(() => {
    const updateSub = () => {
      const current = getStoredSubscription();
      setSubscription(current);
      setHasAdvancedAnalytics(hasEntitlement('hasAdvancedAnalytics'));
    };

    updateSub();
    window.addEventListener('snapshoot:subscription-change', updateSub);
    return () => window.removeEventListener('snapshoot:subscription-change', updateSub);
  }, []);

  const plan = getPlanDetails(subscription.tier);

  // Core verified business financial metrics
  const financialSummary = {
    grossBookingValue: 185000,
    platformFee: 37000, // 20%
    netCreatorEarnings: 148000, // 80%
    completedShoots: 147,
    avgBookingValue: 12585,
    onTimeRate: 100,
    profileViews30Days: 1420,
    inquiryConversionRate: 12.4,
  };

  const monthlyLedger = [
    {
      month: 'October 2026 (Month-to-Date)',
      gross: 56750,
      fee: 11350,
      net: 45400,
      shoots: 7,
      status: 'In Progress (Escrow Active)',
    },
    {
      month: 'September 2026',
      gross: 68500,
      fee: 13700,
      net: 54800,
      shoots: 8,
      status: 'Fully Settled via UPI',
    },
    {
      month: 'August 2026',
      gross: 59750,
      fee: 11950,
      net: 47800,
      shoots: 6,
      status: 'Fully Settled via UPI',
    },
  ];

  const categoryDistribution = [
    { name: 'Portrait Photography', share: 42, revenue: 62160, color: 'bg-brand' },
    { name: 'Reels & Creator Shoots', share: 28, revenue: 41440, color: 'bg-amber-500' },
    { name: 'Couple & Pre-Wedding', share: 20, revenue: 29600, color: 'bg-emerald-500' },
    { name: 'Corporate Events & Architecture', share: 10, revenue: 14800, color: 'bg-blue-500' },
  ];

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Month,Gross Booking Value,Marketplace Fee (20%),Net Creator Payout (80%),Shoots Completed,Status\n' +
      monthlyLedger
        .map((r) => `"${r.month}",${r.gross},${r.fee},${r.net},${r.shoots},"${r.status}"`)
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `snapshoot_financial_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <DemoNoticeBanner moduleName="Business Performance & Financial Analytics" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand/10 text-brand">
              SaaS Business Suite
            </span>
            <span className="text-xs text-ink-muted">· Commercial Metrics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight mt-1">
            Studio Performance &amp; Analytics
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Understand gross booking volume, commission breakdowns, client acquisition channels, and category yield.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV Ledger
          </Button>
          <Link href="/photographer/payouts">
            <Button variant="primary" size="md" leftIcon={<DollarSign className="w-4 h-4" />}>
              Payouts &amp; UPI
            </Button>
          </Link>
        </div>
      </div>

      {/* Entitlement Banner if on FREE Plan */}
      {!hasAdvancedAnalytics && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-ink-primary">
                Advanced Cohort Analytics &amp; Profit Yield (PRO Feature)
              </h4>
              <p className="text-xs text-ink-secondary">
                You are currently on the <span className="font-bold">{plan.name}</span> plan. Upgrade to PRO to view deep customer lifetime value, category margin breakdown, and conversion funnel metrics.
              </p>
            </div>
          </div>
          <Link href="/photographer/subscription">
            <Button variant="primary" size="sm" leftIcon={<Zap className="w-4 h-4" />}>
              Upgrade to PRO
            </Button>
          </Link>
        </div>
      )}

      {/* Primary KPI Scorecard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border-contour-subtle space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Gross Booking Volume (GBV)</p>
          <p className="text-2xl sm:text-3xl font-black text-ink-primary">₹1,85,000</p>
          <p className="text-[11px] text-ink-muted">Across 147 completed customer shoots</p>
        </Card>

        <Card className="p-5 bg-white border-contour-subtle space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Net Creator Earnings (80%)</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">₹1,48,000</p>
          <p className="text-[11px] text-emerald-700 font-bold">Guaranteed instant settlement</p>
        </Card>

        <Card className="p-5 bg-white border-contour-subtle space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Marketplace Commission (20%)</p>
          <p className="text-2xl sm:text-3xl font-black text-ink-secondary">₹37,000</p>
          <p className="text-[11px] text-ink-muted">Platform escrow, marketing &amp; insurance</p>
        </Card>

        <Card className="p-5 bg-white border-contour-subtle space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Average Shoot Value</p>
          <p className="text-2xl sm:text-3xl font-black text-brand">₹12,585</p>
          <p className="text-[11px] text-ink-muted">100% on-time fulfillment score</p>
        </Card>
      </div>

      {/* Secondary Engagement & Audience Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-white border-contour-subtle flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Profile Views (30 Days)</p>
            <p className="text-2xl font-black text-ink-primary">{financialSummary.profileViews30Days}</p>
            <p className="text-[11px] text-ink-muted">Organic marketplace search</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 bg-white border-contour-subtle flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Inquiry Conversion</p>
            <p className="text-2xl font-black text-emerald-600">{financialSummary.inquiryConversionRate}%</p>
            <p className="text-[11px] text-ink-muted">Profile visit to confirmed booking</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 bg-white border-contour-subtle flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Client Repeat Rate</p>
            <p className="text-2xl font-black text-brand">34%</p>
            <p className="text-[11px] text-ink-muted">Influencers &amp; recurring corporate clients</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-orange-50 text-brand flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Shoot Category Yield Breakdown */}
      <Card className="p-6 bg-white border-contour-subtle space-y-6">
        <div className="flex items-center justify-between border-b border-contour-subtle pb-4">
          <div>
            <h3 className="text-base font-bold text-ink-primary">Category Distribution &amp; Revenue Yield</h3>
            <p className="text-xs text-ink-secondary mt-0.5">
              Verified breakdown of earnings by photoshoot category
            </p>
          </div>
          <Badge variant="brand" size="sm">
            Total Yield: ₹1,48,000
          </Badge>
        </div>

        {/* Stacked Progress Bar */}
        <div className="space-y-2">
          <div className="h-4 w-full rounded-full bg-canvas-secondary flex overflow-hidden">
            {categoryDistribution.map((cat) => (
              <div
                key={cat.name}
                style={{ width: `${cat.share}%` }}
                className={`${cat.color} h-full transition-all`}
                title={`${cat.name}: ${cat.share}%`}
              />
            ))}
          </div>
        </div>

        {/* Category Details Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {categoryDistribution.map((cat) => (
            <div key={cat.name} className="p-3.5 rounded-card-sm bg-canvas-primary border border-contour-subtle space-y-1">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${cat.color}`} />
                <p className="text-xs font-bold text-ink-primary truncate">{cat.name}</p>
              </div>
              <p className="text-lg font-black text-ink-primary">₹{cat.revenue.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-ink-muted">{cat.share}% of creator revenue</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Monthly Financial Ledger Table */}
      <Card className="p-6 bg-white border-contour-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-contour-subtle pb-4">
          <div>
            <h3 className="text-base font-bold text-ink-primary">Monthly Financial Settlement Ledger</h3>
            <p className="text-xs text-ink-secondary mt-0.5">
              Transparent accounting of Gross volume, 20% platform charge, and 80% net payouts
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-contour-subtle text-ink-muted font-extrabold uppercase tracking-wider">
                <th className="pb-3">Period</th>
                <th className="pb-3">Shoots</th>
                <th className="pb-3">Gross Booking</th>
                <th className="pb-3">Platform Fee (20%)</th>
                <th className="pb-3">Net Payout (80%)</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-contour-subtle">
              {monthlyLedger.map((row) => (
                <tr key={row.month} className="hover:bg-canvas-secondary/50 transition-colors">
                  <td className="py-3.5 font-bold text-ink-primary">{row.month}</td>
                  <td className="py-3.5 text-ink-secondary">{row.shoots}</td>
                  <td className="py-3.5 font-semibold text-ink-primary">₹{row.gross.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 text-ink-muted">₹{row.fee.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 font-black text-emerald-600">₹{row.net.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-canvas-primary text-ink-primary border border-contour-subtle">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
