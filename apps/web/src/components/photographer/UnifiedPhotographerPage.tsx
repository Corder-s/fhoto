'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  KeyRound,
  DollarSign,
  UploadCloud,
  Image as ImageIcon,
  Package,
  Settings,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Phone,
  LayoutDashboard,
  User,
  Filter,
  Plus,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PortfolioLightbox, GalleryImage } from '../gallery/PortfolioLightbox';
import { BookingModal } from '../booking/BookingModal';
import { DemoNoticeBanner } from './DemoNoticeBanner';
import {
  INITIAL_PHOTOGRAPHER_PROFILE,
  INITIAL_BOOKINGS,
  INITIAL_SERVICES,
  INITIAL_PORTFOLIO,
  INITIAL_REVIEWS,
  PhotographerBooking,
  PhotographerProfile
} from '../../data/photographerDashboardData';
import {
  SAMPLE_PHOTOGRAPHERS,
  PhotographerServicePackage as SampleServicePackage
} from '../../data/photographers';
import { useAuth } from '../../lib/auth';

export type UnifiedPageMode = 'creator' | 'public';
export type ActiveSection = 'overview' | 'profile' | 'portfolio' | 'services' | 'bookings' | 'reviews';

interface UnifiedPhotographerPageProps {
  initialMode?: UnifiedPageMode;
  creatorId?: string;
}

