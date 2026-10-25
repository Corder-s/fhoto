'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Globe,
  Clock,
  LogOut,
  AlertCircle,
  X,
  RotateCcw,
  Sparkles,
  Calendar,
  CreditCard,
  Check,
  ChevronDown,
  UserCog,
  CalendarCheck,
  Settings,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import {
  getCustomerPreferences,
  saveCustomerPreferences,
  fetchCustomerPreferencesFromSupabase,
  saveCustomerPreferencesToSupabase,
  CustomerPreferences,
  SavedLocation,
} from '../../../../lib/settingsService';
import { useAuth } from '../../../../lib/auth';
import { useCurrentUserProfile } from '../../../../context/UserProfileContext';
import { getSupabaseBrowserClient } from '../../../../lib/supabase/client';
import { Loader2 } from 'lucide-react';

type SettingsTab =
  | 'profile'
  | 'security'
  | 'notifications'
  | 'preferences'
  | 'locations'
  | 'payments'
  | 'bookings'
  | 'privacy'
  | 'language'
  | 'support'
  | 'account';

export default function CustomerSettingsPage() {
  const { user, logout, isAuthenticated, isMounted } = useAuth();
  const { uploadAvatar, removeAvatar, displayAvatar } = useCurrentUserProfile();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [prefs, setPrefs] = useState<CustomerPreferences>(() => getCustomerPreferences(user));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Authentication guard & Supabase live data synchronization
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const loaded = await fetchCustomerPreferencesFromSupabase(user);
        if (!isCancelled) {
          setPrefs(loaded);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load customer settings from Supabase:', err);
        if (!isCancelled) {
          setPrefs(getCustomerPreferences(user));
          setIsLoading(false);
        }
      }
    }

    if (isMounted) {
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        loadData();
      }
    }

    return () => {
      isCancelled = true;
    };
  }, [isMounted, isAuthenticated, user, router]);

  const handleConfirmLogout = async () => {
    await logout();
    setIsLogoutModalOpen(false);
    window.location.href = '/login';
  };

  // Avatar Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // New Location Modal State
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationLabel, setLocationLabel] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationCity, setLocationCity] = useState('Delhi NCR');
  const [locationInstructions, setLocationInstructions] = useState('');
  const [locationError, setLocationError] = useState('');

  // Account Deletion Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== 'DELETE MY ACCOUNT') {
      setDeleteError('Please type the exact phrase to confirm.');
      return;
    }
    setIsDeletingAccount(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/profile/delete', { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete account. Please try again.');
        setIsDeletingAccount(false);
        return;
      }
      await logout();
      setIsDeleteModalOpen(false);
      window.location.href = '/login?deleted=true';
    } catch (err: any) {
      setDeleteError(err.message || 'An unexpected error occurred during account deletion.');
      setIsDeletingAccount(false);
    }
  };


  // Data Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  // Handle Save
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    
    // Basic validation
    if (!prefs.profile.firstName?.trim() && !prefs.profile.displayName?.trim()) {
      setErrorMessage('Please provide your name.');
      return;
    }

    if (!user?.id) {
      setErrorMessage('User session not found. Please log in.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveCustomerPreferencesToSupabase(user.id, prefs);
      setIsSaving(false);
      if (!res.success && res.error) {
        setErrorMessage(res.error);
        return;
      }

      setIsDirty(false);
      setSaveSuccess(true);
      setStatusMessage('Settings saved successfully.');
      setTimeout(() => {
        setSaveSuccess(false);
        setStatusMessage('');
      }, 4000);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage(err?.message || 'Failed to save settings.');
    }
  };

  // Handle Cancel / Reset
  const handleReset = async () => {
    if (user) {
      const loaded = await fetchCustomerPreferencesFromSupabase(user);
      setPrefs(loaded);
    } else {
      setPrefs(getCustomerPreferences(user));
    }
    setIsDirty(false);
    setErrorMessage('');
    setStatusMessage('Changes reverted.');
    setTimeout(() => setStatusMessage(''), 2500);
  };

  // Avatar Upload Handler with reliable server-side service-role upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|gif|jpg)$/i)) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 5MB limit. Please choose a smaller file.');
      return;
    }

    setErrorMessage('');
    setIsUploadingPhoto(true);

    try {
      const res = await uploadAvatar(file);
      if (!res.success || !res.url) {
        throw new Error(res.error || 'Failed to upload profile picture.');
      }

      const updated = {
        ...prefs,
        profile: {
          ...prefs.profile,
          avatar: res.url,
        },
      };
      setPrefs(updated);
      setIsDirty(true);
      if (user?.id) {
        await saveCustomerPreferencesToSupabase(user.id, updated);
      }
      setStatusMessage('Profile photo updated successfully.');
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      setErrorMessage(err.message || 'Failed to upload profile photo.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setErrorMessage('');
    setIsUploadingPhoto(true);

    try {
      const res = await removeAvatar();
      if (!res.success) {
        throw new Error(res.error || 'Failed to remove profile picture.');
      }

      const updated = {
        ...prefs,
        profile: {
          ...prefs.profile,
          avatar: '',
        },
      };
      setPrefs(updated);
      setIsDirty(true);
      if (user?.id) {
        await saveCustomerPreferencesToSupabase(user.id, updated);
      }
      setStatusMessage('Profile photo removed.');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err: any) {
      console.error('Avatar removal failed:', err);
      setErrorMessage(err.message || 'Failed to remove profile photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Password Update Handler synced directly to Supabase Auth
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          setIsUpdatingPassword(false);
          setPasswordError(error.message);
          return;
        }
      } catch (err: any) {
        setIsUpdatingPassword(false);
        setPasswordError(err?.message || 'Failed to update password.');
        return;
      }
    }

    setIsUpdatingPassword(false);
    setPasswordSuccess(true);
    setTimeout(() => {
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(false);
      setStatusMessage('Password updated successfully.');
      setTimeout(() => setStatusMessage(''), 4000);
    }, 1200);
  };

  // Add Venue Location Handler synced to Supabase
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationLabel.trim() || !locationAddress.trim()) {
      setLocationError('Please provide both a label and street address.');
      return;
    }

    const newLoc: SavedLocation = {
      id: `loc-${Date.now()}`,
      label: locationLabel.trim(),
      address: locationAddress.trim(),
      city: locationCity || 'Delhi NCR',
      instructions: locationInstructions.trim(),
    };

    const updated = {
      ...prefs,
      savedLocations: [...prefs.savedLocations, newLoc],
    };

    setPrefs(updated);
    if (user?.id) {
      await saveCustomerPreferencesToSupabase(user.id, updated);
    }
    setLocationLabel('');
    setLocationAddress('');
    setLocationInstructions('');
    setIsLocationModalOpen(false);
    setStatusMessage(`Saved location "${newLoc.label}" successfully.`);
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const handleDeleteLocation = async (id: string) => {
    const updated = {
      ...prefs,
      savedLocations: prefs.savedLocations.filter((l) => l.id !== id),
    };
    setPrefs(updated);
    if (user?.id) {
      await saveCustomerPreferencesToSupabase(user.id, updated);
    }
  };

  // Data Export
  const handleExportData = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(prefs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `snapshoot-profile-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setTimeout(() => setExportComplete(false), 5000);
    }, 1200);
  };

  // Calculate dynamic completion
  const completionItems = [
    {
      id: 'basic',
      label: 'Basic information',
      completed: Boolean(prefs.profile.firstName && prefs.profile.lastName && prefs.profile.displayName),
    },
    {
      id: 'photo',
      label: 'Profile photo',
      completed: Boolean(prefs.profile.avatar),
    },
    {
      id: 'phone',
      label: 'Phone verification',
      completed: Boolean(prefs.profile.phoneVerified),
    },
    {
      id: 'location',
      label: 'Preferred location',
      completed: Boolean(prefs.profile.city),
    },
    {
      id: 'interests',
      label: 'Photography interests',
      completed: prefs.bookingPreferences.preferredGenres.length >= 2,
    },
    {
      id: 'notifications',
      label: 'Notification preferences',
      completed: prefs.notifications.smsMilestones && prefs.notifications.emailReceipts,
    },
  ];

  const completedCount = completionItems.filter((i) => i.completed).length;
  // Calculate percentage: exactly 80% when 4 of 5 core items or 5 of 6 (scaled to 80% default)
  const completionPercent = Math.round((completedCount / completionItems.length) * 100);

  // SVG Circle calculation
  const radius = 22;
  const circumference = 2 * Math.PI * radius; // ~138.23
  const strokeDashoffset = circumference - (completionPercent / 100) * circumference;

  // Sidebar navigation items matching reference image
  const sidebarItems: Array<{
    id: SettingsTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    { id: 'profile', label: 'Profile & Account', icon: User },
    { id: 'security', label: 'Login & Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Booking Preferences', icon: Calendar },
    { id: 'locations', label: 'Saved Locations', icon: MapPin },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'bookings', label: 'My Bookings', icon: CalendarCheck },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield },
    { id: 'language', label: 'Language & Accessibility', icon: Globe },
    { id: 'support', label: 'Help & Support', icon: HelpCircle },
    { id: 'account', label: 'Account Management', icon: UserCog },
  ];

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        accept="image/png, image/jpeg, image/webp, image/jpg"
        className="hidden"
      />

      {/* Status Notifications */}
      {statusMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* ========================================================= */}
        {/* LEFT SETTINGS SIDEBAR */}
        {/* ========================================================= */}
        <aside className="w-full lg:w-64 xl:w-72 shrink-0">
          <div className="bg-white rounded-2xl border border-[#E7EAEE] p-3 sm:p-4 shadow-sm">
            {/* Sidebar Title */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 mb-2 text-[#191C22]">
              <Settings className="w-5 h-5 text-[#191C22] stroke-[2.2]" />
              <h2 className="text-base font-bold tracking-tight">Settings</h2>
            </div>

            {/* Sidebar Navigation Links */}
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === 'bookings') {
                        // Allow direct link or tab viewing
                        setActiveTab('bookings');
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                      isActive
                        ? 'bg-[#FFF4EB] text-[#14B8A6] font-bold shadow-xs'
                        : 'text-[#64748B] hover:text-[#191C22] hover:bg-[#F5F7F9]'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-[#14B8A6]' : 'text-[#94A3B8]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F7F9] text-[#94A3B8] border border-[#E7EAEE]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Creator Studio Quick Link */}
            <div className="mt-4 pt-4 border-t border-[#E7EAEE]">
              <Link
                href="/photographer/dashboard"
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#14B8A6] hover:bg-[#FFF4EB] transition-colors"
              >
                <Camera className="w-4 h-4 text-[#14B8A6]" />
                <span>Switch to Creator Studio</span>
              </Link>
            </div>

            {/* Account Actions Section */}
            <div className="mt-4 pt-4 border-t border-[#E7EAEE]">
              <div className="px-3.5 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  Account Actions
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-600 shrink-0" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* RIGHT MAIN CONTENT AREA */}
        {/* ========================================================= */}
        <main className="flex-1 w-full min-w-0">
          {/* TAB 1: PROFILE & ACCOUNT (Primary Reference Layout) */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Page Title & Subtitle */}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#191C22]">Profile & Account</h1>
                <p className="text-xs text-[#64748B] mt-1">Manage your personal information and account settings</p>
              </div>

              {/* 1. Profile Summary Card */}
              <div className="bg-white rounded-2xl border border-[#E7EAEE] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                  {/* Hidden File Input for Avatar Upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />

                  {/* Avatar with Camera Overlay */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-full overflow-hidden border border-[#E7EAEE] shadow-sm relative flex items-center justify-center bg-[#F5F7F9]">
                      {prefs.profile.avatar || displayAvatar ? (
                        <img
                          src={(prefs.profile.avatar || displayAvatar) || undefined}
                          alt={prefs.profile.displayName || prefs.profile.name || 'User Avatar'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] text-2xl font-black shadow-sm">
                          {(prefs.profile.displayName || user?.name || user?.email || 'U')[0].toUpperCase()}
                        </div>
                      )}

                      {isUploadingPhoto && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-xs">
                          <Loader2 className="w-5 h-5 animate-spin text-[#14B8A6]" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border border-[#E7EAEE] shadow flex items-center justify-center text-[#64748B] hover:text-[#14B8A6] hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                      title="Upload photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Profile Name & Badges */}
                  <div>
                    <h2 className="text-xl font-bold text-[#191C22]">
                      {prefs.profile.displayName || prefs.profile.name || user?.name || 'Customer'}
                    </h2>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                      <span className="text-xs font-medium text-[#64748B]">
                        {prefs.profile.handle || (user?.email ? `@${user.email.split('@')[0]}` : '@customer')}
                      </span>
                      {prefs.profile.emailVerified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified User
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] mt-1.5">
                      {prefs.profile.tagline || 'REEPY verified customer'}
                    </p>
                  </div>
                </div>

                {/* Change / Remove Photo Buttons */}
                <div className="flex flex-col items-center sm:items-end shrink-0 gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#14B8A6] bg-[#FFF4EB] hover:bg-[#FFE8D6] border border-[#14B8A6]/30 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#14B8A6]" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 text-[#14B8A6]" />
                          <span>Change Photo</span>
                        </>
                      )}
                    </button>

                    {(prefs.profile.avatar || displayAvatar) && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={isUploadingPhoto}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                        title="Remove profile photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-[#94A3B8]">JPG, PNG, WebP up to 5MB</span>
                </div>
              </div>

              {/* 2. Personal Information Form */}
              <div className="bg-white rounded-2xl border border-[#E7EAEE] p-6 shadow-sm">
                <div>
                  <h3 className="text-base font-bold text-[#191C22]">Personal Information</h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">Update your basic information</p>
                </div>

                <form onSubmit={handleSave} className="mt-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* First Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#191C22]">
                        First Name <span className="text-[#14B8A6]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={prefs.profile.firstName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrefs({
                            ...prefs,
                            profile: {
                              ...prefs.profile,
                              firstName: val,
                              name: `${val} ${prefs.profile.lastName || ''}`.trim(),
                            },
                          });
                          setIsDirty(true);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAEE] bg-white text-xs font-medium text-[#191C22] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]/20 transition-all"
                        placeholder="First name"
                      />
                    </div>

                    {/* Last Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#191C22]">
                        Last Name <span className="text-[#14B8A6]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={prefs.profile.lastName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrefs({
                            ...prefs,
                            profile: {
                              ...prefs.profile,
                              lastName: val,
                              name: `${prefs.profile.firstName || ''} ${val}`.trim(),
                            },
                          });
                          setIsDirty(true);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAEE] bg-white text-xs font-medium text-[#191C22] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]/20 transition-all"
                        placeholder="Last name"
                      />
                    </div>

                    {/* Display Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#191C22]">Display Name</label>
                      <input
                        type="text"
                        value={prefs.profile.displayName || ''}
                        onChange={(e) => {
                          setPrefs({
                            ...prefs,
                            profile: { ...prefs.profile, displayName: e.target.value },
                          });
                          setIsDirty(true);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAEE] bg-white text-xs font-medium text-[#191C22] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]/20 transition-all"
                        placeholder="Display name"
                      />
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#191C22]">
                        Email Address <span className="text-[#14B8A6]">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="email"
                          required
                          value={prefs.profile.email || ''}
                          readOnly
                          className="w-full pl-3.5 pr-24 py-2.5 rounded-xl border border-[#E7EAEE] bg-[#F5F7F9] text-xs font-medium text-[#64748B] cursor-not-allowed focus:outline-none"
                        />
                        {prefs.profile.emailVerified && (
                          <span className="absolute right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Phone Number with +91 Country Code */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#191C22]">
                        Phone Number
                      </label>
                      <div className="relative flex items-center border border-[#E7EAEE] rounded-xl bg-white overflow-hidden focus-within:border-[#14B8A6] focus-within:ring-1 focus-within:ring-[#14B8A6]/20 transition-all">
                        <div className="flex items-center gap-1 px-3 py-2.5 bg-[#F5F7F9] border-r border-[#E7EAEE] text-xs font-bold text-[#191C22] shrink-0">
                          <span>{prefs.profile.phoneCountryCode || '+91'}</span>
                          <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
                        </div>
                        <input
                          type="text"
                          value={prefs.profile.phone || ''}
                          onChange={(e) => {
                            setPrefs({
                              ...prefs,
                              profile: { ...prefs.profile, phone: e.target.value },
                            });
                            setIsDirty(true);
                          }}
                          className="w-full px-3 py-2.5 text-xs font-medium text-[#191C22] focus:outline-none"
                          placeholder="10-digit mobile number"
                        />
                        {prefs.profile.phoneVerified && (
                          <span className="mr-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#191C22]">Date of Birth</label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={prefs.profile.dob || ''}
                          onChange={(e) => {
                            setPrefs({
                              ...prefs,
                              profile: { ...prefs.profile, dob: e.target.value },
                            });
                            setIsDirty(true);
                          }}
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#E7EAEE] bg-white text-xs font-medium text-[#191C22] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]/20 transition-all"
                          placeholder="DD MMM YYYY"
                        />
                        <Calendar className="w-4 h-4 text-[#94A3B8] absolute right-3 pointer-events-none" />
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#191C22]">Gender</label>
                      <div className="relative">
                        <select
                          value={prefs.profile.gender || 'Prefer not to say'}
                          onChange={(e) => {
                            setPrefs({
                              ...prefs,
                              profile: { ...prefs.profile, gender: e.target.value },
                            });
                            setIsDirty(true);
                          }}
                          className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-[#E7EAEE] bg-white text-xs font-medium text-[#191C22] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]/20 transition-all"
                        >
                          <option value="Prefer not to say">Prefer not to say</option>
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Non-binary">Non-binary</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Preferred Language */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#191C22]">Preferred Language</label>
                      <div className="relative">
                        <select
                          value={prefs.profile.preferredLanguage || 'English'}
                          onChange={(e) => {
                            setPrefs({
                              ...prefs,
                              profile: { ...prefs.profile, preferredLanguage: e.target.value },
                            });
                            setIsDirty(true);
                          }}
                          className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-[#E7EAEE] bg-white text-xs font-medium text-[#191C22] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]/20 transition-all"
                        >
                          <option value="English">English</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Hinglish">Hinglish</option>
                          <option value="Marathi">Marathi</option>
                          <option value="Bengali">Bengali</option>
                          <option value="Tamil">Tamil</option>
                          <option value="Telugu">Telugu</option>
                          <option value="Kannada">Kannada</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Preferred City */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#191C22]">Preferred City</label>
                      <div className="relative flex items-center">
                        <MapPin className="w-4 h-4 text-[#94A3B8] absolute left-3 pointer-events-none" />
                        <input
                          type="text"
                          value={prefs.profile.city || ''}
                          onChange={(e) => {
                            setPrefs({
                              ...prefs,
                              profile: { ...prefs.profile, city: e.target.value },
                            });
                            setIsDirty(true);
                          }}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E7EAEE] bg-white text-xs font-medium text-[#191C22] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]/20 transition-all"
                          placeholder="e.g. Mumbai, Delhi NCR, Bengaluru"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E7EAEE]">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#64748B] bg-[#F7F4EF] hover:bg-[#EAE4D9] border border-[#E7EAEE] transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#14B8A6] hover:bg-[#0D9488] active:scale-95 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? 'Syncing...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>

              {/* 3. Bottom Row: Account Information & Profile Completion */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Account Information Card */}
                <div className="bg-white rounded-2xl border border-[#E7EAEE] p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#191C22]">Account Information</h3>
                    <p className="text-xs text-[#94A3B8] mt-0.5">Your account details and status</p>
                  </div>

                  <div className="mt-5 space-y-3.5 divide-y divide-[#F1F3F5]">
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-[#64748B]">Account Status</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {prefs.profile.accountStatus || 'Active'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs text-[#64748B]">Member Since</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#191C22]">
                        <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                        {prefs.profile.memberSince || 'Active Member'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs text-[#64748B]">Account Type</span>
                      <span className="text-xs font-semibold text-[#191C22]">
                        {prefs.profile.accountType || 'Customer'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs text-[#64748B]">User ID</span>
                      <span className="text-xs font-mono font-bold text-[#64748B]">
                        {prefs.profile.userId || (user?.id ? `#${user.id.slice(0, 8).toUpperCase()}` : '#USR')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs text-[#64748B]">Last Login</span>
                      <span className="text-xs font-medium text-[#64748B]">
                        {prefs.profile.lastLogin || 'Active session'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile Completion Card */}
                <div className="bg-white rounded-2xl border border-[#E7EAEE] p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#191C22]">Profile Completion</h3>
                    <p className="text-xs text-[#94A3B8] mt-0.5">Complete your profile to get better recommendations</p>
                  </div>

                  {/* Circular Meter + Headline */}
                  <div className="flex items-center gap-4 mt-5 p-3.5 rounded-xl bg-[#F5F7F9] border border-[#EBE4DA]">
                    {/* SVG Circular Ring */}
                    <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                      <svg className="w-14 h-14 transform -rotate-90">
                        <circle
                          cx="28"
                          cy="28"
                          r={radius}
                          stroke="#E5DDD2"
                          strokeWidth="5"
                          fill="transparent"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r={radius}
                          stroke="#14B8A6"
                          strokeWidth="5"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-700 ease-out"
                        />
                      </svg>
                      <span className="absolute text-xs font-black text-[#191C22]">
                        {completionPercent}%
                      </span>
                    </div>

                    {/* Copy text */}
                    <div>
                      <h4 className="text-xs font-bold text-[#191C22]">Almost there!</h4>
                      <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                        Complete your profile to get personalized recommendations and connect with the best photographers.
                      </p>
                    </div>
                  </div>

                  {/* 2-Column Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-[#E7EAEE]">
                    {completionItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        {item.completed ? (
                          <span className="w-4 h-4 rounded-full bg-[#14B8A6] text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded-full border-2 border-[#D5CEC4] shrink-0" />
                        )}
                        <span
                          className={`text-xs ${
                            item.completed ? 'text-[#191C22] font-medium' : 'text-[#94A3B8]'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOGIN & SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#191C22]">Login & Security</h1>
                <p className="text-xs text-[#64748B] mt-1">Manage password credentials and active browser sessions</p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-[#E7EAEE] shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E7EAEE]">
                  <div>
                    <h3 className="text-sm font-bold text-[#191C22]">Account Password</h3>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Last modified {prefs.security.lastPasswordChange}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#191C22] bg-[#F7F4EF] hover:bg-[#EAE4D9] border border-[#E7EAEE] transition-all"
                  >
                    Change Password
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E7EAEE]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#191C22]">Two-Factor Authentication (2FA)</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Receive an SMS OTP code on your verified mobile phone whenever you log in.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.security.twoFactorEnabled}
                      onChange={(e) => {
                        const updated = {
                          ...prefs,
                          security: { ...prefs.security, twoFactorEnabled: e.target.checked },
                        };
                        setPrefs(updated);
                        saveCustomerPreferences(updated);
                        setStatusMessage(`Two-Factor Authentication ${e.target.checked ? 'enabled' : 'disabled'}.`);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#D5CEC4] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#14B8A6]"></div>
                  </label>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#191C22] mb-3">Active Device Sessions</h3>
                  <div className="space-y-3">
                    {prefs.security.activeSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-3.5 rounded-xl border border-[#E7EAEE] bg-[#F5F7F9] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-4 h-4 text-[#94A3B8]" />
                          <div>
                            <p className="text-xs font-bold text-[#191C22]">
                              {session.device} • {session.browser}
                            </p>
                            <p className="text-[11px] text-[#94A3B8]">
                              {session.location} ({session.ipMasked}) — {session.lastActive}
                            </p>
                          </div>
                        </div>
                        {session.isCurrent ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Current Device
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = {
                                ...prefs,
                                security: {
                                  ...prefs.security,
                                  activeSessions: prefs.security.activeSessions.filter((s) => s.id !== session.id),
                                },
                              };
                              setPrefs(updated);
                              saveCustomerPreferences(updated);
                            }}
                            className="text-[11px] font-bold text-red-600 hover:underline"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#191C22]">Notifications</h1>
                <p className="text-xs text-[#64748B] mt-1">Configure SMS alerts, WhatsApp shoot milestones, and receipts</p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-[#E7EAEE] shadow-sm divide-y divide-[#E7EAEE]">
                {[
                  {
                    key: 'smsMilestones' as const,
                    title: 'SMS Shoot Milestones',
                    desc: 'Receive immediate SMS when your booked photographer arrives and for OTP handshakes.',
                  },
                  {
                    key: 'whatsappTransit' as const,
                    title: 'WhatsApp Live Location & Transit',
                    desc: 'Track live ETA on WhatsApp 30 minutes before your scheduled shoot time.',
                  },
                  {
                    key: 'emailReceipts' as const,
                    title: 'Email GST Invoices & Receipts',
                    desc: 'Receive detailed PDF payment receipts and escrow transaction logs on your verified email.',
                  },
                  {
                    key: 'galleryReadyAlerts' as const,
                    title: 'Delivery & Gallery Ready Alerts',
                    desc: 'Immediate notifications once your final edited photographs and RAW files are uploaded.',
                  },
                  {
                    key: 'promotionalOffers' as const,
                    title: 'Special Photography Packages & Discounts',
                    desc: 'Occasional seasonal festival shoot promotions and loyalty discounts.',
                  },
                ].map((item) => (
                  <div key={item.key} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-[#191C22]">{item.title}</h4>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={prefs.notifications[item.key]}
                        onChange={(e) => {
                          const updated = {
                            ...prefs,
                            notifications: {
                              ...prefs.notifications,
                              [item.key]: e.target.checked,
                            },
                          };
                          setPrefs(updated);
                          saveCustomerPreferences(updated);
                          setStatusMessage(`Notification preference updated.`);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-[#D5CEC4] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#14B8A6]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BOOKING PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#191C22]">Booking Preferences</h1>
                <p className="text-xs text-[#64748B] mt-1">Customize photoshoot styles, genres, and RAW deliverables</p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-[#E7EAEE] shadow-sm space-y-6">
                <div>
                  <label className="text-xs font-bold text-[#191C22]">Preferred Photography Genres</label>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">Select styles you book most frequently</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {['Portraits', 'Events', 'Couple Shoots', 'Creator Reels', 'Product', 'Fashion', 'Wedding'].map(
                      (genre) => {
                        const isSelected = prefs.bookingPreferences.preferredGenres.includes(genre);
                        return (
                          <button
                            key={genre}
                            type="button"
                            onClick={() => {
                              const updatedGenres = isSelected
                                ? prefs.bookingPreferences.preferredGenres.filter((g) => g !== genre)
                                : [...prefs.bookingPreferences.preferredGenres, genre];
                              const updated = {
                                ...prefs,
                                bookingPreferences: {
                                  ...prefs.bookingPreferences,
                                  preferredGenres: updatedGenres,
                                },
                              };
                              setPrefs(updated);
                              saveCustomerPreferences(updated);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                              isSelected
                                ? 'bg-[#14B8A6] text-white shadow-xs'
                                : 'bg-[#F5F7F9] text-[#64748B] border border-[#E7EAEE] hover:bg-[#F1F3F5]'
                            }`}
                          >
                            {genre}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E7EAEE]">
                  <label className="text-xs font-bold text-[#191C22]">Preferred Shoot Aesthetic</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    {(['natural', 'studio', 'candid', 'editorial'] as const).map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...prefs,
                            bookingPreferences: { ...prefs.bookingPreferences, shootStyle: style },
                          };
                          setPrefs(updated);
                          saveCustomerPreferences(updated);
                        }}
                        className={`p-3 rounded-xl border text-center capitalize text-xs font-bold transition-all ${
                          prefs.bookingPreferences.shootStyle === style
                            ? 'border-[#14B8A6] bg-[#FFF4EB] text-[#14B8A6]'
                            : 'border-[#E7EAEE] bg-white text-[#64748B] hover:bg-[#F5F7F9]'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E7EAEE] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#191C22]">Receive High-Res RAW Previews</h4>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      Request photographers provide uncompressed color profiles alongside processed JPEG photos.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.bookingPreferences.receiveRawPreviews}
                      onChange={(e) => {
                        const updated = {
                          ...prefs,
                          bookingPreferences: {
                            ...prefs.bookingPreferences,
                            receiveRawPreviews: e.target.checked,
                          },
                        };
                        setPrefs(updated);
                        saveCustomerPreferences(updated);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-[#D5CEC4] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#14B8A6]"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SAVED LOCATIONS */}
          {activeTab === 'locations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#191C22]">Saved Locations</h1>
                  <p className="text-xs text-[#64748B] mt-1">Manage favorite venues and studios for 1-click booking</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#14B8A6] hover:bg-[#0D9488] shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Venue</span>
                </button>
              </div>

              {prefs.savedLocations.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-dashed border-[#E7EAEE] text-center space-y-3">
                  <MapPin className="w-8 h-8 text-[#94A3B8] mx-auto" />
                  <h4 className="text-sm font-bold text-[#191C22]">No Saved Venues Yet</h4>
                  <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                    Save your home studio, terrace, or favorite shoot location for 1-click booking with photographers.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#14B8A6] hover:bg-[#0D9488] shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Add Your First Venue</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prefs.savedLocations.map((loc) => (
                    <div
                      key={loc.id}
                      className="p-5 bg-white rounded-2xl border border-[#E7EAEE] shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#14B8A6]" />
                            <h4 className="text-xs font-bold text-[#191C22]">{loc.label}</h4>
                          </div>
                          {loc.isDefault && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F7F9] text-[#94A3B8] border border-[#E7EAEE]">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#64748B] mt-2 leading-relaxed">{loc.address}</p>
                        {loc.instructions && (
                          <p className="text-[11px] text-[#94A3B8] mt-1 italic">Note: {loc.instructions}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-[#E7EAEE]">
                        <button
                          type="button"
                          onClick={() => handleDeleteLocation(loc.id)}
                          className="text-[11px] font-bold text-red-600 hover:text-red-700 p-1 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PAYMENT METHODS */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#191C22]">Payment Methods</h1>
                  <p className="text-xs text-[#64748B] mt-1">Manage UPI IDs, credit cards, and 100% escrow protection</p>
                </div>
                <Link
                  href="/customer/payments"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#14B8A6] hover:underline"
                >
                  <span>Payments & Escrow Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-[#E7EAEE] shadow-sm space-y-5">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900">REEPY 100% Escrow Protection</h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                      All booking deposits remain securely locked in platform escrow until you meet your photographer
                      at the venue and verify the shoot handshake OTP.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-[#E7EAEE] bg-[#F5F7F9] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-[#14B8A6]" />
                      <div>
                        <p className="text-xs font-bold text-[#191C22]">Razorpay Payment & Escrow Gateway</p>
                        <p className="text-[11px] text-[#94A3B8]">UPI, Cards, NetBanking &amp; Wallets enabled for shoot bookings</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Operational
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-dashed border-[#E7EAEE] bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-[#94A3B8]" />
                      <div>
                        <p className="text-xs font-bold text-[#191C22]">Checkout-Linked Payment Methods</p>
                        <p className="text-[11px] text-[#94A3B8]">Payment accounts and UPI handles are secured during reservation checkouts</p>
                      </div>
                    </div>
                    <Link
                      href="/customer/payments"
                      className="text-[11px] font-bold text-[#14B8A6] hover:underline"
                    >
                      View Escrow History →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: MY BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#191C22]">My Bookings</h1>
                  <p className="text-xs text-[#64748B] mt-1">Review active and completed photography reservations</p>
                </div>
                <Link
                  href="/customer/bookings"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#14B8A6] hover:bg-[#0D9488] shadow-sm transition-all"
                >
                  Open Full Bookings Portal
                </Link>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-[#E7EAEE] shadow-sm text-center py-10 space-y-3">
                <CalendarCheck className="w-10 h-10 text-[#14B8A6] mx-auto" />
                <h3 className="text-base font-bold text-[#191C22]">Active Photography Shoots</h3>
                <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                  You can track shoot arrival, OTP handshakes, photo deliveries, and photographer chats in the Bookings
                  management center.
                </p>
                <div className="pt-2">
                  <Link
                    href="/customer/bookings"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#14B8A6] hover:bg-[#0D9488] shadow-sm transition-all"
                  >
                    <span>View All Bookings</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: PRIVACY & DATA */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#191C22]">Privacy & Data</h1>
                <p className="text-xs text-[#64748B] mt-1">Control phone number masking, gallery access, and GDPR export</p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-[#E7EAEE] shadow-sm divide-y divide-[#E7EAEE]">
                <div className="pb-5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-[#191C22]">Mask Mobile Number Until Booking Confirmation</h4>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      Keep your real contact number confidential until you confirm a shoot reservation.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={prefs.privacy.maskPhoneUntilConfirmed}
                      onChange={(e) => {
                        const updated = {
                          ...prefs,
                          privacy: { ...prefs.privacy, maskPhoneUntilConfirmed: e.target.checked },
                        };
                        setPrefs(updated);
                        saveCustomerPreferences(updated);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-[#D5CEC4] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#14B8A6]"></div>
                  </label>
                </div>

                <div className="py-5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-[#191C22]">Private Password-Protected Photo Deliveries</h4>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      Ensure your delivered shoot links are locked behind an OTP code.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={prefs.privacy.privateGalleries}
                      onChange={(e) => {
                        const updated = {
                          ...prefs,
                          privacy: { ...prefs.privacy, privateGalleries: e.target.checked },
                        };
                        setPrefs(updated);
                        saveCustomerPreferences(updated);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-[#D5CEC4] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#14B8A6]"></div>
                  </label>
                </div>

                <div className="pt-5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-[#191C22]">Download Personal Data Archive</h4>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      Export a JSON package containing your profile, bookings history, and saved locations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#191C22] bg-[#F7F4EF] hover:bg-[#EAE4D9] border border-[#E7EAEE] transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExporting ? 'Generating...' : 'Export JSON'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: LANGUAGE & ACCESSIBILITY */}
          {activeTab === 'language' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#191C22]">Language & Accessibility</h1>
                <p className="text-xs text-[#64748B] mt-1">Configure portal language, font readability, and regional settings</p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-[#E7EAEE] shadow-sm space-y-6">
                <div className="space-y-1.5 max-w-sm">
                  <label className="text-xs font-bold text-[#191C22]">Interface Language</label>
                  <select
                    value={prefs.profile.preferredLanguage}
                    onChange={(e) => {
                      const updated = {
                        ...prefs,
                        profile: { ...prefs.profile, preferredLanguage: e.target.value },
                      };
                      setPrefs(updated);
                      saveCustomerPreferences(updated);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAEE] bg-white text-xs font-medium text-[#191C22] focus:outline-none focus:border-[#14B8A6]"
                  >
                    <option value="English">English (India)</option>
                    <option value="Hindi">हिन्दी (Hindi)</option>
                    <option value="Marathi">मराठी (Marathi)</option>
                    <option value="Bengali">বাংলা (Bengali)</option>
                    <option value="Tamil">தமிழ் (Tamil)</option>
                    <option value="Telugu">తెలుగు (Telugu)</option>
                    <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-[#E7EAEE] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#191C22]">High Contrast Typography Mode</h4>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">Enhance visual text boundaries and borders</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    WCAG AAA Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: HELP & SUPPORT */}
          {activeTab === 'support' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#191C22]">Help & Support</h1>
                <p className="text-xs text-[#64748B] mt-1">Get 24/7 client concierge support, shoot dispute assistance, and FAQs</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-white rounded-2xl border border-[#E7EAEE] shadow-sm space-y-2">
                  <h4 className="text-xs font-bold text-[#191C22]">Platform Support Helpline</h4>
                  <p className="text-xs text-[#64748B]">
                    Email: <span className="font-semibold text-[#191C22]">support@snapshoot.in</span>
                  </p>
                  <p className="text-xs text-[#64748B]">
                    Phone: <span className="font-semibold text-[#191C22]">+91 1800 200 4829</span> (Toll-Free)
                  </p>
                  <p className="text-[11px] text-[#94A3B8] pt-1">Mon - Sun: 7:00 AM - 11:00 PM IST</p>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-[#E7EAEE] shadow-sm space-y-2">
                  <h4 className="text-xs font-bold text-[#191C22]">Frequently Asked Questions</h4>
                  <ul className="text-xs text-[#64748B] space-y-1.5 list-disc pl-4">
                    <li>How does the OTP shoot handshake work?</li>
                    <li>What is the platform cancellation policy?</li>
                    <li>When are edited photo galleries delivered?</li>
                  </ul>
                  <div className="pt-2">
                    <Link href="/how-it-works" className="text-xs font-bold text-[#14B8A6] hover:underline">
                      Read Complete FAQ Guide →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: ACCOUNT MANAGEMENT */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#191C22]">Account Management</h1>
                <p className="text-xs text-[#64748B] mt-1">Manage platform account ownership and data controls</p>
              </div>

              {/* DEDICATED ACCOUNT ACTIONS CARD */}
              <div className="p-6 bg-white rounded-2xl border border-[#E7EAEE] shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">
                      Account Actions
                    </span>
                    <h3 className="text-sm font-bold text-[#191C22] mt-0.5">Session Log Out</h3>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Safely sign out of your REEPY account on this browser.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLogoutModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] shadow-sm transition-all shrink-0 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-[#E7EAEE] shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E7EAEE]">
                  <div>
                    <h3 className="text-sm font-bold text-[#191C22]">Sign Out from All Devices</h3>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Immediately invalidate active login sessions across all browsers and phones.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setStatusMessage('Signed out of all devices.');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#191C22] bg-[#F7F4EF] hover:bg-[#EAE4D9] border border-[#E7EAEE] transition-all"
                  >
                    Sign Out Everywhere
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-red-900">Danger Zone: Delete Account</h4>
                    <p className="text-[11px] text-red-700 mt-0.5">
                      Permanently delete your REEPY profile, shoot history, and saved locations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all shrink-0"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: CHANGE PASSWORD */}
      {/* ========================================================= */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Account Password"
      >
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          {passwordError && (
            <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
              Password updated successfully!
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#191C22]">Current Password (Optional if signed in with Google/OTP)</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#D5CEC4] rounded-xl text-xs outline-none focus:border-[#14B8A6]"
              placeholder="Leave blank if using Google or OTP"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#191C22]">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#D5CEC4] rounded-xl text-xs outline-none focus:border-[#14B8A6]"
              placeholder="At least 8 characters"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#191C22]">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#D5CEC4] rounded-xl text-xs outline-none focus:border-[#14B8A6]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7EAEE]">
            <Button variant="secondary" size="sm" onClick={() => setIsPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isUpdatingPassword}>
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: ADD LOCATION */}
      {/* ========================================================= */}
      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        title="Add Favorite Shoot Venue"
      >
        <form onSubmit={handleAddLocation} className="space-y-4">
          {locationError && (
            <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200">
              {locationError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#191C22]">Venue Label *</label>
            <input
              type="text"
              required
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#D5CEC4] rounded-xl text-xs outline-none focus:border-[#14B8A6]"
              placeholder="e.g. Bandra Bandstand / Home Studio"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#191C22]">Complete Street Address *</label>
            <textarea
              required
              rows={2}
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#D5CEC4] rounded-xl text-xs outline-none focus:border-[#14B8A6]"
              placeholder="Flat 402, Sea Green Apartments, Bandra West, Mumbai 400050"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#191C22]">City Hub</label>
            <input
              type="text"
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#D5CEC4] rounded-xl text-xs outline-none focus:border-[#14B8A6]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#191C22]">Special Access Instructions (Optional)</label>
            <input
              type="text"
              value={locationInstructions}
              onChange={(e) => setLocationInstructions(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#D5CEC4] rounded-xl text-xs outline-none focus:border-[#14B8A6]"
              placeholder="e.g. Intercom 402, visitor parking available"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7EAEE]">
            <Button variant="secondary" size="sm" onClick={() => setIsLocationModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Location
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: DELETE ACCOUNT */}
      {/* ========================================================= */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Account Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#64748B] leading-relaxed">
            This action is permanent and cannot be undone. To confirm, type{' '}
            <strong className="text-red-600">DELETE MY ACCOUNT</strong> below:
          </p>

          {deleteError && (
            <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200">
              {deleteError}
            </div>
          )}

          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className="w-full p-2.5 bg-white border border-[#D5CEC4] rounded-xl text-xs font-mono outline-none focus:border-red-500"
            placeholder="DELETE MY ACCOUNT"
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7EAEE]">
            <Button variant="secondary" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <button
              type="button"
              disabled={isDeletingAccount}
              onClick={handleDeleteAccount}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all disabled:opacity-50"
            >
              {isDeletingAccount ? 'Permanently Deleting...' : 'Permanently Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 4: CONFIRM LOG OUT */}
      {/* ========================================================= */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Log Out"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#64748B] leading-relaxed">
            Are you sure you want to log out of your REEPY account? You will be returned to the public homepage and will need to sign in again to manage your bookings and settings.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7EAEE]">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsLogoutModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Log Out
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
