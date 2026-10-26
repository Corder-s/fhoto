'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  ShieldCheck,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { CustomerNoticeBanner } from '../../../../components/customer/CustomerNoticeBanner';
import { useAuth } from '../../../../lib/auth';

interface CustomerPaymentLedgerItem {
  id: string;
  booking_id: string;
  provider: string;
  provider_order_id: string;
  provider_payment_id: string;
  amount: number | string;
  currency: string;
  payment_status: string;
  payment_method: string;
  paid_at: string | null;
  created_at: string;
  booking?: {
    id: string;
    booking_reference: string | null;
    event_title: string | null;
    event_date: string | null;
    agreed_service_price: number | string | null;
    platform_fee: number | string | null;
    total_amount: number | string | null;
    booking_status: string | null;
    creator?: {
      id: string;
      professional_name: string | null;
      user?: { full_name: string | null; avatar_url: string | null } | null;
    } | null;
  } | null;
}

export default function CustomerPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<CustomerPaymentLedgerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalPaid: 0,
    inEscrow: 0,
    settled: 0,
    count: 0,
  });

  useEffect(() => {
    let isCancelled = false;

    async function loadPayments() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/customer/payments', { cache: 'no-store' });
        if (!res.ok) throw new Error('Could not load payment ledger');
        const data = await res.json();
        if (isCancelled) return;

        if (data.payments && Array.isArray(data.payments)) {
          setPayments(data.payments);
          if (data.summary) {
            setSummary(data.summary);
          }
        }
      } catch (err) {
        console.error('Error fetching customer payments:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    if (user?.id) {
      loadPayments();
    }
    return () => {
      isCancelled = true;
    };
  }, [user?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'captured':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF3E6] text-[#14B8A6] border border-[#FFD9B3]">
            Held in Escrow
          </span>
        );
      case 'settled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F6ED] text-[#1E7D46]">
            Released to Creator
          </span>
        );
      case 'refunded':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FCE8E6] text-[#C5221F]">
            Refunded to Source
          </span>
        );
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            Payment Pending
          </span>
        );
      case 'failed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
            Payment Failed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <CustomerNoticeBanner moduleName="Payments & Escrow Protection Ledger" />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#191C22] tracking-tight">
          Payment History & Escrow Protection
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Review official receipts, verify escrow security, and track online payments across your bookings.
        </p>
      </div>

      {/* FINANCIAL SCORECARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 bg-white rounded-3xl border border-[#14B8A6]/40 space-y-1 shadow-card">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">Held in Escrow</p>
          <p className="text-3xl sm:text-4xl font-black text-[#14B8A6]">
            ₹{summary.inEscrow.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-green-700 font-semibold">
            ✓ 100% Protected until you approve gallery
          </p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-[#EBE4DA] space-y-1 shadow-subtle">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">Settled & Delivered</p>
          <p className="text-3xl sm:text-4xl font-black text-[#191C22]">
            ₹{summary.settled.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#94A3B8]">Released after completed photo delivery</p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-[#EBE4DA] space-y-1 shadow-subtle">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">Total Spend All-Time</p>
          <p className="text-3xl sm:text-4xl font-black text-[#191C22]">
            ₹{summary.totalPaid.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#94A3B8]">Across {summary.count} recorded transactions</p>
        </div>
      </div>

      {/* ESCROW GUARANTEE NOTICE */}
      <div className="p-6 bg-[#F5F7F9] rounded-3xl border border-[#E7EAEE] space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#14B8A6]" />
          <h2 className="text-sm font-bold text-[#191C22]">
            How REEPY Escrow Protects Your Money
          </h2>
        </div>
        <p className="text-xs text-[#64748B] leading-relaxed max-w-3xl">
          When you pay for a booking, your funds are safely deposited into a secure escrow account managed via our RBI-compliant payment partner. The photographer only receives payout after you confirm satisfaction and download your final photo deliverables. If a shoot is cancelled or the photographer fails to show up, you receive an immediate 100% refund.
        </p>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white rounded-3xl border border-[#EBE4DA] p-6 space-y-4 shadow-subtle">
        <div className="flex items-center justify-between border-b border-[#E7EAEE] pb-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#191C22]">
            Verified Payment Transactions
          </h3>
          <span className="text-xs font-mono text-[#94A3B8]">Authoritative Ledger</span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs font-semibold text-[#64748B]">
            Loading payment records...
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <CreditCard className="w-10 h-10 text-[#94A3B8] mx-auto" />
            <p className="text-sm font-bold text-[#191C22]">No payment records found</p>
            <p className="text-xs text-[#64748B] max-w-xs mx-auto">
              When you complete a booking payment, your transaction receipt and escrow status will appear here.
            </p>
            <Link
              href="/customer/bookings"
              className="inline-flex px-4 py-2 bg-[#14B8A6] text-white text-xs font-bold rounded-xl hover:bg-[#0D9488]"
            >
              Go to My Bookings
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E7EAEE] text-[#94A3B8] font-bold uppercase tracking-wider">
                  <th className="py-2.5">Booking Ref</th>
                  <th className="py-2.5">Service & Creator</th>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Gateway Reference</th>
                  <th className="py-2.5 text-right">Amount</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="py-2.5 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7EAEE]">
                {payments.map((p) => {
                  const bRef = p.booking?.booking_reference || p.booking?.id?.substring(0, 8) || 'BK-N/A';
                  const title = p.booking?.event_title || 'Photography Shoot';
                  const creatorName =
                    p.booking?.creator?.professional_name ||
                    p.booking?.creator?.user?.full_name ||
                    'Assigned Photographer';
                  const dateStr = p.paid_at
                    ? new Date(p.paid_at).toLocaleDateString()
                    : new Date(p.created_at).toLocaleDateString();

                  return (
                    <tr key={p.id} className="hover:bg-[#F5F7F9]/60 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-[#191C22]">
                        <Link
                          href="/customer/bookings"
                          className="hover:text-[#14B8A6] transition-colors"
                        >
                          {bRef}
                        </Link>
                      </td>
                      <td className="py-3.5">
                        <p className="font-bold text-[#191C22]">{title}</p>
                        <p className="text-[#94A3B8]">Photographer: {creatorName}</p>
                      </td>
                      <td className="py-3.5 text-[#94A3B8]">{dateStr}</td>
                      <td className="py-3.5 font-mono text-[11px] text-[#64748B]">
                        {p.provider_payment_id || p.provider_order_id || 'Pending'}
                      </td>
                      <td className="py-3.5 text-right font-black text-sm text-[#191C22]">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 text-center">{getStatusBadge(p.payment_status)}</td>
                      <td className="py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              `Official Tax Invoice for Booking ${bRef}\nAmount: ₹${Number(p.amount).toLocaleString('en-IN')}\nPayment ID: ${p.provider_payment_id || p.id}\nStatus: Secured in REEPY Escrow.`
                            )
                          }
                          className="p-1.5 text-[#94A3B8] hover:text-[#14B8A6] rounded-lg hover:bg-[#F1F3F5]"
                          title="View Tax Receipt"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
