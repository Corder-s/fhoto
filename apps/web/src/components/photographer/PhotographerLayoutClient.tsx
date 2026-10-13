'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, Lock, ShieldAlert, ArrowRight, UserCheck, ShieldCheck, Home } from 'lucide-react';
import { PhotographerSidebar } from './PhotographerSidebar';
import { PhotographerHeader } from './PhotographerHeader';
import { useAuth } from '../../lib/auth';
import { useAuthModal } from '../auth/AuthModalContext';

export const PhotographerLayoutClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname() || '/photographer/dashboard';
  const router = useRouter();
  const { user, isAuthenticated, isMounted, logout } = useAuth();
  const { openAuthModal } = useAuthModal();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Auto redirect to /login if unauthenticated or signed out from protected photographer routes (preserving returnUrl)
  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isMounted, isAuthenticated, pathname, router]);

  // Loading skeleton while reading storage/cookies
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-canvas-primary flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FF6E00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Unauthenticated Gate: Redirecting to login
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-canvas-primary flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#FF6E00] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-ink-secondary">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // 2. Role-Based Authorization Gate: Customers cannot enter photographer-only workspace
  const isAuthorizedRole =
    user.role === 'creator' ||
    user.role === 'photographer' ||
    user.role === 'admin' ||
    user.role === 'owner';

  // Automatically deny access and redirect customers to customer dashboard
  useEffect(() => {
    if (isMounted && isAuthenticated && user && !isAuthorizedRole) {
      router.replace('/customer/dashboard');
    }
  }, [isMounted, isAuthenticated, user, isAuthorizedRole, router]);

  if (!isAuthorizedRole) {
    return (
      <div className="min-h-screen bg-canvas-primary text-ink-primary flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full bg-white rounded-3xl border border-contour-subtle shadow-elevated p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Role Permission Restriction
            </span>
            <h1 className="text-2xl font-black text-ink-primary tracking-tight">
              Creator Account Required
            </h1>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              You are signed in with a <strong className="text-ink-primary">Customer</strong> account (
              <span className="text-[#FF6E00]">{user.email}</span>). Customer accounts cannot access the photographer business studio.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => router.push('/customer/dashboard')}
              className="w-full py-3 px-6 rounded-2xl bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to Customer Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                logout();
                openAuthModal({
                  returnUrl: pathname,
                  initialTab: 'register',
                  rolePreference: 'creator',
                });
              }}
              className="w-full py-3 px-6 rounded-2xl bg-[#F2ECE3] hover:bg-[#E8E2D8] text-ink-primary border border-contour-subtle text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              Register as Creator Partner
            </button>

            <button
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
              className="w-full py-2.5 text-xs font-semibold text-ink-muted hover:text-red-600 transition-colors cursor-pointer"
            >
              Sign Out of Current Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized Photographer Workspace
  return (
    <div className="min-h-screen bg-canvas-primary text-ink-primary flex">
      {/* Sidebar */}
      <PhotographerSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <PhotographerHeader
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          isOnline={isOnline}
          onToggleOnline={() => setIsOnline(!isOnline)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
