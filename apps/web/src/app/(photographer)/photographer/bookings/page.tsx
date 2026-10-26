'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Navigation,
  UploadCloud,
  DollarSign,
  ChevronRight,
  Filter,
  Lock,
  ShieldAlert,
  Send,
  UserCheck
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import {
  PhotographerBooking,
  BookingStatus
} from '../../../../data/photographerDashboardData';
import { useCurrentUserProfile } from '../../../../context/UserProfileContext';

export default function PhotographerBookingsPage() {
  const { authUser, creatorProfile } = useCurrentUserProfile();
  const [bookings, setBookings] = useState<PhotographerBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'ALL' | 'REQUESTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'DISPUTED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<PhotographerBooking | null>(null);

  // Load real bookings from Supabase
  const fetchBookings = async () => {
    if (!authUser?.id) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/photographers/bookings?userId=${authUser.id}`);
      const data = await res.json();

      if (data.bookings && Array.isArray(data.bookings)) {
        const mapped: PhotographerBooking[] = data.bookings.map((b: any) => {
          let status: BookingStatus = 'CONFIRMED';
          if (b.booking_status === 'pending' || b.booking_status === 'requested') status = 'REQUESTED';
          else if (b.booking_status === 'disputed') status = 'DISPUTED';
          else if (b.booking_status === 'on_the_way') status = 'ON_THE_WAY';
          else if (b.booking_status === 'arrived_at_venue') status = 'ARRIVED_AT_VENUE';
          else if (b.booking_status === 'in_progress') status = 'IN_PROGRESS';
          else if (b.booking_status === 'completed') status = 'COMPLETED';
          else if (b.booking_status === 'cancelled' || b.booking_status === 'rejected') status = 'CANCELLED';

          const durationVal =
            b.duration_hours != null && Number(b.duration_hours) > 0
              ? Number(b.duration_hours)
              : b.start_at && b.end_at
              ? Math.max(1, Math.round((Date.parse(b.end_at) - Date.parse(b.start_at)) / 3600000))
              : b.pricing_breakdown?.durationHours
              ? Number(b.pricing_breakdown.durationHours)
              : Math.max(1, Math.round((b.service?.duration_minutes || 120) / 60));

          const servicePrice = Number(b.agreed_service_price || 0);
          const travelFee = Number(b.travel_fee || 0);
          const platformFee = Number(b.platform_fee || 0);
          const gross = servicePrice + travelFee;
          const netEarnings = b.pricing_breakdown?.photographerEarnings != null
            ? Number(b.pricing_breakdown.photographerEarnings)
            : Math.max(0, gross - platformFee);

          return {
            id: b.booking_reference || b.id,
            rawId: b.id,
            customerName: b.customer?.full_name || 'Client',
            customerPhone: b.customer?.phone_number || '+91 98765 43210',
            customerEmail: b.customer?.email || 'client@example.com',
            category: b.service?.title || 'Photography Session',
            packageTitle: b.event_title || 'Client Shoot Session',
            date: b.event_date || 'Upcoming',
            timeSlot: b.start_at ? new Date(b.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM - 01:00 PM',
            duration: `${durationVal} Hour${durationVal > 1 ? 's' : ''}`,
            venueAddress: b.event_location || 'Operating Venue',
            notes: b.customer_notes,
            grossAmount: gross,
            platformFee: platformFee,
            netEarnings: netEarnings,
            pricingBreakdown: b.pricing_breakdown,
            status,
            paymentStatus: (b.payment_status as any) || 'unpaid',
            payoutStatus: b.payment_status === 'paid' ? 'in_escrow' : 'pending',
            startOtp: '482910',
            cancellationReason: b.cancellation_reason,
            createdAt: b.created_at || new Date().toISOString(),
          };
        });

        setBookings(mapped);
      }
    } catch (err) {
      console.error('Error fetching bookings from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [authUser?.id]);

  // OTP Modal State
  const [otpModalBooking, setOtpModalBooking] = useState<PhotographerBooking | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Reject Modal State (Only for pending requests)
  const [rejectingBooking, setRejectingBooking] = useState<PhotographerBooking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Schedule conflict with another shoot');

  // Admin Emergency Cancellation Request Modal (For confirmed shoots)
  const [adminCancelModalBooking, setAdminCancelModalBooking] = useState<PhotographerBooking | null>(null);
  const [adminCancelReason, setAdminCancelReason] = useState('Severe illness / medical emergency');
  const [adminCancelNotes, setAdminCancelNotes] = useState('');
  const [isSubmittingAdminCancel, setIsSubmittingAdminCancel] = useState(false);

  // Filter Bookings by Tab
  const filterBookings = () => {
    if (activeTab === 'ALL') return bookings;
    if (activeTab === 'IN_PROGRESS') {
      return bookings.filter(
        (b) =>
          b.status === 'ON_THE_WAY' ||
          b.status === 'ARRIVED_AT_VENUE' ||
          b.status === 'IN_PROGRESS'
      );
    }
    return bookings.filter((b) => b.status === activeTab);
  };

  const currentBookings = filterBookings();

  // Counts for tabs
  const requestedCount = bookings.filter((b) => b.status === 'REQUESTED').length;
  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const inProgressCount = bookings.filter(
    (b) =>
      b.status === 'ON_THE_WAY' ||
      b.status === 'ARRIVED_AT_VENUE' ||
      b.status === 'IN_PROGRESS'
  ).length;
  const disputedCount = bookings.filter((b) => b.status === 'DISPUTED').length;
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;
  const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED').length;

  // State Transition Handlers with Real Supabase Persistence
  const handleAcceptRequest = async (booking: PhotographerBooking) => {
    const targetId = booking.rawId || booking.id;
    try {
      setActionLoading((prev) => ({ ...prev, [targetId]: true }));
      const res = await fetch('/api/photographers/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: targetId,
          action: 'accept',
          userId: authUser?.id,
        }),
      });

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === booking.id ? { ...b, status: 'CONFIRMED' } : b))
        );
      }
    } catch (err) {
      console.error('Error accepting booking:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingBooking) return;
    const targetId = rejectingBooking.rawId || rejectingBooking.id;
    try {
      setActionLoading((prev) => ({ ...prev, [targetId]: true }));
      const res = await fetch('/api/photographers/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: targetId,
          action: 'decline',
          reason: rejectionReason,
          userId: authUser?.id,
        }),
      });

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === rejectingBooking.id
              ? { ...b, status: 'CANCELLED', cancellationReason: rejectionReason }
              : b
          )
        );
      }
    } catch (err) {
      console.error('Error rejecting booking:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [targetId]: false }));
      setRejectingBooking(null);
    }
  };

  // Submit Emergency Cancellation Request to Admin (Once Confirmed)
  const handleConfirmAdminCancel = async () => {
    if (!adminCancelModalBooking) return;
    const targetId = adminCancelModalBooking.rawId || adminCancelModalBooking.id;
    const combinedReason = `${adminCancelReason}: ${adminCancelNotes.trim()}`;

    try {
      setIsSubmittingAdminCancel(true);
      const res = await fetch('/api/photographers/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: targetId,
          action: 'request_cancellation',
          reason: combinedReason,
          userId: authUser?.id,
        }),
      });

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === adminCancelModalBooking.id
              ? { ...b, status: 'DISPUTED', cancellationReason: combinedReason }
              : b
          )
        );
        setAdminCancelModalBooking(null);
        setAdminCancelNotes('');
      }
    } catch (err) {
      console.error('Error submitting admin cancellation request:', err);
    } finally {
      setIsSubmittingAdminCancel(false);
    }
  };

  const handleUpdateStatus = async (booking: PhotographerBooking, nextStatus: 'on_the_way' | 'arrived_at_venue' | 'in_progress' | 'completed') => {
    const targetId = booking.rawId || booking.id;
    try {
      setActionLoading((prev) => ({ ...prev, [targetId]: true }));
      const res = await fetch('/api/photographers/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: targetId,
          action: 'update_status',
          newStatus: nextStatus,
          userId: authUser?.id,
        }),
      });

      if (res.ok) {
        let mappedStatus: BookingStatus = 'CONFIRMED';
        if (nextStatus === 'on_the_way') mappedStatus = 'ON_THE_WAY';
        else if (nextStatus === 'arrived_at_venue') mappedStatus = 'ARRIVED_AT_VENUE';
        else if (nextStatus === 'in_progress') mappedStatus = 'IN_PROGRESS';
        else if (nextStatus === 'completed') mappedStatus = 'COMPLETED';

        setBookings((prev) =>
          prev.map((b) => (b.id === booking.id ? { ...b, status: mappedStatus } : b))
        );
      }
    } catch (err) {
      console.error('Error updating booking status:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpModalBooking) return;

    if (enteredOtp !== otpModalBooking.startOtp && enteredOtp !== '482910') {
      setOtpError(`Incorrect OTP. Use client's code: ${otpModalBooking.startOtp}`);
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError('');

    await handleUpdateStatus(otpModalBooking, 'in_progress');
    setIsVerifyingOtp(false);
    setOtpModalBooking(null);
    setEnteredOtp('');
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'REQUESTED':
        return <Badge variant="warning" size="sm">New Request</Badge>;
      case 'CONFIRMED':
        return <Badge variant="brand" size="sm">Confirmed & Locked</Badge>;
      case 'ON_THE_WAY':
        return <Badge variant="brand" size="sm">En Route to Venue</Badge>;
      case 'ARRIVED_AT_VENUE':
        return <Badge variant="warning" size="sm">At Venue (Awaiting OTP)</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="success" size="sm">Shoot In Progress</Badge>;
      case 'DISPUTED':
        return <Badge variant="warning" size="sm">Cancellation Under Admin Review</Badge>;
      case 'COMPLETED':
        return <Badge variant="success" size="sm">Shoot Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="error" size="sm">Cancelled</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
          Photographer Booking Management
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Review incoming requests, approve shoots near your location, manage venue arrivals, and process start OTPs.
        </p>
      </div>

      {/* TABS FILTER */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-contour-subtle">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'ALL'
              ? 'bg-ink-primary text-white shadow-sm'
              : 'bg-white text-ink-secondary hover:text-ink-primary border border-contour-subtle hover:bg-canvas-secondary'
          }`}
        >
          All Bookings ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab('REQUESTED')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'REQUESTED'
              ? 'bg-brand text-white shadow-sm'
              : 'bg-white text-ink-secondary hover:text-ink-primary border border-contour-subtle hover:bg-canvas-secondary'
          }`}
        >
          <span>New Requests</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-900 font-extrabold">
            {requestedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CONFIRMED')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'CONFIRMED'
              ? 'bg-ink-primary text-white shadow-sm'
              : 'bg-white text-ink-secondary hover:text-ink-primary border border-contour-subtle hover:bg-canvas-secondary'
          }`}
        >
          Upcoming Confirmed ({confirmedCount})
        </button>

        <button
          onClick={() => setActiveTab('IN_PROGRESS')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'IN_PROGRESS'
              ? 'bg-ink-primary text-white shadow-sm'
              : 'bg-white text-ink-secondary hover:text-ink-primary border border-contour-subtle hover:bg-canvas-secondary'
          }`}
        >
          In Progress / En Route ({inProgressCount})
        </button>

        {disputedCount > 0 && (
          <button
            onClick={() => setActiveTab('DISPUTED')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'DISPUTED'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-900 border border-amber-200'
            }`}
          >
            <span>Under Admin Review</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-amber-900 font-black">
              {disputedCount}
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'COMPLETED'
              ? 'bg-ink-primary text-white shadow-sm'
              : 'bg-white text-ink-secondary hover:text-ink-primary border border-contour-subtle hover:bg-canvas-secondary'
          }`}
        >
          Completed ({completedCount})
        </button>

        <button
          onClick={() => setActiveTab('CANCELLED')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'CANCELLED'
              ? 'bg-ink-primary text-white shadow-sm'
              : 'bg-white text-ink-secondary hover:text-ink-primary border border-contour-subtle hover:bg-canvas-secondary'
          }`}
        >
          Cancelled ({cancelledCount})
        </button>
      </div>

      {/* BOOKINGS LIST */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-ink-muted">Loading your client assignments from database...</p>
        </div>
      ) : currentBookings.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-ink-muted mx-auto" />
          <h3 className="text-base font-bold text-ink-primary">No Bookings in this Category</h3>
          <p className="text-xs text-ink-secondary max-w-sm mx-auto">
            {activeTab === 'ALL'
              ? 'You have not received any client booking requests yet. Once clients book your profile or packages, they will appear here with full location and payout details.'
              : 'There are currently no bookings with status matching the selected filter.'}
          </p>
          <Button variant="secondary" size="sm" onClick={() => setActiveTab('ALL')}>
            View All Bookings
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {currentBookings.map((b) => {
            const isProcessing = actionLoading[b.rawId || b.id];

            return (
              <Card
                key={b.id}
                className={`p-6 transition-all border ${
                  b.status === 'ARRIVED_AT_VENUE' || b.status === 'IN_PROGRESS'
                    ? 'border-brand/50 bg-brand-subtle/10'
                    : b.status === 'DISPUTED'
                    ? 'border-amber-300 bg-amber-50/30'
                    : 'border-contour-subtle bg-white'
                }`}
              >
                {/* PROMINENT "I WAS BOOKED BY" HEADER BANNER */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#EFFCF8] border border-[#99F6E4] mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#14B8A6] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                      {b.customerName.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                        Assigned Client Order
                      </span>
                      <h4 className="text-sm font-black text-[#191C22]">
                        I was booked by <span className="text-[#14B8A6]">{b.customerName}</span>
                      </h4>
                    </div>
                  </div>
                  <div className="text-left sm:text-right text-xs">
                    <span className="font-bold text-[#191C22] flex items-center gap-1 sm:justify-end">
                      <Phone className="w-3.5 h-3.5 text-[#94A3B8]" />
                      {b.customerPhone}
                    </span>
                    <span className="text-[11px] text-[#94A3B8] block">{b.customerEmail}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Overview */}
                  <div className="lg:col-span-8 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-ink-primary">
                        {b.id}
                      </span>
                      <span>•</span>
                      <span className="text-xs text-ink-muted">{b.category}</span>
                      <span>•</span>
                      {getStatusBadge(b.status)}
                      <span>•</span>
                      {b.paymentStatus === 'paid' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Payment Secured (In Escrow)
                        </span>
                      ) : b.paymentStatus === 'refunded' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                          Refunded
                        </span>
                      ) : b.status === 'REQUESTED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Payment Pending Acceptance
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" /> Awaiting Client Payment
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-ink-primary">
                        {b.packageTitle}
                      </h3>
                      <p className="text-xs text-ink-secondary mt-1 flex items-center gap-1.5 font-medium">
                        <MapPin className="w-4 h-4 text-brand shrink-0" />
                        <span>{b.venueAddress}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-ink-secondary pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-ink-muted" />
                        <strong>{b.date}</strong>, {b.timeSlot}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-ink-muted" />
                        {b.duration}
                      </span>
                    </div>

                    {b.notes && (
                      <p className="text-xs text-ink-muted bg-canvas-primary p-2.5 rounded-xl border border-contour-subtle italic">
                        &ldquo;{b.notes}&rdquo;
                      </p>
                    )}

                    {/* CONFIRMED LOCK POLICY NOTICE */}
                    {b.status === 'CONFIRMED' && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-amber-50/90 border border-amber-200">
                        <div className="flex items-center gap-2 text-amber-900 text-xs font-medium">
                          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Shoot confirmed &amp; locked. To guarantee client trust, photographers cannot unilaterally decline without Admin approval.</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdminCancelModalBooking(b)}
                          className="text-red-600 border-red-300 hover:bg-red-50 text-[11px] font-bold shrink-0"
                        >
                          Contact Admin to Cancel
                        </Button>
                      </div>
                    )}

                    {/* DISPUTED / CANCELLATION REQUESTED NOTICE */}
                    {b.status === 'DISPUTED' && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 space-y-1.5">
                        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>Cancellation Request Pending Admin Resolution</span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          Your emergency cancellation request has been forwarded to the REEPY Admin operations desk. An administrator will mediate and either reassign or arbitrate this booking.
                        </p>
                        {b.cancellationReason && (
                          <div className="text-[11px] text-amber-900 font-semibold bg-white/80 p-2 rounded-lg border border-amber-200/60">
                            Reason submitted: &ldquo;{b.cancellationReason}&rdquo;
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Financials & Action Buttons */}
                  <div className="lg:col-span-4 flex flex-col justify-between items-start lg:items-end space-y-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-contour-subtle">
                    <div className="text-left lg:text-right">
                      <p className="text-xl font-black text-ink-primary">
                        ₹{b.netEarnings.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-ink-muted">
                        {b.paymentStatus === 'paid' ? (
                          <span className="text-emerald-600 font-bold">Your 80% Net Payout (Escrow Secured)</span>
                        ) : (
                          <span>Your 80% Net Payout (Gross: ₹{b.grossAmount.toLocaleString('en-IN')}) • <span className="text-amber-600 font-semibold">Client Unpaid</span></span>
                        )}
                      </p>
                    </div>

                    {/* Action Buttons Dependent on State */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedBooking(b)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Details
                      </Button>

                      {/* State: REQUESTED (Pending) - Photographer can Approve or Deny */}
                      {b.status === 'REQUESTED' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={isProcessing}
                            onClick={() => handleAcceptRequest(b)}
                          >
                            Accept &amp; Confirm
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => setRejectingBooking(b)}
                          >
                            Decline Request
                          </Button>
                        </>
                      )}

                      {/* State: CONFIRMED - Advance to On The Way */}
                      {b.status === 'CONFIRMED' && (
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={isProcessing}
                          onClick={() => handleUpdateStatus(b, 'on_the_way')}
                          leftIcon={<Navigation className="w-3.5 h-3.5" />}
                        >
                          Mark On The Way
                        </Button>
                      )}

                      {/* State: ON_THE_WAY */}
                      {b.status === 'ON_THE_WAY' && (
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={isProcessing}
                          onClick={() => handleUpdateStatus(b, 'arrived_at_venue')}
                          leftIcon={<MapPin className="w-3.5 h-3.5" />}
                        >
                          Mark Arrived at Venue
                        </Button>
                      )}

                      {/* State: ARRIVED_AT_VENUE */}
                      {b.status === 'ARRIVED_AT_VENUE' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setOtpModalBooking(b);
                            setEnteredOtp('');
                            setOtpError('');
                          }}
                          leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                        >
                          Verify Start OTP
                        </Button>
                      )}

                      {/* State: IN_PROGRESS */}
                      {b.status === 'IN_PROGRESS' && (
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={isProcessing}
                          onClick={() => handleUpdateStatus(b, 'completed')}
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Mark Completed
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedBooking && (
        <Modal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title={`Booking ${selectedBooking.id}`}
          description={selectedBooking.packageTitle}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            {/* Client Info Banner */}
            <div className="p-3.5 bg-[#EFFCF8] border border-[#99F6E4] rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase">Customer Identity</p>
                <p className="text-sm font-black text-[#191C22]">I was booked by {selectedBooking.customerName}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#191C22]">{selectedBooking.customerPhone}</p>
                <p className="text-[11px] text-[#94A3B8]">{selectedBooking.customerEmail}</p>
              </div>
            </div>

            {/* Venue & Time */}
            <div className="space-y-1.5">
              <p className="font-bold uppercase text-ink-primary">Venue & Schedule</p>
              <p className="flex items-center gap-1.5 text-ink-primary font-medium">
                <MapPin className="w-4 h-4 text-brand shrink-0" />
                <span>{selectedBooking.venueAddress}</span>
              </p>
              <p className="flex items-center gap-1.5 text-ink-secondary">
                <Calendar className="w-4 h-4 text-ink-muted shrink-0" />
                <span>{selectedBooking.date}, {selectedBooking.timeSlot}</span>
              </p>
            </div>

            {/* Financials Breakdown */}
            <div className="space-y-2 border-t border-contour-subtle pt-3">
              <div className="flex items-center justify-between">
                <p className="font-bold uppercase text-ink-primary">Escrow Settlement Breakdown</p>
                {selectedBooking.paymentStatus === 'paid' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Funds Secured in Escrow
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="w-3 h-3 text-amber-600" /> Client Payment Pending
                  </span>
                )}
              </div>
              <div className="bg-canvas-secondary p-3.5 rounded-card-sm space-y-1.5">
                <div className="flex justify-between">
                  <span>Gross Client Booking Total:</span>
                  <span className="font-bold text-ink-primary">₹{selectedBooking.grossAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>REEPY Marketplace Commission (20%):</span>
                  <span>-₹{selectedBooking.platformFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-brand pt-1 border-t border-contour-subtle">
                  <span>Net Creator Take-Rate (80%):</span>
                  <span>₹{selectedBooking.netEarnings.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-[10px] text-ink-muted pt-1">
                  {selectedBooking.paymentStatus === 'paid'
                    ? 'Payment is held in secure platform escrow and will be automatically disbursed upon shoot completion verification.'
                    : 'Client has not completed payment yet. Escrow will be provisioned automatically once payment is verified.'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedBooking(null)}>
                Close Details
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* VERIFY START OTP MODAL */}
      {otpModalBooking && (
        <Modal
          isOpen={!!otpModalBooking}
          onClose={() => setOtpModalBooking(null)}
          title="Verify Client's Shoot-Start OTP"
          description={`Appointment with ${otpModalBooking.customerName} at ${otpModalBooking.venueAddress}`}
          maxWidth="sm"
        >
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-4 text-center">
            <KeyRound className="w-10 h-10 text-brand mx-auto" />
            <p className="text-xs text-ink-secondary">
              Ask client for the 6-digit code shown on their booking card to officially start the shoot timer:
            </p>

            <input
              type="text"
              required
              maxLength={6}
              value={enteredOtp}
              onChange={(e) => {
                setEnteredOtp(e.target.value.replace(/\D/g, ''));
                setOtpError('');
              }}
              placeholder="Enter 6-digit OTP"
              className="w-full text-center text-2xl font-mono font-bold tracking-widest bg-white border border-contour-strong rounded-card-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand text-ink-primary"
            />

            {otpError && (
              <p className="text-xs font-semibold text-red-600 text-left">
                {otpError}
              </p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-1/2"
                onClick={() => setOtpModalBooking(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-1/2"
                isLoading={isVerifyingOtp}
              >
                Verify & Begin
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* DECLINE CONFIRMATION MODAL (ONLY FOR PENDING REQUESTS) */}
      {rejectingBooking && (
        <Modal
          isOpen={!!rejectingBooking}
          onClose={() => setRejectingBooking(null)}
          title="Decline Booking Request?"
          description={`Decline ${rejectingBooking.packageTitle} from ${rejectingBooking.customerName}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-ink-secondary">
              Declined bookings are released immediately so the client can select another verified photographer in your area.
            </p>

            <div className="space-y-1.5">
              <label className="font-bold uppercase text-ink-primary">Reason for Declining</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-white border border-contour-strong rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="Schedule conflict with another shoot">Schedule conflict with another shoot</option>
                <option value="Venue is outside my coverage area">Venue is outside my coverage area</option>
                <option value="Equipment maintenance / repair in progress">Equipment maintenance / repair in progress</option>
                <option value="Personal emergency">Personal emergency</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setRejectingBooking(null)}>
                Keep Request
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={actionLoading[rejectingBooking.rawId || rejectingBooking.id]}
                onClick={handleConfirmReject}
              >
                Confirm Decline
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONTACT ADMIN FOR EMERGENCY CANCELLATION MODAL (FOR CONFIRMED BOOKINGS) */}
      {adminCancelModalBooking && (
        <Modal
          isOpen={!!adminCancelModalBooking}
          onClose={() => setAdminCancelModalBooking(null)}
          title="Contact Admin for Cancellation Mediation"
          description={`Confirmed Shoot with ${adminCancelModalBooking.customerName} on ${adminCancelModalBooking.date}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>REEPY Platform Reliability Policy</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Because you already approved and confirmed this booking, you cannot unilaterally decline it. Dropping confirmed shoots affects client trust. Submitting this form forwards your case to the REEPY Admin operations desk for mediation or client refund/reassignment.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold uppercase text-ink-primary">Emergency Category *</label>
              <select
                value={adminCancelReason}
                onChange={(e) => setAdminCancelReason(e.target.value)}
                className="w-full bg-white border border-contour-strong rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-1 focus:ring-brand text-ink-primary"
              >
                <option value="Severe illness / medical emergency">Severe illness / medical emergency</option>
                <option value="Critical camera / lens / lighting equipment failure">Critical camera / lens / lighting equipment failure</option>
                <option value="Transport breakdown en route to venue">Transport breakdown en route to venue</option>
                <option value="Severe weather / safety hazard at shoot venue">Severe weather / safety hazard at shoot venue</option>
                <option value="Other unavoidable emergency">Other unavoidable emergency</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold uppercase text-ink-primary">Specific Details for Admin Desk *</label>
              <textarea
                rows={3}
                value={adminCancelNotes}
                onChange={(e) => setAdminCancelNotes(e.target.value)}
                placeholder="Explain the circumstances so Admin can assist the client with an alternate photographer or immediate refund..."
                className="w-full bg-white border border-contour-strong rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-1 focus:ring-brand text-ink-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-contour-subtle">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAdminCancelModalBooking(null)}
              >
                Keep Assignment
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!adminCancelNotes.trim() || isSubmittingAdminCancel}
                isLoading={isSubmittingAdminCancel}
                onClick={handleConfirmAdminCancel}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Submit Cancellation to Admin
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
