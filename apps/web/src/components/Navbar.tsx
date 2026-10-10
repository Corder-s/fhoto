'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Camera, Search, ArrowRight, Menu, X, User } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        {/* Center Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-[14px] font-semibold text-[#5A544D]">
          <Link href="/explore" className="hover:text-[#1A1816] transition-colors">
            Explore
          </Link>
          <Link href="/how-it-works" className="hover:text-[#1A1816] transition-colors">
            How it works
          </Link>
          <Link href="/for-photographers" className="hover:text-[#1A1816] transition-colors">
            For photographers
          </Link>
          <Link href="/stories" className="hover:text-[#1A1816] transition-colors">
            Stories
          </Link>
        </nav>

        {/* Right Desktop Controls */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Search Icon Button */}
          <Link
            href="/explore"
            className="p-2 text-[#5A544D] hover:text-[#1A1816] hover:bg-[#F2ECE3] rounded-full transition-colors"
            title="Search photographers"
          >
            <Search className="w-4 h-4 stroke-[2.2]" />
          </Link>

          {/* Sign In Pill Button */}
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-full text-xs font-bold text-[#1A1816] bg-[#F2ECE3]/80 hover:bg-[#EAE2D7] border border-[#E5DDD2] transition-all"
          >
            Sign in
          </Link>

          {/* Book a Shoot Orange Pill Button */}
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#FF6E00] hover:bg-[#E86300] active:scale-[0.98] shadow-sm transition-all"
          >
            <span>Book a shoot</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center gap-2">
          <Link
            href="/login"
            className="p-2 rounded-full text-[#1A1816] bg-[#F2ECE3] border border-[#E5DDD2] sm:hidden"
            aria-label="Account"
          >
            <User className="w-4 h-4" />
          </Link>
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
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-card-sm hover:bg-[#F2ECE3]"
            >
              Explore
            </Link>
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
              For photographers
            </Link>
            <Link
              href="/stories"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-card-sm hover:bg-[#F2ECE3]"
            >
              Stories
            </Link>
          </nav>

          <div className="pt-2 border-t border-[#EDE6DC] flex flex-col gap-2.5">
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-full font-bold text-xs text-white bg-[#FF6E00] shadow-sm"
            >
              Book a shoot →
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-full font-bold text-xs text-[#1A1816] bg-[#F2ECE3] border border-[#E5DDD2]"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
