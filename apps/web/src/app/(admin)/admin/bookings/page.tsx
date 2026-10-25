'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Check,
  ChevronRight,
  ShieldCheck,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../../../lib/auth';

interface AdminBooking {
  id: string;
  booking_reference: string;
  event_title: string;
  event_date: string;
  start_at: string;
  end_at: string;
  event_location: string;
  agreed_service_price: number;
  platform_fee: number;
  total_amount: number;
  booking_status: string;
  payment_status: string;
  customer_notes?: string;
  cancellation_reason?: string;
  created_at: string;
  customer?: {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    avatar_url?: string;
  };
  creator?: {
    id: string;
    professional_name: string;
    city: string;
    average_rating?: number;
    user?: {
      id: string;
      full_name: string;
      phone_number: string;
      email: string;
      avatar_url?: string;
    };
  };
  service?: {
    id: string;
    title: string;
    duration_minutes: number;
  };
}

export default function AdminBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'DISPUTED' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [totalDisputedCount, setTotalDisputedCount] = useState<number>(0);

  // Modal for resolving photographer emergency cancellation
  const [arbitrateModalBooking, setArbitrateModalBooking] = useState<AdminBooking | null>(null);
  const [arbitrateDecision, setArbitrateDecision] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmittingArbitration, setIsSubmittingArbitration] = useState(false);

  const syncDisputeCount = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data?.stats?.disputedBookings != null) {
        setTotalDisputedCount(data.stats.disputedBookings);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    syncDisputeCount();
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const tabParam = (sp.get('tab') || sp.get('status') || '').toUpperCase();
      if (['DISPUTED', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'ALL'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/bookings?status=${activeTab}&search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.bookings && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error('Error loading admin bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleResolveCancellation = async () => {
    if (!arbitrateModalBooking) return;
    try {
      setIsSubmittingArbitration(true);
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: arbitrateModalBooking.id,
          action: 'resolve_cancellation',
          decision: arbitrateDecision,
          adminNotes: adminNotes.trim(),
          adminId: user?.id,
        }),
      });

      if (res.ok) {
        setArbitrateModalBooking(null);
        setAdminNotes('');
        await Promise.all([fetchBookings(), syncDisputeCount()]);
      }
    } catch (err) {
      console.error('Error arbitrating cancellation:', err);
    } finally {
      setIsSubmittingArbitration(false);
    }
  };

  const disputedBookingsCount = Math.max(
    totalDisputedCount,
    bookings.filter((b) => b.booking_status === 'disputed').length
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disputed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-300 animate-pulse">Cancellation Requested</span>;
      case 'pending':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">Pending Photographer</span>;
      case 'confirmed':
      case 'accepted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">Confirmed</span>;
      case 'on_the_way':
      case 'arrived_at_venue':
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">In Progress</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">Completed</span>;
      case 'cancelled':
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-[#14B8A6] text-white">
              Operations Desk
            </span>
            <span className="text-xs text-[#94A3B8]">Admin Mediation &amp; Oversight</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#191C22] tracking-tight mt-1">
            Platform Bookings &amp; Cancellation Arbitration
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Monitor client reservations, arbitrate photographer emergency cancellation requests, and manage escrow settlements.
          </p>
        </div>

        <button
          onClick={fetchBookings}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-[#E7EAEE] text-[#191C22] hover:bg-[#F5F7F9] transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#14B8A6]" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E7EAEE]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ALL'
                ? 'bg-[#191C22] text-white shadow-xs'
                : 'bg-white text-[#64748B] hover:text-[#191C22] border border-[#E7EAEE]'
            }`}
          >
            All Bookings ({bookings.length})
          </button>

          <button
            onClick={() => setActiveTab('DISPUTED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'DISPUTED'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-red-50 text-red-900 border border-red-200 hover:bg-red-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Cancellation Requests</span>
            {disputedBookingsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-red-700 font-black">
                {disputedBookingsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('CONFIRMED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'CONFIRMED'
                ? 'bg-[#191C22] text-white shadow-xs'
                : 'bg-white text-[#64748B] hover:text-[#191C22] border border-[#E7EAEE]'
            }`}
          >
            Confirmed
          </button>

          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PENDING'
                ? 'bg-[#191C22] text-white shadow-xs'
                : 'bg-white text-[#64748B] hover:text-[#191C22] border border-[#E7EAEE]'
            }`}
          >
            Pending
          </button>

          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'COMPLETED'
                ? 'bg-[#191C22] text-white shadow-xs'
                : 'bg-white text-[#64748B] hover:text-[#191C22] border border-[#E7EAEE]'
            }`}
          >
            Completed
          </button>

          <button
            onClick={() => setActiveTab('CANCELLED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'CANCELLED'
                ? 'bg-[#191C22] text-white shadow-xs'
                : 'bg-white text-[#64748B] hover:text-[#191C22] border border-[#E7EAEE]'
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ref, client, creator, city..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-[#E7EAEE] text-xs text-[#191C22] placeholder:text-[#94A3B8] outline-none focus:border-[#14B8A6]"
          />
        </form>
      </div>

      {/* EMERGENCY DISPUTE ALERT IF ACTIVE */}
      {disputedBookingsCount > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-red-950">
                Action Required: {disputedBookingsCount} Photographer Cancellation Request(s)
              </h3>
              <p className="text-xs text-red-800">
                Photographers have requested emergency cancellation on confirmed bookings. Review reasons below to either approve cancellation &amp; refund customer, or reject and enforce assignment.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('DISPUTED')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shrink-0"
          >
            Review Now
          </button>
        </div>
      )}

      {/* BOOKINGS TABLE / CARDS */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#14B8A6] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#94A3B8]">Loading platform bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E7EAEE] space-y-3">
          <Calendar className="w-12 h-12 text-[#94A3B8] mx-auto opacity-70" />
          <h3 className="text-base font-bold text-[#191C22]">No Bookings Found</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            No bookings match the selected status filter or search parameters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className={`p-6 rounded-3xl border transition-all ${
                b.booking_status === 'disputed'
                  ? 'bg-red-50/40 border-red-300 shadow-sm'
                  : 'bg-white border-[#E7EAEE] shadow-2xs'
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Reference & Parties */}
                <div className="lg:col-span-8 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-black text-[#191C22]">{b.booking_reference || b.id}</span>
                    <span>•</span>
                    <span className="text-[#94A3B8]">{b.service?.title || b.event_title}</span>
                    <span>•</span>
                    {getStatusBadge(b.booking_status)}
                  </div>

                  {/* Customer vs Photographer Parties */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#F5F7F9] border border-[#E7EAEE]">
                    {/* Customer */}
                    <div>
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">Customer</span>
                      <p className="text-sm font-black text-[#191C22]">{b.customer?.full_name || 'Client'}</p>
                      <p className="text-xs text-[#64748B]">{b.customer?.phone_number || 'No phone'}</p>
                      <p className="text-[11px] text-[#94A3B8]">{b.customer?.email}</p>
                    </div>

                    {/* Creator */}
                    <div>
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">Assigned Photographer</span>
                      <p className="text-sm font-black text-[#191C22]">{b.creator?.professional_name || 'Creator'}</p>
                      <p className="text-xs text-[#64748B]">{b.creator?.user?.phone_number || 'No phone'}</p>
                      <p className="text-[11px] text-[#94A3B8]">{b.creator?.city || 'Operating Hub'}</p>
                    </div>
                  </div>

                  {/* Schedule & Location */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
                    <span className="flex items-center gap-1 font-semibold text-[#191C22]">
                      <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                      {b.event_date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#14B8A6]" />
                      {b.event_location}
                    </span>
                  </div>

                  {/* Photographer Cancellation Request Reason (Dispute Callout) */}
                  {b.booking_status === 'disputed' && (
                    <div className="p-3.5 rounded-2xl bg-red-100/70 border border-red-300 space-y-1.5">
                      <div className="flex items-center gap-2 text-red-950 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Photographer Emergency Cancellation Notice:</span>
                      </div>
                      <p className="text-xs text-red-900 font-medium italic bg-white/80 p-2.5 rounded-xl border border-red-200">
                        &ldquo;{b.cancellation_reason || 'Photographer requested emergency release.'}&rdquo;
                      </p>
                    </div>
                  )}

                  {b.cancellation_reason && b.booking_status !== 'disputed' && (
                    <p className="text-xs text-[#94A3B8] italic">
                      Resolution Note: &ldquo;{b.cancellation_reason}&rdquo;
                    </p>
                  )}
                </div>

                {/* Right Financials & Admin Arbitration Actions */}
                <div className="lg:col-span-4 flex flex-col justify-between items-start lg:items-end space-y-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-[#E7EAEE]">
                  <div className="text-left lg:text-right">
                    <p className="text-xl font-black text-[#191C22]">
                      ₹{Number(b.total_amount || b.agreed_service_price).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      Platform Fee: ₹{Number(b.platform_fee || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                      {b.payment_status?.toUpperCase()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:justify-end">
                    {/* If disputed (photographer wants to cancel), show Arbitrate button */}
                    {b.booking_status === 'disputed' && (
                      <button
                        onClick={() => {
                          setArbitrateModalBooking(b);
                          setArbitrateDecision('approve');
                          setAdminNotes('');
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Arbitrate Cancellation</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#191C22] bg-[#F5F7F9] hover:bg-[#F1F3F5] border border-[#E7EAEE] transition-colors"
                    >
                      View Full Audit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ARBITRATE CANCELLATION MODAL */}
      {arbitrateModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E7EAEE] shadow-elevated space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#191C22]">Arbitrate Photographer Cancellation</h3>
                <p className="text-xs text-[#94A3B8]">{arbitrateModalBooking.booking_reference} • {arbitrateModalBooking.event_date}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs space-y-1">
              <p className="font-bold text-red-950">Photographer Request Reason:</p>
              <p className="text-red-900 italic">&ldquo;{arbitrateModalBooking.cancellation_reason}&rdquo;</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-[#191C22]">Admin Decision *</label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  onClick={() => setArbitrateDecision('approve')}
                  className={`p-3 rounded-2xl border cursor-pointer text-xs transition-all ${
                    arbitrateDecision === 'approve'
                      ? 'border-red-500 bg-red-50/60 font-bold text-red-900'
                      : 'border-[#E7EAEE] bg-white text-[#64748B]'
                  }`}
                >
                  <input
                    type="radio"
                    name="decision"
                    checked={arbitrateDecision === 'approve'}
                    onChange={() => setArbitrateDecision('approve')}
                    className="mr-2"
                  />
                  Approve Cancellation
                  <span className="block text-[10px] font-normal text-[#94A3B8] mt-1">
                    Accepts photographer emergency, releases booking, and refunds customer.
                  </span>
                </label>

                <label
                  onClick={() => setArbitrateDecision('reject')}
                  className={`p-3 rounded-2xl border cursor-pointer text-xs transition-all ${
                    arbitrateDecision === 'reject'
                      ? 'border-blue-500 bg-blue-50/60 font-bold text-blue-900'
                      : 'border-[#E7EAEE] bg-white text-[#64748B]'
                  }`}
                >
                  <input
                    type="radio"
                    name="decision"
                    checked={arbitrateDecision === 'reject'}
                    onChange={() => setArbitrateDecision('reject')}
                    className="mr-2"
                  />
                  Reject &amp; Enforce
                  <span className="block text-[10px] font-normal text-[#94A3B8] mt-1">
                    Re-locks shoot as Confirmed. Photographer must attend or provide verified sub.
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-[#191C22]">Admin Mediation Notes *</label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Log reason for decision (e.g. Verified doctor prescription; refund processed via Stripe/Razorpay)..."
                className="w-full bg-[#F5F7F9] border border-[#E7EAEE] rounded-xl p-2.5 text-xs text-[#191C22] outline-none focus:border-[#14B8A6]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7EAEE]">
              <button
                type="button"
                onClick={() => setArbitrateModalBooking(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-[#F1F3F5] transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!adminNotes.trim() || isSubmittingArbitration}
                onClick={handleResolveCancellation}
                className="px-5 py-2 rounded-xl text-xs font-black text-white bg-[#191C22] hover:bg-black transition-colors disabled:opacity-50"
              >
                {isSubmittingArbitration ? 'Executing Decision...' : 'Commit Arbitration Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL AUDIT DETAIL MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E7EAEE] shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7EAEE]">
              <div>
                <h3 className="text-base font-black text-[#191C22]">Booking Record {selectedBooking.booking_reference}</h3>
                <p className="text-xs text-[#94A3B8]">Created: {new Date(selectedBooking.created_at).toLocaleString()}</p>
              </div>
              {getStatusBadge(selectedBooking.booking_status)}
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F5F7F9] rounded-2xl">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#94A3B8]">Customer</p>
                  <p className="font-bold text-[#191C22]">{selectedBooking.customer?.full_name}</p>
                  <p className="text-[11px] text-[#64748B]">{selectedBooking.customer?.phone_number}</p>
                  <p className="text-[11px] text-[#94A3B8]">{selectedBooking.customer?.email}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#94A3B8]">Photographer</p>
                  <p className="font-bold text-[#191C22]">{selectedBooking.creator?.professional_name}</p>
                  <p className="text-[11px] text-[#64748B]">{selectedBooking.creator?.user?.phone_number}</p>
                  <p className="text-[11px] text-[#94A3B8]">{selectedBooking.creator?.city}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-[#94A3B8]">Shoot Venue</p>
                <p className="font-medium text-[#191C22]">{selectedBooking.event_location}</p>
                <p className="text-[#94A3B8]">{selectedBooking.event_date}</p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 space-y-1">
                <p className="text-[10px] uppercase font-bold text-emerald-800">Escrow Financial Snapshot</p>
                <div className="flex justify-between">
                  <span>Gross Client Total:</span>
                  <span className="font-bold">₹{Number(selectedBooking.total_amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Platform Fee (Retained):</span>
                  <span>₹{Number(selectedBooking.platform_fee || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E7EAEE]">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-[#191C22] bg-[#F5F7F9] hover:bg-[#F1F3F5] transition-colors"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
