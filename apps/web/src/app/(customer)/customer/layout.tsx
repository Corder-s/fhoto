import React from 'react';
import { CustomerHeader } from '../../../components/customer/CustomerHeader';

export const metadata = {
  title: 'Client Portal | SnapShoot',
  description: 'Manage photographer bookings, track shoot arrivals, verify OTPs, and access delivered photo galleries.',
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1816] flex flex-col font-sans selection:bg-[#FF6E00] selection:text-white">
      <CustomerHeader />
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
