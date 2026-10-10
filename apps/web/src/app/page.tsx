'use client';

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { HeroSearch, SearchFilters } from '../components/home/HeroSearch';
import { TrustSection } from '../components/home/TrustSection';
import { CategorySection } from '../components/home/CategorySection';
import { FeaturedPhotographersSection } from '../components/home/FeaturedPhotographersSection';
import { RecruitmentBanner } from '../components/home/RecruitmentBanner';
import { SAMPLE_PHOTOGRAPHERS, SamplePhotographer } from '../data/photographers';
import { Sparkles } from 'lucide-react';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeFilterDescription, setActiveFilterDescription] = useState<string>('');
  const [filteredPhotographers, setFilteredPhotographers] = useState<SamplePhotographer[]>(SAMPLE_PHOTOGRAPHERS);

  // Handle Search Submission
  const handleSearch = (filters: SearchFilters) => {
    let result = SAMPLE_PHOTOGRAPHERS;

    // Filter by Category
    if (filters.category && filters.category !== 'all') {
      result = result.filter((p) => p.categories.includes(filters.category as any));
    }

    // Filter by Location if matching city/area
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

    setFilteredPhotographers(result);
    setSelectedCategory(filters.category);
    setActiveFilterDescription(
      `Showing results for "${filters.category === 'all' ? 'All Genres' : filters.category}" in ${filters.location} (${filters.duration} hrs)`
    );

    // Scroll to results
    const resultsElement = document.getElementById('creators-section');
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle Category Card Click from CategorySection
  const handleCategorySelect = (categorySlug: string) => {
    if (selectedCategory === categorySlug) {
      // Toggle off
      setSelectedCategory('all');
      setFilteredPhotographers(SAMPLE_PHOTOGRAPHERS);
      setActiveFilterDescription('');
    } else {
      setSelectedCategory(categorySlug);
      const result = SAMPLE_PHOTOGRAPHERS.filter((p) =>
        p.categories.includes(categorySlug as any)
      );
      setFilteredPhotographers(result);
      setActiveFilterDescription(`Showing creators for category: "${categorySlug}"`);

      const resultsElement = document.getElementById('creators-section');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleResetFilter = () => {
    setSelectedCategory('all');
    setFilteredPhotographers(SAMPLE_PHOTOGRAPHERS);
    setActiveFilterDescription('');
  };

  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-canvas-primary via-canvas-primary to-canvas-secondary/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-subtle border border-brand-border text-brand text-xs sm:text-sm font-bold tracking-wide shadow-subtle">
                <Sparkles className="w-4 h-4 text-brand" />
                <span>India&apos;s Verified Visual Creator Marketplace</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-ink-primary leading-[1.12]">
                Book your photographer. <br />
                <span className="text-brand">Capture the moment.</span>
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-ink-secondary max-w-2xl mx-auto leading-relaxed">
                Discover talented photographers near you for portraits, reels, events, and everything worth remembering.
              </p>

              {/* Hero Search Controls */}
              <div className="pt-4">
                <HeroSearch
                  onSearch={handleSearch}
                  selectedCategory={selectedCategory}
                />
              </div>
            </div>
          </div>
        </section>

        {/* TRUST SECTION */}
        <TrustSection />

        {/* PHOTOGRAPHY CATEGORIES */}
        <CategorySection
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />

        {/* FEATURED PHOTOGRAPHERS SECTION */}
        <div id="creators-section">
          <FeaturedPhotographersSection
            photographers={filteredPhotographers}
            activeFilterDescription={activeFilterDescription}
            onResetFilter={activeFilterDescription ? handleResetFilter : undefined}
          />
        </div>

        {/* PHOTOGRAPHER RECRUITMENT BANNER */}
        <RecruitmentBanner />
      </main>

      <Footer />
    </>
  );
}
