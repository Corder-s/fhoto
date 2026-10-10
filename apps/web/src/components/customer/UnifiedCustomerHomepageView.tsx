'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  KeyRound,
  MapPin,
  Clock,
  Camera,
  ShieldCheck,
  Download,
  Star,
  ArrowRight,
  Plus,
  Calendar,
  Image as ImageIcon,
  User,
  Heart,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CreditCard,
  Search
} from 'lucide-react';
import { CustomerNoticeBanner } from './CustomerNoticeBanner';
import { HeroSearch, SearchFilters } from '../home/HeroSearch';
import { CategorySection } from '../home/CategorySection';
import { FeaturedPhotographersSection } from '../home/FeaturedPhotographersSection';
import { HowItWorksSection } from '../home/HowItWorksSection';
import { RecruitmentBanner } from '../home/RecruitmentBanner';
import { HomeFaqSection } from '../home/HomeFaqSection';
import { FinalCtaBanner } from '../home/FinalCtaBanner';
import {
  INITIAL_CUSTOMER_PROFILE,
  INITIAL_CUSTOMER_BOOKINGS,
  INITIAL_GALLERY_PHOTOS,
  INITIAL_NOTIFICATIONS
} from '../../data/customerDashboardData';
import { SAMPLE_PHOTOGRAPHERS, SamplePhotographer } from '../../data/photographers';
import { useAuth } from '../../lib/auth';

interface UnifiedCustomerHomepageViewProps {
  showDiscoverySections?: boolean;
}

