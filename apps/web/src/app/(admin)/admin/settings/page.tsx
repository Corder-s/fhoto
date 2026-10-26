'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Settings,
  Sliders,
  Mail,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MapPin,
  Percent,
  ShieldAlert,
} from 'lucide-react';

interface DistanceSettings {
  id: number;
  free_travel_km: number;
  travel_fee_per_km: number;
  distance_method: 'haversine' | 'driving';
  round_trip_billing: boolean;
  min_travel_fee: number;
  max_travel_fee: number | null;
  allow_photographer_override: boolean;
  updated_at?: string;
}

interface PlatformSettingsData {
  distance: DistanceSettings;
  commission: {
    model: string;
    defaultTakeRatePercent: number;
    version: string;
    currency: string;
  };
  gateway: {
    mode: string;
    configured: boolean;
    provider: string;
  };
  notifications: {
    emailProvider: string;
    smsProvider: string;
    webhooksEnabled: boolean;
  };
}

export default function AdminSettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'distance' | 'commission' | 'notifications') || 'distance';

  const [activeTab, setActiveTab] = useState<'distance' | 'commission' | 'notifications'>(initialTab);
  const [settings, setSettings] = useState<PlatformSettingsData | null>(null);
  const [distanceForm, setDistanceForm] = useState<DistanceSettings>({
    id: 1,
    free_travel_km: 20,
    travel_fee_per_km: 20,
    distance_method: 'haversine',
    round_trip_billing: false,
    min_travel_fee: 0,
    max_travel_fee: null,
    allow_photographer_override: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/settings', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load platform settings (${res.status})`);
      const data = await res.json();
      setSettings(data.settings);
      if (data.settings?.distance) {
        setDistanceForm({
          id: data.settings.distance.id || 1,
          free_travel_km: Number(data.settings.distance.free_travel_km) || 20,
          travel_fee_per_km: Number(data.settings.distance.travel_fee_per_km) || 20,
          distance_method: data.settings.distance.distance_method || 'haversine',
          round_trip_billing: Boolean(data.settings.distance.round_trip_billing),
          min_travel_fee: Number(data.settings.distance.min_travel_fee) || 0,
          max_travel_fee: data.settings.distance.max_travel_fee != null ? Number(data.settings.distance.max_travel_fee) : null,
          allow_photographer_override: data.settings.distance.allow_photographer_override !== false,
          updated_at: data.settings.distance.updated_at,
        });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not load settings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveDistance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distance: distanceForm }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save distance settings.');

      setSuccessMessage('Distance & travel pricing policy saved and committed to audit ledger.');
      if (data.settings) {
        setDistanceForm((prev) => ({ ...prev, ...data.settings }));
      }
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Platform Settings</h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Configure marketplace distance policies, platform commission, and operational defaults.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettings}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#14B8A6]' : 'text-[#64748B]'}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('distance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'distance'
              ? 'bg-[#14B8A6] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Distance & Travel Pricing (20 km Free)</span>
        </button>

        <button
          onClick={() => setActiveTab('commission')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'commission'
              ? 'bg-[#14B8A6] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Platform Fees & Commission</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-[#14B8A6] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Notifications & Webhooks</span>
        </button>
      </div>

      {/* Tab 1: Distance & Travel Pricing Form */}
      {activeTab === 'distance' && (
        <form onSubmit={handleSaveDistance} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs space-y-6 max-w-4xl">
          <div className="border-b border-[#F1F5F9] pb-4">
            <h3 className="text-base font-black text-[#0F172A]">Travel Allowance & Over-Distance Pricing Policy</h3>
            <p className="text-xs text-[#64748B] mt-1">
              Business rule: First 20 km of travel are included free. Travel beyond 20 km incurs per-kilometer compensation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Free Travel Distance */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A] flex items-center justify-between">
                <span>Free Travel Allowance (km)</span>
                <span className="text-[10px] text-[#0D9488] font-bold">Standard: 20 km</span>
              </label>
              <input
                type="number"
                min="0"
                max="500"
                step="0.5"
                value={distanceForm.free_travel_km}
                onChange={(e) => setDistanceForm({ ...distanceForm, free_travel_km: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#14B8A6] focus:bg-white"
                required
              />
              <p className="text-[10px] text-[#64748B]">
                Distance included free of extra travel fee for every eligible booking.
              </p>
            </div>

            {/* Travel Charge Per Km */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A] flex items-center justify-between">
                <span>Additional Travel Rate (₹/km)</span>
                <span className="text-[10px] text-[#64748B]">Default: ₹20/km</span>
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                step="1"
                value={distanceForm.travel_fee_per_km}
                onChange={(e) => setDistanceForm({ ...distanceForm, travel_fee_per_km: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#14B8A6] focus:bg-white"
                required
              />
              <p className="text-[10px] text-[#64748B]">
                Charged per billable kilometer: billable = max(0, distance - freeAllowance).
              </p>
            </div>

            {/* Distance Calculation Method */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Calculation Method</label>
              <select
                value={distanceForm.distance_method}
                onChange={(e) => setDistanceForm({ ...distanceForm, distance_method: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#14B8A6] focus:bg-white cursor-pointer"
              >
                <option value="haversine">Haversine (Great-circle straight-line geodesic estimate)</option>
                <option value="driving">Driving Road Network (Mapbox Directions API)</option>
              </select>
              <p className="text-[10px] text-[#64748B]">
                Method clearly disclosed to customer on the checkout quote.
              </p>
            </div>

            {/* Round Trip Billing */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Round-Trip Billing</label>
              <select
                value={distanceForm.round_trip_billing ? 'true' : 'false'}
                onChange={(e) => setDistanceForm({ ...distanceForm, round_trip_billing: e.target.value === 'true' })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#14B8A6] focus:bg-white cursor-pointer"
              >
                <option value="false">One-Way Billing (Billable distance × rate)</option>
                <option value="true">Round-Trip Billing (Billable distance × rate × 2)</option>
              </select>
              <p className="text-[10px] text-[#64748B]">
                When enabled, accounts for photographer return journey travel compensation.
              </p>
            </div>

            {/* Min Travel Fee */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Minimum Travel Charge (₹)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={distanceForm.min_travel_fee}
                onChange={(e) => setDistanceForm({ ...distanceForm, min_travel_fee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#14B8A6] focus:bg-white"
              />
              <p className="text-[10px] text-[#64748B]">Floor applied when travel distance exceeds the free allowance.</p>
            </div>

            {/* Max Travel Fee Cap */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Maximum Travel Fee Cap (₹ optional)</label>
              <input
                type="number"
                min="0"
                step="100"
                placeholder="No ceiling cap"
                value={distanceForm.max_travel_fee ?? ''}
                onChange={(e) =>
                  setDistanceForm({
                    ...distanceForm,
                    max_travel_fee: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#14B8A6] focus:bg-white"
              />
              <p className="text-[10px] text-[#64748B]">Optional ceiling cap preventing excessive travel charges.</p>
            </div>
          </div>

          {/* Photographer Override Switch */}
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#0F172A]">Allow Photographer-Specific Rate Overrides</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                When enabled, photographer profile rates take precedence over the global platform default rate. Precedence: Valid Photographer Rate &gt; Global Default.
              </p>
            </div>
            <input
              type="checkbox"
              checked={distanceForm.allow_photographer_override}
              onChange={(e) => setDistanceForm({ ...distanceForm, allow_photographer_override: e.target.checked })}
              className="w-4 h-4 text-[#14B8A6] rounded focus:ring-[#14B8A6] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1F5F9]">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Distance Policy'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Platform Commission */}
      {activeTab === 'commission' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs space-y-4 max-w-4xl">
          <div className="border-b border-[#F1F5F9] pb-4">
            <h3 className="text-base font-black text-[#0F172A]">Platform Commission & Take Rate</h3>
            <p className="text-xs text-[#64748B] mt-1">
              Commission model version: {settings?.commission.version || '2026.1'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-1">
              <span className="text-[10px] font-bold text-[#64748B] uppercase">Commission Formula</span>
              <p className="text-base font-black text-[#0F172A]">10% of Photographer Service Price</p>
              <p className="text-[11px] text-[#64748B]">
                Taxes, customer travel charges, and payment gateway fees are computed separately and not inflated by commission.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-1">
              <span className="text-[10px] font-bold text-[#64748B] uppercase">Immutable Price Snapshots</span>
              <p className="text-base font-black text-[#10B981]">Active &amp; Enforced</p>
              <p className="text-[11px] text-[#64748B]">
                Confirmed bookings retain their original agreed pricing snapshot and are never retroactively recalculated.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Notifications & Webhooks */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs space-y-4 max-w-4xl">
          <div className="border-b border-[#F1F5F9] pb-4">
            <h3 className="text-base font-black text-[#0F172A]">Dispatch Infrastructure Status</h3>
            <p className="text-xs text-[#64748B] mt-1">
              In-app notifications, transactional emails, and gateway webhooks.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <div>
                <p className="text-xs font-bold text-[#0F172A]">In-App Realtime Notifications</p>
                <p className="text-[10px] text-[#64748B]">Supabase Realtime event channels</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                Operational
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <div>
                <p className="text-xs font-bold text-[#0F172A]">Transactional Email Provider</p>
                <p className="text-[10px] text-[#64748B]">{settings?.notifications.emailProvider}</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                Operational
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <div>
                <p className="text-xs font-bold text-[#0F172A]">Payment Webhook Listener</p>
                <p className="text-[10px] text-[#64748B]">/api/payments/webhook (HMAC SHA-256)</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
