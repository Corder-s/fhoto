'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { SnapShootAuthView } from '../../components/auth/SnapShootAuthView';

/**
 * Sign-in page.
 *
 * `?next=` (also accepts `?returnUrl=`) is where to go after a successful
 * sign-in. The protected-area middleware sets it when it bounces an anonymous
 * visitor, so an owner returning to /owner/dashboard lands back there instead of
 * on their default dashboard. The destination is validated by
 * `resolvePostAuthRedirect`, which keeps a customer from being sent into an
 * admin area and refuses off-origin URLs.
 */
function LoginView() {
  const searchParams = useSearchParams();
  const requested = searchParams?.get('next') || searchParams?.get('returnUrl') || undefined;
  const returnUrl = requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8">
        <SnapShootAuthView isModal={false} initialTab="login" returnUrl={returnUrl} />
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
