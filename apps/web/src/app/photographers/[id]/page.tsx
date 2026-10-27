'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import {
  Star,
  MapPin,
  CheckCircle2,
  Clock,
  Wrench,
  Languages,
  Instagram,
  Camera,
  Calendar,
  X,
  Share2,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
  ImageIcon,
} from 'lucide-react';
import type { SamplePhotographer, PhotographerServicePackage } from '../../../data/photographers';
import { Button } from '../../../components/ui/Button';
import { PortfolioLightbox } from '../../../components/gallery/PortfolioLightbox';
import { BookingModal } from '../../../components/booking/BookingModal';
import { useAuth } from '../../../lib/auth';
import { useAuthModal } from '../../../components/auth/AuthModalContext';
import { useCurrentUserProfile } from '../../../context/UserProfileContext';

const DEFAULT_COVER = '/reference-assets/seller_banner_photographer.jpg';
const DEFAULT_AVATAR = '/reference-assets/seller_profile_aman.jpg';

function getInitials(name: string): string {
  if (!name) return 'P';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PhotographerProfileInner({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldAutoBook = searchParams?.get('book') === 'true';
  const tabParam = searchParams?.get('tab');

  const [creator, setCreator] = useState<SamplePhotographer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active Profile Tab
  const [activeTab, setActiveTab] = useState<'portfolio' | 'reviews' | 'book'>(
    shouldAutoBook ? 'book' : (tabParam === 'reviews' || tabParam === 'book' ? tabParam : 'portfolio')
  );

  // Cover & Avatar state with fallbacks
  const [coverSrc, setCoverSrc] = useState<string>(DEFAULT_COVER);
  const [avatarSrc, setAvatarSrc] = useState<string>(DEFAULT_AVATAR);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PhotographerServicePackage | null>(null);

  const { user, isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { uploadAvatar } = useCurrentUserProfile();

  // Copy Profile Link Toast State
  const [copiedToast, setCopiedToast] = useState(false);

  // Avatar upload and fallback state
  const [avatarError, setAvatarError] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarToast, setAvatarToast] = useState<string | null>(null);
  const avatarInputRef = React.useRef<HTMLInputElement | null>(null);

  // Banner upload state
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const bannerInputRef = React.useRef<HTMLInputElement | null>(null);

  const isOwner = Boolean(
    user &&
    creator &&
    ((creator as any).userId === user.id || creator.id === user.id)
  );

  useEffect(() => {
    let isMounted = true;
    async function loadCreator() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/photographers?id=${encodeURIComponent(params.id)}`);
        const data = await res.json();
        if (isMounted && data.photographers && data.photographers.length > 0) {
          const cp = data.photographers[0];

          let rawPackages = cp.services || [];
          if (rawPackages.length === 0) {
            try {
              const srvRes = await fetch(`/api/photographers/services?creatorId=${encodeURIComponent(params.id)}`);
              if (srvRes.ok) {
                const srvData = await srvRes.json();
                if (srvData.services && srvData.services.length > 0) {
                  rawPackages = srvData.services.map((s: any) => ({
                    id: s.id,
                    name: s.title,
                    description: s.description,
                    priceInr: Number(s.base_price),
                    durationMinutes: s.duration_minutes,
                    deliveryHours: s.delivery_time_hours || 48,
                  }));
                }
              }
            } catch {
              // ignore
            }
          }

          // If no services registered in DB yet, construct default realistic packages based on starting price
          const startingPrice = Number(cp.startingPriceInr) || 2000;
          const servicePackages: PhotographerServicePackage[] = rawPackages.length > 0
            ? rawPackages.map((s: any, idx: number) => {
                const desc = s.description || '';
                const lines = desc.split('\n').map((l: string) => l.trim()).filter(Boolean);
                const features = lines.length > 0 ? lines : [
                  'Full commercial & personal usage rights',
                  'High-resolution master color-graded JPEGs',
                  'Direct cloud delivery via private client gallery',
                ];

                const durHours = s.durationMinutes ? Math.max(1, Math.round(s.durationMinutes / 60)) : 1;
                return {
                  id: s.id,
                  name: s.name,
                  priceInr: s.priceInr,
                  duration: `${durHours} Hour${durHours > 1 ? 's' : ''}`,
                  photos: desc || '30-40 color-graded frames',
                  turnaround: `${s.deliveryHours || 48} Hours`,
                  isPopular: idx === 0,
                  features,
                };
              })
            : [
                {
                  id: 'standard-session',
                  name: 'Standard Portrait / Reels Shoot',
                  priceInr: startingPrice,
                  duration: '2 Hours',
                  photos: '30-40 color-graded frames',
                  turnaround: '48 Hours',
                  isPopular: true,
                  features: [
                    'Full commercial & personal usage rights',
                    '30-40 high-resolution color-graded master JPEGs',
                    'Direct cloud delivery via private client gallery',
                    'Verified Shoot-Start OTP handshake included',
                  ],
                },
                {
                  id: 'extended-session',
                  name: 'Half-Day Editorial & Lifestyle',
                  priceInr: Math.round(startingPrice * 1.8),
                  duration: '4 Hours',
                  photos: '60-80 color-graded frames',
                  turnaround: '48 Hours',
                  isPopular: false,
                  features: [
                    'Multi-location coverage within city limits',
                    '60-80 high-resolution master JPEGs',
                    'Cinematic reel footage (raw + color graded)',
                    'Full commercial usage rights & platform escrow',
                  ],
                },
              ];

          const portfolioItems = (cp.portfolio || []).map((p: any) => ({
            id: p.id,
            url: p.url,
            title: p.title || 'Creative Portfolio Staging',
            category: p.mediaType || 'Portraits',
          }));

          const resolvedCover = cp.coverImageUrl || portfolioItems[0]?.url || DEFAULT_COVER;
          const resolvedAvatar = cp.avatarUrl || DEFAULT_AVATAR;

          const mapped: SamplePhotographer = {
            id: cp.id,
            name: cp.name,
            tagline: cp.tagline || 'Verified Professional Creative Specialist',
            avatarUrl: resolvedAvatar,
            coverImageUrl: resolvedCover,
            isVerified: cp.isVerified,
            locationCity: cp.city || 'Delhi NCR',
            locationArea: cp.locationArea || `${cp.city || 'Delhi NCR'}, India`,
            rating: Number(cp.rating) || 5.0,
            reviewCount: Number(cp.reviewCount) || 0,
            categories: cp.specialties || ['Portraits', 'Events'],
            startingPriceInr: startingPrice,
            availabilityStatus: cp.availabilityStatus || 'Available today',
            experienceYears: cp.experienceYears || 5,
            cameraGear: cp.cameraGear || 'Sony A7IV, DJI RS3 Gimbal, 24-70mm f/2.8, 50mm Prime',
            specialties: cp.specialties || ['Portraits', 'Events', 'Reels'],
            bio: cp.bio || 'Reel specialist and content creator crafting viral visual content. I help brands and individuals produce scroll-stopping reels and lifestyle photography.',
            portfolioPreviews: portfolioItems.map((p: any) => p.url).slice(0, 4),
            fullPortfolio: portfolioItems,
            servicePackages,
            reviews: [],
          };
          (mapped as any).userId = cp.userId || cp.user_id;
          (mapped as any).slug = cp.slug;
          setCreator(mapped);
          setCoverSrc(resolvedCover);
          setAvatarSrc(resolvedAvatar);

          if (shouldAutoBook && servicePackages.length > 0) {
            setSelectedPackage(servicePackages[0]);
            setBookingModalOpen(true);
          }
        }
      } catch (err) {
        console.error('Failed to load creator profile:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadCreator();
    return () => {
      isMounted = false;
    };
  }, [params.id, shouldAutoBook]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setAvatarToast(null);

    try {
      const res = await uploadAvatar(file);
      if (res.success && res.url) {
        const uploadedAvatarUrl: string = res.url;
        setCreator((prev) => (prev ? { ...prev, avatarUrl: uploadedAvatarUrl } : prev));
        setAvatarSrc(uploadedAvatarUrl);
        setAvatarError(false);
        setAvatarToast('Profile photo updated successfully!');
        setTimeout(() => setAvatarToast(null), 4000);
      } else {
        setAvatarToast(res.error || 'Failed to upload photo.');
        setTimeout(() => setAvatarToast(null), 5000);
      }
    } catch (err: any) {
      setAvatarToast(err.message || 'Error uploading photo.');
      setTimeout(() => setAvatarToast(null), 5000);
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/photographers/banner', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success && data.bannerUrl) {
        setCreator((prev) => (prev ? { ...prev, coverImageUrl: data.bannerUrl } : prev));
        setCoverSrc(data.bannerUrl);
        setAvatarToast('Cover banner updated successfully!');
        setTimeout(() => setAvatarToast(null), 4000);
      }
    } catch {
      setAvatarToast('Failed to update cover banner.');
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/explore');
    }
  };

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleInitiateBooking = (pkg: PhotographerServicePackage) => {
    if (!isAuthenticated) {
      openAuthModal({
        returnUrl: `/photographers/${params.id}?book=true`,
        message: `Please sign in or create an account to book ${creator?.name}.`,
      });
      return;
    }
    setSelectedPackage(pkg);
    setBookingModalOpen(true);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  };

  // LOADING SKELETON
  if (isLoading && !creator) {
    return (
      <>
        <Navbar />
        <main className="flex-1 bg-[#F5F7F9] py-24 min-h-[60vh] flex items-center justify-center">
          <div className="max-w-md mx-auto text-center px-4 space-y-3">
            <div className="w-10 h-10 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-[#64748B]">Loading verified photographer profile...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // 404 NOT FOUND STATE FOR UNKNOWN IDS
  if (!creator) {
    return (
      <>
        <Navbar />
        <main className="flex-1 bg-[#F5F7F9] py-20 min-h-[60vh] flex items-center justify-center">
          <div className="max-w-md mx-auto text-center px-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-[#191C22]">Photographer Not Found</h1>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              We couldn&apos;t find a visual artist with the identifier &ldquo;{params.id}&rdquo;. They may have updated their profile handle.
            </p>
            <div className="pt-2">
              <Link href="/explore">
                <Button variant="primary" size="md" className="bg-[#14B8A6] hover:bg-[#0D9488]">
                  Explore All Verified Photographers
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const instagramHandle =
    (creator as any).slug?.replace(/^pro-/, '') ||
    creator.name.toLowerCase().replace(/\s+/g, '.');

  return (
    <>
      <Navbar />

      {/* Role Context Bar: Shows Client vs Creator context */}
      {isAuthenticated && (
        <div className="bg-[#FAF7F2] border-b border-[#E8E1D6] py-2 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            {user?.role === 'customer' ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-[#E7F6ED] text-[#1E7D46] border border-[#C5E8D2] text-[10px]">
                    Client Session: {user?.name || 'Customer'}
                  </span>
                  <span className="text-[#5A544D]">
                    You are browsing photographer <strong>{creator.name}</strong>&apos;s verified booking profile.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/customer/dashboard" className="text-[#5A544D] hover:text-[#1A1816] font-semibold underline">
                    ← Back to Dashboard
                  </Link>
                  <Link href="/explore" className="text-[#14B8A6] hover:text-[#0D9488] font-bold">
                    Explore More →
                  </Link>
                </div>
              </>
            ) : isOwner ? (
              <>
                <span className="text-[#14B8A6] font-bold">
                  ✨ You are viewing your public client-facing creator profile page.
                </span>
                <Link
                  href="/photographer/dashboard"
                  className="px-3.5 py-1 rounded-full bg-[#14B8A6] text-white font-bold text-xs hover:bg-[#0D9488] transition-colors"
                >
                  Manage in Studio Dashboard →
                </Link>
              </>
            ) : (
              <>
                <span className="text-[#5A544D]">
                  Viewing verified creator profile: <strong>{creator.name}</strong>
                </span>
                <Link href="/explore" className="text-[#14B8A6] font-bold">
                  ← Explore All Photographers
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 bg-[#F8FAFC] pb-24">
        {/* ========================================================= */}
        {/* HERO SECTION (MATCHING SCREENSHOT 3)                      */}
        {/* ========================================================= */}
        <div className="relative w-full h-72 sm:h-84 md:h-96 bg-[#171A1F] overflow-hidden group">
          {/* Top Right Close 'X' Button (matches Screenshot 3) */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 z-30 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-all cursor-pointer shadow-md"
            aria-label="Back to exploration"
            title="Close profile"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Full-Width Cover Banner */}
          <img
            src={coverSrc}
            alt={`${creator.name} cover`}
            referrerPolicy="no-referrer"
            onError={() => {
              if (coverSrc !== DEFAULT_COVER) setCoverSrc(DEFAULT_COVER);
            }}
            className="w-full h-full object-cover"
          />

          {/* Dark Gradient Overlay for optimal legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15 pointer-events-none" />

          {/* Owner Banner Upload Trigger */}
          {isOwner && (
            <div className="absolute right-4 bottom-4 z-20">
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerFileChange}
                id="owner-banner-input"
              />
              <label htmlFor="owner-banner-input">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 backdrop-blur-xs text-xs font-bold shadow-md hover:bg-white cursor-pointer"
                  disabled={isUploadingBanner}
                  leftIcon={<Camera className="w-3.5 h-3.5 text-[#14B8A6]" />}
                >
                  {isUploadingBanner ? 'Updating...' : 'Change Cover Banner'}
                </Button>
              </label>
            </div>
          )}

          {/* Bottom Overlay: Avatar, Name, Verified Badge, Rating, Location */}
          <div className="absolute bottom-6 left-4 sm:left-8 right-4 sm:right-8 flex items-center gap-4 sm:gap-6 z-20">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-white border-2 border-white/90 shadow-2xl shrink-0 flex items-center justify-center relative">
                {avatarSrc && !avatarError ? (
                  <img
                    src={avatarSrc}
                    alt={creator.name}
                    referrerPolicy="no-referrer"
                    onError={() => {
                      if (avatarSrc !== DEFAULT_AVATAR) setAvatarSrc(DEFAULT_AVATAR);
                      else setAvatarError(true);
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#14B8A6] to-emerald-600 text-white flex items-center justify-center text-2xl sm:text-3xl font-black select-none tracking-tight">
                    {getInitials(creator.name)}
                  </div>
                )}

                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-xs">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-[9px] font-bold mt-1">Uploading...</span>
                  </div>
                )}
              </div>

              {isOwner && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-full shadow-md border border-white transition-all transform hover:scale-105 cursor-pointer disabled:opacity-50"
                    title="Change profile photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* Name, Verified Badge, Rating, Location */}
            <div className="min-w-0 text-white space-y-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">
                  {creator.name}
                </h1>
                {creator.isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#14B8A6] text-[#0D0F12] shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/80 text-white shadow-sm border border-amber-400/40 backdrop-blur-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Verification Pending</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-200">
                <div className="flex items-center gap-1 font-bold text-white">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{creator.rating.toFixed(1)}</span>
                  <span className="text-slate-300 font-normal">({creator.reviewCount} reviews)</span>
                </div>

                <span>•</span>

                <div className="flex items-center gap-1 text-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
                  <span>{creator.locationArea}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PROFILE TABS NAVIGATION (MATCHING SCREENSHOT 3)           */}
        {/* ========================================================= */}
        <div className="bg-white border-b border-[#E2E8F0] sticky top-0 z-20 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <nav className="flex items-center gap-8 sm:gap-12" aria-label="Profile Sections">
              <button
                type="button"
                onClick={() => setActiveTab('portfolio')}
                className={`py-4 flex items-center gap-2 text-sm sm:text-base font-bold transition-all cursor-pointer border-b-2 ${
                  activeTab === 'portfolio'
                    ? 'border-[#14B8A6] text-[#14B8A6]'
                    : 'border-transparent text-[#64748B] hover:text-[#191C22]'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Portfolio</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`py-4 flex items-center gap-2 text-sm sm:text-base font-bold transition-all cursor-pointer border-b-2 ${
                  activeTab === 'reviews'
                    ? 'border-[#14B8A6] text-[#14B8A6]'
                    : 'border-transparent text-[#64748B] hover:text-[#191C22]'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>Reviews ({creator.reviews.length || creator.reviewCount || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('book')}
                className={`py-4 flex items-center gap-2 text-sm sm:text-base font-bold transition-all cursor-pointer border-b-2 ${
                  activeTab === 'book'
                    ? 'border-[#14B8A6] text-[#14B8A6]'
                    : 'border-transparent text-[#64748B] hover:text-[#191C22]'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Book Now</span>
              </button>
            </nav>

            {/* Quick Share action button */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold text-[#191C22] transition-colors cursor-pointer"
              >
                {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-[#64748B]" />}
                <span>{copiedToast ? 'Link Copied!' : 'Share Profile'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('book')}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>Book Shoot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB CONTENTS                                              */}
        {/* ========================================================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
          {/* TAB 1: PORTFOLIO & ABOUT (SCREENSHOT 3 VIEW) */}
          {activeTab === 'portfolio' && (
            <div className="space-y-10">
              {/* ABOUT SECTION (EXACT SCREENSHOT 3 LAYOUT) */}
              <section className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#191C22] tracking-tight">
                    About
                  </h2>
                  <p className="text-sm sm:text-base text-[#64748B] leading-relaxed mt-2.5 max-w-4xl">
                    {creator.bio}
                  </p>
                </div>

                {/* 4 Metadata Cards in 2x2 Grid (Screenshot 3 Reference) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* 1. Experience Card */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E7EAEE] flex items-center gap-4 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="w-11 h-11 rounded-xl bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#94A3B8]">Experience</p>
                      <p className="text-sm sm:text-base font-bold text-[#191C22] truncate">
                        {creator.experienceYears} years
                      </p>
                    </div>
                  </div>

                  {/* 2. Equipment Card */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E7EAEE] flex items-center gap-4 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="w-11 h-11 rounded-xl bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center shrink-0">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#94A3B8]">Equipment</p>
                      <p className="text-sm sm:text-base font-bold text-[#191C22] truncate" title={creator.cameraGear}>
                        {creator.cameraGear}
                      </p>
                    </div>
                  </div>

                  {/* 3. Languages Card */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E7EAEE] flex items-center gap-4 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="w-11 h-11 rounded-xl bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center shrink-0">
                      <Languages className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#94A3B8]">Languages</p>
                      <p className="text-sm sm:text-base font-bold text-[#191C22] truncate">
                        Hindi, English, Marathi
                      </p>
                    </div>
                  </div>

                  {/* 4. Instagram Card */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E7EAEE] flex items-center gap-4 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="w-11 h-11 rounded-xl bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center shrink-0">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#94A3B8]">Instagram</p>
                      <p className="text-sm sm:text-base font-bold text-[#191C22] truncate">
                        @{instagramHandle}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* PORTFOLIO GALLERY GRID */}
              <section className="space-y-4 pt-4 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-[#191C22] tracking-tight">
                      Portfolio Gallery
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Click any photo to view in high resolution lightbox
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#14B8A6]">
                    {creator.fullPortfolio.length} Photographs
                  </span>
                </div>

                {creator.fullPortfolio.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#E2E8F0] p-6 space-y-2">
                    <ImageIcon className="w-8 h-8 text-[#94A3B8] mx-auto" />
                    <p className="text-sm font-semibold text-[#191C22]">No Portfolio Photos Uploaded Yet</p>
                    <p className="text-xs text-[#94A3B8]">
                      This photographer hasn&apos;t published any gallery photos yet. Check back soon.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {creator.fullPortfolio.map((img, index) => (
                      <div
                        key={img.id}
                        onClick={() => handleOpenLightbox(index)}
                        className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#F1F3F5] cursor-pointer shadow-2xs border border-[#E7EAEE] hover:shadow-md transition-all"
                      >
                        <img
                          src={img.url}
                          alt={img.title}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_COVER;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3 text-white text-center">
                          <div>
                            <p className="text-xs font-bold">{img.title}</p>
                            <span className="text-[10px] text-gray-300 uppercase tracking-wider">
                              {img.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 2: CUSTOMER REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#E2E8F0] pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#191C22] tracking-tight">
                    Customer Reviews
                  </h2>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                    Verified feedback from clients who booked shoots with {creator.name}
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-[#E7EAEE]">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="text-base font-black text-[#191C22]">{creator.rating.toFixed(1)}</span>
                  <span className="text-xs text-[#94A3B8]">({creator.reviewCount} total reviews)</span>
                </div>
              </div>

              {creator.reviews.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-[#E2E8F0] p-8 space-y-3 max-w-lg mx-auto my-8">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                    <Star className="w-6 h-6 fill-amber-500" />
                  </div>
                  <h3 className="text-base font-bold text-[#191C22]">No Reviews Yet</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    This photographer does not have any customer reviews yet. Book a session to be the first to share your experience!
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('book')}
                      className="px-5 py-2.5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Book Shoot with {creator.name}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {creator.reviews.map((rev) => (
                    <div key={rev.id} className="bg-white rounded-2xl border border-[#E7EAEE] p-6 space-y-3 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-[#191C22]">{rev.clientName}</h3>
                          <p className="text-xs text-[#94A3B8]">
                            {rev.clientLocation} • {rev.sessionType}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                          <Star className="w-4 h-4 fill-amber-500" />
                          <span>{rev.rating}.0</span>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                      <p className="text-[10px] text-[#94A3B8] pt-2 border-t border-[#F1F5F9]">
                        Delivered on {rev.date} via REEPY Escrow
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BOOK NOW & PRICING */}
          {activeTab === 'book' && (
            <div className="space-y-6">
              <div className="border-b border-[#E2E8F0] pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#191C22] tracking-tight">
                  Book a Shoot with {creator.name}
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                  Choose a service package to initiate your shoot with verified Shoot-Start OTP & 100% escrow protection.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creator.servicePackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`bg-white rounded-3xl border p-6 flex flex-col justify-between relative shadow-xs hover:shadow-lg transition-all ${
                      pkg.isPopular ? 'border-[#14B8A6] ring-2 ring-[#14B8A6]/20' : 'border-[#E7EAEE]'
                    }`}
                  >
                    {pkg.isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#14B8A6] text-white shadow-xs">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-[#191C22]">{pkg.name}</h3>
                        <p className="text-2xl font-black text-[#191C22] mt-1">
                          ₹{pkg.priceInr.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">
                          {pkg.duration} shoot • {pkg.turnaround} turnaround
                        </p>
                      </div>

                      {pkg.photos && (
                        <p className="text-xs text-[#64748B] leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border border-[#F1F5F9]">
                          {pkg.photos}
                        </p>
                      )}

                      <ul className="space-y-2.5 text-xs text-[#64748B] pt-2 border-t border-[#F1F5F9]">
                        {pkg.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6 mt-6 border-t border-[#F1F5F9]">
                      <button
                        type="button"
                        onClick={() => handleInitiateBooking(pkg)}
                        className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
                          pkg.isPopular
                            ? 'bg-[#14B8A6] hover:bg-[#0D9488] text-white'
                            : 'bg-[#191C22] hover:bg-black text-white'
                        }`}
                      >
                        Book {pkg.name}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Escrow and Protection Guarantee */}
              <div className="p-6 bg-white rounded-2xl border border-[#E7EAEE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-8 shadow-2xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#14B8A6]" />
                    <h3 className="text-sm font-bold text-[#191C22]">
                      REEPY Escrow & Cancellation Guarantee
                    </h3>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    100% full refund up to 24 hours before shoot. Funds held safely in platform escrow until you approve the delivered photos.
                  </p>
                </div>
                <Link href="/cancellation" className="text-xs font-bold text-[#14B8A6] hover:underline shrink-0">
                  Read Refund Policy →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* PORTFOLIO LIGHTBOX PREVIEW */}
      <PortfolioLightbox
        images={creator.fullPortfolio}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onSelectIndex={(idx) => setLightboxIndex(idx)}
      />

      {/* BOOKING MODAL */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        photographerName={creator.name}
        creatorId={creator.id}
        selectedPackage={selectedPackage}
      />
    </>
  );
}

export default function PhotographerProfilePage({ params }: { params: { id: string } }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F7F9] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PhotographerProfileInner params={params} />
    </Suspense>
  );
}
