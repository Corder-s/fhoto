'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  BarChart3,
  Users,
  Eye,
  Camera,
  Share2,
  Edit3,
  ArrowRight,
  ChevronRight,
  Plus,
  ExternalLink,
  Crown,
  Lightbulb,
  X,
  AlertCircle,
  Check,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import {
  INITIAL_PHOTOGRAPHER_PROFILE,
  INITIAL_BOOKINGS,
  PhotographerBooking,
  PhotographerProfile
} from '../../data/photographerDashboardData';

export const SellerDashboardView: React.FC = () => {
  const { user } = useAuth();
  const [profile] = useState<PhotographerProfile>(INITIAL_PHOTOGRAPHER_PROFILE);
  const [bookings, setBookings] = useState<PhotographerBooking[]>(INITIAL_BOOKINGS);
  const [copiedToast, setCopiedToast] = useState(false);
  const [proTipDismissed, setProTipDismissed] = useState(false);
  const [selectedRange, setSelectedRange] = useState('Last 6 Months');
  const [acceptedBookings, setAcceptedBookings] = useState<Record<string, boolean>>({});

  // Display name
  const displayName = user?.name || profile.name || 'Aman Sharma';

  // Handle share profile
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.origin + '/photographers/pro-aman');
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  // Handle accept booking
  const handleAcceptBooking = (id: string) => {
    setAcceptedBookings((prev) => ({ ...prev, [id]: true }));
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'CONFIRMED' } : b))
    );
  };

  // Recent booking requests mock data for view
  const recentRequests = [
    {
      id: 'req-1',
      title: 'Wedding Photography',
      clients: 'Riya & Karan',
      dateLocation: 'Oct 12, 2024 • Greater Noida',
      amount: '₹35,000',
      avatar: '/reference-assets/auth_polaroid_couple.jpg',
      isNew: true,
    },
    {
      id: 'req-2',
      title: 'Pre-Wedding Shoot',
      clients: 'Mehak Gupta',
      dateLocation: 'Oct 18, 2024 • Noida',
      amount: '₹18,500',
      avatar: '/reference-assets/cat_couple.jpg',
      isNew: true,
    },
    {
      id: 'req-3',
      title: 'Portrait Session',
      clients: 'Aarav Mehta',
      dateLocation: 'Oct 20, 2024 • Delhi',
      amount: '₹9,500',
      avatar: '/reference-assets/auth_polaroid_portrait.jpg',
      isNew: true,
    },
  ];

  // Today's schedule mock items
  const todaySchedule = [
    {
      id: 'sch-1',
      time: '09:00 AM - 11:00 AM',
      title: 'Pre-Wedding Shoot',
      subtitle: 'Rohan & Sneha',
      location: 'Botanical Garden, Noida',
      avatar: '/reference-assets/auth_polaroid_couple.jpg',
      dotColor: 'bg-[#FF6E00]',
    },
    {
      id: 'sch-2',
      time: '01:00 PM - 03:00 PM',
      title: 'Portrait Session',
      subtitle: 'Corporate Headshots',
      location: 'DLF, Noida',
      avatar: '/reference-assets/auth_polaroid_child.jpg',
      dotColor: 'bg-emerald-500',
    },
    {
      id: 'sch-3',
      time: '05:00 PM - 08:00 PM',
      title: 'Wedding Ceremony',
      subtitle: 'Vikram & Aditi',
      location: 'The Grand Venue, Greater Noida',
      avatar: '/reference-assets/cat_events.jpg',
      dotColor: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed top-24 right-8 z-50 bg-[#1A1816] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Public profile link copied to clipboard!</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TOP ROW: WELCOME BANNER & PROFILE CARD                  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* WELCOME BANNER (8 Cols) */}
        <div className="lg:col-span-8 relative rounded-3xl bg-[#FFF8F2] border border-[#FFDFC6] p-6 sm:p-8 overflow-hidden flex flex-col justify-between shadow-2xs">
          {/* Photographer background image right side */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-5/12 bg-cover bg-center pointer-events-none opacity-90 hidden sm:block"
            style={{
              backgroundImage: 'url(/reference-assets/seller_banner_photographer.jpg)',
              maskImage: 'linear-gradient(to right, transparent, black 40%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%)',
            }}
          />

          {/* Script Quote in Top Right of Photo */}
          <div className="hidden sm:block absolute right-6 top-6 z-10 font-script text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] text-xl font-bold leading-tight rotate-[-4deg] text-right">
            Good
            <br />
            Photos
            <br />
            Brighter
            <br />
            Stories
            <br />
            <span className="text-lg">♡</span>
          </div>

          <div className="relative z-10 max-w-md space-y-2">
            <span className="text-sm font-semibold text-[#8C847A]">Welcome back,</span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1A1816] tracking-tight">
              {displayName}! <span className="inline-block animate-wave">👋</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#736B63] font-medium">
              Capture more moments. Grow your business.
            </p>
          </div>

          {/* 4 Stat Badges Row */}
          <div className="relative z-10 pt-6 mt-6 border-t border-[#F3E7DC] flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E2D8] text-xs font-bold text-[#1A1816] shadow-2xs">
              <Star className="w-3.5 h-3.5 fill-[#FF6E00] text-[#FF6E00]" />
              <span>4.9</span>
              <span className="text-[10px] text-[#8C847A] font-medium">Rating</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E2D8] text-xs font-bold text-[#1A1816] shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-[#FF6E00]" />
              <span>128</span>
              <span className="text-[10px] text-[#8C847A] font-medium">Total Bookings</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E2D8] text-xs font-bold text-[#1A1816] shadow-2xs">
              <Users className="w-3.5 h-3.5 text-[#FF6E00]" />
              <span>320+</span>
              <span className="text-[10px] text-[#8C847A] font-medium">Happy Clients</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E2D8] text-xs font-bold text-[#1A1816] shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-[#FF6E00]" />
              <span>2+ Years</span>
              <span className="text-[10px] text-[#8C847A] font-medium">On SnapShoot</span>
            </div>
          </div>
        </div>

        {/* PROFILE CARD (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-4">
              <img
                src="/reference-assets/seller_profile_aman.jpg"
                alt="Aman Sharma"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#FFE8D6] shadow-xs shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-[#1A1816] truncate">{displayName}</h3>
                  <Link
                    href="/photographer/settings"
                    className="p-1 rounded-lg hover:bg-[#F2ECE3] text-[#8C847A] hover:text-[#1A1816] transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <p className="text-xs text-[#736B63] font-medium truncate mt-0.5">
                  Wedding & Portrait Photographer
                </p>
                <p className="text-[11px] text-[#8C847A] flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-[#FF6E00] shrink-0" />
                  <span className="truncate">Greater Noida, Uttar Pradesh</span>
                </p>
              </div>
            </div>

            {/* Verification Badge */}
            <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Photographer</span>
            </div>

            {/* Profile 4 Metrics Grid */}
            <div className="grid grid-cols-4 gap-2 text-center pt-4 mt-4 border-t border-[#F2ECE3]">
              <div>
                <p className="text-xs font-black text-[#1A1816]">4.9 ★</p>
                <p className="text-[10px] text-[#8C847A]">(86 reviews)</p>
              </div>
              <div>
                <p className="text-xs font-black text-[#1A1816]">128</p>
                <p className="text-[10px] text-[#8C847A]">Bookings</p>
              </div>
              <div>
                <p className="text-xs font-black text-[#1A1816]">2+</p>
                <p className="text-[10px] text-[#8C847A]">Years</p>
              </div>
              <div>
                <p className="text-xs font-black text-[#1A1816]">95%</p>
                <p className="text-[10px] text-[#8C847A]">Response rate</p>
              </div>
            </div>
          </div>

          {/* Profile CTA buttons */}
          <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[#F2ECE3]">
            <Link
              href="/photographers/pro-aman"
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#FFF8F2] hover:bg-[#FFEEDF] border border-[#FFD4A8] text-[#FF6E00] text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Public Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleShare}
              title="Share profile"
              className="p-2.5 rounded-xl border border-[#E8E2D8] hover:bg-[#FAF7F2] text-[#8C847A] hover:text-[#1A1816] transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4 BUSINESS KPI CARDS ROW                                 */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: New Booking Requests */}
        <Link
          href="/photographer/bookings"
          className="group bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-2xs hover:border-[#FF6E00] transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="w-9 h-9 rounded-xl bg-[#FFF2E8] border border-[#FFDFC6] text-[#FF6E00] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-[#1A1816] pt-1">12</p>
            <p className="text-xs text-[#736B63] font-medium">New Booking Requests</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8C847A] group-hover:text-[#FF6E00] group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* KPI 2: Upcoming Shoots */}
        <Link
          href="/photographer/bookings"
          className="group bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-2xs hover:border-emerald-500 transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-[#1A1816] pt-1">8</p>
            <p className="text-xs text-[#736B63] font-medium">Upcoming Shoots</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8C847A] group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* KPI 3: This Month Earnings */}
        <Link
          href="/photographer/earnings"
          className="group bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-2xs hover:border-blue-500 transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <span className="font-bold text-sm">₹</span>
            </div>
            <p className="text-2xl font-black text-[#1A1816] pt-1">₹48,250</p>
            <p className="text-xs text-[#736B63] font-medium">This Month Earnings</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8C847A] group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* KPI 4: Profile Views */}
        <Link
          href="/photographer/analytics"
          className="group bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-2xs hover:border-purple-500 transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-[#1A1816] pt-1">+24%</p>
            <p className="text-xs text-[#736B63] font-medium">Profile Views</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8C847A] group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* ======================================================== */}
      {/* MIDDLE SECTION: EARNINGS CHART, BOOKING REQUESTS, TODAY */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: EARNINGS OVERVIEW & RECENT BOOKING REQUESTS (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* EARNINGS OVERVIEW BAR CHART */}
          <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFF2E8] text-[#FF6E00] flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1A1816]">Earnings Overview</h3>
                  <p className="text-xs text-[#736B63]">Track your income and growth</p>
                </div>
              </div>

              <select
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#E8E2D8] text-xs font-bold text-[#1A1816] bg-[#FAF7F2] outline-none cursor-pointer"
              >
                <option value="Last 6 Months">Last 6 Months</option>
                <option value="Last 3 Months">Last 3 Months</option>
                <option value="This Year">This Year</option>
              </select>
            </div>

            {/* Interactive Bar Chart Visualization */}
            <div className="relative pt-8 pb-2">
              {/* June 2024 Tooltip */}
              <div className="absolute right-[8%] top-0 -translate-x-1/2 bg-[#1A1816] text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md text-center">
                <span className="block text-xs font-black text-[#FF6E00]">₹1,24,500</span>
                <span className="text-[9px] text-[#A69F96]">June 2024</span>
              </div>

              {/* Y Axis Grid lines */}
              <div className="space-y-6 text-[10px] text-[#A69F96] font-semibold">
                <div className="flex items-center gap-3">
                  <span className="w-10 text-right">₹1.5L</span>
                  <div className="flex-1 border-b border-[#F2ECE3] border-dashed" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 text-right">₹1L</span>
                  <div className="flex-1 border-b border-[#F2ECE3] border-dashed" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 text-right">₹50K</span>
                  <div className="flex-1 border-b border-[#F2ECE3] border-dashed" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 text-right">0</span>
                  <div className="flex-1 border-b border-[#E8E2D8]" />
                </div>
              </div>

              {/* Bar Columns Container */}
              <div className="absolute inset-x-0 bottom-6 pl-14 pr-4 flex items-end justify-between h-36">
                {/* Jan */}
                <div className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-6 sm:w-10 rounded-t-lg bg-gradient-to-t from-[#FF8526] to-[#FFAA66] h-[35%] transition-all group-hover:brightness-95" />
                  <span className="text-[11px] font-bold text-[#736B63]">Jan</span>
                </div>

                {/* Feb */}
                <div className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-6 sm:w-10 rounded-t-lg bg-gradient-to-t from-[#FF8526] to-[#FFAA66] h-[50%] transition-all group-hover:brightness-95" />
                  <span className="text-[11px] font-bold text-[#736B63]">Feb</span>
                </div>

                {/* Mar */}
                <div className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-6 sm:w-10 rounded-t-lg bg-gradient-to-t from-[#FF8526] to-[#FFAA66] h-[65%] transition-all group-hover:brightness-95" />
                  <span className="text-[11px] font-bold text-[#736B63]">Mar</span>
                </div>

                {/* Apr */}
                <div className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-6 sm:w-10 rounded-t-lg bg-gradient-to-t from-[#FF8526] to-[#FFAA66] h-[60%] transition-all group-hover:brightness-95" />
                  <span className="text-[11px] font-bold text-[#736B63]">Apr</span>
                </div>

                {/* May */}
                <div className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-6 sm:w-10 rounded-t-lg bg-gradient-to-t from-[#FF8526] to-[#FFAA66] h-[75%] transition-all group-hover:brightness-95" />
                  <span className="text-[11px] font-bold text-[#736B63]">May</span>
                </div>

                {/* Jun */}
                <div className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-6 sm:w-10 rounded-t-lg bg-gradient-to-t from-[#E86300] to-[#FF6E00] h-[92%] shadow-md transition-all group-hover:brightness-95" />
                  <span className="text-[11px] font-bold text-[#1A1816]">Jun</span>
                </div>
              </div>
            </div>
          </div>

          {/* RECENT BOOKING REQUESTS */}
          <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#FFF2E8] text-[#FF6E00] flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-base font-black text-[#1A1816]">Recent Booking Requests</h3>
              </div>
              <Link
                href="/photographer/bookings"
                className="text-xs font-bold text-[#FF6E00] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-2xl border border-[#F2ECE3] hover:border-[#E8E2D8] bg-[#FAF7F2]/60 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={req.avatar}
                      alt={req.clients}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#E8E2D8]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-[#1A1816]">{req.title}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFE8D6] text-[#FF6E00]">
                          New
                        </span>
                      </div>
                      <p className="text-xs text-[#736B63] font-medium">{req.clients}</p>
                      <p className="text-[11px] text-[#8C847A]">{req.dateLocation}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link
                      href="/photographer/bookings"
                      className="px-3.5 py-1.5 rounded-xl border border-[#E8E2D8] text-xs font-bold text-[#1A1816] hover:bg-[#F2ECE3] transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleAcceptBooking(req.id)}
                      disabled={acceptedBookings[req.id]}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        acceptedBookings[req.id]
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#FF6E00] hover:bg-[#E86300] text-white shadow-2xs'
                      }`}
                    >
                      {acceptedBookings[req.id] ? 'Accepted ✓' : 'Accept'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TODAY'S SCHEDULE & CLIENT REVIEWS (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* TODAY'S SCHEDULE TIMELINE */}
          <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#FFF2E8] text-[#FF6E00] flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-base font-black text-[#1A1816]">Today's Schedule</h3>
              </div>
              <Link
                href="/photographer/bookings"
                className="text-xs font-bold text-[#FF6E00] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8E2D8]">
              {todaySchedule.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-white ${item.dotColor} shadow-xs`}
                  />

                  <div className="flex items-start gap-3">
                    <img
                      src={item.avatar}
                      alt={item.title}
                      className="w-11 h-11 rounded-xl object-cover shrink-0 border border-[#E8E2D8]"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-[#8C847A] block">
                        {item.time}
                      </span>
                      <h4 className="text-xs font-bold text-[#1A1816] truncate">{item.title}</h4>
                      <p className="text-[11px] text-[#736B63] truncate">{item.subtitle}</p>
                      <p className="text-[10px] text-[#A69F96] truncate flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-[#FF6E00] shrink-0" />
                        <span>{item.location}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CLIENT REVIEWS */}
          <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#FF6E00] fill-[#FF6E00]" />
                <h3 className="text-base font-black text-[#1A1816]">Client Reviews</h3>
              </div>
              <Link
                href="/photographer/reviews"
                className="text-xs font-bold text-[#FF6E00] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Testimonial Box */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#F2ECE3] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/reference-assets/avatar_riya.jpg"
                    alt="Riya Sharma"
                    className="w-8 h-8 rounded-full object-cover border border-[#E8E2D8]"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-[#1A1816]">Riya Sharma</h5>
                    <div className="flex text-[#FF6E00] text-[10px]">
                      {'★'.repeat(5)}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-[#8C847A] font-medium">Sep 15, 2024</span>
              </div>
              <p className="text-xs text-[#5A544D] leading-relaxed italic">
                "Aman is an amazing photographer! He made our wedding day so special. Highly recommended!"
              </p>
            </div>

            {/* Carousel navigation dots */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button className="text-[#8C847A] hover:text-[#1A1816] p-1">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="w-2 h-2 rounded-full bg-[#FF6E00]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#E0D8CB]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#E0D8CB]" />
              <button className="text-[#8C847A] hover:text-[#1A1816] p-1">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BOTTOM ROW: PORTFOLIO HIGHLIGHTS & TOP SERVICES         */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* PORTFOLIO HIGHLIGHTS (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#FF6E00]" />
                <h3 className="text-base font-black text-[#1A1816]">Portfolio Highlights</h3>
              </div>
              <Link
                href="/photographer/portfolio"
                className="text-xs font-bold text-[#FF6E00] hover:underline flex items-center gap-1"
              >
                <span>Manage Portfolio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-5 gap-2.5">
              <img
                src="/reference-assets/auth_polaroid_couple.jpg"
                alt="Portfolio 1"
                className="w-full aspect-square rounded-xl object-cover border border-[#E8E2D8] hover:scale-105 transition-transform"
              />
              <img
                src="/reference-assets/auth_polaroid_portrait.jpg"
                alt="Portfolio 2"
                className="w-full aspect-square rounded-xl object-cover border border-[#E8E2D8] hover:scale-105 transition-transform"
              />
              <img
                src="/reference-assets/cat_couple.jpg"
                alt="Portfolio 3"
                className="w-full aspect-square rounded-xl object-cover border border-[#E8E2D8] hover:scale-105 transition-transform"
              />
              <img
                src="/reference-assets/auth_polaroid_mountain.jpg"
                alt="Portfolio 4"
                className="w-full aspect-square rounded-xl object-cover border border-[#E8E2D8] hover:scale-105 transition-transform"
              />
              <Link
                href="/photographer/portfolio"
                className="w-full aspect-square rounded-xl border-2 border-dashed border-[#D4C9BC] hover:border-[#FF6E00] hover:bg-[#FFF8F2] flex flex-col items-center justify-center text-[#8C847A] hover:text-[#FF6E00] transition-colors group cursor-pointer"
              >
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold mt-1">Add Photos</span>
              </Link>
            </div>
          </div>
        </div>

        {/* TOP SERVICES (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FF6E00]" />
                <h3 className="text-base font-black text-[#1A1816]">Top Services</h3>
              </div>
              <Link
                href="/photographer/services"
                className="text-xs font-bold text-[#FF6E00] hover:underline flex items-center gap-1"
              >
                <span>Manage Packages</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {/* Service 1 */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#1A1816] mb-1">
                  <span>Wedding Photography</span>
                  <span>40%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#F2ECE3] overflow-hidden">
                  <div className="h-full rounded-full bg-[#FF6E00] w-[40%]" />
                </div>
              </div>

              {/* Service 2 */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#1A1816] mb-1">
                  <span>Pre-Wedding Shoot</span>
                  <span>25%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#F2ECE3] overflow-hidden">
                  <div className="h-full rounded-full bg-[#FF6E00] w-[25%]" />
                </div>
              </div>

              {/* Service 3 */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#1A1816] mb-1">
                  <span>Portrait Session</span>
                  <span>20%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#F2ECE3] overflow-hidden">
                  <div className="h-full rounded-full bg-[#FF6E00] w-[20%]" />
                </div>
              </div>

              {/* Service 4 */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#1A1816] mb-1">
                  <span>Event Photography</span>
                  <span>10%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#F2ECE3] overflow-hidden">
                  <div className="h-full rounded-full bg-[#FF6E00] w-[10%]" />
                </div>
              </div>

              {/* Service 5 */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#1A1816] mb-1">
                  <span>Maternity Shoot</span>
                  <span>5%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#F2ECE3] overflow-hidden">
                  <div className="h-full rounded-full bg-[#FF6E00] w-[5%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BOTTOM INFO CARDS: SUBSCRIPTION, ANALYTICS, PRO TIP     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SUBSCRIPTION CARD */}
        <Link
          href="/photographer/subscription"
          className="group bg-white rounded-2xl border border-[#E8E2D8] p-4 shadow-2xs hover:border-[#FF6E00] transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#736B63] font-medium">Your Subscription</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700">
                  Active
                </span>
              </div>
              <h4 className="text-sm font-black text-[#1A1816]">Pro Plan</h4>
              <p className="text-[10px] text-[#8C847A]">Valid till 15 Aug 2025</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8C847A] group-hover:text-[#FF6E00] group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* PROFILE PERFORMANCE */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] p-4 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF2E8] border border-[#FFDFC6] text-[#FF6E00] flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1A1816]">Profile Performance</h4>
              <p className="text-[11px] text-[#736B63]">Your profile is performing great!</p>
            </div>
          </div>
          <Link
            href="/photographer/analytics"
            className="px-3 py-1.5 rounded-xl border border-[#E8E2D8] text-xs font-bold text-[#FF6E00] hover:bg-[#FFF8F2] transition-colors shrink-0"
          >
            View Analytics →
          </Link>
        </div>

        {/* PRO TIP */}
        {!proTipDismissed && (
          <div className="bg-[#FFFDF9] rounded-2xl border border-[#FFE9D4] p-4 shadow-2xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-[#1A1816]">Pro Tip</h5>
                <p className="text-[11px] text-[#736B63] leading-snug mt-0.5">
                  Add more portfolio photos and client reviews to get 2x more bookings!
                </p>
              </div>
            </div>
            <button
              onClick={() => setProTipDismissed(true)}
              className="text-[#8C847A] hover:text-[#1A1816] p-1 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
