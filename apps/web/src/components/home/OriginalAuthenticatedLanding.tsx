'use client';

import React, { useState } from 'react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { HeroSearch, SearchFilters } from './HeroSearch';
import { CategorySection } from './CategorySection';
import { FeaturedPhotographersSection } from './FeaturedPhotographersSection';
import { HowItWorksSection } from './HowItWorksSection';
import { RecruitmentBanner } from './RecruitmentBanner';
import { HomeFaqSection } from './HomeFaqSection';
import { FinalCtaBanner } from './FinalCtaBanner';
import { SAMPLE_PHOTOGRAPHERS, SamplePhotographer } from '../../data/photographers';
import { useAuth } from '../../lib/auth';

export const OriginalAuthenticatedLanding: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const currentUserName = user?.name ? user.name.split(' ')[0] : 'Aman';

  const [selectedCategory, setSelectedCategory] = useState<string>('portraits');
  const [filteredPhotographers, setFilteredPhotographers] = useState<SamplePhotographer[]>(SAMPLE_PHOTOGRAPHERS);

  // Handle Search Submission
  const handleSearch = (filters: SearchFilters) => {
    let result = SAMPLE_PHOTOGRAPHERS;

    // Filter by Category
    if (filters.category && filters.category !== 'all') {
      result = result.filter((p) =>
        p.categories.some((c) => c.toLowerCase() === filters.category.toLowerCase())
      );
    }

    // Filter by Location
    if (filters.location && filters.location.trim()) {
      const loc = filters.location.toLowerCase();
      const locationMatches = result.filter(
        (p) =>
          p.locationCity.toLowerCase().includes(loc) ||
          p.locationArea.toLowerCase().includes(loc)
      );
      if (locationMatches.length > 0) {
        result = locationMatches;
      }
    }

    if (result.length > 0) {
      setFilteredPhotographers(result);
    }
    setSelectedCategory(filters.category);

    const creatorsElement = document.getElementById('photographers-section');
    if (creatorsElement) {
      creatorsElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCategorySelect = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    const result = SAMPLE_PHOTOGRAPHERS.filter((p) =>
      p.categories.some((c) => c.toLowerCase() === categorySlug.toLowerCase())
    );
    if (result.length > 0) {
      setFilteredPhotographers(result);
    } else {
      setFilteredPhotographers(SAMPLE_PHOTOGRAPHERS);
    }

    const creatorsElement = document.getElementById('photographers-section');
    if (creatorsElement) {
      creatorsElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col font-sans selection:bg-[#FF6E00] selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-8 pb-10 md:pt-12 md:pb-14 z-20">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top Row: Left Headline & Copy, Right Hero Photography */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[280px]">
              {/* Left Content */}
              <div className="lg:col-span-6 space-y-4 z-10">
                {/* Eyebrow & Personalized Welcome Badge */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {isAuthenticated && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold bg-[#FFF4EB] text-[#FF6E00] border border-[#FFD9B3] shadow-xs">
                      <span>Welcome back, {currentUserName} 👋</span>
                    </span>
                  )}
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#8C847A] uppercase">
                    REAL PEOPLE · REAL STORIES · REMARKABLE PHOTOGRAPHY
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-black tracking-tight text-[#1A1816] leading-[1.06]">
                  Book your <br />
                  photographer. <br />
                  <span className="text-[#FF6E00]">Capture the moment.</span>
                </h1>

                {/* Subtitle Copy */}
                <p className="text-xs sm:text-sm text-[#665E55] max-w-lg leading-relaxed pt-1">
                  Find verified photographers near you for portraits, reels, events and more. Book in minutes.
                </p>
              </div>

              {/* Right Hero Image (Photographer shooting couple overlooking castle with "Moments Beyond Time") */}
              <div className="lg:col-span-6 relative w-full h-[240px] sm:h-[300px] lg:h-[340px] flex items-center justify-end">
                <div className="relative w-full h-full max-w-[620px] rounded-3xl overflow-hidden shadow-subtle group">
                  <img
                    src="/reference-assets/hero_scene.jpg"
                    alt="Moments Beyond Time - Photographer shooting couple"
                    className="w-full h-full object-cover object-right group-hover:scale-102 transition-transform duration-700"
                  />
                  {/* Subtle blend gradient on the left edge into canvas */}
                  <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#FAF7F2] to-transparent pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Bottom Row: Search Bar & Trust Indicators */}
            <div className="mt-6 md:mt-8 relative z-30">
              <HeroSearch
                onSearch={handleSearch}
                selectedCategory={selectedCategory}
              />
            </div>
          </div>
        </section>

        {/* CATEGORY SECTION */}
        <CategorySection
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />

        {/* FEATURED PHOTOGRAPHERS SECTION */}
        <div id="photographers-section">
          <FeaturedPhotographersSection
            photographers={filteredPhotographers}
          />
        </div>

        {/* HOW SNAPSHOOT WORKS & CUSTOMER BENEFITS */}
        <HowItWorksSection />

        {/* PHOTOGRAPHER RECRUITMENT BANNER */}
        <RecruitmentBanner />

        {/* FREQUENTLY ASKED QUESTIONS */}
        <HomeFaqSection />

        {/* FINAL BOOKING CALL TO ACTION */}
        <FinalCtaBanner />
      </main>

      <Footer />
    </div>
  );
};
