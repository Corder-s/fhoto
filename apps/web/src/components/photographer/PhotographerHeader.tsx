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
  MessageSquare,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { clearAuthSession, useAuth } from '../../lib/auth';
import { useCurrentUserProfile } from '../../context/UserProfileContext';
import { useNotifications } from '../../lib/useNotifications';

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
  const {
    authUser,
    profile,
    creatorProfile,
    accountName,
    professionalName,
    displayAvatar,
    initials,
  } = useCurrentUserProfile();
  const router = useRouter();
  const { logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    setShowProfileMenu(false);
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E7EAEE] h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
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
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookings, clients, messages..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F5F7F9] border border-[#E7EAEE] text-xs text-[#191C22] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#14B8A6] focus:bg-white transition-all"
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
            className="relative p-2 text-[#64748B] hover:text-[#191C22] hover:bg-[#F5F7F9] rounded-xl transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 stroke-[1.8]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#FF4D4D] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#E7EAEE] shadow-elevated py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-[#F1F3F5] flex items-center justify-between">
                <span className="text-xs font-black text-[#191C22]">
                  Notifications
                </span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAsRead()}
                      className="text-[10px] font-semibold text-[#14B8A6] hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                  <span className="text-[10px] font-bold text-[#14B8A6] bg-[#EFFCF8] px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[#F1F3F5]">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#94A3B8]">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <Link
                      key={item.id}
                      href={item.actionUrl || '/photographer/bookings'}
                      onClick={() => {
                        markAsRead(item.id);
                        setShowNotifications(false);
                      }}
                      className={`block px-4 py-3 hover:bg-[#F5F7F9] transition-colors ${
                        !item.readAt ? 'bg-[#FFF9F5]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs ${!item.readAt ? 'font-black text-[#191C22]' : 'font-medium text-[#64748B]'}`}>
                          {item.title}
                        </p>
                        <span className="text-[10px] text-[#94A3B8] whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{item.body}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Message bubble icon */}
        <Link
          href="/photographer/dashboard"
          className="p-2 text-[#64748B] hover:text-[#191C22] hover:bg-[#F5F7F9] rounded-xl transition-colors relative"
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
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[#F5F7F9] transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#14B8A6] text-white flex items-center justify-center text-xs font-black border border-[#E7EAEE] shadow-2xs shrink-0 relative">
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
            <div className="text-left hidden md:block">
              <p className="text-xs font-black text-[#191C22] leading-tight">
                {accountName}
              </p>
              <p className="text-[10px] text-[#94A3B8] font-medium leading-tight">
                {creatorProfile?.city ? `${creatorProfile.city} • Creator` : 'Verified Creator'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-card-md border border-contour-subtle shadow-elevated py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-contour-subtle">
                <p className="text-xs font-bold text-ink-primary truncate">
                  {accountName}
                </p>
                <p className="text-[11px] text-ink-muted truncate">
                  {profile?.email || authUser?.email || ''}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/photographer/business"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-ink-secondary hover:text-ink-primary hover:bg-canvas-secondary"
                >
                  <User className="w-3.5 h-3.5 text-ink-muted" />
                  <span>My Studio Profile</span>
                </Link>
                <Link
                  href="/photographer/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-ink-secondary hover:text-ink-primary hover:bg-canvas-secondary"
                >
                  <Settings className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Studio Settings</span>
                </Link>
                <Link
                  href={creatorProfile?.id ? `/photographers/${creatorProfile.id}` : '/photographer/portfolio'}
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
                  onClick={handleSignOut}
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
