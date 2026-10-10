'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface CustomerNoticeBannerProps {
  moduleName?: string;
}

export const CustomerNoticeBanner: React.FC<CustomerNoticeBannerProps> = ({
  moduleName = 'Customer Portal',
}) => {
  return (
    <div className="bg-[#FFF8F0] border border-[#FFE2C2] rounded-2xl p-3.5 sm:p-4 mb-6 text-xs text-[#7A4005] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-[#FF6E00] shrink-0" />
        <div>
          <span className="font-extrabold text-[#5A2C00] uppercase tracking-wide mr-1.5">
            Demonstration Mode:
          </span>
          <span>
            {moduleName} operates with simulated frontend state. OTP handshakes, escrow payment holds, and high-res gallery proofs are interactive demonstrations. Production bank processing and SMS dispatch require live backend integration.
          </span>
        </div>
      </div>
      <div className="shrink-0 self-end sm:self-auto">
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFD9B3] text-[#7A4005] uppercase">
          Phase 5 Frontend
        </span>
      </div>
    </div>
  );
};
