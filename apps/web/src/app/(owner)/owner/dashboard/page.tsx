import Link from 'next/link';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles 
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';

export default function OwnerDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
          Executive Platform Analytics
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          High-level overview of marketplace liquidity, Gross Booking Value (GBV), commission capture, and unit economics.
        </p>
      </div>

      {/* EXECUTIVE KPI SCORECARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="space-y-2">
          <p className="text-xs uppercase font-bold text-ink-muted">Gross Booking Value (GBV)</p>
          <p className="text-3xl font-black text-ink-primary">₹18,45,000</p>
          <div className="flex items-center gap-1 text-xs font-bold text-green-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+24.6% vs last month</span>
          </div>
        </Card>

        <Card className="space-y-2">
          <p className="text-xs uppercase font-bold text-ink-muted">Platform Commission (20%)</p>
          <p className="text-3xl font-black text-brand">₹3,69,000</p>
          <div className="flex items-center gap-1 text-xs font-bold text-green-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Net Take-Rate: 20.0%</span>
          </div>
        </Card>

        <Card className="space-y-2">
          <p className="text-xs uppercase font-bold text-ink-muted">Completed Shoots</p>
          <p className="text-3xl font-black text-ink-primary">312</p>
          <div className="flex items-center gap-1 text-xs font-bold text-green-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>98.2% Fulfillment Rate</span>
          </div>
        </Card>

        <Card className="space-y-2">
          <p className="text-xs uppercase font-bold text-ink-muted">Average Order Value (AOV)</p>
          <p className="text-3xl font-black text-ink-primary">₹5,910</p>
          <div className="flex items-center gap-1 text-xs font-bold text-ink-secondary">
            <span>Across 6 active genres</span>
          </div>
        </Card>
      </div>

      {/* GEOGRAPHIC MARKET PERFORMANCE */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
          City-Level Marketplace Liquidity
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="space-y-3">
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

          <Card className="space-y-3">
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

          <Card className="space-y-3">
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
