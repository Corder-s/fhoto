'use client';

import React from 'react';
import Link from 'next/link';
import { Camera, ArrowRight, ShieldCheck, Wallet, Calendar, Sparkles } from 'lucide-react';

export const RecruitmentBanner: React.FC = () => {
  return (
    <section className="py-12 md:py-20 bg-white border-y border-[#EDE6DC]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF7F2] rounded-3xl border border-[#EBE4DA] p-8 sm:p-12 lg:p-14 relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF6E00]/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

          <div className="max-w-2xl space-y-6 relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#1A1816] text-xs font-bold border border-[#E0D8CD] shadow-subtle">
              <Camera className="w-3.5 h-3.5 text-[#FF6E00]" />
              <span>For Professional Visual Creators</span>
            </span>

            <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-black text-[#1A1816] tracking-tight leading-tight">
              Turn your camera skills into <br />
              <span className="text-[#FF6E00]">consistent bookings.</span>
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-[#665E55] leading-relaxed">
              Showcase your portfolio, receive verified shoot requests near your location, and enjoy guaranteed 80% payouts directly into your bank account. Zero listing fees, full schedule autonomy, and complete escrow safety.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="flex items-center gap-2.5 text-xs font-bold text-[#1A1816] bg-white p-3 rounded-xl border border-[#EBE4DA] shadow-subtle">
                <Wallet className="w-4 h-4 text-[#FF6E00] shrink-0" />
                <span>Instant Escrow Payouts</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-[#1A1816] bg-white p-3 rounded-xl border border-[#EBE4DA] shadow-subtle">
                <Calendar className="w-4 h-4 text-[#FF6E00] shrink-0" />
                <span>100% Flexible Schedule</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-[#1A1816] bg-white p-3 rounded-xl border border-[#EBE4DA] shadow-subtle">
                <ShieldCheck className="w-4 h-4 text-[#FF6E00] shrink-0" />
                <span>Shoot-Start OTP Protection</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/for-photographers"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-[#FF6E00] hover:bg-[#E86300] active:scale-95 shadow-sm transition-all"
              >
                <span>Apply to join as a creator</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
              <span className="text-xs text-[#8C847A]">
                Fast 24-hour review • Verified equipment check
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
