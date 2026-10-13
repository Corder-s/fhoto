'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useAuthModal } from '../auth/AuthModalContext';

export const ZomatoPopularLocations: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const LOCATIONS = [
    {
      city: 'Greater Noida',
      localities: 'Knowledge Park, Pari Chowk, Tech Zone',
      placesCount: 'Instant & Scheduled Shoots',
      param: 'Greater Noida',
    },
    {
      city: 'Noida',
      localities: 'Sector 18, Sector 62, Noida Expressway',
      placesCount: 'Verified Studio & Outdoor Shoots',
      param: 'Noida',
    },
    {
      city: 'Delhi',
      localities: 'South Delhi, Hauz Khas, Connaught Place',
      placesCount: 'Verified Creators Available',
      param: 'Delhi',
    },
    {
      city: 'Gurugram',
      localities: 'Cyber City, Golf Course Road, Sector 29',
      placesCount: 'Corporate & Creative Specialists',
      param: 'Gurugram',
    },
    {
      city: 'Ghaziabad',
      localities: 'Indirapuram, Raj Nagar Extension, Vasundhara',
      placesCount: 'Event & Family Portrait Shoots',
      param: 'Ghaziabad',
    },
    {
      city: 'Bengaluru',
      localities: 'Indiranagar, Koramangala, Whitefield',
      placesCount: 'Tech & Lifestyle Storytellers',
      param: 'Bengaluru',
    },
    {
      city: 'Mumbai',
      localities: 'Bandra, Juhu, South Mumbai',
      placesCount: 'Cinematography & Reel Creators',
      param: 'Mumbai',
    },
    {
      city: 'Chandigarh',
      localities: 'Sector 17, Sukhna Lake, Mohali',
      placesCount: 'Pre-Wedding & Portrait Shoots',
      param: 'Chandigarh',
    },
    {
      city: 'Jaipur',
      localities: 'C-Scheme, Malviya Nagar, Amer',
      placesCount: 'Heritage & Destination Visuals',
      param: 'Jaipur',
    },
  ];

  return (
    <section className="py-12 md:py-20 bg-white border-t border-[#EDE6DC]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C847A]">
            LOCAL CREATIVE HUBS
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A1816] tracking-tight">
            Popular locations for photography in and around Delhi NCR
          </h2>
          <p className="text-xs sm:text-sm text-[#665E55]">
            Explore top-rated, background-verified photographers across top shoot locations and neighborhoods.
          </p>
        </div>

        {/* 3-Column Locality Grid (Classic Zomato Pattern) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {LOCATIONS.map((loc) => {
            const locUrl = `/explore?location=${encodeURIComponent(loc.param)}`;
            return (
              <Link
                key={loc.city}
                href={locUrl}
                onClick={(e) => {
                  if (!isAuthenticated) {
                    e.preventDefault();
                    openAuthModal({
                      returnUrl: locUrl,
                      message: `Join SnapShoot to discover and book photographers in ${loc.city}.`,
                    });
                  }
                }}
                className="group bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] p-5 hover:bg-white hover:border-[#FF6E00] hover:shadow-card transition-all duration-200 flex items-center justify-between gap-4"
              >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#FF6E00] shrink-0" />
                  <h3 className="text-base font-bold text-[#1A1816] group-hover:text-[#FF6E00] transition-colors truncate">
                    {loc.city}
                  </h3>
                </div>
                <p className="text-xs text-[#8C847A] truncate">
                  {loc.localities}
                </p>
                <p className="text-[11px] font-medium text-[#665E55]">
                  {loc.placesCount}
                </p>
              </div>

              <div className="w-8 h-8 rounded-full bg-white border border-[#E0D8CD] flex items-center justify-center text-[#8C847A] group-hover:text-[#FF6E00] group-hover:border-[#FF6E00] transition-colors shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          );
        })}
        </div>
      </div>
    </section>
  );
};
