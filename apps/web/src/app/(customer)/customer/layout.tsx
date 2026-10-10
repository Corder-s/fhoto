import React from 'react';
import Link from 'next/link';
import { Camera, Calendar, Image as ImageIcon, CreditCard, User, LogOut, ArrowLeft } from 'lucide-react';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas-primary flex flex-col">
      {/* Top Bar */}
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

            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-card-sm text-xs font-bold bg-brand-subtle text-brand border border-brand-border">
              Customer Portal
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/customer/dashboard"
              className="px-3 py-1.5 rounded-card-sm text-xs sm:text-sm font-semibold text-ink-primary hover:bg-canvas-secondary"
            >
              Dashboard
            </Link>
            <Link
              href="/photographers"
              className="px-3 py-1.5 rounded-card-sm text-xs sm:text-sm font-bold text-white bg-brand hover:bg-brand-hover shadow-sm"
            >
              Book New Shoot
            </Link>
            <Link
              href="/"
              className="p-2 text-ink-muted hover:text-ink-primary rounded-card-sm hover:bg-canvas-secondary"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
