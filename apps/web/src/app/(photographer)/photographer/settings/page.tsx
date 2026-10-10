'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  KeyRound,
  ExternalLink,
  MapPin,
  Camera,
  Package,
  Layers,
  Radio,
  Trash2,
  Plus,
  AlertTriangle,
  AlertCircle,
  X,
  CreditCard,
  DollarSign,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { DemoNoticeBanner } from '../../../../components/photographer/DemoNoticeBanner';
import {
  getPhotographerPreferences,
  savePhotographerPreferences,
  PhotographerPreferences
} from '../../../../lib/settingsService';
import {
  getStoredSubscription,
  getPlanDetails
} from '../../../../lib/subscriptionService';
import { useAuth } from '../../../../lib/auth';

type PhotographerTab =
  | 'profile'
  | 'subscription'
  | 'gear'
  | 'location'
  | 'booking'
  | 'payouts'
  | 'verification'
  | 'security';

export default function PhotographerSettingsPage() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<PhotographerTab>('profile');
  const [prefs, setPrefs] = useState<PhotographerPreferences>(getPhotographerPreferences);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // New Equipment Item State
  const [newGearItem, setNewGearItem] = useState('');
  const [gearType, setGearType] = useState<'cameras' | 'lenses' | 'lighting' | 'accessories'>('cameras');

  // Danger Zone Modal
  const [isCloseStudioModalOpen, setIsCloseStudioModalOpen] = useState(false);
  const [confirmStudioText, setConfirmStudioText] = useState('');

  // Subscription SaaS State
  const [currentSubscription, setCurrentSubscription] = useState(getStoredSubscription);

  useEffect(() => {
    setPrefs(getPhotographerPreferences());
    setCurrentSubscription(getStoredSubscription());
    const handleSubSync = () => setCurrentSubscription(getStoredSubscription());
    window.addEventListener('snapshoot:subscription-change', handleSubSync);
    return () => window.removeEventListener('snapshoot:subscription-change', handleSubSync);
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    savePhotographerPreferences(prefs);
    setIsDirty(false);
    setSaveSuccess(true);
    setStatusMessage('Studio preferences saved successfully.');
    setTimeout(() => {
      setSaveSuccess(false);
      setStatusMessage('');
    }, 4000);
  };

  const handleReset = () => {
    setPrefs(getPhotographerPreferences());
    setIsDirty(false);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!currentPassword) {
      setPasswordError('Please provide your current creator studio password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters with at least one number and special symbol.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordSuccess(true);
    setTimeout(() => {
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(false);
      setStatusMessage('Creator studio password updated successfully.');
      setTimeout(() => setStatusMessage(''), 4000);
    }, 1200);
  };

  const handleAddGear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGearItem.trim()) return;

    const currentList = prefs.profile.equipment[gearType] || [];
    const updated = {
      ...prefs,
      profile: {
        ...prefs.profile,
        equipment: {
          ...prefs.profile.equipment,
          [gearType]: [...currentList, newGearItem.trim()],
        },
      },
    };
    setPrefs(updated);
    savePhotographerPreferences(updated);
    setNewGearItem('');
    setStatusMessage(`Added gear item to ${gearType}.`);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleRemoveGear = (category: 'cameras' | 'lenses' | 'lighting' | 'accessories', item: string) => {
    const updated = {
      ...prefs,
      profile: {
        ...prefs.profile,
        equipment: {
          ...prefs.profile.equipment,
          [category]: prefs.profile.equipment[category].filter((i) => i !== item),
        },
      },
    };
    setPrefs(updated);
    savePhotographerPreferences(updated);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <DemoNoticeBanner moduleName="Creator Studio & Business Settings" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-contour-subtle">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-brand-subtle text-brand text-xs font-bold mb-2">
            <Camera className="w-3.5 h-3.5" />
            <span>Studio Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary tracking-tight">
            Studio Preferences & Settings
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1">
            Configure your professional public presence, gear inventory, travel coverage, booking rules, and payouts.
          </p>
        </div>

        {/* Global Save/Discard Actions */}
        {isDirty && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
              Discard
            </Button>
            <Button variant="primary" size="sm" onClick={() => handleSave()} leftIcon={<Save className="w-3.5 h-3.5" />}>
              Save Studio Settings
            </Button>
          </div>
        )}
      </div>

      {/* Status Alert Banner */}
      {(saveSuccess || statusMessage) && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-card-md text-xs font-bold text-green-800 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{statusMessage || 'Preferences updated successfully!'}</span>
          </div>
          <button onClick={() => setStatusMessage('')} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-canvas-secondary rounded-card-md border border-contour-subtle scrollbar-none">
        {[
          { id: 'profile' as PhotographerTab, label: 'Profile & Bio', icon: User },
          { id: 'subscription' as PhotographerTab, label: 'SaaS Plan & Billing', icon: CreditCard },
          { id: 'gear' as PhotographerTab, label: 'Specialties & Gear', icon: Camera },
          { id: 'location' as PhotographerTab, label: 'Coverage & Travel', icon: MapPin },
          { id: 'booking' as PhotographerTab, label: 'Booking Rules & Radar', icon: Clock },
          { id: 'payouts' as PhotographerTab, label: 'Payouts & UPI', icon: DollarSign },
          { id: 'verification' as PhotographerTab, label: 'KYC & Verification', icon: ShieldCheck },
          { id: 'security' as PhotographerTab, label: 'Security & Privacy', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-card-sm text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-white text-ink-primary shadow-sm border border-contour-subtle text-brand'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand' : 'text-ink-muted'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PROFILE & BIO */}
      {/* ========================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-contour-subtle pb-4">
              <div className="flex items-center gap-4">
                <img
                  src={prefs.profile.avatar}
                  alt={prefs.profile.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-brand/30 shadow-sm"
                />
                <div>
                  <h2 className="text-xl font-bold text-ink-primary">{prefs.profile.name}</h2>
                  <p className="text-xs text-ink-secondary">{prefs.profile.handle} • {prefs.profile.city}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="brand" size="sm">{prefs.profile.experienceYears} Years Exp</Badge>
                    <span className="text-xs font-bold text-ink-primary">★ {prefs.profile.rating}</span>
                  </div>
                </div>
              </div>

              <Link
                href="/photographers/pro-aman"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-brand bg-brand-subtle hover:bg-brand/20 transition-colors border border-brand-border"
              >
                <span>View Public Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-ink-primary">Studio Display Name *</label>
                  <input
                    type="text"
                    required
                    value={prefs.profile.name}
                    onChange={(e) => {
                      setPrefs({ ...prefs, profile: { ...prefs.profile, name: e.target.value } });
                      setIsDirty(true);
                    }}
                    className="w-full bg-white border border-contour-strong rounded-card-sm p-3 text-xs font-semibold focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-ink-primary">Username Handle *</label>
                  <input
                    type="text"
                    required
                    value={prefs.profile.handle}
                    onChange={(e) => {
                      setPrefs({ ...prefs, profile: { ...prefs.profile, handle: e.target.value } });
                      setIsDirty(true);
                    }}
                    className="w-full bg-white border border-contour-strong rounded-card-sm p-3 text-xs font-semibold focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase text-ink-primary">Professional Tagline *</label>
                  <input
                    type="text"
                    required
                    value={prefs.profile.tagline}
                    onChange={(e) => {
                      setPrefs({ ...prefs, profile: { ...prefs.profile, tagline: e.target.value } });
                      setIsDirty(true);
                    }}
                    className="w-full bg-white border border-contour-strong rounded-card-sm p-3 text-xs font-semibold focus:ring-2 focus:ring-brand outline-none"
                  />
                  <p className="text-[11px] text-ink-muted">Shown directly beneath your name on discovery cards and hero banners.</p>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase text-ink-primary">Biography & Artistic Background *</label>
                  <textarea
                    rows={4}
                    required
                    value={prefs.profile.bio}
                    onChange={(e) => {
                      setPrefs({ ...prefs, profile: { ...prefs.profile, bio: e.target.value } });
                      setIsDirty(true);
                    }}
                    className="w-full bg-white border border-contour-strong rounded-card-sm p-3 text-xs font-medium focus:ring-2 focus:ring-brand outline-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-ink-primary">Years of Professional Experience</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={prefs.profile.experienceYears}
                    onChange={(e) => {
                      setPrefs({
                        ...prefs,
                        profile: { ...prefs.profile, experienceYears: Number(e.target.value) },
                      });
                      setIsDirty(true);
                    }}
                    className="w-full bg-white border border-contour-strong rounded-card-sm p-3 text-xs font-semibold focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-ink-primary">Spoken Languages</label>
                  <input
                    type="text"
                    value={prefs.profile.languages.join(', ')}
                    onChange={(e) => {
                      setPrefs({
                        ...prefs,
                        profile: {
                          ...prefs.profile,
                          languages: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        },
                      });
                      setIsDirty(true);
                    }}
                    className="w-full bg-white border border-contour-strong rounded-card-sm p-3 text-xs font-semibold focus:ring-2 focus:ring-brand outline-none"
                  />
                  <p className="text-[11px] text-ink-muted">Comma-separated, e.g. English, Hindi, Punjabi</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-contour-subtle">
                <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
                  Save Profile Details
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: SAAS PLAN & BILLING */}
      {/* ========================================================= */}
      {activeTab === 'subscription' && (() => {
        const plan = getPlanDetails(currentSubscription.tier);
        return (
          <div className="space-y-6">
            <Card className="p-6 sm:p-8 space-y-6">
              <div className="border-b border-contour-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-brand/10 text-brand">
                      SaaS Business Tier
                    </span>
                    <Badge variant={currentSubscription.status === 'ACTIVE' ? 'brand' : 'neutral'} size="sm">
                      {currentSubscription.status}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-extrabold text-ink-primary">
                    Current Plan: {plan.name}
                  </h3>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Your studio is currently subscribed to the {plan.name} tier billed {currentSubscription.billingInterval.toLowerCase()}.
                  </p>
                </div>

                <Link
                  href="/photographer/subscription"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-card-sm bg-brand text-white font-bold text-xs shadow-sm hover:bg-brand-dark transition-all shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Manage or Upgrade Plan</span>
                </Link>
              </div>

              {/* Plan Pricing & Billing Cycle Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-card-md bg-canvas-primary border border-contour-subtle">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Recurring Billing</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-ink-primary">
                      ₹{currentSubscription.billingInterval === 'ANNUAL' ? (plan.priceAnnualInr / 12).toFixed(0) : plan.priceMonthlyInr}
                    </span>
                    <span className="text-xs text-ink-muted font-medium">/ month</span>
                  </div>
                  <p className="text-[11px] text-ink-secondary mt-1">
                    Billed {currentSubscription.billingInterval.toLowerCase()}
                  </p>
                </div>

                <div className="p-4 rounded-card-md bg-canvas-primary border border-contour-subtle">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Next Renewal Date</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-bold text-ink-primary">
                      {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">
                    Auto-renewal active
                  </p>
                </div>

                <div className="p-4 rounded-card-md bg-canvas-primary border border-contour-subtle">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Platform Take-Rate</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-brand">
                      {currentSubscription.tier === 'BUSINESS' ? 15 : currentSubscription.tier === 'PRO' ? 20 : 25}%
                    </span>
                    <span className="text-xs text-ink-muted font-medium">Commission</span>
                  </div>
                  <p className="text-[11px] text-ink-secondary mt-1">
                    Keep {100 - (currentSubscription.tier === 'BUSINESS' ? 15 : currentSubscription.tier === 'PRO' ? 20 : 25)}% of gross booking payouts
                  </p>
                </div>
              </div>

              {/* Included Entitlements */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink-primary mb-3">
                  Tier Entitlements & Features
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-card-sm border border-contour-subtle bg-white flex items-center justify-between">
                    <span className="text-ink-secondary">Max Active Packages</span>
                    <span className="font-bold text-ink-primary">
                      {plan.maxServicePackages === -1 ? 'Unlimited' : `${plan.maxServicePackages} Packages`}
                    </span>
                  </div>
                  <div className="p-3 rounded-card-sm border border-contour-subtle bg-white flex items-center justify-between">
                    <span className="text-ink-secondary">Portfolio Photos Limit</span>
                    <span className="font-bold text-ink-primary">
                      {plan.maxPortfolioItems === -1 ? 'Unlimited' : `${plan.maxPortfolioItems} Photos`}
                    </span>
                  </div>
                  <div className="p-3 rounded-card-sm border border-contour-subtle bg-white flex items-center justify-between">
                    <span className="text-ink-secondary">Client CRM Directory</span>
                    <span className="font-bold text-emerald-600">
                      {plan.hasClientCrm ? 'Included' : 'Not Included'}
                    </span>
                  </div>
                  <div className="p-3 rounded-card-sm border border-contour-subtle bg-white flex items-center justify-between">
                    <span className="text-ink-secondary">Custom Gallery Branding</span>
                    <span className="font-bold text-emerald-600">
                      {plan.hasCustomGalleryBranding ? 'Enabled' : 'Standard'}
                    </span>
                  </div>
                  <div className="p-3 rounded-card-sm border border-contour-subtle bg-white flex items-center justify-between">
                    <span className="text-ink-secondary">Discovery Boost</span>
                    <span className="font-bold text-brand">
                      {plan.hasPriorityListing ? 'Priority Placement' : 'Standard Listing'}
                    </span>
                  </div>
                  <div className="p-3 rounded-card-sm border border-contour-subtle bg-white flex items-center justify-between">
                    <span className="text-ink-secondary">Advanced Analytics</span>
                    <span className="font-bold text-ink-primary">
                      {plan.hasAdvancedAnalytics ? 'Included' : 'Basic'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Invoices History */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink-primary mb-3">
                  Recent SaaS Billing Receipts
                </h4>
                <div className="border border-contour-subtle rounded-card-sm overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-canvas-primary text-[11px] font-bold text-ink-muted uppercase border-b border-contour-subtle">
                      <tr>
                        <th className="py-2.5 px-4">Invoice ID</th>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Plan Description</th>
                        <th className="py-2.5 px-4">Amount</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-contour-subtle">
                      <tr>
                        <td className="py-3 px-4 font-mono font-bold text-ink-primary">INV-2026-009</td>
                        <td className="py-3 px-4 text-ink-secondary">01 Oct 2026</td>
                        <td className="py-3 px-4 text-ink-primary font-medium">{plan.name} - Monthly Plan</td>
                        <td className="py-3 px-4 font-bold text-ink-primary">₹{plan.priceMonthlyInr.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            PAID
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono font-bold text-ink-primary">INV-2026-008</td>
                        <td className="py-3 px-4 text-ink-secondary">01 Sep 2026</td>
                        <td className="py-3 px-4 text-ink-primary font-medium">{plan.name} - Monthly Plan</td>
                        <td className="py-3 px-4 font-bold text-ink-primary">₹{plan.priceMonthlyInr.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            PAID
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* TAB 2: GEAR & SPECIALTIES */}
      {/* ========================================================= */}
      {activeTab === 'gear' && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="border-b border-contour-subtle pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-primary">
                  Professional Equipment Inventory
                </h3>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Listing high-end camera bodies and lighting increases client booking confidence by up to 40%.
                </p>
              </div>
            </div>

            {/* Add Gear Form */}
            <form onSubmit={handleAddGear} className="p-4 bg-canvas-secondary rounded-card-md border border-contour-subtle flex flex-col sm:flex-row items-center gap-3">
              <select
                value={gearType}
                onChange={(e) => setGearType(e.target.value as any)}
                className="w-full sm:w-44 bg-white border border-contour-strong rounded-card-sm p-2.5 text-xs font-bold text-ink-primary"
              >
                <option value="cameras">Camera Body</option>
                <option value="lenses">Lens</option>
                <option value="lighting">Lighting Kit</option>
                <option value="accessories">Accessories / Audio</option>
              </select>

              <input
                type="text"
                placeholder="e.g. Sony A7 IV, Sony FE 85mm f/1.4 GM, Godox AD200"
                value={newGearItem}
                onChange={(e) => setNewGearItem(e.target.value)}
                className="w-full flex-1 bg-white border border-contour-strong rounded-card-sm p-2.5 text-xs font-medium focus:ring-2 focus:ring-brand outline-none"
              />

              <Button type="submit" variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Item
              </Button>
            </form>

            {/* Gear Display Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              {(['cameras', 'lenses', 'lighting', 'accessories'] as const).map((cat) => (
                <div key={cat} className="p-4 rounded-card-md border border-contour-subtle bg-white space-y-2">
                  <div className="flex items-center justify-between border-b border-contour-subtle pb-2">
                    <span className="font-extrabold uppercase text-ink-primary">{cat}</span>
                    <span className="text-[10px] font-bold text-brand bg-brand-subtle px-2 py-0.5 rounded-full">
                      {prefs.profile.equipment[cat]?.length || 0} Listed
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {prefs.profile.equipment[cat]?.map((item) => (
                      <div key={item} className="flex items-center justify-between p-2 rounded-card-sm bg-canvas-secondary text-ink-primary">
                        <span className="font-medium">{item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGear(cat, item)}
                          className="text-ink-muted hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: COVERAGE & TRAVEL */}
      {/* ========================================================= */}
      {activeTab === 'location' && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="border-b border-contour-subtle pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-primary">
                Service Radius & City Coverage
              </h3>
              <p className="text-xs text-ink-secondary mt-0.5">
                Set the geographic boundaries for instant shoots and scheduled travel jobs.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-ink-primary">Base Operating Metro *</label>
                  <select
                    value={prefs.profile.city}
                    onChange={(e) => {
                      setPrefs({ ...prefs, profile: { ...prefs.profile, city: e.target.value } });
                      setIsDirty(true);
                    }}
                    className="w-full bg-white border border-contour-strong rounded-card-sm p-3 text-xs font-semibold focus:ring-2 focus:ring-brand outline-none"
                  >
                    <option value="New Delhi">New Delhi (Delhi NCR)</option>
                    <option value="Gurugram">Gurugram</option>
                    <option value="Noida">Noida / Greater Noida</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bengaluru">Bengaluru</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-ink-primary">Travel Radius (Kilometers)</label>
                  <select
                    value={prefs.profile.travelRadiusKm}
                    onChange={(e) => {
                      setPrefs({
                        ...prefs,
                        profile: { ...prefs.profile, travelRadiusKm: Number(e.target.value) },
                      });
                      setIsDirty(true);
                    }}
                    className="w-full bg-white border border-contour-strong rounded-card-sm p-3 text-xs font-semibold focus:ring-2 focus:ring-brand outline-none"
                  >
                    <option value={15}>Within 15 km (Local shoots only)</option>
                    <option value={25}>Within 25 km (Standard NCR coverage)</option>
                    <option value={50}>Within 50 km (Greater NCR & Airports)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase text-ink-primary">Covered Zones & Neighborhoods *</label>
                  <input
                    type="text"
                    value={prefs.profile.serviceArea.join(', ')}
                    onChange={(e) => {
                      setPrefs({
                        ...prefs,
                        profile: {
                          ...prefs.profile,
                          serviceArea: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        },
                      });
                      setIsDirty(true);
                    }}
                    className="w-full bg-white border border-contour-strong rounded-card-sm p-3 text-xs font-semibold focus:ring-2 focus:ring-brand outline-none"
                  />
                  <p className="text-[11px] text-ink-muted">Comma-separated, e.g. South Delhi, Lodhi Art District, DLF Cyber City, Noida Sector 62</p>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-contour-subtle">
                <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
                  Save Coverage Settings
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: BOOKING RULES & RADAR */}
      {/* ========================================================= */}
      {activeTab === 'booking' && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="border-b border-contour-subtle pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-primary">
                Instant Radar & Booking Scheduling Rules
              </h3>
              <p className="text-xs text-ink-secondary mt-0.5">
                Control your availability calendar, buffer notice, and instant booking acceptance rules.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Radar Toggle */}
              <div className="p-4 rounded-card-md border border-contour-subtle bg-canvas-secondary flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-ink-primary flex items-center gap-2">
                    <Radio className="w-4 h-4 text-brand" />
                    <span>Instant Radar Availability</span>
                  </p>
                  <p className="text-ink-secondary mt-0.5">
                    Broadcasts your live availability to nearby clients searching for shoots today within 15 km.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !prefs.bookingRules.instantRadarEnabled;
                    setPrefs({
                      ...prefs,
                      bookingRules: { ...prefs.bookingRules, instantRadarEnabled: next },
                    });
                    setIsDirty(true);
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    prefs.bookingRules.instantRadarEnabled ? 'bg-green-600 justify-end' : 'bg-zinc-300 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {/* Vacation Mode Toggle */}
              <div className="p-4 rounded-card-md border border-contour-subtle bg-canvas-secondary flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-ink-primary">Vacation Mode (Pause Marketplace Bookings)</p>
                  <p className="text-ink-secondary mt-0.5">
                    Temporarily hides your packages from the public directory without deleting your profile or reviews.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !prefs.bookingRules.vacationMode;
                    setPrefs({
                      ...prefs,
                      bookingRules: { ...prefs.bookingRules, vacationMode: next },
                    });
                    setIsDirty(true);
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    prefs.bookingRules.vacationMode ? 'bg-amber-600 justify-end' : 'bg-zinc-300 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {/* Rules Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-ink-primary">Minimum Advance Notice</label>
                  <select
                    value={prefs.bookingRules.minAdvanceNoticeHours}
                    onChange={(e) => {
                      setPrefs({
                        ...prefs,
                        bookingRules: {
                          ...prefs.bookingRules,
                          minAdvanceNoticeHours: Number(e.target.value),
                        },
                      });
                      setIsDirty(true);
                    }}
                    className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand outline-none"
                  >
                    <option value={4}>4 Hours Notice</option>
                    <option value={12}>12 Hours Notice</option>
                    <option value={24}>24 Hours Notice</option>
                    <option value={48}>48 Hours Notice</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-ink-primary">Max Shoots Per Day</label>
                  <select
                    value={prefs.bookingRules.maxDailyShoots}
                    onChange={(e) => {
                      setPrefs({
                        ...prefs,
                        bookingRules: {
                          ...prefs.bookingRules,
                          maxDailyShoots: Number(e.target.value),
                        },
                      });
                      setIsDirty(true);
                    }}
                    className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand outline-none"
                  >
                    <option value={1}>1 Shoot / Day</option>
                    <option value={2}>2 Shoots / Day</option>
                    <option value={3}>3 Shoots / Day</option>
                    <option value={4}>4 Shoots / Day</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-ink-primary">Buffer Between Shoots</label>
                  <select
                    value={prefs.bookingRules.bufferMinutesBetweenShoots}
                    onChange={(e) => {
                      setPrefs({
                        ...prefs,
                        bookingRules: {
                          ...prefs.bookingRules,
                          bufferMinutesBetweenShoots: Number(e.target.value),
                        },
                      });
                      setIsDirty(true);
                    }}
                    className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand outline-none"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={60}>60 Minutes (Recommended)</option>
                    <option value={90}>90 Minutes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-contour-subtle">
              <Button type="button" variant="primary" size="md" onClick={() => handleSave()} leftIcon={<Save className="w-4 h-4" />}>
                Save Booking Rules
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: PAYOUTS & UPI */}
      {/* ========================================================= */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="border-b border-contour-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-primary">
                  Payout Accounts & Settlement Information
                </h3>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Earnings are automatically settled to your registered UPI Virtual Payment Address (VPA) upon client review release.
                </p>
              </div>
              <Link
                href="/photographer/payouts"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
              >
                <span>View Full Payouts Ledger →</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="p-5 rounded-card-md border border-contour-subtle bg-canvas-secondary space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold uppercase text-ink-primary">Registered UPI VPA</span>
                  <Badge variant="brand" size="sm">Primary</Badge>
                </div>
                <p className="font-mono text-sm font-bold text-ink-primary">{prefs.payoutDetails.upiIdMasked}</p>
                <p className="text-[11px] text-ink-muted">Instant settlements processed via NPCI UPI 2.0 network.</p>
              </div>

              <div className="p-5 rounded-card-md border border-contour-subtle bg-canvas-secondary space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold uppercase text-ink-primary">Backup Bank Account</span>
                  <Badge variant="neutral" size="sm">IMPS / NEFT</Badge>
                </div>
                <p className="font-mono text-sm font-bold text-ink-primary">{prefs.payoutDetails.bankAccountMasked}</p>
                <p className="text-[11px] text-ink-muted">{prefs.payoutDetails.bankName} • IFSC: {prefs.payoutDetails.ifscMasked}</p>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-card-md text-xs text-green-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
              <span>
                <strong>Take-Rate Policy:</strong> SnapShoot guarantees creator payouts of exactly 80% on every completed shoot. The platform fee is 20%, covering client acquisition, escrow guarantees, and cloud storage.
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: KYC & VERIFICATION */}
      {/* ========================================================= */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="border-b border-contour-subtle pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-primary">
                  Marketplace Identity & KYC Credentials
                </h3>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Platform trust verification requires valid government identity and gear verification.
                </p>
              </div>
              <Link href="/photographer/verification" className="text-xs font-bold text-brand hover:underline">
                Upload New Documents →
              </Link>
            </div>

            <div className="p-5 rounded-card-md bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <h4 className="font-bold">Identity Verification: Under Review (Admin Controlled)</h4>
              </div>
              <p className="leading-relaxed">
                Your submitted Aadhaar identity card and equipment invoice are currently undergoing manual review by our trust & safety desk. Creators cannot self-approve their verification badge.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-card-md bg-canvas-secondary border border-contour-subtle space-y-1">
                <span className="text-ink-muted">Aadhaar Card Status</span>
                <p className="font-bold text-amber-800">Submitted (Masked)</p>
              </div>
              <div className="p-4 rounded-card-md bg-canvas-secondary border border-contour-subtle space-y-1">
                <span className="text-ink-muted">Portfolio Quality Check</span>
                <p className="font-bold text-green-800">Approved (4K RAW)</p>
              </div>
              <div className="p-4 rounded-card-md bg-canvas-secondary border border-contour-subtle space-y-1">
                <span className="text-ink-muted">Background Check</span>
                <p className="font-bold text-green-800">Cleared</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: SECURITY & PRIVACY */}
      {/* ========================================================= */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-contour-subtle pb-4">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-primary">
                  Studio Password & Security Settings
                </h3>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Update credentials and manage studio security.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPasswordModalOpen(true)}
                leftIcon={<Lock className="w-3.5 h-3.5" />}
              >
                Change Studio Password
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.privacy.showInPublicDirectory}
                  onChange={(e) => {
                    setPrefs({
                      ...prefs,
                      privacy: { ...prefs.privacy, showInPublicDirectory: e.target.checked },
                    });
                    setIsDirty(true);
                  }}
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
                  checked={prefs.privacy.maskPhoneUntilAccepted}
                  onChange={(e) => {
                    setPrefs({
                      ...prefs,
                      privacy: { ...prefs.privacy, maskPhoneUntilAccepted: e.target.checked },
                    });
                    setIsDirty(true);
                  }}
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
                  checked={prefs.privacy.autoWatermarkGalleries}
                  onChange={(e) => {
                    setPrefs({
                      ...prefs,
                      privacy: { ...prefs.privacy, autoWatermarkGalleries: e.target.checked },
                    });
                    setIsDirty(true);
                  }}
                  className="w-4 h-4 text-brand rounded focus:ring-brand border-contour-strong mt-0.5"
                />
                <div>
                  <p className="font-bold text-ink-primary">Automatic Proofing Watermark</p>
                  <p className="text-ink-secondary">Apply subtle SnapShoot watermarking to preview proofs until final client escrow approval.</p>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-3 border-t border-contour-subtle">
              <Button type="button" variant="primary" size="md" onClick={() => handleSave()} leftIcon={<Save className="w-4 h-4" />}>
                Save Security Preferences
              </Button>
            </div>
          </Card>

          {/* DANGER ZONE: CLOSE STUDIO */}
          <div className="p-6 sm:p-8 bg-red-50/50 rounded-card-lg border border-red-200 space-y-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-extrabold">Danger Zone: Close Creator Studio</h3>
            </div>
            <p className="text-xs text-red-900 leading-relaxed">
              Permanently delist your studio from SnapShoot. You must fulfill any ongoing shoots before initiating closure.
            </p>
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCloseStudioModalOpen(true)}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Close Studio Account...
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: CHANGE PASSWORD */}
      {/* ========================================================= */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPasswordError('');
        }}
        title="Update Creator Studio Password"
        description="Choose a strong password with at least 8 characters."
      >
        <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-card-sm text-xs font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-card-sm text-xs font-bold text-green-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Password updated successfully!</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-ink-primary">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-xs text-ink-primary focus:ring-2 focus:ring-brand outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-ink-primary">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-xs text-ink-primary focus:ring-2 focus:ring-brand outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-ink-primary">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-xs text-ink-primary focus:ring-2 focus:ring-brand outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-contour-subtle">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: CLOSE STUDIO */}
      {/* ========================================================= */}
      <Modal
        isOpen={isCloseStudioModalOpen}
        onClose={() => {
          setIsCloseStudioModalOpen(false);
          setConfirmStudioText('');
        }}
        title="Confirm Studio Closure"
        description="Permanently delist your studio and remove public packages."
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-red-50 border border-red-200 rounded-card-sm text-xs text-red-900">
            <p className="font-bold">Are you sure you want to close your creator studio?</p>
            <p className="mt-1">All active packages will be removed from marketplace discovery.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink-primary">
              Type <span className="font-mono text-red-600 font-extrabold">CLOSE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmStudioText}
              onChange={(e) => setConfirmStudioText(e.target.value)}
              placeholder="CLOSE"
              className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-xs font-mono text-ink-primary outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-contour-subtle">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCloseStudioModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={confirmStudioText !== 'CLOSE'}
              onClick={() => {
                setIsCloseStudioModalOpen(false);
                logout();
                window.location.href = '/';
              }}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              Confirm Studio Closure
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
