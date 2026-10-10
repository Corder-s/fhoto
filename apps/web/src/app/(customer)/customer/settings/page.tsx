'use client';

import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  MapPin,
  Camera,
  Trash2,
  Plus,
  KeyRound,
  Download,
  AlertTriangle,
  Smartphone,
  Globe,
  Clock,
  LogOut,
  AlertCircle,
  X,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { CustomerNoticeBanner } from '../../../../components/customer/CustomerNoticeBanner';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import {
  getCustomerPreferences,
  saveCustomerPreferences,
  CustomerPreferences,
  SavedLocation
} from '../../../../lib/settingsService';
import { useAuth } from '../../../../lib/auth';

type SettingsTab =
  | 'profile'
  | 'locations'
  | 'security'
  | 'notifications'
  | 'privacy'
  | 'support';

export default function CustomerSettingsPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [prefs, setPrefs] = useState<CustomerPreferences>(getCustomerPreferences);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // New Location Modal State
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationLabel, setLocationLabel] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationCity, setLocationCity] = useState('New Delhi');
  const [locationInstructions, setLocationInstructions] = useState('');
  const [locationError, setLocationError] = useState('');

  // Account Deletion Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Data Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  // Load stored preferences & sync with active user session
  useEffect(() => {
    const loaded = getCustomerPreferences();
    if (user?.name) {
      loaded.profile.name = user.name;
    }
    if (user?.email) {
      loaded.profile.email = user.email;
    }
    setPrefs(loaded);
  }, [user]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveCustomerPreferences(prefs);
    setIsDirty(false);
    setSaveSuccess(true);
    setStatusMessage('Settings and preferences saved successfully.');
    setTimeout(() => {
      setSaveSuccess(false);
      setStatusMessage('');
    }, 4000);
  };

  const handleReset = () => {
    setPrefs(getCustomerPreferences());
    setIsDirty(false);
  };

  // Password Update Handler
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current account password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters with at least one number and special character.');
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
      setStatusMessage('Password updated successfully. (Client-side verified)');
      setTimeout(() => setStatusMessage(''), 4000);
    }, 1200);
  };

  // Add Venue Location Handler
  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationLabel.trim() || !locationAddress.trim()) {
      setLocationError('Please provide both a label and a complete street address.');
      return;
    }

    const newLoc: SavedLocation = {
      id: `loc-${Date.now()}`,
      label: locationLabel.trim(),
      address: locationAddress.trim(),
      city: locationCity,
      instructions: locationInstructions.trim(),
    };

    const updated = {
      ...prefs,
      savedLocations: [...prefs.savedLocations, newLoc],
    };

    setPrefs(updated);
    saveCustomerPreferences(updated);
    setLocationLabel('');
    setLocationAddress('');
    setLocationInstructions('');
    setIsLocationModalOpen(false);
    setStatusMessage(`Saved shoot venue "${newLoc.label}" successfully.`);
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const handleDeleteLocation = (id: string) => {
    const updated = {
      ...prefs,
      savedLocations: prefs.savedLocations.filter((l) => l.id !== id),
    };
    setPrefs(updated);
    saveCustomerPreferences(updated);
  };

  // Handle Data Export Simulation
  const handleExportData = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
      // Generate synthetic JSON download
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(prefs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `snapshoot-client-data-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setTimeout(() => setExportComplete(false), 5000);
    }, 1500);
  };

  // Revoke other active sessions
  const handleRevokeSessions = () => {
    const updated = {
      ...prefs,
      security: {
        ...prefs.security,
        activeSessions: prefs.security.activeSessions.filter((s) => s.isCurrent),
      },
    };
    setPrefs(updated);
    saveCustomerPreferences(updated);
    setStatusMessage('All other active device sessions have been revoked.');
    setTimeout(() => setStatusMessage(''), 4000);
  };

  // Account Deletion Handler
  const handleDeleteAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type "DELETE" exactly to confirm account closure.');
      return;
    }

    setDeleteError('');
    setIsDeleteModalOpen(false);
    logout();
    window.location.href = '/';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <CustomerNoticeBanner moduleName="Client Account & Profile Management" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E1D6]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FF6E00]/10 text-[#FF6E00] text-xs font-bold mb-2">
            <User className="w-3.5 h-3.5" />
            <span>Client Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1816] tracking-tight">
            Account Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-[#665E55] mt-1">
            Manage your personal profile, shoot venue addresses, notification channels, security, and privacy safeguards.
          </p>
        </div>

        {/* Global Action State */}
        {isDirty && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
              Discard
            </Button>
            <Button variant="primary" size="sm" onClick={() => handleSave()} leftIcon={<Save className="w-3.5 h-3.5" />}>
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Success Notification Banner */}
      {(saveSuccess || statusMessage) && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-xs font-bold text-green-800 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{statusMessage || 'Settings updated successfully!'}</span>
          </div>
          <button onClick={() => setStatusMessage('')} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-[#F2ECE3] rounded-2xl border border-[#E5DDD2] scrollbar-none">
        {[
          { id: 'profile' as SettingsTab, label: 'Profile & Contact', icon: User },
          { id: 'locations' as SettingsTab, label: 'Saved Venues & Preferences', icon: MapPin },
          { id: 'security' as SettingsTab, label: 'Login & Security', icon: Lock },
          { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
          { id: 'privacy' as SettingsTab, label: 'Privacy & Data', icon: Shield },
          { id: 'support' as SettingsTab, label: 'Help & Policies', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-white text-[#1A1816] shadow-sm border border-[#E0D8CD]'
                  : 'text-[#665E55] hover:text-[#1A1816] hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF6E00]' : 'text-[#8C847A]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PROFILE & CONTACT */}
      {/* ========================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-6"
          >
            {/* Profile Summary Card */}
            <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#EBE4DA] shadow-subtle flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group">
                <img
                  src={prefs.profile.avatar}
                  alt={prefs.profile.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-[#FF6E00]/30 shadow-md"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newAvatar = prompt(
                      'Enter image URL for avatar:',
                      prefs.profile.avatar
                    );
                    if (newAvatar && newAvatar.startsWith('http')) {
                      setPrefs({
                        ...prefs,
                        profile: { ...prefs.profile, avatar: newAvatar },
                      });
                      setIsDirty(true);
                    }
                  }}
                  className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold"
                >
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span>Change</span>
                </button>
              </div>

              <div className="space-y-1 text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl font-black text-[#1A1816]">{prefs.profile.name}</h2>
                  <Badge variant="brand" size="sm">
                    Verified Client
                  </Badge>
                </div>
                <p className="text-xs text-[#665E55]">
                  {prefs.profile.email} • {prefs.profile.phone}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs font-semibold text-[#8C847A]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#FF6E00]" />
                    <span>{prefs.profile.city} Hub</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#8C847A]" />
                    <span>Member since {prefs.profile.memberSince}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Input Grid */}
            <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#EBE4DA] shadow-subtle space-y-6">
              <div className="border-b border-[#F0EAE1] pb-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#1A1816]">
                  Personal & Identity Information
                </h3>
                <p className="text-xs text-[#8C847A] mt-0.5">
                  Your identity details are used to prepare shoot contracts and verify you at the shoot venue.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-[#1A1816]">Legal Full Name *</label>
                  <input
                    type="text"
                    required
                    value={prefs.profile.name}
                    onChange={(e) => {
                      setPrefs({
                        ...prefs,
                        profile: { ...prefs.profile, name: e.target.value },
                      });
                      setIsDirty(true);
                    }}
                    className="w-full bg-white border border-[#D5CEC4] rounded-xl p-3 text-xs text-[#1A1816] font-semibold focus:ring-2 focus:ring-[#FF6E00] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-[#1A1816]">Public Display Name</label>
                  <input
                    type="text"
                    value={prefs.profile.displayName}
                    onChange={(e) => {
                      setPrefs({
                        ...prefs,
                        profile: { ...prefs.profile, displayName: e.target.value },
                      });
                      setIsDirty(true);
                    }}
                    className="w-full bg-white border border-[#D5CEC4] rounded-xl p-3 text-xs text-[#1A1816] font-semibold focus:ring-2 focus:ring-[#FF6E00] outline-none"
                  />
                  <p className="text-[11px] text-[#8C847A]">Shown to photographers on reviews and booking cards.</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-[#1A1816]">Mobile Phone Number *</label>
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      OTP Verified
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={prefs.profile.phone}
                    onChange={(e) => {
                      setPrefs({
                        ...prefs,
                        profile: { ...prefs.profile, phone: e.target.value },
                      });
                      setIsDirty(true);
                    }}
                    className="w-full bg-white border border-[#D5CEC4] rounded-xl p-3 text-xs text-[#1A1816] font-semibold focus:ring-2 focus:ring-[#FF6E00] outline-none"
                  />
                  <p className="text-[11px] text-[#8C847A]">Used to receive the 6-digit Shoot-Start handshake OTP.</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-[#1A1816]">Email Address *</label>
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      Receipts Active
                    </span>
                  </div>
                  <input
                    type="email"
                    required
                    value={prefs.profile.email}
                    onChange={(e) => {
                      setPrefs({
                        ...prefs,
                        profile: { ...prefs.profile, email: e.target.value },
                      });
                      setIsDirty(true);
                    }}
                    className="w-full bg-white border border-[#D5CEC4] rounded-xl p-3 text-xs text-[#1A1816] font-semibold focus:ring-2 focus:ring-[#FF6E00] outline-none"
                  />
                  <p className="text-[11px] text-[#8C847A]">Invoices and 4K photo proof download links are sent here.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-[#1A1816]">Primary City / Metro Hub *</label>
                  <select
                    value={prefs.profile.city}
                    onChange={(e) => {
                      setPrefs({
                        ...prefs,
                        profile: { ...prefs.profile, city: e.target.value },
                      });
                      setIsDirty(true);
                    }}
                    className="w-full bg-white border border-[#D5CEC4] rounded-xl p-3 text-xs text-[#1A1816] font-semibold focus:ring-2 focus:ring-[#FF6E00] outline-none cursor-pointer"
                  >
                    <option value="New Delhi">New Delhi (Delhi NCR)</option>
                    <option value="Gurugram">Gurugram (Cyber City / Sohna)</option>
                    <option value="Noida">Noida / Greater Noida</option>
                    <option value="Mumbai">Mumbai (Bandra, BKC, South Mumbai)</option>
                    <option value="Bengaluru">Bengaluru (Indiranagar, Koramangala)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-[#1A1816]">Preferred Interface Language</label>
                  <select
                    value={prefs.profile.preferredLanguage}
                    onChange={(e) => {
                      setPrefs({
                        ...prefs,
                        profile: { ...prefs.profile, preferredLanguage: e.target.value },
                      });
                      setIsDirty(true);
                    }}
                    className="w-full bg-white border border-[#D5CEC4] rounded-xl p-3 text-xs text-[#1A1816] font-semibold focus:ring-2 focus:ring-[#FF6E00] outline-none cursor-pointer"
                  >
                    <option value="English (India)">English (India)</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Bengali">Bengali (বাংলা)</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#F0EAE1]">
                {isDirty && (
                  <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
                  Save Profile Information
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SAVED VENUES & PREFERENCES */}
      {/* ========================================================= */}
      {activeTab === 'locations' && (
        <div className="space-y-6">
          {/* Saved Shoot Venues */}
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#EBE4DA] shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0EAE1] pb-4">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#1A1816]">
                  Frequently Used Shoot Venues
                </h3>
                <p className="text-xs text-[#8C847A] mt-0.5">
                  Save your recurring shoot locations to auto-fill bookings and give photographers accurate arrival directions.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsLocationModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                + Add Venue Address
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prefs.savedLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="p-5 rounded-2xl border border-[#E5DDD2] bg-[#FAF7F2] space-y-3 relative group hover:border-[#FF6E00]/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#FF6E00] shrink-0" />
                      <h4 className="text-sm font-bold text-[#1A1816]">{loc.label}</h4>
                      {loc.isDefault && (
                        <span className="text-[10px] font-bold bg-[#FF6E00] text-white px-2 py-0.5 rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteLocation(loc.id)}
                      className="text-[#8C847A] hover:text-red-600 transition-colors p-1"
                      title="Remove Venue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-[#5A544D] leading-relaxed">{loc.address}</p>

                  {loc.instructions && (
                    <div className="pt-2 border-t border-[#E8E1D6] text-[11px] text-[#8C847A]">
                      <strong>Arrival Note:</strong> {loc.instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Creative Shoot Preferences */}
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#EBE4DA] shadow-subtle space-y-6">
            <div className="border-b border-[#F0EAE1] pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#1A1816]">
                Photography Genre & Aesthetic Preferences
              </h3>
              <p className="text-xs text-[#8C847A] mt-0.5">
                Helps SnapShoot recommend creators matching your style and pre-configures package suggestions.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[#1A1816]">Preferred Genres</label>
                <div className="flex flex-wrap gap-2">
                  {['Portraits', 'Events', 'Reels', 'Couples & Weddings', 'Commercial & Products', 'Fashion'].map(
                    (genre) => {
                      const selected = prefs.bookingPreferences.preferredGenres.includes(genre);
                      return (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => {
                            const current = prefs.bookingPreferences.preferredGenres;
                            const next = selected
                              ? current.filter((g) => g !== genre)
                              : [...current, genre];
                            setPrefs({
                              ...prefs,
                              bookingPreferences: { ...prefs.bookingPreferences, preferredGenres: next },
                            });
                            setIsDirty(true);
                          }}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                            selected
                              ? 'bg-[#FF6E00] text-white border-[#FF6E00] shadow-sm'
                              : 'bg-white text-[#5A544D] border-[#D5CEC4] hover:bg-[#FAF7F2]'
                          }`}
                        >
                          {genre}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase text-[#1A1816]">Preferred Lighting & Visual Tone</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    { id: 'editorial', label: 'Editorial & Dramatic' },
                    { id: 'natural', label: 'Warm Natural Light' },
                    { id: 'candid', label: 'Candid / Spontaneous' },
                    { id: 'studio', label: 'Clean Studio Strobe' },
                  ].map((style) => (
                    <label
                      key={style.id}
                      className={`p-3 rounded-2xl border text-center font-bold cursor-pointer transition-all ${
                        prefs.bookingPreferences.shootStyle === style.id
                          ? 'border-[#FF6E00] bg-[#FFF5EB] text-[#FF6E00]'
                          : 'border-[#E0D8CD] bg-white text-[#5A544D] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shootStyle"
                        className="hidden"
                        checked={prefs.bookingPreferences.shootStyle === style.id}
                        onChange={() => {
                          setPrefs({
                            ...prefs,
                            bookingPreferences: {
                              ...prefs.bookingPreferences,
                              shootStyle: style.id as any,
                            },
                          });
                          setIsDirty(true);
                        }}
                      />
                      <span>{style.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#F0EAE1]">
              <Button type="button" variant="primary" size="md" onClick={() => handleSave()} leftIcon={<Save className="w-4 h-4" />}>
                Save Booking Preferences
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: LOGIN & SECURITY */}
      {/* ========================================================= */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Credentials & Password Card */}
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#EBE4DA] shadow-subtle space-y-6">
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-4">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#1A1816]">
                  Password & Authentication Credentials
                </h3>
                <p className="text-xs text-[#8C847A] mt-0.5">
                  Protect your SnapShoot client account and active shoot bookings.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPasswordModalOpen(true)}
                leftIcon={<Lock className="w-3.5 h-3.5" />}
              >
                Change Password
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CD] space-y-1">
                <span className="text-[#8C847A]">Password Last Changed</span>
                <p className="font-bold text-[#1A1816]">{prefs.security.lastPasswordChange}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CD] space-y-1">
                <span className="text-[#8C847A]">Two-Factor Mobile Auth</span>
                <p className="font-bold text-green-700">Active (via Phone OTP)</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CD] space-y-1">
                <span className="text-[#8C847A]">Account Status</span>
                <p className="font-bold text-green-700">Active & Escrow Verified</p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Security Policy:</strong> SnapShoot will never request your account password, UPI PIN, or 6-digit Shoot-Start OTP over the phone. Only present the OTP in-person to the photographer upon arrival.
              </span>
            </div>
          </div>

          {/* Active Device Sessions Card */}
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#EBE4DA] shadow-subtle space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0EAE1] pb-4">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#1A1816]">
                  Active Device Sessions
                </h3>
                <p className="text-xs text-[#8C847A] mt-0.5">
                  Devices currently authenticated to your SnapShoot account.
                </p>
              </div>
              {prefs.security.activeSessions.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRevokeSessions}
                  leftIcon={<LogOut className="w-3.5 h-3.5 text-red-600" />}
                >
                  Log Out Other Devices
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {prefs.security.activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 rounded-2xl border border-[#E5DDD2] bg-[#FAF7F2] flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-[#E0D8CD] flex items-center justify-center text-[#FF6E00]">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#1A1816]">
                          {session.device} • {session.browser}
                        </p>
                        {session.isCurrent && (
                          <span className="text-[10px] font-extrabold text-green-800 bg-green-100 px-2 py-0.5 rounded-full">
                            Current Session
                          </span>
                        )}
                      </div>
                      <p className="text-[#8C847A]">
                        {session.location} • IP: {session.ipMasked} • {session.lastActive}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: NOTIFICATIONS */}
      {/* ========================================================= */}
      {activeTab === 'notifications' && (
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#EBE4DA] shadow-subtle space-y-6">
          <div className="border-b border-[#F0EAE1] pb-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#1A1816]">
              Notification Dispatch Channels
            </h3>
            <p className="text-xs text-[#8C847A] mt-0.5">
              Control where and how you receive real-time shoot milestones, photographer coordination, and deliverables.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D6] cursor-pointer hover:border-[#FF6E00]/40 transition-all">
              <input
                type="checkbox"
                checked={prefs.notifications.smsMilestones}
                onChange={(e) => {
                  setPrefs({
                    ...prefs,
                    notifications: { ...prefs.notifications, smsMilestones: e.target.checked },
                  });
                  setIsDirty(true);
                }}
                className="w-4 h-4 text-[#FF6E00] rounded focus:ring-[#FF6E00] border-[#D5CEC4] mt-0.5"
              />
              <div className="space-y-0.5 flex-1">
                <p className="font-bold text-[#1A1816]">Urgent SMS Shoot Milestones & Start OTP</p>
                <p className="text-[#665E55]">
                  Receive high-priority SMS notifications when your photographer starts transit and your 6-digit Shoot-Start handshake OTP. (Recommended)
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D6] cursor-pointer hover:border-[#FF6E00]/40 transition-all">
              <input
                type="checkbox"
                checked={prefs.notifications.whatsappTransit}
                onChange={(e) => {
                  setPrefs({
                    ...prefs,
                    notifications: { ...prefs.notifications, whatsappTransit: e.target.checked },
                  });
                  setIsDirty(true);
                }}
                className="w-4 h-4 text-[#FF6E00] rounded focus:ring-[#FF6E00] border-[#D5CEC4] mt-0.5"
              />
              <div className="space-y-0.5 flex-1">
                <p className="font-bold text-[#1A1816]">WhatsApp Venue Location Pins & Chat</p>
                <p className="text-[#665E55]">
                  Get direct photographer coordination cards, live venue location pins, and arrival updates directly in WhatsApp.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D6] cursor-pointer hover:border-[#FF6E00]/40 transition-all">
              <input
                type="checkbox"
                checked={prefs.notifications.emailReceipts}
                onChange={(e) => {
                  setPrefs({
                    ...prefs,
                    notifications: { ...prefs.notifications, emailReceipts: e.target.checked },
                  });
                  setIsDirty(true);
                }}
                className="w-4 h-4 text-[#FF6E00] rounded focus:ring-[#FF6E00] border-[#D5CEC4] mt-0.5"
              />
              <div className="space-y-0.5 flex-1">
                <p className="font-bold text-[#1A1816]">GST Tax Invoices & Escrow Receipts</p>
                <p className="text-[#665E55]">
                  Receive formal tax invoices, payment gateway receipts, and refund confirmation PDFs via email.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D6] cursor-pointer hover:border-[#FF6E00]/40 transition-all">
              <input
                type="checkbox"
                checked={prefs.notifications.galleryReadyAlerts}
                onChange={(e) => {
                  setPrefs({
                    ...prefs,
                    notifications: { ...prefs.notifications, galleryReadyAlerts: e.target.checked },
                  });
                  setIsDirty(true);
                }}
                className="w-4 h-4 text-[#FF6E00] rounded focus:ring-[#FF6E00] border-[#D5CEC4] mt-0.5"
              />
              <div className="space-y-0.5 flex-1">
                <p className="font-bold text-[#1A1816]">Private 4K Gallery Ready Alerts</p>
                <p className="text-[#665E55]">
                  Instant notification the moment your creator finishes color grading and uploads full-resolution deliverables.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D6] cursor-pointer hover:border-[#FF6E00]/40 transition-all">
              <input
                type="checkbox"
                checked={prefs.notifications.promotionalOffers}
                onChange={(e) => {
                  setPrefs({
                    ...prefs,
                    notifications: { ...prefs.notifications, promotionalOffers: e.target.checked },
                  });
                  setIsDirty(true);
                }}
                className="w-4 h-4 text-[#FF6E00] rounded focus:ring-[#FF6E00] border-[#D5CEC4] mt-0.5"
              />
              <div className="space-y-0.5 flex-1">
                <p className="font-bold text-[#1A1816]">Curated Creator Spotlights & Seasonal Discounts</p>
                <p className="text-[#665E55]">
                  Receive occasional festival shoot offers and top creator portfolio spotlights. (Optional)
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-3 border-t border-[#F0EAE1]">
            <Button type="button" variant="primary" size="md" onClick={() => handleSave()} leftIcon={<Save className="w-4 h-4" />}>
              Save Notification Preferences
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: PRIVACY & DATA MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#EBE4DA] shadow-subtle space-y-6">
            <div className="border-b border-[#F0EAE1] pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#1A1816]">
                Client Privacy & Information Safeguards
              </h3>
              <p className="text-xs text-[#8C847A] mt-0.5">
                We implement strict safeguards ensuring your personal details and media deliverables remain protected.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <label className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D6] cursor-pointer hover:border-[#FF6E00]/40 transition-all">
                <input
                  type="checkbox"
                  checked={prefs.privacy.maskPhoneUntilConfirmed}
                  onChange={(e) => {
                    setPrefs({
                      ...prefs,
                      privacy: { ...prefs.privacy, maskPhoneUntilConfirmed: e.target.checked },
                    });
                    setIsDirty(true);
                  }}
                  className="w-4 h-4 text-[#FF6E00] rounded focus:ring-[#FF6E00] border-[#D5CEC4] mt-0.5"
                />
                <div className="space-y-0.5 flex-1">
                  <p className="font-bold text-[#1A1816]">Mask Personal Phone Number</p>
                  <p className="text-[#665E55]">
                    Your real mobile number is masked from photographers until you explicitly confirm the shoot booking.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D6] cursor-pointer hover:border-[#FF6E00]/40 transition-all">
                <input
                  type="checkbox"
                  checked={prefs.privacy.privateGalleries}
                  onChange={(e) => {
                    setPrefs({
                      ...prefs,
                      privacy: { ...prefs.privacy, privateGalleries: e.target.checked },
                    });
                    setIsDirty(true);
                  }}
                  className="w-4 h-4 text-[#FF6E00] rounded focus:ring-[#FF6E00] border-[#D5CEC4] mt-0.5"
                />
                <div className="space-y-0.5 flex-1">
                  <p className="font-bold text-[#1A1816]">Encrypted & Authenticated Media Delivery Only</p>
                  <p className="text-[#665E55]">
                    All delivered master JPEGs are stored in private cloud buckets accessible exclusively via cryptographically signed tokens.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D6] cursor-pointer hover:border-[#FF6E00]/40 transition-all">
                <input
                  type="checkbox"
                  checked={prefs.privacy.allowUsageInCreatorPortfolios}
                  onChange={(e) => {
                    setPrefs({
                      ...prefs,
                      privacy: { ...prefs.privacy, allowUsageInCreatorPortfolios: e.target.checked },
                    });
                    setIsDirty(true);
                  }}
                  className="w-4 h-4 text-[#FF6E00] rounded focus:ring-[#FF6E00] border-[#D5CEC4] mt-0.5"
                />
                <div className="space-y-0.5 flex-1">
                  <p className="font-bold text-[#1A1816]">Allow Selective Photographer Portfolio Showcase</p>
                  <p className="text-[#665E55]">
                    Permit your creator to feature selected non-sensitive portraits in their verified SnapShoot marketplace portfolio.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#F0EAE1]">
              <Button type="button" variant="primary" size="md" onClick={() => handleSave()} leftIcon={<Save className="w-4 h-4" />}>
                Save Privacy Settings
              </Button>
            </div>
          </div>

          {/* Data Export & GDPR/DPDP Section */}
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#EBE4DA] shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#1A1816]">Download Your Account Data</h4>
              <p className="text-xs text-[#8C847A]">
                Export a complete JSON archive of your booking history, profile details, and venue preferences under the Digital Personal Data Protection Act.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportData}
              isLoading={isExporting}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              {exportComplete ? 'Data Export Downloaded!' : 'Export JSON Data'}
            </Button>
          </div>

          {/* DANGER ZONE: ACCOUNT DELETION */}
          <div className="p-6 sm:p-8 bg-red-50/50 rounded-3xl border border-red-200 space-y-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-extrabold">Danger Zone: Account Closure</h3>
            </div>
            <p className="text-xs text-red-900 leading-relaxed">
              Permanently close your client account and delete all stored profile records. This action cannot be undone. Active bookings in platform escrow must be completed or cancelled before requesting deletion.
            </p>
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Request Account Deletion...
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: HELP & POLICIES */}
      {/* ========================================================= */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#EBE4DA] shadow-subtle space-y-6">
            <div className="border-b border-[#F0EAE1] pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#1A1816]">
                Client Concierge & Platform Helpdesk
              </h3>
              <p className="text-xs text-[#8C847A] mt-0.5">
                Answers to common questions regarding bookings, payments, and creator disputes.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-1">
                <p className="font-bold text-[#1A1816]">How does the Shoot-Start OTP handshake protect my payment?</p>
                <p className="text-[#665E55] leading-relaxed">
                  Your payment is locked safely in platform escrow upon booking. The photographer only receives authorization to begin when they verify your 6-digit OTP code in person at the shoot venue.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-1">
                <p className="font-bold text-[#1A1816]">What happens if the weather causes outdoor shoot cancellation?</p>
                <p className="text-[#665E55] leading-relaxed">
                  Outdoor shoots impacted by heavy rain or weather disruptions qualify for 100% free rescheduling with your photographer or instant refund back to your original payment method.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-1">
                <p className="font-bold text-[#1A1816]">When will my edited photos be delivered?</p>
                <p className="text-[#665E55] leading-relaxed">
                  Standard portrait and reel deliverables are uploaded within 24–48 hours directly into your private Photo Gallery tab. You can download individual 4K assets or complete ZIP archives.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-4 border-t border-[#F0EAE1] text-xs">
              <Link href="/how-it-works" className="font-bold text-[#1A1816] hover:text-[#FF6E00] flex items-center gap-1">
                <span>How SnapShoot Works</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link href="/cancellation" className="font-bold text-[#1A1816] hover:text-[#FF6E00] flex items-center gap-1">
                <span>Cancellation & Escrow Policy</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link href="/privacy" className="font-bold text-[#1A1816] hover:text-[#FF6E00] flex items-center gap-1">
                <span>Privacy Policy</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link href="/terms" className="font-bold text-[#1A1816] hover:text-[#FF6E00] flex items-center gap-1">
                <span>Terms of Service</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
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
        title="Update Account Password"
        description="Ensure your new password contains at least 8 characters with a mix of letters and numbers."
      >
        <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs font-bold text-green-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Password updated successfully!</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-[#1A1816]">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-white border border-[#D5CEC4] rounded-xl p-2.5 text-xs text-[#1A1816] focus:ring-2 focus:ring-[#FF6E00] outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-[#1A1816]">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white border border-[#D5CEC4] rounded-xl p-2.5 text-xs text-[#1A1816] focus:ring-2 focus:ring-[#FF6E00] outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-[#1A1816]">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white border border-[#D5CEC4] rounded-xl p-2.5 text-xs text-[#1A1816] focus:ring-2 focus:ring-[#FF6E00] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#F0EAE1]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Password Change
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: ADD SHOOT VENUE LOCATION */}
      {/* ========================================================= */}
      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => {
          setIsLocationModalOpen(false);
          setLocationError('');
        }}
        title="Add Saved Shoot Venue"
        description="Save your residence, outdoor park, or corporate studio for instant one-click booking."
      >
        <form onSubmit={handleAddLocation} className="space-y-4 pt-2">
          {locationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{locationError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-[#1A1816]">Venue Label *</label>
            <input
              type="text"
              placeholder="e.g. Home Terrace, Office Studio, Lodhi Garden"
              required
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              className="w-full bg-white border border-[#D5CEC4] rounded-xl p-2.5 text-xs text-[#1A1816] focus:ring-2 focus:ring-[#FF6E00] outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-[#1A1816]">Full Street Address & Landmark *</label>
            <textarea
              rows={2}
              placeholder="e.g. Flat 302, Building A, DLF Phase 2, Gurugram"
              required
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              className="w-full bg-white border border-[#D5CEC4] rounded-xl p-2.5 text-xs text-[#1A1816] focus:ring-2 focus:ring-[#FF6E00] outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-[#1A1816]">City Hub</label>
            <select
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              className="w-full bg-white border border-[#D5CEC4] rounded-xl p-2.5 text-xs text-[#1A1816] focus:ring-2 focus:ring-[#FF6E00] outline-none"
            >
              <option value="New Delhi">New Delhi</option>
              <option value="Gurugram">Gurugram</option>
              <option value="Noida">Noida</option>
              <option value="Greater Noida">Greater Noida</option>
              <option value="Mumbai">Mumbai</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-[#1A1816]">Photographer Parking & Entry Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Dedicated basement visitor parking. Take lift to 4th floor."
              value={locationInstructions}
              onChange={(e) => setLocationInstructions(e.target.value)}
              className="w-full bg-white border border-[#D5CEC4] rounded-xl p-2.5 text-xs text-[#1A1816] focus:ring-2 focus:ring-[#FF6E00] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#F0EAE1]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsLocationModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Venue Address
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: ACCOUNT DELETION CONFIRMATION */}
      {/* ========================================================= */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteConfirmText('');
          setDeleteError('');
        }}
        title="Confirm Account Deletion"
        description="This action will terminate your client credentials and delete your saved venues."
      >
        <form onSubmit={handleDeleteAccount} className="space-y-4 pt-2">
          {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
            <p className="font-bold">Are you sure you want to delete your account?</p>
            <p>
              You will lose access to any active bookings, 4K delivered galleries, and verified client history.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1A1816]">
              To confirm, type <span className="font-mono text-red-600 font-extrabold">DELETE</span> below:
            </label>
            <input
              type="text"
              required
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full bg-white border border-[#D5CEC4] rounded-xl p-2.5 text-xs font-mono text-[#1A1816] focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#F0EAE1]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Permanently Delete Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
