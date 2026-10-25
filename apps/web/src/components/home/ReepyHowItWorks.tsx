'use client';

import React from 'react';
import { Search, Users, Calendar, Star } from 'lucide-react';

interface StepItem {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const ReepyHowItWorks: React.FC = () => {
  const steps: StepItem[] = [
    {
      number: '1',
      icon: <Search className="w-5 h-5 text-white" />,
      title: 'Search your locality',
      description: 'Find vetted visual creators in your city or locality filtered by specialty and portfolio style.',
    },
    {
      number: '2',
      icon: <Users className="w-5 h-5 text-white" />,
      title: 'Compare and connect',
      description: 'Review transparent starting prices, camera gear, ratings, and genuine past client feedback.',
    },
    {
      number: '3',
      icon: <Calendar className="w-5 h-5 text-white" />,
      title: 'Book and shoot',
      description: 'Request your shoot date, verify photographer arrival with Shoot-Start OTP, and shoot with confidence.',
    },
    {
      number: '4',
      icon: <Star className="w-5 h-5 text-white" />,
      title: 'Review and repeat',
      description: 'Receive color-graded 4K galleries within 24-48 hours, release payment via escrow, and leave a review.',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#F5F7F9]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs sm:text-sm font-black tracking-wider text-[#14B8A6] uppercase">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#191C22] tracking-tight">
            From search to shoot in 4 simple steps
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Whether you need a reel for Instagram or full wedding coverage, finding and booking the right local photographer takes minutes.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative bg-white rounded-2xl border border-[#E7EAEE] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden group"
            >
              {/* Large Faint Step Number */}
              <span className="absolute top-4 right-5 text-4xl sm:text-5xl font-black text-[#F1F3F5] group-hover:text-[#EFFCF8] transition-colors pointer-events-none select-none">
                {step.number}
              </span>

              {/* Icon Container */}
              <div className="w-12 h-12 rounded-xl bg-[#14B8A6] flex items-center justify-center shadow-xs mb-5 shrink-0">
                {step.icon}
              </div>

              {/* Text */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#191C22] tracking-tight">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
