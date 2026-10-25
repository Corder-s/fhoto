'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Camera,
  Calendar,
  Image as ImageIcon,
  CreditCard,
  Star,
  Bell,
  Settings,
  Menu,
  X,
  Plus,
  ChevronDown,
  User,
  LogOut,
  Sparkles,
  Search,
  MessageSquare
} from 'lucide-react';
import { INITIAL_CUSTOMER_PROFILE, INITIAL_NOTIFICATIONS } from '../../data/customerDashboardData';
import { clearAuthSession, useAuth } from '../../lib/auth';
import { getCustomerPreferences, CustomerPreferences } from '../../lib/settingsService';

import { useNotifications } from '../../lib/useNotifications';

export const CustomerHeader: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    setShowProfileMenu(false);
    setMobileMenuOpen(false);
    await logout();
    router.push('/login');
  };

  // Get active profile preferences if saved
  const [currentProfile, setCurrentProfile] = useState<CustomerPreferences['profile']>(() => {
    try {
      return getCustomerPreferences().profile;
    } catch {
      return getCustomerPreferences().profile;
    }
  });

  useEffect(() => {
    try {
      const p = getCustomerPreferences().profile;
      setCurrentProfile(p);
    } catch {}
  }, [pathname]);

  const navLinks = [
    { label: 'Dashboard', href: '/customer/dashboard', icon: Sparkles },
    { label: 'Explore', href: '/explore', icon: Camera },
    { label: 'Bookings', href: '/customer/bookings', icon: Calendar },
    { label: 'Messages', href: '/customer/bookings?tab=messages', icon: MessageSquare },
  ];

  const displayName = user?.name || currentProfile.name || 'Customer';
  const displayAvatar = user?.avatarUrl || currentProfile.avatar || '';

  return (
    <header className="sticky top-0 z-40 bg-[#F5F7F9]/95 backdrop-blur-md border-b border-[#E7EAEE]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-card-sm bg-[#14B8A6] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Camera className="w-5 h-5 fill-white/20 stroke-[2.2]" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[#191C22]">
              REEPY
            </span>
          </Link>
        </div>

        {/* Search Bar matching reference image */}
        <div className="hidden md:flex items-center flex-1 max-w-sm lg:max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
            className="w-full relative"
          >
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search photographers, locations, or categories..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-white border border-[#E7EAEE] placeholder-[#94A3B8] text-[#191C22] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]/20 transition-all shadow-sm"
            />
          </form>
        </div>

        {/* Center/Right Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`text-xs font-bold transition-all ${
                  isActive
                    ? 'text-[#14B8A6]'
                    : 'text-[#64748B] hover:text-[#191C22]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowProfileMenu(false);
              }}
              className="p-2 rounded-full text-[#64748B] hover:text-[#191C22] hover:bg-[#F1F3F5] relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#E53935] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white border border-[#E7EAEE] rounded-2xl shadow-elevated p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-[#E7EAEE] flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#191C22]">
                    Client Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAsRead()}
                        className="text-[10px] font-bold text-[#94A3B8] hover:text-[#191C22]"
                      >
                        Mark read
                      </button>
                    )}
                    <Link
                      href="/customer/notifications"
                      onClick={() => setShowNotifMenu(false)}
                      className="text-[11px] font-bold text-[#14B8A6] hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-[#E7EAEE]">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#94A3B8]">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <Link
                        key={n.id}
                        href={n.actionUrl || '/customer/notifications'}
                        onClick={() => {
                          markAsRead(n.id);
                          setShowNotifMenu(false);
                        }}
                        className={`block px-3 py-2.5 hover:bg-[#F5F7F9] transition-colors ${
                          !n.readAt ? 'bg-[#EFFCF8]' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-[#191C22]">{n.title}</p>
                          <span className="text-[10px] text-[#94A3B8] shrink-0">
                            {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2">{n.body}</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifMenu(false);
              }}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-[#E7EAEE] bg-white hover:bg-[#F5F7F9] transition-all"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-[#14B8A6] text-white flex items-center justify-center text-[10px] font-black border border-[#E7EAEE] shrink-0 relative">
                <span className="select-none">{displayName[0]?.toUpperCase() || 'C'}</span>
                {displayAvatar && (
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
              <span className="hidden md:inline text-xs font-bold text-[#191C22]">
                {displayName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E7EAEE] rounded-2xl shadow-elevated p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-[#E7EAEE]">
                  <p className="text-xs font-bold text-[#191C22]">{displayName}</p>
                  <p className="text-[11px] text-[#94A3B8] truncate">{user?.email || currentProfile.email || 'priya.sharma@example.com'}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/customer/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#64748B] hover:text-[#191C22] hover:bg-[#F5F7F9] rounded-lg"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <span>Account Settings</span>
                  </Link>
                  {user?.role === 'creator' ? (
                    <Link
                      href="/photographer/dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#14B8A6] hover:bg-[#EFFCF8] rounded-lg"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#14B8A6]" />
                      <span>Switch to Creator Studio</span>
                    </Link>
                  ) : (
                    <Link
                      href="/photographer/onboarding"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#14B8A6] hover:bg-[#EFFCF8] rounded-lg"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#14B8A6]" />
                      <span>Become a Photographer</span>
                    </Link>
                  )}
                </div>
                <div className="border-t border-[#E7EAEE] pt-1 mt-1">
                  <Link
                    href="/login"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#191C22] hover:bg-[#F1F3F5] rounded-full lg:hidden"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E7EAEE] bg-[#F5F7F9] px-4 pt-2 pb-6 space-y-3">
          <nav className="flex flex-col space-y-1.5 font-bold text-xs text-[#191C22]">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive ? 'bg-[#14B8A6] text-white' : 'hover:bg-[#F1F3F5] text-[#64748B]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-[#E7EAEE] flex flex-col gap-2">
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-full font-bold text-xs text-white bg-[#14B8A6] shadow-sm"
            >
              + Book New Shoot
            </Link>
            {user?.role === 'creator' ? (
              <Link
                href="/photographer/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-full font-bold text-xs text-[#14B8A6] bg-[#EFFCF8] border border-[#99F6E4]"
              >
                Switch to Creator Studio
              </Link>
            ) : (
              <Link
                href="/photographer/onboarding"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-full font-bold text-xs text-[#14B8A6] bg-[#EFFCF8] border border-[#99F6E4]"
              >
                Become a Photographer
              </Link>
            )}
            <Link
              href="/login"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-full font-bold text-xs text-red-600 bg-red-50 border border-red-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
