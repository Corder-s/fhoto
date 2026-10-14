'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { 
  Star, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Camera, 
  ArrowRight,
  Share2,
  Calendar,
  AlertCircle,
  Eye,
  Check,
  Loader2
} from 'lucide-react';
// Only database-backed photographers are rendered here; the sample list is not a
// fallback, so a pending or rejected profile cannot appear through a deep link.
import type { SamplePhotographer, PhotographerServicePackage } from '../../../data/photographers';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { PortfolioLightbox } from '../../../components/gallery/PortfolioLightbox';
import { BookingModal } from '../../../components/booking/BookingModal';
import { useAuth } from '../../../lib/auth';
import { useAuthModal } from '../../../components/auth/AuthModalContext';
import { useCurrentUserProfile } from '../../../context/UserProfileContext';

function getInitials(name: string): string {
  if (!name) return 'P';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PhotographerProfileInner({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const shouldAutoBook = searchParams?.get('book') === 'true';

  const [creator, setCreator] = useState<SamplePhotographer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadCreator() {
      try {
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

          const servicePackages: PhotographerServicePackage[] = rawPackages.length > 0
            ? rawPackages.map((s: any, idx: number) => {
                const desc = s.description || '';
                const lines = desc.split('\n').map((l: string) => l.trim()).filter(Boolean);
                const features = lines.length > 0 ? lines : [
                  'Full commercial usage rights',
                  'High-resolution master JPEGs',
                  'Direct cloud delivery via private gallery',
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
            : [];

          const mapped: SamplePhotographer = {
            id: cp.id,
            name: cp.name,
            tagline: cp.tagline || 'Verified Professional Creative Specialist',
            avatarUrl: cp.avatarUrl || '/reference-assets/avatar_aman.jpg',
            coverImageUrl: cp.coverImageUrl || '/reference-assets/hero_scene.jpg',
            isVerified: cp.isVerified,
            locationCity: cp.city || 'Delhi NCR',
            locationArea: cp.locationArea || `${cp.city}, India`,
            rating: cp.rating || 5.0,
            reviewCount: cp.reviewCount || 0,
            categories: cp.specialties || ['Portraits', 'Events'],
            startingPriceInr: cp.startingPriceInr || 2499,
            availabilityStatus: cp.availabilityStatus || 'Available today',
            experienceYears: cp.experienceYears || 5,
            cameraGear: 'Professional Full-Frame Rig • Prime Lenses • Portable Studio Strobes',
            specialties: cp.specialties || ['Portraits', 'Events', 'Reels'],
            bio: cp.bio || 'Verified professional photographer available for instant and scheduled bookings.',
            portfolioPreviews: (cp.portfolio || []).map((p: any) => p.url).slice(0, 4),
            fullPortfolio: (cp.portfolio || []).map((p: any) => ({
              id: p.id,
              url: p.url,
              title: p.title || 'Creative Portfolio Staging',
              category: p.mediaType || 'Portraits',
            })),
            servicePackages,
            reviews: [],
          };
          (mapped as any).userId = cp.userId || cp.user_id;
          (mapped as any).slug = cp.slug;
          setCreator(mapped);
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

  const isOwner = Boolean(
    user &&
    creator &&
    ((creator as any).userId === user.id || creator.id === user.id)
  );

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

  // LOADING SKELETON
  if (isLoading && !creator) {
    return (
      <>
        <Navbar />
        <main className="flex-1 bg-canvas-primary py-24">
          <div className="max-w-md mx-auto text-center px-4 space-y-3">
            <div className="w-10 h-10 border-4 border-[#FF6E00] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-ink-muted">Loading verified artist profile...</p>
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
        <main className="flex-1 bg-canvas-primary py-20">
          <div className="max-w-md mx-auto text-center px-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-ink-primary">Photographer Not Found</h1>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              We couldn&apos;t find a visual artist with the ID &ldquo;{params.id}&rdquo;. They may have moved or updated their profile handle.
            </p>
            <div className="pt-2">
              <Link href="/explore">
                <Button variant="primary" size="md">
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

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleInitiateBooking = (pkg: PhotographerServicePackage) => {
    if (!isAuthenticated) {
      openAuthModal({
        returnUrl: `/photographers/${params.id}`,
        message: `Please sign in or create an account to book ${creator.name}.`,
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

  return (
    <>
      <Navbar />

      {/* Role Context Bar: Distinguishes Client vs Creator on Photographer Pages */}
      {isAuthenticated && (
        <div className="bg-[#FAF7F2] border-b border-[#E8E1D6] py-2.5 px-4 sm:px-6">
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
                  <Link href="/customer/settings" className="text-[#FF6E00] hover:text-[#E86300] font-bold">
                    My Client Profile →
                  </Link>
                </div>
              </>
            ) : user?.id === (creator as any).userId || user?.id === creator.id ? (
              <>
                <span className="text-[#FF6E00] font-bold">
                  ✨ You are viewing your public client-facing creator profile page.
                </span>
                <Link
                  href="/photographer/dashboard"
                  className="px-3.5 py-1 rounded-full bg-[#FF6E00] text-white font-bold text-xs hover:bg-[#E86300] transition-colors"
                >
                  Manage in Studio Dashboard →
                </Link>
              </>
            ) : (
              <>
                <span className="text-[#5A544D]">
                  Viewing verified creator profile: <strong>{creator.name}</strong>
                </span>
                <Link href="/explore" className="text-[#FF6E00] font-bold">
                  ← Explore All Photographers
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 bg-canvas-primary pb-20">
        {/* HERO PORTFOLIO COVER IMAGE */}
        <div className="relative h-64 sm:h-80 md:h-96 w-full bg-canvas-secondary overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={creator.coverImageUrl}
            alt={`${creator.name} cover`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 space-y-10">
          {/* PROFILE CARD */}
          <div className="bg-white rounded-card-lg border border-contour-subtle shadow-card p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
              {/* Avatar + Main Details */}
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-canvas-secondary border-4 border-white shadow-md shrink-0 flex items-center justify-center relative">
                    {creator.avatarUrl && !avatarError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={creator.avatarUrl}
                        alt={creator.name}
                        className="w-full h-full object-cover"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-[#FF6E00] to-amber-500 text-white flex items-center justify-center text-3xl sm:text-4xl font-black select-none tracking-tight">
                        {getInitials(creator.name)}
                      </div>
                    )}

                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-xs">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-[10px] font-bold mt-1">Uploading...</span>
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
                        className="absolute bottom-0 right-0 p-2 sm:p-2.5 bg-[#FF6E00] hover:bg-[#e06100] text-white rounded-full shadow-lg border-2 border-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                        title="Upload / Change profile photo"
                      >
                        <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
                      {creator.name}
                    </h1>
                    {creator.isVerified && (
                      <span title="Government ID & Portfolio Authenticity Verified">
                        <CheckCircle2 className="w-5 h-5 text-brand fill-brand-subtle shrink-0" />
                      </span>
                    )}
                    <Badge variant="brand" size="sm">
                      Verified Artist
                    </Badge>
                  </div>

                  <p className="text-xs sm:text-sm text-ink-muted flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand shrink-0" />
                    <span>{creator.locationArea} • Base City: {creator.locationCity}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm font-semibold text-ink-primary pt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>{creator.rating}</span>
                      <span className="text-ink-muted font-normal">({creator.reviewCount} reviews)</span>
                    </div>
                    <span>•</span>
                    <span className="text-ink-secondary">{creator.experienceYears} Years Experience</span>
                    <span>•</span>
                    <Badge variant="success" size="sm">
                      {creator.availabilityStatus}
                    </Badge>
                  </div>

                  {isOwner && (
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-brand bg-brand-subtle hover:bg-brand/20 transition-colors border border-brand-border cursor-pointer disabled:opacity-50"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{creator.avatarUrl && !avatarError ? 'Change Profile Picture' : 'Upload Profile Picture'}</span>
                      </button>

                      {avatarToast && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md inline-flex items-center gap-1 animate-fadeIn">
                          <Check className="w-3 h-3" />
                          {avatarToast}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 lg:pt-0">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleShare}
                  leftIcon={copiedToast ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
                >
                  {copiedToast ? 'Link Copied!' : 'Share'}
                </Button>

                <a href="#packages">
                  <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    View Packages
                  </Button>
                </a>
              </div>
            </div>

            {/* Bio & Specialties Grid */}
            <div className="mt-8 pt-6 border-t border-contour-subtle grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Professional Biography
                </h2>
                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                  {creator.bio}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                    Specialties
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {creator.specialties.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded-card-sm text-xs font-semibold bg-canvas-primary text-ink-primary border border-contour-subtle"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                    Equipment Information
                  </h2>
                  <p className="text-xs text-ink-secondary font-medium">
                    {creator.cameraGear}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* PORTFOLIO GALLERY SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-brand">
                  Visual Proof of Quality
                </span>
                <h2 className="text-2xl font-extrabold text-ink-primary">Portfolio Gallery</h2>
              </div>
              <span className="text-xs text-ink-muted font-medium">
                Click any photograph to view in full resolution
              </span>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
              {creator.fullPortfolio.map((img, index) => (
                <div
                  key={img.id}
                  onClick={() => handleOpenLightbox(index)}
                  className="group relative aspect-[4/3] rounded-card-sm overflow-hidden bg-canvas-secondary cursor-pointer shadow-subtle border border-contour-subtle"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.title}
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
          </div>

          {/* SERVICE PACKAGES & PRICING */}
          <div id="packages" className="space-y-6 pt-6">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-brand">
                Transparent Pricing
              </span>
              <h2 className="text-2xl font-extrabold text-ink-primary">
                Service Packages & Deliverables
              </h2>
              <p className="text-xs sm:text-sm text-ink-secondary mt-1">
                All packages include verified Shoot-Start OTP handshake & 100% platform escrow protection.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {creator.servicePackages.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-white border border-dashed border-contour-subtle rounded-card-md p-8 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-ink-primary">No Service Packages Published Yet</h3>
                  <p className="text-xs text-ink-muted max-w-sm mx-auto">
                    This creative specialist hasn&apos;t published any custom booking packages yet. Check back soon or contact support for custom shoot requests.
                  </p>
                </div>
              ) : (
                creator.servicePackages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    hoverEffect
                    className={`flex flex-col justify-between relative ${
                      pkg.isPopular ? 'border-brand ring-1 ring-brand' : ''
                    }`}
                  >
                    {pkg.isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="brand" size="sm">
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-ink-primary">{pkg.name}</h3>
                        <p className="text-2xl font-black text-brand mt-1">
                          ₹{pkg.priceInr.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {pkg.duration} shoot • {pkg.turnaround} turnaround
                        </p>
                      </div>

                      {pkg.photos && (
                        <p className="text-xs text-ink-secondary leading-relaxed bg-canvas-secondary/60 p-2.5 rounded-lg border border-contour-subtle">
                          {pkg.photos}
                        </p>
                      )}

                      <ul className="space-y-2 text-xs sm:text-sm text-ink-secondary pt-2 border-t border-contour-subtle">
                        {pkg.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6 mt-6 border-t border-contour-subtle">
                      <Button
                        variant={pkg.isPopular ? 'primary' : 'secondary'}
                        className="w-full"
                        size="md"
                        onClick={() => handleInitiateBooking(pkg)}
                      >
                        Book {pkg.name}
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* CUSTOMER REVIEWS */}
          <div className="space-y-6 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-brand">
                  Client Feedback
                </span>
                <h2 className="text-2xl font-extrabold text-ink-primary">
                  Customer Reviews ({creator.reviews.length})
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {creator.reviews.map((rev) => (
                <Card key={rev.id} className="p-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-ink-primary">{rev.clientName}</h3>
                      <p className="text-xs text-ink-muted">
                        {rev.clientLocation} • {rev.sessionType}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                  <p className="text-[10px] text-ink-muted pt-2 border-t border-contour-subtle">
                    Delivered on {rev.date} via SnapShoot Escrow
                  </p>
                </Card>
              ))}
            </div>
          </div>

          {/* CANCELLATION & TRUST BOX */}
          <div className="p-6 bg-canvas-secondary rounded-card-md border border-contour-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand" />
                <h3 className="text-sm font-bold text-ink-primary">
                  SnapShoot Cancellation & Escrow Protection
                </h3>
              </div>
              <p className="text-xs text-ink-secondary">
                100% full refund up to 24 hours before shoot. Funds held safely in escrow until you approve the delivered photographs.
              </p>
            </div>
            <Link href="/cancellation" className="text-xs font-bold text-brand hover:underline shrink-0">
              Read Refund Policy →
            </Link>
          </div>
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
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#FF6E00] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PhotographerProfileInner params={params} />
    </Suspense>
  );
}
