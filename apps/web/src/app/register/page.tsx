'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { SnapShootAuthView } from '../../components/auth/SnapShootAuthView';
import { clearAuthSession, useAuth } from '../../lib/auth';
import { useServerSession } from '../../lib/useServerSession';
import { resolvePostAuthRedirect } from '../../lib/safeRedirect';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isMounted } = useAuth();
  const serverSession = useServerSession();

  useEffect(() => {
    if (!isMounted) return;

    if (serverSession.status === 'loading') return;

    if (serverSession.status === 'anonymous' || serverSession.status === 'error') {
      if (isAuthenticated) {
        clearAuthSession();
      }
      return;
    }

    if (serverSession.status === 'authenticated') {
      if (serverSession.user.roleSelected === false) {
        router.replace('/auth/select-role');
        return;
      }

      const primaryRole = serverSession.user.roles.includes('owner')
        ? 'owner'
        : serverSession.user.roles.includes('admin')
        ? 'admin'
        : serverSession.user.roles.includes('creator')
        ? 'creator'
        : 'customer';

      const target = resolvePostAuthRedirect(primaryRole);
      router.replace(target);
    }
  }, [isMounted, isAuthenticated, serverSession, router]);

  if (isMounted && serverSession.status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7F9]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#64748B]">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7F9]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8">
        <SnapShootAuthView isModal={false} initialTab="register" rolePreference="customer" />
      </main>
      <Footer />
    </div>
  );
}
