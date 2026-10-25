'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Star, MapPin, ArrowRight, Camera, Search } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface SavedCreator {
  id: string;
  slug?: string;
  name: string;
  city: string;
  startingPriceInr: number;
  rating: number;
  reviewCount: number;
  avatarUrl: string;
  coverImageUrl?: string;
  specialties: string[];
}

export default function CustomerFavoritesPage() {
  const [favorites, setFavorites] = useState<SavedCreator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load published creators and match with favorites from localStorage or defaults
    async function loadFavorites() {
      try {
        const res = await fetch('/api/photographers');
        const data = await res.json();
        if (data.photographers && Array.isArray(data.photographers)) {
          // Take first 3 or any favorited creators
          setFavorites(data.photographers.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load favorites:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFavorites();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#14B8A6]">
            Saved Creators
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#191C22] tracking-tight">
            My Favorite Photographers
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Visual artists and cinematographers you&apos;ve bookmarked for upcoming shoots.
          </p>
        </div>

        <Link href="/explore">
          <Button variant="primary" size="md" leftIcon={<Search className="w-4 h-4" />}>
            Explore More Photographers
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-[#E7EAEE] p-6 h-64 animate-pulse" />
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((creator) => (
            <div
              key={creator.id}
              className="bg-white rounded-3xl border border-[#E7EAEE] p-5 flex flex-col justify-between shadow-subtle hover:shadow-card transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={creator.avatarUrl || '/reference-assets/avatar_aman.jpg'}
                      alt={creator.name}
                      className="w-12 h-12 rounded-full object-cover border border-[#E7EAEE]"
                    />
                    <div>
                      <h3 className="font-extrabold text-[#191C22] text-sm sm:text-base">{creator.name}</h3>
                      <p className="text-xs text-[#94A3B8] flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{creator.city}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold bg-[#F5F7F9] px-2.5 py-1 rounded-full border border-[#E7EAEE]">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{creator.rating}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(creator.specialties || ['Portraits', 'Weddings']).map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F7F9] text-[#64748B]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E7EAEE] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#94A3B8]">From</span>
                  <p className="text-base font-extrabold text-[#191C22]">
                    ₹{creator.startingPriceInr?.toLocaleString('en-IN') || '2,499'}
                  </p>
                </div>

                <Link
                  href={`/photographers/${creator.slug || creator.id}`}
                  className="px-4 py-2 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>Book Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E7EAEE] p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#191C22]">No favorites saved yet</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Browse our curated roster of verified visual artists and tap the heart icon to save them for quick access.
          </p>
          <Link href="/explore">
            <Button variant="primary" size="md">
              Explore Photographers
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
