'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Search, 
  ShieldCheck, 
  KeyRound, 
  ArrowRight, 
  Clock, 
  Sparkles, 
  Lock,
  CheckCircle2
} from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const STEPS = [
    {
      step: '01',
      title: 'Discover & Compare',
      description: 'Explore verified visual artists in your city. Compare portfolios, upfront pricing packages, camera gear, and verified reviews.',
      icon: <Search className="w-5 h-5 text-[#FF6E00]" />,
    },
    {
      step: '02',
      title: 'Book with Escrow Protection',
      description: 'Choose your shoot package, venue, and time. Your payment stays securely held in RBI-compliant escrow until your final photos are delivered.',
      icon: <Lock className="w-5 h-5 text-[#FF6E00]" />,
    },
    {
      step: '03',
      title: 'OTP Handshake & 4K Delivery',
      description: 'Start your shoot safely with a 6-digit Shoot-Start OTP verification on arrival. Receive your color-graded high-resolution photos within 24–48 hours.',
      icon: <Sparkles className="w-5 h-5 text-[#FF6E00]" />,
    },
  ];

  const CUSTOMER_BENEFITS = [
    {
      icon: <ShieldCheck className="w-4 h-4 text-[#FF6E00]" />,
      title: '100% Escrow Guarantee',
      desc: 'Funds released only after photo delivery approval.',
    },
    {
      icon: <KeyRound className="w-4 h-4 text-[#FF6E00]" />,
      title: 'Shoot-Start OTP Handshake',
      desc: 'Prevents impersonation & verifies exact arrival.',
    },
    {
      icon: <Clock className="w-4 h-4 text-[#FF6E00]" />,
      title: 'Guaranteed 24–48h Turnaround',
      desc: 'Fast delivery straight to your client gallery.',
    },
    {
      icon: <CheckCircle2 className="w-4 h-4 text-[#FF6E00]" />,
      title: 'Zero Hidden Fees',
      desc: 'Transparent INR prices including travel & basic editing.',
    },
  ];

  return (
    <section className="py-12 md:py-20 bg-white border-y border-[#EDE6DC]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8C847A]">
            EFFORTLESS & SECURE
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-[#1A1816] tracking-tight">
            How SnapShoot works.
          </h2>
          <p className="text-xs sm:text-sm text-[#665E55] leading-relaxed">
            Booking professional visual talent has never been simpler, safer, or more transparent.
          </p>
        </div>

        {/* 3-Step Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {STEPS.map((s, idx) => (
            <div
              key={s.step}
              className="bg-[#FAF7F2] rounded-2xl border border-[#EBE4DA] p-6 sm:p-7 space-y-4 hover:shadow-card hover:-translate-y-1 transition-all duration-300 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E0D8CD] flex items-center justify-center shadow-subtle group-hover:scale-105 transition-transform">
                  {s.icon}
                </div>
                <span className="text-2xl sm:text-3xl font-black text-[#D5CEC4] font-mono">
                  {s.step}
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-[#1A1816]">
                  {s.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#665E55] leading-relaxed">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Customer Benefits Callout Strip */}
        <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] p-6 sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1A1816]">
              Customer Protection & Benefits
            </h3>
            <Link
              href="/how-it-works"
              className="text-xs font-bold text-[#FF6E00] hover:text-[#E86300] flex items-center gap-1 transition-colors"
            >
              <span>Learn more about security</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CUSTOMER_BENEFITS.map((b, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[#EBE4DA] p-4 space-y-1.5 shadow-subtle"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-[#FFF3E5]">
                    {b.icon}
                  </div>
                  <h4 className="text-xs font-bold text-[#1A1816]">
                    {b.title}
                  </h4>
                </div>
                <p className="text-[11px] text-[#736B62] leading-snug">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
