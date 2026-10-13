'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ZomatoPublicLanding } from '../components/home/ZomatoPublicLanding';
import { useAuth } from '../lib/auth';
import { getRoleDashboard } from '../lib/safeRedirect';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, isMounted } = useAuth();

  useEffect(() => {
    if (isMounted && isAuthenticated && user) {
      const targetDashboard = getRoleDashboard(user.role);
      router.replace(targetDashboard);
    }
  }, [isMounted, isAuthenticated, user, router]);

  // If user is verified authenticated on client after mounting, show smooth redirect transition
  if (isMounted && isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FF6E00] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#736B63]">Directing to your dashboard...</p>
      </div>
    );
  }

  // Logged-out visitor or server initial render: display public SnapShoot landing page
  return <ZomatoPublicLanding />;
}
