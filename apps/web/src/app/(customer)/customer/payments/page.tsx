'use client';

import React from 'react';
import Link from 'next/link';
import {
  CreditCard,
  ShieldCheck,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  ArrowUpRight
} from 'lucide-react';
import { CustomerNoticeBanner } from '../../../../components/customer/CustomerNoticeBanner';
import {
  INITIAL_CUSTOMER_PAYMENTS,
  CustomerPaymentRecord
} from '../../../../data/customerDashboardData';

export default function CustomerPaymentsPage() {
  const payments: CustomerPaymentRecord[] = INITIAL_CUSTOMER_PAYMENTS;

  const totalPaid = payments.reduce((acc, curr) => (curr.status !== 'REFUNDED' ? acc + curr.amountInr : acc), 0);
  const inEscrow = payments.filter((p) => p.status === 'ESCROW_HELD').reduce((acc, curr) => acc + curr.amountInr, 0);
  const settled = payments.filter((p) => p.status === 'SETTLED').reduce((acc, curr) => acc + curr.amountInr, 0);

  const getStatusBadge = (status: CustomerPaymentRecord['status']) => {
    switch (status) {
      case 'ESCROW_HELD':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF3E6] text-[#FF6E00] border border-[#FFD9B3]">Held in Escrow</span>;
      case 'SETTLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F6ED] text-[#1E7D46]">Released to Creator</span>;
      case 'REFUNDED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FCE8E6] text-[#C5221F]">Refunded to Source</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <CustomerNoticeBanner moduleName="Payments & Escrow Protection Ledger" />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#1A1816] tracking-tight">
          Payment History & Escrow Protection
        </h1>
        <p className="text-xs sm:text-sm text-[#665E55] mt-1">
          Review invoices, check escrow safeguards, and track refunds for all your shoot bookings.
        </p>
      </div>

      {/* FINANCIAL SCORECARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 bg-white rounded-3xl border border-[#FF6E00]/40 space-y-1 shadow-card">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C847A]">Held in Escrow</p>
          <p className="text-3xl sm:text-4xl font-black text-[#FF6E00]">
            ₹{inEscrow.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-green-700 font-semibold">
            ✓ 100% Protected until you approve gallery
          </p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-[#EBE4DA] space-y-1 shadow-subtle">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C847A]">Settled & Delivered</p>
          <p className="text-3xl sm:text-4xl font-black text-[#1A1816]">
            ₹{settled.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#8C847A]">Released after completed photo delivery</p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-[#EBE4DA] space-y-1 shadow-subtle">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C847A]">Total Spend All-Time</p>
          <p className="text-3xl sm:text-4xl font-black text-[#1A1816]">
            ₹{totalPaid.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#8C847A]">Across 4 verified photographer bookings</p>
        </div>
      </div>

      {/* ESCROW GUARANTEE NOTICE */}
      <div className="p-6 bg-[#FAF7F2] rounded-3xl border border-[#E0D8CD] space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#FF6E00]" />
          <h2 className="text-sm font-bold text-[#1A1816]">
            How SnapShoot Escrow Protects Your Money
          </h2>
        </div>
        <p className="text-xs text-[#665E55] leading-relaxed max-w-3xl">
          When you book a shoot, your payment is safely deposited into a secure escrow account managed via our RBI-authorized payment partner. The photographer only receives payout after you confirm satisfaction and download your final photo deliverables. If a shoot is cancelled or the photographer fails to show up, you receive an immediate 100% refund.
        </p>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white rounded-3xl border border-[#EBE4DA] p-6 space-y-4 shadow-subtle">
        <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#1A1816]">
            Billing & Invoices History
          </h3>
          <span className="text-xs font-mono text-[#8C847A]">Sample Payment Ledger</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#F0EAE1] text-[#8C847A] font-bold uppercase tracking-wider">
                <th className="py-2.5">Booking Ref</th>
                <th className="py-2.5">Service & Creator</th>
                <th className="py-2.5">Date</th>
                <th className="py-2.5">Method</th>
                <th className="py-2.5 text-right">Amount</th>
                <th className="py-2.5 text-center">Status</th>
                <th className="py-2.5 text-center">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1]">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                  <td className="py-3.5 font-mono font-bold text-[#1A1816]">{p.bookingRef}</td>
                  <td className="py-3.5">
                    <p className="font-bold text-[#1A1816]">{p.serviceTitle}</p>
                    <p className="text-[#8C847A]">Photographer: {p.photographerName}</p>
                  </td>
                  <td className="py-3.5 text-[#8C847A]">{p.paymentDate}</td>
                  <td className="py-3.5 text-[#665E55]">{p.paymentMethod}</td>
                  <td className="py-3.5 text-right font-black text-sm text-[#1A1816]">
                    ₹{p.amountInr.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 text-center">{getStatusBadge(p.status)}</td>
                  <td className="py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => alert(`Simulated PDF receipt download for invoice ${p.invoiceRef}`)}
                      className="p-1.5 text-[#8C847A] hover:text-[#FF6E00] rounded-lg hover:bg-[#F2ECE3]"
                      title="Download Tax Receipt"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
