'use client';

import React from 'react';
import { useAuth } from '../lib/auth';
import { ZomatoPublicLanding } from '../components/home/ZomatoPublicLanding';
import { OriginalAuthenticatedLanding } from '../components/home/OriginalAuthenticatedLanding';

export default function HomePage() {
  const { isAuthenticated, isMounted } = useAuth();

  // AFTER SUCCESSFUL LOGIN — Display ORIGINAL SnapShoot landing page
  if (isMounted && isAuthenticated) {
    return <OriginalAuthenticatedLanding />;
  }

  // BEFORE LOGIN (and during SSR) — Display Zomato-inspired public landing page
  return <ZomatoPublicLanding />;
}
