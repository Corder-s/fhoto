'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  KeyRound,
  MapPin,
  Clock,
  CheckCircle2,
  DollarSign,
  UploadCloud,
  AlertCircle,
  Calendar,
  Image as ImageIcon,
  Package,
  Settings,
  Star,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Phone,
  ArrowRight
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { DemoNoticeBanner } from '../../../../components/photographer/DemoNoticeBanner';
import {
  INITIAL_PHOTOGRAPHER_PROFILE,
  INITIAL_BOOKINGS,
  INITIAL_REVIEWS,
  PhotographerBooking
} from '../../../../data/photographerDashboardData';

export default function PhotographerDashboardPage() {
  const [bookings, setBookings] = useState<PhotographerBooking[]>(INITIAL_BOOKINGS);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Filter current / today's active shoot
  const activeBooking = bookings.find((b) => b.id === 'SNP-2026-98124');
  const upcomingBookings = bookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'REQUESTED'
  ).slice(0, 3);
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length + 146; // all-time sample

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (enteredOtp !== '482910') {
      setOtpError('Invalid OTP code. Please ask client for the 6-digit code shown on their booking card (demo code: 482910).');
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setOtpVerified(true);
      // Advance booking status in demo state
      setBookings((prev) =>
        prev.map((b) =>
          b.id === 'SNP-2026-98124' ? { ...b, status: 'IN_PROGRESS' } : b
        )
      );
    }, 600);
  };

  return (
    <div className="space-y-8">
      {/* Demo notice */}
      <DemoNoticeBanner moduleName="Creator Dashboard Overview" />

      {/* Welcome & Profile Status Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-contour-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
              Welcome back, {INITIAL_PHOTOGRAPHER_PROFILE.name} 👋
            </h1>
            <Badge variant="brand" size="sm">
              Pro Creator
            </Badge>
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            {INITIAL_PHOTOGRAPHER_PROFILE.city} • Editorial & Portrait Specialist • 148 verified shoots
          </p>
        </div>

        {/* Verification Status Card */}
        <div className="flex items-center gap-3 bg-amber-50/80 border border-amber-200 rounded-card-md px-4 py-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-950">Verification Status:</span>
              <span className="text-[11px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                Under Review
              </span>
            </div>
            <Link
              href="/photographer/verification"
              className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 mt-0.5"
            >
              Check KYC checklist & document status <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Completion Progress Bar */}
      <div className="bg-white rounded-card-md border border-contour-subtle p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-brand" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-ink-primary">
              Profile Completion: {INITIAL_PHOTOGRAPHER_PROFILE.profileCompletion}%
            </span>
          </div>
          <Link
            href="/photographer/onboarding"
            className="text-xs font-bold text-brand hover:underline"
          >
            Complete Onboarding Checklist →
          </Link>
        </div>
        <div className="w-full bg-canvas-secondary rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-brand h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${INITIAL_PHOTOGRAPHER_PROFILE.profileCompletion}%` }}
          />
        </div>
        <p className="text-xs text-ink-secondary mt-2">
          Remaining items to achieve 100%: Government Aadhaar/PAN ID verification and UPI payout configuration.
        </p>
      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="space-y-2">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-ink-muted">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            href="/photographer/bookings"
            className="flex flex-col items-center justify-center p-3.5 bg-white rounded-card-sm border border-contour-subtle hover:border-brand hover:shadow-subtle transition-all text-center group"
          >
            <Calendar className="w-5 h-5 text-ink-muted group-hover:text-brand transition-colors mb-1.5" />
            <span className="text-xs font-bold text-ink-primary">View Bookings</span>
            <span className="text-[10px] text-ink-muted">Manage calendar</span>
          </Link>

          <Link
            href="/photographer/availability"
            className="flex flex-col items-center justify-center p-3.5 bg-white rounded-card-sm border border-contour-subtle hover:border-brand hover:shadow-subtle transition-all text-center group"
          >
            <Clock className="w-5 h-5 text-ink-muted group-hover:text-brand transition-colors mb-1.5" />
            <span className="text-xs font-bold text-ink-primary">Update Slots</span>
            <span className="text-[10px] text-ink-muted">Set working hours</span>
          </Link>

          <Link
            href="/photographer/portfolio"
            className="flex flex-col items-center justify-center p-3.5 bg-white rounded-card-sm border border-contour-subtle hover:border-brand hover:shadow-subtle transition-all text-center group"
          >
            <ImageIcon className="w-5 h-5 text-ink-muted group-hover:text-brand transition-colors mb-1.5" />
            <span className="text-xs font-bold text-ink-primary">Manage Portfolio</span>
            <span className="text-[10px] text-ink-muted">Add/reorder shots</span>
          </Link>

          <Link
            href="/photographer/services"
            className="flex flex-col items-center justify-center p-3.5 bg-white rounded-card-sm border border-contour-subtle hover:border-brand hover:shadow-subtle transition-all text-center group"
          >
            <Package className="w-5 h-5 text-ink-muted group-hover:text-brand transition-colors mb-1.5" />
            <span className="text-xs font-bold text-ink-primary">Add Service</span>
            <span className="text-[10px] text-ink-muted">Pricing & packages</span>
          </Link>

          <Link
            href="/photographer/settings"
            className="flex flex-col items-center justify-center p-3.5 bg-white rounded-card-sm border border-contour-subtle hover:border-brand hover:shadow-subtle transition-all text-center group col-span-2 sm:col-span-1"
          >
            <Settings className="w-5 h-5 text-ink-muted group-hover:text-brand transition-colors mb-1.5" />
            <span className="text-xs font-bold text-ink-primary">Studio Settings</span>
            <span className="text-[10px] text-ink-muted">Profile & alerts</span>
          </Link>
        </div>
      </div>

      {/* METRIC SCORECARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="space-y-1">
          <p className="text-xs uppercase font-bold text-ink-muted">In Escrow (Secured)</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-brand">₹6,000</p>
          <p className="text-[11px] text-ink-muted">Pending today&apos;s photo delivery</p>
        </Card>

        <Card className="space-y-1">
          <p className="text-xs uppercase font-bold text-ink-muted">Available for Payout</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-green-600">₹42,800</p>
          <Link href="/photographer/payouts" className="text-[11px] text-green-700 font-bold hover:underline">
            Request Instant UPI Transfer →
          </Link>
        </Card>

        <Card className="space-y-1">
          <p className="text-xs uppercase font-bold text-ink-muted">Completed Shoots</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-ink-primary">{completedCount}</p>
          <p className="text-[11px] text-ink-muted">100% on-time fulfillment rate</p>
        </Card>

        <Card className="space-y-1">
          <p className="text-xs uppercase font-bold text-ink-muted">Client Rating</p>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
              {INITIAL_PHOTOGRAPHER_PROFILE.rating}
            </span>
            <span className="text-amber-500 text-lg">★</span>
          </div>
          <Link href="/photographer/reviews" className="text-[11px] text-ink-muted hover:text-brand font-medium">
            Based on {INITIAL_PHOTOGRAPHER_PROFILE.reviewCount} verified reviews →
          </Link>
        </Card>
      </div>

      {/* ACTIVE VENUE JOB (REQUIRING SHOOT-START OTP VERIFICATION) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink-muted">
            Today&apos;s Active Venue Appointment
          </h2>
          <Badge variant={otpVerified ? 'success' : 'brand'} size="sm">
            {otpVerified ? 'Status: Shoot In Progress' : 'Status: Arrived at Venue'}
          </Badge>
        </div>

        {activeBooking && (
          <Card className="border-brand/40 bg-white p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Shoot Overview */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-ink-muted">
                  <span className="font-mono text-ink-primary">Ref: {activeBooking.id}</span>
                  <span>•</span>
                  <span>Client: {activeBooking.customerName}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-ink-secondary">
                    <Phone className="w-3 h-3" /> {activeBooking.customerPhone}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-ink-primary">
                    {activeBooking.packageTitle} ({activeBooking.duration})
                  </h3>
                  <p className="text-sm text-ink-secondary flex items-center gap-1.5 mt-1.5">
                    <MapPin className="w-4 h-4 text-brand shrink-0" />
                    <span>{activeBooking.venueAddress}</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-card-sm bg-canvas-secondary border border-contour-subtle text-xs text-ink-secondary space-y-1">
                  <p><strong>Scheduled Time:</strong> {activeBooking.date}, {activeBooking.timeSlot}</p>
                  <p><strong>Package Deliverable:</strong> 35 Edited High-Res Photos + RAW files</p>
                  <p><strong>Client Notes:</strong> {activeBooking.notes}</p>
                  <p className="text-brand font-bold"><strong>Net Creator Payout (80%):</strong> ₹{activeBooking.netEarnings.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* OTP VERIFICATION KEYPAD */}
              <div className="lg:col-span-5 bg-canvas-primary p-6 rounded-card-md border border-contour-strong text-center space-y-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-primary">
                  <KeyRound className="w-4 h-4 text-brand" />
                  <span>Verify Client&apos;s Shoot-Start OTP</span>
                </div>

                {otpVerified ? (
                  <div className="p-4 bg-green-50 rounded-card-sm border border-green-200 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
                    <p className="text-sm font-bold text-green-800">Shoot Officially In Progress!</p>
                    <p className="text-xs text-green-700">
                      Timer started at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Capture great photos.
                    </p>
                    <Link href="/photographer/bookings">
                      <Button variant="secondary" size="sm" className="mt-2">
                        View Booking Details
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    <p className="text-xs text-ink-secondary">
                      Ask client {activeBooking.customerName} for their 6-digit code to start the shoot:
                    </p>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={enteredOtp}
                      onChange={(e) => {
                        setEnteredOtp(e.target.value.replace(/\D/g, ''));
                        setOtpError('');
                      }}
                      className="w-full text-center text-2xl font-mono font-bold tracking-widest bg-white border border-contour-strong rounded-card-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand text-ink-primary"
                    />
                    {otpError && (
                      <p className="text-xs font-semibold text-red-600 text-left">
                        {otpError}
                      </p>
                    )}
                    <p className="text-[11px] text-ink-muted">
                      💡 For this demonstration, use client code: <span className="font-mono font-bold text-ink-primary">482910</span>
                    </p>
                    <Button
                      type="submit"
                      className="w-full"
                      size="md"
                      isLoading={isVerifying}
                    >
                      Confirm Arrival & Start Shoot
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* UPCOMING BOOKINGS & RECENT REVIEWS SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upcoming Bookings */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink-muted">
              Upcoming Bookings
            </h2>
            <Link
              href="/photographer/bookings"
              className="text-xs font-bold text-brand hover:underline"
            >
              See all ({bookings.length}) →
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingBookings.map((b) => (
              <Card key={b.id} className="p-4 hoverEffect">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-ink-muted">{b.id}</span>
                      <Badge
                        variant={b.status === 'CONFIRMED' ? 'brand' : 'warning'}
                        size="sm"
                      >
                        {b.status === 'CONFIRMED' ? 'Confirmed' : 'New Request'}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-ink-primary">
                      {b.packageTitle}
                    </h4>
                    <p className="text-xs text-ink-secondary flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-ink-muted" />
                      <span>{b.venueAddress}</span>
                    </p>
                    <p className="text-xs text-ink-muted">
                      Client: <strong>{b.customerName}</strong> • {b.date}, {b.timeSlot}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-ink-primary">
                      ₹{b.netEarnings.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-ink-muted">Net Payout</p>
                    <Link
                      href="/photographer/bookings"
                      className="inline-block mt-2 text-xs font-bold text-brand hover:underline"
                    >
                      Manage →
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink-muted">
              Recent Client Reviews
            </h2>
            <Link
              href="/photographer/reviews"
              className="text-xs font-bold text-brand hover:underline"
            >
              View all ({INITIAL_REVIEWS.length}) →
            </Link>
          </div>

          <div className="space-y-3">
            {INITIAL_REVIEWS.slice(0, 2).map((rev) => (
              <Card key={rev.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-primary">{rev.customerName}</span>
                  <div className="flex items-center text-amber-500 text-xs">
                    {'★'.repeat(rev.rating)}
                  </div>
                </div>
                <p className="text-xs text-ink-secondary italic">
                  &ldquo;{rev.comment}&rdquo;
                </p>
                <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1 border-t border-contour-subtle">
                  <span>{rev.category}</span>
                  <span>{rev.date}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
