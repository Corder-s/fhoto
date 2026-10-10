'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Camera, Search, ArrowRight, Menu, X, User, LogOut, Calendar, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EDE6DC] transition-all">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-card-sm bg-[#FF6E00] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Camera className="w-5 h-5 fill-white/20 stroke-[2.2]" />
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-[#1A1816]">
            SNAPSHOOT
          </span>
        </Link>

        {/* Center/Right Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-7 text-[14px] font-semibold text-[#5A544D]">
          {isAuthenticated ? (
            <>
              <Link href="/customer/dashboard" className="hover:text-[#1A1816] transition-colors flex items-center gap-1.5 text-[#FF6E00]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <Link href="/explore" className="hover:text-[#1A1816] transition-colors">
                Explore photographers
              </Link>
              <Link href="/customer/bookings" className="hover:text-[#1A1816] transition-colors">
                My Bookings
              </Link>
              <Link href="/customer/gallery" className="hover:text-[#1A1816] transition-colors">
                Photo Gallery
              </Link>
            </>
          ) : (
            <>
              <Link href="/explore" className="hover:text-[#1A1816] transition-colors">
                Explore photographers
              </Link>
              <Link href="/how-it-works" className="hover:text-[#1A1816] transition-colors">
                How it works
              </Link>
              <Link href="/for-photographers" className="hover:text-[#1A1816] transition-colors">
                Become a photographer
              </Link>
            </>
          )}
        </nav>

        {/* Right Desktop Auth Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href="/customer/dashboard"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F2ECE3] border border-[#E5DDD2] text-xs font-bold text-[#1A1816] hover:bg-[#EAE2D7] transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-[#FF6E00] text-white flex items-center justify-center text-[10px]">
                  {user?.name ? user.name[0] : 'U'}
                </div>
                <span>{user?.name || 'My Account'}</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#5A544D] hover:text-red-600 hover:bg-red-50 border border-[#E5DDD2] transition-colors"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-bold text-[#1A1816] hover:text-[#FF6E00] transition-colors"
              >
                Log in
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#FF6E00] hover:bg-[#E86300] active:scale-[0.98] shadow-sm transition-all"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center gap-2">
          {isAuthenticated ? (
            <Link
              href="/customer/dashboard"
              className="p-2 rounded-full text-[#1A1816] bg-[#F2ECE3] border border-[#E5DDD2] sm:hidden"
              aria-label="Dashboard"
            >
              <User className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="p-2 rounded-full text-[#1A1816] bg-[#F2ECE3] border border-[#E5DDD2] sm:hidden"
              aria-label="Account"
            >
              <User className="w-4 h-4" />
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-card-sm text-[#1A1816] hover:bg-[#F2ECE3]"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#EDE6DC] bg-[#FAF7F2] px-4 pt-2 pb-6 space-y-4">
          <nav className="flex flex-col space-y-3 font-semibold text-sm text-[#1A1816]">
            {isAuthenticated ? (
              <>
                <Link
                  href="/customer/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-card-sm hover:bg-[#F2ECE3] text-[#FF6E00] flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/explore"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-card-sm hover:bg-[#F2ECE3]"
                >
                  Explore photographers
                </Link>
                <Link
                  href="/customer/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-card-sm hover:bg-[#F2ECE3]"
                >
                  My Bookings
                </Link>
                <Link
                  href="/customer/gallery"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-card-sm hover:bg-[#F2ECE3]"
                >
                  Photo Gallery
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-card-sm hover:bg-[#F2ECE3]"
                >
                  How it works
                </Link>
                <Link
                  href="/for-photographers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-card-sm hover:bg-[#F2ECE3]"
                >
                  Become a photographer
                </Link>
              </>
            )}
          </nav>

          <div className="pt-2 border-t border-[#EDE6DC] flex flex-col gap-2.5">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-center py-2.5 rounded-full font-bold text-xs text-red-600 bg-red-50 border border-red-200"
              >
                Log out ({user?.name || 'Account'})
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-full font-bold text-xs text-[#1A1816] bg-[#F2ECE3] border border-[#E5DDD2]"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-full font-bold text-xs text-white bg-[#FF6E00] shadow-sm"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
