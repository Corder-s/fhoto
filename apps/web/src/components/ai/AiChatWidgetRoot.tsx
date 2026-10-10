'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { SnapShootAiChatWidget } from './SnapShootAiChatWidget';

export const AiChatWidgetRoot: React.FC = () => {
  const pathname = usePathname();

  // Determine whether this route is for photographer workspace or customer marketplace
  const isPhotographerRoute = pathname.startsWith('/photographer');

  return (
    <SnapShootAiChatWidget
      variant={isPhotographerRoute ? 'photographer' : 'customer'}
    />
  );
};
