'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Sparkles
} from 'lucide-react';
import { INITIAL_CUSTOMER_PROFILE, INITIAL_NOTIFICATIONS } from '../../data/customerDashboardData';
import { clearAuthSession } from '../../lib/auth';

export const CustomerHeader: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const navLinks = [
    { label: 'Overview', href: '/customer/dashboard', icon: Sparkles },
    { label: 'My Bookings', href: '/customer/bookings', icon: Calendar },
    { label: 'Photo Gallery', href: '/customer/gallery', icon: ImageIcon },
    { label: 'Payments & Escrow', href: '/customer/payments', icon: CreditCard },
    { label: 'Reviews', href: '/customer/reviews', icon: Star },
    { label: 'Settings', href: '/customer/settings', icon: Settings },
  ];

  const unreadCount = INITIAL_NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E1D6]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Portal Tag */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-card-sm bg-[#FF6E00] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Camera className="w-5 h-5 fill-white/20 stroke-[2.2]" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[#1A1816]">
              SNAPSHOOT
            </span>
          </Link>

          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-[#F2ECE3] text-[#5A544D] border border-[#E0D8CD]">
            Client Portal
          </span>
        </div>

        {/* Center Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#FF6E00] text-white shadow-sm'
                    : 'text-[#5A544D] hover:text-[#1A1816] hover:bg-[#F2ECE3]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
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
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6E00] ring-2 ring-white" />
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

          {/* Book New Shoot Button */}
          <Link
            href="/explore"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#FF6E00] hover:bg-[#E86300] active:scale-95 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Book New Shoot</span>
          </Link>

          {/* Profile Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifMenu(false);
              }}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border border-[#E0D8CD] bg-white hover:bg-[#FAF7F2] transition-all"
            >
              <img
                src={INITIAL_CUSTOMER_PROFILE.avatar}
                alt={INITIAL_CUSTOMER_PROFILE.name}
                className="w-7 h-7 rounded-full object-cover border border-[#E8E1D6]"
              />
              <span className="hidden md:inline text-xs font-bold text-[#1A1816]">
                {INITIAL_CUSTOMER_PROFILE.name.split(' ')[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8C847A]" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E8E1D6] rounded-2xl shadow-elevated p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-[#F0EAE1]">
                  <p className="text-xs font-bold text-[#1A1816]">{INITIAL_CUSTOMER_PROFILE.name}</p>
                  <p className="text-[11px] text-[#8C847A] truncate">{INITIAL_CUSTOMER_PROFILE.email}</p>
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
                  <Link
                    href="/photographer/dashboard"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#FF6E00] hover:bg-[#FFF4E6] rounded-lg"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#FF6E00]" />
                    <span>Switch to Creator Studio</span>
                  </Link>
                </div>
                <div className="border-t border-[#F0EAE1] pt-1 mt-1">
                  <Link
                    href="/"
                    onClick={() => {
                      clearAuthSession();
                      setShowProfileMenu(false);
                    }}
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
              href="/"
              onClick={() => {
                clearAuthSession();
                setMobileMenuOpen(false);
              }}
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
