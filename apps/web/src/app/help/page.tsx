import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { UnifiedHelpCenter } from '../../components/support/UnifiedHelpCenter';

export const metadata = {
  title: 'Help Center & FAQs | REEPY Photography Marketplace',
  description: 'Everything you need to know about booking verified photographers, Shoot-Start OTP arrival verification, 100% escrow protection, and photo delivery.',
};

export default function PublicHelpPage() {
  return (
    <div className="min-h-screen bg-[#F5F7F9] text-[#191C22] flex flex-col font-sans selection:bg-[#14B8A6] selection:text-white">
      <Navbar />
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <UnifiedHelpCenter variant="public" />
      </main>
      <Footer />
    </div>
  );
}
