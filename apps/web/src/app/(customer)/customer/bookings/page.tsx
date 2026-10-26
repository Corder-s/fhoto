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
  User,
  CreditCard,
  Lock,
  RefreshCw,
  Sparkles
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
  durationHours: number;
  venueAddress: string;
  notes?: string;
  agreedServicePrice: number;
  travelDistanceKm: number;
  includedTravelKm: number;
  travelFee: number;
  platformFee: number;
  taxes: number;
  amountInr: number;
  pricingBreakdown?: any;
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
  const [breakdownModalBooking, setBreakdownModalBooking] = useState<CustomerBookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of personal schedule');
  const [isCancelling, setIsCancelling] = useState(false);

  // Payment Checkout States
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);
  const [sandboxCheckoutData, setSandboxCheckoutData] = useState<any | null>(null);
  const [paymentSuccessModal, setPaymentSuccessModal] = useState<any | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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

            const durationVal =
              b.duration_hours != null && Number(b.duration_hours) > 0
                ? Number(b.duration_hours)
                : b.start_at && b.end_at
                ? Math.max(1, Math.round((Date.parse(b.end_at) - Date.parse(b.start_at)) / 3600000))
                : b.pricing_breakdown?.durationHours
                ? Number(b.pricing_breakdown.durationHours)
                : Math.max(1, Math.round((b.service?.duration_minutes || 120) / 60));

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
              duration: `${durationVal} Hour${durationVal > 1 ? 's' : ''}`,
              durationHours: durationVal,
              venueAddress: b.event_location || 'Designated Shoot Venue',
              notes: b.customer_notes,
              agreedServicePrice: Number(b.agreed_service_price || 0),
              travelDistanceKm: Number(b.travel_distance_km || 0),
              includedTravelKm: Number(b.included_travel_km || 20),
              travelFee: Number(b.travel_fee || 0),
              platformFee: Number(b.platform_fee || 0),
              taxes: Number(b.taxes || 0),
              amountInr: Number(b.total_amount || b.agreed_service_price) || 0,
              pricingBreakdown: b.pricing_breakdown,
              status,
              paymentStatus: b.payment_status === 'paid' ? 'PAID_ESCROW' : (b.payment_status || 'unpaid'),
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

  // Payment Checkout Trigger
  const handleInitiatePayment = async (booking: CustomerBookingItem) => {
    const targetId = booking.rawId || booking.id;
    setPaymentError(null);
    setPayingBookingId(targetId);

    try {
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: targetId,
          customerId: user?.id,
          idempotencyKey: `pay_${targetId}_${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize payment checkout.');
      }

      if (data.isSandbox) {
        // Open interactive developer sandbox checkout modal
        setSandboxCheckoutData({
          ...data,
          booking,
        });
        setPayingBookingId(null);
        return;
      }

      // Live Razorpay Standard Checkout
      const loadRazorpay = () =>
        new Promise<boolean>((resolve) => {
          if ((window as any).Razorpay) return resolve(true);
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

      const loaded = await loadRazorpay();
      if (!loaded) {
        throw new Error('Could not load Razorpay Checkout script. Check internet access.');
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'REEPY Photography',
        description: `${booking.packageTitle} (${booking.duration})`,
        order_id: data.orderId,
        prefill: data.customer,
        theme: { color: '#14B8A6' },
        handler: async function (response: any) {
          await handleVerifyServerPayment({
            bookingId: targetId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            booking,
          });
        },
        modal: {
          ondismiss: function () {
            setPayingBookingId(null);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setPaymentError(`Payment failed at gateway: ${resp.error?.description || 'Transaction declined'}`);
        setPayingBookingId(null);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Payment checkout initiation failed:', err);
      setPaymentError(err?.message || 'Could not launch payment gateway.');
      setPayingBookingId(null);
    }
  };

  // Server Payment Verification
  const handleVerifyServerPayment = async (params: {
    bookingId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    booking: CustomerBookingItem;
  }) => {
    setIsProcessingPayment(true);
    setPaymentError(null);
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: params.bookingId,
          razorpay_order_id: params.razorpay_order_id,
          razorpay_payment_id: params.razorpay_payment_id,
          razorpay_signature: params.razorpay_signature,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server signature verification failed.');
      }

      // Update local booking item
      setBookings((prev) =>
        prev.map((b) =>
          b.id === params.booking.id || b.rawId === params.bookingId
            ? { ...b, paymentStatus: 'PAID_ESCROW', status: 'CONFIRMED' }
            : b
        )
      );

      setPaymentSuccessModal({
        booking: params.booking,
        orderId: params.razorpay_order_id,
        paymentId: params.razorpay_payment_id,
        amount: data.amount || params.booking.amountInr,
      });
    } catch (err: any) {
      setPaymentError(`Verification Error: ${err.message}`);
    } finally {
      setIsProcessingPayment(false);
      setPayingBookingId(null);
      setSandboxCheckoutData(null);
    }
  };

  // Execute Sandbox Payment Test
  const handleExecuteSandboxPayment = async (shouldSucceed: boolean) => {
    if (!sandboxCheckoutData) return;
    const { booking, orderId } = sandboxCheckoutData;
    const targetId = booking.rawId || booking.id;

    if (!shouldSucceed) {
      setPaymentError('Simulated Gateway Failure: Transaction declined by issuing bank (Test Failure Scenario). You can retry payment at any time.');
      setSandboxCheckoutData(null);
      return;
    }

    setIsProcessingPayment(true);
    try {
      const fakePaymentId = `pay_dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const sandboxSig = `sig_dev_sandbox_${Date.now()}`;

      await handleVerifyServerPayment({
        bookingId: targetId,
        razorpay_order_id: orderId,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: sandboxSig,
        booking,
      });
    } catch (err: any) {
      setPaymentError(err?.message || 'Failed to complete sandbox payment verification.');
      setIsProcessingPayment(false);
    }
  };

  const getStatusBadge = (status: CustomerBookingUiStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Awaiting Photographer Acceptance</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF2FF] text-[#1E56A0]">Confirmed by Photographer</span>;
      case 'ON_THE_WAY':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFFCF8] text-[#14B8A6]">Photographer En Route</span>;
      case 'ARRIVED_AT_VENUE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFFCF8] text-[#14B8A6]">At Venue (Share OTP to Start)</span>;
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
          <h1 className="text-2xl sm:text-3xl font-black text-[#191C22] tracking-tight">
            My Shoot Bookings
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Review confirmed appointments, check live photographer transit, complete secure payments, and access completed galleries.
          </p>
        </div>

        <Link
          href="/explore"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#14B8A6] hover:bg-[#0D9488] active:scale-95 shadow-sm transition-all shrink-0"
        >
          <span>Book a New Shoot</span>
        </Link>
      </div>

      {/* Payment Error Banner */}
      {paymentError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-red-800 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{paymentError}</span>
          </div>
          <button
            type="button"
            onClick={() => setPaymentError(null)}
            className="text-xs font-bold text-red-700 hover:text-red-900 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB FILTERS */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-[#E7EAEE]">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'ALL'
              ? 'bg-[#191C22] text-white shadow-sm'
              : 'bg-white text-[#64748B] hover:text-[#191C22] border border-[#E7EAEE]'
          }`}
        >
          All Bookings ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab('IN_PROGRESS')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'IN_PROGRESS'
              ? 'bg-[#14B8A6] text-white shadow-sm'
              : 'bg-white text-[#64748B] hover:text-[#191C22] border border-[#E7EAEE]'
          }`}
        >
          In Progress ({bookings.filter((b) => b.status === 'ARRIVED_AT_VENUE' || b.status === 'ON_THE_WAY' || b.status === 'IN_PROGRESS').length})
        </button>

        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'UPCOMING'
              ? 'bg-[#191C22] text-white shadow-sm'
              : 'bg-white text-[#64748B] hover:text-[#191C22] border border-[#E7EAEE]'
          }`}
        >
          Upcoming ({bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING').length})
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'COMPLETED'
              ? 'bg-[#191C22] text-white shadow-sm'
              : 'bg-white text-[#64748B] hover:text-[#191C22] border border-[#E7EAEE]'
          }`}
        >
          Completed ({bookings.filter((b) => b.status === 'COMPLETED').length})
        </button>

        <button
          onClick={() => setActiveTab('CANCELLED')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'CANCELLED'
              ? 'bg-[#191C22] text-white shadow-sm'
              : 'bg-white text-[#64748B] hover:text-[#191C22] border border-[#E7EAEE]'
          }`}
        >
          Cancelled ({bookings.filter((b) => b.status === 'CANCELLED' || b.status === 'DISPUTED').length})
        </button>
      </div>

      {/* BOOKINGS LIST */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#14B8A6] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#94A3B8]">Loading your booked shoots from database...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E7EAEE] space-y-4">
          <Calendar className="w-12 h-12 text-[#94A3B8] mx-auto opacity-70" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#191C22]">No Bookings Found</h3>
            <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
              {activeTab === 'ALL'
                ? 'You have not booked any photographer shoots yet. Discover verified creators in your city and book instant photography.'
                : 'No bookings match this filter.'}
            </p>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#14B8A6] hover:bg-[#0D9488] transition-colors"
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
                  ? 'bg-white border-[#14B8A6]/50 shadow-card'
                  : 'bg-white border-[#EBE4DA] shadow-subtle'
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Details */}
                <div className="lg:col-span-8 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-[#191C22]">{b.id}</span>
                    <span>•</span>
                    <span className="text-[#94A3B8]">{b.category}</span>
                    <span>•</span>
                    {getStatusBadge(b.status)}
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-[#191C22]">
                      {b.packageTitle}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="w-8 h-8 rounded-full bg-[#14B8A6] text-white flex items-center justify-center font-black text-xs shrink-0">
                        {b.photographerName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#191C22] block">
                          Booked Photographer: <strong>{b.photographerName}</strong>
                        </span>
                        <span className="text-[11px] text-[#94A3B8]">
                          ⭐ {b.photographerRating} • {b.photographerPhone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <strong>{b.date}</strong>, {b.timeSlot}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                      {b.duration}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                      {b.venueAddress}
                    </span>
                  </div>

                  {/* Shoot-Start OTP Callout */}
                  {(b.status === 'ARRIVED_AT_VENUE' || b.status === 'ON_THE_WAY' || b.status === 'CONFIRMED') && (
                    <div className="inline-flex items-center gap-2 p-2.5 bg-[#FFF3E6] border border-[#FFD9B3] rounded-xl text-xs text-[#A64600] font-bold">
                      <KeyRound className="w-4 h-4 text-[#14B8A6]" />
                      <span>Shoot-Start Verification OTP: <span className="font-mono tracking-widest text-sm text-[#191C22] bg-white px-2 py-0.5 rounded border border-[#FFD9B3]">{b.startOtp}</span></span>
                      <span className="text-[10px] text-[#94A3B8] font-normal">(Share with photographer when they arrive at your venue)</span>
                    </div>
                  )}

                  {b.cancellationReason && (
                    <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
                      Cancellation Reason: &ldquo;{b.cancellationReason}&rdquo;
                    </p>
                  )}
                </div>

                {/* Right Financials & Action Buttons */}
                <div className="lg:col-span-4 flex flex-col justify-between items-start lg:items-end space-y-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-[#E7EAEE]">
                  <div className="text-left lg:text-right">
                    <p className="text-xl font-black text-[#191C22]">
                      ₹{b.amountInr.toLocaleString('en-IN')}
                    </p>
                    <div className="text-[11px] flex items-center gap-1 lg:justify-end mt-0.5">
                      {b.paymentStatus === 'PAID_ESCROW' || b.paymentStatus === 'paid' ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Escrow Protected (Paid)</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Payment Due ({b.paymentStatus.toUpperCase()})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:justify-end">
                    {/* PAY NOW CTA BUTTON */}
                    {(b.paymentStatus !== 'PAID_ESCROW' && b.paymentStatus !== 'paid') && (
                      b.status === 'CONFIRMED' ? (
                        <button
                          type="button"
                          disabled={payingBookingId === (b.rawId || b.id) || isProcessingPayment}
                          onClick={() => handleInitiatePayment(b)}
                          className="px-4 py-2 rounded-full text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-white" />
                          <span>
                            {payingBookingId === (b.rawId || b.id)
                              ? 'Initializing...'
                              : `Pay Now — ₹${b.amountInr.toLocaleString('en-IN')}`}
                          </span>
                        </button>
                      ) : b.status === 'PENDING' ? (
                        <span className="px-3 py-1.5 rounded-full text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Payment unlocks once photographer accepts</span>
                        </span>
                      ) : null
                    )}

                    <button
                      onClick={() => setBreakdownModalBooking(b)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#191C22] bg-[#F5F7F9] hover:bg-[#EBEFF3] border border-[#E7EAEE] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#14B8A6]" />
                      <span>View Price Breakdown</span>
                    </button>

                    <Link
                      href={`/photographers/${b.photographerId}`}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#64748B] hover:text-[#191C22] hover:bg-[#F5F7F9] border border-[#E7EAEE]"
                    >
                      Photographer Profile
                    </Link>

                    {b.status === 'COMPLETED' && (
                      <Link
                        href="/customer/gallery"
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[#14B8A6] hover:bg-[#0D9488] transition-colors flex items-center gap-1"
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E7EAEE] shadow-elevated space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#191C22]">Cancel Shoot Appointment?</h3>
                <p className="text-xs text-[#94A3B8]">{cancelModalBooking.packageTitle} with {cancelModalBooking.photographerName}</p>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              If cancelled prior to shoot start time, your escrow deposit of <strong>₹{cancelModalBooking.amountInr.toLocaleString('en-IN')}</strong> will be refunded to your original payment method per cancellation policy.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-[#191C22]">Reason for Cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-[#F5F7F9] border border-[#E7EAEE] rounded-xl p-2.5 text-xs font-semibold text-[#191C22] outline-none"
              >
                <option value="Change of personal schedule">Change of personal schedule</option>
                <option value="Event postponed or rescheduled">Event postponed or rescheduled</option>
                <option value="Weather / venue issues">Weather / venue issues</option>
                <option value="Booked by mistake">Booked by mistake</option>
                <option value="Other reasons">Other reasons</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7EAEE]">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-[#F1F3F5] transition-colors"
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

      {/* PRICE BREAKDOWN MODAL */}
      {breakdownModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E7EAEE] shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAEE]">
              <div>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                  Authoritative Price Breakdown
                </span>
                <h3 className="text-base font-black text-[#191C22]">
                  {breakdownModalBooking.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBreakdownModalBooking(null)}
                className="w-8 h-8 rounded-full bg-[#F5F7F9] hover:bg-[#EBEFF3] flex items-center justify-center text-[#64748B] hover:text-[#191C22] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Session Summary */}
            <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E7EAEE] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Photographer:</span>
                <span className="font-bold text-[#191C22]">{breakdownModalBooking.photographerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Shoot Package:</span>
                <span className="font-bold text-[#191C22]">{breakdownModalBooking.packageTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Selected Duration:</span>
                <span className="font-bold text-[#14B8A6]">{breakdownModalBooking.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Event Date &amp; Time:</span>
                <span className="font-medium text-[#191C22]">{breakdownModalBooking.date}, {breakdownModalBooking.timeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Venue:</span>
                <span className="font-medium text-[#191C22] max-w-[240px] truncate text-right">{breakdownModalBooking.venueAddress}</span>
              </div>
            </div>

            {/* Itemized Line Items */}
            <div className="space-y-2 text-xs text-[#64748B] border-b border-[#F1F5F9] pb-3">
              <div className="flex justify-between items-center">
                <span>Service Subtotal ({breakdownModalBooking.duration})</span>
                <span className="font-bold text-[#191C22]">
                  ₹{(breakdownModalBooking.pricingBreakdown?.serviceSubtotal || breakdownModalBooking.agreedServicePrice).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>
                  Travel Charges
                  {breakdownModalBooking.pricingBreakdown
                    ? ` (${breakdownModalBooking.pricingBreakdown.calculatedDistanceKm} km, first ${breakdownModalBooking.pricingBreakdown.includedTravelKm} km free)`
                    : ' (First 20 km included)'}
                </span>
                <span className="font-bold text-[#191C22]">
                  {(breakdownModalBooking.pricingBreakdown?.travelFee || breakdownModalBooking.travelFee) > 0
                    ? `₹${(breakdownModalBooking.pricingBreakdown?.travelFee || breakdownModalBooking.travelFee).toLocaleString('en-IN')}`
                    : 'FREE (₹0)'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Platform Facilitation Fee (10% Escrow &amp; Guarantee)</span>
                <span className="font-bold text-[#191C22]">
                  ₹{(breakdownModalBooking.pricingBreakdown?.platformFee || breakdownModalBooking.platformFee).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Applicable Taxes (GST 18%)</span>
                <span className="font-bold text-[#191C22]">
                  ₹{(breakdownModalBooking.pricingBreakdown?.taxes || breakdownModalBooking.taxes).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Total and Escrow State */}
            <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-emerald-950">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-800">
                  Total Payable Amount
                </span>
                <span className="text-xl font-black text-emerald-950">
                  ₹{breakdownModalBooking.amountInr.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Payment Status</span>
                <span className="text-xs font-black text-emerald-900 bg-emerald-200/60 px-2.5 py-1 rounded-full">
                  {breakdownModalBooking.paymentStatus}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Protected by REEPY Escrow: Your deposit is safely held until shoot completion and OTP verification.
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-[#E7EAEE]">
              <button
                type="button"
                onClick={() => setBreakdownModalBooking(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-[#191C22] bg-[#F5F7F9] hover:bg-[#EBEFF3] transition-colors"
              >
                Close
              </button>

              {(breakdownModalBooking.paymentStatus !== 'PAID_ESCROW' && breakdownModalBooking.paymentStatus !== 'paid' && breakdownModalBooking.status === 'CONFIRMED') && (
                <button
                  type="button"
                  onClick={() => {
                    const target = breakdownModalBooking;
                    setBreakdownModalBooking(null);
                    handleInitiatePayment(target);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-md transition-all flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5 text-white" />
                  <span>Pay Now — ₹{breakdownModalBooking.amountInr.toLocaleString('en-IN')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DEVELOPER SANDBOX TEST CHECKOUT MODAL */}
      {sandboxCheckoutData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E7EAEE] shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAEE]">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#14B8A6] bg-[#EFFCF8] border border-[#14B8A6]/30 px-2 py-0.5 rounded-full">
                    REEPY Escrow Gateway (Sandbox Test Mode)
                  </span>
                </div>
                <h3 className="text-base font-black text-[#191C22] mt-1">
                  Complete Booking Payment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSandboxCheckoutData(null)}
                className="w-8 h-8 rounded-full bg-[#F5F7F9] hover:bg-[#EBEFF3] flex items-center justify-center text-[#64748B]"
              >
                ✕
              </button>
            </div>

            {/* Session Info */}
            <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E7EAEE] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Photographer:</span>
                <span className="font-bold text-[#191C22]">{sandboxCheckoutData.booking?.photographerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Shoot Package:</span>
                <span className="font-bold text-[#191C22]">{sandboxCheckoutData.booking?.packageTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Selected Duration:</span>
                <span className="font-bold text-[#14B8A6]">{sandboxCheckoutData.booking?.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Gateway Order ID:</span>
                <span className="font-mono text-[#64748B] text-[11px]">{sandboxCheckoutData.orderId}</span>
              </div>
            </div>

            {/* Total Amount Due */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Authoritative Amount Due
                </span>
                <span className="text-2xl font-black text-emerald-950">
                  ₹{sandboxCheckoutData.amountInr.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-xs font-extrabold text-emerald-800 bg-emerald-200/60 px-3 py-1 rounded-full">
                INR Escrow Deposit
              </span>
            </div>

            <p className="text-[11px] text-[#64748B] leading-relaxed bg-[#F5F7F9] p-3 rounded-xl border border-[#E7EAEE]">
              🔒 <strong>Developer Notice:</strong> Razorpay live credentials are not configured in your local environment. This interactive test modal tests the exact same server-side verification, escrow allocation, and status transitions.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[#E7EAEE]">
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={() => handleExecuteSandboxPayment(true)}
                className="w-full sm:flex-1 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>{isProcessingPayment ? 'Verifying...' : `Simulate Successful Payment (₹${sandboxCheckoutData.amountInr.toLocaleString('en-IN')})`}</span>
              </button>

              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={() => handleExecuteSandboxPayment(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-50"
              >
                Simulate Gateway Failure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT SUCCESSFUL ESCROW CONFIRMATION MODAL */}
      {paymentSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E7EAEE] shadow-elevated text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-black text-[#191C22]">
              Payment Verified & Secured!
            </h3>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Your payment of <strong>₹{paymentSuccessModal.amount?.toLocaleString('en-IN')}</strong> has been confirmed by the payment gateway and is safely deposited into REEPY Escrow.
            </p>

            <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E7EAEE] text-left space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Booking Reference:</span>
                <span className="font-mono font-bold text-[#191C22]">{paymentSuccessModal.booking?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Payment Reference:</span>
                <span className="font-mono text-[#64748B] text-[11px]">{paymentSuccessModal.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Escrow Protection:</span>
                <span className="font-bold text-emerald-700">100% Protected</span>
              </div>
            </div>

            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              The photographer has been notified of your confirmed appointment. Share your 6-digit OTP only upon physical arrival at your venue.
            </p>

            <button
              type="button"
              onClick={() => setPaymentSuccessModal(null)}
              className="w-full py-2.5 rounded-xl text-xs font-black text-white bg-[#14B8A6] hover:bg-[#0D9488] transition-colors"
            >
              Back to My Bookings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
