'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Star, 
  SlidersHorizontal, 
  ArrowUpDown, 
  RotateCcw, 
  CheckCircle2, 
  Heart, 
  ArrowRight,
  ShieldCheck,
  Camera,
  Lock
} from 'lucide-react';
import { SAMPLE_PHOTOGRAPHERS, SamplePhotographer } from '../../data/photographers';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';
import { useAuthModal } from '../../components/auth/AuthModalContext';

function matchesCategory(categories: string[], filter: string): boolean {
  if (!filter || filter === 'all') return true;
  const f = filter.toLowerCase().trim();
  return categories.some((c) => {
    const cl = c.toLowerCase();
    if (cl === f) return true;
    if (f === 'portraits' || f === 'portrait') return cl.includes('portrait');
    if (f === 'reels' || f === 'reel') return cl.includes('reel') || cl.includes('video');
    if (f === 'couples' || f === 'couple' || f === 'wedding' || f === 'weddings') {
      return cl.includes('couple') || cl.includes('wedding');
    }
    if (f === 'events' || f === 'event') return cl.includes('event');
    if (f === 'commercial' || f === 'corporate' || f === 'products') {
      return cl.includes('commercial') || cl.includes('corporate') || cl.includes('product');
    }
    return cl.includes(f) || f.includes(cl);
  });
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const urlLocation = searchParams.get('location') || '';
  const urlCategory = searchParams.get('category') || 'all';
  const urlQuery = searchParams.get('q') || '';

  // Search & Filter State
  const [searchLocation, setSearchLocation] = useState(urlLocation);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'rating' | 'price_low' | 'price_high'>('recommended');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const { isAuthenticated, isMounted } = useAuth();
  const { openAuthModal } = useAuthModal();

  const currentFullUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (searchLocation) params.set('location', searchLocation);
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    if (searchQuery) params.set('q', searchQuery);
    const qs = params.toString();
    return qs ? `/explore?${qs}` : '/explore';
  }, [searchLocation, selectedCategory, searchQuery]);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      openAuthModal({
        returnUrl: currentFullUrl,
        message: 'Join SnapShoot to discover and book the perfect photographer.',
      });
    }
  }, [isMounted, isAuthenticated, currentFullUrl, openAuthModal]);

  useEffect(() => {
    if (urlLocation) setSearchLocation(urlLocation);
    if (urlCategory) setSelectedCategory(urlCategory);
    if (urlQuery) setSearchQuery(urlQuery);
  }, [urlLocation, urlCategory, urlQuery]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleResetFilters = () => {
    setSearchLocation('');
    setSelectedCategory('all');
    setSearchQuery('');
    setSelectedDate('');
    setSelectedBudget('all');
    setSelectedRating('all');
    setSelectedAvailability('all');
    setSortBy('recommended');
  };

  // Genuine Filtering & Sorting Logic
  const filteredPhotographers = useMemo(() => {
    let result = [...SAMPLE_PHOTOGRAPHERS];

    // Location Filter
    if (searchLocation.trim()) {
      const q = searchLocation.toLowerCase();
      result = result.filter(
        (p) =>
          p.locationCity.toLowerCase().includes(q) ||
          p.locationArea.toLowerCase().includes(q)
      );
    }

    // Category Filter (case-insensitive & genre-aware)
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter((p) => matchesCategory(p.categories, selectedCategory));
    }

    // Search Query (name, gear, specialties, categories, bio)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.cameraGear.toLowerCase().includes(q) ||
          p.specialties.some((s) => s.toLowerCase().includes(q)) ||
          p.categories.some((c) => c.toLowerCase().includes(q)) ||
          p.bio.toLowerCase().includes(q)
      );
    }

    // Budget Filter
    if (selectedBudget === 'under_5000') {
      result = result.filter((p) => p.startingPriceInr < 5000);
    } else if (selectedBudget === '5000_8000') {
      result = result.filter((p) => p.startingPriceInr >= 5000 && p.startingPriceInr <= 8000);
    } else if (selectedBudget === 'above_8000') {
      result = result.filter((p) => p.startingPriceInr > 8000);
    }

    // Minimum Rating Filter
    if (selectedRating === '4.95') {
      result = result.filter((p) => p.rating >= 4.95);
    } else if (selectedRating === '4.90') {
      result = result.filter((p) => p.rating >= 4.90);
    }

    // Availability Filter
    if (selectedAvailability === 'today') {
      result = result.filter(
        (p) => p.availabilityStatus.toLowerCase() === 'available today'
      );
    } else if (selectedAvailability === 'this_week') {
      result = result.filter(
        (p) =>
          p.availabilityStatus.toLowerCase() === 'available today' ||
          p.availabilityStatus.toLowerCase() === 'available this week'
      );
    }

    // Sorting
    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'price_low') {
      result.sort((a, b) => a.startingPriceInr - b.startingPriceInr);
    } else if (sortBy === 'price_high') {
      result.sort((a, b) => b.startingPriceInr - a.startingPriceInr);
    } else {
      // Recommended: Prioritize verified and high review count
      result.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    return result;
  }, [
    searchLocation,
    selectedCategory,
    selectedBudget,
    selectedRating,
    selectedAvailability,
    sortBy,
  ]);

  const hasActiveFilters =
    searchLocation !== '' ||
    selectedCategory !== 'all' ||
    selectedBudget !== 'all' ||
    selectedRating !== 'all' ||
    selectedAvailability !== 'all' ||
    sortBy !== 'recommended';

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-canvas-primary py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Page Heading */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-subtle text-brand text-xs font-bold mb-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>Discovery Directory</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-primary">
                Find & Compare Photographers
              </h1>
              <p className="text-xs sm:text-sm text-ink-secondary mt-1">
                Explore verified visual artists across India. Filter by city, budget, rating, and immediate availability.
              </p>
            </div>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset All Filters
              </Button>
            )}
          </div>

          {/* ADVANCED FILTER PANEL */}
          <div className="bg-white p-5 rounded-card-md border border-contour-subtle shadow-subtle space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Location Input */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-ink-muted mb-1">
                  Location / City
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-canvas-primary rounded-card-sm border border-contour-subtle">
                  <MapPin className="w-4 h-4 text-brand shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. Delhi, Mumbai, Bengaluru"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-ink-primary placeholder:text-ink-muted focus:outline-none"
                  />
                </div>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-ink-muted mb-1">
                  Photography Genre
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-canvas-primary rounded-card-sm border border-contour-subtle">
                  <Camera className="w-4 h-4 text-brand shrink-0" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-ink-primary focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Genres</option>
                    <option value="portraits">Portraits & Headshots</option>
                    <option value="reels">Reels & Creator Video</option>
                    <option value="couples">Couples & Weddings</option>
                    <option value="events">Events & Celebrations</option>
                  </select>
                </div>
              </div>

              {/* Budget Filter */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-ink-muted mb-1">
                  Starting Budget
                </label>
                <select
                  value={selectedBudget}
                  onChange={(e) => setSelectedBudget(e.target.value)}
                  className="w-full px-3 py-2.5 bg-canvas-primary rounded-card-sm border border-contour-subtle text-xs sm:text-sm font-semibold text-ink-primary focus:outline-none cursor-pointer"
                >
                  <option value="all">Any Budget</option>
                  <option value="under_5000">Under ₹5,000</option>
                  <option value="5000_8000">₹5,000 – ₹8,000</option>
                  <option value="above_8000">Above ₹8,000</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-ink-muted mb-1">
                  Minimum Rating
                </label>
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="w-full px-3 py-2.5 bg-canvas-primary rounded-card-sm border border-contour-subtle text-xs sm:text-sm font-semibold text-ink-primary focus:outline-none cursor-pointer"
                >
                  <option value="all">All Ratings</option>
                  <option value="4.95">★ 4.95 & Higher</option>
                  <option value="4.90">★ 4.90 & Higher</option>
                </select>
              </div>
            </div>

            {/* Secondary Row: Availability & Sorting */}
            <div className="pt-3 border-t border-contour-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-ink-muted mr-1">Availability:</span>
                <button
                  type="button"
                  onClick={() => setSelectedAvailability('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    selectedAvailability === 'all'
                      ? 'bg-ink-primary text-white'
                      : 'bg-canvas-primary text-ink-secondary hover:bg-canvas-secondary'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAvailability('today')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    selectedAvailability === 'today'
                      ? 'bg-green-700 text-white'
                      : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                  }`}
                >
                  ● Available Today
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAvailability('this_week')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    selectedAvailability === 'this_week'
                      ? 'bg-ink-primary text-white'
                      : 'bg-canvas-primary text-ink-secondary hover:bg-canvas-secondary'
                  }`}
                >
                  This Week
                </button>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-ink-muted" />
                <span className="text-xs font-bold text-ink-muted">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-canvas-primary px-3 py-1.5 rounded-card-sm border border-contour-subtle text-xs font-bold text-ink-primary focus:outline-none cursor-pointer"
                >
                  <option value="recommended">Recommended</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_low">Lowest Price</option>
                  <option value="price_high">Highest Price</option>
                </select>
              </div>
            </div>
          </div>

          {/* RESULTS HEADER */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-extrabold text-ink-primary">
              Showing <span className="text-brand">{filteredPhotographers.length}</span> Verified Photographers
            </p>
            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span>Identity & Gear Verified</span>
            </div>
          </div>

          {/* AUTHENTICATION GATE FOR UNVERIFIED BROWSING */}
          {isMounted && !isAuthenticated ? (
            <div className="bg-white rounded-3xl border border-[#E8E2D8] p-8 sm:p-12 max-w-lg mx-auto text-center space-y-4 shadow-elevated my-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-[#FF6E00] text-white flex items-center justify-center mx-auto shadow-md">
                <Lock className="w-8 h-8 stroke-[2.2]" />
              </div>
              <span className="px-3.5 py-1 rounded-full text-[11px] font-bold bg-[#FFF3E5] text-[#FF6E00] border border-[#FFD4A8]">
                Protected Photographer Discovery
              </span>
              <h2 className="text-2xl font-black text-[#1A1816] tracking-tight">
                Authentication Required
              </h2>
              <p className="text-xs sm:text-sm text-[#5A544D] leading-relaxed">
                Join SnapShoot to discover and book the perfect photographer in {searchLocation || 'your area'}. Your search parameters have been preserved.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <button
                  onClick={() => openAuthModal({ returnUrl: currentFullUrl, initialTab: 'login' })}
                  className="flex-1 py-3 px-6 rounded-2xl bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Log In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openAuthModal({ returnUrl: currentFullUrl, initialTab: 'register' })}
                  className="flex-1 py-3 px-6 rounded-2xl bg-[#FAF7F2] hover:bg-[#F2ECE3] border border-[#E8E2D8] text-[#1A1816] text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>
          ) : filteredPhotographers.length === 0 ? (
            <div className="bg-white rounded-card-lg border border-contour-subtle p-12 text-center max-w-lg mx-auto space-y-4 shadow-subtle">
              <div className="w-12 h-12 rounded-full bg-brand-subtle flex items-center justify-center text-brand mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-ink-primary">No photographers found</h2>
              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                We couldn&apos;t find any visual artists matching all your current filters. Try relaxing your location, budget, or rating filters.
              </p>
              <Button variant="primary" size="sm" onClick={handleResetFilters}>
                Clear All Filters
              </Button>
            </div>
          ) : (
            /* RESULTS GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPhotographers.map((creator) => {
                const isFav = !!favorites[creator.id];
                return (
                  <Card
                    key={creator.id}
                    hoverEffect
                    className="p-0 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Cover Photo */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-canvas-secondary">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={creator.portfolioPreviews[0]}
                          alt={creator.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge variant="dark" size="sm">
                            {creator.experienceYears} Yrs Exp
                          </Badge>
                        </div>

                        {/* Favorite button */}
                        <button
                          onClick={(e) => toggleFavorite(creator.id, e)}
                          aria-label={isFav ? 'Remove from favorites' : 'Save to favorites'}
                          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors ${
                            isFav
                              ? 'bg-white text-red-500 shadow-md'
                              : 'bg-black/40 text-white hover:text-red-400'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500' : ''}`} />
                        </button>
                      </div>

                      {/* Info Body */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-lg font-bold text-ink-primary">{creator.name}</h3>
                              {creator.isVerified && (
                                <span title="Government ID Verified">
                                  <CheckCircle2 className="w-4 h-4 text-brand fill-brand-subtle shrink-0" />
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-ink-muted" />
                              {creator.locationArea}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-bold text-ink-primary bg-canvas-secondary px-2.5 py-0.5 rounded-full">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{creator.rating}</span>
                            <span className="text-ink-muted font-normal">({creator.reviewCount})</span>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-ink-secondary font-medium">
                          {creator.tagline}
                        </p>

                        {/* 3 Micro-Previews */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          {creator.portfolioPreviews.map((img, i) => (
                            <div key={i} className="aspect-[4/3] rounded-card-sm overflow-hidden bg-canvas-secondary">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img} alt="preview" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>

                        {/* Availability Pill */}
                        <div className="pt-2">
                          <Badge variant="success" size="sm">
                            {creator.availabilityStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Price & CTA */}
                    <div className="p-5 pt-3 border-t border-contour-subtle flex items-center justify-between bg-canvas-primary/40">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-ink-muted">Packages from</p>
                        <p className="text-base font-extrabold text-ink-primary">
                          ₹{creator.startingPriceInr.toLocaleString('en-IN')}
                        </p>
                      </div>

                      <Link
                        href={`/photographers/${creator.id}`}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-card-sm text-xs font-bold bg-brand hover:bg-brand-hover text-white shadow-sm transition-colors"
                      >
                        <span>View Profile</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas-primary" />}>
      <ExploreContent />
    </Suspense>
  );
}

