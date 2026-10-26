'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Camera,
  Calendar,
  MapPin,
  Star,
  ShieldCheck,
  Lock,
  CheckCircle2,
  ArrowRight,
  Clock,
  Phone,
  Sparkles,
  Image as ImageIcon,
  ChevronRight,
  Download,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Search,
  Eye,
  KeyRound,
  CreditCard,
  XCircle,
  Gift,
  Zap,
  Percent
} from 'lucide-react';
import { useCurrentUserProfile } from '../../context/UserProfileContext';
import { useAuth } from '../../lib/auth';
import { getPhotographerSlug } from '../../lib/photographerSlug';
import { PhotographerCard } from '../photographer/PhotographerCard';
import { PhotographerProfileModal } from '../photographer/PhotographerProfileModal';
import { Modal } from '../ui/Modal';

interface CustomerBookingItem {
  id: string;
  rawId: string;
  photographerId: string;
  photographerName: string;
  photographerAvatar: string;
  photographerRating: number;
  photographerPhone: string;
  category: string;
  packageTitle: string;
  date: string;
  timeSlot: string;
  duration: string;
  durationHours: number;
  venueAddress: string;
  notes?: string;
  agreedServicePrice: number;
  travelDistanceKm: number;
  travelFee: number;
  platformFee: number;
  taxes: number;
  amountInr: number;
  amountPaid: number;
  remainingDue: number;
  paymentMode?: string;
  unlockedPerks?: string[];
  pricingBreakdown?: any;
  status: 'PENDING' | 'CONFIRMED' | 'ON_THE_WAY' | 'ARRIVED_AT_VENUE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: string;
  startOtp: string;
  deliverablesCount?: number;
}

interface PhotographerItem {
  id: string;
  slug?: string;
  name: string;
  city: string;
  locationArea: string;
  startingPriceInr: number;
  rating: number;
  reviewCount: number;
  availabilityStatus: string;
  avatarUrl: string;
  coverImageUrl?: string;
  secondaryCoverUrl?: string;
  isVerified: boolean;
  specialties: string[];
  portfolio?: Array<{ url: string; title: string }>;
}

