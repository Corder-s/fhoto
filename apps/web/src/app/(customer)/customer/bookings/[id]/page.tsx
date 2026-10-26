'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  KeyRound,
  ShieldCheck,
  Phone,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  CreditCard,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { CustomerNoticeBanner } from '../../../../../components/customer/CustomerNoticeBanner';

interface BookingDetail {
  id: string;
  creator_id?: string;
  booking_reference: string;
  event_title: string;
  event_date: string;
  duration_hours?: number;
  start_at: string;
  end_at: string;
  event_location: string;
  agreed_service_price: number;
  travel_distance_km?: number;
  travel_fee?: number;
  platform_fee: number;
  taxes?: number;
  discount_amount?: number;
  total_amount: number;
  amount_paid?: number;
  payment_mode?: string;
  unlocked_perks?: string[];
  pricing_breakdown?: any;
  booking_status: string;
  payment_status: string;
  customer_notes?: string;
  cancellation_reason?: string;
  created_at: string;
  creator?: {
    id: string;
    professional_name: string;
    city: string;
    average_rating?: number;
    total_reviews?: number;
    user?: {
      id: string;
      full_name: string;
      phone_number: string;
      avatar_url?: string;
    };
  };
  service?: {
    id: string;
    title: string;
    duration_minutes: number;
  };
  payments?: Array<{
    id: string;
    provider: string;
    provider_order_id?: string;
    provider_payment_id?: string;
    amount: number;
    currency: string;
    payment_status: string;
    paid_at?: string;
    created_at: string;
  }>;
}

