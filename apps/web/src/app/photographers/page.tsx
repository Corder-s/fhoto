'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { 
  Search, 
  MapPin, 
  Star, 
  ShieldCheck, 
  SlidersHorizontal, 
  ArrowUpDown, 
  CheckCircle2, 
  Camera, 
  Heart, 
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { SAMPLE_PHOTOGRAPHERS, SamplePhotographer } from '../../data/photographers';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

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

function PhotographersContent() {
  const searchParams = useSearchParams();
  const urlLocation = searchParams.get('location') || '';
  const urlCategory = searchParams.get('category') || 'all';
  const urlQuery = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(urlQuery || urlLocation);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [sortBy, setSortBy] = useState<'recommended' | 'rating' | 'price_low' | 'price_high'>('recommended');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (urlCategory) setSelectedCategory(urlCategory);
    if (urlQuery || urlLocation) setSearchTerm(urlQuery || urlLocation);
  }, [urlCategory, urlQuery, urlLocation]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSortBy('recommended');
  };

  const filteredPhotographers = useMemo(() => {
    let result = [...SAMPLE_PHOTOGRAPHERS];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.locationCity.toLowerCase().includes(q) ||
          p.locationArea.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter((p) => matchesCategory(p.categories, selectedCategory));
    }

    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'price_low') {
      result.sort((a, b) => a.startingPriceInr - b.startingPriceInr);
    } else if (sortBy === 'price_high') {
      result.sort((a, b) => b.startingPriceInr - a.startingPriceInr);
    } else {
      result.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    return result;
  }, [searchTerm, selectedCategory, sortBy]);

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-canvas-primary py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Top Headline */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-subtle text-brand text-xs font-bold mb-2">
              <Camera className="w-3.5 h-3.5" />
              <span>Artist Registry</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-primary">
              All Verified Photographers
            </h1>
            <p className="text-xs sm:text-sm text-ink-secondary mt-1">
              Browse our complete roster of vetted visual storytellers across India.
            </p>
          </div>

          {/* SEARCH & FILTER TOP BAR */}
          <div className="bg-white p-4 rounded-card-md border border-contour-subtle shadow-subtle">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-canvas-primary rounded-card-sm border border-contour-subtle">
                <Search className="w-4 h-4 text-brand shrink-0" />
                <input
                  type="text"
                  placeholder="Search by artist name or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-ink-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-canvas-primary rounded-card-sm border border-contour-subtle">
                <Camera className="w-4 h-4 text-brand shrink-0" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-ink-primary focus:outline-none cursor-pointer"
                >
                  <option value="all">All Photography Genres</option>
                  <option value="portraits">Portraits & Headshots</option>
                  <option value="reels">Reels & Creator Video</option>
                  <option value="couples">Couples & Weddings</option>
                  <option value="events">Events & Celebrations</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-canvas-primary rounded-card-sm border border-contour-subtle">
                <ArrowUpDown className="w-4 h-4 text-ink-secondary shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-transparent text-sm font-semibold text-ink-primary focus:outline-none cursor-pointer"
                >
                  <option value="recommended">Sort: Recommended</option>
                  <option value="rating">Sort: Highest Rated</option>
                  <option value="price_low">Sort: Price Low to High</option>
                  <option value="price_high">Sort: Price High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* RESULTS COUNT & META */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-ink-primary">
              Showing <span className="text-brand">{filteredPhotographers.length}</span> Verified Creators
            </p>
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <span>Verified Identity Guaranteed</span>
              <ShieldCheck className="w-4 h-4 text-brand" />
            </div>
          </div>

          {/* GRID OF CREATORS OR EMPTY STATE */}
          {filteredPhotographers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPhotographers.map((creator) => {
                const isFav = !!favorites[creator.id];
                return (
                  <Card key={creator.id} hoverEffect className="p-0 overflow-hidden flex flex-col justify-between">
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

                        <button
                          onClick={(e) => toggleFavorite(creator.id, e)}
                          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors ${
                            isFav ? 'bg-white text-red-500 shadow-md' : 'bg-black/40 text-white hover:text-red-400'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500' : ''}`} />
                        </button>
                      </div>

                      {/* Body Content */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h2 className="text-lg font-bold text-ink-primary">{creator.name}</h2>
                              {creator.isVerified && (
                                <span title="Verified Pro">
                                  <CheckCircle2 className="w-4 h-4 text-brand fill-brand-subtle shrink-0" />
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-ink-muted" />
                              {creator.locationArea}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-bold text-ink-primary bg-canvas-primary px-2 py-0.5 rounded-full border border-contour-subtle">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{creator.rating}</span>
                            <span className="text-ink-muted font-normal">({creator.reviewCount})</span>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-ink-secondary font-medium">
                          {creator.tagline}
                        </p>

                        {/* Tag Pills */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {creator.categories.map((c) => (
                            <span
                              key={c}
                              className="px-2 py-0.5 rounded-card-sm text-[11px] font-medium bg-canvas-secondary text-ink-secondary border border-contour-subtle uppercase"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer Pricing & CTA */}
                    <div className="p-5 pt-3 border-t border-contour-subtle flex items-center justify-between bg-canvas-primary/30">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-ink-muted">Packages from</p>
                        <p className="text-lg font-extrabold text-ink-primary">
                          ₹{creator.startingPriceInr.toLocaleString('en-IN')}
                        </p>
                      </div>

                      <Link
                        href={`/photographers/${creator.id}`}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-card-sm text-xs font-bold bg-brand hover:bg-brand-hover text-white shadow-sm transition-colors"
                      >
                        <span>View Packages</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-card-md border border-contour-subtle p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-brand-subtle text-brand flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-ink-primary">No photographers found</h3>
                <p className="text-xs sm:text-sm text-ink-secondary max-w-md mx-auto">
                  No verified creators match your current filter criteria. Try expanding your search terms or resetting filters.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset All Filters
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function PhotographersDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas-primary flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        </div>
      }
    >
      <PhotographersContent />
    </Suspense>
  );
}
