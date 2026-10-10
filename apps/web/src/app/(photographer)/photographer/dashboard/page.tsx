'use client';

import React, { useState } from 'react';
import { 
  KeyRound, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  UploadCloud, 
  AlertCircle 
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';

export default function PhotographerDashboardPage() {
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp !== '482910') {
      alert('Invalid OTP. Please ask client for the 6-digit code shown on their booking card.');
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setOtpVerified(true);
    }, 600);
  };

  return (
    <div className="space-y-8">
      {/* Title & Earning Scorecards */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
          Creator Studio Dashboard
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Manage venue appointments, verify client OTPs, and deliver finished high-resolution galleries.
        </p>
      </div>

      {/* STATS METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="space-y-1">
          <p className="text-xs uppercase font-bold text-ink-muted">In Escrow (Secured)</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-brand">₹6,000</p>
          <p className="text-[11px] text-ink-muted">Pending today&apos;s photo delivery</p>
        </Card>

        <Card className="space-y-1">
          <p className="text-xs uppercase font-bold text-ink-muted">Available for Payout</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-green-600">₹42,800</p>
          <p className="text-[11px] text-green-700 font-medium">Ready for instant UPI bank settlement</p>
        </Card>

        <Card className="space-y-1">
          <p className="text-xs uppercase font-bold text-ink-muted">Completed Shoots</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-ink-primary">148</p>
          <p className="text-[11px] text-ink-muted">All-time 4.96 ★ rating average</p>
        </Card>
      </div>

      {/* ACTIVE VENUE JOB (REQUIRING SHOOT-START OTP VERIFICATION) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
            Current Appointment (At Venue)
          </h2>
          <Badge variant="brand" size="sm">
            Status: Arrived at Venue
          </Badge>
        </div>

        <Card className="border-brand/40 bg-white p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Shoot Overview */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-ink-muted">
                <span>Ref: SNP-2026-98124</span>
                <span>•</span>
                <span>Client: Aarav Sharma</span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-ink-primary">
                  Portrait & Headshot Session (2.5 Hours)
                </h3>
                <p className="text-sm text-ink-secondary flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-brand shrink-0" />
                  <span>Lodhi Art District, Block 14, New Delhi</span>
                </p>
              </div>

              <div className="p-3 rounded-card-sm bg-canvas-secondary border border-contour-subtle text-xs text-ink-secondary space-y-1">
                <p><strong>Package Deliverable:</strong> 35 Edited High-Res Photos + RAW files</p>
                <p><strong>Guaranteed Net Payout (80%):</strong> ₹6,000</p>
              </div>
            </div>

            {/* OTP VERIFICATION KEYPAD */}
            <div className="lg:col-span-5 bg-canvas-primary p-6 rounded-card-md border border-contour-strong text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-primary">
                <KeyRound className="w-4 h-4 text-brand" />
                <span>Verify Client&apos;s Shoot-Start OTP</span>
              </div>

              {otpVerified ? (
                <div className="p-4 bg-green-50 rounded-card-sm border border-green-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
                  <p className="text-sm font-bold text-green-800">Shoot Officially In Progress!</p>
                  <p className="text-xs text-green-700">Timer started. Capture great photos.</p>
                </div>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <p className="text-xs text-ink-secondary">
                    Ask client for their 6-digit code to start the shoot:
                  </p>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-2xl font-mono font-bold tracking-widest bg-white border border-contour-strong rounded-card-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand text-ink-primary"
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    size="md"
                    isLoading={isVerifying}
                  >
                    Confirm Arrival & Start Shoot
                  </Button>
                </form>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* PENDING MEDIA DELIVERIES */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
          Pending High-Res Media Deliveries
        </h2>

        <Card className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Badge variant="warning" size="sm">
              Awaiting Media Upload
            </Badge>
            <h3 className="text-base font-bold text-ink-primary">
              Cafe Culinary Shoot with Blue Tokai Coffee
            </h3>
            <p className="text-xs text-ink-muted">Completed Yesterday • Due within 24 hours</p>
          </div>

          <Button variant="secondary" size="sm" leftIcon={<UploadCloud className="w-4 h-4" />}>
            Upload Finished Photos (S3 / R2)
          </Button>
        </Card>
      </div>
    </div>
  );
}
