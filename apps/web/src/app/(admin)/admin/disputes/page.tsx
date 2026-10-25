'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  HelpCircle,
  MessageSquare,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
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
  taxes: number;
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
    average_rating: number;
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

export default function AdminDisputesPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'DISPUTED' | 'CANCELLED' | 'CONFIRMED' | 'ALL'>('DISPUTED');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);

  // Arbitration modal state
  const [arbitrateModalBooking, setArbitrateModalBooking] = useState<AdminBooking | null>(null);
  const [arbitrateDecision, setArbitrateDecision] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmittingArbitration, setIsSubmittingArbitration] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);

  const notify = (text: string, tone: 'ok' | 'error' = 'ok') => {
    setToastMessage({ text, tone });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchDisputes = useCallback(async () => {
    try {
      setIsLoading(true);
      const statusParam = activeTab === 'DISPUTED' ? 'CANCELLATION_REQUESTED' : activeTab;
      const res = await fetch(`/api/admin/bookings?status=${statusParam}&search=${encodeURIComponent(searchQuery)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.bookings && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error('Error loading disputes:', err);
      notify('Failed to load dispute records.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

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

      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        notify(
          arbitrateDecision === 'approve'
            ? 'Dispute approved: booking cancelled and customer refund initiated.'
            : 'Dispute rejected: booking restored to confirmed status.',
          'ok'
        );
        setArbitrateModalBooking(null);
        setAdminNotes('');
        await fetchDisputes();
      } else {
        notify(body.error || 'Failed to arbitrate cancellation.', 'error');
      }
    } catch (err: any) {
      console.error('Error arbitrating cancellation:', err);
      notify(err?.message || 'Error processing arbitration.', 'error');
    } finally {
      setIsSubmittingArbitration(false);
    }
  };

  const activeDisputesCount = bookings.filter((b) => b.booking_status === 'disputed').length;
  const totalLockedEscrow = bookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* ACTION TOAST */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed top-20 right-8 z-50 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 ${
            toastMessage.tone === 'error' ? 'bg-red-600' : 'bg-[#191C22]'
          }`}
        >
          {toastMessage.tone === 'ok' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="rounded-3xl bg-[#EFFCF8] border border-[#99F6E4] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Scale className="w-4 h-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-purple-700">Arbitration Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#191C22] tracking-tight">Support &amp; Dispute Mediation</h1>
          <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed">
            Review emergency cancellations, mediate disagreements between clients and creators, and disburse or refund escrow funds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchDisputes}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-white border border-[#E7EAEE] text-xs font-bold text-[#191C22] hover:bg-[#F5F7F9] transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#14B8A6]' : ''}`} />
            <span>Sync Disputes</span>
          </button>
        </div>
      </div>

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E7EAEE] p-5 shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#64748B] font-medium">Pending Arbitration</p>
            <p className="text-2xl font-black text-[#191C22]">{activeDisputesCount}</p>
            <p className="text-[11px] text-[#94A3B8] font-medium">Requiring immediate resolution</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7EAEE] p-5 shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#64748B] font-medium">Escrow in Dispute</p>
            <p className="text-2xl font-black text-[#191C22]">₹{totalLockedEscrow.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-[#94A3B8] font-medium">Protected customer payments</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7EAEE] p-5 shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#64748B] font-medium">Arbitration SLA</p>
            <p className="text-2xl font-black text-[#191C22]">&lt; 4 Hours</p>
            <p className="text-[11px] text-[#94A3B8] font-medium">Average turnaround time</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7EAEE] p-5 shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#64748B] font-medium">Concierge Tickets</p>
            <p className="text-2xl font-black text-[#191C22]">12 Active</p>
            <p className="text-[11px] text-[#94A3B8] font-medium">Shoot assistance queue</p>
          </div>
        </div>
      </div>

      {/* TABS & SEARCH */}
      <div className="bg-white rounded-3xl border border-[#E7EAEE] p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* TAB BUTTONS */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('DISPUTED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'DISPUTED'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'bg-[#F5F7F9] text-[#64748B] hover:text-[#191C22]'
              }`}
            >
              <span>Active Disputes</span>
              {activeDisputesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-white text-red-600 font-black">
                  {activeDisputesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CANCELLED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'CANCELLED'
                  ? 'bg-[#191C22] text-white shadow-2xs'
                  : 'bg-[#F5F7F9] text-[#64748B] hover:text-[#191C22]'
              }`}
            >
              Resolved &amp; Refunded
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CONFIRMED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'CONFIRMED'
                  ? 'bg-[#191C22] text-white shadow-2xs'
                  : 'bg-[#F5F7F9] text-[#64748B] hover:text-[#191C22]'
              }`}
            >
              Rejected &amp; Enforced
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[#191C22] text-white shadow-2xs'
                  : 'bg-[#F5F7F9] text-[#64748B] hover:text-[#191C22]'
              }`}
            >
              All Records
            </button>
          </div>

          {/* SEARCH */}
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by ref, name, venue..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F5F7F9] border border-[#E7EAEE] text-xs text-[#191C22] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#14B8A6]"
            />
          </div>
        </div>
      </div>

      {/* DISPUTES LIST */}
      <div className="space-y-4">
        {isLoading && bookings.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#E7EAEE] space-y-3 shadow-2xs">
            <div className="w-8 h-8 border-3 border-[#14B8A6] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-[#94A3B8]">Loading disputed bookings and arbitrations...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-[#E7EAEE] space-y-2 shadow-2xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-black text-[#191C22]">No active disputes in this queue</h3>
            <p className="text-xs text-[#94A3B8]">All customer shoots and cancellation requests have been mediated.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {bookings.map((booking) => {
              const isDisputed = booking.booking_status === 'disputed';
              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-3xl border p-5 sm:p-6 transition-all shadow-2xs space-y-4 ${
                    isDisputed ? 'border-red-300 ring-2 ring-red-100' : 'border-[#E7EAEE]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F3F5]">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-[#191C22] text-white">
                        {booking.booking_reference || booking.id.slice(0, 8)}
                      </span>
                      <span className="text-xs font-black text-[#191C22]">
                        {booking.event_title || 'Photography Shoot'}
                      </span>
                      <span className="text-[11px] text-[#94A3B8] font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {booking.event_date}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black ${
                          isDisputed
                            ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse'
                            : booking.booking_status === 'cancelled'
                              ? 'bg-stone-100 text-[#64748B]'
                              : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {isDisputed ? 'Dispute Pending Arbitration' : booking.booking_status.toUpperCase()}
                      </span>
                      <span className="text-sm font-black text-[#191C22]">
                        ₹{Number(booking.total_amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* PARTIES INVOLVED */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F5F7F9] border border-[#E7EAEE] text-xs">
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#94A3B8] block mb-1">Customer Client</span>
                      <p className="font-black text-[#191C22]">{booking.customer?.full_name || 'Customer'}</p>
                      <p className="text-[#64748B] text-[11px]">{booking.customer?.email}</p>
                      <p className="text-[#94A3B8] text-[11px]">{booking.customer?.phone_number || 'No phone recorded'}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase text-[#94A3B8] block mb-1">Creator / Photographer</span>
                      <p className="font-black text-[#191C22]">{booking.creator?.professional_name || 'Photographer'}</p>
                      <p className="text-[#64748B] text-[11px]">{booking.creator?.user?.email || 'Creator Account'}</p>
                      <p className="text-[#94A3B8] text-[11px]">
                        {booking.creator?.city || 'Location'} • {booking.creator?.user?.phone_number || 'No phone recorded'}
                      </p>
                    </div>
                  </div>

                  {/* DISPUTE CAUSE / REASON CALLOUT */}
                  {booking.cancellation_reason && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-red-800 font-black">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span>Dispute Narrative / Emergency Cancellation Reason:</span>
                      </div>
                      <p className="text-red-900 leading-relaxed font-medium pl-5.5">
                        {booking.cancellation_reason}
                      </p>
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(booking)}
                      className="text-xs font-bold text-[#14B8A6] hover:underline cursor-pointer"
                    >
                      Inspect Full Shoot Audit
                    </button>

                    <div className="flex items-center gap-2">
                      {isDisputed && (
                        <button
                          type="button"
                          onClick={() => {
                            setArbitrateModalBooking(booking);
                            setArbitrateDecision('approve');
                            setAdminNotes('');
                          }}
                          className="px-5 py-2 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
                        >
                          <Scale className="w-3.5 h-3.5" />
                          <span>Arbitrate Dispute</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ARBITRATION MODAL */}
      {arbitrateModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E7EAEE] shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7EAEE]">
              <div>
                <h3 className="text-base font-black text-[#191C22]">Arbitrate Booking Dispute</h3>
                <p className="text-xs text-[#94A3B8] font-bold">
                  Reference: {arbitrateModalBooking.booking_reference || arbitrateModalBooking.id.slice(0, 8)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setArbitrateModalBooking(null)}
                className="p-1 rounded-lg text-[#94A3B8] hover:bg-[#F5F7F9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-900 space-y-1">
              <p className="font-bold">Creator Reason Claimed:</p>
              <p className="italic">&ldquo;{arbitrateModalBooking.cancellation_reason || 'Emergency notice'}&rdquo;</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-[#191C22] uppercase">Administrative Ruling</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setArbitrateDecision('approve')}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    arbitrateDecision === 'approve'
                      ? 'border-red-600 bg-red-50 ring-2 ring-red-200'
                      : 'border-[#E7EAEE] bg-[#F5F7F9] text-[#64748B]'
                  }`}
                >
                  <p className="text-xs font-black text-red-900">Approve &amp; Refund</p>
                  <p className="text-[10px] text-red-700 font-medium mt-0.5">Cancel shoot; refund client payment.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setArbitrateDecision('reject')}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    arbitrateDecision === 'reject'
                      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-[#E7EAEE] bg-[#F5F7F9] text-[#64748B]'
                  }`}
                >
                  <p className="text-xs font-black text-blue-900">Reject &amp; Enforce</p>
                  <p className="text-[10px] text-blue-700 font-medium mt-0.5">Enforce commitment; revert to confirmed.</p>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-[#191C22]">Admin Mediation Audit Notes *</label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Log reason for decision (e.g. Validated medical document; client informed; refund executed)..."
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
                className="px-5 py-2 rounded-xl text-xs font-black text-white bg-[#191C22] hover:bg-black transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isSubmittingArbitration ? 'Executing Decision...' : 'Commit Arbitration Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL AUDIT MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E7EAEE] shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7EAEE]">
              <div>
                <h3 className="text-base font-black text-[#191C22]">Booking Record {selectedBooking.booking_reference}</h3>
                <p className="text-xs text-[#94A3B8]">Created: {new Date(selectedBooking.created_at).toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="p-1 rounded-lg text-[#94A3B8] hover:bg-[#F5F7F9]"
              >
                <X className="w-4 h-4" />
              </button>
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
                <p className="text-[10px] uppercase font-bold text-[#94A3B8]">Shoot Venue &amp; Date</p>
                <p className="font-medium text-[#191C22]">{selectedBooking.event_location}</p>
                <p className="text-[#94A3B8]">{selectedBooking.event_date}</p>
              </div>

              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-purple-950 space-y-1">
                <p className="text-[10px] uppercase font-bold text-purple-800">Escrow Financial Snapshot</p>
                <div className="flex justify-between">
                  <span>Gross Client Total:</span>
                  <span className="font-bold">₹{Number(selectedBooking.total_amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Platform Commission:</span>
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
