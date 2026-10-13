'use client';

import React from 'react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { ZomatoHero } from './ZomatoHero';
import { ZomatoServiceCards } from './ZomatoServiceCards';
import { ZomatoFeaturedPhotographers } from './ZomatoFeaturedPhotographers';
import { ZomatoPopularLocations } from './ZomatoPopularLocations';
import { HowItWorksSection } from './HowItWorksSection';
import { RecruitmentBanner } from './RecruitmentBanner';
import { HomeFaqSection } from './HomeFaqSection';
import { FinalCtaBanner } from './FinalCtaBanner';

export const ZomatoPublicLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col font-sans selection:bg-[#FF6E00] selection:text-white">
      {/* Top Navigation */}
      <Navbar />

      <main className="flex-1">
        {/* Hero Section & Photographer Search */}
        <ZomatoHero />

        {/* Service Category Cards */}
        <ZomatoServiceCards />

        {/* Featured Photographers */}
        <ZomatoFeaturedPhotographers />

        {/* Popular Locations */}
        <ZomatoPopularLocations />

        {/* How It Works */}
        <HowItWorksSection />

        {/* Photographer Recruitment */}
        <RecruitmentBanner />

        {/* Frequently Asked Questions */}
        <HomeFaqSection />

        {/* Final Call to Action */}
        <FinalCtaBanner />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
