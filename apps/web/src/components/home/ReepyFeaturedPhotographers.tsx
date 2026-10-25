'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useAuthModal } from '../auth/AuthModalContext';
import { PhotographerCard } from '../photographer/PhotographerCard';
import { PhotographerProfileModal } from '../photographer/PhotographerProfileModal';

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
  const [selectedModalPhotographerId, setSelectedModalPhotographerId] = useState<string | null>(null);

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
          {photographers.map((creator) => (
            <PhotographerCard
              key={creator.id}
              photographer={creator}
              onViewProfileClick={(p) => setSelectedModalPhotographerId(p.id)}
            />
          ))}
        </div>

        {/* Profile Modal */}
        <PhotographerProfileModal
          isOpen={!!selectedModalPhotographerId}
          photographerId={selectedModalPhotographerId}
          onClose={() => setSelectedModalPhotographerId(null)}
        />
      </div>
    </section>
  );
};