export const UnifiedPhotographerPage: React.FC<UnifiedPhotographerPageProps> = ({
  initialMode = 'creator',
  creatorId = 'pro-aman'
}) => {
  const { user } = useAuth();
  const [currentMode, setCurrentMode] = useState<UnifiedPageMode>(initialMode);
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');

  // Bookings state for creator dashboard
  const [bookings, setBookings] = useState<PhotographerBooking[]>(INITIAL_BOOKINGS);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Portfolio Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Booking Modal State (Client Booking Flow)
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<SampleServicePackage | null>(null);

  // Share profile toast
  const [copiedToast, setCopiedToast] = useState(false);

  // Look up photographer profile data
  const sampleCreator = SAMPLE_PHOTOGRAPHERS.find((p) => p.id === creatorId) || SAMPLE_PHOTOGRAPHERS[0];
  const profile: PhotographerProfile = INITIAL_PHOTOGRAPHER_PROFILE;

  // Combine portfolio items
  const portfolioImages: GalleryImage[] = INITIAL_PORTFOLIO.map((p) => ({
    id: p.id,
    url: p.imageUrl,
    title: p.title,
    category: p.category,
  }));

  const filteredPortfolio = selectedCategory === 'All'
    ? portfolioImages
    : portfolioImages.filter((p) => p.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  // Active Shoot for OTP Handshake
  const activeBooking = bookings.find((b) => b.id === 'SNP-2026-98124');
  const upcomingBookings = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'REQUESTED');
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length + 146;

  // Handle OTP Verification Handshake
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (enteredOtp.trim() !== '482910') {
      setOtpError('Invalid OTP code. Please ask client for the 6-digit code shown on their booking card (demo code: 482910).');
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setOtpVerified(true);
      setBookings((prev) =>
        prev.map((b) => (b.id === 'SNP-2026-98124' ? { ...b, status: 'IN_PROGRESS' } : b))
      );
    }, 600);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  };

  const handleInitiateBooking = (pkg: typeof INITIAL_SERVICES[0]) => {
    // Map to SampleServicePackage format expected by BookingModal
    const modalPackage: SampleServicePackage = {
      id: pkg.id,
      name: pkg.title,
      duration: `${pkg.durationHours} Hours`,
      photos: pkg.deliverables[0] || 'High-Res Photos',
      turnaround: '48 Hour Delivery',
      priceInr: pkg.priceInr,
      features: pkg.deliverables,
    };
    setSelectedPackage(modalPackage);
    setBookingModalOpen(true);
  };

  const navigationTabs: Array<{ id: ActiveSection; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile Details', icon: User },
    { id: 'portfolio', label: 'Portfolio Gallery', icon: ImageIcon },
    { id: 'services', label: 'Services & Pricing', icon: Package },
    { id: 'bookings', label: 'Bookings & Calendar', icon: Calendar },
    { id: 'reviews', label: 'Client Reviews', icon: Star },
  ];

  return (
    <div className="space-y-6">
      {/* Lightbox Component */}
      <PortfolioLightbox
        images={filteredPortfolio}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onSelectIndex={setLightboxIndex}
      />

      {/* Booking Modal Component */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        photographerName={profile.name}
        selectedPackage={selectedPackage}
      />

      {/* Top Banner & Mode Switcher */}
      <div className="bg-white rounded-2xl border border-contour-subtle p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Badge variant="brand" size="sm">
            SnapShoot Unified Creator Hub
          </Badge>
          <span className="text-xs text-ink-muted hidden md:inline">
            Aman Sharma&apos;s Photographer Profile &amp; Studio Dashboard
          </span>
        </div>

        {/* Studio Workspace vs Public Preview Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-canvas-secondary rounded-xl border border-contour-subtle text-xs font-bold">
          <button
            type="button"
            onClick={() => setCurrentMode('creator')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              currentMode === 'creator'
                ? 'bg-white text-brand shadow-xs'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            Studio Workspace View
          </button>
          <button
            type="button"
            onClick={() => setCurrentMode('public')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              currentMode === 'public'
                ? 'bg-white text-brand shadow-xs'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            Public Client Preview
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION A — PROFILE HEADER */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-contour-subtle shadow-sm overflow-hidden">
        {/* Cover Hero Banner */}
        <div className="relative h-44 sm:h-56 md:h-64 w-full bg-gradient-to-r from-[#1A1816] via-[#2D2824] to-[#1A1816] overflow-hidden">
          <img
            src={sampleCreator.coverImageUrl}
            alt={`${profile.name} cover`}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Quick Badges inside Cover */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm text-ink-primary shadow-sm">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{profile.rating}</span>
              <span className="text-ink-muted">({profile.reviewCount} reviews)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/90 backdrop-blur-sm text-white shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{sampleCreator.availabilityStatus}</span>
            </span>
          </div>
        </div>

        {/* Profile Details Area */}
        <div className="px-6 sm:px-8 pb-8 pt-0 -mt-16 sm:-mt-20 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
            {/* Avatar & Core Identity */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white shrink-0">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-ink-primary">
                    {profile.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Pro Artist
                  </span>
                  <span className="text-xs text-ink-muted font-medium">{profile.handle}</span>
                </div>

                <p className="text-xs sm:text-sm text-ink-secondary font-medium">
                  Editorial &amp; Portrait Specialist • 6+ Years Experience
                </p>

                <p className="text-xs text-ink-muted flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>{profile.city}, UP • Base Hub: Greater Noida</span>
                </p>
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
              <Button
                variant="secondary"
                size="md"
                onClick={handleShare}
                leftIcon={copiedToast ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              >
                {copiedToast ? 'Link Copied!' : 'Share Profile'}
              </Button>

              {currentMode === 'creator' ? (
                <Link href="/photographer/settings">
                  <Button variant="primary" size="md" leftIcon={<Settings className="w-4 h-4" />}>
                    Edit Profile &amp; Studio
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    const el = document.getElementById('unified-packages-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Book a Shoot
                </Button>
              )}
            </div>
          </div>

          {/* Profile Completion Bar (Creator Mode) */}
          {currentMode === 'creator' && (
            <div className="mt-6 pt-6 border-t border-contour-subtle bg-canvas-primary/50 p-4 rounded-xl border">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-brand" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-ink-primary">
                    Profile Completion: {profile.profileCompletion}%
                  </span>
                </div>
                <Link href="/photographer/onboarding" className="text-xs font-bold text-brand hover:underline">
                  Complete Onboarding Checklist →
                </Link>
              </div>
              <div className="w-full bg-canvas-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand h-2 rounded-full transition-all duration-500"
                  style={{ width: `${profile.profileCompletion}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION NAVIGATION TABS (Single-Page Experience) */}
      {/* ========================================================= */}
      <div className="sticky top-20 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-contour-subtle p-1.5 shadow-sm flex overflow-x-auto gap-1 scrollbar-none">
        {navigationTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveSection(tab.id);
                const el = document.getElementById(`unified-${tab.id}-section`);
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-canvas-secondary'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* SECTION B — DASHBOARD OVERVIEW */}
      {/* ========================================================= */}
      <div id="unified-overview-section" className="space-y-6">
        {currentMode === 'creator' && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-ink-primary">Studio Dashboard Overview</h2>
              <span className="text-xs text-ink-muted font-medium">Real-time booking and escrow analytics</span>
            </div>

            {/* Scorecard Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="space-y-1">
                <p className="text-xs uppercase font-bold text-ink-muted">In Escrow (Secured)</p>
                <p className="text-2xl sm:text-3xl font-black text-brand">₹6,000</p>
                <p className="text-[11px] text-ink-muted">Pending today&apos;s photo delivery</p>
              </Card>

              <Card className="space-y-1">
                <p className="text-xs uppercase font-bold text-ink-muted">Available for Payout</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600">₹42,800</p>
                <Link href="/photographer/payouts" className="text-[11px] text-emerald-700 font-bold hover:underline">
                  Request Instant UPI Transfer →
                </Link>
              </Card>

              <Card className="space-y-1">
                <p className="text-xs uppercase font-bold text-ink-muted">Completed Shoots</p>
                <p className="text-2xl sm:text-3xl font-black text-ink-primary">{completedCount}</p>
                <p className="text-[11px] text-ink-muted">100% on-time fulfillment rate</p>
              </Card>

              <Card className="space-y-1">
                <p className="text-xs uppercase font-bold text-ink-muted">Client Rating</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-ink-primary">
                    {profile.rating}
                  </span>
                  <span className="text-amber-500 text-lg">★</span>
                </div>
                <p className="text-[11px] text-ink-muted">Based on {profile.reviewCount} verified client reviews</p>
              </Card>
            </div>

            {/* Active Venue Appointment Card with OTP Handshake */}
            {activeBooking && (
              <div className="bg-white rounded-2xl border border-brand/40 shadow-sm p-6 sm:p-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-contour-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse"></span>
                    <h3 className="text-sm font-bold text-ink-primary">
                      Today&apos;s Active Venue Appointment
                    </h3>
                  </div>
                  <Badge variant={otpVerified ? 'success' : 'brand'} size="sm">
                    {otpVerified ? 'Status: Shoot In Progress' : 'Status: Arrived at Venue'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-ink-muted">
                      <span className="font-mono text-ink-primary">Ref: {activeBooking.id}</span>
                      <span>•</span>
                      <span>Client: {activeBooking.customerName}</span>
                      <span>•</span>
                      <span>{activeBooking.packageTitle}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-canvas-primary border text-xs space-y-1">
                      <p className="font-semibold text-ink-primary flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span>Venue: {activeBooking.venueAddress}</span>
                      </p>
                      <p className="text-ink-secondary">
                        Time: {activeBooking.date} • {activeBooking.timeSlot} ({activeBooking.duration})
                      </p>
                    </div>

                    <p className="text-xs text-ink-muted">
                      Note: {activeBooking.notes}
                    </p>
                  </div>

                  {/* OTP Verification Box */}
                  <div className="lg:col-span-5 bg-canvas-primary p-5 rounded-xl border border-contour-subtle">
                    {otpVerified ? (
                      <div className="text-center py-4 space-y-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-bold text-emerald-800">
                          Handshake Verified! Shoot in progress
                        </h4>
                        <p className="text-[11px] text-ink-muted">
                          Escrow deposit of ₹6,000 will be released upon delivering edited gallery.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-ink-primary flex items-center gap-1">
                            <KeyRound className="w-3.5 h-3.5 text-brand" />
                            <span>Client Shoot-Start OTP *</span>
                          </label>
                          <span className="text-[10px] text-brand font-bold bg-brand-subtle px-1.5 py-0.5 rounded">
                            Demo Code: 482910
                          </span>
                        </div>

                        {otpError && (
                          <div className="p-2.5 bg-red-50 text-red-700 text-[11px] rounded-lg border border-red-200">
                            {otpError}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={enteredOtp}
                            onChange={(e) => setEnteredOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            className="flex-1 px-3 py-2 text-xs font-mono font-bold tracking-widest text-center border border-contour-subtle rounded-xl bg-white outline-none focus:border-brand"
                          />
                          <Button variant="primary" size="sm" type="submit" isLoading={isVerifying}>
                            Verify
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* SECTION G — QUICK ACTIONS (Creator Mode) */}
        {currentMode === 'creator' && (
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink-muted">
              Quick Workspace Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Link
                href="/photographer/settings"
                className="p-3.5 bg-white rounded-xl border border-contour-subtle hover:border-brand hover:shadow-subtle transition-all text-center flex flex-col items-center group"
              >
                <User className="w-4 h-4 text-ink-muted group-hover:text-brand mb-1" />
                <span className="text-xs font-bold text-ink-primary">Edit Profile</span>
                <span className="text-[10px] text-ink-muted">Studio info</span>
              </Link>

              <Link
                href="/photographer/portfolio"
                className="p-3.5 bg-white rounded-xl border border-contour-subtle hover:border-brand hover:shadow-subtle transition-all text-center flex flex-col items-center group"
              >
                <ImageIcon className="w-4 h-4 text-ink-muted group-hover:text-brand mb-1" />
                <span className="text-xs font-bold text-ink-primary">Manage Portfolio</span>
                <span className="text-[10px] text-ink-muted">Add/order shots</span>
              </Link>

              <Link
                href="/photographer/services"
                className="p-3.5 bg-white rounded-xl border border-contour-subtle hover:border-brand hover:shadow-subtle transition-all text-center flex flex-col items-center group"
              >
                <Package className="w-4 h-4 text-ink-muted group-hover:text-brand mb-1" />
                <span className="text-xs font-bold text-ink-primary">Manage Packages</span>
                <span className="text-[10px] text-ink-muted">Pricing &amp; rates</span>
              </Link>

              <Link
                href="/photographer/availability"
                className="p-3.5 bg-white rounded-xl border border-contour-subtle hover:border-brand hover:shadow-subtle transition-all text-center flex flex-col items-center group"
              >
                <Clock className="w-4 h-4 text-ink-muted group-hover:text-brand mb-1" />
                <span className="text-xs font-bold text-ink-primary">Availability</span>
                <span className="text-[10px] text-ink-muted">Working hours</span>
              </Link>

              <Link
                href="/photographer/bookings"
                className="p-3.5 bg-white rounded-xl border border-contour-subtle hover:border-brand hover:shadow-subtle transition-all text-center flex flex-col items-center group"
              >
                <Calendar className="w-4 h-4 text-ink-muted group-hover:text-brand mb-1" />
                <span className="text-xs font-bold text-ink-primary">View Bookings</span>
                <span className="text-[10px] text-ink-muted">All active shoots</span>
              </Link>

              <Link
                href="/photographer/settings"
                className="p-3.5 bg-white rounded-xl border border-contour-subtle hover:border-brand hover:shadow-subtle transition-all text-center flex flex-col items-center group"
              >
                <Settings className="w-4 h-4 text-ink-muted group-hover:text-brand mb-1" />
                <span className="text-xs font-bold text-ink-primary">Studio Settings</span>
                <span className="text-[10px] text-ink-muted">Payouts &amp; KYC</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECTION 2 — PROFILE DETAILS */}
      {/* ========================================================= */}
      <div id="unified-profile-section" className="bg-white rounded-2xl border border-contour-subtle p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-contour-subtle pb-4">
          <div>
            <h2 className="text-base font-extrabold text-ink-primary">Professional Biography &amp; Gear</h2>
            <p className="text-xs text-ink-muted mt-0.5">Specialties, background, and camera equipment inventory</p>
          </div>
          {currentMode === 'creator' && (
            <Link href="/photographer/settings" className="text-xs font-bold text-brand hover:underline">
              Edit Details →
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                Biography
              </h3>
              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                {profile.bio}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                Photography Specialties
              </h3>
              <div className="flex flex-wrap gap-2">
                {sampleCreator.specialties.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1 rounded-full text-xs font-bold bg-canvas-primary text-ink-primary border border-contour-subtle"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                Service Areas &amp; Coverage
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.serviceArea.map((area) => (
                  <span
                    key={area}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-canvas-primary text-ink-secondary border border-contour-subtle flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3 text-brand" />
                    <span>{area}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-canvas-primary p-5 rounded-xl border border-contour-subtle">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Professional Camera Gear
            </h3>
            
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-bold text-ink-primary">Cameras:</span>
                <p className="text-ink-secondary">{profile.equipment.cameras.join(', ')}</p>
              </div>
              <div>
                <span className="font-bold text-ink-primary">Lenses:</span>
                <p className="text-ink-secondary">{profile.equipment.lenses.join(', ')}</p>
              </div>
              <div>
                <span className="font-bold text-ink-primary">Lighting &amp; Strobe:</span>
                <p className="text-ink-secondary">{profile.equipment.lighting.join(', ')}</p>
              </div>
              <div>
                <span className="font-bold text-ink-primary">Audio &amp; Stabilization:</span>
                <p className="text-ink-secondary">{profile.equipment.accessories.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION C — PHOTOGRAPHY PORTFOLIO */}
      {/* ========================================================= */}
      <div id="unified-portfolio-section" className="bg-white rounded-2xl border border-contour-subtle p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-contour-subtle pb-4">
          <div>
            <h2 className="text-base font-extrabold text-ink-primary">Photography Portfolio</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Click any photograph to view in full-resolution lightbox
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Portrait', 'Reels', 'Couple', 'Events'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-brand text-white shadow-xs'
                      : 'bg-canvas-primary text-ink-secondary hover:text-ink-primary border border-contour-subtle'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {currentMode === 'creator' && (
              <Link href="/photographer/portfolio">
                <Button variant="secondary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Manage
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredPortfolio.map((img, index) => (
            <div
              key={img.id}
              onClick={() => {
                setLightboxIndex(index);
                setLightboxOpen(true);
              }}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-canvas-secondary cursor-pointer shadow-subtle border border-contour-subtle"
            >
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

      {/* ========================================================= */}
      {/* SECTION D — SERVICES AND PACKAGES */}
      {/* ========================================================= */}
      <div id="unified-services-section" className="bg-white rounded-2xl border border-contour-subtle p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-contour-subtle pb-4">
          <div>
            <h2 className="text-base font-extrabold text-ink-primary">Service Packages &amp; Pricing</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Transparent hourly rates, deliverables, and 100% platform escrow protection
            </p>
          </div>
          {currentMode === 'creator' && (
            <Link href="/photographer/services">
              <Button variant="secondary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Service Package
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="unified-packages-section">
          {INITIAL_SERVICES.slice(0, 3).map((pkg, idx) => (
            <Card
              key={pkg.id}
              className={`flex flex-col justify-between relative ${
                idx === 1 ? 'border-brand ring-1 ring-brand' : ''
              }`}
            >
              {idx === 1 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="brand" size="sm">
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-ink-primary">{pkg.title}</h3>
                  <p className="text-2xl font-black text-brand mt-1">
                    ₹{pkg.priceInr.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {pkg.durationHours} Hours Shoot • {pkg.category}
                  </p>
                </div>

                <p className="text-xs text-ink-secondary leading-relaxed">{pkg.description}</p>

                <ul className="space-y-2 text-xs text-ink-secondary pt-3 border-t border-contour-subtle">
                  {pkg.deliverables.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-5 mt-5 border-t border-contour-subtle">
                {currentMode === 'creator' ? (
                  <Link href="/photographer/services">
                    <Button variant="secondary" size="sm" className="w-full">
                      Edit Package Rates
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant={idx === 1 ? 'primary' : 'secondary'}
                    size="md"
                    className="w-full"
                    onClick={() => handleInitiateBooking(pkg)}
                  >
                    Book {pkg.title.split(' ')[0]} Shoot
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION E — BOOKINGS AND AVAILABILITY */}
      {/* ========================================================= */}
      <div id="unified-bookings-section" className="bg-white rounded-2xl border border-contour-subtle p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-contour-subtle pb-4">
          <div>
            <h2 className="text-base font-extrabold text-ink-primary">Bookings &amp; Availability Schedule</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Live reservations, upcoming shoot calendar, and slot management
            </p>
          </div>
          {currentMode === 'creator' ? (
            <div className="flex items-center gap-2">
              <Link href="/photographer/availability">
                <Button variant="secondary" size="sm">
                  Update Slots
                </Button>
              </Link>
              <Link href="/photographer/bookings">
                <Button variant="primary" size="sm">
                  All Bookings
                </Button>
              </Link>
            </div>
          ) : (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              ● Slots Open This Week
            </span>
          )}
        </div>

        {currentMode === 'creator' ? (
          <div className="space-y-3">
            {upcomingBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl border border-contour-subtle bg-canvas-primary/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-ink-primary">{b.id}</span>
                    <Badge variant={b.status === 'CONFIRMED' ? 'success' : 'brand'} size="sm">
                      {b.status}
                    </Badge>
                  </div>
                  <p className="text-xs font-bold text-ink-primary mt-1">
                    {b.customerName} • {b.packageTitle}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {b.date} • {b.timeSlot} • {b.venueAddress}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-brand">₹{b.netEarnings.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-ink-muted">Net Payout (80%)</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 rounded-xl bg-canvas-primary border text-xs space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-brand" />
              <div>
                <p className="font-bold text-ink-primary">Working Hours &amp; Instant Radar</p>
                <p className="text-ink-secondary">Monday - Saturday: 09:00 AM - 07:30 PM IST</p>
              </div>
            </div>
            <p className="text-[11px] text-ink-muted">
              Average response time is under 15 minutes. Instant on-demand booking radar active across Greater Noida &amp; Delhi NCR.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECTION F — REVIEWS AND RATINGS */}
      {/* ========================================================= */}
      <div id="unified-reviews-section" className="bg-white rounded-2xl border border-contour-subtle p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-contour-subtle pb-4">
          <div>
            <h2 className="text-base font-extrabold text-ink-primary">Client Reviews &amp; Testimonials</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              100% verified customer ratings from delivered photoshoots
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-ink-primary">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-sm font-black">{profile.rating} / 5.0</span>
            <span className="text-ink-muted font-normal">({profile.reviewCount} total reviews)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sampleCreator.reviews.concat([
            {
              id: 'rev-2',
              clientName: 'Aarav Sharma',
              clientLocation: 'Lodhi Art District',
              date: 'October 8, 2026',
              rating: 5,
              sessionType: 'Editorial Portrait',
              comment: 'Aman is a genius with outdoor natural light. The portraits for my company portfolio turned out sharp, vibrant, and stunning!'
            },
            {
              id: 'rev-3',
              clientName: 'Meera Kapoor',
              clientLocation: 'DLF CyberHub',
              date: 'October 1, 2026',
              rating: 5,
              sessionType: 'Creator Reels Suite',
              comment: 'Delivered four high-impact vertical video reels within 24 hours. The transitions and color grading gave our autumn campaign thousands of views.'
            }
          ]).map((rev) => (
            <div key={rev.id} className="p-4 rounded-xl border border-contour-subtle bg-canvas-primary/40 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-ink-primary">{rev.clientName}</h4>
                  <p className="text-[11px] text-ink-muted">
                    {rev.clientLocation} • {rev.sessionType}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{rev.rating}.0</span>
                </div>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed italic">
                &ldquo;{rev.comment}&rdquo;
              </p>
              <p className="text-[10px] text-ink-muted pt-1">{rev.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
