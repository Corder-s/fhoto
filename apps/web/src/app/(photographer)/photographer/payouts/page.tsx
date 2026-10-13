'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  CreditCard,
  Building2,
  Smartphone,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { DemoNoticeBanner } from '../../../../components/photographer/DemoNoticeBanner';
import { INITIAL_PAYOUTS, PayoutTransaction } from '../../../../data/photographerDashboardData';

export default function PhotographerPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutTransaction[]>(INITIAL_PAYOUTS);
  const [availableBalance, setAvailableBalance] = useState<number>(42800);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(42800);
  const [isProcessing, setIsProcessing] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState('');

  const handleExecutePayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0 || withdrawAmount > availableBalance) return;

    setIsProcessing(true);

    setTimeout(() => {
      const newTx: PayoutTransaction = {
        id: `po-${Date.now()}`,
        reference: `PAY-UPI-${Math.floor(100000 + Math.random() * 900000)}`,
        amountInr: withdrawAmount,
        date: 'Today, Just Now',
        method: 'UPI',
        destinationAccount: 'rahulverma@okhdfcbank',
        status: 'PROCESSING',
        bookingsCount: 2,
      };

      setPayouts([newTx, ...payouts]);
      setAvailableBalance((prev) => prev - withdrawAmount);
      setIsProcessing(false);
      setIsWithdrawModalOpen(false);
      setWithdrawalSuccess(`Withdrawal of ₹${withdrawAmount.toLocaleString('en-IN')} initiated! Transaction dispatched to verified account.`);
      setTimeout(() => setWithdrawalSuccess(''), 6000);
    }, 800);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <DemoNoticeBanner moduleName="Payout Settlements & Bank Disbursements" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
            Payouts & Bank Settlements
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Manage your UPI ID, request on-demand disbursements, and view tax transfer receipts.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setWithdrawAmount(availableBalance);
            setIsWithdrawModalOpen(true);
          }}
          disabled={availableBalance <= 0}
          leftIcon={<ArrowUpRight className="w-4 h-4" />}
        >
          Request Instant Payout
        </Button>
      </div>

      {withdrawalSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-card-sm text-xs font-bold text-green-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{withdrawalSuccess}</span>
        </div>
      )}

      {/* BALANCE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="space-y-2 border-brand/40 bg-white">
          <p className="text-xs uppercase font-extrabold text-ink-muted">Available Balance</p>
          <p className="text-3xl font-black text-green-600">
            ₹{availableBalance.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-ink-muted">Eligible for instant IMPS / UPI payout</p>
        </Card>

        <Card className="space-y-2 bg-white">
          <p className="text-xs uppercase font-extrabold text-ink-muted">Settled All-Time</p>
          <p className="text-3xl font-black text-ink-primary">
            ₹99,200
          </p>
          <p className="text-[11px] text-ink-muted">Successfully wired across 12 settlements</p>
        </Card>

        <Card className="space-y-2 bg-white">
          <p className="text-xs uppercase font-extrabold text-ink-muted">Primary Disbursement</p>
          <div className="flex items-center gap-2 text-sm font-bold text-ink-primary pt-1">
            <Smartphone className="w-4 h-4 text-brand" />
            <span>UPI: rahulverma@okhdfcbank</span>
          </div>
          <p className="text-[11px] text-green-700 font-medium">NPCI Verified • Active</p>
        </Card>
      </div>

      {/* PAYOUT HISTORY TABLE */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-contour-subtle pb-3">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink-primary">
              Settlement & Transfer History
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">Sample disbursement records processed via automated clearing house.</p>
          </div>
          <span className="text-xs font-mono text-ink-muted">{payouts.length} Transactions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-contour-subtle text-ink-muted font-bold uppercase tracking-wider">
                <th className="py-2.5">Reference ID</th>
                <th className="py-2.5">Disbursement Method</th>
                <th className="py-2.5">Destination</th>
                <th className="py-2.5">Date</th>
                <th className="py-2.5 text-right">Settled Amount</th>
                <th className="py-2.5 text-center">Status</th>
                <th className="py-2.5 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-contour-subtle">
              {payouts.map((tx) => (
                <tr key={tx.id} className="hover:bg-canvas-secondary/40 transition-colors">
                  <td className="py-3 font-mono font-bold text-ink-primary">{tx.reference}</td>
                  <td className="py-3">
                    <span className="font-semibold text-ink-primary">{tx.method}</span>
                    <span className="text-[10px] text-ink-muted block">{tx.bookingsCount} Shoots Included</span>
                  </td>
                  <td className="py-3 font-mono text-ink-secondary">{tx.destinationAccount}</td>
                  <td className="py-3 text-ink-muted">{tx.date}</td>
                  <td className="py-3 text-right font-extrabold text-green-700">
                    ₹{tx.amountInr.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 text-center">
                    <Badge
                      variant={tx.status === 'COMPLETED' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {tx.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-center">
                    <button
                      className="p-1.5 text-ink-muted hover:text-brand rounded"
                      title="Download PDF Tax Receipt"
                      onClick={() => alert(`Receipt downloaded for transaction ${tx.reference}.`)}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* WITHDRAWAL MODAL */}
      {isWithdrawModalOpen && (
        <Modal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          title="Request Immediate Payout"
          description="Initiate an instant transfer to your verified UPI / Bank account."
          maxWidth="md"
        >
          <form onSubmit={handleExecutePayout} className="space-y-4 text-xs">
            <div className="p-3.5 bg-canvas-secondary rounded-card-sm space-y-1">
              <span className="text-ink-muted font-bold uppercase text-[10px]">Verified Destination:</span>
              <p className="text-sm font-bold text-ink-primary">UPI VPA: rahulverma@okhdfcbank</p>
              <p className="text-ink-secondary text-[11px]">Primary Bank: HDFC Bank Ltd. (NPCI Fast Transfer)</p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold uppercase text-ink-primary">Transfer Amount (INR ₹) *</label>
              <input
                type="number"
                min={500}
                max={availableBalance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-base font-bold text-ink-primary outline-none focus:ring-2 focus:ring-brand"
              />
              <p className="text-ink-muted text-[11px]">
                Maximum available for withdrawal: ₹{availableBalance.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-3 bg-brand-subtle/50 rounded border border-brand-border text-ink-secondary text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-ink-primary">
                <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                <span>Zero Transfer Fees</span>
              </div>
              <p>Instantshoot absorbs all UPI & IMPS transaction charges. No hidden deductions.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsWithdrawModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isProcessing}
              >
                Confirm Instant Transfer
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
