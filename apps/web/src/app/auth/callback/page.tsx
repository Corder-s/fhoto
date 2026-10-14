'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { getSupabaseBrowserClient } from '../../../lib/supabase/client';
import { saveAuthSession, AuthUser } from '../../../lib/auth';
import { resolvePostAuthRedirect } from '../../../lib/safeRedirect';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;

    const processSession = async (session: any) => {
      if (!session?.user) return;
      const user = session.user;
      const meta = user.user_metadata || {};
      const returnUrl = searchParams.get('returnUrl');

      try {
        // Query the server with the cryptographic access token to determine exact account status
        const res = await fetch('/api/auth/session', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const data = await res.json();

        if (data.authenticated && data.user) {
          const serverUser = data.user;

          // 1. If this is a new user who has NOT yet selected an account type,
          // route them directly to the Account Selection Screen (/auth/select-role).
          if (serverUser.roleSelected === false) {
            const authUser: AuthUser = {
              id: serverUser.id,
              name: serverUser.name || meta.full_name || meta.name || user.email?.split('@')[0] || 'User',
              email: serverUser.email || user.email || '',
              phone: meta.phone || user.phone,
              avatarUrl: meta.avatar_url || meta.picture,
              role: 'customer', // temporary until selection is made
              roleSelected: false,
            };

            saveAuthSession(authUser, session.access_token);
            setStatus('success');

            const selectRoleUrl = `/auth/select-role${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;
            setTimeout(() => {
              window.location.href = selectRoleUrl;
            }, 600);
            return;
          }

          // 2. Existing user with established role choice:
          // Identify their verified role and redirect directly to their dashboard.
          const effectiveRole = serverUser.roles?.includes('owner')
            ? 'owner'
            : serverUser.roles?.includes('admin')
            ? 'admin'
            : serverUser.roles?.includes('creator') || serverUser.hasCreatorProfile
            ? 'creator'
            : 'customer';

          const authUser: AuthUser = {
            id: serverUser.id,
            name: serverUser.name || meta.full_name || meta.name || user.email?.split('@')[0] || 'User',
            email: serverUser.email || user.email || '',
            phone: meta.phone || user.phone,
            avatarUrl: meta.avatar_url || meta.picture,
            role: effectiveRole,
            roleSelected: true,
          };

          saveAuthSession(authUser, session.access_token);
          setStatus('success');

          const targetUrl = resolvePostAuthRedirect(authUser.role, returnUrl || undefined);
          setTimeout(() => {
            window.location.href = targetUrl;
          }, 800);
          return;
        }
      } catch (err) {
        console.warn('Could not verify server session in callback, using safe fallback:', err);
      }

      // 3. Resilient offline/network fallback
      const hasExplicitRole = Boolean(meta.role);
      const role = (meta.role as AuthUser['role']) || 'customer';
      const authUser: AuthUser = {
        id: user.id,
        name: meta.full_name || meta.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        phone: meta.phone || user.phone,
        avatarUrl: meta.avatar_url || meta.picture,
        role: role === 'photographer' ? 'creator' : role,
        roleSelected: hasExplicitRole ? true : false,
      };

      saveAuthSession(authUser, session.access_token);
      setStatus('success');

      // If user came with no prior role metadata, send to select-role
      const targetUrl = hasExplicitRole
        ? resolvePostAuthRedirect(authUser.role, returnUrl || undefined)
        : `/auth/select-role${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;

      setTimeout(() => {
        window.location.href = targetUrl;
      }, 800);
    };

    const runCallback = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        // Fallback simulated success if Supabase is offline/not configured
        const timer = setTimeout(() => {
          setStatus('success');
          setTimeout(() => {
            window.location.href = '/auth/select-role';
          }, 1000);
        }, 1500);
        return () => clearTimeout(timer);
      }

      try {
        const code = searchParams.get('code');
        if (code) {
          try {
            const { data: exchangeData } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeData?.session && !isCancelled) {
              processSession(exchangeData.session);
              return;
            }
          } catch {
            // May have already been exchanged by client internal handler
          }
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          if (!isCancelled) {
            setStatus('error');
            setErrorMessage(error.message);
          }
          return;
        }

        if (session) {
          processSession(session);
        } else {
          // Listen to auth state changes (e.g. from PKCE exchange)
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            if (newSession && !isCancelled) {
              processSession(newSession);
              subscription.unsubscribe();
            }
          });

          // Timeout fallback in case no session arrives within 6s
          const timeout = setTimeout(() => {
            if (!isCancelled && status === 'processing') {
              setStatus('error');
              setErrorMessage('Authentication session could not be established. Please try again.');
              subscription.unsubscribe();
            }
          }, 6000);

          return () => {
            clearTimeout(timeout);
            subscription.unsubscribe();
          };
        }
      } catch (err: any) {
        if (!isCancelled) {
          setStatus('error');
          setErrorMessage(err?.message || 'Authentication callback failed.');
        }
      }
    };

    runCallback();

    return () => {
      isCancelled = true;
    };
  }, [searchParams]);

  return (
    <Card className="max-w-md w-full text-center p-8 sm:p-10 border-contour-subtle shadow-card space-y-6">
      <div className="w-12 h-12 rounded-card-sm bg-brand flex items-center justify-center text-white mx-auto shadow-sm">
        <Camera className="w-6 h-6" />
      </div>

      {status === 'processing' && (
        <div className="space-y-4">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <h1 className="text-xl font-extrabold text-ink-primary">
              Verifying Session Security
            </h1>
            <p className="text-xs sm:text-sm text-ink-secondary mt-1">
              Exchanging cryptographic authentication tokens with the platform gateway...
            </p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-ink-primary">
              Session Authenticated!
            </h1>
            <p className="text-xs sm:text-sm text-ink-secondary mt-1">
              Redirecting you to your workspace...
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-ink-primary">
              Authentication Failed
            </h1>
            <p className="text-xs sm:text-sm text-ink-secondary mt-1">
              {errorMessage || 'The session token was invalid, expired, or rejected by the authorization server.'}
            </p>
          </div>
          <Link href="/login">
            <Button variant="primary" className="w-full" size="md">
              Return to Sign In
            </Button>
          </Link>
        </div>
      )}

      <div className="pt-2 border-t border-contour-subtle text-[11px] text-ink-muted">
        SnapShoot OAuth 2.0 & OpenID Connect Gateway
      </div>
    </Card>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-canvas-primary flex flex-col justify-center items-center p-4">
      <Suspense
        fallback={
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        }
      >
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}
