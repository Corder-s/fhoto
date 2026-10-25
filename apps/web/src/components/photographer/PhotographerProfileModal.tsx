'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  Send,
  Phone,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import type { SamplePhotographer, PhotographerServicePackage } from '../../data/photographers';
import { PortfolioLightbox } from '../gallery/PortfolioLightbox';
import { useAuth } from '../../lib/auth';
import { useAuthModal } from '../auth/AuthModalContext';

const DEFAULT_COVER = '/reference-assets/seller_banner_photographer.jpg';
const DEFAULT_AVATAR = '/reference-assets/seller_profile_aman.jpg';

function getInitials(name: string): string {
  if (!name) return 'P';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface PhotographerProfileModalProps {
  isOpen: boolean;
  photographerId: string | null;
  initialTab?: 'portfolio' | 'reviews' | 'book';
  onClose: () => void;
}

export const PhotographerProfileModal: React.FC<PhotographerProfileModalProps> = ({
  isOpen,
  photographerId,
  initialTab = 'portfolio',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'reviews' | 'book'>(initialTab);
  const [creator, setCreator] = useState<SamplePhotographer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cover and avatar fallbacks
  const [coverSrc, setCoverSrc] = useState<string>(DEFAULT_COVER);
  const [avatarSrc, setAvatarSrc] = useState<string>(DEFAULT_AVATAR);
  const [avatarError, setAvatarError] = useState(false);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Share link toast
  const [copiedToast, setCopiedToast] = useState(false);

  // Booking Form State
  const { user, isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [eventDate, setEventDate] = useState('');
  const [durationHours, setDurationHours] = useState<number>(2);
  const [eventLocation, setEventLocation] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Booking submission status
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccessData, setBookingSuccessData] = useState<any | null>(null);

  // Reset tab on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setBookingSuccessData(null);
      setBookingError(null);
    }
  }, [isOpen, initialTab, photographerId]);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      if (user.name) setClientName(user.name);
      if (user.email) setClientEmail(user.email);
    }
  }, [user]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !lightboxOpen) {
        onClose();
      }
    },
    [onClose, lightboxOpen]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Load photographer details
  useEffect(() => {
    if (!isOpen || !photographerId) {
      setCreator(null);
      return;
    }

    let isMounted = true;
    async function fetchCreator() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/photographers?id=${encodeURIComponent(photographerId!)}`);
        const data = await res.json();
        if (!isMounted) return;

        if (data.photographers && data.photographers.length > 0) {
          const cp = data.photographers[0];

          let rawPackages = cp.services || [];
          if (rawPackages.length === 0) {
            try {
              const srvRes = await fetch(`/api/photographers/services?creatorId=${encodeURIComponent(cp.id)}`);
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

          const startingPrice = Number(cp.startingPriceInr) || 2000;
          const servicePackages: PhotographerServicePackage[] =
            rawPackages.length > 0
              ? rawPackages.map((s: any, idx: number) => {
                  const desc = s.description || '';
                  const lines = desc.split('\n').map((l: string) => l.trim()).filter(Boolean);
                  const features =
                    lines.length > 0
                      ? lines
                      : [
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
                    id: 'standard-shoot',
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
                    id: 'halfday-editorial',
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
            bio:
              cp.bio ||
              'Reel specialist and content creator crafting viral visual content. I help brands and individuals produce scroll-stopping reels and lifestyle photography.',
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
          if (servicePackages.length > 0) {
            setSelectedServiceId(servicePackages[0].id);
          }
          setEventLocation(mapped.locationArea || 'Delhi NCR');
        } else {
          setError('Photographer profile not found.');
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load photographer profile.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchCreator();
    return () => {
      isMounted = false;
    };
  }, [isOpen, photographerId]);

  if (!isOpen) return null;

  const handleShare = () => {
    if (typeof window !== 'undefined' && creator) {
      const url = `${window.location.origin}/photographers/${creator.id}`;
      navigator.clipboard.writeText(url);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  };

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Calculate estimated price based on selected service / hourly rate
  const selectedService = creator?.servicePackages.find((s) => s.id === selectedServiceId);
  const baseRate = selectedService ? selectedService.priceInr : (creator?.startingPriceInr || 2000);
  const estimatedTotal = Math.round(baseRate * (durationHours / 2));

  // Handle Booking Request Submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator) return;

    if (!clientName.trim() || !clientEmail.trim() || !clientPhone.trim() || !eventDate || !eventLocation.trim()) {
      setBookingError('Please fill in all required fields (Name, Email, Phone, Date, and Location).');
      return;
    }

    if (!isAuthenticated) {
      openAuthModal({
        returnUrl: `/explore`,
        message: `Please sign in or create an account to send a booking request to ${creator.name}.`,
      });
      return;
    }

    setIsSubmittingBooking(true);
    setBookingError(null);

    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user?.id,
          creatorId: creator.id,
          serviceId: selectedServiceId.includes('standard') || selectedServiceId.includes('halfday') ? undefined : selectedServiceId,
          eventTitle: `Booking Request: ${selectedService?.name || 'Photography Session'}`,
          eventDate: eventDate,
          startAt: `${eventDate}T10:00:00Z`,
          endAt: `${eventDate}T${10 + durationHours}:00:00Z`,
          eventLocation: eventLocation.trim(),
          customerNotes: `Client: ${clientName} (${clientPhone}, ${clientEmail})\nNotes: ${customerNotes}`,
          bookingType: 'scheduled',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setBookingSuccessData(data.booking || {
          id: `BK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          date: eventDate,
          amount: estimatedTotal,
        });
      } else {
        setBookingError(data.error || 'Failed to submit booking request. Please check inputs and try again.');
      }
    } catch (err: any) {
      setBookingError(err.message || 'An unexpected error occurred while placing the booking request.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const instagramHandle =
    (creator as any)?.slug?.replace(/^pro-/, '') ||
    creator?.name.toLowerCase().replace(/\s+/g, '.') ||
    'creator.reels';

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget && !lightboxOpen) {
            onClose();
          }
        }}
      >
        <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#F8FAFC] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-white/20 animate-in zoom-in-95 duration-200">
          {/* Top-Right Close 'X' Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-40 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm transition-all cursor-pointer shadow-md"
            aria-label="Close Profile Modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Scrollable Container */}
          <div className="overflow-y-auto flex-1 flex flex-col">
            {isLoading ? (
              <div className="py-32 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-[#64748B]">Loading creator profile...</p>
              </div>
            ) : error || !creator ? (
              <div className="py-24 px-6 text-center space-y-3">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                <h3 className="text-lg font-bold text-[#191C22]">Profile Unavailable</h3>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  {error || 'Could not find details for this photographer.'}
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[#14B8A6] text-white text-xs font-bold"
                >
                  Return to Listing
                </button>
              </div>
            ) : (
              <>
                {/* ========================================================= */}
                {/* 1. HERO COVER & PROFILE OVERLAY (SCREENSHOT 3 ALIGNMENT)   */}
                {/* ========================================================= */}
                <div className="relative h-60 sm:h-72 md:h-80 w-full bg-[#171A1F] overflow-hidden shrink-0">
                  <img
                    src={coverSrc}
                    alt={`${creator.name} cover`}
                    referrerPolicy="no-referrer"
                    onError={() => {
                      if (coverSrc !== DEFAULT_COVER) setCoverSrc(DEFAULT_COVER);
                    }}
                    className="w-full h-full object-cover"
                  />

                  {/* Dark Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15 pointer-events-none" />

                  {/* Overlaid Bottom Identity */}
                  <div className="absolute bottom-5 left-4 sm:left-7 right-4 sm:right-7 flex items-center gap-4 sm:gap-5 z-20">
                    <img
                      src={avatarSrc}
                      alt={creator.name}
                      referrerPolicy="no-referrer"
                      onError={() => {
                        if (avatarSrc !== DEFAULT_AVATAR) setAvatarSrc(DEFAULT_AVATAR);
                        else setAvatarError(true);
                      }}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-xl bg-white shrink-0"
                    />

                    <div className="min-w-0 text-white space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                          {creator.name}
                        </h2>
                        {creator.isVerified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#14B8A6] text-[#0D0F12] shadow-sm">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
                        <div className="flex items-center gap-1 font-bold text-white">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>{Number(creator.rating).toFixed(1)}</span>
                          <span className="text-slate-300 font-normal">({creator.reviewCount} reviews)</span>
                        </div>

                        <span>•</span>

                        <div className="flex items-center gap-1 text-slate-200">
                          <MapPin className="w-3 h-3 text-[#14B8A6] shrink-0" />
                          <span>{creator.locationArea}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* 2. PROFILE NAVIGATION TABS                                */}
                {/* ========================================================= */}
                <div className="bg-white border-b border-[#E2E8F0] sticky top-0 z-20 shadow-2xs px-4 sm:px-8">
                  <div className="flex items-center justify-between">
                    <nav className="flex items-center gap-6 sm:gap-10" aria-label="Profile Tabs">
                      <button
                        type="button"
                        onClick={() => setActiveTab('portfolio')}
                        className={`py-3.5 flex items-center gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer border-b-2 ${
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
                        className={`py-3.5 flex items-center gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer border-b-2 ${
                          activeTab === 'reviews'
                            ? 'border-[#14B8A6] text-[#14B8A6]'
                            : 'border-transparent text-[#64748B] hover:text-[#191C22]'
                        }`}
                      >
                        <Star className="w-4 h-4" />
                        <span>Reviews ({creator.reviewCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('book')}
                        className={`py-3.5 flex items-center gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer border-b-2 ${
                          activeTab === 'book'
                            ? 'border-[#14B8A6] text-[#14B8A6]'
                            : 'border-transparent text-[#64748B] hover:text-[#191C22]'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Book Now</span>
                      </button>
                    </nav>

                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[11px] font-semibold text-[#191C22] transition-colors cursor-pointer"
                    >
                      {copiedToast ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3 text-[#64748B]" />}
                      <span>{copiedToast ? 'Link Copied!' : 'Share'}</span>
                    </button>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* 3. TAB CONTENT                                            */}
                {/* ========================================================= */}
                <div className="p-4 sm:p-7 space-y-8 flex-1">
                  {/* TAB 1: PORTFOLIO & ABOUT */}
                  {activeTab === 'portfolio' && (
                    <div className="space-y-8">
                      {/* About section */}
                      <section className="space-y-4">
                        <h3 className="text-lg sm:text-xl font-black text-[#191C22] tracking-tight">
                          About
                        </h3>
                        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                          {creator.bio}
                        </p>

                        {/* 4 Metadata Cards in 2x2 Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                          {/* Experience */}
                          <div className="bg-white rounded-2xl p-4 border border-[#E7EAEE] flex items-center gap-3.5 shadow-2xs">
                            <div className="w-10 h-10 rounded-xl bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center shrink-0">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium text-[#94A3B8]">Experience</p>
                              <p className="text-xs sm:text-sm font-bold text-[#191C22] truncate">
                                {creator.experienceYears} years
                              </p>
                            </div>
                          </div>

                          {/* Equipment */}
                          <div className="bg-white rounded-2xl p-4 border border-[#E7EAEE] flex items-center gap-3.5 shadow-2xs">
                            <div className="w-10 h-10 rounded-xl bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center shrink-0">
                              <Wrench className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium text-[#94A3B8]">Equipment</p>
                              <p className="text-xs sm:text-sm font-bold text-[#191C22] truncate" title={creator.cameraGear}>
                                {creator.cameraGear}
                              </p>
                            </div>
                          </div>

                          {/* Languages */}
                          <div className="bg-white rounded-2xl p-4 border border-[#E7EAEE] flex items-center gap-3.5 shadow-2xs">
                            <div className="w-10 h-10 rounded-xl bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center shrink-0">
                              <Languages className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium text-[#94A3B8]">Languages</p>
                              <p className="text-xs sm:text-sm font-bold text-[#191C22] truncate">
                                Hindi, English, Marathi
                              </p>
                            </div>
                          </div>

                          {/* Instagram */}
                          <div className="bg-white rounded-2xl p-4 border border-[#E7EAEE] flex items-center gap-3.5 shadow-2xs">
                            <div className="w-10 h-10 rounded-xl bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center shrink-0">
                              <Instagram className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium text-[#94A3B8]">Instagram</p>
                              <p className="text-xs sm:text-sm font-bold text-[#191C22] truncate">
                                @{instagramHandle}
                              </p>
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Portfolio Gallery */}
                      <section className="space-y-3.5 pt-4 border-t border-[#E2E8F0]">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-bold text-[#191C22]">Portfolio Gallery</h4>
                          <span className="text-xs text-[#94A3B8]">Click any photo to enlarge</span>
                        </div>

                        {creator.fullPortfolio.length === 0 ? (
                          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-[#E2E8F0] p-6 space-y-2">
                            <ImageIcon className="w-7 h-7 text-[#94A3B8] mx-auto" />
                            <p className="text-xs font-semibold text-[#191C22]">No Portfolio Photos Uploaded</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
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
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-white text-center">
                                  <span className="text-[11px] font-bold">{img.title}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      {/* Bottom Pricing & Direct Book action */}
                      <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#94A3B8]">Starting from</span>
                          <p className="text-lg font-black text-[#191C22]">
                            Rs.{creator.startingPriceInr.toLocaleString('en-IN')}<span className="text-xs font-normal text-[#94A3B8]">/session</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('book')}
                          className="px-5 py-2.5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Book Shoot Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: REVIEWS */}
                  {activeTab === 'reviews' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                        <div>
                          <h3 className="text-lg font-bold text-[#191C22]">Client Reviews</h3>
                          <p className="text-xs text-[#64748B]">Real customer feedback from completed bookings</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-xl border border-[#E7EAEE]">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-black text-[#191C22]">{Number(creator.rating).toFixed(1)}</span>
                          <span className="text-xs text-[#94A3B8]">({creator.reviewCount})</span>
                        </div>
                      </div>

                      {creator.reviews.length === 0 ? (
                        <div className="py-12 text-center bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-2">
                          <Star className="w-8 h-8 text-amber-400 mx-auto fill-amber-400/20" />
                          <h4 className="text-sm font-bold text-[#191C22]">No Reviews Yet</h4>
                          <p className="text-xs text-[#64748B]">
                            Be the first client to book and review {creator.name}!
                          </p>
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => setActiveTab('book')}
                              className="px-4 py-2 rounded-xl bg-[#14B8A6] text-white text-xs font-bold cursor-pointer"
                            >
                              Book a Shoot
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {creator.reviews.map((rev) => (
                            <div key={rev.id} className="bg-white rounded-2xl border border-[#E7EAEE] p-5 space-y-2 shadow-2xs">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-xs font-bold text-[#191C22]">{rev.clientName}</h4>
                                  <p className="text-[10px] text-[#94A3B8]">{rev.sessionType}</p>
                                </div>
                                <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                                  <span>{rev.rating}.0</span>
                                </div>
                              </div>
                              <p className="text-xs text-[#64748B] leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>
                              <p className="text-[9px] text-[#94A3B8] pt-1.5 border-t border-[#F1F5F9]">
                                Verified via Escrow
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: BOOK NOW (PHASE 9 BOOKING REQUEST FORM) */}
                  {activeTab === 'book' && (
                    <div className="space-y-6">
                      {bookingSuccessData ? (
                        <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 text-center space-y-4 shadow-sm animate-in zoom-in-95 duration-200">
                          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                            <Check className="w-8 h-8 stroke-[2.5]" />
                          </div>
                          <div className="space-y-1">
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#E7F6ED] text-[#1E7D46] uppercase tracking-wider">
                              REQUEST SUBMITTED
                            </span>
                            <h3 className="text-xl sm:text-2xl font-black text-[#191C22]">
                              Booking Request Sent Successfully!
                            </h3>
                            <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
                              Your request has been routed to <strong>{creator.name}</strong>. They will review your schedule and respond. Your session is protected by Shoot-Start OTP & Escrow.
                            </p>
                          </div>

                          <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] max-w-sm mx-auto text-left text-xs space-y-2">
                            <div className="flex justify-between">
                              <span className="text-[#94A3B8]">Photographer:</span>
                              <span className="font-bold text-[#191C22]">{creator.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#94A3B8]">Event Date:</span>
                              <span className="font-bold text-[#191C22]">{eventDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#94A3B8]">Estimated Total:</span>
                              <span className="font-bold text-emerald-600">₹{estimatedTotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#94A3B8]">Status:</span>
                              <span className="font-bold text-[#14B8A6]">REQUESTED (Pending Acceptance)</span>
                            </div>
                          </div>

                          <div className="pt-2 flex items-center justify-center gap-3">
                            <Link
                              href="/customer/dashboard"
                              onClick={onClose}
                              className="px-5 py-2.5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold transition-all shadow-xs"
                            >
                              Go to Customer Dashboard →
                            </Link>
                            <button
                              type="button"
                              onClick={onClose}
                              className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F1F3F5] text-xs font-semibold text-[#191C22]"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleBookingSubmit} className="space-y-6">
                          <div className="border-b border-[#E2E8F0] pb-3">
                            <h3 className="text-lg font-bold text-[#191C22]">
                              Request a Shoot with {creator.name}
                            </h3>
                            <p className="text-xs text-[#64748B] mt-0.5">
                              Fill in your shoot details below. The photographer will review and confirm availability.
                            </p>
                          </div>

                          {bookingError && (
                            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                              <span>{bookingError}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Client Name */}
                            <div>
                              <label className="block text-[11px] font-bold text-[#191C22] mb-1">
                                Full Name <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <UserIcon className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  required
                                  value={clientName}
                                  onChange={(e) => setClientName(e.target.value)}
                                  placeholder="Your full name"
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E7EAEE] bg-white text-xs text-[#191C22] focus:outline-none focus:border-[#14B8A6]"
                                />
                              </div>
                            </div>

                            {/* Client Email */}
                            <div>
                              <label className="block text-[11px] font-bold text-[#191C22] mb-1">
                                Email Address <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                  type="email"
                                  required
                                  value={clientEmail}
                                  onChange={(e) => setClientEmail(e.target.value)}
                                  placeholder="you@example.com"
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E7EAEE] bg-white text-xs text-[#191C22] focus:outline-none focus:border-[#14B8A6]"
                                />
                              </div>
                            </div>

                            {/* Client Phone */}
                            <div>
                              <label className="block text-[11px] font-bold text-[#191C22] mb-1">
                                Phone Number <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                  type="tel"
                                  required
                                  value={clientPhone}
                                  onChange={(e) => setClientPhone(e.target.value)}
                                  placeholder="+91 98765 43210"
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E7EAEE] bg-white text-xs text-[#191C22] focus:outline-none focus:border-[#14B8A6]"
                                />
                              </div>
                            </div>

                            {/* Service Type Selection */}
                            <div>
                              <label className="block text-[11px] font-bold text-[#191C22] mb-1">
                                Service Package <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={selectedServiceId}
                                onChange={(e) => setSelectedServiceId(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-[#E7EAEE] bg-white text-xs text-[#191C22] focus:outline-none focus:border-[#14B8A6] cursor-pointer"
                              >
                                {creator.servicePackages.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} (₹{s.priceInr.toLocaleString('en-IN')})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Event Date */}
                            <div>
                              <label className="block text-[11px] font-bold text-[#191C22] mb-1">
                                Preferred Date <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <Calendar className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                  type="date"
                                  required
                                  min={new Date().toISOString().split('T')[0]}
                                  value={eventDate}
                                  onChange={(e) => setEventDate(e.target.value)}
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E7EAEE] bg-white text-xs text-[#191C22] focus:outline-none focus:border-[#14B8A6]"
                                />
                              </div>
                            </div>

                            {/* Duration in Hours */}
                            <div>
                              <label className="block text-[11px] font-bold text-[#191C22] mb-1">
                                Shoot Duration <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={durationHours}
                                onChange={(e) => setDurationHours(Number(e.target.value))}
                                className="w-full px-3 py-2.5 rounded-xl border border-[#E7EAEE] bg-white text-xs text-[#191C22] focus:outline-none focus:border-[#14B8A6] cursor-pointer"
                              >
                                <option value={1}>1 Hour (Quick Session)</option>
                                <option value={2}>2 Hours (Standard)</option>
                                <option value={3}>3 Hours</option>
                                <option value={4}>4 Hours (Half Day)</option>
                                <option value={6}>6 Hours</option>
                                <option value={8}>8 Hours (Full Day Event)</option>
                              </select>
                            </div>
                          </div>

                          {/* Event Location */}
                          <div>
                            <label className="block text-[11px] font-bold text-[#191C22] mb-1">
                              Shoot Venue / City Location <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <MapPin className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                required
                                value={eventLocation}
                                onChange={(e) => setEventLocation(e.target.value)}
                                placeholder="e.g. Connaught Place, New Delhi or Studio Bandra"
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E7EAEE] bg-white text-xs text-[#191C22] focus:outline-none focus:border-[#14B8A6]"
                              />
                            </div>
                          </div>

                          {/* Customer Message / Notes */}
                          <div>
                            <label className="block text-[11px] font-bold text-[#191C22] mb-1">
                              Special Instructions / Project Concept
                            </label>
                            <textarea
                              rows={3}
                              value={customerNotes}
                              onChange={(e) => setCustomerNotes(e.target.value)}
                              placeholder="Describe your vision, outfit changes, props, mood board references, or specific deliverables..."
                              className="w-full p-3 rounded-xl border border-[#E7EAEE] bg-white text-xs text-[#191C22] focus:outline-none focus:border-[#14B8A6] leading-relaxed"
                            />
                          </div>

                          {/* ESTIMATED PRICE BOX */}
                          <div className="p-4 bg-white rounded-2xl border border-[#E7EAEE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                            <div className="space-y-0.5">
                              <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                                Estimated Total
                              </span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-black text-[#191C22]">
                                  ₹{estimatedTotal.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[11px] text-[#64748B]">
                                  ({durationHours} hrs × base rate)
                                </span>
                              </div>
                              <p className="text-[10px] text-[#94A3B8]">
                                Protected by REEPY Escrow & Shoot-Start OTP handshake
                              </p>
                            </div>

                            <button
                              type="submit"
                              disabled={isSubmittingBooking}
                              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] active:bg-[#0F766E] text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                            >
                              {isSubmittingBooking ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Submitting Request...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Send Booking Request</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* PORTFOLIO LIGHTBOX */}
      {creator && (
        <PortfolioLightbox
          images={creator.fullPortfolio}
          currentIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onSelectIndex={(idx) => setLightboxIndex(idx)}
        />
      )}
    </>
  );
};

export default PhotographerProfileModal;
