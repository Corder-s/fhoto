'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Camera,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  KeyRound,
  Download,
  Filter
} from 'lucide-react';
import { CustomerNoticeBanner } from '../../../../components/customer/CustomerNoticeBanner';
import {
  INITIAL_CUSTOMER_BOOKINGS,
  CustomerBooking,
  CustomerBookingStatus
} from '../../../../data/customerDashboardData';

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<CustomerBooking[]>(INITIAL_CUSTOMER_BOOKINGS);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [cancelModalBooking, setCancelModalBooking] = useState<CustomerBooking | null>(null);

  const getFilteredBookings = () => {
    if (activeTab === 'ALL') return bookings;
    if (activeTab === 'UPCOMING') return bookings.filter((b) => b.status === 'CONFIRMED');
    if (activeTab === 'IN_PROGRESS') {
      return bookings.filter(
        (b) => b.status === 'ON_THE_WAY' || b.status === 'ARRIVED_AT_VENUE' || b.status === 'IN_PROGRESS'
      );
    }
    if (activeTab === 'COMPLETED') return bookings.filter((b) => b.status === 'COMPLETED');
    if (activeTab === 'CANCELLED') return bookings.filter((b) => b.status === 'CANCELLED');
    return bookings;
  };

  const filtered = getFilteredBookings();

  const handleCancelBooking = () => {
    if (!cancelModalBooking) return;
    setBookings(
      bookings.map((b) =>
        b.id === cancelModalBooking.id
          ? { ...b, status: 'CANCELLED', paymentStatus: 'REFUNDED', canCancel: false }
          : b
      )
    );
    setCancelModalBooking(null);
  };

  const getStatusBadge = (status: CustomerBookingStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF2FF] text-[#1E56A0]">Confirmed</span>;
      case 'ON_THE_WAY':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF4E6] text-[#FF6E00]">En Route</span>;
      case 'ARRIVED_AT_VENUE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF4E6] text-[#FF6E00]">At Venue (Awaiting OTP)</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F6ED] text-[#1E7D46]">Shoot in Progress</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F6ED] text-[#1E7D46]">Photos Delivered</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FCE8E6] text-[#C5221F]">Cancelled</span>;
    }
  };

  return (
    <div className="space-y-8">
      <CustomerNoticeBanner moduleName="Client Shoot Bookings Management" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1816] tracking-tight">
            My Shoot Bookings
          </h1>
          <p className="text-xs sm:text-sm text-[#665E55] mt-1">
            Review confirmed appointments, check live photographer transit, and access completed galleries.
          </p>
        </div>

        <Link
          href="/explore"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#FF6E00] hover:bg-[#E86300] active:scale-95 shadow-sm transition-all shrink-0"
        >
          <span>Book a New Shoot</span>
        </Link>
      </div>

      {/* TAB FILTERS */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-[#E8E1D6]">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'ALL'
              ? 'bg-[#1A1816] text-white shadow-sm'
              : 'bg-white text-[#5A544D] hover:text-[#1A1816] border border-[#E8E1D6]'
          }`}
        >
          All Bookings ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab('IN_PROGRESS')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'IN_PROGRESS'
              ? 'bg-[#FF6E00] text-white shadow-sm'
              : 'bg-white text-[#5A544D] hover:text-[#1A1816] border border-[#E8E1D6]'
          }`}
        >
          In Progress ({bookings.filter((b) => b.status === 'ARRIVED_AT_VENUE' || b.status === 'ON_THE_WAY' || b.status === 'IN_PROGRESS').length})
        </button>

        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'UPCOMING'
              ? 'bg-[#1A1816] text-white shadow-sm'
              : 'bg-white text-[#5A544D] hover:text-[#1A1816] border border-[#E8E1D6]'
          }`}
        >
          Upcoming ({bookings.filter((b) => b.status === 'CONFIRMED').length})
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'COMPLETED'
              ? 'bg-[#1A1816] text-white shadow-sm'
              : 'bg-white text-[#5A544D] hover:text-[#1A1816] border border-[#E8E1D6]'
          }`}
        >
          Completed ({bookings.filter((b) => b.status === 'COMPLETED').length})
        </button>

        <button
          onClick={() => setActiveTab('CANCELLED')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'CANCELLED'
              ? 'bg-[#1A1816] text-white shadow-sm'
              : 'bg-white text-[#5A544D] hover:text-[#1A1816] border border-[#E8E1D6]'
          }`}
        >
          Cancelled ({bookings.filter((b) => b.status === 'CANCELLED').length})
        </button>
      </div>

      {/* BOOKINGS LIST */}
      <div className="space-y-4">
        {filtered.map((b) => (
          <div
            key={b.id}
            className={`p-6 rounded-3xl border transition-all ${
              b.status === 'ARRIVED_AT_VENUE' || b.status === 'IN_PROGRESS'
                ? 'bg-white border-[#FF6E00]/50 shadow-card'
                : 'bg-white border-[#EBE4DA] shadow-subtle'
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Details */}
              <div className="lg:col-span-8 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-[#1A1816]">{b.id}</span>
                  <span>•</span>
                  <span className="text-[#8C847A]">{b.category}</span>
                  <span>•</span>
                  {getStatusBadge(b.status)}
                </div>

                <div>
                  <h3 className="text-lg font-black text-[#1A1816]">
                    {b.packageTitle}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <img
                      src={b.photographerAvatar}
                      alt={b.photographerName}
                      className="w-7 h-7 rounded-full object-cover border border-[#E8E1D6]"
                    />
                    <span className="text-xs font-bold text-[#1A1816]">{b.photographerName}</span>
                    <span className="text-xs text-[#8C847A]">⭐ {b.photographerRating}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#665E55] pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#8C847A]" />
                    <strong>{b.date}</strong>, {b.timeSlot}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#8C847A]" />
                    {b.duration}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#8C847A]" />
                    {b.venueAddress}
                  </span>
                </div>

                {/* In Progress OTP Callout */}
                {(b.status === 'ARRIVED_AT_VENUE' || b.status === 'ON_THE_WAY') && (
                  <div className="inline-flex items-center gap-2 p-2.5 bg-[#FFF3E6] border border-[#FFD9B3] rounded-xl text-xs text-[#A64600] font-bold">
                    <KeyRound className="w-4 h-4 text-[#FF6E00]" />
                    <span>Shoot-Start Verification OTP: <span className="font-mono tracking-widest text-sm text-[#1A1816] bg-white px-2 py-0.5 rounded border border-[#FFD9B3]">{b.startOtp}</span></span>
                  </div>
                )}
              </div>

              {/* Right Financials & Action Buttons */}
              <div className="lg:col-span-4 flex flex-col justify-between items-start lg:items-end space-y-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-[#E8E1D6]">
                <div className="text-left lg:text-right">
                  <p className="text-xl font-black text-[#1A1816]">
                    ₹{b.amountInr.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-[#8C847A]">
                    Payment: <span className="font-semibold text-green-700">{b.paymentStatus === 'PAID_ESCROW' ? 'Escrow Protected' : b.paymentStatus}</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full lg:justify-end">
                  <Link
                    href={`/customer/bookings/${b.id}`}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#1A1816] bg-[#F2ECE3] hover:bg-[#EAE2D7] transition-colors"
                  >
                    View Details
                  </Link>

                  <Link
                    href={`/photographers/${b.photographerId}`}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#5A544D] hover:text-[#1A1816] hover:bg-[#FAF7F2] border border-[#E8E1D6]"
                  >
                    Photographer Profile
                  </Link>

                  {/* If completed, link to gallery */}
                  {b.status === 'COMPLETED' && (
                    <Link
                      href="/customer/gallery"
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[#FF6E00] hover:bg-[#E86300] transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>View Photos</span>
                    </Link>
                  )}

                  {/* If eligible for review */}
                  {b.status === 'COMPLETED' && !b.hasReview && (
                    <Link
                      href="/customer/reviews"
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#1A1816] bg-[#FFF3E6] border border-[#FFD9B3] hover:bg-[#FFE2C2]"
                    >
                      Leave Review
                    </Link>
                  )}

                  {/* Cancellation if allowed */}
                  {b.canCancel && (
                    <button
                      type="button"
                      onClick={() => setCancelModalBooking(b)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200"
                    >
                      Cancel Shoot
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CANCELLATION MODAL */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 border border-[#E8E1D6] shadow-elevated">
            <h3 className="text-lg font-bold text-[#1A1816]">Cancel Booking {cancelModalBooking.id}?</h3>
            <p className="text-xs text-[#665E55] leading-relaxed">
              According to the SnapShoot Cancellation Policy, cancellations made more than 24 hours prior to the shoot qualify for a <strong>100% full refund</strong> back to your original payment method.
            </p>
            <div className="p-3 bg-[#FAF7F2] rounded-xl text-xs space-y-1">
              <p>Photographer: <strong>{cancelModalBooking.photographerName}</strong></p>
              <p>Refund Amount: <strong>₹{cancelModalBooking.amountInr.toLocaleString('en-IN')}</strong></p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 rounded-full text-xs font-bold text-[#5A544D] hover:bg-[#F2ECE3]"
              >
                Keep Shoot
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                className="px-4 py-2 rounded-full text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
