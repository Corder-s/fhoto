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

  // Unified authentication state: authenticated either in local client or via SSR session cookie
  const isAuthed = isAuthenticated || serverSession.status === 'authenticated';

  // Strict role boundaries: admin, owner, and creator accounts are redirected to their designated workspaces.
  const serverRoles = serverSession.status === 'authenticated' ? serverSession.user.roles : [];
  const isOwner = serverRoles.includes('owner');
  const isAdmin = !isOwner && serverRoles.includes('admin');
  const isCreator = !isOwner && !isAdmin && serverRoles.includes('creator');

  // Role Redirection Gate
  useEffect(() => {
    if (isMounted && isAuthed) {
      if (serverSession.status === 'authenticated' && serverSession.user.roleSelected === false) {
        router.replace('/auth/select-role');
        return;
      }
      if (user && user.roleSelected === false) {
        router.replace('/auth/select-role');
        return;
      }

      if (serverSession.status === 'authenticated') {
        if (isOwner) {
          router.replace('/owner/dashboard');
        } else if (isAdmin) {
          router.replace('/admin/dashboard');
        } else if (isCreator) {
          router.replace('/photographer/dashboard');
        }
      }
    }
  }, [isMounted, isAuthed, user, serverSession, isOwner, isAdmin, isCreator, router]);

  // Prompt authentication modal if visiting a protected customer route while logged out
  useEffect(() => {
    if (isMounted && !isAuthed) {
      openAuthModal({
        returnUrl: pathname,
        message: 'Please log in or create an account to access your customer bookings, galleries, and dashboard.',
      });
    }
  }, [isMounted, isAuthed, pathname, openAuthModal]);

  // Loading skeleton while reading storage/cookies
  if (!isMounted || (serverSession.status === 'loading' && !isAuthenticated)) {
    return (
      <div className="min-h-screen bg-[#F5F7F9] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirecting other roles to their specific workspaces
  if (isAuthed && (isOwner || isAdmin || isCreator)) {
    return (
      <div className="min-h-screen bg-[#F5F7F9] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#64748B]">
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
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[#F5F7F9] text-[#191C22] flex flex-col font-sans selection:bg-[#14B8A6] selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-[640px] w-full mx-auto px-4 py-16 sm:py-24 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#14B8A6] flex items-center justify-center text-white mb-6 shadow-md shadow-[#14B8A6]/20">
            <Lock className="w-8 h-8 stroke-[2.2]" />
          </div>

          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#EFFCF8] text-[#14B8A6] border border-[#14B8A6]/30 mb-3">
            Customer Area Protected
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-[#191C22] tracking-tight mb-2">
            Authentication Required
          </h1>

          <p className="text-xs sm:text-sm text-[#64748B] mb-8 max-w-md leading-relaxed">
            Please log in or create an account to access your customer bookings, delivered photo galleries, and personalized dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mb-6">
            <button
              onClick={() => openAuthModal({ returnUrl: pathname, initialTab: 'login' })}
              className="flex-1 py-3 px-6 rounded-2xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Log In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => openAuthModal({ returnUrl: pathname, initialTab: 'register' })}
              className="flex-1 py-3 px-6 rounded-2xl bg-white hover:bg-[#F1F3F5] border border-[#E7EAEE] text-[#191C22] text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              Create Account
            </button>
          </div>

          <div className="inline-flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#14B8A6]" />
            <span>256-bit secure session • Authenticated account required</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] text-[#191C22] flex flex-col font-sans selection:bg-[#14B8A6] selection:text-white">
      <Navbar />
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};
