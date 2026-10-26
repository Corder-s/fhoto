'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CreditCard,
  ArrowDownCircle,
  Layers,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  IndianRupee,
  ShieldCheck,
  Eye,
  Lock,
} from 'lucide-react';

interface PaymentRow {
  id: string;
  booking_id: string;
  customer_id: string;
  provider: string;
  provider_payment_id: string;
  amount: number | string;
  currency: string;
  payment_status: string;
  paid_at: string | null;
  created_at: string;
  customer?: { full_name: string | null; email: string | null } | null;
  booking?: {
    booking_reference: string | null;
    total_amount: number | string | null;
    platform_fee: number | string | null;
    booking_status: string | null;
  } | null;
}

interface PayoutRow {
  id: string;
  booking_id: string;
  creator_id: string;
  gross_amount: number | string;
  platform_fee: number | string;
  net_amount: number | string;
  payout_status: string;
  paid_at: string | null;
  created_at: string;
  creator?: { professional_name: string | null; city: string | null } | null;
}

interface PaymentSummary {
  totalCollected: number;
  totalGrossValue: number;
  totalPlatformCommission: number;
  totalEscrowLiability: number;
  totalCompletedPayouts: number;
  totalRefunds: number;
}

const formatInr = (n: number | string | null | undefined) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
};

