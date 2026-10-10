import React from 'react';
import Link from 'next/link';
import { Camera, Calendar, DollarSign, UploadCloud, Bell, LogOut } from 'lucide-react';

export default function PhotographerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas-primary flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-contour-subtle sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-card-sm bg-brand flex items-center justify-center text-white">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-ink-primary">
                Snap<span className="text-brand">Shoot</span>
              </span>
            </Link>

            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-card-sm text-xs font-bold bg-ink-primary text-white">
              Creator Workspace
            </span>
          </div>

          {/* Quick Creator Controls */}
          <div className="flex items-center gap-3">
            {/* Live Online/Offline Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="hidden sm:inline">Radar Status:</span> Online
            </div>

            <Link
              href="/"
              className="p-2 text-ink-muted hover:text-ink-primary rounded-card-sm hover:bg-canvas-secondary"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
