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
  Radio
} from 'lucide-react';
import { INITIAL_PHOTOGRAPHER_PROFILE } from '../../data/photographerDashboardData';

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

  const notifications = [
    {
      id: 'notif-1',
      title: 'Active Venue Appointment',
      message: 'Aarav Sharma is waiting at Lodhi Art District. Verify 6-digit shoot-start OTP to begin.',
      time: 'Just now',
      unread: true,
      href: '/photographer/dashboard',
    },
    {
      id: 'notif-2',
      title: 'New Booking Request',
      message: 'Vikram Joshi requested an Executive Headshot session for 12 Oct.',
      time: '2 hours ago',
      unread: true,
      href: '/photographer/bookings',
    },
    {
      id: 'notif-3',
      title: 'Weekly Payout Settled',
      message: '₹32,000 has been transferred to your registered UPI ID.',
      time: 'Yesterday',
      unread: false,
      href: '/photographer/payouts',
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-contour-subtle h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Mobile Hamburger + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-ink-secondary hover:text-ink-primary hover:bg-canvas-secondary rounded-card-sm lg:hidden"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
            Workspace
          </span>
          <span className="text-xs text-contour-strong font-mono">/</span>
          <span className="text-xs font-bold text-ink-primary">
            Rahul Verma Studio
          </span>
        </div>
      </div>

      {/* Right Controls: Radar Switch, Notifications, Profile Dropdown */}
      <div className="flex items-center gap-3">
        {/* Instant Radar Toggle */}
        <button
          onClick={onToggleOnline}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm ${
            isOnline
              ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
              : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'
          }`}
          title="Toggle Instant Radar Availability (Simulated)"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500 animate-pulse' : 'bg-zinc-400'
            }`}
          />
          <Radio className="w-3.5 h-3.5" />
          <span className="hidden md:inline">
            Radar: {isOnline ? 'Online (Accepting Shoots)' : 'Offline (Paused)'}
          </span>
          <span className="md:hidden">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 text-ink-secondary hover:text-ink-primary hover:bg-canvas-secondary rounded-card-sm transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-card-md border border-contour-subtle shadow-elevated py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-contour-subtle flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-ink-primary">
                  Notifications
                </span>
                <span className="text-[10px] font-bold text-brand bg-brand-subtle px-1.5 py-0.5 rounded">
                  2 New
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-contour-subtle">
                {notifications.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setShowNotifications(false)}
                    className={`block px-4 py-3 hover:bg-canvas-secondary/60 transition-colors ${
                      item.unread ? 'bg-brand-subtle/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-ink-primary">{item.title}</p>
                      <span className="text-[10px] text-ink-muted whitespace-nowrap">{item.time}</span>
                    </div>
                    <p className="text-xs text-ink-secondary mt-1 line-clamp-2">{item.message}</p>
                  </Link>
                ))}
              </div>

              <div className="px-4 py-2 border-t border-contour-subtle text-center">
                <Link
                  href="/photographer/dashboard"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-bold text-brand hover:underline"
                >
                  View all workspace activity
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-card-sm hover:bg-canvas-secondary transition-colors"
          >
            <img
              src={INITIAL_PHOTOGRAPHER_PROFILE.avatar}
              alt={INITIAL_PHOTOGRAPHER_PROFILE.name}
              className="w-7 h-7 rounded-full object-cover border border-contour-subtle"
            />
            <span className="hidden sm:inline text-xs font-bold text-ink-primary max-w-[100px] truncate">
              {INITIAL_PHOTOGRAPHER_PROFILE.name.split(' ')[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
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
                  href="/login"
                  onClick={() => setShowProfileMenu(false)}
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
