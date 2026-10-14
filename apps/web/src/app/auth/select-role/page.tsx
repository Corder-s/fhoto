'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Camera,
  Calendar,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ImageIcon,
  DollarSign,
  Clock,
  Layers,
  AlertCircle,
  Loader2,
  User,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuth, saveAuthSession, AuthUser } from '../../../lib/auth';
import { resolvePostAuthRedirect } from '../../../lib/safeRedirect';
import { getSupabaseBrowserClient } from '../../../lib/supabase/client';

function SelectRoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isMounted } = useAuth();
  const returnUrl = searchParams.get('returnUrl');

  const [selectedRole, setSelectedRole] = useState<'customer' | 'creator' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionUserName, setSessionUserName] = useState('');

  // 1. Check account state on mount: if user already has an active role, redirect directly!
  useEffect(() => {
    let isCancelled = false;

    async function checkAccountRole() {
      try {
        let token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!token) {
          const supabase = getSupabaseBrowserClient();
          if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            token = session?.access_token || null;
          }
        }

        const res = await fetch('/api/auth/session', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();

        if (isCancelled) return;

        if (data.authenticated && data.user) {
          setSessionUserName(data.user.name || '');

          // If the user already finalized role selection, bypass this screen immediately!
          if (data.user.roleSelected) {
            const destination = resolvePostAuthRedirect(data.user.role, returnUrl);
            router.replace(destination);
            return;
          }
        } else if (!user && isMounted) {
          // If not logged in, redirect to login
          router.replace(`/login${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`);
          return;
        }
      } catch (err) {
        console.warn('Could not verify server role selection status:', err);
      } finally {
        if (!isCancelled) {
          setIsCheckingAccount(false);
        }
      }
    }

    if (isMounted) {
      checkAccountRole();
    }

    return () => {
      isCancelled = true;
    };
  }, [user, isMounted, returnUrl, router]);

  const handleSelectRole = async (role: 'customer' | 'creator') => {
    if (isSubmitting) return;
    setSelectedRole(role);
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) {
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          token = session?.access_token || null;
        }
      }

      const res = await fetch('/api/auth/select-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          role,
          returnUrl: returnUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to finalize account selection.');
      }

      // Update browser session cache with chosen role
      if (user) {
        const updatedAuthUser: AuthUser = {
          ...user,
          role: data.role,
          roleSelected: true,
        };
        saveAuthSession(updatedAuthUser, token || undefined);
      }

      // Navigate to destination
      setTimeout(() => {
        window.location.href = data.redirectUrl;
      }, 400);
    } catch (err: any) {
      setIsSubmitting(false);
      setSelectedRole(null);
      setErrorMessage(err?.message || 'Could not save account selection. Please try again.');
    }
  };

  const displayName = sessionUserName || user?.name || 'Creator';

  if (isCheckingAccount) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
        <div className="w-12 h-12 border-4 border-[#FF6E00] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-[#5A544D]">Checking account profile...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Brand Header & Headline */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF2E8] border border-[#FFD9BE] text-[#FF6E00] text-xs font-black tracking-wide uppercase shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 2 of 2: Choose Your Account Type</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1A1816] tracking-tight">
          How would you like to join us?
        </h1>
        <p className="text-sm sm:text-base text-[#665E55] max-w-xl mx-auto leading-relaxed">
          Welcome to SnapShoot, {displayName}! Please choose your account type to proceed.
        </p>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm font-semibold text-red-700 flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Two Role Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* OPTION 1: CLIENT / CUSTOMER */}
        <div
          onClick={() => !isSubmitting && handleSelectRole('customer')}
          className={`relative flex flex-col justify-between p-6 sm:p-8 rounded-[28px] border-2 transition-all duration-300 cursor-pointer text-left bg-white shadow-card hover:shadow-elevated hover:-translate-y-1 group ${
            selectedRole === 'customer'
              ? 'border-[#FF6E00] ring-4 ring-[#FF6E00]/15'
              : 'border-[#E8E1D6] hover:border-[#FFB780]'
          }`}
        >
          {/* Top Badge */}
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF6EE] border border-[#FFDECA] flex items-center justify-center text-[#FF6E00] shadow-2xs group-hover:scale-110 transition-transform">
              <User className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-[#FAF7F2] border border-[#E8E1D6] text-[#665E55]">
              Option A
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <h2 className="text-2xl font-black text-[#1A1816] group-hover:text-[#FF6E00] transition-colors">
                CUSTOMER
              </h2>
              <p className="text-xs sm:text-sm text-[#8C847A] font-semibold mt-0.5">
                Client Account
              </p>
            </div>

            <p className="text-xs sm:text-sm text-[#665E55] leading-relaxed font-medium">
              Discover photographers, explore portfolios, compare packages, and book photography services.
            </p>

            {/* Feature Checklist */}
            <div className="pt-4 border-t border-[#F2ECE3] space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-[#1A1816] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#FF6E00] shrink-0 mt-0.5" />
                <span>Explore photographers by category and city</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-[#1A1816] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#FF6E00] shrink-0 mt-0.5" />
                <span>View photographer profiles, verified portfolios & client reviews</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-[#1A1816] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#FF6E00] shrink-0 mt-0.5" />
                <span>Book photography services with distance-based travel pricing</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-[#1A1816] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#FF6E00] shrink-0 mt-0.5" />
                <span>Manage bookings, in-app chat, and delivery notifications</span>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-8">
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-center gap-2 py-3.5 rounded-full font-bold text-xs sm:text-sm group-hover:bg-[#FF6E00] group-hover:text-white group-hover:border-[#FF6E00] transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting && selectedRole === 'customer' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Activating Customer Workspace...</span>
                </>
              ) : (
                <>
                  <span>Continue as Customer</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* OPTION 2: PHOTOGRAPHER / CREATOR */}
        <div
          onClick={() => !isSubmitting && handleSelectRole('creator')}
          className={`relative flex flex-col justify-between p-6 sm:p-8 rounded-[28px] border-2 transition-all duration-300 cursor-pointer text-left bg-white shadow-card hover:shadow-elevated hover:-translate-y-1 group ${
            selectedRole === 'creator'
              ? 'border-[#FF6E00] ring-4 ring-[#FF6E00]/15'
              : 'border-[#E8E1D6] hover:border-[#FFB780]'
          }`}
        >
          {/* Top Badge */}
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6E00] flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-[#FFF2E8] border border-[#FFD9BE] text-[#FF6E00]">
              Option B • Pro Studio
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <h2 className="text-2xl font-black text-[#1A1816] group-hover:text-[#FF6E00] transition-colors">
                PHOTOGRAPHER / CREATOR
              </h2>
              <p className="text-xs sm:text-sm text-[#8C847A] font-semibold mt-0.5">
                Creator Account
              </p>
            </div>

            <p className="text-xs sm:text-sm text-[#665E55] leading-relaxed font-medium">
              Showcase your work, create your photography portfolio, offer professional services, and manage bookings.
            </p>

            {/* Feature Checklist */}
            <div className="pt-4 border-t border-[#F2ECE3] space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-[#1A1816] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#FF6E00] shrink-0 mt-0.5" />
                <span>Create a professional photographer profile & bio</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-[#1A1816] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#FF6E00] shrink-0 mt-0.5" />
                <span>Upload a profile picture and high-impact cover banner</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-[#1A1816] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#FF6E00] shrink-0 mt-0.5" />
                <span>Upload high-resolution portfolio photographs</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-[#1A1816] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#FF6E00] shrink-0 mt-0.5" />
                <span>Configure photography packages, deliverables & travel pricing</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-[#1A1816] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#FF6E00] shrink-0 mt-0.5" />
                <span>Submit profile for admin approval & access creator dashboard</span>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-8">
            <Button
              type="button"
              variant="primary"
              className="w-full justify-center gap-2 py-3.5 rounded-full font-bold text-xs sm:text-sm shadow-sm"
              disabled={isSubmitting}
            >
              {isSubmitting && selectedRole === 'creator' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Initializing Photographer Studio...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Join as Photographer</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Safety Notice & Footer Guarantee */}
      <div className="pt-4 text-center">
        <p className="text-xs text-[#8C847A] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            You are securely authenticated with your Google account. Clients can also apply to become photographers at any time.
          </span>
        </p>
      </div>
    </div>
  );
}

export default function SelectRolePage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-10 h-10 border-4 border-[#FF6E00] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-[#8C847A]">Loading account options...</p>
          </div>
        }
      >
        <SelectRoleContent />
      </Suspense>
    </div>
  );
}
