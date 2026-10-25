'use client';

import React from 'react';
import { Camera, Star, MapPin, TrendingUp } from 'lucide-react';

interface MetricItem {
  icon: React.ReactNode;
  value: string;
  label: string;
}

export const ReepyStatsStrip: React.FC = () => {
  const metrics: MetricItem[] = [
    {
      icon: <Camera className="w-5 h-5 text-[#14B8A6]" />,
      value: '8',
      label: 'Photographers',
    },
    {
      icon: <Star className="w-5 h-5 text-[#14B8A6]" />,
      value: '319',
      label: 'Reviews',
    },
    {
      icon: <MapPin className="w-5 h-5 text-[#14B8A6]" />,
      value: '6',
      label: 'Cities',
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-[#14B8A6]" />,
      value: '4.8',
      label: 'Avg Rating',
    },
  ];

  return (
    <div className="bg-white border-b border-[#E7EAEE] py-6 sm:py-8">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {metrics.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#EFFCF8] border border-[#99F6E4]/40 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-[#191C22] tracking-tight leading-none">
                  {item.value}
                </div>
                <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
