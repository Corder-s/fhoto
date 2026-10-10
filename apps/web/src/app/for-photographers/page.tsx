import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { 
  ShieldCheck, 
  Wallet, 
  Calendar, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  Camera 
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function ForPhotographersPage() {
  const BENEFITS = [
    {
      title: 'Guaranteed 80% Payouts',
      description: 'Zero payment chasing. Clients pay into platform escrow before the shoot starts. Payouts transfer directly to your bank account via UPI / NEFT.',
      icon: <Wallet className="w-6 h-6 text-brand" />,
    },
    {
      title: 'Control Your Schedule',
      description: 'You decide when and where you shoot. Set custom travel radii, block off personal days, or toggle instant mode for shoots within 15 km.',
      icon: <Calendar className="w-6 h-6 text-brand" />,
    },
    {
      title: 'Built-in Fraud Protection',
      description: 'No client disputes over attendance. The shoot only begins once you verify the client’s Shoot-Start OTP at the venue.',
      icon: <ShieldCheck className="w-6 h-6 text-brand" />,
    },
    {
      title: 'Zero Listing Fees',
      description: 'List your packages, display your 4K portfolio, and gain high-intent client bookings for free. We only earn a 20% platform fee when you get paid.',
      icon: <TrendingUp className="w-6 h-6 text-brand" />,
    },
  ];

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-canvas-primary py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {/* HERO BANNER */}
          <div className="bg-canvas-secondary rounded-card-xl border border-contour-subtle p-8 sm:p-14 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl space-y-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-subtle text-brand text-xs font-bold border border-brand-border">
                <Camera className="w-4 h-4" />
                <span>SnapShoot Creator Partner Network</span>
              </span>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-ink-primary tracking-tight leading-tight">
                Turn Your Visual Passion Into <span className="text-brand">Predictable Revenue</span>
              </h1>

              <p className="text-base sm:text-lg text-ink-secondary leading-relaxed">
                Join India’s premier visual creator marketplace. We handle the client acquisition, payments, escrow, and scheduling so you can focus on making art.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                <Link href="/login?redirect=/photographer/onboarding">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Apply as a Creator
                  </Button>
                </Link>
                <span className="text-xs text-ink-muted">Free application • 24h review time</span>
              </div>
            </div>

            {/* Quick Stat Pill Card */}
            <div className="bg-white p-6 sm:p-8 rounded-card-lg border border-contour-subtle shadow-card w-full md:w-80 space-y-6 shrink-0">
              <div>
                <p className="text-xs uppercase font-bold text-ink-muted">Average Creator Earnings</p>
                <p className="text-3xl font-extrabold text-ink-primary mt-1">₹65,000<span className="text-xs text-ink-muted font-normal"> / mo</span></p>
                <p className="text-xs text-green-600 font-bold mt-1">● Based on 8–10 completed shoots</p>
              </div>

              <div className="border-t border-contour-subtle pt-4 space-y-2 text-xs text-ink-secondary">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                  <span>Direct Bank & UPI Transfer</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                  <span>Shoot-Start OTP Protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                  <span>Zero Upfront Platform Fees</span>
                </div>
              </div>
            </div>
          </div>

          {/* VALUE PROPOSITIONS */}
          <div className="space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">Why Creators Choose Us</span>
              <h2 className="text-3xl font-extrabold text-ink-primary">Built for Professional Photographers</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {BENEFITS.map((b) => (
                <Card key={b.title} className="space-y-4">
                  <div className="w-12 h-12 rounded-card-sm bg-brand-subtle flex items-center justify-center">
                    {b.icon}
                  </div>
                  <h3 className="text-lg font-bold text-ink-primary">{b.title}</h3>
                  <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                    {b.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
