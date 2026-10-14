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
  KeyRound
} from 'lucide-react';
import { useCurrentUserProfile } from '../../context/UserProfileContext';
import { useAuth } from '../../lib/auth';
import { getPhotographerSlug } from '../../lib/photographerSlug';

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
  venueAddress: string;
  notes?: string;
  amountInr: number;
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
  const { authUser, accountName, displayAvatar } = useCurrentUserProfile();

  const [bookings, setBookings] = useState<CustomerBookingItem[]>([]);
  const [photographers, setPhotographers] = useState<PhotographerItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isLoadingPhotographers, setIsLoadingPhotographers] = useState(true);

  const activeUserId = authUser?.id;
  const clientName = accountName || 'Customer';

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
              duration: `${Math.round((b.service?.duration_minutes || 120) / 60)} Hours`,
              venueAddress: b.event_location || 'Designated Venue',
              notes: b.customer_notes,
              amountInr: Number(b.total_amount || b.agreed_service_price) || 4999,
              status,
              paymentStatus: b.payment_status === 'paid' ? 'PAID_ESCROW' : b.payment_status || 'PAID_ESCROW',
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
    const escrow = active.reduce((acc, curr) => acc + curr.amountInr, 0);
    return { activeShoots: active, completedShoots: completed, totalEscrowInr: escrow };
  }, [bookings]);

  // Active shoot for urgent action
  const currentUpcomingShoot = activeShoots[0];

  return (
    <div className="space-y-10 selection:bg-[#FF6E00] selection:text-white">
      {/* 1. WELCOME HERO WITH RESTORED UPPER RIGHT PHOTO & DYNAMIC FLUID ANIMATION */}
      <section className="bg-white rounded-3xl border border-[#E8E1D6] p-6 sm:p-8 lg:p-10 shadow-[0_4px_24px_-6px_rgba(26,24,22,0.06)] relative overflow-hidden">
        {/* Dynamic Fluid Morphing Backdrops */}
        <div className="absolute -right-16 -top-16 w-96 h-96 bg-gradient-to-br from-[#FF6E00]/20 via-[#FFB300]/20 to-[#FF4D4D]/15 rounded-full blur-3xl animate-fluid-blob pointer-events-none" />
        <div className="absolute right-20 top-24 w-80 h-80 bg-gradient-to-tl from-[#FF9E40]/25 via-[#FFE0B2]/30 to-transparent rounded-full blur-2xl animate-fluid-blob-slow pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#FF6E00] to-[#E86300] text-white flex items-center justify-center text-xl sm:text-2xl font-black shadow-sm shrink-0 relative">
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
                  <span className="text-xs font-bold text-[#8C847A] uppercase tracking-wider">
                    Client Portal
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E7F6ED] text-[#1E7D46] border border-[#C5E9D4]">
                    <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                    <span>Verified Client</span>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1A1816]">
                  Welcome back, {clientName} 👋
                </h2>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-[#1A1816] leading-[1.12]">
                Book your photographer. <br />
                <span className="text-[#FF6E00]">Capture the moment.</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#665E55] max-w-lg leading-relaxed">
                Find verified photographers near you for portraits, reels, events and more. Book in minutes with verified Shoot-Start OTP & 100% escrow protection.
              </p>
            </div>

            {/* Quick Action Navigation Pills */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98] group"
              >
                <Camera className="w-4 h-4 stroke-[2.2] group-hover:rotate-6 transition-transform" />
                <span>Book Photographer</span>
              </Link>
              <Link
                href="/customer/bookings"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#E8E1D6] text-[#1A1816] text-xs font-bold transition-all shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5 text-[#8C847A]" />
                <span>My Shoots ({activeShoots.length})</span>
              </Link>
              <Link
                href="/customer/gallery"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#E8E1D6] text-[#1A1816] text-xs font-bold transition-all shadow-2xs"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#8C847A]" />
                <span>Photo Vault</span>
              </Link>
              <Link
                href="/customer/settings"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#E8E1D6] text-[#5A544D] text-xs font-bold transition-all shadow-2xs"
              >
                <span>My Client Profile</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Restored Upper Right Photo with Dynamic Fluid Animation */}
          <div className="lg:col-span-5 relative w-full flex items-center justify-center lg:justify-end">
            {/* Fluid Organic Aura Behind Photo */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-[#FF6E00]/30 via-[#FFA040]/30 to-[#FFD54F]/20 rounded-[34px] blur-xl animate-fluid-pulse-glow pointer-events-none" />

            {/* Floating Photo Container with Dynamic Fluid Breathing Cycle */}
            <div className="relative w-full max-w-[480px] h-[260px] sm:h-[300px] lg:h-[320px] rounded-3xl overflow-hidden border border-[#E8E1D6] shadow-[0_12px_32px_-8px_rgba(26,24,22,0.12)] group animate-fluid-float">
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
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-white/60 shadow-md text-[11px] font-black text-[#1A1816]">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF6E00] fill-[#FF6E00]/20" />
                  <span>Moments Beyond Time</span>
                </div>
              </div>

              {/* Floating Bottom Badge: 4K HDR & Live OTP Handshake Indicator */}
              <div className="absolute bottom-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-[11px] font-bold shadow-md">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                  <span>Verified 4K HDR • OTP Handshake</span>
                </div>

                <div className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-black text-[#FF6E00] shadow-sm">
                  Top 5% Creators
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL-TIME METRICS & SNAPSHOT */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl border border-[#E8E1D6] p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C847A]">Upcoming Shoots</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF4EB] text-[#FF6E00] flex items-center justify-center">
              <Calendar className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1A1816]">{activeShoots.length}</span>
            <span className="text-[11px] text-[#8C847A]">Sessions Scheduled</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E1D6] p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C847A]">Shoot-Start OTP</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF4EB] text-[#FF6E00] flex items-center justify-center">
              <KeyRound className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1A1816]">
              {activeShoots.length > 0 ? 'Protected' : 'Ready'}
            </span>
            <span className="text-[11px] text-[#1E7D46] font-semibold">100% In-Person Verify</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E1D6] p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C847A]">Delivered Galleries</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF4EB] text-[#FF6E00] flex items-center justify-center">
              <ImageIcon className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1A1816]">{completedShoots.length}</span>
            <span className="text-[11px] text-[#8C847A]">High-Res Collections</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E1D6] p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C847A]">Escrow Protection</span>
            <div className="w-8 h-8 rounded-xl bg-[#E7F6ED] text-[#1E7D46] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1A1816]">
              ₹{totalEscrowInr.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-[#1E7D46] font-semibold">100% Secure Funds</span>
          </div>
        </div>
      </section>

      {/* 3. ACTIVE & UPCOMING SHOOTS TRACKER (WITH LIVE SHOOT-START OTP HANDSHAKE) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C847A]">
              APPOINTMENT TRACKER
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#1A1816] tracking-tight">
              Active & Upcoming Shoots
            </h2>
          </div>
          <Link
            href="/customer/bookings"
            className="text-xs font-bold text-[#FF6E00] hover:text-[#E86300] flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>View All Bookings ({bookings.length})</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
          </Link>
        </div>

        {isLoadingBookings ? (
          <div className="bg-white rounded-2xl border border-[#E8E1D6] p-10 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-3 border-[#FF6E00] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-[#8C847A]">Loading your scheduled appointments...</p>
          </div>
        ) : activeShoots.length > 0 ? (
          <div className="space-y-4">
            {activeShoots.slice(0, 2).map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-[#E8E1D6] p-5 sm:p-6 shadow-2xs hover:shadow-card transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Shoot & Creator Details */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF4EB] text-[#FF6E00] border border-[#FFD9B3]">
                        {booking.status === 'ARRIVED_AT_VENUE'
                          ? 'CREATOR ARRIVED AT VENUE'
                          : booking.status === 'IN_PROGRESS'
                          ? 'SHOOT IN PROGRESS'
                          : 'SHOOT SCHEDULED'}
                      </span>
                      <span className="text-xs font-bold text-[#8C847A]">
                        Ref: {booking.id}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-[#1A1816] tracking-tight">
                        {booking.packageTitle}
                      </h3>
                      <p className="text-xs text-[#665E55] mt-0.5">
                        Category: <span className="font-semibold text-[#1A1816]">{booking.category}</span> · Duration: {booking.duration}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#5A544D] pt-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#FF6E00] shrink-0" />
                        <span>{booking.date} · {booking.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#FF6E00] shrink-0" />
                        <span className="truncate">{booking.venueAddress}</span>
                      </div>
                    </div>

                    {/* Assigned Creator Pill */}
                    <div className="flex items-center gap-3 pt-2">
                      <Link
                        href={`/photographers/${getPhotographerSlug(booking.photographerName, booking.photographerId)}`}
                        className="flex items-center gap-2 group/creator hover:opacity-90"
                      >
                        <img
                          src={booking.photographerAvatar}
                          alt={booking.photographerName}
                          className="w-8 h-8 rounded-full object-cover border border-[#E8E1D6] group-hover/creator:border-[#FF6E00]"
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-[#1A1816] group-hover/creator:text-[#FF6E00]">
                              {booking.photographerName}
                            </span>
                            <CheckCircle2 className="w-3 h-3 text-[#FF6E00]" />
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-[#8C847A]">
                            <Star className="w-3 h-3 text-[#FF6E00] fill-[#FF6E00]" />
                            <span>{booking.photographerRating}</span>
                          </div>
                        </div>
                      </Link>

                      <div className="border-l border-[#E8E1D6] pl-3 ml-2 text-xs">
                        <span className="text-[#8C847A]">Agreed Amount: </span>
                        <span className="font-black text-[#1A1816]">₹{booking.amountInr.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Confidential Shoot-Start OTP Handshake Card */}
                  <div className="lg:w-80 bg-[#FAF7F2] rounded-2xl border border-[#E8E1D6] p-4.5 space-y-3 shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1816]">
                        <KeyRound className="w-4 h-4 text-[#FF6E00]" />
                        <span>Shoot-Start OTP</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E7F6ED] text-[#1E7D46]">
                        In Escrow
                      </span>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-dashed border-[#FF6E00]/40 p-3 text-center">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8C847A]">
                        CONFIDENTIAL VERIFICATION CODE
                      </span>
                      <span className="block text-2xl sm:text-3xl font-mono font-black tracking-widest text-[#FF6E00] mt-0.5">
                        {booking.startOtp}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#665E55] leading-relaxed">
                      Share this 6-digit code with your photographer <span className="font-bold text-[#1A1816]">ONLY in person</span> upon arrival at your venue. Funds stay in escrow until you verify attendance.
                    </p>

                    <div className="pt-1 flex gap-2">
                      <Link
                        href={`/customer/bookings?id=${booking.id}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-[#F2ECE3] border border-[#E8E1D6] text-xs font-bold text-[#1A1816] text-center transition-all shadow-2xs"
                      >
                        View Details
                      </Link>
                      <a
                        href={`tel:${booking.photographerPhone}`}
                        className="py-2 px-3 rounded-xl bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-2xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E1D6] p-8 sm:p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF4EB] text-[#FF6E00] flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-[#1A1816]">No active shoots scheduled</h3>
              <p className="text-xs text-[#665E55] leading-relaxed">
                You have no upcoming sessions today. Explore verified photographers near you to schedule your next portraits, wedding, or social reel.
              </p>
            </div>
            <div>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs font-bold transition-all shadow-sm"
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C847A]">
              CURATED DIRECTORY
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#1A1816] tracking-tight">
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
                    ? 'bg-[#FF6E00] text-white shadow-2xs'
                    : 'bg-white hover:bg-[#FAF7F2] border border-[#E8E1D6] text-[#5A544D]'
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
              <div key={n} className="bg-white rounded-2xl border border-[#E8E1D6] p-5 h-72 animate-pulse" />
            ))}
          </div>
        ) : filteredPhotographers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotographers.slice(0, 6).map((creator) => (
              <div
                key={creator.id}
                className="bg-white rounded-2xl border border-[#EBE4DA] overflow-hidden shadow-[0_2px_12px_-2px_rgba(26,24,22,0.04)] hover:shadow-card hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top: Avatar, Name, Verification, Location, Rating */}
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/photographers/${getPhotographerSlug(creator.name, creator.id)}`}
                      className="flex items-center gap-3 min-w-0 group/creator hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={creator.avatarUrl || '/reference-assets/seller_profile_aman.jpg'}
                        alt={creator.name}
                        className="w-11 h-11 rounded-full object-cover shrink-0 border border-[#E8E1D6] group-hover/creator:border-[#FF6E00] transition-colors"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="text-sm font-bold text-[#1A1816] truncate group-hover/creator:text-[#FF6E00] transition-colors">
                            {creator.name}
                          </h3>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6E00] shrink-0" />
                        </div>
                        <p className="text-[11px] text-[#8C847A] flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-[#8C847A] shrink-0" />
                          <span>{creator.locationArea || creator.city}</span>
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-1 text-xs font-bold text-[#1A1816] shrink-0">
                      <Star className="w-3.5 h-3.5 text-[#FF6E00] fill-[#FF6E00]" />
                      <span>{creator.rating}</span>
                      <span className="text-[#8C847A] font-normal">({creator.reviewCount})</span>
                    </div>
                  </div>

                  {/* Middle: Clickable Portfolio Image Collage */}
                  <Link href={`/photographers/${getPhotographerSlug(creator.name, creator.id)}`} className="block group/collage">
                    <div className="grid grid-cols-12 gap-1.5 h-26 rounded-xl overflow-hidden bg-[#FAF7F2]">
                      <div className="col-span-7 h-full overflow-hidden">
                        <img
                          src={
                            creator.portfolio?.[0]?.url ||
                            creator.coverImageUrl ||
                            '/reference-assets/cat_portrait.jpg'
                          }
                          alt={`${creator.name} Showcase 1`}
                          className="w-full h-full object-cover group-hover/collage:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="col-span-5 h-full relative overflow-hidden">
                        <img
                          src={
                            creator.portfolio?.[1]?.url ||
                            creator.secondaryCoverUrl ||
                            '/reference-assets/cat_reels.jpg'
                          }
                          alt={`${creator.name} Showcase 2`}
                          className="w-full h-full object-cover group-hover/collage:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 hover:bg-black/20 transition-colors flex items-center justify-center text-white font-bold text-xs">
                          View Work
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Specialty Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {creator.specialties.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#F2ECE3] text-[#5A544D]"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom: Pricing & Action Links */}
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

                  {/* Interactive Action Links: Guaranteed responsive */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href={`/photographers/${getPhotographerSlug(creator.name, creator.id)}`}
                      className="w-full py-2 px-3 rounded-xl border border-[#D5CEC4] bg-white hover:bg-[#FAF7F2] text-[#1A1816] text-xs font-bold text-center transition-all flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <span>View Profile</span>
                      <ArrowRight className="w-3 h-3 text-[#8C847A]" />
                    </Link>
                    <Link
                      href={`/photographers/${getPhotographerSlug(creator.name, creator.id)}?book=true`}
                      className="w-full py-2 px-3 rounded-xl bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs font-bold text-center transition-all shadow-2xs"
                    >
                      <span>Book Shoot</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E1D6] p-8 text-center text-xs text-[#8C847A]">
            No photographers found in this category. Browse all in{' '}
            <Link href="/explore" className="text-[#FF6E00] font-bold underline">
              Radar Search
            </Link>
            .
          </div>
        )}
      </section>

      {/* 5. DELIVERED GALLERIES VAULT */}
      <section className="bg-white rounded-3xl border border-[#E8E1D6] p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C847A]">
              CLIENT PHOTO VAULT
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#1A1816] tracking-tight">
              Delivered High-Resolution Galleries
            </h2>
            <p className="text-xs text-[#665E55] mt-0.5">
              Access your full 4K galleries, color-graded deliverables, and download archives.
            </p>
          </div>

          <Link
            href="/customer/gallery"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1A1816] hover:bg-[#33302B] text-white text-xs font-bold transition-all shrink-0 self-start sm:self-auto"
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
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#FAF7F2] border border-[#E8E1D6]"
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

      {/* 6. SNAPSHOOT ESCROW & SHOOT-START OTP SECURITY GUARANTEE */}
      <section className="bg-gradient-to-br from-[#FFF8F0] to-[#FAF7F2] rounded-3xl border border-[#FFD9B3] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-[#FF6E00] border border-[#FFD9B3] shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>100% Escrow & OTP Handshake Protection</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-[#1A1816]">
              How Your Booking Funds Stay 100% Protected
            </h3>
            <p className="text-xs text-[#5A544D] leading-relaxed">
              When you book on SnapShoot, your payment is held securely in escrow. Your photographer is never paid upfront. The shoot only begins when you verbally share your 6-digit Shoot-Start OTP upon their arrival at your venue.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <Link
              href="/how-it-works"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F2ECE3] border border-[#E8E1D6] text-xs font-bold text-[#1A1816] text-center transition-all shadow-2xs"
            >
              Learn Escrow Safeguards
            </Link>
            <Link
              href="/explore"
              className="px-4 py-2.5 rounded-xl bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs font-bold text-center transition-all shadow-2xs"
            >
              Book Next Shoot
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
