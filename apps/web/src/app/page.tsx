'use client';

import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ZomatoHero } from '../components/home/ZomatoHero';
import { ZomatoServiceCards } from '../components/home/ZomatoServiceCards';
import { ZomatoFeaturedPhotographers } from '../components/home/ZomatoFeaturedPhotographers';
import { ZomatoPopularLocations } from '../components/home/ZomatoPopularLocations';
import { HowItWorksSection } from '../components/home/HowItWorksSection';
import { RecruitmentBanner } from '../components/home/RecruitmentBanner';
import { HomeFaqSection } from '../components/home/HomeFaqSection';
import { FinalCtaBanner } from '../components/home/FinalCtaBanner';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col font-sans selection:bg-[#FF6E00] selection:text-white">
      {/* A. TOP NAVIGATION */}
      <Navbar />

      <main className="flex-1">
        {/* B & C. HERO SECTION & PHOTOGRAPHER SEARCH (Zomato-Style Search-Centric Hero) */}
        <ZomatoHero />

        {/* D. SERVICE CATEGORY CARDS (3 Prominent Marketplace Cards) */}
        <ZomatoServiceCards />

        {/* E. FEATURED PHOTOGRAPHERS (Discover Photographers Near You) */}
        <ZomatoFeaturedPhotographers />

        {/* F. POPULAR LOCATIONS (Localities Discovery Grid) */}
        <ZomatoPopularLocations />

        {/* G. HOW IT WORKS (3 Simple Steps & Customer Protection) */}
        <HowItWorksSection />

        {/* H. PHOTOGRAPHER RECRUITMENT (Turn Your Photography Into Opportunity) */}
        <RecruitmentBanner />

        {/* FREQUENTLY ASKED QUESTIONS */}
        <HomeFaqSection />

        {/* I. FINAL CALL TO ACTION */}
        <FinalCtaBanner />
      </main>

      {/* J. FOOTER */}
      <Footer />
    </div>
  );
}
