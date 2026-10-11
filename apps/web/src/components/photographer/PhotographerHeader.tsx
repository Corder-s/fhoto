'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Settings,
  LogOut,
  ChevronDown,
  User,
  Radio,
  Search,
  MessageSquare
} from 'lucide-react';
import { INITIAL_PHOTOGRAPHER_PROFILE } from '../../data/photographerDashboardData';
import { clearAuthSession } from '../../lib/auth';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  isOnline: boolean;
  onToggleOnline: () => void;
}

export const PhotographerHeader: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  isOnline,
  onToggleOnline
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = [
    {
      id: 'notif-1',
      title: 'New Booking Request',
      message: 'Riya & Karan requested Wedding Photography session for Oct 12.',
      time: '10 min ago',
      unread: true,
      href: '/photographer/bookings',
    },
    {
      id: 'notif-2',
      title: 'New Booking Request',
      message: 'Mehak Gupta requested Pre-Wedding Shoot for Oct 18.',
      time: '1 hour ago',
      unread: true,
      href: '/photographer/bookings',
    },
    {
      id: 'notif-3',
      title: 'Weekly Payout Settled',
      message: '₹48,250 has been transferred to your registered bank account.',
      time: 'Yesterday',
      unread: false,
      href: '/photographer/payouts',
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E8E2D8] h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle + Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-ink-secondary hover:text-ink-primary hover:bg-canvas-secondary rounded-card-sm lg:hidden"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search input matching Reference Image A */}
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-[#8C847A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookings, clients, messages..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs text-[#1A1816] placeholder:text-[#8C847A] focus:outline-none focus:border-[#FF6E00] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Notifications, Message, Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 text-[#5A544D] hover:text-[#1A1816] hover:bg-[#FAF7F2] rounded-xl transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 stroke-[1.8]" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#FF4D4D] text-white text-[9px] font-black rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#E8E2D8] shadow-elevated py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-[#F2ECE3] flex items-center justify-between">
                <span className="text-xs font-black text-[#1A1816]">
                  Notifications
                </span>
                <span className="text-[10px] font-bold text-[#FF6E00] bg-[#FFF2E8] px-2 py-0.5 rounded-full">
                  3 New
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[#F2ECE3]">
                {notifications.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setShowNotifications(false)}
                    className="block px-4 py-3 hover:bg-[#FAF7F2] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-[#1A1816]">{item.title}</p>
                      <span className="text-[10px] text-[#8C847A] whitespace-nowrap">{item.time}</span>
                    </div>
                    <p className="text-xs text-[#736B63] mt-1 line-clamp-2">{item.message}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Message bubble icon */}
        <Link
          href="/photographer/dashboard"
          className="p-2 text-[#5A544D] hover:text-[#1A1816] hover:bg-[#FAF7F2] rounded-xl transition-colors relative"
          title="Messages"
        >
          <MessageSquare className="w-5 h-5 stroke-[1.8]" />
        </Link>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
          >
            <img
              src="/reference-assets/seller_profile_aman.jpg"
              alt="Aman Sharma"
              className="w-8 h-8 rounded-full object-cover border border-[#E8E2D8]"
            />
            <div className="text-left hidden md:block">
              <p className="text-xs font-black text-[#1A1816] leading-tight">
                Aman Sharma
              </p>
              <p className="text-[10px] text-[#8C847A] font-medium leading-tight">
                Wedding Photographer
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8C847A]" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-card-md border border-contour-subtle shadow-elevated py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-contour-subtle">
                <p className="text-xs font-bold text-ink-primary truncate">
                  {INITIAL_PHOTOGRAPHER_PROFILE.name}
                </p>
                <p className="text-[11px] text-ink-muted truncate">
                  {INITIAL_PHOTOGRAPHER_PROFILE.email}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/photographer/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-ink-secondary hover:text-ink-primary hover:bg-canvas-secondary"
                >
                  <Settings className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Studio Settings</span>
                </Link>
                <Link
                  href="/photographers/pro-aman"
                  target="_blank"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-ink-secondary hover:text-ink-primary hover:bg-canvas-secondary"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Public Portfolio</span>
                </Link>
                <Link
                  href="/photographer/onboarding"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-ink-secondary hover:text-ink-primary hover:bg-canvas-secondary"
                >
                  <User className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Onboarding Checklist</span>
                </Link>
              </div>

              <div className="border-t border-contour-subtle pt-1 mt-1">
                <Link
                  href="/"
                  onClick={() => {
                    clearAuthSession();
                    setShowProfileMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
