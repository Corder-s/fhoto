import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { 
  Search, 
  CreditCard, 
  KeyRound, 
  Camera, 
  DownloadCloud, 
  ShieldCheck, 
  ArrowRight 
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function HowItWorksPage() {
  const CUSTOMER_STEPS = [
    {
      step: '01',
      title: 'Discover & Compare Portfolios',
      description: 'Enter your city or location to discover nearby verified photographers. Filter by package duration, budget, and specialty.',
      icon: <Search className="w-6 h-6 text-brand" />,
    },
    {
      step: '02',
      title: 'Escrow-Protected Checkout',
      description: 'Choose instant booking or schedule ahead. Pay 100% upfront into secure platform escrow. Your payment is held safely until delivery.',
      icon: <CreditCard className="w-6 h-6 text-brand" />,
    },
    {
      step: '03',
      title: 'Shoot-Start OTP Handshake',
      description: 'When the photographer arrives at your shoot location, share your 6-digit Shoot-Start OTP. The shoot officially begins only once verified.',
      icon: <KeyRound className="w-6 h-6 text-brand" />,
    },
    {
      step: '04',
      title: 'Receive Private 4K Gallery',
      description: 'The photographer uploads your edited photos to private cloud storage. Preview, download individual 4K assets or complete ZIP archives, and release review.',
      icon: <DownloadCloud className="w-6 h-6 text-brand" />,
    },
  ];

  const CREATOR_STEPS = [
    {
      step: '01',
      title: 'Register & Submit KYC',
      description: 'Submit your government identity proof, equipment list, and top portfolio photos. Our team verifies credentials within 24 hours.',
    },
    {
      step: '02',
      title: 'Receive Local Job Alerts',
      description: 'Toggle Online when you want to take shoots. Receive instant and scheduled booking requests within your set travel radius.',
    },
    {
      step: '03',
      title: 'Verify OTP & Capture',
      description: 'Travel to the venue, enter the customer’s OTP on your mobile web dashboard to start the shoot, and create stunning visual work.',
    },
    {
      step: '04',
      title: 'Upload Media & Get Paid',
      description: 'Upload high-res deliverables directly via our fast web uploader. Escrow releases 80% net earnings straight to your bank account.',
    },
  ];

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-canvas-primary py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase font-extrabold tracking-wider text-brand">
              Transparent Marketplace
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink-primary">
              How SnapShoot Works
            </h1>
            <p className="text-base sm:text-lg text-ink-secondary leading-relaxed">
              We took the stress out of hiring professional photographers. From geospatial discovery to verified delivery, every step is protected by technology.
            </p>
          </div>

          {/* FOR CLIENTS SECTION */}
          <div className="space-y-10">
            <div className="border-b border-contour-subtle pb-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand">For Clients</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">The Customer Booking Journey</h2>
              </div>
              <Link href="/photographers">
                <Button variant="primary" size="sm">
                  Find Photographers
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {CUSTOMER_STEPS.map((s) => (
                <Card key={s.step} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-brand/30">{s.step}</span>
                    <div className="w-12 h-12 rounded-card-sm bg-brand-subtle flex items-center justify-center">
                      {s.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-ink-primary">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                    {s.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>

          {/* FOR CREATORS SECTION */}
          <div className="bg-canvas-secondary rounded-card-xl p-8 sm:p-12 border border-contour-subtle space-y-10">
            <div className="border-b border-contour-strong pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-primary">For Creators</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">How Creators Earn with SnapShoot</h2>
              </div>
              <Link href="/for-photographers">
                <Button variant="secondary" size="sm">
                  Apply as a Creator
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {CREATOR_STEPS.map((s) => (
                <div key={s.step} className="bg-white p-6 rounded-card-md border border-contour-subtle space-y-3">
                  <span className="text-2xl font-black text-ink-muted">{s.step}</span>
                  <h3 className="text-base font-bold text-ink-primary">{s.title}</h3>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
