'use client';

import React from 'react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { UnifiedCustomerHomepageView } from '../customer/UnifiedCustomerHomepageView';

export const OriginalAuthenticatedLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col font-sans selection:bg-[#FF6E00] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UnifiedCustomerHomepageView layoutOrder="hero-first" showDiscoverySections={true} />
      </main>

      <Footer />
    </div>
  );
};
