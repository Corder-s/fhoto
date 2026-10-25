'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  PieChart,
  FileText
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { useCurrentUserProfile } from '../../../../context/UserProfileContext';

export default function PhotographerEarningsPage() {
  const { authUser, creatorProfile, stats } = useCurrentUserProfile();
  const [dbBookings, setDbBookings] = useState<any[]>([]);

  useEffect(() => {
    let isCancelled = false;

    async function loadBookings() {
      if (!authUser?.id) return;
      try {
        const res = await fetch(`/api/photographers/bookings?userId=${authUser.id}`);
        const data = await res.json();
        if (isCancelled) return;
        if (data.bookings) setDbBookings(data.bookings);
      } catch (err) {
        console.error('Error loading bookings for earnings:', err);
      }
    }

    loadBookings();
    return () => {
      isCancelled = true;
    };
  }, [authUser?.id]);

  const completedBookings = dbBookings.filter((b) => b.booking_status === 'completed');
  const grossBookingValue = completedBookings.reduce((sum, b) => sum + (Number(b.agreed_service_price) || 0), 0);
  const platformFee = Math.round(grossBookingValue * 0.2);
  const netCreatorEarnings = grossBookingValue - platformFee;

  const inEscrowPending = dbBookings
    .filter((b) => b.booking_status === 'confirmed' || b.booking_status === 'in_progress')
    .reduce((sum, b) => sum + (Number(b.agreed_service_price) || 0) * 0.8, 0);

  const availableBalance = netCreatorEarnings;
  const settledPayouts = 0; // Settled payouts to bank

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
            Creator Earnings &amp; Revenue
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Track gross booking volume, verified 80% net payouts, escrow safeguards, and monthly revenue.
          </p>
        </div>

        <Link href="/photographer/payouts">
          <Button variant="primary" size="md" leftIcon={<ArrowRight className="w-4 h-4" />}>
            Manage Payout Accounts
          </Button>
        </Link>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2 border-contour-subtle bg-white">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Gross Booking Volume
          </span>
          <p className="text-2xl font-black text-ink-primary">
            ₹{grossBookingValue.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-ink-secondary">Total client contract value</p>
        </Card>

        <Card className="p-5 space-y-2 border-contour-subtle bg-white">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Platform Fee (20%)
          </span>
          <p className="text-2xl font-black text-ink-secondary">
            ₹{platformFee.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-ink-secondary">Covering insurance &amp; marketing</p>
        </Card>

        <Card className="p-5 space-y-2 border-brand/50 bg-[#EFFCF8]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#14B8A6]">
            Net Creator Earnings
          </span>
          <p className="text-2xl font-black text-[#14B8A6]">
            ₹{netCreatorEarnings.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#14B8A6]/80">80% creator compensation</p>
        </Card>

        <Card className="p-5 space-y-2 border-contour-subtle bg-white">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Escrow Protected
          </span>
          <p className="text-2xl font-black text-emerald-600">
            ₹{inEscrowPending.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-emerald-700">Held in platform escrow until shoot sign-off</p>
        </Card>
      </div>

      {/* Escrow Safeguard Explainer */}
      <Card className="p-6 bg-canvas-secondary border-contour-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink-primary">100% Escrow Security Guarantee</h4>
            <p className="text-xs text-ink-secondary mt-0.5 max-w-xl leading-relaxed">
              When clients book a session, 100% of the funds are locked in platform escrow. Upon completion and client OTP verification, your 80% earnings are immediately credited to your payout balance.
            </p>
          </div>
        </div>

        <Link href="/photographer/payouts">
          <Button variant="secondary" size="sm">
            View Settlement History
          </Button>
        </Link>
      </Card>

      {/* Completed Bookings or Empty State */}
      <Card className="p-6 space-y-4 bg-white border-contour-subtle">
        <h3 className="text-base font-bold text-ink-primary">Completed Shoot Settlements</h3>
        {completedBookings.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-[#E7EAEE] rounded-2xl bg-[#F5F7F9]/40 space-y-2">
            <DollarSign className="w-10 h-10 text-[#14B8A6] mx-auto opacity-60" />
            <h4 className="text-sm font-bold text-[#191C22]">No completed earnings settlements yet</h4>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              As you accept booking assignments and complete sessions with clients, detailed financial statements and weekly payouts will be recorded here.
            </p>
            <div className="pt-2">
              <Link href="/photographer/services">
                <Button variant="primary" size="sm">
                  Review Photography Packages
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-contour-subtle">
            {completedBookings.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-ink-primary">{b.event_title}</p>
                  <p className="text-[11px] text-ink-muted">{b.event_date} • {b.customer?.full_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#14B8A6]">
                    +₹{Math.round((Number(b.agreed_service_price) || 0) * 0.8).toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold">Settled</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