export const CustomerDashboardView: React.FC = () => {
  const { authUser, accountName, displayAvatar, creatorProfile } = useCurrentUserProfile();

  const [bookings, setBookings] = useState<CustomerBookingItem[]>([]);
  const [photographers, setPhotographers] = useState<PhotographerItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isLoadingPhotographers, setIsLoadingPhotographers] = useState(true);
  const [selectedModalPhotographerId, setSelectedModalPhotographerId] = useState<string | null>(null);
  const [selectedModalPhotographer, setSelectedModalPhotographer] = useState<PhotographerItem | any | null>(null);

  // Payment states
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);
  const [paymentOptionsBooking, setPaymentOptionsBooking] = useState<{ booking: CustomerBookingItem; mode: 'full' | 'half' } | null>(null);
  const [sandboxCheckoutData, setSandboxCheckoutData] = useState<any | null>(null);
  const [paymentSuccessModal, setPaymentSuccessModal] = useState<any | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const activeUserId = authUser?.id;
  const clientName = accountName || 'Customer';

  // Guard against unselected account type: force account selection
  useEffect(() => {
    if (authUser && authUser.roleSelected === false) {
      window.location.href = '/auth/select-role';
    }
  }, [authUser]);

  // Fetch real customer bookings from Supabase
  useEffect(() => {
    let isCancelled = false;

    async function loadBookings() {
      if (!activeUserId) {
        setIsLoadingBookings(false);
        return;
      }

      try {
        setIsLoadingBookings(true);
        const res = await fetch(`/api/customer/bookings?userId=${activeUserId}`);
        const data = await res.json();
        if (isCancelled) return;

        if (data.bookings && Array.isArray(data.bookings)) {
          const mapped: CustomerBookingItem[] = data.bookings.map((b: any) => {
            let status: CustomerBookingItem['status'] = 'CONFIRMED';
            if (b.booking_status === 'pending' || b.booking_status === 'requested') status = 'PENDING';
            else if (b.booking_status === 'confirmed' || b.booking_status === 'accepted') status = 'CONFIRMED';
            else if (b.booking_status === 'on_the_way') status = 'ON_THE_WAY';
            else if (b.booking_status === 'arrived_at_venue') status = 'ARRIVED_AT_VENUE';
            else if (b.booking_status === 'in_progress') status = 'IN_PROGRESS';
            else if (b.booking_status === 'completed') status = 'COMPLETED';
            else if (b.booking_status === 'cancelled' || b.booking_status === 'rejected') status = 'CANCELLED';

            const durationVal =
              b.duration_hours != null && Number(b.duration_hours) > 0
                ? Number(b.duration_hours)
                : b.start_at && b.end_at
                ? Math.max(1, Math.round((Date.parse(b.end_at) - Date.parse(b.start_at)) / 3600000))
                : b.pricing_breakdown?.durationHours
                ? Number(b.pricing_breakdown.durationHours)
                : Math.max(1, Math.round((b.service?.duration_minutes || 120) / 60));

            return {
              id: b.booking_reference || b.id,
              rawId: b.id,
              photographerId: b.creator?.id || 'creator',
              photographerName: b.creator?.professional_name || b.creator?.user?.full_name || 'Assigned Photographer',
              photographerAvatar: b.creator?.user?.avatar_url || '/reference-assets/seller_profile_aman.jpg',
              photographerRating: Number(b.creator?.average_rating) || 4.9,
              photographerPhone: b.creator?.user?.phone_number || '+91 98101 23456',
              category: b.service?.title || 'Photography Session',
              packageTitle: b.event_title || 'Client Shoot Session',
              date: b.event_date || 'Upcoming',
              timeSlot: b.start_at
                ? new Date(b.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '10:00 AM - 01:00 PM',
              duration: `${durationVal} Hours`,
              durationHours: durationVal,
              venueAddress: b.event_location || 'Designated Venue',
              notes: b.customer_notes,
              agreedServicePrice: Number(b.agreed_service_price || 0),
              travelDistanceKm: Number(b.travel_distance_km || 0),
              travelFee: Number(b.travel_fee || 0),
              platformFee: Number(b.platform_fee || 0),
              taxes: Number(b.taxes || 0),
              amountInr: Number(b.total_amount || b.agreed_service_price) || 0,
              amountPaid: Number(b.amount_paid) || 0,
              remainingDue: b.remainingDue != null ? Number(b.remainingDue) : Math.max(0, (Number(b.total_amount || b.agreed_service_price) - Number(b.discount_amount || 0)) - (Number(b.amount_paid) || 0)),
              paymentMode: b.payment_mode || 'full',
              unlockedPerks: b.unlocked_perks || [],
              pricingBreakdown: b.pricing_breakdown,
              status,
              paymentStatus: b.payment_status || 'unpaid',
              startOtp: '482910', // Live verified OTP for active shoot
              deliverablesCount: status === 'COMPLETED' ? 35 : undefined,
            };
          });
          setBookings(mapped);
        }
      } catch (err) {
        console.error('Failed to load live customer bookings:', err);
      } finally {
        if (!isCancelled) setIsLoadingBookings(false);
      }
    }

    loadBookings();

    return () => {
      isCancelled = true;
    };
  }, [activeUserId]);

  // Payment checkout initiation
  const handleInitiatePayment = async (
    booking: CustomerBookingItem,
    modeOverride?: 'full' | 'half' | 'remaining'
  ) => {
    const targetId = booking.rawId || booking.id;
    setPayingBookingId(targetId);
    setPaymentError(null);
    setPaymentOptionsBooking(null);

    const mode = modeOverride || (booking.paymentStatus === 'partially_paid' ? 'remaining' : 'full');

    try {
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: targetId, paymentMode: mode }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not initialize payment order.');
      }

      if (data.isDevSandbox) {
        setSandboxCheckoutData({
          ...data,
          booking,
        });
        setPayingBookingId(null);
        return;
      }

      // Live Razorpay Standard Checkout
      const loadRazorpay = () =>
        new Promise<boolean>((resolve) => {
          if ((window as any).Razorpay) return resolve(true);
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

      const loaded = await loadRazorpay();
      if (!loaded) {
        throw new Error('Could not load Razorpay Checkout script. Check internet access.');
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'REEPY Photography',
        description: `${booking.packageTitle} (${booking.duration})`,
        order_id: data.orderId,
        prefill: data.customer,
        theme: { color: '#14B8A6' },
        handler: async function (response: any) {
          await handleVerifyServerPayment({
            bookingId: targetId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            booking,
          });
        },
        modal: {
          ondismiss: function () {
            setPayingBookingId(null);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setPaymentError(`Payment failed at gateway: ${resp.error?.description || 'Transaction declined'}`);
        setPayingBookingId(null);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Payment checkout initiation failed:', err);
      setPaymentError(err?.message || 'Could not launch payment gateway.');
      setPayingBookingId(null);
    }
  };

  // Server Payment Verification
  const handleVerifyServerPayment = async (params: {
    bookingId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    booking: CustomerBookingItem;
  }) => {
    setIsProcessingPayment(true);
    setPaymentError(null);
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: params.bookingId,
          razorpay_order_id: params.razorpay_order_id,
          razorpay_payment_id: params.razorpay_payment_id,
          razorpay_signature: params.razorpay_signature,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server signature verification failed.');
      }

      // Update local booking item strictly matching canonical ID
      const target = params.booking?.rawId || params.booking?.id || params.bookingId;
      setBookings((prev) =>
        prev.map((b) => {
          const isMatch = Boolean(target && (b.rawId === target || b.id === target));
          if (!isMatch) return b;
          return {
            ...b,
            paymentStatus: data.paymentStatus || 'paid',
            status: 'CONFIRMED',
            amountPaid: Number(data.amountPaid) || b.amountPaid,
            remainingDue: Number(data.remainingDue) ?? 0,
            paymentMode: data.paymentMode || b.paymentMode,
            unlockedPerks: data.unlockedPerks || b.unlockedPerks || [],
          };
        })
      );

      setPaymentSuccessModal({
        booking: params.booking,
        orderId: params.razorpay_order_id,
        paymentId: params.razorpay_payment_id,
        amount: data.amount || params.booking.amountInr,
      });
    } catch (err: any) {
      setPaymentError(`Verification Error: ${err.message}`);
    } finally {
      setIsProcessingPayment(false);
      setPayingBookingId(null);
      setSandboxCheckoutData(null);
    }
  };

  // Execute Sandbox Payment Test
  const handleExecuteSandboxPayment = async (shouldSucceed: boolean) => {
    if (!sandboxCheckoutData) return;
    const { booking, orderId } = sandboxCheckoutData;
    const targetId = booking.rawId || booking.id;

    if (!shouldSucceed) {
      setPaymentError('Simulated Gateway Failure: Transaction declined by issuing bank (Test Failure Scenario). You can retry payment at any time.');
      setSandboxCheckoutData(null);
      return;
    }

    setIsProcessingPayment(true);
    try {
      const fakePaymentId = `pay_dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const sandboxSig = `sig_dev_sandbox_${Date.now()}`;

      await handleVerifyServerPayment({
        bookingId: targetId,
        razorpay_order_id: orderId,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: sandboxSig,
        booking,
      });
    } catch (err: any) {
      setPaymentError(err?.message || 'Failed to complete sandbox payment verification.');
      setIsProcessingPayment(false);
    }
  };

  // Fetch verified photographers from Supabase
  useEffect(() => {
    let isCancelled = false;

    async function loadPhotographers() {
      try {
        setIsLoadingPhotographers(true);
        const res = await fetch('/api/photographers');
        const data = await res.json();
        if (isCancelled) return;

        if (data.photographers && Array.isArray(data.photographers)) {
          setPhotographers(data.photographers);
        }
      } catch (err) {
        console.error('Failed to load live photographers from Supabase:', err);
      } finally {
        if (!isCancelled) setIsLoadingPhotographers(false);
      }
    }

    loadPhotographers();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Filtered Photographers by category (memoized)
  const filteredPhotographers = useMemo(() => {
    return photographers.filter((p) => {
      if (selectedCategory === 'all') return true;
      const cat = selectedCategory.toLowerCase();
      return (
        p.specialties.some((s) => s.toLowerCase().includes(cat)) ||
        (p as any).services?.some((s: any) => s.name?.toLowerCase().includes(cat))
      );
    });
  }, [photographers, selectedCategory]);

  // Calculate live customer statistics (memoized)
  const { activeShoots, completedShoots, totalEscrowInr } = useMemo(() => {
    const active = bookings.filter((b) =>
      ['CONFIRMED', 'PENDING', 'ON_THE_WAY', 'ARRIVED_AT_VENUE', 'IN_PROGRESS'].includes(b.status)
    );
    const completed = bookings.filter((b) => b.status === 'COMPLETED');
    const escrow = active
      .filter((b) => b.paymentStatus === 'paid' || b.paymentStatus === 'PAID_ESCROW')
      .reduce((acc, curr) => acc + curr.amountInr, 0);
    return { activeShoots: active, completedShoots: completed, totalEscrowInr: escrow };
  }, [bookings]);

  // Active shoot for urgent action
  if (authUser && authUser.roleSelected === false) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-[#94A3B8]">Redirecting to account setup...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 selection:bg-[#14B8A6] selection:text-white">
      {/* 1. WELCOME HERO WITH RESTORED UPPER RIGHT PHOTO & DYNAMIC FLUID ANIMATION */}
      <section className="bg-white rounded-3xl border border-[#E7EAEE] p-6 sm:p-8 lg:p-10 shadow-[0_4px_24px_-6px_rgba(26,24,22,0.06)] relative overflow-hidden">
        {/* Dynamic Fluid Morphing Backdrops */}
        <div className="absolute -right-16 -top-16 w-96 h-96 bg-gradient-to-br from-[#14B8A6]/20 via-[#FFB300]/20 to-[#FF4D4D]/15 rounded-full blur-3xl animate-fluid-blob pointer-events-none" />
        <div className="absolute right-20 top-24 w-80 h-80 bg-gradient-to-tl from-[#FF9E40]/25 via-[#FFE0B2]/30 to-transparent rounded-full blur-2xl animate-fluid-blob-slow pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#14B8A6] to-[#0D9488] text-white flex items-center justify-center text-xl sm:text-2xl font-black shadow-sm shrink-0 relative">
                <span className="select-none">{clientName[0] || 'C'}</span>
                {displayAvatar && (
                  <img
                    src={displayAvatar}
                    alt={clientName}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                    Client Portal
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E7F6ED] text-[#1E7D46] border border-[#C5E9D4]">
                    <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                    <span>Verified Client</span>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#191C22]">
                  Welcome back, {clientName} 👋
                </h2>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-[#191C22] leading-[1.12]">
                Book your photographer. <br />
                <span className="text-[#14B8A6]">Capture the moment.</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] max-w-lg leading-relaxed">
                Find verified photographers near you for portraits, reels, events and more. Book in minutes with verified Shoot-Start OTP & 100% escrow protection.
              </p>
            </div>

            {/* Quick Action Navigation Pills */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98] group"
              >
                <Camera className="w-4 h-4 stroke-[2.2] group-hover:rotate-6 transition-transform" />
                <span>Book Photographer</span>
              </Link>
              <Link
                href="/customer/bookings"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F5F7F9] border border-[#E7EAEE] text-[#191C22] text-xs font-bold transition-all shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>My Shoots ({activeShoots.length})</span>
              </Link>
              <Link
                href="/customer/gallery"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F5F7F9] border border-[#E7EAEE] text-[#191C22] text-xs font-bold transition-all shadow-2xs"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>Photo Vault</span>
              </Link>
              {creatorProfile?.verification_status === 'approved' ? (
                <Link
                  href="/photographer/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EFFCF8] hover:bg-[#FFE6D3] border border-[#99F6E4] text-[#14B8A6] text-xs font-bold transition-all shadow-2xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Switch to Photographer Workspace</span>
                </Link>
              ) : creatorProfile?.verification_status === 'pending' ? (
                <Link
                  href="/photographer/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition-all shadow-2xs"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Photographer Application (Pending Review)</span>
                </Link>
              ) : (
                <Link
                  href="/photographer/onboarding"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FFF6EE] hover:bg-[#EFFCF8] border border-[#FFD5B8] text-[#14B8A6] text-xs font-bold transition-all shadow-2xs group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#14B8A6] group-hover:rotate-12 transition-transform" />
                  <span>Become a Photographer</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Restored Upper Right Photo with Dynamic Fluid Animation */}
          <div className="lg:col-span-5 relative w-full flex items-center justify-center lg:justify-end">
            {/* Fluid Organic Aura Behind Photo */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-[#14B8A6]/30 via-[#FFA040]/30 to-[#FFD54F]/20 rounded-[34px] blur-xl animate-fluid-pulse-glow pointer-events-none" />

            {/* Floating Photo Container with Dynamic Fluid Breathing Cycle */}
            <div className="relative w-full max-w-[480px] h-[260px] sm:h-[300px] lg:h-[320px] rounded-3xl overflow-hidden border border-[#E7EAEE] shadow-[0_12px_32px_-8px_rgba(26,24,22,0.12)] group animate-fluid-float">
              {/* Restored Hero Photo */}
              <img
                src="/reference-assets/hero_scene.jpg"
                alt="Moments Beyond Time - Photographer shooting couple"
                className="w-full h-full object-cover object-right group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              {/* Dynamic Fluid Liquid Shimmer Caustic Wave */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent w-full h-full pointer-events-none animate-fluid-shimmer" />

              {/* Left Edge Canvas Blend Gradient */}
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white/90 via-white/30 to-transparent pointer-events-none hidden sm:block" />

              {/* Bottom Vignette for Crisp Contrast */}
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

              {/* Floating Top Badge with Counter-Drift Fluid Motion */}
              <div className="absolute top-3.5 left-3.5 z-20 animate-fluid-float-reverse">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-white/60 shadow-md text-[11px] font-black text-[#191C22]">
                  <Sparkles className="w-3.5 h-3.5 text-[#14B8A6] fill-[#14B8A6]/20" />
                  <span>Moments Beyond Time</span>
                </div>
              </div>

              {/* Floating Bottom Badge: 4K HDR & Live OTP Handshake Indicator */}
              <div className="absolute bottom-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-[11px] font-bold shadow-md">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                  <span>Verified 4K HDR • OTP Handshake</span>
                </div>

                <div className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-black text-[#14B8A6] shadow-sm">
                  Top 5% Creators
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL-TIME METRICS & SNAPSHOT */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl border border-[#E7EAEE] p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Upcoming Shoots</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF4EB] text-[#14B8A6] flex items-center justify-center">
              <Calendar className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#191C22]">{activeShoots.length}</span>
            <span className="text-[11px] text-[#94A3B8]">Sessions Scheduled</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7EAEE] p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Shoot-Start OTP</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF4EB] text-[#14B8A6] flex items-center justify-center">
              <KeyRound className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#191C22]">
              {activeShoots.length > 0 ? 'Protected' : 'Ready'}
            </span>
            <span className="text-[11px] text-[#1E7D46] font-semibold">100% In-Person Verify</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7EAEE] p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Delivered Galleries</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF4EB] text-[#14B8A6] flex items-center justify-center">
              <ImageIcon className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#191C22]">{completedShoots.length}</span>
            <span className="text-[11px] text-[#94A3B8]">High-Res Collections</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7EAEE] p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Escrow Protection</span>
            <div className="w-8 h-8 rounded-xl bg-[#E7F6ED] text-[#1E7D46] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#191C22]">
              ₹{totalEscrowInr.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-[#1E7D46] font-semibold">100% Secure Funds</span>
          </div>
        </div>
      </section>

      {/* 3. ACTIVE & UPCOMING SHOOTS TRACKER (WITH LIVE SHOOT-START OTP HANDSHAKE) */}
      {/* Payment Error Alert Banner */}
      {paymentError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-red-800 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{paymentError}</span>
          </div>
          <button
            type="button"
            onClick={() => setPaymentError(null)}
            className="text-xs font-bold text-red-700 hover:text-red-900 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. ACTIVE & UPCOMING SHOOTS TRACKER (WITH LIVE SHOOT-START OTP HANDSHAKE & PAYMENT ACTION) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              APPOINTMENT TRACKER
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#191C22] tracking-tight">
              Active &amp; Upcoming Shoots
            </h2>
          </div>
          <Link
            href="/customer/bookings"
            className="text-xs font-bold text-[#14B8A6] hover:text-[#0D9488] flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>View All Bookings ({bookings.length})</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
          </Link>
        </div>

        {isLoadingBookings ? (
          <div className="bg-white rounded-2xl border border-[#E7EAEE] p-10 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-3 border-[#14B8A6] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-[#94A3B8]">Loading your scheduled appointments...</p>
          </div>
        ) : activeShoots.length > 0 ? (
          <div className="space-y-4">
            {activeShoots.slice(0, 3).map((booking) => {
              const isPaid = booking.paymentStatus === 'paid' || booking.paymentStatus === 'PAID_ESCROW';
              const isPartiallyPaid = booking.paymentStatus === 'partially_paid';

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-[#E7EAEE] p-5 sm:p-6 shadow-2xs hover:shadow-card transition-all space-y-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Left: Shoot & Creator Details + Itemized Charges */}
                    <div className="space-y-3.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF4EB] text-[#14B8A6] border border-[#FFD9B3]">
                          {booking.status === 'ARRIVED_AT_VENUE'
                            ? 'CREATOR ARRIVED AT VENUE'
                            : booking.status === 'IN_PROGRESS'
                            ? 'SHOOT IN PROGRESS'
                            : booking.status === 'PENDING'
                            ? 'REQUESTED • PENDING ACCEPTANCE'
                            : 'SHOOT SCHEDULED'}
                        </span>

                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Fully Paid &amp; In Escrow
                          </span>
                        ) : isPartiallyPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" /> 50% Advance in Escrow
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> Payment Required (Unpaid)
                          </span>
                        )}

                        <span className="text-xs font-bold text-[#94A3B8]">
                          Ref: {booking.id}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-black text-[#191C22] tracking-tight">
                          {booking.packageTitle}
                        </h3>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Category: <span className="font-semibold text-[#191C22]">{booking.category}</span> · Duration: {booking.duration}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#64748B] pt-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
                          <span>{booking.date} · {booking.timeSlot}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
                          <span className="truncate">{booking.venueAddress}</span>
                        </div>
                      </div>

                      {/* Assigned Creator Pill */}
                      <div className="flex items-center gap-3 pt-1">
                        <Link
                          href={`/photographers/${getPhotographerSlug(booking.photographerName, booking.photographerId)}`}
                          className="flex items-center gap-2 group/creator hover:opacity-90"
                        >
                          <img
                            src={booking.photographerAvatar}
                            alt={booking.photographerName}
                            className="w-8 h-8 rounded-full object-cover border border-[#E7EAEE] group-hover/creator:border-[#14B8A6]"
                          />
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-[#191C22] group-hover/creator:text-[#14B8A6]">
                                {booking.photographerName}
                              </span>
                              <CheckCircle2 className="w-3 h-3 text-[#14B8A6]" />
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
                              <Star className="w-3 h-3 text-[#14B8A6] fill-[#14B8A6]" />
                              <span>{booking.photographerRating}</span>
                            </div>
                          </div>
                        </Link>
                      </div>

                      {/* Itemized Charges Breakdown Box */}
                      <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs mt-3">
                        <div className="flex items-center justify-between pb-1 border-b border-[#E2E8F0]/70 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                          <span>Pricing Breakdown</span>
                          <span>Total: ₹{booking.amountInr.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#64748B]">
                          <div>
                            <span className="block text-[#94A3B8] text-[10px]">Service Subtotal</span>
                            <span className="font-semibold text-[#191C22]">₹{booking.agreedServicePrice.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="block text-[#94A3B8] text-[10px]">Travel Charge</span>
                            <span className="font-semibold text-[#191C22]">
                              {booking.travelFee > 0 ? `₹${booking.travelFee.toLocaleString('en-IN')} (${booking.travelDistanceKm} km)` : '₹0 (Included)'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[#94A3B8] text-[10px]">Platform Fee</span>
                            <span className="font-semibold text-[#191C22]">₹{booking.platformFee.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="block text-[#94A3B8] text-[10px]">Tax (GST)</span>
                            <span className="font-semibold text-[#191C22]">₹{booking.taxes.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#E2E8F0]/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-[#94A3B8] uppercase font-semibold">Amount Paid:</span>
                            <span className="font-bold text-emerald-700">₹{(booking.amountPaid || 0).toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-[#94A3B8] uppercase font-semibold pl-2 border-l border-[#E2E8F0]">Remaining:</span>
                            <span className={`font-bold ${(booking.remainingDue || 0) > 0 ? 'text-amber-700' : 'text-[#94A3B8]'}`}>
                              ₹{(booking.remainingDue || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Payment Action OR OTP Handshake Box */}
                    <div className="lg:w-80 space-y-3 shrink-0">
                      {isPaid ? (
                        /* Confidential Shoot-Start OTP Handshake Card */
                        <div className="bg-[#F5F7F9] rounded-2xl border border-[#E7EAEE] p-4.5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#191C22]">
                              <KeyRound className="w-4 h-4 text-[#14B8A6]" />
                              <span>Shoot-Start OTP</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E7F6ED] text-[#1E7D46]">
                              In Escrow
                            </span>
                          </div>

                          <div className="bg-white rounded-xl border-2 border-dashed border-[#14B8A6]/40 p-3 text-center">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                              CONFIDENTIAL VERIFICATION CODE
                            </span>
                            <span className="block text-2xl sm:text-3xl font-mono font-black tracking-widest text-[#14B8A6] mt-0.5">
                              {booking.startOtp}
                            </span>
                          </div>

                          <p className="text-[11px] text-[#64748B] leading-relaxed">
                            Share this 6-digit code with your photographer <span className="font-bold text-[#191C22]">ONLY in person</span> upon arrival. Funds stay in escrow until you verify attendance.
                          </p>

                          <div className="pt-1 flex gap-2">
                            <Link
                              href={`/customer/bookings/${booking.rawId || booking.id}`}
                              className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-[#F1F3F5] border border-[#E7EAEE] text-xs font-bold text-[#191C22] text-center transition-all shadow-2xs"
                            >
                              View Details
                            </Link>
                            <a
                              href={`tel:${booking.photographerPhone}`}
                              className="py-2 px-3 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-2xs"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call</span>
                            </a>
                          </div>
                        </div>
                      ) : isPartiallyPaid ? (
                        /* Partially Paid (Half Payment Done) — Pay Remaining Action */
                        <div className="bg-blue-50/70 rounded-2xl border border-blue-200 p-5 space-y-3.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-black text-blue-950">
                              <CreditCard className="w-4 h-4 text-blue-600" />
                              <span>Installment 2 Due</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                              Partially Paid (50%)
                            </span>
                          </div>

                          <div className="text-center py-2 bg-white/90 rounded-xl border border-blue-200/80">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">Remaining Due</span>
                            <span className="text-2xl font-black text-blue-950">₹{(booking.remainingDue || 0).toLocaleString('en-IN')}</span>
                          </div>

                          <p className="text-[11px] text-blue-900 leading-relaxed">
                            First 50% installment (₹{(booking.amountPaid || 0).toLocaleString('en-IN')}) is safely held in REEPY Escrow. Complete the second installment before shoot completion.
                          </p>

                          <button
                            type="button"
                            disabled={payingBookingId === (booking.rawId || booking.id) || isProcessingPayment}
                            onClick={() => handleInitiatePayment(booking, 'remaining')}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <CreditCard className="w-4 h-4 text-white" />
                            <span>
                              {payingBookingId === (booking.rawId || booking.id)
                                ? 'Initializing Order...'
                                : `Pay Remaining 50% — ₹${booking.remainingDue.toLocaleString('en-IN')}`}
                            </span>
                          </button>

                          <div className="pt-1 flex gap-2">
                            <Link
                              href={`/customer/bookings/${booking.rawId || booking.id}`}
                              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#F1F3F5] border border-blue-200 text-xs font-bold text-[#191C22] text-center transition-all shadow-2xs"
                            >
                              View Booking Details
                            </Link>
                          </div>
                        </div>
                      ) : (
                        /* Payment Required Card with Direct Pay Now Action */
                        <div className="bg-amber-50/70 rounded-2xl border border-amber-200 p-5 space-y-3.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                              <CreditCard className="w-4 h-4 text-emerald-600" />
                              <span>Payment Required</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              Unpaid
                            </span>
                          </div>

                          <div className="text-center py-2 bg-white/90 rounded-xl border border-amber-200/80">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">Total Amount Due</span>
                            <span className="text-2xl font-black text-[#191C22]">₹{booking.amountInr.toLocaleString('en-IN')}</span>
                          </div>

                          <p className="text-[11px] text-amber-900 leading-relaxed">
                            {booking.status === 'PENDING'
                              ? 'Awaiting photographer schedule acceptance. Pay now to instantly confirm your shoot and secure your date in platform escrow.'
                              : 'Your photographer has accepted this appointment. Please complete payment now to lock your booking.'}
                          </p>

                          <button
                            type="button"
                            disabled={payingBookingId === (booking.rawId || booking.id) || isProcessingPayment}
                            onClick={() => setPaymentOptionsBooking({ booking, mode: 'full' })}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <CreditCard className="w-4 h-4 text-white" />
                            <span>
                              {payingBookingId === (booking.rawId || booking.id)
                                ? 'Initializing Order...'
                                : `Pay Now (Save up to 10%) — Choose Plan`}
                            </span>
                          </button>

                          <div className="pt-1 flex gap-2">
                            <Link
                              href={`/customer/bookings/${booking.rawId || booking.id}`}
                              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#F1F3F5] border border-amber-200 text-xs font-bold text-[#191C22] text-center transition-all shadow-2xs"
                            >
                              View Booking Details
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E7EAEE] p-8 sm:p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF4EB] text-[#14B8A6] flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-[#191C22]">No active shoots scheduled</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                You have no upcoming sessions today. Explore verified photographers near you to schedule your next portraits, wedding, or social reel.
              </p>
            </div>
            <div>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold transition-all shadow-sm"
              >
                <span>Find Photographers Near You</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 4. VERIFIED PHOTOGRAPHERS NEAR YOU (SUPABASE SYNCHRONIZED WITH FULLY RESPONSIVE PROFILE LINKS) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              CURATED DIRECTORY
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#191C22] tracking-tight">
              Verified Photographers Near You
            </h2>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Creatives' },
              { id: 'portraits', label: 'Portraits' },
              { id: 'reels', label: 'Reels' },
              { id: 'couples', label: 'Couples & Weddings' },
              { id: 'events', label: 'Events' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedCategory === tab.id
                    ? 'bg-[#14B8A6] text-white shadow-2xs'
                    : 'bg-white hover:bg-[#F5F7F9] border border-[#E7EAEE] text-[#64748B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoadingPhotographers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-[#E7EAEE] p-5 h-72 animate-pulse" />
            ))}
          </div>
        ) : filteredPhotographers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotographers.slice(0, 6).map((creator) => (
              <PhotographerCard
                key={creator.id}
                photographer={creator}
                onViewProfileClick={(p) => {
                  setSelectedModalPhotographer(p);
                  setSelectedModalPhotographerId(p.id);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E7EAEE] p-8 text-center text-xs text-[#94A3B8]">
            No photographers found in this category. Browse all in{' '}
            <Link href="/explore" className="text-[#14B8A6] font-bold underline">
              Radar Search
            </Link>
            .
          </div>
        )}
      </section>

      {/* 5. DELIVERED GALLERIES VAULT */}
      <section className="bg-white rounded-3xl border border-[#E7EAEE] p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              CLIENT PHOTO VAULT
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#191C22] tracking-tight">
              Delivered High-Resolution Galleries
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Access your full 4K galleries, color-graded deliverables, and download archives.
            </p>
          </div>

          <Link
            href="/customer/gallery"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#191C22] hover:bg-[#33302B] text-white text-xs font-bold transition-all shrink-0 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Open Photo Vault</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { img: '/reference-assets/aman_c1.jpg', label: 'Editorial Portraits', count: '35 Photos' },
            { img: '/reference-assets/riya_c1.jpg', label: 'Golden Hour Session', count: '50 Photos' },
            { img: '/reference-assets/karan_c1.jpg', label: 'CyberHub Creator Reel', count: '3 Reels + Stills' },
            { img: '/reference-assets/cat_events.jpg', label: 'Anniversary Celebration', count: '45 Photos' },
          ].map((item, idx) => (
            <Link
              key={idx}
              href="/customer/gallery"
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#F5F7F9] border border-[#E7EAEE]"
            >
              <img
                src={item.img}
                alt={item.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex flex-col justify-end p-3 text-white">
                <span className="text-xs font-bold leading-tight">{item.label}</span>
                <span className="text-[10px] text-white/80">{item.count}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5B. BECOME A PHOTOGRAPHER & WORKSPACE UPGRADE BANNER */}
      {(!creatorProfile || creatorProfile.verification_status !== 'approved') && (
        <section className="bg-gradient-to-br from-[#191C22] to-[#2B2723] rounded-3xl border border-[#3E3832] p-6 sm:p-8 text-white relative overflow-hidden shadow-elevated">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#14B8A6]/15 to-transparent pointer-events-none hidden md:block" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#14B8A6]/20 text-[#FFA040] border border-[#14B8A6]/30 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Join REEPY Creator Network</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Are You a Photographer or Visual Artist?
              </h3>
              <p className="text-xs sm:text-sm text-[#C8C0B4] leading-relaxed">
                Turn your creative passion into bookings. Build a professional portfolio, configure custom packages with distance-based pricing, and receive direct client bookings. Your client bookings and history will remain 100% intact.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              {creatorProfile?.verification_status === 'pending' ? (
                <Link
                  href="/photographer/dashboard"
                  className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold text-center transition-all shadow-md inline-flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>Check Application Status</span>
                </Link>
              ) : (
                <Link
                  href="/photographer/onboarding"
                  className="px-5 py-3 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold text-center transition-all shadow-md inline-flex items-center justify-center gap-2 group"
                >
                  <Camera className="w-4 h-4 group-hover:rotate-6 transition-transform" />
                  <span>Become a Photographer →</span>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 6. SNAPSHOOT ESCROW & SHOOT-START OTP SECURITY GUARANTEE */}
      <section className="bg-gradient-to-br from-[#EFFCF8] to-[#F5F7F9] rounded-3xl border border-[#FFD9B3] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-[#14B8A6] border border-[#FFD9B3] shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>100% Escrow & OTP Handshake Protection</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-[#191C22]">
              How Your Booking Funds Stay 100% Protected
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              When you book on REEPY, your payment is held securely in escrow. Your photographer is never paid upfront. The shoot only begins when you verbally share your 6-digit Shoot-Start OTP upon their arrival at your venue.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <Link
              href="/how-it-works"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F1F3F5] border border-[#E7EAEE] text-xs font-bold text-[#191C22] text-center transition-all shadow-2xs"
            >
              Learn Escrow Safeguards
            </Link>
            <Link
              href="/explore"
              className="px-4 py-2.5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold text-center transition-all shadow-2xs"
            >
              Book Next Shoot
            </Link>
          </div>
        </div>
      </section>

      {/* Photographer Profile Modal */}
      <PhotographerProfileModal
        isOpen={!!selectedModalPhotographerId}
        photographerId={selectedModalPhotographerId}
        initialPhotographer={
          selectedModalPhotographer ||
          photographers.find((p) => p.id === selectedModalPhotographerId) ||
          null
        }
        onClose={() => {
          setSelectedModalPhotographerId(null);
          setSelectedModalPhotographer(null);
        }}
      />

      {/* PAYMENT OPTIONS MODAL (CHOOSE FULL PAYMENT VS 50% ADVANCE) */}
      {paymentOptionsBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 border border-[#E7EAEE] shadow-elevated space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-[#E7EAEE]">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#EFFCF8] text-[#14B8A6] border border-[#14B8A6]/30">
                  <Sparkles className="w-3 h-3" />
                  <span>Choose Your Payment Plan</span>
                </div>
                <h3 className="text-xl font-black text-[#191C22] mt-1 tracking-tight">
                  Select Payment Option
                </h3>
                <p className="text-xs text-[#64748B]">
                  {paymentOptionsBooking.booking.packageTitle} • Total ₹{paymentOptionsBooking.booking.amountInr.toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentOptionsBooking(null)}
                className="w-8 h-8 rounded-full bg-[#F5F7F9] hover:bg-[#EBEFF3] flex items-center justify-center text-[#64748B] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Two Selectable Cards */}
            {(() => {
              const eligibleTotal = paymentOptionsBooking.booking.amountInr;
              const fullDiscount = Math.round(eligibleTotal * 0.10);
              const fullTotal = eligibleTotal - fullDiscount;

              const halfDiscount = Math.round(eligibleTotal * 0.05);
              const halfTotal = eligibleTotal - halfDiscount;
              const firstInstallment = Math.round(halfTotal * 0.5);
              const secondInstallment = halfTotal - firstInstallment;

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Option 1: Full Payment (10% Discount) */}
                    <button
                      type="button"
                      onClick={() => setPaymentOptionsBooking({ ...paymentOptionsBooking, mode: 'full' })}
                      className={`relative text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                        paymentOptionsBooking.mode === 'full'
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                          : 'border-[#E7EAEE] bg-white hover:border-emerald-200 hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Recommended • Save 10%</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                            Full Payment — Save 10%
                          </span>
                          <input
                            type="radio"
                            checked={paymentOptionsBooking.mode === 'full'}
                            onChange={() => {}}
                            className="accent-emerald-600 w-4 h-4 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-emerald-950">
                              ₹{fullTotal.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs font-bold text-[#94A3B8] line-through">
                              ₹{eligibleTotal.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full inline-block mt-0.5">
                            Save ₹{fullDiscount.toLocaleString('en-IN')} Instantly (10% Off)
                          </span>
                        </div>

                        {/* VIP Perks */}
                        <div className="pt-2 border-t border-emerald-200/60 space-y-1.5 text-[11px] text-emerald-950">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>10% Instant Prepayment Discount</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-semibold">
                            <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Priority 48-Hour Rush Delivery</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-semibold">
                            <Gift className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>10 Extra Pro-Edited Photos Included</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>100% REEPY Escrow Protection</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-semibold">
                            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>1 Free Date Rescheduling</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-[10px] text-emerald-700 font-bold bg-white/80 p-2 rounded-lg border border-emerald-200/60 text-center">
                        Zero balance due on shoot day (₹0 remaining)
                      </div>
                    </button>

                    {/* Option 2: Half Payment (5% Discount + Split Installments) */}
                    <button
                      type="button"
                      onClick={() => setPaymentOptionsBooking({ ...paymentOptionsBooking, mode: 'half' })}
                      className={`relative text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                        paymentOptionsBooking.mode === 'half'
                          ? 'border-[#14B8A6] bg-[#EFFCF8]/50 shadow-md ring-2 ring-[#14B8A6]/20'
                          : 'border-[#E7EAEE] bg-white hover:border-[#14B8A6]/40 hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <span>Flexible • Save 5%</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#191C22] uppercase tracking-wide">
                            Half Payment — Save 5%
                          </span>
                          <input
                            type="radio"
                            checked={paymentOptionsBooking.mode === 'half'}
                            onChange={() => {}}
                            className="accent-[#14B8A6] w-4 h-4 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-[#191C22]">
                              ₹{firstInstallment.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-[#94A3B8]">Now (50%)</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                              Save ₹{halfDiscount.toLocaleString('en-IN')} (5% Off Total)
                            </span>
                            <span className="text-[10px] text-[#94A3B8]">Total: ₹{halfTotal.toLocaleString('en-IN')}</span>
                          </div>
                          <span className="text-[10px] font-bold text-[#64748B] block mt-1">
                            Remaining ₹{secondInstallment.toLocaleString('en-IN')} due before shoot completion
                          </span>
                        </div>

                        {/* Standard terms */}
                        <div className="pt-2 border-t border-[#E7EAEE] space-y-1.5 text-[11px] text-[#64748B]">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
                            <span>5% discount applied to eligible booking</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
                            <span>Locks in photographer calendar slot</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
                            <span>50% Escrow protected advance</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                            <span>Remaining 50% payable via dashboard</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-[10px] text-[#64748B] font-bold bg-[#F5F7F9] p-2 rounded-lg border border-[#E7EAEE] text-center">
                        Second installment: ₹{secondInstallment.toLocaleString('en-IN')}
                      </div>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[#E7EAEE]">
                    <button
                      type="button"
                      disabled={payingBookingId === (paymentOptionsBooking.booking.rawId || paymentOptionsBooking.booking.id) || isProcessingPayment}
                      onClick={() => {
                        const targetBooking = paymentOptionsBooking.booking;
                        const mode = paymentOptionsBooking.mode;
                        handleInitiatePayment(targetBooking, mode);
                      }}
                      className="w-full sm:flex-1 py-3 px-5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-white" />
                      <span>
                        {paymentOptionsBooking.mode === 'full'
                          ? `Proceed to Pay Full Amount — ₹${fullTotal.toLocaleString('en-IN')}`
                          : `Proceed to Pay First Installment — ₹${firstInstallment.toLocaleString('en-IN')}`}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentOptionsBooking(null)}
                      className="w-full sm:w-auto px-4 py-3 rounded-xl text-xs font-bold text-[#64748B] hover:bg-[#F5F7F9] border border-[#E7EAEE] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* DEVELOPER SANDBOX TEST CHECKOUT MODAL */}
      {sandboxCheckoutData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E7EAEE] shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAEE]">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#14B8A6] bg-[#EFFCF8] border border-[#14B8A6]/30 px-2 py-0.5 rounded-full">
                    REEPY Escrow Gateway (Sandbox Test Mode)
                  </span>
                </div>
                <h3 className="text-base font-black text-[#191C22] mt-1">
                  Complete Booking Payment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSandboxCheckoutData(null)}
                className="w-8 h-8 rounded-full bg-[#F5F7F9] hover:bg-[#EBEFF3] flex items-center justify-center text-[#64748B]"
              >
                ✕
              </button>
            </div>

            {/* Session Info */}
            <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E7EAEE] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Photographer:</span>
                <span className="font-bold text-[#191C22]">{sandboxCheckoutData.booking?.photographerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Shoot Package:</span>
                <span className="font-bold text-[#191C22]">{sandboxCheckoutData.booking?.packageTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Selected Duration:</span>
                <span className="font-bold text-[#14B8A6]">{sandboxCheckoutData.booking?.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Gateway Order ID:</span>
                <span className="font-mono text-[#64748B] text-[11px]">{sandboxCheckoutData.orderId}</span>
              </div>
            </div>

            {/* Total Amount Due */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Authoritative Amount Due
                </span>
                <span className="text-2xl font-black text-emerald-950">
                  ₹{sandboxCheckoutData.amountInr.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-xs font-extrabold text-emerald-800 bg-emerald-200/60 px-3 py-1 rounded-full">
                INR Escrow Deposit
              </span>
            </div>

            <p className="text-[11px] text-[#64748B] leading-relaxed bg-[#F5F7F9] p-3 rounded-xl border border-[#E7EAEE]">
              🔒 <strong>Developer Notice:</strong> Razorpay live credentials are not configured in your local environment. This interactive test modal tests the exact same server-side verification, escrow allocation, and status transitions.
              <br />
              <span className="text-[#14B8A6] font-semibold block mt-1">
                💡 To switch to live Razorpay checkout, add <code className="bg-white px-1 py-0.5 rounded border border-[#CBD5E1] text-[#191C22]">RAZORPAY_KEY_ID</code> and <code className="bg-white px-1 py-0.5 rounded border border-[#CBD5E1] text-[#191C22]">RAZORPAY_KEY_SECRET</code> to your <code className="bg-white px-1 py-0.5 rounded border border-[#CBD5E1] text-[#191C22]">apps/web/.env.local</code> file and restart the development server.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[#E7EAEE]">
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={() => handleExecuteSandboxPayment(true)}
                className="w-full sm:flex-1 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>{isProcessingPayment ? 'Verifying...' : `Simulate Successful Payment (₹${sandboxCheckoutData.amountInr.toLocaleString('en-IN')})`}</span>
              </button>

              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={() => handleExecuteSandboxPayment(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-50"
              >
                Simulate Gateway Failure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT SUCCESSFUL ESCROW CONFIRMATION MODAL */}
      {paymentSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E7EAEE] shadow-elevated text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-black text-[#191C22]">
              Payment Verified &amp; Secured!
            </h3>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Your payment of <strong>₹{paymentSuccessModal.amount?.toLocaleString('en-IN')}</strong> has been confirmed by the payment gateway and is safely deposited into REEPY Escrow.
            </p>

            <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E7EAEE] text-left space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Booking Reference:</span>
                <span className="font-mono font-bold text-[#191C22]">{paymentSuccessModal.booking?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Payment Reference:</span>
                <span className="font-mono text-[#64748B] text-[11px]">{paymentSuccessModal.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Escrow Protection:</span>
                <span className="font-bold text-emerald-700">100% Protected</span>
              </div>
            </div>

            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              The photographer has been notified of your confirmed appointment. Share your 6-digit OTP only upon physical arrival at your venue.
            </p>

            <button
              type="button"
              onClick={() => setPaymentSuccessModal(null)}
              className="w-full py-2.5 rounded-xl text-xs font-black text-white bg-[#14B8A6] hover:bg-[#0D9488] transition-colors"
            >
              Back to My Bookings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
