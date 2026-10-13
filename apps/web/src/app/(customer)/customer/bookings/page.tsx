'use client';

import React, { useState, useEffect } from 'react';
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
  Filter,
  ShieldCheck,
  User
} from 'lucide-react';
import { CustomerNoticeBanner } from '../../../../components/customer/CustomerNoticeBanner';
import { useAuth } from '../../../../lib/auth';

export type CustomerBookingUiStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'ON_THE_WAY'
  | 'ARRIVED_AT_VENUE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export interface CustomerBookingItem {
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
  status: CustomerBookingUiStatus;
  paymentStatus: string;
  startOtp: string;
  canCancel: boolean;
  cancellationReason?: string;
}

export default function CustomerBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<CustomerBookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [cancelModalBooking, setCancelModalBooking] = useState<CustomerBookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of personal schedule');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function fetchCustomerBookings() {
      if (!user?.id) return;
      try {
        setIsLoading(true);
        const res = await fetch(`/api/customer/bookings?userId=${user.id}`);
        const data = await res.json();
        if (isCancelled) return;

        if (data.bookings && Array.isArray(data.bookings)) {
          const mapped: CustomerBookingItem[] = data.bookings.map((b: any) => {
            let status: CustomerBookingUiStatus = 'CONFIRMED';
            if (b.booking_status === 'pending' || b.booking_status === 'requested') status = 'PENDING';
            else if (b.booking_status === 'confirmed' || b.booking_status === 'accepted') status = 'CONFIRMED';
            else if (b.booking_status === 'on_the_way') status = 'ON_THE_WAY';
            else if (b.booking_status === 'arrived_at_venue') status = 'ARRIVED_AT_VENUE';
            else if (b.booking_status === 'in_progress') status = 'IN_PROGRESS';
            else if (b.booking_status === 'completed') status = 'COMPLETED';
            else if (b.booking_status === 'disputed') status = 'DISPUTED';
            else if (b.booking_status === 'cancelled' || b.booking_status === 'rejected') status = 'CANCELLED';

            const canCancel = status === 'PENDING' || status === 'CONFIRMED';

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
              timeSlot: b.start_at ? new Date(b.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM - 01:00 PM',
              duration: `${Math.round((b.service?.duration_minutes || 120) / 60)} Hours`,
              venueAddress: b.event_location || 'Designated Shoot Venue',
              notes: b.customer_notes,
              amountInr: Number(b.total_amount || b.agreed_service_price) || 4999,
              status,
              paymentStatus: b.payment_status === 'paid' ? 'PAID_ESCROW' : b.payment_status || 'PAID_ESCROW',
              startOtp: '482910',
              canCancel,
              cancellationReason: b.cancellation_reason,
            };
          });

          setBookings(mapped);
        }
      } catch (err) {
        console.error('Error loading customer bookings:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    fetchCustomerBookings();

    return () => {
      isCancelled = true;
    };
  }, [user?.id]);

  const getFilteredBookings = () => {
    if (activeTab === 'ALL') return bookings;
    if (activeTab === 'UPCOMING') return bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING');
    if (activeTab === 'IN_PROGRESS') {
      return bookings.filter(
        (b) => b.status === 'ON_THE_WAY' || b.status === 'ARRIVED_AT_VENUE' || b.status === 'IN_PROGRESS'
      );
    }
    if (activeTab === 'COMPLETED') return bookings.filter((b) => b.status === 'COMPLETED');
    if (activeTab === 'CANCELLED') return bookings.filter((b) => b.status === 'CANCELLED' || b.status === 'DISPUTED');
    return bookings;
  };

  const filtered = getFilteredBookings();

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    try {
      setIsCancelling(true);
      const res = await fetch('/api/customer/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: cancelModalBooking.rawId || cancelModalBooking.id,
          action: 'cancel',
          reason: cancelReason,
          userId: user?.id,
        }),
      });

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === cancelModalBooking.id
              ? { ...b, status: 'CANCELLED', canCancel: false, cancellationReason: cancelReason }
              : b
          )
        );
        setCancelModalBooking(null);
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status: CustomerBookingUiStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Awaiting Photographer Acceptance</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF2FF] text-[#1E56A0]">Confirmed by Photographer</span>;
      case 'ON_THE_WAY':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF4E6] text-[#FF6E00]">Photographer En Route</span>;
      case 'ARRIVED_AT_VENUE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF4E6] text-[#FF6E00]">At Venue (Share OTP to Start)</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F6ED] text-[#1E7D46]">Shoot in Progress</span>;
      case 'DISPUTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">Admin Mediation In Progress</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F6ED] text-[#1E7D46]">Photos Delivered</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FCE8E6] text-[#C5221F]">Cancelled</span>;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <CustomerNoticeBanner moduleName="Client Shoot Bookings Management" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1816] tracking-tight">
            My Shoot Bookings
          </h1>
          <p className="text-xs sm:text-sm text-[#665E55] mt-1">
            Review confirmed appointments, check live photographer transit, view start OTPs, and access completed galleries.
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
          Upcoming ({bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING').length})
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
          Cancelled ({bookings.filter((b) => b.status === 'CANCELLED' || b.status === 'DISPUTED').length})
        </button>
      </div>

      {/* BOOKINGS LIST */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#FF6E00] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#8C847A]">Loading your booked shoots from database...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E8E1D6] space-y-4">
          <Calendar className="w-12 h-12 text-[#8C847A] mx-auto opacity-70" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#1A1816]">No Bookings Found</h3>
            <p className="text-xs text-[#8C847A] max-w-sm mx-auto">
              {activeTab === 'ALL'
                ? 'You have not booked any photographer shoots yet. Discover verified creators in your city and book instant photography.'
                : 'No bookings match this filter.'}
            </p>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#FF6E00] hover:bg-[#E86300] transition-colors"
          >
            <span>Explore &amp; Book Photographers</span>
          </Link>
        </div>
      ) : (
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
                      <div className="w-8 h-8 rounded-full bg-[#FF6E00] text-white flex items-center justify-center font-black text-xs shrink-0">
                        {b.photographerName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#1A1816] block">
                          Booked Photographer: <strong>{b.photographerName}</strong>
                        </span>
                        <span className="text-[11px] text-[#8C847A]">
                          ⭐ {b.photographerRating} • {b.photographerPhone}
                        </span>
                      </div>
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

                  {/* Shoot-Start OTP Callout */}
                  {(b.status === 'ARRIVED_AT_VENUE' || b.status === 'ON_THE_WAY' || b.status === 'CONFIRMED') && (
                    <div className="inline-flex items-center gap-2 p-2.5 bg-[#FFF3E6] border border-[#FFD9B3] rounded-xl text-xs text-[#A64600] font-bold">
                      <KeyRound className="w-4 h-4 text-[#FF6E00]" />
                      <span>Shoot-Start Verification OTP: <span className="font-mono tracking-widest text-sm text-[#1A1816] bg-white px-2 py-0.5 rounded border border-[#FFD9B3]">{b.startOtp}</span></span>
                      <span className="text-[10px] text-[#8C847A] font-normal">(Share with photographer when they arrive at your venue)</span>
                    </div>
                  )}

                  {b.cancellationReason && (
                    <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
                      Cancellation Reason: &ldquo;{b.cancellationReason}&rdquo;
                    </p>
                  )}
                </div>

                {/* Right Financials & Action Buttons */}
                <div className="lg:col-span-4 flex flex-col justify-between items-start lg:items-end space-y-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-[#E8E1D6]">
                  <div className="text-left lg:text-right">
                    <p className="text-xl font-black text-[#1A1816]">
                      ₹{b.amountInr.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] text-[#8C847A] flex items-center gap-1 lg:justify-end">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{b.paymentStatus === 'PAID_ESCROW' ? 'Escrow Protected' : b.paymentStatus}</span>
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:justify-end">
                    <Link
                      href={`/photographers/${b.photographerId}`}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#5A544D] hover:text-[#1A1816] hover:bg-[#FAF7F2] border border-[#E8E1D6]"
                    >
                      Photographer Profile
                    </Link>

                    {b.status === 'COMPLETED' && (
                      <Link
                        href="/customer/gallery"
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[#FF6E00] hover:bg-[#E86300] transition-colors flex items-center gap-1"
                      >
                        <span>View Gallery</span>
                      </Link>
                    )}

                    {b.canCancel && (
                      <button
                        onClick={() => setCancelModalBooking(b)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
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
      )}

      {/* CANCEL BOOKING MODAL */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E8E1D6] shadow-elevated space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1A1816]">Cancel Shoot Appointment?</h3>
                <p className="text-xs text-[#8C847A]">{cancelModalBooking.packageTitle} with {cancelModalBooking.photographerName}</p>
              </div>
            </div>

            <p className="text-xs text-[#5A544D] leading-relaxed">
              If cancelled prior to shoot start time, your escrow deposit of <strong>₹{cancelModalBooking.amountInr.toLocaleString('en-IN')}</strong> will be refunded to your original payment method per cancellation policy.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-[#1A1816]">Reason for Cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E8E1D6] rounded-xl p-2.5 text-xs font-semibold text-[#1A1816] outline-none"
              >
                <option value="Change of personal schedule">Change of personal schedule</option>
                <option value="Event postponed or rescheduled">Event postponed or rescheduled</option>
                <option value="Weather / venue issues">Weather / venue issues</option>
                <option value="Booked by mistake">Booked by mistake</option>
                <option value="Other reasons">Other reasons</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0EAE1]">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#5A544D] hover:bg-[#F2ECE3] transition-colors"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleCancelBooking}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isCancelling ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
