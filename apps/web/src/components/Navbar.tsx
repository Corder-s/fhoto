'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Camera, ArrowRight, Menu, X, User, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useAuthModal } from './auth/AuthModalContext';
import { getRoleDashboard } from '../lib/safeRedirect';

export interface NavbarProps {
  variant?: 'dark' | 'light' | 'auto';
}

export default function Navbar({ variant = 'auto' }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname() || '';

  const isHome = pathname === '/';
  const isDarkMode = variant === 'dark' || (variant === 'auto' && isHome);

  // Role-appropriate dashboard URL
  const dashboardHref = getRoleDashboard(user?.role);

  const isDashboardActive =
    pathname === dashboardHref ||
    pathname.startsWith(`${dashboardHref}/`);

  const isExploreActive =
    pathname === '/explore' ||
    pathname.startsWith('/explore/') ||
    pathname === '/photographers' ||
    pathname.startsWith('/photographers/') ||
    pathname === '/categories';

  const isCreatorRole = user?.role === 'creator' || user?.role === 'photographer';
  const isAdminRole = user?.role === 'admin' || user?.role === 'owner';

  const bookingsHref = isCreatorRole
    ? '/photographer/bookings'
    : isAdminRole
    ? '/admin/bookings'
    : '/customer/bookings';

  const bookingsLabel = isCreatorRole
    ? 'Booking Requests'
    : isAdminRole
    ? 'All Bookings'
    : 'My Bookings';

  const isBookingsActive =
    pathname === bookingsHref ||
    pathname.startsWith(`${bookingsHref}/`) ||
    pathname.includes('/bookings');

  const galleryHref = isCreatorRole
    ? '/photographer/portfolio'
    : '/customer/gallery';

  const galleryLabel = isCreatorRole
    ? 'Portfolio Gallery'
    : 'Photo Gallery';

  const isGalleryActive =
    pathname === galleryHref ||
    pathname.startsWith(`${galleryHref}/`) ||
    pathname === '/customer/gallery' ||
    pathname === '/photographer/portfolio';

  const isHowItWorksActive =
    pathname === '/how-it-works' ||
    pathname.startsWith('/how-it-works/');

  const isForPhotographersActive =
    pathname === '/for-photographers' ||
    pathname.startsWith('/for-photographers/');

  const supportHref = isCreatorRole
    ? '/photographer/support'
    : isAdminRole
    ? '/admin/support'
    : '/customer/support';

  const isSupportActive =
    pathname === supportHref ||
    pathname.startsWith(`${supportHref}/`) ||
    pathname === '/help';

  const userSettingsHref =
    isCreatorRole
      ? '/photographer/settings'
      : user?.role === 'admin'
      ? '/admin/dashboard'
      : user?.role === 'owner'
      ? '/owner/dashboard'
      : '/customer/settings';

  return (
    <header
      className={`sticky top-0 z-50 transition-all ${
        isDarkMode
          ? 'bg-[#0D0F12]/95 backdrop-blur-md border-b border-[#1F242D] text-white'
          : 'bg-white/95 backdrop-blur-md border-b border-[#E7EAEE] text-[#191C22]'
      }`}
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo - Teal rounded square with camera inside + REEPY */}
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer select-none" aria-label="REEPY Brand">
          <div className="w-10 h-10 rounded-xl bg-[#14B8A6] flex items-center justify-center text-[#0D0F12] shadow-sm group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5 stroke-[2.4]" />
          </div>
          <span className={`text-xl sm:text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-[#191C22]'}`}>
            REEPY
          </span>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-[14px] font-semibold">
          {isAuthenticated ? (
            /* Authenticated navigation */
            <>
              <Link
                href={dashboardHref}
                className={`transition-colors flex items-center gap-1.5 ${
                  isDashboardActive
                    ? 'text-[#14B8A6] font-bold'
                    : isDarkMode
                    ? 'text-[#94A3B8] hover:text-white'
                    : 'text-[#64748B] hover:text-[#191C22]'
                }`}
              >
                {isDashboardActive && <Sparkles className="w-3.5 h-3.5 text-[#14B8A6]" />}
                <span>Dashboard</span>
              </Link>
              <Link
                href="/explore"
                className={`transition-colors ${
                  isExploreActive
                    ? 'text-[#14B8A6] font-bold'
                    : isDarkMode
                    ? 'text-[#94A3B8] hover:text-white'
                    : 'text-[#64748B] hover:text-[#191C22]'
                }`}
              >
                Browse Photographers
              </Link>
              <Link
                href={bookingsHref}
                className={`transition-colors ${
                  isBookingsActive
                    ? 'text-[#14B8A6] font-bold'
                    : isDarkMode
                    ? 'text-[#94A3B8] hover:text-white'
                    : 'text-[#64748B] hover:text-[#191C22]'
                }`}
              >
                {bookingsLabel}
              </Link>
              <Link
                href={galleryHref}
                className={`transition-colors ${
                  isGalleryActive
                    ? 'text-[#14B8A6] font-bold'
                    : isDarkMode
                    ? 'text-[#94A3B8] hover:text-white'
                    : 'text-[#64748B] hover:text-[#191C22]'
                }`}
              >
                {galleryLabel}
              </Link>
              <Link
                href={supportHref}
                className={`transition-colors ${
                  isSupportActive
                    ? 'text-[#14B8A6] font-bold'
                    : isDarkMode
                    ? 'text-[#94A3B8] hover:text-white'
                    : 'text-[#64748B] hover:text-[#191C22]'
                }`}
              >
                Support
              </Link>
            </>
          ) : (
            /* Public REEPY Navigation matching reference */
            <>
              <Link
                href="/explore"
                className={`transition-colors ${
                  isExploreActive
                    ? 'text-[#14B8A6] font-bold'
                    : isDarkMode
                    ? 'text-[#CBD5E1] hover:text-white'
                    : 'text-[#64748B] hover:text-[#191C22]'
                }`}
              >
                Browse
              </Link>
              <Link
                href="/how-it-works"
                className={`transition-colors ${
                  isHowItWorksActive
                    ? 'text-[#14B8A6] font-bold'
                    : isDarkMode
                    ? 'text-[#CBD5E1] hover:text-white'
                    : 'text-[#64748B] hover:text-[#191C22]'
                }`}
              >
                How it Works
              </Link>
              <Link
                href="/for-photographers"
                className={`transition-colors ${
                  isForPhotographersActive
                    ? 'text-[#14B8A6] font-bold'
                    : isDarkMode
                    ? 'text-[#CBD5E1] hover:text-white'
                    : 'text-[#64748B] hover:text-[#191C22]'
                }`}
              >
                Become a Pro
              </Link>
              <Link
                href="/help"
                className={`transition-colors ${
                  pathname === '/help'
                    ? 'text-[#14B8A6] font-bold'
                    : isDarkMode
                    ? 'text-[#CBD5E1] hover:text-white'
                    : 'text-[#64748B] hover:text-[#191C22]'
                }`}
              >
                Help Center
              </Link>
            </>
          )}
        </nav>

        {/* Right Desktop Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              href={userSettingsHref}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-[#171A1F] border-[#262B33] text-white hover:bg-[#20252D]'
                  : 'bg-[#F1F3F5] border-[#E7EAEE] text-[#191C22] hover:bg-[#E2E8F0]'
              }`}
              title={isCreatorRole ? 'Creator Studio Settings' : 'Client Profile & Settings'}
            >
              <div className="w-6 h-6 rounded-full bg-[#14B8A6] text-[#0D0F12] flex items-center justify-center text-[11px] font-black">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span className="max-w-[120px] truncate">{user?.name || (isCreatorRole ? 'Creator' : 'Client')}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                  isCreatorRole
                    ? 'bg-[#14B8A6] text-[#0D0F12]'
                    : 'bg-[#EFFCF8] text-[#0F766E] border border-[#99F6E4]'
                }`}
              >
                {isCreatorRole ? 'Studio' : 'Client'}
              </span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  openAuthModal({ initialTab: 'login' });
                }}
                className={`px-4 py-2 text-xs font-bold transition-colors ${
                  isDarkMode
                    ? 'text-[#CBD5E1] hover:text-white'
                    : 'text-[#191C22] hover:text-[#14B8A6]'
                }`}
              >
                Log in
              </Link>

              <Link
                href="/for-photographers"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#14B8A6] hover:bg-[#0D9488] active:bg-[#0F766E] text-[#0D0F12] hover:text-white shadow-sm transition-all"
              >
                <span>Join as Photographer</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center gap-2">
          {isAuthenticated ? (
            <Link
              href={userSettingsHref}
              className={`p-2 rounded-full ${
                isDarkMode ? 'bg-[#171A1F] text-white border border-[#262B33]' : 'bg-[#F1F3F5] text-[#191C22] border border-[#E7EAEE]'
              }`}
              aria-label="User Profile"
            >
              <User className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                openAuthModal({ initialTab: 'login' });
              }}
              className={`p-2 rounded-full ${
                isDarkMode ? 'bg-[#171A1F] text-white border border-[#262B33]' : 'bg-[#F1F3F5] text-[#191C22] border border-[#E7EAEE]'
              }`}
              aria-label="Log in"
            >
              <User className="w-4 h-4" />
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-xl ${isDarkMode ? 'hover:bg-[#171A1F] text-white' : 'hover:bg-[#F1F3F5] text-[#191C22]'}`}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className={`lg:hidden px-4 pt-2 pb-6 space-y-4 border-b ${
            isDarkMode ? 'bg-[#0D0F12] border-[#1F242D]' : 'bg-white border-[#E7EAEE]'
          }`}
        >
          <nav className="flex flex-col space-y-3 font-semibold text-sm">
            {isAuthenticated ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-2 ${
                    isDashboardActive ? 'text-[#14B8A6] font-bold bg-[#14B8A6]/10' : ''
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[#14B8A6]" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/explore"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl transition-colors ${
                    isExploreActive ? 'text-[#14B8A6] font-bold bg-[#14B8A6]/10' : ''
                  }`}
                >
                  Browse Photographers
                </Link>
                <Link
                  href={bookingsHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl transition-colors ${
                    isBookingsActive ? 'text-[#14B8A6] font-bold bg-[#14B8A6]/10' : ''
                  }`}
                >
                  {bookingsLabel}
                </Link>
                <Link
                  href={galleryHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl transition-colors ${
                    isGalleryActive ? 'text-[#14B8A6] font-bold bg-[#14B8A6]/10' : ''
                  }`}
                >
                  {galleryLabel}
                </Link>
                <Link
                  href={supportHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl transition-colors ${
                    isSupportActive ? 'text-[#14B8A6] font-bold bg-[#14B8A6]/10' : ''
                  }`}
                >
                  Help & Support
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/explore"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-[#14B8A6]/10 hover:text-[#14B8A6] transition-colors"
                >
                  Browse
                </Link>
                <Link
                  href="/how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-[#14B8A6]/10 hover:text-[#14B8A6] transition-colors"
                >
                  How it Works
                </Link>
                <Link
                  href="/for-photographers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-[#14B8A6]/10 hover:text-[#14B8A6] transition-colors"
                >
                  Become a Pro
                </Link>
                <Link
                  href="/help"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-[#14B8A6]/10 hover:text-[#14B8A6] transition-colors"
                >
                  Help Center
                </Link>
              </>
            )}
          </nav>

          {!isAuthenticated && (
            <div className="pt-2 border-t border-[#1F242D] flex flex-col gap-2">
              <Link
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  openAuthModal({ initialTab: 'login' });
                }}
                className="w-full text-center py-2.5 text-xs font-bold border border-[#E7EAEE]/20 rounded-xl text-white"
              >
                Log in
              </Link>
              <Link
                href="/for-photographers"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-xs font-bold rounded-xl bg-[#14B8A6] text-[#0D0F12]"
              >
                Join as Photographer
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
