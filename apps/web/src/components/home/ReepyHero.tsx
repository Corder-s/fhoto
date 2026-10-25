'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Camera, Sparkles } from 'lucide-react';

export const ReepyHero: React.FC = () => {
  const router = useRouter();
  const [locality, setLocality] = useState('');
  const [specialty, setSpecialty] = useState('All specialties');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (locality.trim()) params.set('location', locality.trim());
    if (specialty && specialty !== 'All specialties') params.set('category', specialty);
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <section className="relative bg-[#0D0F12] text-white overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28">
      {/* Background camera lens subtle imagery on right */}
      <div
        className="absolute right-0 top-0 bottom-0 w-full md:w-1/2 opacity-25 pointer-events-none bg-no-repeat bg-right-top bg-cover"
        style={{
          backgroundImage: "url('/reference-assets/auth_photographer_bg.jpg')",
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* Subtle radial ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#14B8A6]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-6">
          {/* Informational Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#171A1F] border border-[#262B33] text-xs font-semibold text-[#CBD5E1] shadow-sm">
            <Sparkles className="w-4 h-4 text-[#14B8A6] shrink-0" />
            <span>Find local photographers who create content that gets noticed</span>
          </div>

          {/* Large Bold Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
            <span className="block text-white">Find the right</span>
            <span className="block text-[#14B8A6]">photographer near you</span>
          </h1>

          {/* Supporting Paragraph */}
          <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed max-w-2xl">
            Discover talented photographers in your locality for reels, portraits, weddings, and social media content. Book local pros who help you create scroll-stopping visuals — and get paid guiding others with your own skills.
          </p>

          {/* Search Panel */}
          <div className="pt-4">
            <form
              onSubmit={handleSearch}
              className="p-3 bg-[#171A1F] rounded-2xl md:rounded-full border border-[#262B33] shadow-2xl flex flex-col md:flex-row items-stretch md:items-center gap-3"
            >
              {/* Locality Input */}
              <div className="relative flex-1 flex items-center bg-[#F5F7F9] rounded-xl md:rounded-full px-4 py-3 text-[#191C22]">
                <MapPin className="w-5 h-5 text-[#64748B] shrink-0 mr-3" />
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="Your locality or city (e.g. Bandra, Mumbai)"
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#191C22] placeholder:text-[#64748B] focus:outline-none"
                />
              </div>

              {/* Specialty Selector */}
              <div className="relative md:w-64 flex items-center bg-[#F5F7F9] rounded-xl md:rounded-full px-4 py-3 text-[#191C22]">
                <Camera className="w-5 h-5 text-[#64748B] shrink-0 mr-3" />
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#191C22] focus:outline-none cursor-pointer"
                >
                  <option value="All specialties">All specialties</option>
                  <option value="Reels">Reels & Video</option>
                  <option value="Weddings">Weddings</option>
                  <option value="Portraits">Portraits</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Food">Food</option>
                  <option value="Travel">Travel</option>
                  <option value="Events">Events</option>
                  <option value="Product">Product</option>
                </select>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#14B8A6] hover:bg-[#0D9488] active:bg-[#0F766E] text-[#0D0F12] font-black text-sm rounded-xl md:rounded-full shadow-md transition-all cursor-pointer"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Search</span>
              </button>
            </form>

            {/* Popular Category Shortcuts (Phase 2.2 Requirement) */}
            <div className="pt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#64748B] font-semibold">Popular:</span>
              {[
                { label: 'Reels', slug: 'Reels' },
                { label: 'Weddings', slug: 'Weddings' },
                { label: 'Portraits', slug: 'Portraits' },
                { label: 'Fashion', slug: 'Fashion' },
              ].map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => router.push(`/explore?category=${encodeURIComponent(cat.slug)}`)}
                  className="px-3.5 py-1 rounded-full bg-[#1F242D] hover:bg-[#2A313C] text-[#CBD5E1] hover:text-[#99F6E4] border border-[#2D333B] hover:border-[#14B8A6] transition-all cursor-pointer"
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
