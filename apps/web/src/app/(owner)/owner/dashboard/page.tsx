'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles,
  Layers,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  PieChart,
  LogOut
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { useAuth } from '../../../../lib/auth';

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand/10 text-brand">
              Platform Executive Suite
            </span>
            <span className="text-xs text-ink-muted">· Dual-Engine Monetization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary tracking-tight mt-1">
            Executive Marketplace & SaaS Analytics
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Real-time financial performance combining marketplace take-rates and photographer SaaS recurring subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="brand" size="md">
            Live Production Metrics
          </Badge>
          <button
            onClick={handleLogout}
            id="owner-dashboard-action-logout-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold transition-all shadow-subtle hover:shadow-xs cursor-pointer"
            title="Sign out of owner dashboard"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* COMBINED REVENUE HIGHLIGHT */}
      <div className="bg-gradient-to-r from-ink-primary to-zinc-900 text-white rounded-card-lg p-6 sm:p-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-white/60">Combined Platform Net Revenue</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl sm:text-4xl font-black text-white">₹9,58,730</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +28.4% MoM
              </span>
            </div>
            <p className="text-xs text-white/70">
              Total monthly net revenue realized across commission & SaaS
            </p>
          </div>

          <div className="md:pl-6 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-white/60">Engine A: Marketplace Commission (20%)</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-brand">₹3,69,000</span>
              <span className="text-xs text-white/70">38.5% share</span>
            </div>
            <p className="text-xs text-white/70">
              From ₹18,45,000 Gross Booking Value (GBV)
            </p>
          </div>

          <div className="md:pl-6 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-white/60">Engine B: Creator SaaS MRR</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">₹5,89,730</span>
              <span className="text-xs text-white/70">61.5% share</span>
            </div>
            <p className="text-xs text-white/70">
              Annual Run Rate (ARR): ₹70,76,760
            </p>
          </div>
        </div>
      </div>

      {/* ENGINE B: SAAS BUSINESS RECURRING METRICS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink-muted flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand" />
            <span>SaaS Business Subscriptions (MRR / ARR Breakdown)</span>
          </h2>
          <span className="text-xs text-ink-secondary font-medium">305 Paid Creator Subscriptions · 1.4% Churn</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="p-6 border-l-4 border-l-zinc-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Starter Tier (Free)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-bold">Freemium</span>
            </div>
            <p className="text-2xl font-black text-ink-primary mt-3">180 Creators</p>
            <div className="space-y-1 text-xs text-ink-secondary mt-2">
              <p>Monthly SaaS Revenue: <strong>₹0 / mo</strong></p>
              <p>Platform Commission: <strong>25% take-rate</strong></p>
              <p>Package Limit: <strong>Max 2 listings</strong></p>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-brand">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">Pro Studio Tier (Most Popular)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">₹1,999/mo</span>
            </div>
            <p className="text-2xl font-black text-ink-primary mt-3">245 Studios</p>
            <div className="space-y-1 text-xs text-ink-secondary mt-2">
              <p>Monthly SaaS Revenue: <strong className="text-brand">₹4,89,755 / mo</strong></p>
              <p>Platform Commission: <strong>20% take-rate</strong></p>
              <p>Client CRM & 20GB Cloud Proofing: <strong>Included</strong></p>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-purple-600">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Business Agency Tier</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">₹3,999/mo</span>
            </div>
            <p className="text-2xl font-black text-ink-primary mt-3">25 Agencies</p>
            <div className="space-y-1 text-xs text-ink-secondary mt-2">
              <p>Monthly SaaS Revenue: <strong className="text-purple-700">₹99,975 / mo</strong></p>
              <p>Platform Commission: <strong>15% VIP take-rate</strong></p>
              <p>Multi-shooter Studio Team: <strong>Up to 5 seats</strong></p>
            </div>
          </Card>
        </div>
      </div>

      {/* ENGINE A: MARKETPLACE TRANSACTIONAL METRICS */}
      <div className="space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink-muted flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-brand" />
          <span>Marketplace Transactional Volume & Escrow Settlements</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="space-y-2 p-5">
            <p className="text-xs uppercase font-bold text-ink-muted">Gross Booking Value (GBV)</p>
            <p className="text-3xl font-black text-ink-primary">₹18,45,000</p>
            <div className="flex items-center gap-1 text-xs font-bold text-green-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+24.6% vs last month</span>
            </div>
          </Card>

          <Card className="space-y-2 p-5">
            <p className="text-xs uppercase font-bold text-ink-muted">Platform Commission</p>
            <p className="text-3xl font-black text-brand">₹3,69,000</p>
            <div className="flex items-center gap-1 text-xs font-bold text-green-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Effective Take-Rate: 20.0%</span>
            </div>
          </Card>

          <Card className="space-y-2 p-5">
            <p className="text-xs uppercase font-bold text-ink-muted">Completed Shoots</p>
            <p className="text-3xl font-black text-ink-primary">312</p>
            <div className="flex items-center gap-1 text-xs font-bold text-green-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>98.2% Fulfillment Rate</span>
            </div>
          </Card>

          <Card className="space-y-2 p-5">
            <p className="text-xs uppercase font-bold text-ink-muted">Average Order Value (AOV)</p>
            <p className="text-3xl font-black text-ink-primary">₹5,910</p>
            <div className="flex items-center gap-1 text-xs font-bold text-ink-secondary">
              <span>Across 6 active genres</span>
            </div>
          </Card>
        </div>
      </div>

      {/* GEOGRAPHIC MARKET PERFORMANCE */}
      <div className="space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink-muted">
          City-Level Marketplace Liquidity
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink-primary">Delhi NCR</h3>
              <Badge variant="brand" size="sm">
                48% of Volume
              </Badge>
            </div>
            <div className="space-y-1 text-xs text-ink-secondary">
              <p>GBV: <strong>₹8,85,600</strong></p>
              <p>Active Verified Creators: <strong>142</strong></p>
              <p>Avg Match Time: <strong>4.2 minutes</strong></p>
            </div>
          </Card>

          <Card className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink-primary">Mumbai</h3>
              <Badge variant="brand" size="sm">
                32% of Volume
              </Badge>
            </div>
            <div className="space-y-1 text-xs text-ink-secondary">
              <p>GBV: <strong>₹5,90,400</strong></p>
              <p>Active Verified Creators: <strong>98</strong></p>
              <p>Avg Match Time: <strong>5.8 minutes</strong></p>
            </div>
          </Card>

          <Card className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink-primary">Bengaluru</h3>
              <Badge variant="brand" size="sm">
                20% of Volume
              </Badge>
            </div>
            <div className="space-y-1 text-xs text-ink-secondary">
              <p>GBV: <strong>₹3,69,000</strong></p>
              <p>Active Verified Creators: <strong>65</strong></p>
              <p>Avg Match Time: <strong>6.1 minutes</strong></p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
