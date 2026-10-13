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
  Lock,
  Sparkles,
  Zap,
  Film,
  Compass,
  Layers,
  Map,
  Grid3X3,
  Scale,
  Check,
  X,
  Clock,
  Video,
  Award,
  ChevronRight,
  Flame,
  Info
} from 'lucide-react';
import type { SamplePhotographer } from '../../data/photographers';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../lib/auth';
import { useAuthModal } from '../../components/auth/AuthModalContext';
import { getPhotographerSlug } from '../../lib/photographerSlug';

// Curated AI Aesthetic Vibe Presets for Rapid Discovery
const VIBE_PRESETS = [
  { id: 'vibe-golden', label: 'Golden Hour Romance', icon: '🌅', tag: 'couples', query: 'golden hour couple' },
  { id: 'vibe-reels', label: '4K Cinema Reels', icon: '🎬', tag: 'reels', query: 'cinema vertical reels fx3' },
  { id: 'vibe-editorial', label: 'Moody Editorial', icon: '🖤', tag: 'portraits', query: 'editorial studio strobe' },
  { id: 'vibe-heritage', label: 'Royal Heritage', icon: '👑', tag: 'weddings', query: 'royal heritage fortress wedding' },
  { id: 'vibe-today', label: 'Available Today', icon: '⚡', tag: 'all', availability: 'today' },
  { id: 'vibe-medium-format', label: '100MP Medium Format', icon: '📸', tag: 'fashion', query: 'medium format' },
  { id: 'vibe-drone', label: '8K Drone Aerials', icon: '🚁', tag: 'events', query: 'drone aerial' },
];

const GENRES = [
  { slug: 'all', label: 'All Genres', icon: Camera },
  { slug: 'portraits', label: 'Portraits & Studio', icon: Camera },
  { slug: 'reels', label: 'Reels & 4K Video', icon: Video },
  { slug: 'couples', label: 'Couples & Weddings', icon: Heart },
  { slug: 'events', label: 'Events & Parties', icon: Flame },
  { slug: 'fashion', label: 'Fashion & Editorial', icon: Film },
];

const LOCATION_HUBS = [
  'All Hubs',
  'Delhi NCR',
  'Greater Noida',
  'Noida',
  'South Delhi',
  'Gurugram',
  'Mumbai',
  'Bengaluru',
  'Goa',
  'Jaipur',
];

