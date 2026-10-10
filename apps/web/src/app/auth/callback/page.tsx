'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    // Simulate token verification and session handshake
    const timer = setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        window.location.href = '/customer/dashboard';
      }, 1000);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-canvas-primary flex flex-col justify-center items-center p-4">
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
                Authentication Callback Failed
              </h1>
              <p className="text-xs sm:text-sm text-ink-secondary mt-1">
                The session token was invalid, expired, or rejected by the authorization server.
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
    </div>
  );
}
