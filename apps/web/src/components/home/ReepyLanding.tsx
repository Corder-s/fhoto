'use client';

import React from 'react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { ReepyHero } from './ReepyHero';
import { ReepyStatsStrip } from './ReepyStatsStrip';
import { ReepyHowItWorks } from './ReepyHowItWorks';
import { ReepyCategoryGrid } from './ReepyCategoryGrid';
import { ReepyFeaturedPhotographers } from './ReepyFeaturedPhotographers';
import { ReepyTestimonials } from './ReepyTestimonials';
import { ReepyPhotographerCta } from './ReepyPhotographerCta';
import { BackToTopButton } from './BackToTopButton';

export const ReepyLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col font-sans selection:bg-[#14B8A6] selection:text-[#0D0F12]">
      {/* Dark Navigation matching Reference Image 4 */}
      <Navbar variant="dark" />

      <main className="flex-1">
        {/* Dark Hero Section matching Reference Image 4 */}
        <ReepyHero />

        {/* Light Statistics Strip matching Reference Image 2 */}
        <ReepyStatsStrip />

        {/* How It Works (4 steps) matching Reference Image 2 */}
        <ReepyHowItWorks />

        {/* Browse by Category (8 cards) matching Reference Image 3 */}
        <ReepyCategoryGrid />

        {/* Featured Photographer Cards matching Reference Image 5 */}
        <ReepyFeaturedPhotographers />

        {/* Testimonials (Success Stories) matching Reference Image 1 */}
        <ReepyTestimonials />

        {/* Dark Photographer Recruitment CTA Banner */}
        <ReepyPhotographerCta />
      </main>

      {/* Floating Back to Top Button */}
      <BackToTopButton />

      {/* Dark Footer */}
      <Footer />
    </div>
  );
};
