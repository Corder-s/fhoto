'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  Package,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useCurrentUserProfile } from '../../context/UserProfileContext';

export const SellerDashboardView: React.FC = () => {
  const {
    authUser,
    profile,
    creatorProfile,
    stats,
    accountName,
    professionalName,
    displayAvatar,
    initials,
    uploadAvatar,
  } = useCurrentUserProfile();

  const avatarInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarToast, setAvatarToast] = useState<string | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|gif|jpg)$/i)) {
      alert('Please select a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB limit.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await uploadAvatar(file);
      if (res.success) {
        setAvatarToast('Profile photo updated successfully!');
        setTimeout(() => setAvatarToast(null), 3500);
      } else {
        alert(res.error || 'Failed to update profile photo.');
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading profile photo.');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const [copiedToast, setCopiedToast] = useState(false);
  const [proTipDismissed, setProTipDismissed] = useState(false);
  const [selectedRange, setSelectedRange] = useState('Last 6 Months');
  const [acceptedBookings, setAcceptedBookings] = useState<Record<string, boolean>>({});

  // Dynamic creator data from Supabase
  const [dbBookings, setDbBookings] = useState<any[]>([]);
  const [dbPortfolio, setDbPortfolio] = useState<any[]>([]);
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Guard against unselected account type: force account selection
  useEffect(() => {
    if (authUser && authUser.roleSelected === false) {
      window.location.href = '/auth/select-role';
    }
  }, [authUser]);

  useEffect(() => {
    let isCancelled = false;

    async function loadCreatorData() {
      if (!authUser?.id) return;

      try {
        setIsLoadingDetails(true);
        const [bookingsRes, portfolioRes, servicesRes] = await Promise.all([
          fetch(`/api/photographers/bookings?userId=${authUser.id}`).catch(() => null),
          fetch(`/api/photographers/portfolio?userId=${authUser.id}`).catch(() => null),
          fetch(`/api/photographers/services?userId=${authUser.id}`).catch(() => null),
        ]);

        if (isCancelled) return;

        if (bookingsRes && bookingsRes.ok) {
          const bData = await bookingsRes.json();
          if (bData.bookings) setDbBookings(bData.bookings);
        }

        if (portfolioRes && portfolioRes.ok) {
          const pData = await portfolioRes.json();
          if (pData.items) setDbPortfolio(pData.items);
        }

        if (servicesRes && servicesRes.ok) {
          const sData = await servicesRes.json();
          if (sData.services) setDbServices(sData.services);
        }
      } catch (err) {
        console.error('Error fetching creator dashboard records:', err);
      } finally {
        if (!isCancelled) setIsLoadingDetails(false);
      }
    }

    loadCreatorData();

    return () => {
      isCancelled = true;
    };
  }, [authUser?.id]);

  // Handle share profile
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const publicUrl = creatorProfile?.id
        ? `${window.location.origin}/photographers/${creatorProfile.id}`
        : `${window.location.origin}/photographer/business`;
      navigator.clipboard?.writeText(publicUrl);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  // Handle accept booking
  const handleAcceptBooking = (id: string) => {
    setAcceptedBookings((prev) => ({ ...prev, [id]: true }));
  };

  // Filter pending requests and today's schedule
  const recentRequests = dbBookings.filter(
    (b) => b.booking_status === 'pending' || b.booking_status === 'requested'
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySchedule = dbBookings.filter((b) => b.event_date === todayStr);

  if (authUser && authUser.roleSelected === false) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#FF6E00] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-[#8C847A]">Redirecting to account setup...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed top-24 right-8 z-50 bg-[#1A1816] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Public profile link copied to clipboard!</span>
        </div>
      )}
      {avatarToast && (
        <div className="fixed top-24 right-8 z-50 bg-[#1A1816] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-[#FF6E00]/40">
          <Check className="w-4 h-4 text-[#FF6E00]" />
          <span>{avatarToast}</span>
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
              {accountName}! <span className="inline-block animate-wave">👋</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#736B63] font-medium">
              Capture more moments. Grow your business.
            </p>
          </div>

          {/* 4 Stat Badges Row */}
          <div className="relative z-10 pt-6 mt-6 border-t border-[#F3E7DC] flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E2D8] text-xs font-bold text-[#1A1816] shadow-2xs">
              <Star className="w-3.5 h-3.5 fill-[#FF6E00] text-[#FF6E00]" />
              <span>{creatorProfile?.average_rating ? Number(creatorProfile.average_rating).toFixed(1) : '5.0'}</span>
              <span className="text-[10px] text-[#8C847A] font-medium">Rating</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E2D8] text-xs font-bold text-[#1A1816] shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-[#FF6E00]" />
              <span>{stats.totalBookings}</span>
              <span className="text-[10px] text-[#8C847A] font-medium">Total Bookings</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E2D8] text-xs font-bold text-[#1A1816] shadow-2xs">
              <Users className="w-3.5 h-3.5 text-[#FF6E00]" />
              <span>{stats.totalBookings > 0 ? stats.totalBookings : '0'}</span>
              <span className="text-[10px] text-[#8C847A] font-medium">Happy Clients</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E2D8] text-xs font-bold text-[#1A1816] shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-[#FF6E00]" />
              <span>{creatorProfile?.experience_years ? `${creatorProfile.experience_years}+ Years` : 'New Pro'}</span>
              <span className="text-[10px] text-[#8C847A] font-medium">On SnapShoot</span>
            </div>
          </div>
        </div>

        {/* PROFILE CARD (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-4">
              {/* Hidden File Input for Avatar Upload */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#FF6E00] text-white flex items-center justify-center text-xl font-black border-2 border-[#FFE8D6] shadow-xs shrink-0 relative group">
                <span className="select-none">{initials}</span>
                {displayAvatar && (
                  <img
                    src={displayAvatar}
                    alt={professionalName}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-[#FF6E00]" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 p-1 bg-[#1A1816]/80 hover:bg-[#FF6E00] text-white rounded-lg transition-all cursor-pointer opacity-80 group-hover:opacity-100 disabled:opacity-40"
                  title="Upload / Change profile photo"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-[#1A1816] truncate">{professionalName}</h3>
                  <Link
                    href="/photographer/business"
                    className="p-1 rounded-lg hover:bg-[#F2ECE3] text-[#8C847A] hover:text-[#1A1816] transition-colors"
                    title="Edit Studio Profile"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <p className="text-xs text-[#736B63] font-medium truncate mt-0.5">
                  {creatorProfile?.biography ? creatorProfile.biography.slice(0, 32) + '...' : 'Wedding & Portrait Photographer'}
                </p>
                <p className="text-[11px] text-[#8C847A] flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-[#FF6E00] shrink-0" />
                  <span className="truncate">
                    {creatorProfile?.city ? `${creatorProfile.city}, ${creatorProfile.state || 'India'}` : 'Delhi NCR, India'}
                  </span>
                </p>
              </div>
            </div>

            {/* Verification Badge */}
            <div
              className={`mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                creatorProfile?.verification_status === 'approved'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : creatorProfile?.verification_status === 'pending'
                  ? 'bg-amber-50 border border-amber-200 text-amber-700'
                  : 'bg-zinc-100 border border-zinc-200 text-zinc-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {creatorProfile?.verification_status === 'approved'
                  ? 'Verified Photographer'
                  : creatorProfile?.verification_status === 'pending'
                  ? 'Verification Pending'
                  : 'Onboarding In Progress'}
              </span>
            </div>

            {/* Profile 4 Metrics Grid */}
            <div className="grid grid-cols-4 gap-2 text-center pt-4 mt-4 border-t border-[#F2ECE3]">
              <div>
                <p className="text-xs font-black text-[#1A1816]">
                  {creatorProfile?.average_rating ? Number(creatorProfile.average_rating).toFixed(1) : '5.0'} ★
                </p>
                <p className="text-[10px] text-[#8C847A]">({creatorProfile?.total_reviews || 0} reviews)</p>
              </div>
              <div>
                <p className="text-xs font-black text-[#1A1816]">{stats.totalBookings}</p>
                <p className="text-[10px] text-[#8C847A]">Bookings</p>
              </div>
              <div>
                <p className="text-xs font-black text-[#1A1816]">
                  {creatorProfile?.experience_years ? `${creatorProfile.experience_years}+` : '1'}
                </p>
                <p className="text-[10px] text-[#8C847A]">Years</p>
              </div>
              <div>
                <p className="text-xs font-black text-[#1A1816]">100%</p>
                <p className="text-[10px] text-[#8C847A]">Response</p>
              </div>
            </div>
          </div>

          {/* Profile CTA buttons */}
          <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[#F2ECE3]">
            <Link
              href={creatorProfile?.id ? `/photographers/${creatorProfile.id}` : '/photographer/business'}
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
            <p className="text-2xl font-black text-[#1A1816] pt-1">{stats.newRequests}</p>
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
            <p className="text-2xl font-black text-[#1A1816] pt-1">{stats.upcomingShoots}</p>
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
            <p className="text-2xl font-black text-[#1A1816] pt-1">
              ₹{stats.monthEarnings.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-[#736B63] font-medium">This Month Earnings</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8C847A] group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* KPI 4: Total Bookings */}
        <Link
          href="/photographer/analytics"
          className="group bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-2xs hover:border-purple-500 transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-[#1A1816] pt-1">{stats.totalBookings}</p>
            <p className="text-xs text-[#736B63] font-medium">Total Sessions</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8C847A] group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* ======================================================== */}
      {/* MIDDLE SECTION: EARNINGS OVERVIEW, BOOKING REQUESTS, TODAY */}
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
                  <p className="text-xs text-[#736B63]">Verified ledger & monthly settlements</p>
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
              <div className="space-y-6 text-[10px] text-[#A69F96] font-semibold">
                <div className="flex items-center gap-3">
                  <span className="w-10 text-right">₹50K</span>
                  <div className="flex-1 border-b border-[#F2ECE3] border-dashed" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 text-right">₹25K</span>
                  <div className="flex-1 border-b border-[#F2ECE3] border-dashed" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 text-right">0</span>
                  <div className="flex-1 border-b border-[#E8E2D8]" />
                </div>
              </div>

              {/* Bar Columns Container */}
              <div className="absolute inset-x-0 bottom-6 pl-14 pr-4 flex items-end justify-between h-28">
                {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((month, idx) => {
                  const isCurrent = idx === 5;
                  const heightPercent = isCurrent && stats.monthEarnings > 0
                    ? Math.min(100, Math.max(15, (stats.monthEarnings / 50000) * 100))
                    : 10;

                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-2 group">
                      <div
                        className={`w-6 sm:w-10 rounded-t-lg transition-all ${
                          isCurrent
                            ? 'bg-gradient-to-t from-[#E86300] to-[#FF6E00] shadow-sm'
                            : 'bg-zinc-200 group-hover:bg-zinc-300'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className={`text-[11px] font-bold ${isCurrent ? 'text-[#1A1816]' : 'text-[#736B63]'}`}>
                        {month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {stats.monthEarnings === 0 && (
              <p className="text-center text-[11px] text-ink-muted pt-2 border-t border-contour-subtle mt-2">
                New studio balance: Completed client bookings will populate monthly earnings.
              </p>
            )}
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

            {recentRequests.length === 0 ? (
              <div className="py-8 px-4 text-center border-2 border-dashed border-[#E8E2D8] rounded-2xl bg-[#FAF7F2]/40 space-y-2">
                <Calendar className="w-8 h-8 text-[#FF6E00] mx-auto opacity-60" />
                <p className="text-xs font-bold text-[#1A1816]">No new booking requests at this time</p>
                <p className="text-[11px] text-[#736B63] max-w-sm mx-auto">
                  When clients request a shoot from your service packages or profile, requests will appear here for one-click confirmation.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl border border-[#F2ECE3] hover:border-[#E8E2D8] bg-[#FAF7F2]/60 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#FFE8D6] text-[#FF6E00] flex items-center justify-center font-bold text-sm shrink-0">
                        {req.customer?.full_name ? req.customer.full_name[0] : 'C'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-[#1A1816]">{req.event_title}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFE8D6] text-[#FF6E00]">
                            New
                          </span>
                        </div>
                        <p className="text-xs text-[#736B63] font-medium">{req.customer?.full_name || 'Client'}</p>
                        <p className="text-[11px] text-[#8C847A]">{req.event_date} • {req.event_location}</p>
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
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: TODAY'S SCHEDULE & CLIENT REVIEWS (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* TODAY'S SCHEDULE TIMELINE */}
          <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#FFF2E8] text-[#FF6E00] flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-base font-black text-[#1A1816]">Today&apos;s Schedule</h3>
              </div>
              <Link
                href="/photographer/bookings"
                className="text-xs font-bold text-[#FF6E00] hover:underline flex items-center gap-1"
              >
                <span>Calendar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {todaySchedule.length === 0 ? (
              <div className="py-6 px-4 text-center border-2 border-dashed border-[#E8E2D8] rounded-2xl bg-[#FAF7F2]/40 space-y-1.5">
                <Clock className="w-6 h-6 text-[#FF6E00] mx-auto opacity-60" />
                <p className="text-xs font-bold text-[#1A1816]">No shoots scheduled for today</p>
                <p className="text-[11px] text-[#736B63]">
                  Your calendar is open for instant and scheduled client sessions.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8E2D8]">
                {todaySchedule.map((item) => (
                  <div key={item.id} className="relative group">
                    <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-[#FF6E00] shadow-xs" />
                    <div>
                      <span className="text-[10px] font-bold text-[#8C847A] block">
                        {item.start_at ? new Date(item.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                      </span>
                      <h4 className="text-xs font-bold text-[#1A1816] truncate">{item.event_title}</h4>
                      <p className="text-[11px] text-[#736B63] truncate">{item.customer?.full_name}</p>
                      <p className="text-[10px] text-[#A69F96] truncate flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-[#FF6E00] shrink-0" />
                        <span>{item.event_location}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

            {creatorProfile?.total_reviews && creatorProfile.total_reviews > 0 ? (
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#F2ECE3] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#FF6E00] text-white flex items-center justify-center text-xs font-bold">
                      C
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#1A1816]">Client Feedback</h5>
                      <div className="flex text-[#FF6E00] text-[10px]">
                        {'★'.repeat(Math.round(creatorProfile.average_rating || 5))}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#5A544D] leading-relaxed italic">
                  Verified rating: {Number(creatorProfile.average_rating).toFixed(1)}/5.0 across {creatorProfile.total_reviews} bookings.
                </p>
              </div>
            ) : (
              <div className="py-6 px-4 text-center border-2 border-dashed border-[#E8E2D8] rounded-2xl bg-[#FAF7F2]/40 space-y-1.5">
                <Star className="w-6 h-6 text-[#FF6E00] mx-auto opacity-60" />
                <p className="text-xs font-bold text-[#1A1816]">No reviews yet</p>
                <p className="text-[11px] text-[#736B63]">
                  Client ratings will automatically appear here once you complete customer shoots.
                </p>
              </div>
            )}
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

            {dbPortfolio.length === 0 ? (
              <div className="py-8 px-4 text-center border-2 border-dashed border-[#E8E2D8] rounded-2xl bg-[#FAF7F2]/40 space-y-2">
                <Camera className="w-8 h-8 text-[#FF6E00] mx-auto opacity-60" />
                <p className="text-xs font-bold text-[#1A1816]">No portfolio photographs uploaded yet</p>
                <p className="text-[11px] text-[#736B63] max-w-sm mx-auto">
                  Add high-resolution samples of your work to attract bookings from clients.
                </p>
                <Link
                  href="/photographer/portfolio"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF6E00] text-white text-xs font-bold hover:bg-[#E86300] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Photograph</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                {dbPortfolio.slice(0, 4).map((item) => (
                  <img
                    key={item.id}
                    src={item.preview_url}
                    alt={item.title}
                    className="w-full aspect-square rounded-xl object-cover border border-[#E8E2D8] hover:scale-105 transition-transform"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/reference-assets/cat_portrait.jpg';
                    }}
                  />
                ))}
                <Link
                  href="/photographer/portfolio"
                  className="w-full aspect-square rounded-xl border-2 border-dashed border-[#D4C9BC] hover:border-[#FF6E00] hover:bg-[#FFF8F2] flex flex-col items-center justify-center text-[#8C847A] hover:text-[#FF6E00] transition-colors group cursor-pointer"
                >
                  <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold mt-1">Add More</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* TOP SERVICES (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FF6E00]" />
                <h3 className="text-base font-black text-[#1A1816]">Photography Packages</h3>
              </div>
              <Link
                href="/photographer/services"
                className="text-xs font-bold text-[#FF6E00] hover:underline flex items-center gap-1"
              >
                <span>Manage Packages</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {dbServices.length === 0 ? (
              <div className="py-8 px-4 text-center border-2 border-dashed border-[#E8E2D8] rounded-2xl bg-[#FAF7F2]/40 space-y-2">
                <Package className="w-8 h-8 text-[#FF6E00] mx-auto opacity-60" />
                <p className="text-xs font-bold text-[#1A1816]">No active service packages yet</p>
                <p className="text-[11px] text-[#736B63] max-w-sm mx-auto">
                  Create packages with custom pricing and duration so clients can book you.
                </p>
                <Link
                  href="/photographer/services"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF6E00] text-white text-xs font-bold hover:bg-[#E86300] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Configure First Package</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {dbServices.slice(0, 4).map((srv) => (
                  <div key={srv.id} className="p-3 bg-canvas-secondary/40 rounded-xl border border-contour-subtle flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-ink-primary">{srv.title}</p>
                      <p className="text-[11px] text-ink-muted">
                        ⏱️ {Math.round((srv.duration_minutes || 120) / 60)} Hours • Delivery in {srv.delivery_time_hours || 48}h
                      </p>
                    </div>
                    <span className="text-sm font-extrabold text-[#FF6E00]">
                      ₹{Number(srv.base_price).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
              <h4 className="text-sm font-black text-[#1A1816]">Pro Creator Plan</h4>
              <p className="text-[10px] text-[#8C847A]">Instant Dispatch Enabled</p>
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
              <h4 className="text-xs font-bold text-[#1A1816]">Studio Sync Status</h4>
              <p className="text-[11px] text-[#736B63]">Realtime Studio Connected</p>
            </div>
          </div>
          <Link
            href="/photographer/analytics"
            className="px-3 py-1.5 rounded-xl border border-[#E8E2D8] text-xs font-bold text-[#FF6E00] hover:bg-[#FFF8F2] transition-colors shrink-0"
          >
            Analytics →
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
                  Complete your studio profile and add service packages to qualify for top search rankings!
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
