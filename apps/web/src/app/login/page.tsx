'use client';

import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { SnapShootAuthView } from '../../components/auth/SnapShootAuthView';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8">
        <SnapShootAuthView isModal={false} initialTab="login" />
      </main>
      <Footer />
    </div>
  );
}