export const UnifiedCustomerHomepageView: React.FC<UnifiedCustomerHomepageViewProps> = ({
  showDiscoverySections = true
}) => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('portraits');
  const [filteredPhotographers, setFilteredPhotographers] = useState<SamplePhotographer[]>(SAMPLE_PHOTOGRAPHERS);

  // Active Shoot for OTP Handshake
  const activeBooking = INITIAL_CUSTOMER_BOOKINGS.find(
    (b) => b.status === 'ARRIVED_AT_VENUE' || b.status === 'ON_THE_WAY'
  );
  const upcomingBookings = INITIAL_CUSTOMER_BOOKINGS.filter((b) => b.status === 'CONFIRMED');
  const completedCount = INITIAL_CUSTOMER_BOOKINGS.filter((b) => b.status === 'COMPLETED').length;

  const currentUserName = user?.name ? user.name.split(' ')[0] : INITIAL_CUSTOMER_PROFILE.name.split(' ')[0] || 'Aarav';

  const favoritePhotographers = [
    {
      id: 'pro-aman',
      name: 'Aman Sharma',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      category: 'Portraits & Lifestyle',
      location: 'Greater Noida, UP',
      rating: 4.96,
      startingPrice: 800,
    },
    {
      id: 'pro-riya',
      name: 'Riya Sharma',
      avatar: '/reference-assets/avatar_riya.jpg',
      category: 'Couples & Pre-Weddings',
      location: 'Noida, UP',
      rating: 4.8,
      startingPrice: 1200,
    },
    {
      id: 'pro-karan',
      name: 'Karan Mehta',
      avatar: '/reference-assets/avatar_karan.jpg',
      category: 'Creator Reels & Video',
      location: 'Delhi NCR',
      rating: 4.9,
      startingPrice: 1500,
    },
  ];

  // Search submission handler
  const handleSearch = (filters: SearchFilters) => {
    let result = SAMPLE_PHOTOGRAPHERS;
    if (filters.category && filters.category !== 'all') {
      result = result.filter((p) =>
        p.categories.some((c) => c.toLowerCase() === filters.category.toLowerCase())
      );
    }
    if (filters.location && filters.location.trim()) {
      const loc = filters.location.toLowerCase();
      const locationMatches = result.filter(
        (p) =>
          p.locationCity.toLowerCase().includes(loc) ||
          p.locationArea.toLowerCase().includes(loc)
      );
      if (locationMatches.length > 0) {
        result = locationMatches;
      }
    }
    if (result.length > 0) {
      setFilteredPhotographers(result);
    }
    setSelectedCategory(filters.category);

    const creatorsElement = document.getElementById('photographers-section');
    if (creatorsElement) {
      creatorsElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCategorySelect = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    const result = SAMPLE_PHOTOGRAPHERS.filter((p) =>
      p.categories.some((c) => c.toLowerCase() === categorySlug.toLowerCase())
    );
    if (result.length > 0) {
      setFilteredPhotographers(result);
    } else {
      setFilteredPhotographers(SAMPLE_PHOTOGRAPHERS);
    }

    const creatorsElement = document.getElementById('photographers-section');
    if (creatorsElement) {
      creatorsElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* ========================================================= */}
      {/* 1. DEMONSTRATION MODE NOTICE (Accurate notice preserved) */}
      {/* ========================================================= */}
      <CustomerNoticeBanner moduleName="Client Workspace Dashboard" />

      {/* ========================================================= */}
      {/* 2. COMPACT BOOKING HERO & SEARCH (RESTORED ON TOP) */}
      {/* ========================================================= */}
      <section className="relative pt-2 pb-4 space-y-6">
        {/* Top Row: Left Content & Right Photography Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[280px]">
          {/* Left Column: Eyebrow, Welcome Badge, Headline, Subtitle */}
          <div className="lg:col-span-6 space-y-4">
            {/* Eyebrow & Personalized Welcome Badge */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold bg-[#FFF4EB] text-[#FF6E00] border border-[#FFD9B3] shadow-xs">
                <span>Welcome back, {currentUserName} 👋</span>
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#8C847A] uppercase">
                REAL PEOPLE · REAL STORIES · REMARKABLE PHOTOGRAPHY
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-black tracking-tight text-[#1A1816] leading-[1.06]">
              Book your <br />
              photographer. <br />
              <span className="text-[#FF6E00]">Capture the moment.</span>
            </h1>

            {/* Subtitle Copy */}
            <p className="text-xs sm:text-sm text-[#665E55] max-w-lg leading-relaxed pt-1">
              Find verified photographers near you for portraits, reels, events and more. Book in minutes.
            </p>
          </div>

          {/* Right Column: Hero Photography Image */}
          <div className="lg:col-span-6 relative w-full h-[240px] sm:h-[300px] lg:h-[340px] flex items-center justify-end">
            <div className="relative w-full h-full max-w-[620px] rounded-3xl overflow-hidden shadow-subtle group border border-[#E8E1D6]">
              <img
                src="/reference-assets/hero_scene.jpg"
                alt="Moments Beyond Time - Photographer shooting couple"
                className="w-full h-full object-cover object-right group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#FAF7F2] to-transparent pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Bottom Row: Photographer Search & Trust Indicators (Clean, unclipped layout) */}
        <div className="pt-2">
          <HeroSearch
            onSearch={handleSearch}
            selectedCategory={selectedCategory}
          />
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. CUSTOMER QUICK ACTIONS */}
      {/* ========================================================= */}
      <section className="space-y-3 pt-4 border-t border-[#E8E1D6]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C847A]">
            Quick Actions
          </span>
          <span className="text-xs text-[#8C847A] font-medium hidden sm:inline">
            Fast shortcuts to your client portal features
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <Link
            href="/explore"
            className="p-4 sm:p-5 bg-white rounded-2xl border border-[#EBE4DA] hover:border-[#FF6E00] hover:shadow-card transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-[#FAF7F2] group-hover:bg-[#FFF4E6] flex items-center justify-center text-[#FF6E00] mb-2.5 transition-colors shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1A1816]">Find a Photographer</span>
            <span className="text-[10px] text-[#8C847A] mt-0.5">Explore local creators</span>
          </Link>

          <Link
            href="/customer/bookings"
            className="p-4 sm:p-5 bg-white rounded-2xl border border-[#EBE4DA] hover:border-[#FF6E00] hover:shadow-card transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-[#FAF7F2] group-hover:bg-[#FFF4E6] flex items-center justify-center text-[#FF6E00] mb-2.5 transition-colors shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1A1816]">View My Bookings</span>
            <span className="text-[10px] text-[#8C847A] mt-0.5">Track shoots &amp; status</span>
          </Link>

          <Link
            href="/customer/gallery"
            className="p-4 sm:p-5 bg-white rounded-2xl border border-[#EBE4DA] hover:border-[#FF6E00] hover:shadow-card transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-[#FAF7F2] group-hover:bg-[#FFF4E6] flex items-center justify-center text-[#FF6E00] mb-2.5 transition-colors shadow-xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1A1816]">Photo Gallery</span>
            <span className="text-[10px] text-[#8C847A] mt-0.5">Download high-res proofs</span>
          </Link>

          <Link
            href="/customer/settings"
            className="p-4 sm:p-5 bg-white rounded-2xl border border-[#EBE4DA] hover:border-[#FF6E00] hover:shadow-card transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-[#FAF7F2] group-hover:bg-[#FFF4E6] flex items-center justify-center text-[#FF6E00] mb-2.5 transition-colors shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1A1816]">Manage Profile</span>
            <span className="text-[10px] text-[#8C847A] mt-0.5">Preferences &amp; privacy</span>
          </Link>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. LIVE APPOINTMENT (IN PROGRESS) WITH OTP WORKFLOW */}
      {/* ========================================================= */}
      {activeBooking && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C847A]">
              Live Appointment (In Progress)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF3E6] text-[#FF6E00] border border-[#FFD9B3]">
              Photographer At Venue • Awaiting OTP
            </span>
          </div>

          <div className="bg-white rounded-3xl border-2 border-[#FF6E00]/40 shadow-card p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Shoot Details & Venue */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#8C847A]">
                  <span className="font-mono text-[#1A1816]">Ref: {activeBooking.id}</span>
                  <span>•</span>
                  <span>{activeBooking.category}</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-extrabold">₹{activeBooking.amountInr.toLocaleString('en-IN')} in Escrow</span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#1A1816]">
                    {activeBooking.packageTitle}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <img
                      src={activeBooking.photographerAvatar}
                      alt={activeBooking.photographerName}
                      className="w-8 h-8 rounded-full object-cover border border-[#E8E1D6]"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-[#1A1816]">{activeBooking.photographerName}</span>
                      <span className="text-[#8C847A] ml-2">⭐ {activeBooking.photographerRating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#665E55] flex items-center gap-1.5 mt-2">
                    <MapPin className="w-4 h-4 text-[#FF6E00] shrink-0" />
                    <span>{activeBooking.venueAddress}</span>
                  </p>
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E1D6] text-xs text-[#665E55] space-y-1">
                  <p><strong>Scheduled Slot:</strong> {activeBooking.date}, {activeBooking.timeSlot}</p>
                  <p><strong>Deliverables:</strong> {activeBooking.deliverablesSummary}</p>
                </div>

                <div className="pt-1">
                  <Link
                    href={`/customer/bookings/${activeBooking.id}`}
                    className="text-xs font-bold text-[#FF6E00] hover:underline flex items-center gap-1"
                  >
                    <span>View full booking tracking timeline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Shoot-Start OTP Keypad Display */}
              <div className="lg:col-span-5 bg-[#FAF7F2] p-6 rounded-2xl border-2 border-[#FF6E00] text-center space-y-3 shadow-sm">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#FF6E00]">
                  <KeyRound className="w-4 h-4" />
                  <span>Shoot-Start Verification OTP</span>
                </div>

                <div className="text-4xl sm:text-5xl font-mono font-black text-[#1A1816] tracking-[0.25em] bg-white py-3 rounded-xl border border-[#E8E1D6] shadow-inner">
                  {activeBooking.startOtp}
                </div>

                <p className="text-xs text-[#665E55] leading-relaxed">
                  🔒 Share this 6-digit code with photographer <strong>{activeBooking.photographerName}</strong> in person to start your session timer.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 5. BOOKING OVERVIEW SCORECARDS */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-[#EBE4DA] space-y-1 shadow-subtle">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C847A]">Upcoming Shoots</p>
          <p className="text-2xl sm:text-3xl font-black text-[#1A1816]">{upcomingBookings.length + (activeBooking ? 1 : 0)}</p>
          <p className="text-[11px] text-[#8C847A]">Scheduled in Delhi NCR</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#EBE4DA] space-y-1 shadow-subtle">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C847A]">Completed Sessions</p>
          <p className="text-2xl sm:text-3xl font-black text-[#1A1816]">{completedCount}</p>
          <p className="text-[11px] text-[#8C847A]">100% photo delivery rate</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#EBE4DA] space-y-1 shadow-subtle">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C847A]">Protected in Escrow</p>
          <p className="text-2xl sm:text-3xl font-black text-[#FF6E00]">₹10,300</p>
          <p className="text-[11px] text-[#8C847A]">Released only upon your approval</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#EBE4DA] space-y-1 shadow-subtle">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C847A]">Delivered Photos</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700">65</p>
          <Link href="/customer/gallery" className="text-[11px] font-bold text-[#FF6E00] hover:underline">
            Open Proofing Gallery →
          </Link>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. RECENT BOOKINGS & FAVORITE PHOTOGRAPHERS */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Favorite Photographers */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C847A]">
              Favorite Photographers
            </span>
            <Link href="/explore" className="text-xs font-bold text-[#FF6E00] hover:underline">
              Explore More →
            </Link>
          </div>

          <div className="space-y-3">
            {favoritePhotographers.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-white rounded-2xl border border-[#EBE4DA] hover:border-[#FF6E00]/50 hover:shadow-subtle transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="w-12 h-12 rounded-full object-cover border border-[#E8E1D6] shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-[#1A1816] truncate">{p.name}</h4>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6E00] fill-[#FF6E00]/10 shrink-0" />
                    </div>
                    <p className="text-xs text-[#8C847A] truncate">{p.category} • {p.location}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] font-semibold text-[#1A1816]">
                      <span>⭐ {p.rating}</span>
                      <span>•</span>
                      <span>From ₹{p.startingPrice}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/photographers/${p.id}`}
                  className="px-4 py-2 rounded-full text-xs font-bold text-[#1A1816] bg-[#F2ECE3] hover:bg-[#FF6E00] hover:text-white transition-all shrink-0"
                >
                  Book Again
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity & Updates */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C847A]">
              Recent Activity &amp; Updates
            </span>
            <Link href="/customer/notifications" className="text-xs font-bold text-[#FF6E00] hover:underline">
              All Updates →
            </Link>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-[#EBE4DA] space-y-4 shadow-subtle">
            {INITIAL_NOTIFICATIONS.slice(0, 3).map((item) => (
              <div key={item.id} className="space-y-1 pb-3 border-b border-[#F0EAE1] last:border-0 last:pb-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1A1816]">{item.title}</span>
                  <span className="text-[10px] text-[#8C847A]">{item.time}</span>
                </div>
                <p className="text-xs text-[#665E55] leading-relaxed">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. DISCOVERY & EXPLORE SECTIONS */}
      {/* ========================================================= */}
      {showDiscoverySections && (
        <div className="space-y-12 pt-6">
          {/* Category Section */}
          <CategorySection
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />

          {/* Featured Photographers Section */}
          <div id="photographers-section">
            <FeaturedPhotographersSection
              photographers={filteredPhotographers}
            />
          </div>

          {/* How SnapShoot Works */}
          <HowItWorksSection />

          {/* Photographer Recruitment Banner */}
          <RecruitmentBanner />

          {/* Home FAQ Section */}
          <HomeFaqSection />

          {/* Final Call to Action Banner */}
          <FinalCtaBanner />
        </div>
      )}
    </div>
  );
};