const GEAR_TIERS = [
  { id: 'all', label: 'Any Gear' },
  { id: 'cinema', label: '🎥 Cinema Rigs (Sony FX3 / Cinema)', match: 'cinema' },
  { id: 'medium_format', label: '📸 100MP Medium Format', match: 'medium format' },
  { id: 'drone', label: '🚁 Drone Aerial Systems', match: 'drone' },
];

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
    if (f === 'fashion' || f === 'editorial') return cl.includes('fashion') || cl.includes('editorial');
    return cl.includes(f) || f.includes(cl);
  });
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const urlLocation = searchParams.get('location') || '';
  const urlCategory = searchParams.get('category') || 'all';
  const urlQuery = searchParams.get('q') || '';

  // Core Search State
  const [searchLocation, setSearchLocation] = useState(urlLocation);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [activeVibe, setActiveVibe] = useState<string | null>(null);
  
  // Advanced Filter Controls
  const [selectedBudget, setSelectedBudget] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [selectedGearTier, setSelectedGearTier] = useState('all');
  const [sameDayOnly, setSameDayOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'rating' | 'price_low' | 'price_high' | 'experience'>('recommended');
  
  // UI Experience State
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [activePhotoIndices, setActivePhotoIndices] = useState<Record<string, number>>({});
  const [compareList, setCompareList] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isMatchmakerOpen, setIsMatchmakerOpen] = useState(false);
  const [selectedMapPhotographer, setSelectedMapPhotographer] = useState<SamplePhotographer | null>(null);

  // Matchmaker Wizard State
  const [mmStep, setMmStep] = useState(1);
  const [mmGenre, setMmGenre] = useState('Portraits');
  const [mmBudget, setMmBudget] = useState('₹1,500 - ₹3,000');
  const [mmLocation, setMmLocation] = useState('Delhi NCR');
  const [mmMatchedCreator, setMmMatchedCreator] = useState<SamplePhotographer | null>(null);

  // Live Supabase Integration State
  const [dbCreators, setDbCreators] = useState<SamplePhotographer[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();

  useEffect(() => {
    if (urlLocation) setSearchLocation(urlLocation);
    if (urlCategory) setSelectedCategory(urlCategory);
    if (urlQuery) setSearchQuery(urlQuery);
  }, [urlLocation, urlCategory, urlQuery]);

  // Synchronize live creators directly from /api/photographers (Supabase live data)
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingDb(true);

    fetch('/api/photographers')
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return;
        if (data.photographers && Array.isArray(data.photographers) && data.photographers.length > 0) {
          const mapped: SamplePhotographer[] = data.photographers.map((cp: any) => {
            const previews = (cp.portfolio && cp.portfolio.length > 0)
              ? cp.portfolio.map((item: any) => item.url)
              : [cp.coverImageUrl || '/reference-assets/cat_portrait.jpg', cp.secondaryCoverUrl || '/reference-assets/cat_reels.jpg'];

            return {
              id: cp.id,
              name: cp.name,
              tagline: cp.tagline || cp.bio || 'Verified Visual Creative Specialist',
              avatarUrl: cp.avatarUrl || previews[0] || '/reference-assets/avatar_aman.jpg',
              coverImageUrl: cp.coverImageUrl || previews[0] || '/reference-assets/cat_portrait.jpg',
              isVerified: cp.isVerified ?? true,
              locationCity: cp.city || 'Delhi NCR',
              locationArea: cp.locationArea || `${cp.city || 'Delhi NCR'}, India`,
              rating: Number(cp.rating) || 5.0,
              reviewCount: Number(cp.reviewCount) || 0,
              categories: cp.specialties && cp.specialties.length > 0 ? cp.specialties : ['Portraits', 'Reels'],
              startingPriceInr: Number(cp.startingPriceInr) || 2000,
              availabilityStatus: (cp.availabilityStatus || 'Available Today') as any,
              experienceYears: Number(cp.experienceYears) || 3,
              cameraGear: cp.cameraGear || 'Sony Alpha FX3 • FE 50mm f/1.2 GM',
              specialties: cp.specialties && cp.specialties.length > 0 ? cp.specialties : ['Editorial Lighting', '4K Cinema'],
              bio: cp.bio || 'Professional verified visual creator on SnapShoot platform.',
              portfolioPreviews: previews,
              fullPortfolio: (cp.portfolio || []).map((item: any) => ({
                id: item.id || String(Math.random()),
                url: item.url,
                title: item.title || 'Creative Portfolio Item',
                category: item.mediaType || 'Portraits',
              })),
              servicePackages: (cp.services || []).map((s: any) => ({
                id: s.id || String(Math.random()),
                name: s.name || 'Shoot Session',
                priceInr: Number(s.priceInr || 2000),
                duration: `${s.durationMinutes || 60} mins`,
                photos: '30 edited shots',
                turnaround: `${s.deliveryHours || 48} Hours`,
                features: ['Master High-Res JPEGs', 'Color Graded Previews', 'Private Client Gallery'],
              })),
              reviews: [],
            };
          });

          // Only live, approved photographers from the database are shown (no sample fallback).
          setDbCreators(mapped);
        } else {
          setDbCreators([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load creators from API:', err);
        setDbCreators([]);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingDb(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleThumbnailHover = (creatorId: string, index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActivePhotoIndices((prev) => ({ ...prev, [creatorId]: index }));
  };

  const handleToggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompareList((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        alert('You can compare up to 3 photographers side-by-side.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleApplyVibe = (vibe: typeof VIBE_PRESETS[0]) => {
    if (activeVibe === vibe.id) {
      setActiveVibe(null);
      setSearchQuery('');
      setSelectedAvailability('all');
      return;
    }
    setActiveVibe(vibe.id);
    if (vibe.query) setSearchQuery(vibe.query);
    if (vibe.tag && vibe.tag !== 'all') setSelectedCategory(vibe.tag);
    if (vibe.availability) setSelectedAvailability(vibe.availability);
  };

  const handleSurpriseMe = () => {
    const randomVibe = VIBE_PRESETS[Math.floor(Math.random() * VIBE_PRESETS.length)];
    handleApplyVibe(randomVibe);
  };

  const handleResetFilters = () => {
    setSearchLocation('');
    setSelectedCategory('all');
    setSearchQuery('');
    setActiveVibe(null);
    setSelectedBudget('all');
    setSelectedRating('all');
    setSelectedAvailability('all');
    setSelectedGearTier('all');
    setSameDayOnly(false);
    setSortBy('recommended');
  };

  // Comprehensive Multi-Parameter Search Filtering Logic
  const filteredPhotographers = useMemo(() => {
    const baseList = dbCreators;
    let result = [...baseList];

    // Location Filter
    if (searchLocation.trim() && searchLocation !== 'All Hubs') {
      const q = searchLocation.toLowerCase();
      result = result.filter(
        (p) =>
          p.locationCity.toLowerCase().includes(q) ||
          p.locationArea.toLowerCase().includes(q)
      );
    }

    // Category / Genre Filter
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter((p) => matchesCategory(p.categories, selectedCategory));
    }

    // Natural Language Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.bio.toLowerCase().includes(q) ||
          p.cameraGear.toLowerCase().includes(q) ||
          p.specialties.some((s) => s.toLowerCase().includes(q)) ||
          p.categories.some((c) => c.toLowerCase().includes(q)) ||
          p.locationArea.toLowerCase().includes(q)
      );
    }

    // Budget Filter
    if (selectedBudget === 'under_1500') {
      result = result.filter((p) => p.startingPriceInr <= 1500);
    } else if (selectedBudget === '1500_3000') {
      result = result.filter((p) => p.startingPriceInr > 1500 && p.startingPriceInr <= 3000);
    } else if (selectedBudget === 'above_3000') {
      result = result.filter((p) => p.startingPriceInr > 3000);
    }

    // Rating Filter
    if (selectedRating !== 'all') {
      const minRating = parseFloat(selectedRating);
      result = result.filter((p) => p.rating >= minRating);
    }

    // Camera Gear Tier Filter
    if (selectedGearTier !== 'all') {
      const tierObj = GEAR_TIERS.find((t) => t.id === selectedGearTier);
      if (tierObj && tierObj.match) {
        result = result.filter((p) =>
          p.cameraGear.toLowerCase().includes(tierObj.match.toLowerCase())
        );
      }
    }

    // Same-Day / 24h Rapid Delivery Filter
    if (sameDayOnly) {
      result = result.filter((p) =>
        p.servicePackages.some((pkg) => pkg.turnaround.toLowerCase().includes('24 hour'))
      );
    }

    // Availability Filter
    if (selectedAvailability === 'today') {
      result = result.filter(
        (p) =>
          p.availabilityStatus.toLowerCase() === 'available today' ||
          p.availabilityStatus.toLowerCase() === 'available this week'
      );
    }

    // Advanced Sorting
    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'price_low') {
      result.sort((a, b) => a.startingPriceInr - b.startingPriceInr);
    } else if (sortBy === 'price_high') {
      result.sort((a, b) => b.startingPriceInr - a.startingPriceInr);
    } else if (sortBy === 'experience') {
      result.sort((a, b) => b.experienceYears - a.experienceYears);
    } else {
      // Recommended: Balanced weighted review count and rating
      result.sort((a, b) => (b.reviewCount * b.rating) - (a.reviewCount * a.rating));
    }

    return result;
  }, [
    dbCreators,
    searchLocation,
    selectedCategory,
    searchQuery,
    selectedBudget,
    selectedRating,
    selectedGearTier,
    sameDayOnly,
    selectedAvailability,
    sortBy,
  ]);

  const hasActiveFilters =
    (searchLocation !== '' && searchLocation !== 'All Hubs') ||
    selectedCategory !== 'all' ||
    searchQuery !== '' ||
    activeVibe !== null ||
    selectedBudget !== 'all' ||
    selectedRating !== 'all' ||
    selectedGearTier !== 'all' ||
    sameDayOnly ||
    selectedAvailability !== 'all' ||
    sortBy !== 'recommended';

  // Compare creators selected
  const comparedCreators = useMemo(() => {
    const list = dbCreators;
    return list.filter((p) => compareList.includes(p.id));
  }, [compareList, dbCreators]);

  // Handle AI Matchmaker Submission
  const handleRunMatchmaker = () => {
    const list = dbCreators;
    const matched = list.find((p) => 
      matchesCategory(p.categories, mmGenre)
    ) || list[0];
    
    setMmMatchedCreator(matched);
    setMmStep(4);
  };

  return (
    <>
      <main className="flex-1 bg-[#FAF7F2] py-6 sm:py-10 selection:bg-[#FF6E00] selection:text-white">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* ========================================================= */}
          {/* 1. HERO UPPER FRONT: DYNAMIC FLUID STRUCTURE & ATTRACTIVE IMAGES */}
          {/* ========================================================= */}
          <div className="relative bg-white rounded-3xl border border-[#E8E1D6] p-6 sm:p-8 lg:p-10 shadow-[0_4px_28px_-6px_rgba(26,24,22,0.06)] overflow-hidden">
            {/* Dynamic Fluid Morphing Backdrops */}
            <div className="absolute -top-24 -right-24 w-[420px] h-[420px] bg-gradient-to-br from-[#FF6E00]/20 via-[#FFB300]/20 to-[#FF4D4D]/15 rounded-full blur-3xl animate-fluid-blob pointer-events-none" />
            <div className="absolute top-1/2 -left-20 w-80 h-80 bg-gradient-to-tr from-[#FF9E40]/25 via-[#FFE0B2]/30 to-transparent rounded-full blur-2xl animate-fluid-blob-slow pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
              {/* Left Column: Headline, Discovery Search & Action Triggers */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2.5">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF3E5] text-[#FF6E00] border border-[#FFD4A8] text-xs font-bold shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF6E00] animate-pulse" />
                    <span>Next-Gen Visual Discovery Engine • Verified Shoot-Start OTP</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#1A1816] leading-[1.08]">
                    Find & Book India&apos;s <br />
                    <span className="text-[#FF6E00]">Finest Photographers.</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-[#5A544D] leading-relaxed max-w-xl">
                    Discover vetted visual artists across India by aesthetic vibe, 4K cinema gear, same-day delivery, and transparent pricing with 100% escrow protection.
                  </p>
                </div>

                {/* Main AI Natural Search Bar */}
                <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] p-1.5 gap-2 shadow-2xs focus-within:border-[#FF6E00] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#FF6E00]/20 transition-all">
                  <div className="flex items-center flex-1 min-w-0 pl-3">
                    <Search className="w-4 h-4 text-[#FF6E00] shrink-0 mr-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search style, vibe, or camera gear... (e.g. 'Sony FX3', 'Sunset portraits', 'Pre-wedding')"
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#1A1816] placeholder-[#8C847A] focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="p-1 text-[#8C847A] hover:text-[#1A1816] rounded-full mr-1"
                        title="Clear query"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 sm:border-l sm:border-[#E8E2D8] sm:pl-2">
                    <button
                      onClick={handleSurpriseMe}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-[#F2ECE3] border border-[#E8E2D8] text-[#1A1816] text-xs font-bold transition-all flex items-center gap-1"
                      title="Pick a random aesthetic vibe"
                    >
                      <span>🎲 Surprise Me</span>
                    </button>
                    <button
                      onClick={() => {
                        const resultsEl = document.getElementById('artists-listing-section');
                        if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-4 py-2 rounded-xl bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs font-bold shadow-sm transition-all"
                    >
                      Search
                    </button>
                  </div>
                </div>

                {/* View Mode & AI Matchmaker Trigger Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => {
                      setMmStep(1);
                      setIsMatchmakerOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6E00] to-[#FF8C33] hover:from-[#E86300] hover:to-[#FF6E00] text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-white/20" />
                    <span>AI Shoot Matchmaker</span>
                  </button>

                  <div className="flex items-center p-1 bg-[#F2ECE3] rounded-xl border border-[#E8E2D8]">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        viewMode === 'grid'
                          ? 'bg-white text-[#1A1816] shadow-2xs'
                          : 'text-[#5A544D] hover:text-[#1A1816]'
                      }`}
                    >
                      <Grid3X3 className="w-3.5 h-3.5" />
                      <span>Lookbook</span>
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        viewMode === 'map'
                          ? 'bg-white text-[#1A1816] shadow-2xs'
                          : 'text-[#5A544D] hover:text-[#1A1816]'
                      }`}
                    >
                      <Map className="w-3.5 h-3.5" />
                      <span>Studio Radar</span>
                    </button>
                  </div>

                  <span className="text-xs text-[#8C847A] font-medium hidden sm:inline">
                    • 100% Escrow Protection Guaranteed
                  </span>
                </div>
              </div>

              {/* Right Column: ATTRACTIVE UPPER FRONT IMAGES WITH DYNAMIC FLUID ANIMATION */}
              <div className="lg:col-span-5 relative w-full flex items-center justify-center">
                {/* Fluid Organic Aura Behind Images */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-[#FF6E00]/25 via-[#FFA040]/25 to-[#FFD54F]/20 rounded-[34px] blur-2xl animate-fluid-pulse-glow pointer-events-none" />

                {/* 4-Image Mosaic Grid with Dynamic Fluid Animations */}
                <div className="w-full max-w-[480px] grid grid-cols-2 gap-3 relative z-10">
                  {/* Card 1: Studio Portraits (Floating animation) */}
                  <div
                    onClick={() => setSelectedCategory('portraits')}
                    className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-[#E8E1D6] shadow-sm group cursor-pointer animate-fluid-float"
                  >
                    <img
                      src="/reference-assets/cat_portrait.jpg"
                      alt="Studio Portraits"
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />
                    {/* Fluid Shimmer Caustic Wave */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none animate-fluid-shimmer" />

                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white/90 backdrop-blur-md text-[#1A1816] shadow-2xs">
                        ★ 4.9 · Portraits
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between text-white">
                      <span className="text-xs font-bold leading-tight drop-shadow-sm">Editorial Stills</span>
                      <span className="text-[10px] font-extrabold text-[#FFD4A8]">From ₹800</span>
                    </div>
                  </div>

                  {/* Card 2: 4K Cinema Reels (Counter-floating animation) */}
                  <div
                    onClick={() => setSelectedCategory('reels')}
                    className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-[#E8E1D6] shadow-sm group cursor-pointer animate-fluid-float-reverse"
                  >
                    <img
                      src="/reference-assets/cat_reels.jpg"
                      alt="4K Cinema Reels"
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />

                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-2xs">
                        🎬 Sony FX3 Rigs
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between text-white">
                      <span className="text-xs font-bold leading-tight drop-shadow-sm">Creator Reels</span>
                      <span className="text-[10px] font-extrabold text-[#FFD4A8]">From ₹1,200</span>
                    </div>
                  </div>

                  {/* Card 3: Golden Hour Couples */}
                  <div
                    onClick={() => setSelectedCategory('couples')}
                    className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-[#E8E1D6] shadow-sm group cursor-pointer animate-fluid-float-reverse"
                  >
                    <img
                      src="/reference-assets/cat_couple.jpg"
                      alt="Golden Hour Couples"
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />

                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white/90 backdrop-blur-md text-[#FF6E00] shadow-2xs">
                        🌅 Golden Hour
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between text-white">
                      <span className="text-xs font-bold leading-tight drop-shadow-sm">Pre-Weddings</span>
                      <span className="text-[10px] font-extrabold text-[#FFD4A8]">From ₹1,500</span>
                    </div>
                  </div>

                  {/* Card 4: Hero Scene (Moments Beyond Time) */}
                  <div
                    onClick={() => {
                      const resultsEl = document.getElementById('artists-listing-section');
                      if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-[#E8E1D6] shadow-sm group cursor-pointer animate-fluid-float"
                  >
                    <img
                      src="/reference-assets/hero_scene.jpg"
                      alt="Moments Beyond Time"
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />
                    {/* Fluid Shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none animate-fluid-shimmer" />

                    <div className="absolute top-2 left-2 z-10">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600/90 text-white backdrop-blur-md shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span>OTP Protected</span>
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between text-white">
                      <span className="text-xs font-bold leading-tight drop-shadow-sm">Live Shoots</span>
                      <span className="text-[10px] font-extrabold text-emerald-300">Available</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. CURATED AESTHETIC VIBE CHIPS STRIP                     */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl border border-[#E8E1D6] p-3.5 shadow-2xs flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#8C847A] shrink-0 mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6E00]" />
              <span>Aesthetic Vibes:</span>
            </span>
            {VIBE_PRESETS.map((vibe) => {
              const isActive = activeVibe === vibe.id;
              return (
                <button
                  key={vibe.id}
                  onClick={() => handleApplyVibe(vibe)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#FF6E00] text-white shadow-2xs scale-[1.02]'
                      : 'bg-[#FAF7F2] text-[#5A544D] border border-[#E8E2D8] hover:border-[#FF6E00] hover:text-[#1A1816]'
                  }`}
                >
                  <span>{vibe.icon}</span>
                  <span>{vibe.label}</span>
                </button>
              );
            })}
          </div>

          {/* ========================================================= */}
          {/* 3. MULTI-PARAMETRIC CONTROL DECK (GENRE, BUDGET, GEAR)    */}
          {/* ========================================================= */}
          <div className="bg-white rounded-3xl border border-[#E8E1D6] p-5 sm:p-6 shadow-[0_2px_16px_-4px_rgba(26,24,22,0.04)] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filter 1: Genre / Category */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#8C847A] mb-1.5">
                  Photography Genre
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-[#FAF7F2] text-xs font-bold text-[#1A1816] rounded-xl border border-[#E8E2D8] px-3.5 py-2.5 focus:outline-none focus:border-[#FF6E00] focus:bg-white transition-all cursor-pointer appearance-none pr-8"
                  >
                    {GENRES.map((g) => (
                      <option key={g.slug} value={g.slug}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#8C847A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Filter 2: Location Hub */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#8C847A] mb-1.5">
                  Location / City Hub
                </label>
                <div className="relative">
                  <select
                    value={searchLocation || 'All Hubs'}
                    onChange={(e) => setSearchLocation(e.target.value === 'All Hubs' ? '' : e.target.value)}
                    className="w-full bg-[#FAF7F2] text-xs font-bold text-[#1A1816] rounded-xl border border-[#E8E2D8] px-3.5 py-2.5 focus:outline-none focus:border-[#FF6E00] focus:bg-white transition-all cursor-pointer appearance-none pr-8"
                  >
                    {LOCATION_HUBS.map((hub) => (
                      <option key={hub} value={hub}>
                        {hub}
                      </option>
                    ))}
                  </select>
                  <MapPin className="w-3.5 h-3.5 text-[#8C847A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Filter 3: Budget Tier */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#8C847A] mb-1.5">
                  Starting Package Budget
                </label>
                <div className="relative">
                  <select
                    value={selectedBudget}
                    onChange={(e) => setSelectedBudget(e.target.value)}
                    className="w-full bg-[#FAF7F2] text-xs font-bold text-[#1A1816] rounded-xl border border-[#E8E2D8] px-3.5 py-2.5 focus:outline-none focus:border-[#FF6E00] focus:bg-white transition-all cursor-pointer appearance-none pr-8"
                  >
                    <option value="all">Any Starting Price</option>
                    <option value="under_1500">Budget-Friendly (&lt; ₹1,500)</option>
                    <option value="1500_3000">Standard Studio (₹1,500 – ₹3,000)</option>
                    <option value="above_3000">Elite Production (&gt; ₹3,000)</option>
                  </select>
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#8C847A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Filter 4: Camera Gear Tier */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#8C847A] mb-1.5">
                  Camera System & Rig Tier
                </label>
                <div className="relative">
                  <select
                    value={selectedGearTier}
                    onChange={(e) => setSelectedGearTier(e.target.value)}
                    className="w-full bg-[#FAF7F2] text-xs font-bold text-[#1A1816] rounded-xl border border-[#E8E2D8] px-3.5 py-2.5 focus:outline-none focus:border-[#FF6E00] focus:bg-white transition-all cursor-pointer appearance-none pr-8"
                  >
                    {GEAR_TIERS.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.label}
                      </option>
                    ))}
                  </select>
                  <Camera className="w-3.5 h-3.5 text-[#8C847A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Quick Toggle Bar: Availability, Turnaround, Rating & Sort */}
            <div className="pt-3 border-t border-[#F2ECE3] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[#8C847A] mr-1">Quick Filters:</span>
                
                <button
                  onClick={() => setSelectedAvailability(selectedAvailability === 'today' ? 'all' : 'today')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                    selectedAvailability === 'today'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Available Today</span>
                </button>

                <button
                  onClick={() => setSameDayOnly(!sameDayOnly)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                    sameDayOnly
                      ? 'bg-[#1A1816] text-white shadow-2xs'
                      : 'bg-[#F2ECE3] text-[#5A544D] hover:bg-[#EAE2D7]'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>24h Rapid Delivery</span>
                </button>

                <button
                  onClick={() => setSelectedRating(selectedRating === '4.95' ? 'all' : '4.95')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                    selectedRating === '4.95'
                      ? 'bg-amber-500 text-white'
                      : 'bg-[#F2ECE3] text-[#5A544D] hover:bg-[#EAE2D7]'
                  }`}
                >
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>★ 4.95+ Top Rated</span>
                </button>
              </div>

              {/* Sort By Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-[#8C847A]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E8E2D8] text-xs font-bold text-[#1A1816] focus:outline-none cursor-pointer"
                >
                  <option value="recommended">Recommended (AI Score)</option>
                  <option value="rating">Highest Client Rating</option>
                  <option value="price_low">Starting Price: Low to High</option>
                  <option value="price_high">Starting Price: High to Low</option>
                  <option value="experience">Years of Experience</option>
                </select>

                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[#FF6E00] hover:text-[#E86300] font-bold transition-colors cursor-pointer"
                    title="Reset all filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. RESULTS COUNTER & TRUST GUARANTEE HEADER               */}
          {/* ========================================================= */}
          <div id="artists-listing-section" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-[#1A1816]">
                Showing <span className="text-[#FF6E00]">{filteredPhotographers.length}</span> Verified Artists
              </p>
              {hasActiveFilters && (
                <span className="text-xs text-[#8C847A] font-semibold">
                  (filtered from {dbCreators.length} total)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#5A544D]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Identity, Background & Shoot-Start OTP Handshake Protected</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 5. DUAL VIEW: LOOKBOOK GRID VS STUDIO RADAR MAP           */}
          {/* ========================================================= */}
          {viewMode === 'map' ? (
            /* MAP RADAR VIEW */
            <div className="relative bg-[#1A1816] text-white rounded-3xl p-6 sm:p-8 overflow-hidden min-h-[520px] border border-[#2D2824] shadow-elevated">
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#FF6E00_1px,transparent_1px)] [background-size:24px_24px]" />
              
              <div className="relative z-10 flex items-center justify-between mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6E00] uppercase tracking-wider mb-1">
                    <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '10s' }} />
                    <span>Live Geospatial Radar • Verified Creative Network</span>
                  </div>
                  <h2 className="text-2xl font-black">Interactive Creator Radar</h2>
                </div>
                <button
                  onClick={() => setViewMode('grid')}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                >
                  Return to Lookbook
                </button>
              </div>

              <div className="relative z-10 w-full h-[400px] rounded-2xl bg-[#231F1C] border border-white/10 flex items-center justify-center overflow-hidden">
                <div className="absolute w-[220px] h-[220px] rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute w-[360px] h-[360px] rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute w-[500px] h-[500px] rounded-full border border-white/5 pointer-events-none" />

                <div className="absolute top-4 left-4 text-[10px] font-mono text-white/40">
                  LAT 28.5355° N • LON 77.3910° E • RADAR SENSITIVITY: HIGH
                </div>

                {filteredPhotographers.map((creator, i) => {
                  const positions = [
                    { top: '35%', left: '42%' },
                    { top: '50%', left: '55%' },
                    { top: '65%', left: '38%' },
                    { top: '28%', left: '68%' },
                    { top: '58%', left: '72%' },
                    { top: '44%', left: '26%' },
                  ];
                  const pos = positions[i % positions.length];
                  const isSelected = selectedMapPhotographer?.id === creator.id;

                  return (
                    <div
                      key={creator.id}
                      style={{ top: pos.top, left: pos.left }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
                      onClick={() => setSelectedMapPhotographer(creator)}
                    >
                      <span className="absolute -inset-1 rounded-full bg-[#FF6E00] opacity-75 animate-ping" />
                      
                      <div className={`relative px-3 py-1.5 rounded-full flex items-center gap-2 border transition-all shadow-lg ${
                        isSelected 
                          ? 'bg-[#FF6E00] text-white border-white scale-110' 
                          : 'bg-[#1A1816] text-white border-white/30 hover:border-[#FF6E00] hover:scale-105'
                      }`}>
                        <img src={creator.avatarUrl} alt={creator.name} className="w-5 h-5 rounded-full object-cover" />
                        <span className="text-xs font-bold whitespace-nowrap">{creator.name}</span>
                        <span className="text-[10px] text-amber-300 font-extrabold">★{creator.rating}</span>
                      </div>
                    </div>
                  );
                })}

                {selectedMapPhotographer && (
                  <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-[#1A1816]/95 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl z-30 animate-in fade-in slide-in-from-bottom-3 duration-200">
                    <div className="flex items-start gap-3">
                      <img
                        src={selectedMapPhotographer.avatarUrl}
                        alt={selectedMapPhotographer.name}
                        className="w-14 h-14 rounded-xl object-cover border border-white/20 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-extrabold text-white truncate">
                            {selectedMapPhotographer.name}
                          </h4>
                          <button
                            onClick={() => setSelectedMapPhotographer(null)}
                            className="text-white/60 hover:text-white p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-white/70 truncate">{selectedMapPhotographer.locationArea}</p>
                        <p className="text-[11px] text-[#FF6E00] font-bold mt-0.5">
                          From ₹{selectedMapPhotographer.startingPriceInr} • {selectedMapPhotographer.experienceYears} Yrs Exp
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-white/60 truncate">
                        📷 {selectedMapPhotographer.cameraGear.split('•')[0]}
                      </span>
                      <Link
                        href={`/photographers/${getPhotographerSlug(selectedMapPhotographer.name, selectedMapPhotographer.id)}`}
                        className="px-3.5 py-1.5 rounded-xl bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs font-bold shrink-0 transition-colors"
                      >
                        Book Artist
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* LOOKBOOK GRID VIEW */
            filteredPhotographers.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E8E2D8] p-12 text-center max-w-lg mx-auto space-y-4 shadow-subtle">
                <div className="w-14 h-14 rounded-full bg-[#FFF3E5] flex items-center justify-center text-[#FF6E00] mx-auto">
                  <Search className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1816]">No Creators Found</h3>
                <p className="text-xs sm:text-sm text-[#5A544D] leading-relaxed">
                  We couldn&apos;t match any photographers with your specific combination of filters. Try relaxing your budget, gear, or search keywords.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 rounded-full bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPhotographers.map((creator) => {
                  const isFav = !!favorites[creator.id];
                  const isComparing = compareList.includes(creator.id);
                  const activePhotoIdx = activePhotoIndices[creator.id] || 0;
                  const displayImage = creator.portfolioPreviews[activePhotoIdx] || creator.portfolioPreviews[0];

                  return (
                    <Card
                      key={creator.id}
                      hoverEffect
                      className="p-0 overflow-hidden flex flex-col justify-between group rounded-3xl border border-[#E8E2D8]"
                    >
                      <div>
                        {/* Interactive Multi-Photo Preview Cover */}
                        <div className="relative aspect-[16/10] overflow-hidden bg-[#F2ECE3]">
                          <img
                            src={displayImage}
                            alt={creator.name}
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                          />

                          {/* Top Left Badges: Experience & Live Availability Beacon */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#1A1816]/90 text-white backdrop-blur-md">
                              {creator.experienceYears} Yrs Exp
                            </span>
                            {creator.availabilityStatus.toLowerCase().includes('today') && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                <span>Today</span>
                              </span>
                            )}
                          </div>

                          {/* Top Right Action Buttons: Compare Checkbox & Favorite */}
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            {/* Compare Checkbox */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleCompare(creator.id, e)}
                              className={`p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                                isComparing
                                  ? 'bg-[#FF6E00] text-white shadow-md'
                                  : 'bg-black/50 text-white/80 hover:text-white hover:bg-black/70'
                              }`}
                              title={isComparing ? 'Remove from compare' : 'Add to compare'}
                            >
                              <Scale className="w-4 h-4" />
                            </button>

                            {/* Favorite Heart */}
                            <button
                              type="button"
                              onClick={(e) => toggleFavorite(creator.id, e)}
                              aria-label={isFav ? 'Remove from favorites' : 'Save to favorites'}
                              className={`p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                                isFav
                                  ? 'bg-white text-red-500 shadow-md'
                                  : 'bg-black/50 text-white hover:text-red-400'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500' : ''}`} />
                            </button>
                          </div>

                          {/* Interactive Thumbnail Previews Strip on Cover */}
                          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between p-1.5 rounded-xl bg-black/40 backdrop-blur-md">
                            <span className="text-[10px] font-bold text-white/80 pl-1">
                              Preview:
                            </span>
                            <div className="flex items-center gap-1.5">
                              {creator.portfolioPreviews.slice(0, 3).map((thumb, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={(e) => handleThumbnailHover(creator.id, idx, e)}
                                  className={`w-7 h-5 rounded overflow-hidden border transition-all cursor-pointer ${
                                    activePhotoIdx === idx
                                      ? 'border-[#FF6E00] scale-110 shadow-xs'
                                      : 'border-white/40 opacity-70 hover:opacity-100'
                                  }`}
                                >
                                  <img src={thumb} alt="thumb" className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Card Info Body */}
                        <div className="p-5 space-y-3">
                          {/* Name, Verified Handshake, Rating */}
                          <div className="flex items-start justify-between">
                            <Link href={`/photographers/${getPhotographerSlug(creator.name, creator.id)}`} className="min-w-0 group/link">
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-base sm:text-lg font-black text-[#1A1816] group-hover/link:text-[#FF6E00] transition-colors">
                                  {creator.name}
                                </h3>
                                {creator.isVerified && (
                                  <span title="Identity & Gear Verified by SnapShoot">
                                    <CheckCircle2 className="w-4 h-4 text-[#FF6E00] fill-[#FFF3E5] shrink-0" />
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#8C847A] flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-[#FF6E00]" />
                                <span>{creator.locationArea}</span>
                              </p>
                            </Link>

                            {/* Client Rating Pill */}
                            <div className="flex items-center gap-1 text-xs font-bold text-[#1A1816] bg-[#F2ECE3] px-2.5 py-1 rounded-full shrink-0">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span>{creator.rating}</span>
                              <span className="text-[#8C847A] font-normal">({creator.reviewCount})</span>
                            </div>
                          </div>

                          {/* Tagline / Style Bio */}
                          <p className="text-xs text-[#5A544D] font-medium leading-relaxed line-clamp-2">
                            {creator.tagline}
                          </p>

                          {/* Camera Gear & Cinema Specs Badge */}
                          <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center gap-2">
                            <Camera className="w-3.5 h-3.5 text-[#FF6E00] shrink-0" />
                            <span className="text-[11px] font-semibold text-[#1A1816] truncate">
                              {creator.cameraGear}
                            </span>
                          </div>

                          {/* Category Tag Pills */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {creator.categories.slice(0, 3).map((cat) => (
                              <span
                                key={cat}
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F2ECE3] text-[#5A544D]"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Starting Price & Primary CTA Links */}
                      <div className="p-5 pt-3.5 border-t border-[#E8E2D8] flex items-center justify-between bg-[#FAF7F2]/50">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-[#8C847A]">Starting From</p>
                          <p className="text-lg font-black text-[#1A1816]">
                            ₹{creator.startingPriceInr.toLocaleString('en-IN')}
                            <span className="text-[10px] font-normal text-[#8C847A] ml-1">/ session</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/photographers/${getPhotographerSlug(creator.name, creator.id)}`}
                            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-bold border border-[#D5CEC4] bg-white hover:bg-[#FAF7F2] text-[#1A1816] transition-all"
                          >
                            <span>Profile</span>
                          </Link>
                          <Link
                            href={`/photographers/${getPhotographerSlug(creator.name, creator.id)}?book=true`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#FF6E00] hover:bg-[#E86300] active:scale-95 text-white shadow-xs transition-all"
                          >
                            <span>Book</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          )}

          {/* ========================================================= */}
          {/* 6. FLOATING COMPARISON DOCK (WHEN 1+ ARTISTS SELECTED)     */}
          {/* ========================================================= */}
          {compareList.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in slide-in-from-bottom-5 duration-200">
              <div className="bg-[#1A1816] text-white rounded-3xl p-3.5 px-5 shadow-2xl border border-white/20 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FF6E00] flex items-center justify-center text-white">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">
                      {compareList.length} Photographer{compareList.length > 1 ? 's' : ''} Selected
                    </p>
                    <p className="text-[10px] text-white/60">
                      Compare gear, turnaround, deliverables & pricing
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCompareList([])}
                    className="p-1.5 text-white/60 hover:text-white rounded-full transition-colors text-xs"
                    title="Clear list"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsCompareModalOpen(true)}
                    className="px-4 py-2 rounded-full bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Compare Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 7. COMPARISON MATRIX MODAL                                */}
          {/* ========================================================= */}
          <Modal
            isOpen={isCompareModalOpen}
            onClose={() => setIsCompareModalOpen(false)}
            title="Side-by-Side Creator Comparison"
            description="Evaluate camera gear, deliverables, turnaround speed, and package pricing."
            maxWidth="xl"
          >
            <div className="overflow-x-auto py-2">
              <div className="grid grid-cols-3 gap-4 min-w-[600px]">
                {comparedCreators.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-4">
                    <div className="text-center space-y-2">
                      <img
                        src={c.avatarUrl}
                        alt={c.name}
                        className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-white shadow-sm"
                      />
                      <h4 className="text-sm font-black text-[#1A1816]">{c.name}</h4>
                      <p className="text-xs text-[#FF6E00] font-bold">★ {c.rating} ({c.reviewCount} reviews)</p>
                    </div>

                    <div className="space-y-2.5 text-xs pt-2 border-t border-[#E8E2D8]">
                      <div>
                        <span className="text-[10px] font-bold text-[#8C847A] uppercase block">Starting Price</span>
                        <span className="font-extrabold text-[#1A1816] text-sm">₹{c.startingPriceInr}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#8C847A] uppercase block">Camera System</span>
                        <span className="font-semibold text-[#1A1816]">{c.cameraGear}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#8C847A] uppercase block">Experience</span>
                        <span className="font-semibold text-[#1A1816]">{c.experienceYears} Years</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#8C847A] uppercase block">Availability</span>
                        <span className="font-semibold text-emerald-700">{c.availabilityStatus}</span>
                      </div>
                    </div>

                    <Link
                      href={`/photographers/${c.id}`}
                      className="block w-full py-2 text-center rounded-full bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs font-bold transition-colors"
                    >
                      Book {c.name.split(' ')[0]}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </Modal>

          {/* ========================================================= */}
          {/* 8. AI SHOOT MATCHMAKER WIZARD MODAL                       */}
          {/* ========================================================= */}
          <Modal
            isOpen={isMatchmakerOpen}
            onClose={() => setIsMatchmakerOpen(false)}
            title="AI Shoot Matchmaker Assistant"
            description="Answer 3 quick questions and get immediately matched to your ideal verified photographer."
            maxWidth="md"
          >
            <div className="space-y-5 py-2">
              {mmStep === 1 && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[#FF6E00]">Step 1 of 3: Shoot Objective</span>
                  <h4 className="text-sm font-black text-[#1A1816]">What style of photography are you looking to capture?</h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {['Portraits & Headshots', 'Reels & Creator 4K', 'Couples & Weddings', 'Events & Celebrations'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setMmGenre(opt);
                          setMmStep(2);
                        }}
                        className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer ${
                          mmGenre === opt
                            ? 'bg-[#FF6E00] text-white border-transparent shadow-sm'
                            : 'bg-white hover:bg-[#FAF7F2] border-[#E8E2D8] text-[#1A1816]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mmStep === 2 && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[#FF6E00]">Step 2 of 3: Preferred Location</span>
                  <h4 className="text-sm font-black text-[#1A1816]">Where will the shoot take place?</h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {['Greater Noida', 'Noida', 'South Delhi', 'Gurugram', 'Mumbai', 'Bengaluru'].map((loc) => (
                      <button
                        key={loc}
                        onClick={() => {
                          setMmLocation(loc);
                          setMmStep(3);
                        }}
                        className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer ${
                          mmLocation === loc
                            ? 'bg-[#FF6E00] text-white border-transparent shadow-sm'
                            : 'bg-white hover:bg-[#FAF7F2] border-[#E8E2D8] text-[#1A1816]'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mmStep === 3 && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[#FF6E00]">Step 3 of 3: Target Budget</span>
                  <h4 className="text-sm font-black text-[#1A1816]">What is your planned session budget?</h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {['Under ₹1,500', '₹1,500 – ₹3,000', '₹3,000 – ₹5,000', 'Premium (₹5,000+)'].map((b) => (
                      <button
                        key={b}
                        onClick={() => {
                          setMmBudget(b);
                          handleRunMatchmaker();
                        }}
                        className="p-3 rounded-2xl border border-[#E8E2D8] hover:border-[#FF6E00] bg-white hover:bg-[#FFF3E5] text-xs font-bold text-[#1A1816] text-left transition-all cursor-pointer"
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mmStep === 4 && mmMatchedCreator && (
                <div className="space-y-4 text-center animate-in zoom-in-95 duration-200">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>98.6% AI Compatibility Match</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center gap-3 text-left">
                    <img
                      src={mmMatchedCreator.avatarUrl}
                      alt={mmMatchedCreator.name}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-black text-[#1A1816]">{mmMatchedCreator.name}</h4>
                      <p className="text-xs text-[#8C847A]">{mmMatchedCreator.locationArea}</p>
                      <p className="text-xs font-bold text-[#FF6E00] mt-1">
                        Starting from ₹{mmMatchedCreator.startingPriceInr} • ★ {mmMatchedCreator.rating}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setMmStep(1)}
                      className="flex-1 py-2.5 rounded-full border border-[#E8E2D8] text-xs font-bold text-[#5A544D]"
                    >
                      Restart Matchmaker
                    </button>
                    <Link
                      href={`/photographers/${mmMatchedCreator.id}`}
                      className="flex-1 py-2.5 rounded-full bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs font-bold shadow-sm transition-all"
                    >
                      Book Top Match
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </Modal>

        </div>
      </main>

      <Footer />
    </>
  );
}

export default function ExplorePage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2]" />}>
        <ExploreContent />
      </Suspense>
    </>
  );
}
