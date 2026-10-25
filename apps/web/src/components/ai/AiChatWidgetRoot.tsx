'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth';

const REEPYAiChatWidget = dynamic<{ variant: 'customer' | 'photographer' }>(
  () => import('./SnapShootAiChatWidget').then((m) => m.REEPYAiChatWidget),
  { ssr: false }
);

export const AiChatWidgetRoot: React.FC = () => {
  const pathname = usePathname() || '/';
  const { user, isAuthenticated, isMounted } = useAuth();

  // 1. Unmounted or unauthenticated visitors: Render absolutely nothing (zero DOM footprint)
  if (!isMounted || !isAuthenticated || !user) {
    return null;
  }

  // 2. Unauthenticated or public landing page:
  // If user is not authenticated or if on root '/' without an active workspace session, do not render launcher
  if (pathname === '/' && (!isAuthenticated || !user)) {
    return null;
  }

  const isPhotographerRoute = pathname.startsWith('/photographer');

  // 3. Authenticated Photographer Studio: Restrict to verified creator/photographer/admin/owner roles
  if (isPhotographerRoute) {
    const isAuthorizedCreator =
      user.role === 'creator' ||
      user.role === 'photographer' ||
      user.role === 'admin' ||
      user.role === 'owner';

    if (!isAuthorizedCreator) {
      return null;
    }

    return <REEPYAiChatWidget variant="photographer" />;
  }

  // 4. Authenticated Customer Experience: Restricted to customers/admins/owners
  const isAuthorizedCustomer =
    user.role === 'customer' ||
    user.role === 'admin' ||
    user.role === 'owner';

  if (!isAuthorizedCustomer) {
    return null;
  }

  return <REEPYAiChatWidget variant="customer" />;
};
