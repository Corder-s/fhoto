'use client';

import React from 'react';
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
  AlertCircle
} from 'lucide-react';
import { CustomerNoticeBanner } from '../../../../components/customer/CustomerNoticeBanner';
import {
  INITIAL_CUSTOMER_PROFILE,
  INITIAL_CUSTOMER_BOOKINGS,
  INITIAL_GALLERY_PHOTOS,
  INITIAL_NOTIFICATIONS
} from '../../../../data/customerDashboardData';

export default function CustomerDashboardPage() {
  const activeBooking = INITIAL_CUSTOMER_BOOKINGS.find(
    (b) => b.status === 'ARRIVED_AT_VENUE' || b.status === 'ON_THE_WAY'
  );
  const upcomingBookings = INITIAL_CUSTOMER_BOOKINGS.filter((b) => b.status === 'CONFIRMED');
  const completedCount = INITIAL_CUSTOMER_BOOKINGS.filter((b) => b.status === 'COMPLETED').length;

  const favoritePhotographers = [
    {
      id: 'pro-aman',
      name: 'Aman Verma',
      avatar: '/reference-assets/avatar_aman.jpg',
      category: 'Portraits & Lifestyle',
      location: 'Greater Noida, UP',
      rating: 4.9,
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

  return (
    <div className="space-y-8">
      <CustomerNoticeBanner moduleName="Client Workspace Dashboard" />

      {/* Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E1D6]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1816] tracking-tight">
            Welcome back, {INITIAL_CUSTOMER_PROFILE.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#665E55] mt-1">
            Track live shoot appointments, verify photographer OTPs, and access delivered 4K galleries.
          </p>
        </div>

        <Link
          href="/explore"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#FF6E00] hover:bg-[#E86300] active:scale-95 shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Book a Photographer</span>
        </Link>
      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="space-y-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C847A]">
          Quick Actions
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/explore"
            className="p-4 bg-white rounded-2xl border border-[#EBE4DA] hover:border-[#FF6E00] hover:shadow-card transition-all flex flex-col items-center text-center group"
          >
            <div className="w-10 h-10 rounded-full bg-[#FAF7F2] group-hover:bg-[#FFF4E6] flex items-center justify-center text-[#FF6E00] mb-2 transition-colors">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1A1816]">Find a Photographer</span>
            <span className="text-[10px] text-[#8C847A] mt-0.5">Explore local creators</span>
          </Link>

          <Link
            href="/customer/bookings"
            className="p-4 bg-white rounded-2xl border border-[#EBE4DA] hover:border-[#FF6E00] hover:shadow-card transition-all flex flex-col items-center text-center group"
          >
            <div className="w-10 h-10 rounded-full bg-[#FAF7F2] group-hover:bg-[#FFF4E6] flex items-center justify-center text-[#FF6E00] mb-2 transition-colors">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1A1816]">View My Bookings</span>
            <span className="text-[10px] text-[#8C847A] mt-0.5">Track shoots & status</span>
          </Link>

          <Link
            href="/customer/gallery"
            className="p-4 bg-white rounded-2xl border border-[#EBE4DA] hover:border-[#FF6E00] hover:shadow-card transition-all flex flex-col items-center text-center group"
          >
            <div className="w-10 h-10 rounded-full bg-[#FAF7F2] group-hover:bg-[#FFF4E6] flex items-center justify-center text-[#FF6E00] mb-2 transition-colors">
              <ImageIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1A1816]">Photo Gallery</span>
            <span className="text-[10px] text-[#8C847A] mt-0.5">Download high-res proofs</span>
          </Link>

          <Link
            href="/customer/settings"
            className="p-4 bg-white rounded-2xl border border-[#EBE4DA] hover:border-[#FF6E00] hover:shadow-card transition-all flex flex-col items-center text-center group"
          >
            <div className="w-10 h-10 rounded-full bg-[#FAF7F2] group-hover:bg-[#FFF4E6] flex items-center justify-center text-[#FF6E00] mb-2 transition-colors">
              <User className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1A1816]">Manage Profile</span>
            <span className="text-[10px] text-[#8C847A] mt-0.5">Preferences & privacy</span>
          </Link>
        </div>
      </div>

      {/* ACTIVE CONFIRMED SHOOT WITH SHOOT-START OTP (CRITICAL PRODUCT COMPONENT) */}
      {activeBooking && (
        <div className="space-y-3">
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
              {/* Left Shoot Overview */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#8C847A]">
                  <span className="font-mono text-[#1A1816]">Ref: {activeBooking.id}</span>
                  <span>•</span>
                  <span>{activeBooking.category}</span>
                  <span>•</span>
                  <span className="text-green-700">₹{activeBooking.amountInr.toLocaleString('en-IN')} in Escrow</span>
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

              {/* Right Shoot-Start OTP Keypad Display */}
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
        </div>
      )}

      {/* SUMMARY SCORECARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <p className="text-2xl sm:text-3xl font-black text-green-700">65</p>
          <Link href="/customer/gallery" className="text-[11px] font-bold text-[#FF6E00] hover:underline">
            Open Proofing Gallery →
          </Link>
        </div>
      </div>

      {/* FAVORITE PHOTOGRAPHERS & RECENT ACTIVITY SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Favorite Creators */}
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

        {/* Recent Activity & Delivery Highlights */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C847A]">
              Recent Activity & Updates
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
      </div>
    </div>
  );
}
