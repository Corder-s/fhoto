'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, MapPin, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useAuthModal } from '../auth/AuthModalContext';

interface LiveCreator {
  id: string;
  name: string;
  bio?: string;
  tagline: string;
  locationArea: string;
  startingPriceInr: number;
  rating: number;
  reviewCount: number;
  availabilityStatus: string;
  avatarUrl: string;
  coverImageUrl: string;
  specialties: string[];
}

export const ZomatoFeaturedPhotographers: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [creators, setCreators] = useState<LiveCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadCreators() {
      try {
        const res = await fetch('/api/photographers');
        const data = await res.json();
        if (isMounted && data.photographers && data.photographers.length > 0) {
          setCreators(data.photographers);
        }
      } catch (err) {
        console.error('Failed to load live photographers:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadCreators();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="py-10 md:py-16 bg-[#FAF7F2]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C847A]">
                VERIFIED CREATOR NETWORK
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E7F6ED] text-[#1E7D46] border border-[#C5E8D2] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E7D46] animate-pulse" />
                Live Database
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A1816] tracking-tight">
              Discover photographers near you
            </h2>
            <p className="text-xs sm:text-sm text-[#665E55]">
              Browse verified portfolios and upfront package pricing in Delhi NCR, Mumbai, and across India.
            </p>
          </div>

          <Link
            href="/explore"
            onClick={(e) => {
              if (!isAuthenticated) {
                e.preventDefault();
                openAuthModal({
                  returnUrl: '/explore',
                  message: 'Join SnapShoot to discover and book the perfect photographer.',
                });
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A1816] hover:text-[#FF6E00] transition-colors self-start sm:self-auto"
          >
            <span>View all {creators.length > 0 ? `${creators.length} verified` : ''} photographers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-[#EBE4DA] overflow-hidden shadow-sm animate-pulse flex flex-col justify-between h-[380px]"
              >
                <div className="aspect-[16/9] bg-[#E8E2D8]" />
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#E8E2D8]" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-[#E8E2D8] rounded w-2/3" />
                      <div className="h-3 bg-[#E8E2D8] rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-3 bg-[#E8E2D8] rounded w-full" />
                </div>
                <div className="p-5 pt-3 border-t border-[#EBE4DA] h-12 bg-[#FAF7F2]/50" />
              </div>
            ))}
          </div>
        )}

        {/* Photographers Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {creators.map((creator) => (
              <div
                key={creator.id}
                className="bg-white rounded-2xl border border-[#EBE4DA] overflow-hidden shadow-[0_4px_16px_-4px_rgba(26,24,22,0.06)] hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Portfolio Preview Cover */}
                  <div className="relative aspect-[16/9] overflow-hidden bg-[#FAF7F2]">
                    <img
                      src={creator.coverImageUrl}
                      alt={`${creator.name} portfolio preview`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Availability Indicator */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E7F6ED] text-[#1E7D46] border border-[#C5E8D2] flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1E7D46]" />
                      <span>{creator.availabilityStatus}</span>
                    </div>
                  </div>

                  {/* Creator Info Body */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={creator.avatarUrl}
                          alt={creator.name}
                          className="w-11 h-11 rounded-full object-cover shrink-0 border border-[#E8E1D6]"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-base font-bold text-[#1A1816] truncate">
                              {creator.name}
                            </h3>
                            <CheckCircle2 className="w-4 h-4 text-[#FF6E00] fill-[#FF6E00]/10 shrink-0 stroke-[2.2]" />
                          </div>
                          <p className="text-xs text-[#8C847A] flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-[#8C847A] shrink-0" />
                            <span>{creator.locationArea}</span>
                          </p>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FAF7F2] border border-[#E8E2D8] text-xs font-bold text-[#1A1816] shrink-0">
                        <Star className="w-3 h-3 text-[#FF6E00] fill-[#FF6E00]" />
                        <span>{creator.rating.toFixed(1)}</span>
                        <span className="text-[#8C847A] font-normal text-[11px]">
                          ({creator.reviewCount})
                        </span>
                      </div>
                    </div>

                    {/* Specialties Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {creator.specialties.slice(0, 3).map((spec) => (
                        <span
                          key={spec}
                          className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#F2ECE3] text-[#5A544D]"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Starting Price & View Profile CTA */}
                <div className="p-5 pt-3 border-t border-[#EBE4DA] flex items-center justify-between bg-[#FAF7F2]/50">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#8C847A] block leading-tight">
                      Starting at
                    </span>
                    <span className="text-base font-black text-[#1A1816]">
                      ₹{creator.startingPriceInr.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-[#8C847A]"> / session</span>
                  </div>

                  <Link
                    href={`/photographers/${creator.id}`}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6E00] hover:bg-[#E86300] active:scale-95 shadow-sm transition-all"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
