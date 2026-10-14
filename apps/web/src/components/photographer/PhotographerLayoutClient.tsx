'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, Lock, ShieldAlert, ArrowRight, UserCheck, ShieldCheck, Home } from 'lucide-react';
import { PhotographerSidebar } from './PhotographerSidebar';
import { PhotographerHeader } from './PhotographerHeader';
import { useAuth } from '../../lib/auth';
import { useServerSession } from '../../lib/useServerSession';
import { useAuthModal } from '../auth/AuthModalContext';

export const PhotographerLayoutClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname() || '/photographer/dashboard';
  const router = useRouter();
  const { user, isAuthenticated, isMounted, logout } = useAuth();
  const { openAuthModal } = useAuthModal();
  const serverSession = useServerSession();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Auto redirect to /login if unauthenticated or signed out from protected photographer routes (preserving returnUrl)
  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isMounted, isAuthenticated, pathname, router]);

  // Role gate uses the server-verified roles (never the localStorage copy).
  const serverRoles = serverSession.status === 'authenticated' ? serverSession.user.roles : [];
  const isOwner = serverRoles.includes('owner');
  const isAdmin = !isOwner && serverRoles.includes('admin');
  const isAuthorizedRole = !isOwner && !isAdmin && serverRoles.includes('creator');

  // Automatic redirect based on user permissions
  useEffect(() => {
    if (isMounted && isAuthenticated && serverSession.status === 'authenticated' && !isAuthorizedRole) {
      if (isOwner) {
        router.replace('/owner/dashboard');
      } else if (isAdmin) {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/customer/dashboard');
      }
    }
  }, [isMounted, isAuthenticated, serverSession.status, isAuthorizedRole, isOwner, isAdmin, router]);

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

  if (serverSession.status === 'loading') {
    return (
      <div className="min-h-screen bg-canvas-primary flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FF6E00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthorizedRole) {
    return (
      <div className="min-h-screen bg-canvas-primary flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#FF6E00] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-ink-secondary">
            {isOwner
              ? 'Redirecting to Owner Executive Dashboard...'
              : isAdmin
              ? 'Redirecting to Admin Operations Desk...'
              : 'Redirecting to Customer Dashboard...'}
          </p>
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
