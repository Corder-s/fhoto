'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Package,
  Image,
  TrendingUp,
  DollarSign,
  Star,
  ShieldCheck,
  UserCheck,
  Settings,
  ExternalLink,
  Camera,
  X,
  LogOut,
  Users,
  CreditCard,
} from 'lucide-react';
import { INITIAL_PHOTOGRAPHER_PROFILE } from '../../data/photographerDashboardData';
import { clearAuthSession } from '../../lib/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhotographerSidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Overview',
      href: '/photographer/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Bookings',
      href: '/photographer/bookings',
      icon: Calendar,
      badge: '1 Live',
      badgeColor: 'bg-brand text-white',
    },
    {
      label: 'Client CRM',
      href: '/photographer/clients',
      icon: Users,
      badge: '5 Active',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      label: 'Availability & Slots',
      href: '/photographer/availability',
      icon: Clock,
    },
    {
      label: 'Services & Pricing',
      href: '/photographer/services',
      icon: Package,
    },
    {
      label: 'Portfolio Gallery',
      href: '/photographer/portfolio',
      icon: Image,
    },
    {
      label: 'Earnings',
      href: '/photographer/earnings',
      icon: TrendingUp,
    },
    {
      label: 'Payouts & UPI',
      href: '/photographer/payouts',
      icon: DollarSign,
    },
    {
      label: 'SaaS Plan & Billing',
      href: '/photographer/subscription',
      icon: CreditCard,
      badge: 'PRO',
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-200',
    },
    {
      label: 'Client Reviews',
      href: '/photographer/reviews',
      icon: Star,
      badge: '4.96 ★',
      badgeColor: 'bg-canvas-secondary text-ink-primary border border-contour-subtle',
    },
    {
      label: 'Verification Status',
      href: '/photographer/verification',
      icon: ShieldCheck,
      badge: 'Under Review',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      label: 'Onboarding Flow',
      href: '/photographer/onboarding',
      icon: UserCheck,
    },
    {
      label: 'Studio Settings',
      href: '/photographer/settings',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-ink-primary/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-contour-subtle flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-contour-subtle shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-card-sm bg-brand flex items-center justify-center text-white shadow-sm">
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-xl font-black tracking-tight text-ink-primary">
              Snap<span className="text-brand">Shoot</span>
            </span>
          </Link>

          <button
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink-primary lg:hidden rounded-card-sm hover:bg-canvas-secondary"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Snippet */}
        <div className="p-4 border-b border-contour-subtle bg-canvas-primary/60 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={INITIAL_PHOTOGRAPHER_PROFILE.avatar}
              alt={INITIAL_PHOTOGRAPHER_PROFILE.name}
              className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-ink-primary truncate">
                  {INITIAL_PHOTOGRAPHER_PROFILE.name}
                </p>
                <span title="Verified Professional" className="inline-flex">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand shrink-0" />
                </span>
              </div>
              <p className="text-xs text-ink-secondary truncate">
                {INITIAL_PHOTOGRAPHER_PROFILE.handle}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] font-medium text-ink-muted">
                <span>⭐ {INITIAL_PHOTOGRAPHER_PROFILE.rating}</span>
                <span>•</span>
                <span>{INITIAL_PHOTOGRAPHER_PROFILE.city}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-ink-muted">
            Creator Navigation
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()}
                className={`flex items-center justify-between px-3 py-2 rounded-card-sm text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-canvas-secondary'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-ink-muted'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`ml-2 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Public Profile & Mode Switch */}
        <div className="p-3 border-t border-contour-subtle space-y-1 bg-white shrink-0">
          <Link
            href="/photographers/pro-aman"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-ink-secondary hover:text-ink-primary hover:bg-canvas-secondary rounded-card-sm transition-colors"
          >
            <span className="flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-brand" />
              <span>View Public Profile</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-ink-muted" />
          </Link>

          <Link
            href="/customer/dashboard"
            className="block text-center text-[11px] font-semibold text-ink-muted hover:text-brand px-3 py-1.5 transition-colors"
          >
            Switch to Client Account →
          </Link>

          <Link
            href="/"
            onClick={() => {
              clearAuthSession();
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 text-center text-[11px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-card-sm px-3 py-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