export default function CustomerBookingDetailPage({ params }: { params: { id: string } }) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment states
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'full' | 'half'>('full');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [sandboxCheckoutData, setSandboxCheckoutData] = useState<any | null>(null);
  const [paymentSuccessModal, setPaymentSuccessModal] = useState<any | null>(null);

  const fetchBooking = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/customer/bookings/${params.id}`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.booking) {
        // Fallback to query param
        const fallbackRes = await fetch(`/api/customer/bookings?bookingId=${params.id}`);
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && fallbackData.booking) {
          setBooking(fallbackData.booking);
          return;
        }
        throw new Error(data.error || 'Booking not found or access denied.');
      }

      setBooking(data.booking);
    } catch (err: any) {
      console.error('Failed to load booking details:', err);
      setError(err?.message || 'Could not retrieve booking details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [params.id]);

  // Payment initiation
  const handleInitiatePayment = async (modeOverride?: 'full' | 'half' | 'remaining') => {
    if (!booking) return;
    setIsProcessingPayment(true);
    setPaymentError(null);

    const mode = modeOverride || (booking.payment_status === 'partially_paid' ? 'remaining' : selectedPaymentMode);

    try {
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, paymentMode: mode }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize payment gateway.');
      }

      if (data.isDevSandbox) {
        setSandboxCheckoutData({
          ...data,
          booking,
        });
        setIsProcessingPayment(false);
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
        throw new Error('Could not load Razorpay SDK. Check network access.');
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'REEPY Photography',
        description: `${booking.event_title || 'Photo Session'} (${booking.duration_hours || 2} Hours)`,
        order_id: data.orderId,
        prefill: data.customer,
        theme: { color: '#14B8A6' },
        handler: async function (response: any) {
          await handleVerifyServerPayment({
            bookingId: booking.id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setPaymentError(`Payment failed: ${resp.error?.description || 'Gateway declined transaction.'}`);
        setIsProcessingPayment(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Payment checkout initiation failed:', err);
      setPaymentError(err?.message || 'Could not open payment checkout.');
      setIsProcessingPayment(false);
    }
  };

  // Server Payment Verification
  const handleVerifyServerPayment = async (verifyParams: {
    bookingId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    setIsProcessingPayment(true);
    setPaymentError(null);
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifyParams),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Payment signature verification failed.');
      }

      // Update local state
      setBooking((prev) =>
        prev
          ? {
              ...prev,
              payment_status: data.paymentStatus || 'paid',
              booking_status: 'confirmed',
              amount_paid: data.amountPaid || prev.total_amount,
              payment_mode: data.paymentMode || 'full',
              unlocked_perks: data.unlockedPerks || [],
            }
          : prev
      );

      setPaymentSuccessModal({
        orderId: verifyParams.razorpay_order_id,
        paymentId: verifyParams.razorpay_payment_id,
        amount: data.amount || booking?.total_amount,
      });
    } catch (err: any) {
      setPaymentError(`Verification Error: ${err.message}`);
    } finally {
      setIsProcessingPayment(false);
      setSandboxCheckoutData(null);
    }
  };

  // Sandbox simulation
  const handleExecuteSandboxPayment = async (shouldSucceed: boolean) => {
    if (!sandboxCheckoutData || !booking) return;

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
        bookingId: booking.id,
        razorpay_order_id: sandboxCheckoutData.orderId,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: sandboxSig,
      });
    } catch (err: any) {
      setPaymentError(err?.message || 'Sandbox verification failed.');
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-[#64748B]">Loading your booking details and payment ledger...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-[#191C22]">Booking Not Found</h2>
        <p className="text-xs text-[#64748B] max-w-md mx-auto">{error || 'This shoot booking could not be loaded.'}</p>
        <Link
          href="/customer/bookings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#14B8A6] hover:bg-[#0D9488] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Bookings</span>
        </Link>
      </div>
    );
  }

  const isPaid = booking.payment_status === 'paid';
  const isPartiallyPaid = booking.payment_status === 'partially_paid';
  const totalAmount = Number(booking.total_amount) || 0;

  // 10% Full Payment (Option A)
  const fullDiscount = Math.round(totalAmount * 0.10);
  const fullPayableAmount = Math.max(1, totalAmount - fullDiscount);

  // 5% Half Payment (Option B - 2 installments, second absorbs rounding remainder)
  const halfDiscount = Math.round(totalAmount * 0.05);
  const halfTotal = Math.max(1, totalAmount - halfDiscount);
  const halfFirstInstallment = Math.round(halfTotal * 0.5);
  const halfSecondInstallment = halfTotal - halfFirstInstallment;
  const halfPayableAmount = halfFirstInstallment;

  // Authoritative financial state
  const agreedTotal = booking.pricing_breakdown?.paymentPlan?.finalDiscountedTotal || (booking.discount_amount ? (totalAmount - Number(booking.discount_amount)) : (isPaid ? fullPayableAmount : totalAmount));
  const amountPaid = Number(booking.amount_paid) || (isPaid ? agreedTotal : (isPartiallyPaid ? halfFirstInstallment : 0));
  const remainingDue = Math.max(0, agreedTotal - amountPaid);

  const durationHours =
    booking.duration_hours ||
    booking.pricing_breakdown?.durationHours ||
    (booking.start_at && booking.end_at
      ? Math.max(1, Math.round((Date.parse(booking.end_at) - Date.parse(booking.start_at)) / 3600000))
      : 2);

  const photographerName =
    booking.creator?.professional_name ||
    booking.creator?.user?.full_name ||
    'Professional Photographer';

  const photographerAvatar =
    booking.creator?.user?.avatar_url ||
    '/reference-assets/seller_profile_aman.jpg';

  const photographerPhone =
    booking.creator?.user?.phone_number || '+91 98101 23456';

  const milestones = [
    { title: 'Shoot Booked & Requested', time: new Date(booking.created_at).toLocaleDateString(), completed: true },
    {
      title: isPaid
        ? 'Full Payment Verified & Escrow Secured'
        : isPartiallyPaid
        ? '50% Advance Secured in Escrow'
        : 'Payment Due (Awaiting Checkout)',
      time: isPaid
        ? 'Fully Confirmed & Held in Escrow'
        : isPartiallyPaid
        ? `₹${amountPaid.toLocaleString('en-IN')} Secured • ₹${remainingDue.toLocaleString('en-IN')} Remaining`
        : 'Payment Required',
      completed: isPaid || isPartiallyPaid,
      current: !isPaid && !isPartiallyPaid,
    },
    {
      title: 'Photographer Confirmed',
      time: booking.booking_status !== 'pending' ? 'Schedule Confirmed' : 'Awaiting Schedule Acceptance',
      completed: booking.booking_status === 'confirmed' || booking.booking_status === 'on_the_way' || booking.booking_status === 'arrived_at_venue' || booking.booking_status === 'in_progress' || booking.booking_status === 'completed',
    },
    {
      title: 'Photographer Transit',
      time: booking.booking_status === 'on_the_way' ? 'En Route to Venue' : 'Pending',
      completed: booking.booking_status === 'on_the_way' || booking.booking_status === 'arrived_at_venue' || booking.booking_status === 'in_progress' || booking.booking_status === 'completed',
      current: booking.booking_status === 'on_the_way',
    },
    {
      title: 'Arrived at Venue (OTP Handshake)',
      time: '6-digit OTP Handshake',
      completed: booking.booking_status === 'arrived_at_venue' || booking.booking_status === 'in_progress' || booking.booking_status === 'completed',
      current: booking.booking_status === 'arrived_at_venue',
    },
    {
      title: 'Shoot in Progress',
      time: 'Timer Started',
      completed: booking.booking_status === 'in_progress' || booking.booking_status === 'completed',
      current: booking.booking_status === 'in_progress',
    },
    {
      title: 'High-Res Deliverables Delivered',
      time: 'Within 48 Hours',
      completed: booking.booking_status === 'completed',
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      <CustomerNoticeBanner moduleName={`Booking Detail & Escrow Payment: ${booking.booking_reference || booking.id}`} />

      {/* Back Link */}
      <div>
        <Link
          href="/customer/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64748B] hover:text-[#14B8A6] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Bookings</span>
        </Link>
      </div>

      {/* Payment Error Alert Banner */}
      {paymentError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-red-800 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{paymentError}</span>
          </div>
          <button
            type="button"
            onClick={() => setPaymentError(null)}
            className="text-xs font-bold text-red-700 hover:text-red-900 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-[#E7EAEE] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7EAEE]">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#64748B] bg-[#F1F5F9] px-2.5 py-0.5 rounded-full">
                REF: {booking.booking_reference || booking.id}
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#FFF3E6] text-[#14B8A6] border border-[#FFD9B3]">
                {booking.booking_status}
              </span>

              {isPaid ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Fully Paid &amp; In Escrow
                </span>
              ) : isPartiallyPaid ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                  <CheckCircle2 className="w-3 h-3 text-blue-600" /> 50% Advance Paid (In Escrow)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="w-3 h-3 text-amber-600" /> Payment Required (Unpaid)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#191C22] tracking-tight">
              {booking.event_title}
            </h1>
            <p className="text-xs text-[#64748B]">
              Category: <strong>{booking.service?.title || 'Photography Session'}</strong> • Duration: <strong>{durationHours} Hours</strong>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Total Amount</span>
            <p className="text-3xl font-black text-[#191C22]">₹{Number(booking.total_amount).toLocaleString('en-IN')}</p>
            {isPaid ? (
              <span className="text-[11px] font-semibold text-green-700 flex items-center sm:justify-end gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                100% REEPY Escrow Protected
              </span>
            ) : isPartiallyPaid ? (
              <span className="text-[11px] font-semibold text-blue-700 flex items-center sm:justify-end gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                50% Advance in REEPY Escrow
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-amber-700 flex items-center sm:justify-end gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Payment Required to Escrow Funds
              </span>
            )}
          </div>
        </div>

        {/* PAYMENT ACTION CALLOUT IF UNPAID */}
        {!isPaid ? (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-[#191C22]">
                  Payment Due — ₹{Number(booking.total_amount).toLocaleString('en-IN')}
                </h3>
              </div>
              <p className="text-xs text-[#64748B] max-w-xl">
                {booking.booking_status === 'pending'
                  ? 'Your booking request is awaiting photographer schedule confirmation. You can pay now to immediately confirm your appointment and lock the funds securely in REEPY Escrow.'
                  : 'Your photographer has accepted this appointment. Please complete payment to confirm your booking.'}
              </p>
            </div>

            <button
              type="button"
              disabled={isProcessingPayment}
              onClick={() => handleInitiatePayment(isPartiallyPaid ? 'remaining' : undefined)}
              className="px-6 py-3 rounded-full text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4 text-white" />
              <span>
                {isProcessingPayment
                  ? 'Initializing Gateway...'
                  : isPartiallyPaid
                  ? `Pay Remaining 50% — ₹${remainingDue.toLocaleString('en-IN')}`
                  : `Pay Now — Choose Plan`}
              </span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-emerald-950">Payment Confirmed &amp; Held in Escrow</h4>
                <p className="text-[11px] text-emerald-800">
                  Your funds are protected. Photographer will only receive disbursement after you inspect the delivered gallery.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-200">
              Verified ₹{Number(booking.total_amount).toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Schedule & Venue Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#64748B] pt-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#14B8A6] shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">Date</span>
              <span className="font-semibold text-[#191C22]">{booking.event_date}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#14B8A6] shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">Time &amp; Duration</span>
              <span className="font-semibold text-[#191C22]">
                {booking.start_at ? new Date(booking.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM'} ({durationHours} Hours)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#14B8A6] shrink-0" />
            <div className="truncate">
              <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">Venue</span>
              <span className="font-semibold text-[#191C22] truncate block">{booking.event_location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIDENTIAL SHOOT-START OTP VERIFICATION CARD */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border-2 border-[#14B8A6] shadow-sm text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#14B8A6]">
          <KeyRound className="w-4 h-4" />
          <span>Confidential Shoot-Start Verification OTP</span>
        </div>

        <div className="text-4xl sm:text-6xl font-mono font-black text-[#191C22] tracking-[0.25em] bg-[#F5F7F9] py-4 rounded-2xl border border-[#E7EAEE] max-w-sm mx-auto shadow-inner">
          482910
        </div>

        <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
          Provide this 6-digit code to photographer <strong>{photographerName}</strong> <span className="font-bold text-[#191C22]">ONLY in person</span> upon their arrival at your venue. Entering this code starts the official shoot timer.
        </p>
      </div>

      {/* ITEMIZED PRICING & PAYMENT LEDGER */}
      <div className="p-6 bg-white rounded-3xl border border-[#E7EAEE] space-y-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7EAEE]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Authoritative Financial Ledger</span>
            <h3 className="text-base font-black text-[#191C22]">Itemized Charges &amp; Price Breakdown</h3>
          </div>
          <span className="text-xs font-mono font-bold text-[#64748B]">INR (₹)</span>
        </div>

        <div className="divide-y divide-[#F1F5F9] text-xs">
          <div className="py-2.5 flex justify-between">
            <span className="text-[#64748B]">
              Base Service Subtotal ({durationHours} Hours Session)
            </span>
            <span className="font-bold text-[#191C22]">₹{Number(booking.agreed_service_price).toLocaleString('en-IN')}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <div>
              <span className="text-[#64748B]">Travel Fee</span>
              {booking.travel_distance_km ? (
                <span className="text-[10px] text-[#94A3B8] ml-1.5 font-normal">
                  ({booking.travel_distance_km} km distance)
                </span>
              ) : null}
            </div>
            <span className="font-bold text-[#191C22]">
              {Number(booking.travel_fee || 0) > 0 ? `₹${Number(booking.travel_fee).toLocaleString('en-IN')}` : '₹0 (Included)'}
            </span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-[#64748B]">REEPY Platform Marketplace Fee (10%)</span>
            <span className="font-bold text-[#191C22]">₹{Number(booking.platform_fee || 0).toLocaleString('en-IN')}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-[#64748B]">Applicable Taxes (18% GST)</span>
            <span className="font-bold text-[#191C22]">₹{Number(booking.taxes || 0).toLocaleString('en-IN')}</span>
          </div>

          {Number(booking.discount_amount || 0) > 0 && (
            <div className="py-2.5 flex justify-between text-emerald-700">
              <span>Promotional Discount</span>
              <span className="font-bold">−₹{Number(booking.discount_amount).toLocaleString('en-IN')}</span>
            </div>
          )}

          {/* Ledger Totals */}
          <div className="py-3.5 flex justify-between text-base font-black text-[#191C22] bg-[#F8FAFC] -mx-6 px-6 border-t-2 border-[#E7EAEE]">
            <span>Total Agreed Booking Amount</span>
            <span>₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="py-2.5 flex justify-between font-semibold">
            <span className="text-[#64748B]">Amount Paid to Date:</span>
            <span className="text-emerald-700">
              ₹{amountPaid.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="py-2.5 flex justify-between font-semibold">
            <span className="text-[#64748B]">Remaining Balance Due:</span>
            <span className={remainingDue > 0 ? 'text-amber-700' : 'text-[#94A3B8]'}>
              ₹{remainingDue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* PAYMENT OPTIONS SELECTOR (IF NOT FULLY PAID) */}
        {!isPaid && (
          <div className="pt-4 border-t border-[#E7EAEE] space-y-4">
            {isPartiallyPaid ? (
              /* Already paid 50%, show remaining payment action */
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black text-blue-900 block">
                    Second Installment (50% Remaining Balance)
                  </span>
                  <span className="text-xs text-blue-700">
                    Your 50% advance of ₹{amountPaid.toLocaleString('en-IN')} is secured in escrow. Settle the remaining balance anytime before or on shoot completion.
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={() => handleInitiatePayment('remaining')}
                  className="px-6 py-2.5 rounded-full text-xs font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <CreditCard className="w-4 h-4 text-white" />
                  <span>{isProcessingPayment ? 'Initializing...' : `Pay Remaining ₹${remainingDue.toLocaleString('en-IN')}`}</span>
                </button>
              </div>
            ) : (
              /* Unpaid: Choose Full Payment (with benefits) OR Half Payment (50% Deposit) */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#191C22]">
                    Choose Payment Option
                  </span>
                  <span className="text-[11px] text-[#14B8A6] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>REEPY Escrow Guarantee</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* OPTION 1: FULL PAYMENT (WITH 10% DISCOUNT & VIP PERKS) */}
                  <div
                    onClick={() => setSelectedPaymentMode('full')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative ${
                      selectedPaymentMode === 'full'
                        ? 'border-[#14B8A6] bg-[#EFFCF8] shadow-sm'
                        : 'border-[#E7EAEE] bg-white hover:border-[#14B8A6]/40'
                    }`}
                  >
                    <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-[#14B8A6] to-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                      Best Value • Save 10%
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <input
                        type="radio"
                        name="paymentMode"
                        checked={selectedPaymentMode === 'full'}
                        onChange={() => setSelectedPaymentMode('full')}
                        className="text-[#14B8A6] focus:ring-[#14B8A6]"
                      />
                      <span className="text-xs font-black text-[#191C22]">
                        Full Payment — Save 10%
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-lg font-black text-[#191C22]">
                        ₹{fullPayableAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-[#94A3B8] line-through">
                        ₹{totalAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Save ₹{fullDiscount.toLocaleString('en-IN')} (10%)
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-[#475569] border-t border-[#14B8A6]/20 pt-2">
                      <p className="flex items-center gap-1.5 text-emerald-800 font-bold">
                        <span>🎁</span> <span>10% Instant Prepayment Discount</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-[#191C22]">
                        <span>⚡</span> <span>Priority 48-Hour Rush Delivery</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-[#191C22]">
                        <span>📸</span> <span>10 Extra Pro-Edited Photos Included Free</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-[#191C22]">
                        <span>🔄</span> <span>1 Free Complimentary Date Reschedule</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <span>🛡️</span> <span>100% Escrow Protected • ₹0 Remaining Due</span>
                      </p>
                    </div>
                  </div>

                  {/* OPTION 2: HALF PAYMENT (WITH 5% DISCOUNT - 2 INSTALLMENTS) */}
                  <div
                    onClick={() => setSelectedPaymentMode('half')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative ${
                      selectedPaymentMode === 'half'
                        ? 'border-[#14B8A6] bg-[#EFFCF8] shadow-sm'
                        : 'border-[#E7EAEE] bg-white hover:border-[#14B8A6]/40'
                    }`}
                  >
                    <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                      Flex Plan • Save 5%
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <input
                        type="radio"
                        name="paymentMode"
                        checked={selectedPaymentMode === 'half'}
                        onChange={() => setSelectedPaymentMode('half')}
                        className="text-[#14B8A6] focus:ring-[#14B8A6]"
                      />
                      <span className="text-xs font-black text-[#191C22]">
                        Half Payment — Save 5%
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-lg font-black text-[#191C22]">
                        ₹{halfFirstInstallment.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-[#64748B]">now (1st installment)</span>
                    </div>
                    <div className="text-[11px] text-blue-700 font-semibold mb-2">
                      Total: ₹{halfTotal.toLocaleString('en-IN')} (Saved ₹{halfDiscount.toLocaleString('en-IN')})
                    </div>

                    <div className="space-y-1 text-[11px] text-[#64748B] border-t border-[#E7EAEE] pt-2">
                      <p className="flex items-center gap-1.5 text-[#191C22]">
                        <span>💳</span> <span>1st Installment: ₹{halfFirstInstallment.toLocaleString('en-IN')} due now</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-[#64748B]">
                        <span>⏳</span> <span>2nd Installment: ₹{halfSecondInstallment.toLocaleString('en-IN')} due later</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-blue-800 font-medium">
                        <span>🎁</span> <span>5% discount applied once to total amount</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-[#64748B]">
                        <span>🛡️</span> <span>Both installments protected in REEPY Escrow</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Checkout Trigger */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E7EAEE]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">Payable Now</span>
                    <span className="text-xl font-black text-[#191C22]">
                      ₹{(selectedPaymentMode === 'full' ? fullPayableAmount : halfPayableAmount).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={() => handleInitiatePayment(selectedPaymentMode)}
                    className="w-full sm:w-auto px-7 py-3 rounded-full text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4 text-white" />
                    <span>
                      {isProcessingPayment
                        ? 'Initializing Checkout...'
                        : selectedPaymentMode === 'full'
                        ? `Pay Full (₹${fullPayableAmount.toLocaleString('en-IN')}) — Save 10% & VIP Perks`
                        : `Pay 1st Installment (₹${halfFirstInstallment.toLocaleString('en-IN')}) — Save 5%`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* VERIFIED PAYMENT TRANSACTIONS LEDGER (IF PRESENT) */}
      {booking.payments && booking.payments.length > 0 && (
        <div className="p-6 bg-white rounded-3xl border border-[#E7EAEE] space-y-4 shadow-sm">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#191C22]">
            Verified Payment Transactions
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#F1F5F9] text-[#94A3B8] text-[11px] font-semibold">
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Gateway Order</th>
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {booking.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#191C22]">{p.provider_payment_id || p.id}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#64748B]">{p.provider_order_id || 'N/A'}</td>
                    <td className="py-2.5 px-3 uppercase font-bold text-[10px] text-[#475569]">{p.provider}</td>
                    <td className="py-2.5 px-3 font-black text-[#191C22]">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {p.payment_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#64748B] text-[11px]">{new Date(p.paid_at || p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PHOTOGRAPHER SUMMARY & APPOINTMENT VENUE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Creator Info */}
        <div className="p-6 bg-white rounded-3xl border border-[#E7EAEE] space-y-4 shadow-sm">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
            Assigned Photographer
          </span>

          <div className="flex items-center gap-3.5">
            <img
              src={photographerAvatar}
              alt={photographerName}
              className="w-14 h-14 rounded-full object-cover border border-[#E7EAEE]"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-[#191C22]">{photographerName}</h3>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#14B8A6]" />
              </div>
              <p className="text-xs text-[#94A3B8]">
                Verified REEPY Creator • ⭐ {booking.creator?.average_rating || 4.9} ({booking.creator?.total_reviews || 28} Reviews)
              </p>
              <p className="text-xs text-[#64748B] mt-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>{photographerPhone}</span>
              </p>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <Link
              href={`/photographers/${booking.creator?.id || booking.creator_id || 'creator'}`}
              className="px-4 py-2 rounded-full text-xs font-bold text-[#191C22] bg-[#F1F3F5] hover:bg-[#EAE2D7] transition-colors"
            >
              View Full Profile &amp; Portfolio
            </Link>
          </div>
        </div>

        {/* Venue & Time */}
        <div className="p-6 bg-white rounded-3xl border border-[#E7EAEE] space-y-4 shadow-sm">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
            Shooting Venue &amp; Schedule
          </span>

          <div className="space-y-2 text-xs text-[#64748B]">
            <p className="flex items-start gap-2 font-medium text-[#191C22]">
              <MapPin className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
              <span>{booking.event_location}</span>
            </p>
            <p className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#94A3B8] shrink-0" />
              <span>{booking.event_date}</span>
            </p>
            <p className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#94A3B8] shrink-0" />
              <span>{durationHours} Hours Session</span>
            </p>
          </div>

          {booking.customer_notes && (
            <div className="p-3 bg-[#F8FAFC] rounded-xl text-[11px] text-[#64748B] border border-[#E7EAEE]">
              <strong>Client Notes:</strong> &ldquo;{booking.customer_notes}&rdquo;
            </div>
          )}
        </div>
      </div>

      {/* MILESTONE TRACKING TIMELINE */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#E7EAEE] space-y-6 shadow-sm">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#191C22]">
          Live Appointment Status &amp; Transit Milestones
        </h2>

        <div className="space-y-6 relative pl-6 border-l-2 border-[#E7EAEE]">
          {milestones.map((m, idx) => (
            <div key={idx} className="relative">
              <div
                className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 ${
                  m.current
                    ? 'bg-[#14B8A6] border-white ring-4 ring-[#FFE2C2]'
                    : m.completed
                    ? 'bg-green-600 border-white ring-2 ring-green-100'
                    : 'bg-white border-[#D5CEC4]'
                }`}
              />
              <div className="space-y-0.5">
                <p
                  className={`text-sm font-bold ${
                    m.current ? 'text-[#14B8A6]' : m.completed ? 'text-[#191C22]' : 'text-[#94A3B8]'
                  }`}
                >
                  {m.title}
                </p>
                <p className="text-xs text-[#94A3B8]">{m.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DEVELOPER SANDBOX TEST CHECKOUT MODAL */}
      {sandboxCheckoutData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E7EAEE] shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAEE]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#14B8A6] bg-[#EFFCF8] border border-[#14B8A6]/30 px-2 py-0.5 rounded-full">
                  REEPY Escrow Gateway (Sandbox Test Mode)
                </span>
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

            <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E7EAEE] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Photographer:</span>
                <span className="font-bold text-[#191C22]">{photographerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Shoot Package:</span>
                <span className="font-bold text-[#191C22]">{booking.event_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Gateway Order ID:</span>
                <span className="font-mono text-[#64748B] text-[11px]">{sandboxCheckoutData.orderId}</span>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Authoritative Amount Due
                </span>
                <span className="text-2xl font-black text-emerald-950">
                  ₹{Number(booking.total_amount).toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-xs font-extrabold text-emerald-800 bg-emerald-200/60 px-3 py-1 rounded-full">
                INR Escrow Deposit
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[#E7EAEE]">
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={() => handleExecuteSandboxPayment(true)}
                className="w-full sm:flex-1 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>{isProcessingPayment ? 'Verifying...' : `Simulate Successful Payment (₹${Number(booking.total_amount).toLocaleString('en-IN')})`}</span>
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
              Payment Verified &amp; Secured!
            </h3>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Your payment of <strong>₹{Number(paymentSuccessModal.amount || booking.total_amount).toLocaleString('en-IN')}</strong> has been verified by the payment gateway and deposited safely into REEPY Escrow.
            </p>

            <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E7EAEE] text-left space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Booking Reference:</span>
                <span className="font-mono font-bold text-[#191C22]">{booking.booking_reference || booking.id}</span>
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

            <button
              type="button"
              onClick={() => setPaymentSuccessModal(null)}
              className="w-full py-2.5 rounded-xl text-xs font-black text-white bg-[#14B8A6] hover:bg-[#0D9488] transition-colors"
            >
              Continue to Booking Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
