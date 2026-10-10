'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search, ChevronDown, Camera, ArrowRight } from 'lucide-react';

export const ZomatoHero: React.FC = () => {
  const router = useRouter();
  const [location, setLocation] = useState('Greater Noida');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [validationError, setValidationError] = useState('');

  const POPULAR_CITIES = [
    'Greater Noida',
    'Noida',
    'Delhi NCR',
    'Ghaziabad',
    'Gurugram',
    'South Delhi',
    'Bengaluru',
    'Mumbai',
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const trimmedLoc = location.trim();
    const trimmedQuery = searchQuery.trim();

    if (!trimmedLoc && !trimmedQuery) {
      setValidationError('Please enter a location or search term to discover photographers.');
      return;
    }

    const params = new URLSearchParams();
    if (trimmedLoc) {
      params.set('location', trimmedLoc);
    }
    if (trimmedQuery) {
      params.set('q', trimmedQuery);
    }

    router.push(`/explore?${params.toString()}`);
  };

  return (
    <div className="relative w-full min-h-[500px] sm:min-h-[560px] lg:min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Dark Vignette Overlay for High Text Legibility */}
      <div className="absolute inset-0 z-0">
        <img
          src="/reference-assets/hero_scene.jpg"
          alt="Photographer capturing outdoor story"
          className="w-full h-full object-cover object-center scale-105 filter brightness-[0.7] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/75" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-6 sm:space-y-8">
        {/* Prominent SnapShoot Wordmark */}
        <div className="inline-flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#FF6E00] flex items-center justify-center text-white shadow-lg">
            <Camera className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">
            SNAP<span className="text-[#FF6E00]">SHOOT</span>
          </span>
        </div>

        {/* Main Headline & Supporting Text */}
        <div className="space-y-3 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] drop-shadow-sm">
            Find the perfect photographer for every moment
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-white/85 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow">
            Discover talented photographers near you for portraits, reels, couples, events, and professional shoots.
          </p>
        </div>

        {/* Zomato-Style Search Pill Box */}
        <div className="max-w-3xl mx-auto pt-2">
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white rounded-2xl md:rounded-full p-2 md:p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-white/20 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-0 relative z-20 text-left"
          >
            {/* Location Selector */}
            <div className="relative flex-1 md:max-w-[260px]">
              <div
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl md:rounded-full hover:bg-[#FAF7F2] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MapPin className="w-4 h-4 text-[#FF6E00] shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-[#1A1816] truncate">
                    {location || 'Enter your city or location'}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#8C847A] shrink-0 transition-transform ${
                    showLocationDropdown ? 'rotate-180 text-[#FF6E00]' : ''
                  }`}
                />
              </div>

              {/* Location Dropdown Menu */}
              {showLocationDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowLocationDropdown(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-elevated border border-[#E8E2D8] py-2 z-40 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-[#8C847A] tracking-wider border-b border-[#F2ECE3]">
                      Popular Cities & Hubs
                    </div>
                    {POPULAR_CITIES.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          setLocation(city);
                          setShowLocationDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-[#FAF7F2] transition-colors flex items-center justify-between ${
                          location === city ? 'text-[#FF6E00] bg-[#FFF3E5]/60' : 'text-[#1A1816]'
                        }`}
                      >
                        <span>{city}</span>
                        {location === city && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6E00]" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Desktop Vertical Divider */}
            <div className="hidden md:block h-8 w-[1px] bg-[#E8E2D8] mx-1 shrink-0" />

            {/* Shoot Search Input */}
            <div className="flex-1 flex items-center gap-2.5 px-4 py-2">
              <Search className="w-4 h-4 text-[#8C847A] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search photographers, photography styles, or services"
                className="w-full text-xs sm:text-sm text-[#1A1816] placeholder:text-[#8C847A] bg-transparent outline-none font-medium"
              />
            </div>

            {/* Find Photographers Primary Button */}
            <button
              type="submit"
              className="px-6 py-3 rounded-xl md:rounded-full bg-[#FF6E00] hover:bg-[#E86300] active:scale-[0.98] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <span>Find Photographers</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Validation Feedback */}
          {validationError && (
            <p className="text-xs font-semibold text-amber-300 mt-2 drop-shadow">
              {validationError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
