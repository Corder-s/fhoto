'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Package,
  Image as ImageIcon,
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
  TrendingUp,
  CreditCard,
  BarChart3,
  Sparkles,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useCurrentUserProfile } from '../../context/UserProfileContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavGroup {
  group: string;
  items: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
    isExternal?: boolean;
  }>;
}

export const PhotographerSidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const {
    creatorProfile,
    profile,
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

  const displayName = creatorProfile?.professional_name || profile?.full_name || accountName || 'Creator';
  const handleSlug = `@${displayName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  const publicProfileUrl = creatorProfile?.id
    ? `/photographers/${creatorProfile.id}`
    : '/photographer/business';

  const navGroups: NavGroup[] = [
    {
      group: 'OVERVIEW',
      items: [
        { label: 'Dashboard', href: '/photographer/dashboard', icon: LayoutDashboard },
        { label: 'Analytics & Trends', href: '/photographer/analytics', icon: BarChart3 },
      ],
    },
    {
      group: 'BUSINESS & SHOOTS',
      items: [
        {
          label: 'Booking Requests',
          href: '/photographer/bookings',
          icon: Calendar,
          badge: stats.newRequests > 0 ? String(stats.newRequests) : undefined,
          badgeColor: 'bg-[#14B8A6] text-white',
        },
        { label: 'Calendar & Availability', href: '/photographer/availability', icon: Clock },
        { label: 'Client Directory', href: '/photographer/clients', icon: Users },
      ],
    },
    {
      group: 'PORTFOLIO & OFFERINGS',
      items: [
        { label: 'Portfolio Gallery', href: '/photographer/portfolio', icon: ImageIcon },
        { label: 'Packages & Pricing', href: '/photographer/services', icon: Package },
        { label: 'My Profile', href: '/photographer/business', icon: UserCheck },
      ],
    },
    {
      group: 'FINANCIALS',
      items: [
        { label: 'Earnings', href: '/photographer/earnings', icon: TrendingUp },
        { label: 'Payments & Payouts', href: '/photographer/payouts', icon: DollarSign },
      ],
    },
    {
      group: 'ACCOUNT',
      items: [
        {
          label: 'Reviews & Ratings',
          href: '/photographer/reviews',
          icon: Star,
          badge: creatorProfile?.average_rating ? `${Number(creatorProfile.average_rating).toFixed(1)} ★` : undefined,
          badgeColor: 'bg-amber-400/20 text-amber-300 border border-amber-400/30',
        },
        { label: 'Profile Verification', href: '/photographer/verification', icon: ShieldCheck },
        { label: 'Settings', href: '/photographer/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Sleek Dark Navy/Charcoal Surface */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0B0F19] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 text-slate-300 shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 shrink-0 bg-[#0B0F19]">
          <Link
            href="/photographer/dashboard"
            onClick={onClose}
            className="flex items-center gap-2.5 select-none group"
            aria-label="REEPY Creator Studio"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] flex items-center justify-center text-white shadow-md shadow-[#14B8A6]/20 group-hover:scale-105 transition-transform">
              <Camera className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-white">
                  REEPY
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-[#14B8A6]/20 text-[#2DD4BF] border border-[#14B8A6]/30">
                  STUDIO
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium -mt-0.5">Creator Workspace</span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white lg:hidden rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Creator Identity Widget Snippet */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-[#0D9488] to-[#14B8A6] text-white flex items-center justify-center text-sm font-black border border-white/10 shadow-sm shrink-0 relative">
              <span className="select-none">{initials}</span>
              {displayAvatar && (
                <img
                  src={displayAvatar}
                  alt={professionalName || accountName}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white truncate">
                  {displayName}
                </p>
                {creatorProfile?.verification_status === 'approved' && (
                  <span title="Verified Pro" className="inline-flex shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#14B8A6]" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {handleSlug}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[10px] font-semibold text-slate-400">
                <span className="text-amber-300">★ {creatorProfile?.average_rating ? Number(creatorProfile.average_rating).toFixed(1) : '5.0'}</span>
                <span>•</span>
                <span className="truncate">{creatorProfile?.city || 'Delhi NCR'}</span>
              </div>
            </div>
          </div>

          {/* Verification mini banner */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Studio Status:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                creatorProfile?.verification_status === 'approved'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : creatorProfile?.verification_status === 'pending'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {creatorProfile?.verification_status === 'approved'
                ? 'Verified Pro'
                : creatorProfile?.verification_status === 'pending'
                ? 'Under Review'
                : 'Draft Profile'}
            </span>
          </div>
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                {group.group}
              </p>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    target={item.isExternal ? '_blank' : undefined}
                    rel={item.isExternal ? 'noopener noreferrer' : undefined}
                    onClick={() => onClose()}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#14B8A6] text-white font-bold shadow-sm shadow-[#14B8A6]/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                            isActive ? 'bg-white text-[#0D9488]' : item.badgeColor || 'bg-slate-800 text-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.isExternal && (
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-800/80 space-y-1.5 bg-[#0B0F19] shrink-0">
          <Link
            href="/customer/dashboard"
            className="block text-center text-[11px] font-semibold text-slate-400 hover:text-[#14B8A6] py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            Switch to Client Account →
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 text-center text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl py-2 px-3 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
