'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { useAuth } from '../../lib/auth';
import { useServerSession } from '../../lib/useServerSession';
import { useAuthModal } from '../auth/AuthModalContext';

export const CustomerLayoutClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname() || '/customer/dashboard';
  const router = useRouter();
  const { user, isAuthenticated, isMounted } = useAuth();
  const { openAuthModal } = useAuthModal();
  const serverSession = useServerSession();

  // Strict role boundaries: admin, owner, and creator accounts are redirected to their designated workspaces.
  const serverRoles = serverSession.status === 'authenticated' ? serverSession.user.roles : [];
  const isOwner = serverRoles.includes('owner');
  const isAdmin = !isOwner && serverRoles.includes('admin');
  const isCreator = !isOwner && !isAdmin && serverRoles.includes('creator');

  // Role Redirection Gate
  useEffect(() => {
    if (isMounted && isAuthenticated && serverSession.status === 'authenticated') {
      if (isOwner) {
        router.replace('/owner/dashboard');
      } else if (isAdmin) {
        router.replace('/admin/dashboard');
      } else if (isCreator) {
        router.replace('/photographer/dashboard');
      }
    }
  }, [isMounted, isAuthenticated, serverSession.status, isOwner, isAdmin, isCreator, router]);

  // Automatically prompt authentication modal if visiting a protected customer route while logged out
  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      openAuthModal({
        returnUrl: pathname,
        message: 'Please log in or create an account to access your customer bookings, galleries, and dashboard.',
      });
    }
  }, [isMounted, isAuthenticated, pathname, openAuthModal]);

  // Loading skeleton while reading storage/cookies
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FF6E00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirecting other roles to their specific workspaces
  if (isAuthenticated && (isOwner || isAdmin || isCreator)) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#FF6E00] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#5A544D]">
            {isOwner
              ? 'Redirecting to Owner Executive Dashboard...'
              : isAdmin
              ? 'Redirecting to Admin Operations Desk...'
              : 'Redirecting to Creator Studio Dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  // Authentication Gate: Never expose protected customer content to unauthenticated visitors
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#1A1816] flex flex-col font-sans selection:bg-[#FF6E00] selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-[640px] w-full mx-auto px-4 py-16 sm:py-24 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#FF6E00] flex items-center justify-center text-white mb-6 shadow-md">
            <Lock className="w-8 h-8 stroke-[2.2]" />
          </div>

          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#FFF3E5] text-[#FF6E00] border border-[#FFD4A8] mb-3">
            Customer Area Protected
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1816] tracking-tight mb-2">
            Authentication Required
          </h1>

          <p className="text-xs sm:text-sm text-[#5A544D] mb-8 max-w-md leading-relaxed">
            Please log in or create an account to access your customer bookings, delivered photo galleries, and personalized dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mb-6">
            <button
              onClick={() => openAuthModal({ returnUrl: pathname, initialTab: 'login' })}
              className="flex-1 py-3 px-6 rounded-2xl bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Log In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => openAuthModal({ returnUrl: pathname, initialTab: 'register' })}
              className="flex-1 py-3 px-6 rounded-2xl bg-white hover:bg-[#F2ECE3] border border-[#E8E2D8] text-[#1A1816] text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              Create Account
            </button>
          </div>

          <div className="inline-flex items-center gap-1.5 text-[11px] text-[#8C847A]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF6E00]" />
            <span>256-bit secure session • Authenticated account required</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1816] flex flex-col font-sans selection:bg-[#FF6E00] selection:text-white">
      <Navbar />
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};
