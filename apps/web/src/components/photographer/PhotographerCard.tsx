'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { getPhotographerSlug } from '@/lib/photographerSlug';

export interface PhotographerCardProps {
  photographer: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    coverImageUrl?: string | null;
    secondaryCoverUrl?: string | null;
    isVerified?: boolean;
    isAvailable?: boolean;
    availabilityStatus?: string;
    rating?: number;
    reviewCount?: number;
    locationArea?: string;
    city?: string;
    state?: string;
    bio?: string | null;
    tagline?: string | null;
    specialties?: string[];
    categories?: string[];
    startingPriceInr?: number;
    priceUnit?: string;
    slug?: string;
    portfolio?: Array<{ id?: string; url: string; title?: string }>;
    portfolioPreviews?: string[];
  };
  showBookButton?: boolean;
  onBookClick?: (photographer: any) => void;
  onViewProfileClick?: (photographer: any) => void;
  className?: string;
}

const DEFAULT_COVER = '/reference-assets/seller_banner_photographer.jpg';
const DEFAULT_AVATAR = '/reference-assets/seller_profile_aman.jpg';

export const PhotographerCard: React.FC<PhotographerCardProps> = ({
  photographer,
  showBookButton = false,
  onBookClick,
  onViewProfileClick,
  className = '',
}) => {
  const {
    id,
    name,
    avatarUrl,
    coverImageUrl,
    secondaryCoverUrl,
    isVerified = true,
    isAvailable = true,
    availabilityStatus,
    rating = 4.8,
    reviewCount = 0,
    locationArea,
    city,
    state,
    bio,
    tagline,
    specialties = [],
    categories = [],
    startingPriceInr = 2000,
    priceUnit = '/hr',
    slug,
    portfolio = [],
    portfolioPreviews = [],
  } = photographer;

  // Resolve cover image from various potential sources with valid priority
  const initialCover =
    coverImageUrl ||
    portfolioPreviews[0] ||
    portfolio[0]?.url ||
    secondaryCoverUrl ||
    DEFAULT_COVER;

  const initialAvatar = avatarUrl || DEFAULT_AVATAR;

  const [coverSrc, setCoverSrc] = useState(initialCover);
  const [avatarSrc, setAvatarSrc] = useState(initialAvatar);

  // Link always routes internally using ID or slug
  const profileSlug = slug || getPhotographerSlug(name, id);
  const profileHref = `/photographers/${id || profileSlug}`;

  // Normalize categories / specialties
  const allTags = specialties.length > 0 ? specialties : categories.length > 0 ? categories : ['Portraits', 'Reels', 'Lifestyle'];
  const displayTags = allTags.slice(0, 3);
  const remainingCount = Math.max(0, allTags.length - 3);

  // Determine availability display
  const available =
    isAvailable ||
    (availabilityStatus ? !availabilityStatus.toLowerCase().includes('unavailable') : true);

  // Location display
  const displayLocation =
    locationArea ||
    (city && state ? `${city}, ${state}` : city) ||
    'Delhi NCR, India';

  // Bio or tagline fallback
  const displayBio =
    bio ||
    tagline ||
    'Verified visual creator and professional photographer available for bookings and collaborations.';

  const handleProfileClick = (e: React.MouseEvent) => {
    if (onViewProfileClick) {
      e.preventDefault();
      onViewProfileClick(photographer);
    }
  };

  return (
    <div
      className={`bg-white rounded-3xl border border-[#E7EAEE] overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group ${className}`}
    >
      <div>
        {/* Top: 16/10 Landscape Cover Photo with Floating Badges & Overlaid Profile */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#171A1F]">
          <Link
            href={profileHref}
            onClick={handleProfileClick}
            className="block w-full h-full cursor-pointer"
          >
            <img
              src={coverSrc}
              alt={`${name} cover`}
              referrerPolicy="no-referrer"
              onError={() => {
                if (coverSrc !== DEFAULT_COVER) {
                  setCoverSrc(DEFAULT_COVER);
                }
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </Link>

          {/* Gradient Scrim for Bottom Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

          {/* Top Left Floating Badges */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-2 z-10">
            {isVerified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#14B8A6] text-[#0D0F12] shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            )}
            {available && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-[#191C22] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Available</span>
              </span>
            )}
          </div>

          {/* Top Right Rating Badge */}
          <div className="absolute top-3.5 right-3.5 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#171A1F]/90 text-white backdrop-blur-xs border border-white/10 shadow-sm">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>
                {Number(rating).toFixed(1)}{' '}
                <span className="text-[#94A3B8] font-normal">({reviewCount})</span>
              </span>
            </div>
          </div>

          {/* Bottom Edge: Avatar + Name & Location Overlaid */}
          <Link
            href={profileHref}
            onClick={handleProfileClick}
            className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center gap-3 z-10 hover:opacity-95 transition-opacity cursor-pointer"
          >
            <img
              src={avatarSrc}
              alt={name}
              referrerPolicy="no-referrer"
              onError={() => {
                if (avatarSrc !== DEFAULT_AVATAR) {
                  setAvatarSrc(DEFAULT_AVATAR);
                }
              }}
              className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md shrink-0 bg-white"
            />
            <div className="min-w-0 text-white">
              <h3 className="text-base font-bold truncate tracking-tight text-white drop-shadow-xs group-hover:text-[#99F6E4] transition-colors">
                {name}
              </h3>
              <p className="text-xs text-[#CBD5E1] flex items-center gap-1 truncate drop-shadow-xs mt-0.5">
                <MapPin className="w-3 h-3 text-[#14B8A6] shrink-0" />
                <span className="truncate">{displayLocation}</span>
              </p>
            </div>
          </Link>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs sm:text-sm text-[#64748B] line-clamp-2 leading-relaxed min-h-[2.5rem]">
            {displayBio}
          </p>

          {/* Specialty Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {displayTags.map((spec, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EFFCF8] text-[#0F766E] border border-[#99F6E4]/50"
              >
                {spec}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1F3F5] text-[#64748B]">
                +{remainingCount} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Pricing & Action */}
      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
        <div className="border-t border-[#F1F5F9] pt-4 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-[#94A3B8]">Starting from</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-base sm:text-lg font-black text-[#191C22]">
                Rs.{startingPriceInr.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-normal text-[#94A3B8]">{priceUnit}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showBookButton && onBookClick && (
              <button
                type="button"
                onClick={() => onBookClick(photographer)}
                className="py-2.5 px-3.5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
              >
                Book Shoot
              </button>
            )}

            <Link
              href={profileHref}
              onClick={handleProfileClick}
              className="py-2.5 px-4 rounded-xl bg-[#191C22] hover:bg-black text-white text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>View Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotographerCard;
