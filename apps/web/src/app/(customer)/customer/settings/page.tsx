'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Phone,
  Mail,
  Bell,
  Shield,
  CheckCircle2,
  Lock,
  Save,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { CustomerNoticeBanner } from '../../../../components/customer/CustomerNoticeBanner';
import { INITIAL_CUSTOMER_PROFILE } from '../../../../data/customerDashboardData';

export default function CustomerSettingsPage() {
  const [profile, setProfile] = useState({
    name: INITIAL_CUSTOMER_PROFILE.name,
    email: INITIAL_CUSTOMER_PROFILE.email,
    phone: INITIAL_CUSTOMER_PROFILE.phone,
    city: INITIAL_CUSTOMER_PROFILE.city,
    preferredContact: 'WhatsApp',
  });

  const [notifications, setNotifications] = useState({
    smsMilestones: true,
    whatsappTransit: true,
    emailReceipts: true,
    promotions: false,
  });

  const [privacy, setPrivacy] = useState({
    maskPhoneUntilConfirmed: true,
    privateGalleries: true,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <CustomerNoticeBanner moduleName="Client Profile & Settings" />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#1A1816] tracking-tight">
          Account Profile & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-[#665E55] mt-1">
          Manage your contact details, SMS & WhatsApp alert channels, and privacy safeguards.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-green-50 border border-green-200 rounded-2xl text-xs font-bold text-green-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>Profile preferences updated successfully! (Frontend Demonstration State)</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. PERSONAL INFORMATION */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#EBE4DA] space-y-5 shadow-subtle">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#F0EAE1]">
            <User className="w-5 h-5 text-[#FF6E00]" />
            <h2 className="text-base font-bold text-[#1A1816]">Personal & Contact Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-[#1A1816]">Full Name *</label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-white border border-[#D5CEC4] rounded-xl p-2.5 text-xs text-[#1A1816] focus:ring-2 focus:ring-[#FF6E00] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-[#1A1816]">Phone Number (For Shoot OTP) *</label>
              <input
                type="text"
                required
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-white border border-[#D5CEC4] rounded-xl p-2.5 text-xs text-[#1A1816] focus:ring-2 focus:ring-[#FF6E00] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-[#1A1816]">Email Address *</label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-white border border-[#D5CEC4] rounded-xl p-2.5 text-xs text-[#1A1816] focus:ring-2 focus:ring-[#FF6E00] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-[#1A1816]">Primary City / Hub *</label>
              <input
                type="text"
                required
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full bg-white border border-[#D5CEC4] rounded-xl p-2.5 text-xs text-[#1A1816] focus:ring-2 focus:ring-[#FF6E00] outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. NOTIFICATIONS & ALERTS */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#EBE4DA] space-y-4 shadow-subtle">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#F0EAE1]">
            <Bell className="w-5 h-5 text-[#FF6E00]" />
            <h2 className="text-base font-bold text-[#1A1816]">Notification Dispatch Channels</h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.smsMilestones}
                onChange={(e) => setNotifications({ ...notifications, smsMilestones: e.target.checked })}
                className="w-4 h-4 text-[#FF6E00] rounded focus:ring-[#FF6E00] border-[#D5CEC4] mt-0.5"
              />
              <div>
                <p className="font-bold text-[#1A1816]">Urgent SMS Shoot Milestones</p>
                <p className="text-[#665E55]">Receive photographer en-route notices and the 6-digit Shoot-Start OTP via SMS.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.whatsappTransit}
                onChange={(e) => setNotifications({ ...notifications, whatsappTransit: e.target.checked })}
                className="w-4 h-4 text-[#FF6E00] rounded focus:ring-[#FF6E00] border-[#D5CEC4] mt-0.5"
              />
              <div>
                <p className="font-bold text-[#1A1816]">WhatsApp Venue Pin & Live Coordination</p>
                <p className="text-[#665E55]">Receive direct photographer contact cards and location pins on WhatsApp.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.emailReceipts}
                onChange={(e) => setNotifications({ ...notifications, emailReceipts: e.target.checked })}
                className="w-4 h-4 text-[#FF6E00] rounded focus:ring-[#FF6E00] border-[#D5CEC4] mt-0.5"
              />
              <div>
                <p className="font-bold text-[#1A1816]">Email Invoices & Photo Proof Downloads</p>
                <p className="text-[#665E55]">Receive GST tax invoices and private cloud links for photo deliveries.</p>
              </div>
            </label>
          </div>
        </div>

        {/* 3. PRIVACY & SECURITY */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#EBE4DA] space-y-4 shadow-subtle">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#F0EAE1]">
            <Shield className="w-5 h-5 text-[#FF6E00]" />
            <h2 className="text-base font-bold text-[#1A1816]">Privacy & Client Safety</h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacy.maskPhoneUntilConfirmed}
                onChange={(e) => setPrivacy({ ...privacy, maskPhoneUntilConfirmed: e.target.checked })}
                className="w-4 h-4 text-[#FF6E00] rounded focus:ring-[#FF6E00] border-[#D5CEC4] mt-0.5"
              />
              <div>
                <p className="font-bold text-[#1A1816]">Mask Personal Phone Number</p>
                <p className="text-[#665E55]">Keep phone numbers hidden from photographers until you confirm the shoot.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacy.privateGalleries}
                onChange={(e) => setPrivacy({ ...privacy, privateGalleries: e.target.checked })}
                className="w-4 h-4 text-[#FF6E00] rounded focus:ring-[#FF6E00] border-[#D5CEC4] mt-0.5"
              />
              <div>
                <p className="font-bold text-[#1A1816]">Strictly Private Photo Deliveries</p>
                <p className="text-[#665E55]">Delivered media files are non-public and accessible only to your account credentials.</p>
              </div>
            </label>
          </div>
        </div>

        {/* 4. SUPPORT & POLICIES */}
        <div className="p-6 bg-[#FAF7F2] rounded-3xl border border-[#E0D8CD] space-y-3 text-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1A1816]">
            <HelpCircle className="w-4 h-4 text-[#FF6E00]" />
            <span>Need Assistance with a Booking?</span>
          </div>
          <p className="text-[#665E55]">
            SnapShoot offers dedicated 24/7 concierge support for client disputes, weather cancellations, and photographer inquiries.
          </p>
          <div className="flex flex-wrap gap-4 pt-1">
            <Link href="/how-it-works" className="font-bold text-[#1A1816] hover:text-[#FF6E00] flex items-center gap-1">
              <span>How SnapShoot Works</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <Link href="/cancellation" className="font-bold text-[#1A1816] hover:text-[#FF6E00] flex items-center gap-1">
              <span>Cancellation & Escrow Policy</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#FF6E00] hover:bg-[#E86300] active:scale-95 shadow-sm transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
