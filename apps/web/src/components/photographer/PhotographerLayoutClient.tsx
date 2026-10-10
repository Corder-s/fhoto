'use client';

import React, { useState } from 'react';
import { PhotographerSidebar } from './PhotographerSidebar';
import { PhotographerHeader } from './PhotographerHeader';

export const PhotographerLayoutClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="min-h-screen bg-canvas-primary text-ink-primary flex">
      {/* Sidebar */}
      <PhotographerSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <PhotographerHeader
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          isOnline={isOnline}
          onToggleOnline={() => setIsOnline(!isOnline)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
