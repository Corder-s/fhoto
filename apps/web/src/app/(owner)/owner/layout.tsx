import React from 'react';
import Link from 'next/link';
import { Camera, TrendingUp, BarChart3, PieChart, DollarSign, Settings, LogOut } from 'lucide-react';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas-primary flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-ink-primary text-white flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-ink-secondary/30 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-card-sm bg-brand flex items-center justify-center text-white">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Snap<span className="text-brand">Shoot</span>
              </span>
            </Link>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand text-white">
              OWNER
            </span>
          </div>

          <nav className="p-4 space-y-1 text-sm font-semibold text-gray-300">
            <Link
              href="/owner/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-card-sm bg-brand text-white"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Executive Overview</span>
            </Link>
            <Link
              href="/owner/revenue"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-card-sm hover:bg-white/10 hover:text-white transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              <span>Commission Revenue</span>
            </Link>
            <Link
              href="/owner/analytics"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-card-sm hover:bg-white/10 hover:text-white transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Supply vs Demand</span>
            </Link>
            <Link
              href="/owner/marketplace"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-card-sm hover:bg-white/10 hover:text-white transition-colors"
            >
              <PieChart className="w-4 h-4" />
              <span>City Density</span>
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-ink-secondary/30">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white p-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Return to Public Website</span>
          </Link>
        </div>
      </aside>

      {/* Main Owner Content */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
