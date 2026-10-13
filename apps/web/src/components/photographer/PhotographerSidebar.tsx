'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Briefcase,
  Layers,
  BarChart3,
} from 'lucide-react';
import { clearAuthSession, useAuth } from '../../lib/auth';
import { useCurrentUserProfile } from '../../context/UserProfileContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhotographerSidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const {
    authUser,
    profile,
    creatorProfile,
    stats,
    accountName,
    professionalName,
    displayAvatar,
    initials,
  } = useCurrentUserProfile();

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    await logout();
    router.push('/login');
  };

  const handleSlug = `@${accountName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  const navItems = [
    { label: 'Dashboard', href: '/photographer/dashboard', icon: LayoutDashboard },
    { label: 'My Profile', href: '/photographer/business', icon: UserCheck },
    { label: 'Portfolio', href: '/photographer/portfolio', icon: Image },
    { label: 'Packages & Pricing', href: '/photographer/services', icon: Package },
    { label: 'Availability', href: '/photographer/availability', icon: Clock },
    {
      label: 'Booking Requests',
      href: '/photographer/bookings',
      icon: Calendar,
      badge: stats.newRequests > 0 ? String(stats.newRequests) : undefined,
      badgeColor: 'bg-[#FF4D4D] text-white',
    },
    { label: 'My Bookings', href: '/photographer/bookings', icon: Calendar },
    { label: 'Clients', href: '/photographer/clients', icon: Users },
    { label: 'Earnings & Payouts', href: '/photographer/payouts', icon: DollarSign },
    { label: 'Subscription', href: '/photographer/subscription', icon: CreditCard },
    { label: 'Analytics', href: '/photographer/analytics', icon: BarChart3 },
    { label: 'Reviews', href: '/photographer/reviews', icon: Star },
    { label: 'Settings', href: '/photographer/settings', icon: Settings },
    { label: 'Help & Support', href: '/photographer/settings', icon: ShieldCheck },
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
          <div className="flex items-center gap-2.5 select-none cursor-default" aria-label="SnapShoot Brand">
            <div className="w-8 h-8 rounded-card-sm bg-brand flex items-center justify-center text-white shadow-sm">
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-xl font-black tracking-tight text-ink-primary">
              Snap<span className="text-brand">Shoot</span>
            </span>
          </div>

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
            <div className="w-11 h-11 rounded-full overflow-hidden bg-[#FF6E00] text-white flex items-center justify-center text-sm font-black border-2 border-white shadow-sm shrink-0 relative">
              <span className="select-none">{initials}</span>
              {displayAvatar && (
                <img
                  src={displayAvatar}
                  alt={accountName}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-ink-primary truncate">
                  {accountName}
                </p>
                {creatorProfile?.verification_status === 'approved' && (
                  <span title="Verified Professional" className="inline-flex">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-secondary truncate">
                {handleSlug}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] font-medium text-ink-muted">
                <span>⭐ {creatorProfile?.average_rating ? Number(creatorProfile.average_rating).toFixed(1) : '5.0'}</span>
                <span>•</span>
                <span className="truncate">{creatorProfile?.city || 'Delhi NCR'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => onClose()}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#FFF2E8] text-[#FF6E00] font-black'
                    : 'text-[#5A544D] hover:text-[#1A1816] hover:bg-[#F7F3ED]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#FF6E00]' : 'text-[#8C847A]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`ml-2 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full shrink-0 ${
                      item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Upgrade to Pro Card */}
        <div className="p-3.5 m-3 rounded-2xl bg-[#FFF8F2] border border-[#FFDFC6] space-y-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">👑</span>
            <span className="text-xs font-black text-[#1A1816]">Upgrade to Pro</span>
          </div>
          <p className="text-[11px] text-[#736B63] leading-relaxed">
            Get more bookings, better visibility and premium features.
          </p>
          <Link
            href="/photographer/subscription"
            className="block w-full py-2 px-3 rounded-xl bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs font-bold text-center transition-colors shadow-2xs"
          >
            View Plans →
          </Link>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-contour-subtle space-y-1 bg-white shrink-0">
          <Link
            href="/customer/dashboard"
            className="block text-center text-[11px] font-semibold text-ink-muted hover:text-brand px-3 py-1 transition-colors"
          >
            Switch to Client Account →
          </Link>

          <Link
            href="/login"
            onClick={handleSignOut}
            className="flex items-center justify-center gap-1.5 text-center text-[11px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg px-3 py-1 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
