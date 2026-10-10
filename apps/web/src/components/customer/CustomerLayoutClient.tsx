'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '../Navbar';
import Footer from '../Footer';

export const CustomerLayoutClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();

  // /customer/dashboard renders its own full layout matching the reference screenshot
  if (pathname === '/customer/dashboard') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1816] flex flex-col font-sans selection:bg-[#FF6E00] selection:text-white">
      <Navbar />
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};
