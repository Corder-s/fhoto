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
  Camera,
  Share2,
  ArrowRight,
  ChevronRight,
  Plus,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Check,
  Package,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { useCurrentUserProfile } from '../../context/UserProfileContext';

interface BookingRecord {
  id: string;
  booking_reference: string;
  event_title: string;
  event_date: string;
  start_at?: string;
  end_at?: string;
  duration_hours?: number;
  event_location: string;
  agreed_service_price: number;
  travel_fee: number;
  total_amount: number;
  booking_status: string;
  payment_status: string;
  customer_notes?: string;
  customer?: {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
    avatar_url?: string;
  };
  service?: {
    id: string;
    title: string;
    duration_minutes?: number;
  };
}

export const SellerDashboardView: React.FC = () => {
  const {
    authUser,
    profile,
    creatorProfile,
    accountName,
    professionalName,
    displayAvatar,
    initials,
    uploadAvatar,
    refreshProfile,
  } = useCurrentUserProfile();

  const avatarInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarToast, setAvatarToast] = useState<string | null>(null);

  const [copiedToast, setCopiedToast] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);

  // Authoritative dynamic records from database
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load real data from Supabase APIs
  const loadDashboardData = async () => {
    if (!authUser?.id) return;
    try {
      setIsLoading(true);
      const [bookingsRes, portfolioRes, servicesRes] = await Promise.all([
        fetch(`/api/photographers/bookings?userId=${authUser.id}`).catch(() => null),
        fetch(`/api/photographers/portfolio?userId=${authUser.id}`).catch(() => null),
        fetch(`/api/photographers/services?userId=${authUser.id}`).catch(() => null),
      ]);

      if (bookingsRes && bookingsRes.ok) {
        const bData = await bookingsRes.json();
        if (bData.bookings && Array.isArray(bData.bookings)) {
          setBookings(bData.bookings);
        }
      }

      if (portfolioRes && portfolioRes.ok) {
        const pData = await portfolioRes.json();
        if (pData.items && Array.isArray(pData.items)) {
          setPortfolioItems(pData.items);
        }
      }

      if (servicesRes && servicesRes.ok) {
        const sData = await servicesRes.json();
        if (sData.services && Array.isArray(sData.services)) {
          setServices(sData.services);
        }
      }
    } catch (err) {
      console.error('Error loading creator dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [authUser?.id]);

  // Handle Avatar Change
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
        await refreshProfile();
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

  // Handle Share Profile
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const publicUrl = creatorProfile?.id
        ? `${window.location.origin}/photographers/${creatorProfile.id}`
        : `${window.location.origin}/photographer/business`;
      navigator.clipboard?.writeText(fullPublicUrl);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  // Handle Booking Accept / Reject calling real backend API
  const handleBookingAction = async (bookingId: string, action: 'accept' | 'decline') => {
    setProcessingBookingId(bookingId);
    setActionMessage(null);

    try {
      const res = await fetch('/api/photographers/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          action,
          userId: authUser?.id,
          reason: action === 'decline' ? 'Photographer unavailable for requested schedule' : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Could not ${action} booking.`);
      }

      setActionMessage({
        type: 'success',
        text: action === 'accept' ? 'Booking accepted successfully!' : 'Booking declined.',
      });

      // Update state locally
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, booking_status: action === 'accept' ? 'confirmed' : 'cancelled' } : b))
      );
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || `Error updating booking.` });
    } finally {
      setProcessingBookingId(null);
    }
  };

  // Authoritative Metric Calculations
  const newRequests = bookings.filter((b) => b.booking_status === 'pending');
  const confirmedShoots = bookings.filter((b) => b.booking_status === 'confirmed' || b.booking_status === 'in_progress');
  const completedShoots = bookings.filter((b) => b.booking_status === 'completed');

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingShoots = confirmedShoots
    .filter((b) => (b.event_date ? b.event_date >= todayStr : true))
    .sort((a, b) => (a.event_date || '').localeCompare(b.event_date || ''));

  // Authoritative Photographer Earnings:
  // Photographer payout = agreed_service_price + travel_fee for completed or paid bookings
  const totalEarnedRevenue = bookings
    .filter((b) => b.booking_status === 'completed' || b.payment_status === 'paid')
    .reduce((sum, b) => sum + (Number(b.agreed_service_price) || 0) + (Number(b.travel_fee) || 0), 0);

  const pendingBookingValue = newRequests.reduce(
    (sum, b) => sum + (Number(b.agreed_service_price) || 0) + (Number(b.travel_fee) || 0),
    0
  );

  // Calculate Real Profile Completion Percentage
  const completionSteps = [
    { key: 'avatar', label: 'Profile Photo', done: Boolean(displayAvatar), href: '/photographer/business' },
    { key: 'name', label: 'Display Name', done: Boolean(creatorProfile?.professional_name || accountName), href: '/photographer/business' },
    { key: 'bio', label: 'Professional Biography', done: Boolean(creatorProfile?.biography && creatorProfile.biography.length > 20), href: '/photographer/business' },
    { key: 'city', label: 'City & Service Area', done: Boolean(creatorProfile?.city), href: '/photographer/business' },
    { key: 'packages', label: 'Service Packages', done: services.length > 0, href: '/photographer/services' },
    { key: 'banner', label: 'Cover Banner', done: Boolean(creatorProfile?.cover_image_url), href: '/photographer/portfolio' },
    { key: 'portfolio', label: 'Portfolio Gallery (3+ photos)', done: portfolioItems.length >= 3, href: '/photographer/portfolio' },
    { key: 'pricing', label: 'Travel Pricing Rules', done: Boolean(creatorProfile?.base_address), href: '/photographer/business' },
  ];

  const completedCount = completionSteps.filter((s) => s.done).length;
  const completionPercentage = Math.round((completedCount / completionSteps.length) * 100);
  const pendingSteps = completionSteps.filter((s) => !s.done);

  const fullPublicUrl = creatorProfile?.id
    ? `/photographers/${creatorProfile.id}`
    : '/photographer/business';

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* TOASTS & ALERTS                                               */}
      {/* ------------------------------------------------------------- */}
      {copiedToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-slate-700">
          <Check className="w-4 h-4 text-[#14B8A6]" />
          <span>Public studio link copied to clipboard!</span>
        </div>
      )}

      {avatarToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-[#14B8A6]/40">
          <Check className="w-4 h-4 text-[#14B8A6]" />
          <span>{avatarToast}</span>
        </div>
      )}

      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: WELCOME & STUDIO OVERVIEW BANNER                   */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4 sm:gap-5 flex-1 min-w-0">
          {/* Avatar with native upload button */}
          <div className="relative group shrink-0">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] text-white flex items-center justify-center text-xl sm:text-2xl font-black shadow-md border-2 border-white relative">
              <span>{initials}</span>
              {displayAvatar && (
                <img
                  src={displayAvatar}
                  alt={professionalName || accountName}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-[#14B8A6]" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 p-1.5 bg-slate-900 hover:bg-[#14B8A6] text-white rounded-xl shadow-md transition-all cursor-pointer opacity-90 group-hover:opacity-100"
              title="Change Profile Photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Name & Studio Status */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {professionalName || accountName}
              </h1>

              {/* Real Verification Status Chip */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                  creatorProfile?.verification_status === 'approved'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : creatorProfile?.verification_status === 'pending'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {creatorProfile?.verification_status === 'approved' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Creator</span>
                  </>
                ) : creatorProfile?.verification_status === 'pending' ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Under Review</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                    <span>Draft Studio</span>
                  </>
                )}
              </span>
            </div>

            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>{creatorProfile?.city || 'Delhi NCR'}</span>
              </span>
              <span>•</span>
              <span className="text-amber-500 font-bold">
                ★ {creatorProfile?.average_rating ? Number(creatorProfile.average_rating).toFixed(1) : '5.0'} ({creatorProfile?.total_reviews || 0} reviews)
              </span>
              <span>•</span>
              <span>{creatorProfile?.experience_years || 1}+ Years Experience</span>
            </p>

            <p className="text-xs text-slate-400 line-clamp-1">
              {creatorProfile?.biography || 'Complete your studio bio and packages to accept direct customer bookings.'}
            </p>
          </div>
        </div>

        {/* Quick CTA Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0">
          <Link
            href={fullPublicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-2xs"
          >
            <span>Live Profile</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <Link
            href="/photographer/business"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold transition-all shadow-sm"
          >
            <span>Edit Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleShare}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="Share Studio Profile"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: PROFILE COMPLETION DESK                            */}
      {/* ------------------------------------------------------------- */}
      {completionPercentage < 100 && (
        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#14B8A6]" />
              <h3 className="text-xs sm:text-sm font-black text-slate-900">
                Studio Setup Progress ({completionPercentage}%)
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              {completedCount} of {completionSteps.length} milestones finished
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* Pending steps pills */}
          {pendingSteps.length > 0 && (
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">Finish next:</span>
              {pendingSteps.map((step) => (
                <Link
                  key={step.key}
                  href={step.href}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 hover:border-[#14B8A6] text-xs font-bold text-slate-700 hover:text-[#0D9488] shadow-2xs transition-all"
                >
                  <Plus className="w-3 h-3 text-[#14B8A6]" />
                  <span>{step.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: KEY OPERATIONAL METRICS (KPIS)                     */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: New Booking Requests */}
        <Link
          href="/photographer/bookings"
          className="group bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs hover:border-[#14B8A6] transition-all flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-[#14B8A6]/10 text-[#0D9488] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            {newRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#14B8A6] text-white">
                Action Req
              </span>
            )}
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{newRequests.length}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">New Booking Requests</p>
          </div>
        </Link>

        {/* KPI 2: Confirmed Upcoming Shoots */}
        <Link
          href="/photographer/bookings"
          className="group bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs hover:border-[#14B8A6] transition-all flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{upcomingShoots.length}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Upcoming Confirmed Shoots</p>
          </div>
        </Link>

        {/* KPI 3: Authoritative Photographer Payout / Earnings */}
        <Link
          href="/photographer/payouts"
          className="group bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs hover:border-[#14B8A6] transition-all flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-base">
              ₹
            </div>
            <span className="text-[10px] font-bold text-slate-400">Settled/Earned</span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              ₹{totalEarnedRevenue.toLocaleString('en-IN')}
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Authoritative Earnings</p>
          </div>
        </Link>

        {/* KPI 4: Completed Shoots & Rating */}
        <Link
          href="/photographer/reviews"
          className="group bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs hover:border-[#14B8A6] transition-all flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              ★ {creatorProfile?.average_rating ? Number(creatorProfile.average_rating).toFixed(1) : '5.0'}
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{completedShoots.length}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Completed Shoots ({creatorProfile?.total_reviews || 0} reviews)
            </p>
          </div>
        </Link>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4: BOOKING REQUESTS DESK & UPCOMING SHOOTS           */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: REAL PENDING BOOKING REQUESTS (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#14B8A6]/10 text-[#0D9488] flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Pending Booking Requests</h2>
                <p className="text-xs text-slate-400">Client shoot requests awaiting your acceptance</p>
              </div>
            </div>

            <Link
              href="/photographer/bookings"
              className="text-xs font-bold text-[#0D9488] hover:underline flex items-center gap-1"
            >
              <span>All Bookings ({bookings.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#14B8A6]" />
            </div>
          ) : newRequests.length === 0 ? (
            <div className="py-10 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-800">No pending booking requests</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                When clients book your photography packages or submit custom shoot requests, they will appear here with one-click acceptance.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {newRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#14B8A6]/60 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {req.customer?.full_name ? req.customer.full_name[0].toUpperCase() : 'C'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {req.event_title || req.service?.title || 'Photo Session'}
                          </h4>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                            Pending
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {req.customer?.full_name || 'Client'} • Ref: {req.booking_reference || req.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900">
                        ₹{(Number(req.agreed_service_price) + Number(req.travel_fee || 0)).toLocaleString('en-IN')}
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold">Your Payout</p>
                    </div>
                  </div>

                  {/* Shoot Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-slate-100 font-medium text-slate-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
                      <span>{req.event_date || 'Date TBD'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Clock className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
                      <span>{req.duration_hours || 2} Hours</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate col-span-2 sm:col-span-1">
                      <MapPin className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
                      <span className="truncate">{req.event_location || 'Delhi NCR'}</span>
                    </div>
                  </div>

                  {/* Action buttons calling real API */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleBookingAction(req.id, 'decline')}
                      disabled={processingBookingId === req.id}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleBookingAction(req.id, 'accept')}
                      disabled={processingBookingId === req.id}
                      className="px-4 py-1.5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold transition-all shadow-2xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {processingBookingId === req.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>Accept Shoot ✓</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: UPCOMING SHOOTS TIMELINE (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Upcoming Schedule</h2>
                <p className="text-xs text-slate-400">Confirmed sessions on your calendar</p>
              </div>
            </div>

            <Link
              href="/photographer/availability"
              className="text-xs font-bold text-[#0D9488] hover:underline"
            >
              Calendar
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#14B8A6]" />
            </div>
          ) : upcomingShoots.length === 0 ? (
            <div className="py-8 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
              <Clock className="w-7 h-7 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-800">No confirmed shoots scheduled</p>
              <p className="text-[11px] text-slate-500">
                Accepted bookings and upcoming client sessions will appear here in chronological order.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingShoots.slice(0, 5).map((shoot) => (
                <div
                  key={shoot.id}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Confirmed
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      ₹{(Number(shoot.agreed_service_price) + Number(shoot.travel_fee || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {shoot.event_title || shoot.service?.title || 'Confirmed Session'}
                  </h4>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>📅 {shoot.event_date}</span>
                    <span>•</span>
                    <span className="truncate">📍 {shoot.event_location}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Client: {shoot.customer?.full_name || 'Booked Client'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 5: PORTFOLIO HIGHLIGHTS & SERVICES PREVIEW            */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* PORTFOLIO HIGHLIGHTS (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#14B8A6]" />
                <h3 className="text-base font-black text-slate-900">Portfolio Gallery</h3>
                <span className="text-xs font-bold text-slate-400">({portfolioItems.length})</span>
              </div>
              <Link
                href="/photographer/portfolio"
                className="text-xs font-bold text-[#0D9488] hover:underline flex items-center gap-1"
              >
                <span>Manage Portfolio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {portfolioItems.length === 0 ? (
              <div className="py-8 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2 mt-4">
                <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-800">No portfolio photographs uploaded yet</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Upload showcase work to attract clients and raise your platform search rank.
                </p>
                <Link
                  href="/photographer/portfolio"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14B8A6] text-white text-xs font-bold hover:bg-[#0D9488] transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Photos</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 mt-4">
                {portfolioItems.slice(0, 4).map((item) => (
                  <div key={item.id} className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative group">
                    <img
                      src={item.preview_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/reference-assets/cat_portrait.jpg';
                      }}
                    />
                  </div>
                ))}
                <Link
                  href="/photographer/portfolio"
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-[#14B8A6] hover:bg-teal-50/30 flex flex-col items-center justify-center text-slate-400 hover:text-[#0D9488] transition-colors group cursor-pointer"
                >
                  <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold mt-1">Upload</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ACTIVE PHOTOGRAPHY PACKAGES (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#14B8A6]" />
                <h3 className="text-base font-black text-slate-900">Photography Packages</h3>
                <span className="text-xs font-bold text-slate-400">({services.length})</span>
              </div>
              <Link
                href="/photographer/services"
                className="text-xs font-bold text-[#0D9488] hover:underline flex items-center gap-1"
              >
                <span>Manage Packages</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {services.length === 0 ? (
              <div className="py-8 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2 mt-4">
                <Package className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-800">No active service packages yet</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Create customized pricing packages so clients can book shoots directly from your profile.
                </p>
                <Link
                  href="/photographer/services"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14B8A6] text-white text-xs font-bold hover:bg-[#0D9488] transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Configure Packages</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                {services.slice(0, 3).map((srv) => (
                  <div
                    key={srv.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900 truncate">{srv.title}</p>
                      <p className="text-[10px] text-slate-400">
                        ⏱️ {Math.round((srv.duration_minutes || 60) / 60)}h Duration • {srv.delivery_time_hours || 48}h Delivery
                      </p>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-[#0D9488] shrink-0">
                      ₹{Number(srv.base_price).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
