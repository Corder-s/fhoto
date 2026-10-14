'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { SnapShootAuthView } from '../../components/auth/SnapShootAuthView';
import { useAuth } from '../../lib/auth';
import { useServerSession } from '../../lib/useServerSession';
import { resolvePostAuthRedirect } from '../../lib/safeRedirect';

/**
 * Sign-in page.
 *
 * Automatically detects authenticated visitors and redirects them to their
 * respective role dashboard (or authorized returnUrl). Unauthenticated users
 * see the standard secure login portal.
 */
function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isMounted } = useAuth();
  const serverSession = useServerSession();
  const requested = searchParams?.get('next') || searchParams?.get('returnUrl') || undefined;
  const returnUrl = requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : undefined;

  useEffect(() => {
    if (isMounted && isAuthenticated && user) {
      if (serverSession.status === 'authenticated') {
        if (serverSession.user.roleSelected === false) {
          router.replace(`/auth/select-role${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`);
          return;
        }
      } else if (user.roleSelected === false) {
        router.replace(`/auth/select-role${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`);
        return;
      }

      const primaryRole =
        serverSession.status === 'authenticated'
          ? serverSession.user.roles.includes('owner')
            ? 'owner'
            : serverSession.user.roles.includes('admin')
            ? 'admin'
            : serverSession.user.roles.includes('creator')
            ? 'creator'
            : 'customer'
          : user.role;

      const target = resolvePostAuthRedirect(primaryRole, returnUrl);
      router.replace(target);
    }
  }, [isMounted, isAuthenticated, user, serverSession, returnUrl, router]);

  if (isMounted && isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#FF6E00] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#5A544D]">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  const isDeleted = searchParams?.get('deleted') === 'true';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8">
        <SnapShootAuthView
          isModal={false}
          initialTab="login"
          returnUrl={returnUrl}
          message={isDeleted ? 'Your account and all associated data have been permanently deleted.' : undefined}
        />
      </main>
      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
          <div className="w-8 h-8 border-4 border-[#FF6E00] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginView />
    </Suspense>
  );
}
