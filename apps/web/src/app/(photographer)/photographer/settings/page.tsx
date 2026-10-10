'use client';

import React, { useState } from 'react';
import {
  Settings,
  User,
  Bell,
  Shield,
  Clock,
  CheckCircle2,
  Lock,
  Save,
  Smartphone,
  Eye,
  KeyRound
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { DemoNoticeBanner } from '../../../../components/photographer/DemoNoticeBanner';
import { INITIAL_PHOTOGRAPHER_PROFILE } from '../../../../data/photographerDashboardData';

export default function PhotographerSettingsPage() {
  const [profile, setProfile] = useState({
    name: INITIAL_PHOTOGRAPHER_PROFILE.name,
    tagline: 'Editorial & Portrait Specialist in Delhi NCR',
    bio: INITIAL_PHOTOGRAPHER_PROFILE.bio,
    phone: INITIAL_PHOTOGRAPHER_PROFILE.phone,
    email: INITIAL_PHOTOGRAPHER_PROFILE.email,
    city: INITIAL_PHOTOGRAPHER_PROFILE.city,
    serviceArea: INITIAL_PHOTOGRAPHER_PROFILE.serviceArea.join(', '),
  });

  const [notifications, setNotifications] = useState({
    smsImmediateAlerts: true,
    whatsappBookings: true,
    emailReceipts: true,
    payoutConfirmations: true,
    marketingUpdates: false,
  });

  const [privacy, setPrivacy] = useState({
    showInPublicDirectory: true,
    maskPhoneUntilAccepted: true,
    autoWatermarkGalleries: true,
  });

  const [availabilityRules, setAvailabilityRules] = useState({
    minAdvanceNoticeHours: 12,
    maxDailyShoots: 3,
    bufferMinutesBetweenShoots: 60,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <DemoNoticeBanner moduleName="Studio Settings & Creator Preferences" />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
          Studio Preferences & Settings
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Configure notification dispatch, marketplace visibility, contact details, and client privacy rules.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-card-sm text-xs font-bold text-green-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>Preferences updated successfully! (Frontend Demonstration State)</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* SECTION 1: PROFILE DETAILS */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-contour-subtle pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <User className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-bold text-ink-primary">Public Profile Preferences</h2>
            </div>
            <Badge variant="brand" size="sm">Live on Profile</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Display Name *</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Professional Tagline</label>
              <input
                type="text"
                value={profile.tagline}
                onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">About / Bio</label>
              <textarea
                rows={3}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Registered Phone (SMS & Radar) *</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Email Address *</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Service Coverage Areas *</label>
              <input
                type="text"
                value={profile.serviceArea}
                onChange={(e) => setProfile({ ...profile, serviceArea: e.target.value })}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
              />
            </div>
          </div>
        </Card>

        {/* SECTION 2: NOTIFICATIONS */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-contour-subtle pb-4 flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-bold text-ink-primary">Notification Dispatch Preferences</h2>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.smsImmediateAlerts}
                onChange={(e) =>
                  setNotifications({ ...notifications, smsImmediateAlerts: e.target.checked })
                }
                className="w-4 h-4 text-brand rounded focus:ring-brand border-contour-strong mt-0.5"
              />
              <div>
                <p className="font-bold text-ink-primary">Instant SMS Alerts for New Bookings</p>
                <p className="text-ink-secondary">Receive urgent SMS dispatch alerts with shoot venue details.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.whatsappBookings}
                onChange={(e) =>
                  setNotifications({ ...notifications, whatsappBookings: e.target.checked })
                }
                className="w-4 h-4 text-brand rounded focus:ring-brand border-contour-strong mt-0.5"
              />
              <div>
                <p className="font-bold text-ink-primary">WhatsApp Booking Alerts</p>
                <p className="text-ink-secondary">Receive booking requests, client reminders, and venue pin drops on WhatsApp.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.payoutConfirmations}
                onChange={(e) =>
                  setNotifications({ ...notifications, payoutConfirmations: e.target.checked })
                }
                className="w-4 h-4 text-brand rounded focus:ring-brand border-contour-strong mt-0.5"
              />
              <div>
                <p className="font-bold text-ink-primary">Instant Payout & UPI Settlement Notifications</p>
                <p className="text-ink-secondary">Receive real-time notifications whenever escrow releases funds to your UPI VPA.</p>
              </div>
            </label>
          </div>
        </Card>

        {/* SECTION 3: PRIVACY & CLIENT VISIBILITY */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-contour-subtle pb-4 flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-bold text-ink-primary">Privacy & Marketplace Protection</h2>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacy.showInPublicDirectory}
                onChange={(e) =>
                  setPrivacy({ ...privacy, showInPublicDirectory: e.target.checked })
                }
                className="w-4 h-4 text-brand rounded focus:ring-brand border-contour-strong mt-0.5"
              />
              <div>
                <p className="font-bold text-ink-primary">Public Directory Listing</p>
                <p className="text-ink-secondary">Allow clients to discover your profile on the /explore discovery catalog.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacy.maskPhoneUntilAccepted}
                onChange={(e) =>
                  setPrivacy({ ...privacy, maskPhoneUntilAccepted: e.target.checked })
                }
                className="w-4 h-4 text-brand rounded focus:ring-brand border-contour-strong mt-0.5"
              />
              <div>
                <p className="font-bold text-ink-primary">Phone Number Privacy Masking</p>
                <p className="text-ink-secondary">Keep your personal mobile number hidden from clients until you explicitly accept their booking request.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacy.autoWatermarkGalleries}
                onChange={(e) =>
                  setPrivacy({ ...privacy, autoWatermarkGalleries: e.target.checked })
                }
                className="w-4 h-4 text-brand rounded focus:ring-brand border-contour-strong mt-0.5"
              />
              <div>
                <p className="font-bold text-ink-primary">Automatic Proofing Watermark</p>
                <p className="text-ink-secondary">Apply subtle SnapShoot watermarking to preview proofs until final client escrow approval.</p>
              </div>
            </label>
          </div>
        </Card>

        {/* SECTION 4: ACCOUNT SECURITY DETAILS */}
        <Card className="p-6 sm:p-8 space-y-4 bg-canvas-primary border border-contour-subtle">
          <div className="flex items-center justify-between border-b border-contour-subtle pb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-ink-muted" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-primary">
                Account Security & Credentials
              </h3>
            </div>
            <Badge variant="neutral" size="sm">Role: Creator</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-ink-muted">Account ID</span>
              <p className="font-mono font-bold text-ink-primary">USR-CREATOR-9812</p>
            </div>
            <div>
              <span className="text-ink-muted">Aadhaar KYC Verification</span>
              <p className="font-bold text-green-700">Audit in Progress</p>
            </div>
            <div>
              <span className="text-ink-muted">Registered Since</span>
              <p className="font-bold text-ink-primary">March 2026</p>
            </div>
          </div>
        </Card>

        {/* BOTTOM SAVE BUTTON */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-contour-subtle">
          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Studio Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
