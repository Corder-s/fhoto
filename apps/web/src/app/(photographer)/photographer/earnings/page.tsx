'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  PieChart
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { DemoNoticeBanner } from '../../../../components/photographer/DemoNoticeBanner';
import { INITIAL_BOOKINGS } from '../../../../data/photographerDashboardData';

export default function PhotographerEarningsPage() {
  const financialSummary = {
    grossBookingValue: 185000,
    platformFee: 37000, // 20%
    netCreatorEarnings: 148000, // 80%
    inEscrowPending: 6000,
    availableBalance: 42800,
    settledPayouts: 99200,
  };

  const monthlyHistory = [
    { month: 'October 2026 (Month-to-Date)', gross: 56750, net: 45400, shoots: 7 },
    { month: 'September 2026', gross: 68500, net: 54800, shoots: 8 },
    { month: 'August 2026', gross: 59750, net: 47800, shoots: 6 },
  ];

  const categoryBreakdown = [
    { name: 'Portrait Photography', percentage: 42, amount: 62160, color: 'bg-brand' },
    { name: 'Reels & Creator Shoots', percentage: 28, amount: 41440, color: 'bg-amber-500' },
    { name: 'Couple & Pre-Wedding', percentage: 20, amount: 29600, color: 'bg-emerald-500' },
    { name: 'Event Coverage', percentage: 10, amount: 14800, color: 'bg-blue-500' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <DemoNoticeBanner moduleName="Financial Ledger & Earnings Overview" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
            Creator Earnings & Revenue
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Track gross booking volume, verified 80% net payouts, escrow safeguards, and monthly revenue.
          </p>
        </div>

        <Link href="/photographer/payouts">
          <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Manage Payouts & UPI
          </Button>
        </Link>
      </div>

      {/* HIGH-LEVEL SCORECARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card className="space-y-2 border-brand/30 bg-white">
          <p className="text-xs uppercase font-extrabold text-ink-muted">Available for Withdrawal</p>
          <p className="text-3xl sm:text-4xl font-black text-green-600">
            ₹{financialSummary.availableBalance.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-green-700 font-semibold">Ready for instant UPI settlement</span>
            <Link href="/photographer/payouts" className="font-bold text-brand hover:underline">
              Withdraw →
            </Link>
          </div>
        </Card>

        <Card className="space-y-2 bg-white">
          <p className="text-xs uppercase font-extrabold text-ink-muted">In Escrow (Secured)</p>
          <p className="text-3xl sm:text-4xl font-black text-brand">
            ₹{financialSummary.inEscrowPending.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-ink-muted">
            Held in escrow • Released upon client gallery approval
          </p>
        </Card>

        <Card className="space-y-2 bg-white">
          <p className="text-xs uppercase font-extrabold text-ink-muted">All-Time Net Earnings (80%)</p>
          <p className="text-3xl sm:text-4xl font-black text-ink-primary">
            ₹{financialSummary.netCreatorEarnings.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-ink-muted">
            From ₹{financialSummary.grossBookingValue.toLocaleString('en-IN')} Gross Volume
          </p>
        </Card>
      </div>

      {/* 80/20 ESCROW TRANSPARENCY CARD */}
      <Card className="p-6 sm:p-8 bg-canvas-primary border border-contour-strong space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand" />
          <h2 className="text-base font-bold text-ink-primary">
            SnapShoot 80/20 Revenue Model Transparency
          </h2>
        </div>
        <p className="text-xs text-ink-secondary leading-relaxed max-w-3xl">
          Photographers keep <strong>80% of every rupee booked</strong>. The remaining 20% platform commission covers client payment gateway processing (Razorpay/UPI), cloud storage proofing servers, escrow dispute resolution, and marketing customer acquisition.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3 bg-white rounded-card-sm border border-contour-subtle text-xs space-y-1">
            <span className="text-ink-muted">All-Time Gross Volume</span>
            <p className="text-lg font-bold text-ink-primary">₹{financialSummary.grossBookingValue.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-3 bg-white rounded-card-sm border border-contour-subtle text-xs space-y-1">
            <span className="text-ink-muted">SnapShoot Commission (20%)</span>
            <p className="text-lg font-bold text-ink-muted">-₹{financialSummary.platformFee.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-3 bg-white rounded-card-sm border border-brand/50 text-xs space-y-1">
            <span className="text-brand font-bold">Creator Net Earnings (80%)</span>
            <p className="text-lg font-bold text-brand">₹{financialSummary.netCreatorEarnings.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </Card>

      {/* CATEGORY & MONTHLY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Category Share */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-muted">
              Earnings by Category
            </h3>
            <PieChart className="w-4 h-4 text-ink-muted" />
          </div>

          <Card className="p-5 space-y-4">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name} className="space-y-1.5 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-ink-primary">{cat.name}</span>
                  <span>₹{cat.amount.toLocaleString('en-IN')} ({cat.percentage}%)</span>
                </div>
                <div className="w-full bg-canvas-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className={`${cat.color} h-2 rounded-full`}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Monthly Performance */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-muted">
              Monthly Earnings Performance
            </h3>
            <span className="text-xs font-mono text-ink-muted">Q3 - Q4 2026</span>
          </div>

          <div className="space-y-3">
            {monthlyHistory.map((m) => (
              <Card key={m.month} className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-ink-primary">{m.month}</h4>
                  <p className="text-xs text-ink-muted">{m.shoots} completed shoots</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-extrabold text-ink-primary">
                    ₹{m.net.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-ink-muted">Gross: ₹{m.gross.toLocaleString('en-IN')}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT BOOKINGS LEDGER */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-contour-subtle pb-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-primary">
            Recent Shoot Earnings Ledger
          </h3>
          <span className="text-xs font-mono text-ink-muted">Sample Ledger Data</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-contour-subtle text-ink-muted font-bold uppercase tracking-wider">
                <th className="py-2.5">Booking Ref</th>
                <th className="py-2.5">Client & Service</th>
                <th className="py-2.5">Date</th>
                <th className="py-2.5 text-right">Gross Amount</th>
                <th className="py-2.5 text-right">Commission (20%)</th>
                <th className="py-2.5 text-right">Net Creator Payout</th>
                <th className="py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-contour-subtle">
              {INITIAL_BOOKINGS.slice(0, 5).map((b) => (
                <tr key={b.id} className="hover:bg-canvas-secondary/40 transition-colors">
                  <td className="py-3 font-mono font-bold text-ink-primary">{b.id}</td>
                  <td className="py-3">
                    <p className="font-bold text-ink-primary">{b.customerName}</p>
                    <p className="text-ink-muted">{b.category}</p>
                  </td>
                  <td className="py-3 text-ink-muted">{b.date}</td>
                  <td className="py-3 text-right">₹{b.grossAmount.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right text-ink-muted">-₹{b.platformFee.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right font-extrabold text-brand">
                    ₹{b.netEarnings.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 text-center">
                    <Badge variant={b.status === 'COMPLETED' ? 'success' : 'neutral'} size="sm">
                      {b.status}
                    </Badge>
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