export default function AdminPaymentsPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'transactions' | 'payouts' | 'subscriptions') || 'transactions';

  const [activeTab, setActiveTab] = useState<'transactions' | 'payouts' | 'subscriptions'>(initialTab);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/payments', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load payment ledger (${res.status})`);
      const data = await res.json();
      setPayments(data.payments || []);
      setPayouts(data.payouts || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err?.message || 'Could not load payment records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPayments = payments.filter((p) => {
    const ref = p.booking?.booking_reference || '';
    const cust = p.customer?.full_name || '';
    const pid = p.provider_payment_id || '';
    return (
      ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pid.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredPayouts = payouts.filter((po) => {
    const name = po.creator?.professional_name || '';
    const city = po.creator?.city || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || city.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Payments & Ledger</h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Verified customer transactions, platform commission, and photographer payout escrow.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#14B8A6]' : 'text-[#64748B]'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Financial Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-2xs">
          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Collected Revenue</p>
          <p className="text-xl font-black text-[#0F172A] mt-1">{formatInr(summary?.totalCollected ?? 0)}</p>
          <p className="text-[10px] text-[#10B981] font-semibold mt-0.5">Verified gateway settlements</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-2xs">
          <p className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider">Platform Take</p>
          <p className="text-xl font-black text-[#0D9488] mt-1">{formatInr(summary?.totalPlatformCommission ?? 0)}</p>
          <p className="text-[10px] text-[#64748B] font-medium mt-0.5">Commission retained</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-2xs">
          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Creator Escrow</p>
          <p className="text-xl font-black text-[#0F172A] mt-1">{formatInr(summary?.totalEscrowLiability ?? 0)}</p>
          <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Held until shoot completion</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-2xs">
          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Completed Payouts</p>
          <p className="text-xl font-black text-[#10B981] mt-1">{formatInr(summary?.totalCompletedPayouts ?? 0)}</p>
          <p className="text-[10px] text-[#64748B] font-medium mt-0.5">Disbursed to photographers</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-2xs">
          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Refunds Issued</p>
          <p className="text-xl font-black text-[#EF4444] mt-1">{formatInr(summary?.totalRefunds ?? 0)}</p>
          <p className="text-[10px] text-[#64748B] font-medium mt-0.5">Dispute / cancellation returns</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'transactions'
              ? 'bg-[#14B8A6] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Transactions ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'payouts'
              ? 'bg-[#14B8A6] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          <span>Creator Payouts ({payouts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'subscriptions'
              ? 'bg-[#14B8A6] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Marketplace Monetization</span>
        </button>
      </div>

      {/* Tab 1: Transactions */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by booking ref, customer, or payment ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#14B8A6]"
              />
            </div>
            <span className="text-xs text-[#64748B] font-medium">
              Showing {filteredPayments.length} transactions
            </span>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8] text-xs space-y-1">
              <CreditCard className="w-8 h-8 mx-auto text-[#CBD5E1]" />
              <p className="font-bold text-[#0F172A]">No payment transactions recorded yet.</p>
              <p className="text-[11px] text-[#64748B]">Transactions will appear immediately as customers check out and pay.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-[#94A3B8] text-[11px] font-semibold">
                    <th className="py-2.5 px-3">Transaction / ID</th>
                    <th className="py-2.5 px-3">Booking Ref</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Provider</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredPayments.map((p) => {
                    const isPaid = p.payment_status === 'paid';
                    const isPending = p.payment_status === 'pending';
                    const isRefunded = p.payment_status === 'refunded';

                    return (
                      <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-[#475569]">
                          {p.provider_payment_id || p.id.slice(0, 12)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-bold text-[#0F172A]">
                          {p.booking?.booking_reference || 'Booking'}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <p className="font-semibold text-[#0F172A]">{p.customer?.full_name || 'Customer'}</p>
                          <p className="text-[10px] text-[#94A3B8]">{p.customer?.email}</p>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#475569] font-bold text-[10px] uppercase">
                            {p.provider}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-black text-[#0F172A]">
                          {formatInr(p.amount)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isPending
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : isRefunded
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPaid ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : isRefunded ? 'bg-purple-500' : 'bg-red-500'
                              }`}
                            />
                            <span className="capitalize">{p.payment_status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-[#64748B] text-[11px]">
                          {p.paid_at
                            ? new Date(p.paid_at).toLocaleDateString()
                            : p.created_at
                            ? new Date(p.created_at).toLocaleDateString()
                            : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Payouts */}
      {activeTab === 'payouts' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search photographer or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#14B8A6]"
              />
            </div>
            <span className="text-xs text-[#64748B] font-medium">
              Showing {filteredPayouts.length} payout records
            </span>
          </div>

          {filteredPayouts.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8] text-xs space-y-1">
              <ArrowDownCircle className="w-8 h-8 mx-auto text-[#CBD5E1]" />
              <p className="font-bold text-[#0F172A]">No creator payouts in ledger.</p>
              <p className="text-[11px] text-[#64748B]">Payouts are automatically scheduled in escrow when bookings are confirmed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-[#94A3B8] text-[11px] font-semibold">
                    <th className="py-2.5 px-3">Photographer</th>
                    <th className="py-2.5 px-3">City</th>
                    <th className="py-2.5 px-3">Gross Booking</th>
                    <th className="py-2.5 px-3">Platform Fee</th>
                    <th className="py-2.5 px-3">Net Payable</th>
                    <th className="py-2.5 px-3">Escrow Status</th>
                    <th className="py-2.5 px-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredPayouts.map((po) => {
                    const isInEscrow = po.payout_status === 'in_escrow';
                    const isPaid = po.payout_status === 'paid';

                    return (
                      <tr key={po.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap font-bold text-[#0F172A]">
                          {po.creator?.professional_name || 'Photographer'}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-[#64748B]">
                          {po.creator?.city || 'N/A'}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-semibold text-[#475569]">
                          {formatInr(po.gross_amount)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-semibold text-[#0D9488]">
                          {formatInr(po.platform_fee)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-black text-[#0F172A]">
                          {formatInr(po.net_amount)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isInEscrow
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPaid ? 'bg-emerald-500' : isInEscrow ? 'bg-amber-500' : 'bg-blue-500'
                              }`}
                            />
                            <span className="capitalize">{po.payout_status.replace('_', ' ')}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-[#64748B] text-[11px]">
                          {po.created_at ? new Date(po.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Monetization & Commission Model */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs space-y-4">
          <div className="max-w-2xl space-y-3">
            <h3 className="text-base font-black text-[#0F172A]">Marketplace Monetization Architecture</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              REEPY operates as a pure performance-based marketplace. There are no recurring monthly subscription fees charged to photographers or customers. Platform revenue is derived exclusively from the agreed platform commission retained on verified customer bookings.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-1">
                <span className="text-[10px] font-bold text-[#64748B] uppercase">Commission Rate</span>
                <p className="text-lg font-black text-[#0D9488]">10% of Service Subtotal</p>
                <p className="text-[11px] text-[#64748B]">Deducted automatically before creator payout escrow release.</p>
              </div>
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-1">
                <span className="text-[10px] font-bold text-[#64748B] uppercase">Travel Reimbursement</span>
                <p className="text-lg font-black text-[#0F172A]">100% to Creator</p>
                <p className="text-[11px] text-[#64748B]">Travel fees beyond 20 km are 100% allocated to photographer compensation.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
