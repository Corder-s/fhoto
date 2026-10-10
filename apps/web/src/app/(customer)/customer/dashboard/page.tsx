import Link from 'next/link';
import { 
  KeyRound, 
  MapPin, 
  Clock, 
  Camera, 
  ShieldCheck, 
  Download, 
  Star, 
  ArrowRight 
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';

export default function CustomerDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
            Welcome back, Aarav 👋
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Track your confirmed shoots, verify photographer arrivals, and download delivered photos.
          </p>
        </div>

        <Link href="/photographers">
          <Button variant="primary" size="md">
            + Book Another Shoot
          </Button>
        </Link>
      </div>

      {/* ACTIVE CONFIRMED SHOOT (WITH SHOOT-START OTP) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
            Active Booking in Progress
          </h2>
          <Badge variant="warning" size="sm">
            Confirmed • Photographer En Route
          </Badge>
        </div>

        <Card className="border-brand/40 bg-gradient-to-br from-white to-brand-subtle/20 p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Booking Details */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-ink-muted">
                <span>Ref: SNP-2026-98124</span>
                <span>•</span>
                <span>Signature Portrait Package</span>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-ink-primary">
                  Outdoor Portrait Shoot with Kabir Varma
                </h3>
                <p className="text-sm text-ink-secondary flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-brand shrink-0" />
                  <span>Lodhi Art District, New Delhi • Scheduled 4:00 PM Today</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="px-3 py-1 rounded-card-sm text-xs font-semibold bg-white border border-contour-subtle text-ink-primary">
                  ⏳ ETA: 18 mins away
                </span>
                <span className="px-3 py-1 rounded-card-sm text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                  💳 ₹7,500 in Escrow
                </span>
              </div>
            </div>

            {/* SHOOT-START OTP CARD (CRITICAL PRODUCT FEATURE) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-card-md border-2 border-brand shadow-card text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-brand">
                <KeyRound className="w-4 h-4" />
                <span>Shoot-Start Verification OTP</span>
              </div>

              <div className="text-4xl sm:text-5xl font-mono font-black text-ink-primary tracking-[0.25em] bg-canvas-primary py-3 rounded-card-sm border border-contour-strong">
                482910
              </div>

              <p className="text-xs text-ink-secondary leading-relaxed">
                ⚠️ <strong>Important:</strong> Share this code in person <em>only</em> when the photographer reaches your venue to start the session timer.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* RECENT DELIVERIES & PAST SHOOTS */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
          Past Shoots & Delivered Galleries
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Item 1 */}
          <Card hoverEffect className="p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="success" size="sm">
                  Photos Delivered
                </Badge>
                <span className="text-xs text-ink-muted">Oct 2, 2026</span>
              </div>
              <h3 className="text-base font-bold text-ink-primary">
                Pre-Wedding Golden Hour Session
              </h3>
              <p className="text-xs text-ink-secondary">
                Photographer: <strong>Ananya Deshmukh</strong> • 42 High-Res Photos
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-contour-subtle flex items-center justify-between">
              <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                Download Gallery ZIP
              </Button>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>Reviewed 5.0</span>
              </div>
            </div>
          </Card>

          {/* Item 2 */}
          <Card hoverEffect className="p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="success" size="sm">
                  Photos Delivered
                </Badge>
                <span className="text-xs text-ink-muted">Sep 15, 2026</span>
              </div>
              <h3 className="text-base font-bold text-ink-primary">
                Artisan Coffee Cafe Commercial Shoot
              </h3>
              <p className="text-xs text-ink-secondary">
                Photographer: <strong>Rohan Sengupta</strong> • 28 High-Res Photos
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-contour-subtle flex items-center justify-between">
              <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                Download Gallery ZIP
              </Button>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>Reviewed 5.0</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
