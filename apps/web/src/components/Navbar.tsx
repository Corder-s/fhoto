'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Camera, ShieldCheck, User, Menu, X, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-canvas-primary/95 backdrop-blur-md border-b border-contour-subtle transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-card-sm bg-brand flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-ink-primary">
            Snap<span className="text-brand">Shoot</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-[15px] font-medium text-ink-secondary">
          <Link href="/explore" className="hover:text-ink-primary transition-colors">
            Explore
          </Link>
          <Link href="/photographers" className="hover:text-ink-primary transition-colors">
            Find Creators
          </Link>
          <Link href="/categories" className="hover:text-ink-primary transition-colors">
            Categories
          </Link>
          <Link href="/how-it-works" className="hover:text-ink-primary transition-colors">
            How It Works
          </Link>
          <Link href="/for-photographers" className="flex items-center gap-1.5 text-brand hover:text-brand-hover font-semibold transition-colors">
            <ShieldCheck className="w-4 h-4" />
            For Photographers
          </Link>
        </nav>

        {/* Desktop Action Controls */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2.5 rounded-card-sm text-sm font-semibold text-ink-primary hover:bg-canvas-secondary border border-contour-subtle transition-all"
          >
            <User className="w-4 h-4 text-ink-secondary" />
            Sign In
          </Link>
          <Link
            href="/photographers"
            className="inline-flex items-center px-5 py-2.5 rounded-card-sm text-sm font-semibold text-white bg-brand hover:bg-brand-hover active:bg-brand-active shadow-sm transition-all"
          >
            Book a Shoot
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center gap-2">
          <Link
            href="/login"
            className="p-2.5 rounded-card-sm text-ink-primary hover:bg-canvas-secondary border border-contour-subtle sm:hidden"
            aria-label="Account"
          >
            <User className="w-5 h-5" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-card-sm text-ink-primary hover:bg-canvas-secondary border border-contour-subtle"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-contour-subtle bg-canvas-primary px-4 pt-2 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3 font-semibold text-base text-ink-primary">
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-card-sm hover:bg-canvas-secondary"
            >
              Explore Map & Directory
            </Link>
            <Link
              href="/photographers"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-card-sm hover:bg-canvas-secondary"
            >
              Find Creators Near You
            </Link>
            <Link
              href="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-card-sm hover:bg-canvas-secondary"
            >
              Browse Categories
            </Link>
            <Link
              href="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-card-sm hover:bg-canvas-secondary"
            >
              How SnapShoot Works
            </Link>
            <Link
              href="/for-photographers"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-card-sm bg-brand-subtle text-brand flex items-center justify-between"
            >
              <span>Join as a Creator</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </nav>

          <div className="pt-2 border-t border-contour-subtle flex flex-col gap-2.5">
            <Link
              href="/photographers"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-3 rounded-card-sm font-bold text-white bg-brand shadow-sm"
            >
              Book a Shoot Now
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-3 rounded-card-sm font-bold text-ink-primary bg-canvas-secondary border border-contour-subtle"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
