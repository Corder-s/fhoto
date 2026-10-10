import React from 'react';
import Link from 'next/link';
import { Camera, ShieldCheck, Users, Calendar, AlertTriangle, Settings, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas-primary flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-contour-subtle flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-contour-subtle flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-card-sm bg-brand flex items-center justify-center text-white">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-ink-primary">
                Snap<span className="text-brand">Shoot</span>
              </span>
            </Link>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ink-primary text-white">
              ADMIN
            </span>
          </div>

          <nav className="p-4 space-y-1 text-sm font-semibold text-ink-secondary">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-card-sm bg-brand-subtle text-brand"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Operations Desk</span>
            </Link>
            <Link
              href="/admin/photographers"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-card-sm hover:bg-canvas-secondary hover:text-ink-primary transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>KYC Approvals (4)</span>
            </Link>
            <Link
              href="/admin/bookings"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-card-sm hover:bg-canvas-secondary hover:text-ink-primary transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Active Bookings</span>
            </Link>
            <Link
              href="/admin/disputes"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-card-sm hover:bg-canvas-secondary hover:text-ink-primary transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Dispute Queue (1)</span>
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-card-sm hover:bg-canvas-secondary hover:text-ink-primary transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Commission Rules</span>
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-contour-subtle">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-ink-primary p-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Return to Public Website</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        <div className="mb-6 p-3 bg-canvas-primary border border-contour-subtle rounded-card-sm text-xs text-ink-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand shrink-0" />
            <span><strong>Role-Restricted Interface:</strong> Operations desk actions require verified server-side JWT claims.</span>
          </span>
          <span className="font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-contour-subtle text-ink-secondary self-start sm:self-auto">
            ROLE: ADMIN
          </span>
        </div>
        {children}
      </main>
    </div>
  );
}
