import React from 'react';
import Link from 'next/link';
import { Camera, ArrowRight, ShieldCheck, Wallet, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';

export const RecruitmentBanner: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-white border-t border-contour-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-canvas-secondary rounded-card-xl border border-contour-subtle p-8 sm:p-14 relative overflow-hidden">
          <div className="max-w-2xl space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-ink-primary text-xs font-bold border border-contour-subtle shadow-sm">
              <Camera className="w-3.5 h-3.5 text-brand" />
              <span>For Professional Visual Creators</span>
            </span>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-ink-primary tracking-tight leading-tight">
              Turn your passion into opportunities.
            </h2>

            <p className="text-sm sm:text-base text-ink-secondary leading-relaxed">
              Showcase your portfolio, receive verified shoot requests near your location, and enjoy guaranteed 80% payouts directly into your bank account. Zero upfront fees.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink-primary">
                <Wallet className="w-4 h-4 text-brand shrink-0" />
                <span>Escrow Payout Guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-ink-primary">
                <Calendar className="w-4 h-4 text-brand shrink-0" />
                <span>Flexible Schedule</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-ink-primary">
                <ShieldCheck className="w-4 h-4 text-brand shrink-0" />
                <span>Shoot-Start OTP Protection</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/for-photographers">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Join as a photographer
                </Button>
              </Link>
              <span className="text-xs text-ink-muted">Free creator verification • Fast 24-hour review</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
