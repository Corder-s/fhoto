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

export const CustomerHeader: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
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

  const unreadCount = INITIAL_NOTIFICATIONS.filter((n) => n.unread).length || 0;
  const displayName = user?.name || currentProfile.name || 'Customer';
  const displayAvatar = user?.avatarUrl || currentProfile.avatar || '';

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E1D6]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-card-sm bg-[#FF6E00] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Camera className="w-5 h-5 fill-white/20 stroke-[2.2]" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[#1A1816]">
              SnapShoot
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
            <Search className="w-4 h-4 text-[#8C847A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search photographers, locations, or categories..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-white border border-[#E0D8CD] placeholder-[#8C847A] text-[#1A1816] focus:outline-none focus:border-[#FF6E00] focus:ring-1 focus:ring-[#FF6E00]/20 transition-all shadow-sm"
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
                    ? 'text-[#FF6E00]'
                    : 'text-[#5A544D] hover:text-[#1A1816]'
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
              className="p-2 rounded-full text-[#5A544D] hover:text-[#1A1816] hover:bg-[#F2ECE3] relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#E53935] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                  1
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white border border-[#E8E1D6] rounded-2xl shadow-elevated p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-[#F0EAE1] flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#1A1816]">
                    Client Notifications
                  </span>
                  <Link
                    href="/customer/notifications"
                    onClick={() => setShowNotifMenu(false)}
                    className="text-[11px] font-bold text-[#FF6E00] hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-[#F0EAE1]">
                  {INITIAL_NOTIFICATIONS.map((n) => (
                    <Link
                      key={n.id}
                      href={n.actionHref || '/customer/notifications'}
                      onClick={() => setShowNotifMenu(false)}
                      className={`block px-3 py-2.5 hover:bg-[#FAF7F2] transition-colors ${
                        n.unread ? 'bg-[#FFF8F0]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-[#1A1816]">{n.title}</p>
                        <span className="text-[10px] text-[#8C847A] shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-[#665E55] mt-0.5 line-clamp-2">{n.message}</p>
                    </Link>
                  ))}
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
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-[#E0D8CD] bg-white hover:bg-[#FAF7F2] transition-all"
            >
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-7 h-7 rounded-full object-cover border border-[#E8E1D6]"
              />
              <span className="hidden md:inline text-xs font-bold text-[#1A1816]">
                {displayName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8C847A]" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E8E1D6] rounded-2xl shadow-elevated p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-[#F0EAE1]">
                  <p className="text-xs font-bold text-[#1A1816]">{displayName}</p>
                  <p className="text-[11px] text-[#8C847A] truncate">{user?.email || currentProfile.email || 'priya.sharma@example.com'}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/customer/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#5A544D] hover:text-[#1A1816] hover:bg-[#FAF7F2] rounded-lg"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#8C847A]" />
                    <span>Account Settings</span>
                  </Link>
                  {user?.role === 'creator' ? (
                    <Link
                      href="/photographer/dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#FF6E00] hover:bg-[#FFF4E6] rounded-lg"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#FF6E00]" />
                      <span>Switch to Creator Studio</span>
                    </Link>
                  ) : (
                    <Link
                      href="/for-photographers"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#5A544D] hover:text-[#1A1816] hover:bg-[#FAF7F2] rounded-lg"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#8C847A]" />
                      <span>Join as Photographer</span>
                    </Link>
                  )}
                </div>
                <div className="border-t border-[#F0EAE1] pt-1 mt-1">
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
            className="p-2 text-[#1A1816] hover:bg-[#F2ECE3] rounded-full lg:hidden"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E8E1D6] bg-[#FAF7F2] px-4 pt-2 pb-6 space-y-3">
          <nav className="flex flex-col space-y-1.5 font-bold text-xs text-[#1A1816]">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive ? 'bg-[#FF6E00] text-white' : 'hover:bg-[#F2ECE3] text-[#5A544D]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-[#E8E1D6] flex flex-col gap-2">
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-full font-bold text-xs text-white bg-[#FF6E00] shadow-sm"
            >
              + Book New Shoot
            </Link>
            <Link
              href="/photographer/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 rounded-full font-bold text-xs text-[#5A544D] bg-[#F2ECE3] border border-[#E0D8CD]"
            >
              Switch to Creator Studio
            </Link>
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
