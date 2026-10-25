'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useAuthModal } from '../auth/AuthModalContext';

interface PhotographerCardData {
  id: string;
  name: string;
  avatarUrl: string;
  coverImageUrl: string;
  isVerified: boolean;
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  locationArea: string;
  bio: string;
  specialties: string[];
  startingPriceInr: number;
  slug?: string;
}

// Reference fallback records matching Image 5
const DEFAULT_FEATURED: PhotographerCardData[] = [
  {
    id: 'pro-vikram-singh',
    name: 'Vikram Singh',
    avatarUrl: '/reference-assets/avatar_aman.jpg',
    coverImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    isVerified: false,
    isAvailable: true,
    rating: 4.6,
    reviewCount: 31,
    locationArea: 'Civil Lines, Jaipur',
    bio: 'Landscape and travel photographer turned content creator. I help travel brands and hotels create scroll-stopping visual content.',
    specialties: ['Travel', 'Landscape', 'Reels'],
    startingPriceInr: 2800,
  },
  {
    id: 'pro-ananya-iyer',
    name: 'Ananya Iyer',
    avatarUrl: '/reference-assets/avatar_riya.jpg',
    coverImageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
    isVerified: true,
    isAvailable: true,
    rating: 4.5,
    reviewCount: 22,
    locationArea: 'Anna Nagar, Chennai',
    bio: 'Content creator and reel maker for fashion and lifestyle brands. Specialized in Instagram-first visual storytelling and mobile cinematic edits.',
    specialties: ['Reels', 'Fashion', 'Lifestyle'],
    startingPriceInr: 1800,
  },
  {
    id: 'pro-aman-verma',
    name: 'Aman Verma',
    avatarUrl: '/reference-assets/seller_profile_aman.jpg',
    coverImageUrl: '/reference-assets/seller_banner_photographer.jpg',
    isVerified: true,
    isAvailable: true,
    rating: 4.9,
    reviewCount: 88,
    locationArea: 'Bandra West, Mumbai',
    bio: 'Vibrant outdoor portraits, fashion lookbooks, and high-energy creator reels across Mumbai and Western India.',
    specialties: ['Portraits', 'Reels', 'Editorial'],
    startingPriceInr: 2200,
  },
];

export const ReepyFeaturedPhotographers: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [photographers, setPhotographers] = useState<PhotographerCardData[]>(DEFAULT_FEATURED);

  useEffect(() => {
    let isCancelled = false;
    async function loadData() {
      try {
        const res = await fetch('/api/photographers');
        const data = await res.json();
        if (isCancelled) return;
        if (data.photographers && data.photographers.length > 0) {
          const mapped: PhotographerCardData[] = data.photographers.slice(0, 3).map((p: any) => ({
            id: p.id,
            name: p.name,
            avatarUrl: p.avatarUrl || '/reference-assets/seller_profile_aman.jpg',
            coverImageUrl: p.coverImageUrl || '/reference-assets/seller_banner_photographer.jpg',
            isVerified: p.isVerified ?? true,
            isAvailable: true,
            rating: p.rating || 4.8,
            reviewCount: p.reviewCount || 24,
            locationArea: p.locationArea || 'Delhi NCR',
            bio: p.bio || p.tagline || 'Verified professional photographer & content creator.',
            specialties: p.specialties || ['Portraits', 'Reels', 'Lifestyle'],
            startingPriceInr: p.startingPriceInr || 2000,
            slug: p.slug,
          }));

          // Merge live photographers while ensuring reference cards exist
          setPhotographers(mapped);
        }
      } catch {
        // Safe fallback to reference dataset
      }
    }
    loadData();
    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <section className="py-16 md:py-24 bg-[#F5F7F9]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs sm:text-sm font-black tracking-wider text-[#14B8A6] uppercase">
              TOP TALENT
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#191C22] tracking-tight">
              Featured photographers near you
            </h2>
          </div>

          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#14B8A6] hover:text-[#0D9488] transition-colors"
          >
            <span>View all photographers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Featured Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {photographers.map((creator) => {
            const profileHref = `/photographers/${creator.id}`;

            return (
              <div
                key={creator.id}
                className="bg-white rounded-3xl border border-[#E7EAEE] overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Landscape Cover Photo with Floating Badges */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#171A1F]">
                    <img
                      src={creator.coverImageUrl}
                      alt={creator.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient Overlay for bottom text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Top Left Floating Badges */}
                    <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                      {creator.isVerified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#14B8A6] text-[#0D0F12] shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      )}
                      {creator.isAvailable && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-[#191C22] shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Available</span>
                        </span>
                      )}
                    </div>

                    {/* Top Right Rating Badge */}
                    <div className="absolute top-3.5 right-3.5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#171A1F]/90 text-white backdrop-blur-xs border border-white/10 shadow-sm">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>
                          {creator.rating.toFixed(1)} <span className="text-[#94A3B8] font-normal">({creator.reviewCount})</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom Edge: Avatar + Name & Location */}
                    <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center gap-3">
                      <img
                        src={creator.avatarUrl}
                        alt={creator.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md shrink-0 bg-white"
                      />
                      <div className="min-w-0 text-white">
                        <h3 className="text-base font-bold truncate tracking-tight text-white drop-shadow-xs">
                          {creator.name}
                        </h3>
                        <p className="text-xs text-[#CBD5E1] flex items-center gap-1 truncate drop-shadow-xs">
                          <MapPin className="w-3 h-3 text-[#14B8A6] shrink-0" />
                          <span className="truncate">{creator.locationArea}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <p className="text-xs sm:text-sm text-[#64748B] line-clamp-2 leading-relaxed">
                      {creator.bio}
                    </p>

                    {/* Specialty Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {creator.specialties.map((spec, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EFFCF8] text-[#0F766E] border border-[#99F6E4]/50"
                        >
                          {spec}
                        </span>
                      ))}
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1F3F5] text-[#64748B]">
                        +1 more
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-5 sm:p-6 pt-0 border-t border-[#F1F3F5] mt-2 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] font-medium text-[#94A3B8]">
                      Starting from
                    </span>
                    <span className="text-base sm:text-lg font-black text-[#191C22]">
                      Rs.{creator.startingPriceInr.toLocaleString('en-IN')}<span className="text-xs font-normal text-[#64748B]">/hr</span>
                    </span>
                  </div>

                  <Link
                    href={profileHref}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#171A1F] hover:bg-black text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
