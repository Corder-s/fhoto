'use client';

import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  KeyRound,
  ShieldCheck,
  Phone,
  MessageSquare,
  CheckCircle2,
  Download,
  AlertCircle,
  HelpCircle,
  CreditCard
} from 'lucide-react';
import { CustomerNoticeBanner } from '../../../../../components/customer/CustomerNoticeBanner';
import { INITIAL_CUSTOMER_BOOKINGS } from '../../../../../data/customerDashboardData';

export default function CustomerBookingDetailPage({ params }: { params: { id: string } }) {
  const booking =
    INITIAL_CUSTOMER_BOOKINGS.find((b) => b.id === params.id) ||
    INITIAL_CUSTOMER_BOOKINGS[0];

  const milestones = [
    { title: 'Shoot Booked & Paid', time: 'Yesterday, 02:30 PM', completed: true },
    { title: 'Photographer Confirmed', time: 'Yesterday, 02:45 PM', completed: true },
    { title: 'Photographer En Route', time: 'Today, 03:30 PM', completed: true },
    {
      title: 'Arrived at Venue (Awaiting OTP)',
      time: 'Today, 03:52 PM',
      completed: booking.status === 'ARRIVED_AT_VENUE' || booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED',
      current: booking.status === 'ARRIVED_AT_VENUE',
    },
    {
      title: 'Shoot in Progress',
      time: 'Pending OTP Verification',
      completed: booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED',
      current: booking.status === 'IN_PROGRESS',
    },
    {
      title: 'High-Res Photos Delivered',
      time: 'Within 48 Hours',
      completed: booking.status === 'COMPLETED',
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <CustomerNoticeBanner moduleName={`Booking Milestone Tracking: ${booking.id}`} />

      {/* Back Link */}
      <div>
        <Link
          href="/customer/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C847A] hover:text-[#FF6E00] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to all bookings</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E1D6]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#8C847A]">REF: {booking.id}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF3E6] text-[#FF6E00] border border-[#FFD9B3]">
              {booking.status}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1816] tracking-tight mt-1">
            {booking.packageTitle}
          </h1>
          <p className="text-xs text-[#665E55] mt-1">
            Category: <strong>{booking.category}</strong> • Venue: {booking.venueAddress}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-2xl font-black text-[#1A1816]">₹{booking.amountInr.toLocaleString('en-IN')}</p>
          <span className="text-[11px] font-semibold text-green-700 flex items-center sm:justify-end gap-1 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            100% Escrow Protected
          </span>
        </div>
      </div>

      {/* SHOOT-START OTP VERIFICATION CARD */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border-2 border-[#FF6E00] shadow-card text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#FF6E00]">
          <KeyRound className="w-4 h-4" />
          <span>Shoot-Start Verification OTP</span>
        </div>

        <div className="text-4xl sm:text-6xl font-mono font-black text-[#1A1816] tracking-[0.25em] bg-[#FAF7F2] py-4 rounded-2xl border border-[#E8E1D6] max-w-sm mx-auto shadow-inner">
          {booking.startOtp}
        </div>

        <p className="text-xs text-[#665E55] max-w-md mx-auto leading-relaxed">
          Provide this 6-digit code to photographer <strong>{booking.photographerName}</strong> in person upon arrival at the venue. Entering this code starts the official shoot timer.
        </p>
      </div>

      {/* MILESTONE TRACKING TIMELINE */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#EBE4DA] space-y-6 shadow-subtle">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#1A1816]">
          Live Appointment Status & Transit Timeline
        </h2>

        <div className="space-y-6 relative pl-6 border-l-2 border-[#E8E1D6]">
          {milestones.map((m, idx) => (
            <div key={idx} className="relative">
              <div
                className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 ${
                  m.current
                    ? 'bg-[#FF6E00] border-white ring-4 ring-[#FFE2C2]'
                    : m.completed
                    ? 'bg-green-600 border-white ring-2 ring-green-100'
                    : 'bg-white border-[#D5CEC4]'
                }`}
              />
              <div className="space-y-0.5">
                <p
                  className={`text-sm font-bold ${
                    m.current ? 'text-[#FF6E00]' : m.completed ? 'text-[#1A1816]' : 'text-[#8C847A]'
                  }`}
                >
                  {m.title}
                </p>
                <p className="text-xs text-[#8C847A]">{m.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PHOTOGRAPHER SUMMARY & VENUE DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Creator Info */}
        <div className="p-6 bg-white rounded-3xl border border-[#EBE4DA] space-y-4 shadow-subtle">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C847A]">
            Assigned Photographer
          </span>

          <div className="flex items-center gap-3.5">
            <img
              src={booking.photographerAvatar}
              alt={booking.photographerName}
              className="w-14 h-14 rounded-full object-cover border border-[#E8E1D6]"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-[#1A1816]">{booking.photographerName}</h3>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6E00]" />
              </div>
              <p className="text-xs text-[#8C847A]">Verified Professional • ⭐ {booking.photographerRating}</p>
              <p className="text-xs text-[#665E55] mt-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#8C847A]" />
                <span>{booking.photographerPhone}</span>
              </p>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <Link
              href={`/photographers/${booking.photographerId}`}
              className="px-4 py-2 rounded-full text-xs font-bold text-[#1A1816] bg-[#F2ECE3] hover:bg-[#EAE2D7] transition-colors"
            >
              View Full Profile & Gear
            </Link>
          </div>
        </div>

        {/* Venue & Time */}
        <div className="p-6 bg-white rounded-3xl border border-[#EBE4DA] space-y-4 shadow-subtle">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C847A]">
            Venue & Shooting Schedule
          </span>

          <div className="space-y-2 text-xs text-[#665E55]">
            <p className="flex items-start gap-2 font-medium text-[#1A1816]">
              <MapPin className="w-4 h-4 text-[#FF6E00] shrink-0 mt-0.5" />
              <span>{booking.venueAddress}</span>
            </p>
            <p className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#8C847A] shrink-0" />
              <span>{booking.date}, {booking.timeSlot}</span>
            </p>
            <p className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#8C847A] shrink-0" />
              <span>{booking.duration} Duration</span>
            </p>
          </div>

          <div className="p-3 bg-[#FAF7F2] rounded-xl text-[11px] text-[#665E55]">
            <strong>Deliverables:</strong> {booking.deliverablesSummary}
          </div>
        </div>
      </div>

      {/* PRICE & ESCROW POLICY */}
      <div className="p-6 bg-white rounded-3xl border border-[#EBE4DA] space-y-4 shadow-subtle">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#1A1816]">
          Payment & Escrow Protection Summary
        </h3>

        <div className="divide-y divide-[#F0EAE1] text-xs">
          <div className="py-2.5 flex justify-between">
            <span className="text-[#665E55]">Base Shoot Package Rate</span>
            <span className="font-bold text-[#1A1816]">₹{booking.amountInr.toLocaleString('en-IN')}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-[#665E55]">Payment Mode</span>
            <span className="font-mono text-[#1A1816]">UPI - Google Pay (aarav@okaxis)</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-[#665E55]">Escrow Security Status</span>
            <span className="font-bold text-green-700">Funds Held in Secured Escrow</span>
          </div>
        </div>

        <div className="p-3 bg-[#FAF7F2] rounded-xl text-xs text-[#665E55] flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-[#FF6E00] shrink-0 mt-0.5" />
          <p>
            Funds are released to the photographer only after you review and approve the final delivered gallery. Need help? Contact SnapShoot 24/7 Concierge Support at <span className="font-bold text-[#1A1816]">support@snapshoot.in</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
