'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Camera,
  TrendingUp,
  BarChart3,
  PieChart,
  DollarSign,
  Settings,
  LogOut,
  Lock,
  ShieldAlert,
  ArrowLeft,
  User,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth';
import { useServerSession } from '../../../lib/useServerSession';
import { useAuthModal } from '../../../components/auth/AuthModalContext';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/owner/dashboard';
  const router = useRouter();
  const { user, isAuthenticated, isMounted, logout } = useAuth();
  const { openAuthModal } = useAuthModal();
  const serverSession = useServerSession();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      openAuthModal({
        returnUrl: pathname,
        initialTab: 'login',
        message: 'Owner Executive Dashboard requires platform ownership credentials.',
      });
    }
  }, [isMounted, isAuthenticated, pathname, openAuthModal]);

  const serverRoles = serverSession.status === 'authenticated' ? serverSession.user.roles : [];
  const isOwner = serverRoles.includes('owner');
  const isAdmin = !isOwner && serverRoles.includes('admin');
  const isCreator = !isOwner && !isAdmin && serverRoles.includes('creator');

  // Automatically redirect non-owner authenticated users to their assigned dashboards
  useEffect(() => {
    if (isMounted && isAuthenticated && serverSession.status === 'authenticated' && !isOwner) {
      if (isAdmin) {
        router.replace('/admin/dashboard');
      } else if (isCreator) {
        router.replace('/photographer/dashboard');
      } else {
        router.replace('/customer/dashboard');
      }
    }
  }, [isMounted, isAuthenticated, serverSession.status, isOwner, isAdmin, isCreator, router]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-canvas-primary flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-canvas-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-contour-subtle p-8 text-center space-y-4 shadow-elevated">
          <div className="w-14 h-14 rounded-2xl bg-ink-primary text-white flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-ink-primary">Owner Credentials Required</h1>
          <p className="text-xs sm:text-sm text-ink-secondary">
            Please log in with verified platform ownership credentials to inspect executive metrics.
          </p>
          <button
            onClick={() => openAuthModal({ returnUrl: pathname, initialTab: 'login' })}
            className="w-full py-3 px-6 rounded-2xl bg-ink-primary hover:bg-black text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
          >
            Log In as Owner
          </button>
          <Link href="/" className="block text-xs font-semibold text-ink-muted hover:text-ink-primary pt-2">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Ownership is a database role: user_roles.role = 'owner' (see
  // docs/AUTHORIZATION_AND_ROLE_ACCESS.md). The session comes from the server, so
  // this is display gating only - /api/owner/stats and /api/admin/roles repeat the
  // check and answer 403 without it.
  // Ownership is a database role: user_roles.role = 'owner'.
  if (serverSession.status === 'loading') {
    return (
      <div className="min-h-screen bg-canvas-primary flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-canvas-primary flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#64748B]">
            {isAdmin
              ? 'Redirecting to Admin Operations Desk...'
              : isCreator
              ? 'Redirecting to Creator Studio Dashboard...'
              : 'Redirecting to Customer Dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-primary flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-ink-primary text-white flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-ink-secondary/30 flex items-center justify-between">
            <div className="flex items-center gap-2 select-none cursor-default" aria-label="REEPY Brand">
              <div className="w-8 h-8 rounded-card-sm bg-brand flex items-center justify-center text-white">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                REEPY
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand text-white">
              OWNER
            </span>
          </div>

          <nav className="p-4 space-y-1 text-sm font-semibold text-gray-300">
            <Link
              href="/owner/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-card-sm bg-brand text-white"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Executive Overview</span>
            </Link>
            <Link
              href="/owner/dashboard#administrators"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-card-sm hover:bg-white/10 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Administrators &amp; Permissions</span>
            </Link>
            <Link
              href="/owner/dashboard#verification-pipeline"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-card-sm hover:bg-white/10 hover:text-white transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Verification Pipeline</span>
            </Link>
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-card-sm hover:bg-white/10 hover:text-white transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Review Queue (admin)</span>
            </Link>
            <Link
              href="/owner/dashboard#marketplace-ledger"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-card-sm hover:bg-white/10 hover:text-white transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Marketplace Ledger</span>
            </Link>
            <Link
              href="/owner/dashboard#supply-by-city"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-card-sm hover:bg-white/10 hover:text-white transition-colors"
            >
              <PieChart className="w-4 h-4" />
              <span>City Supply</span>
            </Link>
          </nav>
        </div>

        {/* User profile & bottom actions */}
        <div className="p-4 border-t border-ink-secondary/30 space-y-2.5">
          {/* Owner Account Card */}
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'O'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Platform Owner'}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Return to Public Website */}
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Public Website</span>
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            id="owner-sidebar-logout-btn"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Owner Content */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        {/* Top Executive Header with Status & Logout */}
        <div className="mb-6 p-3.5 bg-white border border-contour-subtle rounded-card-sm text-xs text-ink-muted flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-ink-primary">Executive Security Desk</span>
                <span className="font-mono text-[10px] font-extrabold bg-ink-primary text-white px-2 py-0.5 rounded">
                  ROLE: OWNER
                </span>
              </div>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Financial analytics and take-rate governance restricted to verified platform owners.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
            <span className="text-xs font-semibold text-ink-secondary hidden lg:inline">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              id="owner-header-logout-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              title="Log out of Owner Executive Account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
