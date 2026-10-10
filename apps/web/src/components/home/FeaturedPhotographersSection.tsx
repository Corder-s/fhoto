'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Star, 
  MapPin, 
  CheckCircle2, 
  Heart, 
  ArrowRight, 
  Sparkles, 
  Calendar 
} from 'lucide-react';
import { SamplePhotographer } from '../../data/photographers';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface FeaturedPhotographersSectionProps {
  photographers: SamplePhotographer[];
  activeFilterDescription?: string;
  onResetFilter?: () => void;
}

export const FeaturedPhotographersSection: React.FC<FeaturedPhotographersSectionProps> = ({
  photographers,
  activeFilterDescription,
  onResetFilter,
}) => {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section className="py-16 md:py-24 bg-canvas-secondary/50 border-t border-contour-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-subtle text-brand text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verified Creator Showcase</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-primary">
              Featured Photographers & Filmmakers
            </h2>
            {activeFilterDescription && (
              <p className="text-xs sm:text-sm font-semibold text-ink-secondary mt-1">
                {activeFilterDescription}{' '}
                {onResetFilter && (
                  <button
                    onClick={onResetFilter}
                    className="text-brand font-bold underline hover:text-brand-hover ml-2"
                  >
                    Clear Filter
                  </button>
                )}
              </p>
            )}
          </div>

          <Link
            href="/photographers"
            className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:text-brand-hover transition-colors"
          >
            Explore all creators <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Empty State */}
        {photographers.length === 0 ? (
          <div className="bg-white rounded-card-lg border border-contour-subtle p-12 text-center max-w-md mx-auto space-y-4">
            <p className="text-3xl">🔍</p>
            <h3 className="text-lg font-bold text-ink-primary">No creators match this filter</h3>
            <p className="text-xs text-ink-secondary">
              Try switching categories or expanding your location to see more verified photographers.
            </p>
            {onResetFilter && (
              <button
                onClick={onResetFilter}
                className="px-4 py-2 rounded-card-sm text-xs font-bold bg-brand text-white hover:bg-brand-hover"
              >
                Reset Search Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {photographers.map((creator) => {
              const isFav = !!favorites[creator.id];
              return (
                <Card
                  key={creator.id}
                  hoverEffect
                  className="p-0 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Avatar, Name, Verification, Location & Favorite */}
                    <div className="p-5 sm:p-6 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-canvas-secondary border border-contour-subtle shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={creator.avatarUrl}
                            alt={creator.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-lg font-bold text-ink-primary">{creator.name}</h3>
                            {creator.isVerified && (
                              <span title="Government ID & Portfolio Verified">
                                <CheckCircle2 className="w-4 h-4 text-brand fill-brand-subtle shrink-0" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-ink-muted" />
                            <span>{creator.locationArea}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Rating pill */}
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-card-sm bg-canvas-primary border border-contour-subtle text-xs font-bold text-ink-primary">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{creator.rating}</span>
                          <span className="text-ink-muted font-normal">({creator.reviewCount})</span>
                        </div>

                        {/* Favorite button toggle */}
                        <button
                          onClick={(e) => toggleFavorite(creator.id, e)}
                          aria-label={isFav ? 'Remove from favorites' : 'Save to favorites'}
                          className={`p-2 rounded-card-sm border transition-colors ${
                            isFav
                              ? 'bg-red-50 border-red-200 text-red-500'
                              : 'bg-white border-contour-subtle text-ink-muted hover:text-red-500'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Tagline / Bio */}
                    <div className="px-5 sm:px-6 pb-3">
                      <p className="text-xs sm:text-sm text-ink-secondary font-medium">
                        {creator.tagline}
                      </p>
                    </div>

                    {/* Portfolio Preview Gallery (3 Images) */}
                    <div className="px-5 sm:px-6 pb-4">
                      <div className="grid grid-cols-3 gap-2 rounded-card-sm overflow-hidden">
                        {creator.portfolioPreviews.map((img, i) => (
                          <div key={i} className="aspect-[4/3] bg-canvas-secondary overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img}
                              alt={`${creator.name} portfolio sample ${i + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Categories & Availability badges */}
                    <div className="px-5 sm:px-6 pb-4 flex flex-wrap items-center gap-2">
                      <Badge variant="success" size="sm">
                        {creator.availabilityStatus}
                      </Badge>
                      {creator.categories.map((c) => (
                        <span
                          key={c}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-canvas-primary text-ink-secondary border border-contour-subtle"
                        >
                          {c}
                        </span>
                      ))}
                      <span className="text-[11px] text-ink-muted ml-auto">
                        Gear: {creator.cameraGear}
                      </span>
                    </div>
                  </div>

                  {/* Pricing & Booking CTA */}
                  <div className="p-5 sm:px-6 border-t border-contour-subtle flex items-center justify-between bg-canvas-primary/40">
                    <div>
                      <p className="text-[10px] uppercase font-extrabold text-ink-muted tracking-wider">
                        Starting Package
                      </p>
                      <p className="text-lg font-black text-ink-primary">
                        ₹{creator.startingPriceInr.toLocaleString('en-IN')}{' '}
                        <span className="text-xs font-normal text-ink-muted">/ shoot</span>
                      </p>
                    </div>

                    <Link
                      href={`/photographers/${creator.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-card-sm text-xs font-bold bg-brand hover:bg-brand-hover active:bg-brand-active text-white shadow-sm transition-colors"
                    >
                      <span>View Profile & Packages</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
