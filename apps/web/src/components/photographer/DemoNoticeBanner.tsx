'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface DemoNoticeBannerProps {
  moduleName?: string;
}

export const DemoNoticeBanner: React.FC<DemoNoticeBannerProps> = ({ moduleName = 'Photographer Workspace' }) => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-card-md p-3.5 sm:p-4 mb-6 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <div>
          <span className="font-bold text-amber-950 uppercase tracking-wide mr-1.5">
            Demonstration Mode:
          </span>
          <span>
            {moduleName} uses isolated frontend state. Status transitions, uploads, and earnings are simulated. Real-time radar dispatch and bank settlements require live backend integration.
          </span>
        </div>
      </div>
      <div className="shrink-0 self-end sm:self-auto">
        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/80 text-amber-900 uppercase">
          Phase 4 Frontend
        </span>
      </div>
    </div>
  );
};
