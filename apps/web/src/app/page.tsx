'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ZomatoPublicLanding } from '../components/home/ZomatoPublicLanding';
import { useAuth, getStoredSession } from '../lib/auth';
import { getRoleDashboard } from '../lib/safeRedirect';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, isMounted } = useAuth();

  // Read session synchronously on initial client render to avoid flashing
  const [initialSession] = useState(() => {
    if (typeof window === 'undefined') return null;
    return getStoredSession();
  });

  const activeUser = user || initialSession;
  const isAuthed = isAuthenticated || Boolean(initialSession);

  useEffect(() => {
    if (activeUser) {
      const targetDashboard = getRoleDashboard(activeUser.role);
      router.replace(targetDashboard);
    }
  }, [activeUser, router]);

  // If user is authenticated, render smooth redirect state to never expose public landing page
  if (isAuthed && activeUser) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#FF6E00] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#736B63]">Directing to your dashboard...</p>
      </div>
    );
  }

  // Logged-out visitor: display existing public SnapShoot landing page
  return <ZomatoPublicLanding />;
}
