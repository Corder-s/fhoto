'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Camera, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useAuthModal } from '../auth/AuthModalContext';

export const FinalCtaBanner: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  return (
    <section className="py-12 md:py-16 bg-[#FAF7F2]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-[#1A1816] text-white overflow-hidden p-8 sm:p-12 lg:p-16 shadow-[0_20px_40px_-15px_rgba(26,24,22,0.3)]">
          {/* Subtle Orange Glow Radial in Background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF6E00]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FF6E00]/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-sm border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6E00]" />
              <span>Experience Next-Generation Photography Booking</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1]">
              Ready to capture your next <br />
              <span className="text-[#FF6E00]">unforgettable moment?</span>
            </h2>

            <p className="text-sm sm:text-base text-white/70 max-w-xl leading-relaxed">
              Connect with top-rated, background-verified photographers across Greater Noida, Delhi NCR, Mumbai, and Bengaluru. Transparent pricing, escrow protection, and rapid delivery.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link
                href="/explore"
                onClick={(e) => {
                  if (!isAuthenticated) {
                    e.preventDefault();
                    openAuthModal({
                      message: 'Join SnapShoot to discover and book the perfect photographer.',
                    });
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold text-white bg-[#FF6E00] hover:bg-[#E86300] active:scale-95 shadow-md transition-all"
              >
                <span>Find your photographer</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>

              <Link
                href="/for-photographers"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
              >
                <Camera className="w-4 h-4 text-[#FF6E00]" />
                <span>Join as a photographer</span>
              </Link>
            </div>

            {/* Micro trust indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-[11px] text-white/60">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF6E00]" />
                100% Escrow Protection
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF6E00]" />
                Govt ID Verified Creators
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF6E00]" />
                Shoot-Start OTP Handshake
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
