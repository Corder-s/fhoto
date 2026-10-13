'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Star,
  MapPin,
  CheckCircle2,
  Heart,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { SamplePhotographer } from '../../data/photographers';

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
    <section className="py-10 md:py-16 bg-[#FAF7F2]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C847A]">
            FEATURED PHOTOGRAPHERS
          </span>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#1A1816] tracking-tight">
              Photographers near you.
            </h2>

            {/* View all link + Circular arrows */}
            <div className="flex items-center gap-3">
              <Link
                href="/explore"
                className="text-xs font-bold text-[#1A1816] hover:text-[#FF6E00] flex items-center gap-1 transition-colors"
              >
                <span>View all photographers</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
              </Link>

              <div className="hidden sm:flex items-center gap-1.5 ml-2">
                <button
                  type="button"
                  className="w-7 h-7 rounded-full border border-[#D5CEC4] flex items-center justify-center text-[#5A544D] hover:bg-white transition-colors"
                  aria-label="Previous photographers"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="w-7 h-7 rounded-full border border-[#D5CEC4] flex items-center justify-center text-[#5A544D] hover:bg-white transition-colors"
                  aria-label="Next photographers"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photographers.slice(0, 3).map((creator) => {
            const isFav = !!favorites[creator.id];

            return (
              <div
                key={creator.id}
                className="bg-white rounded-2xl border border-[#EBE4DA] overflow-hidden shadow-[0_2px_12px_-2px_rgba(26,24,22,0.04)] hover:shadow-card hover:-translate-y-1 transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top: Avatar, Name, Verification, Location, Rating, Favorite */}
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/photographers/${creator.id}`}
                      className="flex items-center gap-3 min-w-0 group/creator hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={
                          creator.avatarUrl ||
                          (creator.id === 'pro-aman'
                            ? '/reference-assets/avatar_aman.jpg'
                            : creator.id === 'pro-riya'
                            ? '/reference-assets/avatar_riya.jpg'
                            : '/reference-assets/avatar_karan.jpg')
                        }
                        alt={creator.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#E8E1D6] group-hover/creator:border-[#FF6E00] transition-colors"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="text-sm font-bold text-[#1A1816] truncate group-hover/creator:text-[#FF6E00] transition-colors">
                            {creator.name}
                          </h3>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6E00] fill-[#FF6E00]/10 shrink-0 stroke-[2.5]" />
                        </div>
                        <p className="text-[11px] text-[#8C847A] flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-[#8C847A] shrink-0" />
                          <span>{creator.locationArea}</span>
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 text-xs font-bold text-[#1A1816]">
                        <Star className="w-3.5 h-3.5 text-[#FF6E00] fill-[#FF6E00]" />
                        <span>{creator.rating}</span>
                        <span className="text-[#8C847A] font-normal">({creator.reviewCount})</span>
                      </div>

                      <button
                        onClick={(e) => toggleFavorite(creator.id, e)}
                        className="text-[#FF4D4D] hover:scale-110 transition-transform p-0.5"
                        aria-label="Favorite"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFav ? 'fill-[#FF4D4D]' : 'stroke-[#FF4D4D] stroke-[1.8]'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Middle: Custom Portfolio Image Collages */}
                  {/* Card 1: Aman Verma (3-column landscape/portrait collage) */}
                  {creator.id === 'pro-aman' && (
                    <Link href={`/photographers/${creator.id}`} className="block">
                      <div className="grid grid-cols-12 gap-1.5 h-24 sm:h-28 rounded-xl overflow-hidden bg-[#FAF7F2]">
                        <div className="col-span-5 h-full overflow-hidden">
                          <img
                            src="/reference-assets/aman_c1.jpg"
                            alt="Aman Shoot 1"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="col-span-3 h-full overflow-hidden">
                          <img
                            src="/reference-assets/aman_c2.jpg"
                            alt="Aman Shoot 2"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="col-span-4 h-full relative overflow-hidden group">
                          <img
                            src="/reference-assets/aman_c3.jpg"
                            alt="Aman Shoot 3"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                            +12
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Card 2: Riya Sharma (Large portrait + 2 stacked + +18 overlay) */}
                  {creator.id === 'pro-riya' && (
                    <Link href={`/photographers/${creator.id}`} className="block">
                      <div className="grid grid-cols-12 gap-1.5 h-24 sm:h-28 rounded-xl overflow-hidden bg-[#FAF7F2]">
                        <div className="col-span-5 h-full overflow-hidden">
                          <img
                            src="/reference-assets/riya_c1.jpg"
                            alt="Riya Shoot 1"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="col-span-4 h-full flex flex-col gap-1.5">
                          <div className="h-1/2 overflow-hidden">
                            <img
                              src="/reference-assets/riya_c2.jpg"
                              alt="Riya Shoot 2"
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="h-1/2 overflow-hidden">
                            <img
                              src="/reference-assets/riya_c3.jpg"
                              alt="Riya Shoot 3"
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        </div>
                        <div className="col-span-3 h-full relative overflow-hidden group">
                          <img
                            src="/reference-assets/riya_c4.jpg"
                            alt="Riya Shoot 4"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                            +18
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Card 3: Karan Mehta (Large photo + 2 stacked + +15 overlay) */}
                  {creator.id === 'pro-karan' && (
                    <Link href={`/photographers/${creator.id}`} className="block group/collage">
                      <div className="grid grid-cols-12 gap-1.5 h-24 sm:h-28 rounded-xl overflow-hidden bg-[#FAF7F2]">
                        <div className="col-span-5 h-full overflow-hidden">
                          <img
                            src="/reference-assets/karan_c1.jpg"
                            alt="Karan Shoot 1"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="col-span-4 h-full flex flex-col gap-1.5">
                          <div className="h-1/2 overflow-hidden">
                            <img
                              src="/reference-assets/karan_c2.jpg"
                              alt="Karan Shoot 2"
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="h-1/2 overflow-hidden">
                            <img
                              src="/reference-assets/karan_c3.jpg"
                              alt="Karan Shoot 3"
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        </div>
                        <div className="col-span-3 h-full relative overflow-hidden group">
                          <img
                            src="/reference-assets/karan_c4.jpg"
                            alt="Karan Shoot 4"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                            +15
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Generic Creator Portfolio Preview for all other / Supabase creators */}
                  {creator.id !== 'pro-aman' && creator.id !== 'pro-riya' && creator.id !== 'pro-karan' && (
                    <Link href={`/photographers/${creator.id}`} className="block group/collage">
                      <div className="grid grid-cols-12 gap-1.5 h-24 sm:h-28 rounded-xl overflow-hidden bg-[#FAF7F2]">
                        <div className="col-span-7 h-full overflow-hidden">
                          <img
                            src={
                              (creator as any).portfolio?.[0]?.url ||
                              (creator as any).coverImageUrl ||
                              '/reference-assets/cat_portrait.jpg'
                            }
                            alt={`${creator.name} Portfolio 1`}
                            className="w-full h-full object-cover group-hover/collage:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="col-span-5 h-full relative overflow-hidden">
                          <img
                            src={
                              (creator as any).portfolio?.[1]?.url ||
                              (creator as any).secondaryCoverUrl ||
                              '/reference-assets/cat_reels.jpg'
                            }
                            alt={`${creator.name} Portfolio 2`}
                            className="w-full h-full object-cover group-hover/collage:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 hover:bg-black/20 transition-colors flex items-center justify-center text-white font-bold text-xs">
                            View Work
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Category Tag Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {creator.categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#F2ECE3] text-[#5A544D]"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom: Pricing, Availability & Direct Action Links */}
                <div className="pt-4 mt-4 border-t border-[#EBE4DA] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-[#8C847A]">
                      <span>From </span>
                      <span className="text-sm font-black text-[#1A1816]">
                        ₹{creator.startingPriceInr.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px]"> / session</span>
                    </div>

                    <div className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F6ED] text-[#1E7D46] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1E7D46]" />
                      <span>{creator.availabilityStatus}</span>
                    </div>
                  </div>

                  {/* Interactive 'View Profile' and 'Book' Links to ensure responsive clicks */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href={`/photographers/${creator.id}`}
                      className="w-full py-2 px-3 rounded-xl border border-[#D5CEC4] bg-white hover:bg-[#FAF7F2] text-[#1A1816] text-xs font-bold text-center transition-all flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <span>View Profile</span>
                      <ArrowRight className="w-3 h-3 text-[#8C847A]" />
                    </Link>
                    <Link
                      href={`/photographers/${creator.id}?book=true`}
                      className="w-full py-2 px-3 rounded-xl bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs font-bold text-center transition-all shadow-2xs"
                    >
                      <span>Book Shoot</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
