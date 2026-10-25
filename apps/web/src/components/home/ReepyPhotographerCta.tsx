'use client';

import React from 'react';
import Link from 'next/link';
import { Camera, ShieldCheck, DollarSign, Users, ArrowRight } from 'lucide-react';

export const ReepyPhotographerCta: React.FC = () => {
  return (
    <section className="py-20 md:py-28 bg-[#0D0F12] text-white relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#14B8A6]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#171A1F] border border-[#262B33] text-xs font-bold text-[#14B8A6]">
          <Camera className="w-4 h-4" />
          <span>JOIN THE REEPY PRO NETWORK</span>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Turn your passion into bookings. Join as a photographer.
          </h2>
          <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed max-w-2xl mx-auto">
            Get booked by clients in your city who appreciate great visual storytelling. Keep what you earn with verified escrow protection and instant payouts.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <Link
            href="/for-photographers"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] active:bg-[#0F766E] text-[#0D0F12] hover:text-white font-bold text-sm shadow-lg transition-all"
          >
            <span>Join as Photographer</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/explore"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#171A1F] hover:bg-[#20252D] text-white border border-[#262B33] font-bold text-sm transition-all"
          >
            <span>Browse Talent</span>
          </Link>
        </div>

        {/* 3 Concise Benefit Indicators */}
        <div className="pt-8 border-t border-[#1F242D] max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Zero Listing Fees</h4>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">Keep 100% of your listed pricing.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Guaranteed Escrow</h4>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">Funds deposited before shoot starts.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Verified Local Leads</h4>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">Connect with real paying clients.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
