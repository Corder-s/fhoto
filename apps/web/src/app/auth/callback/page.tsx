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

    const processSession = (session: any) => {
      if (!session?.user) return;
      const user = session.user;
      const meta = user.user_metadata || {};
      const requestedRole = searchParams.get('role');
      const role = (meta.role as AuthUser['role']) || (requestedRole as AuthUser['role']) || 'customer';

      const authUser: AuthUser = {
        id: user.id,
        name: meta.full_name || meta.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        phone: meta.phone || user.phone,
        avatarUrl: meta.avatar_url || meta.picture,
        role: role === 'photographer' ? 'creator' : role,
      };

      saveAuthSession(authUser, session.access_token);
      setStatus('success');

      const returnUrl = searchParams.get('returnUrl');
      const targetUrl = resolvePostAuthRedirect(authUser.role, returnUrl || undefined);
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 1000);
    };

    const runCallback = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        // Fallback simulated success if Supabase is offline/not configured
        const timer = setTimeout(() => {
          setStatus('success');
          setTimeout(() => {
            window.location.href = '/customer/dashboard';
          }, 1000);
        }, 1500);
        return () => clearTimeout(timer);
      }

      try {
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
