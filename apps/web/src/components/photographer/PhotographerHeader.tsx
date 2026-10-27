'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  ExternalLink,
  Settings,
  LogOut,
  Search,
  User,
  Share2,
  Check,
  ShieldCheck,
  Radio,
  LifeBuoy
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    setShowProfileMenu(false);
    await logout();
    router.push('/login');
  };

  const publicUrl = creatorProfile?.id
    ? `/photographers/${creatorProfile.id}`
    : '/photographer/business';

  const handleCopyProfileLink = () => {
    if (typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}${publicUrl}`;
      navigator.clipboard?.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const displayName = creatorProfile?.professional_name || accountName || 'Creator';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shadow-2xs">
      {/* Left: Mobile Toggle + Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden transition-colors"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search input */}
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shoots, client names, services..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#14B8A6] focus:bg-white focus:ring-2 focus:ring-[#14B8A6]/20 transition-all font-medium"
          />
        </div>
      </div>

      {/* Right Controls: Live Profile, Notifications, Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Public Profile Preview Button */}
        <Link
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#14B8A6] text-slate-700 hover:text-[#0D9488] bg-slate-50 hover:bg-[#14B8A6]/5 text-xs font-semibold transition-all shadow-2xs"
          title="Open your public photographer profile in a new tab"
        >
          <span>Live Profile</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </Link>

        {/* Share Profile Link Button */}
        <button
          onClick={handleCopyProfileLink}
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer relative"
          title="Copy public profile link"
        >
          {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          {copiedLink && (
            <span className="absolute -bottom-8 right-0 text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded shadow-md whitespace-nowrap z-50">
              Link copied!
            </span>
          )}
        </button>

        {/* Help & Support Desk Link */}
        <Link
          href="/photographer/support"
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          title="Creator Studio Help Center & Support"
        >
          <LifeBuoy className="w-5 h-5 stroke-[1.8]" />
        </Link>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 stroke-[1.8]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#14B8A6] text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
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
                  <span className="text-[10px] font-bold text-[#0D9488] bg-[#14B8A6]/10 px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No new notifications.
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
                      className={`block px-4 py-3 hover:bg-slate-50 transition-colors ${
                        !item.readAt ? 'bg-teal-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs ${!item.readAt ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.body}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] text-white flex items-center justify-center text-xs font-black shadow-xs relative">
              <span>{initials}</span>
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
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                {displayName}
              </p>
              <p className="text-[10px] text-[#0D9488] font-semibold">
                Creator Studio
              </p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {creatorProfile?.city || 'Delhi NCR'}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/photographer/business"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>My Profile</span>
                </Link>
                <Link
                  href="/photographer/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Settings</span>
                </Link>
                <Link
                  href={publicUrl}
                  target="_blank"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>View Public Profile</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
