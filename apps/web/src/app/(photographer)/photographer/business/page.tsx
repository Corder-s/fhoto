'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  User,
  Camera,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Star,
  ExternalLink,
  Save,
  RotateCcw,
  AlertCircle,
  Sparkles,
  Clock,
  Layers,
  Award,
  Languages,
  Loader2,
  Package,
  Image as ImageIcon,
  ChevronRight,
  UploadCloud,
  Plus,
  Trash2,
  Check,
  Eye,
  X
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { useCurrentUserProfile } from '../../../../context/UserProfileContext';

export default function PhotographerBusinessPage() {
  const {
    authUser,
    profile,
    creatorProfile,
    accountName,
    professionalName,
    displayAvatar,
    initials,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    refreshProfile,
    loading: isContextLoading,
  } = useCurrentUserProfile();

  // Active Guided Step (1 through 8)
  const [activeStep, setActiveStep] = useState<number>(1);

  // Avatar Upload State
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarToast, setAvatarToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Banner State
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [currentBanner, setCurrentBanner] = useState<string | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerToast, setBannerToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields (Step 1: Basic Identity)
  const [accountFullName, setAccountFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [city, setCity] = useState('Delhi NCR');
  const [stateName, setStateName] = useState('Delhi');
  const [bio, setBio] = useState('');

  // Step 2: Photography Specialties
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([
    'Portrait',
    'Couple & Wedding',
    'Reels & Creator',
    'Events',
  ]);

  // Step 3: Packages & Services (Loaded from real DB)
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [newPkgTitle, setNewPkgTitle] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState('4999');
  const [newPkgDurationHours, setNewPkgDurationHours] = useState('2');
  const [newPkgDesc, setNewPkgDesc] = useState('');
  const [isSavingPackage, setIsSavingPackage] = useState(false);

  // Step 5: Portfolio quick preview
  const [portfolioCount, setPortfolioCount] = useState(0);

  // Step 6: Professional Info
  const [experienceYears, setExperienceYears] = useState('2');
  const [cameraGear, setCameraGear] = useState('Sony A7IV, 24-70mm f/2.8 GM, DJI RS3');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English', 'Hindi']);
  const [portfolioWebUrl, setPortfolioWebUrl] = useState('');

  // Step 7: Availability & Travel Pricing Settings
  const [baseAddress, setBaseAddress] = useState('Connaught Place, New Delhi');
  const [includedTravelKm, setIncludedTravelKm] = useState('10');
  const [travelFeePerKm, setTravelFeePerKm] = useState('20');
  const [minTravelFee, setMinTravelFee] = useState('0');
  const [serviceRadius, setServiceRadius] = useState('50');
  const [allowOutOfArea, setAllowOutOfArea] = useState(true);

  // Status & Draft tracking
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Load Services and Portfolio counts
  const loadRelatedStudioData = async () => {
    try {
      setIsLoadingServices(true);
      const [srvRes, portRes] = await Promise.all([
        fetch('/api/photographers/services').catch(() => null),
        fetch('/api/photographers/portfolio').catch(() => null),
      ]);

      if (srvRes && srvRes.ok) {
        const sData = await srvRes.json();
        if (sData.services) setDbServices(sData.services);
      }
      if (portRes && portRes.ok) {
        const pData = await portRes.json();
        if (pData.items) setPortfolioCount(pData.items.length);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingServices(false);
    }
  };

  useEffect(() => {
    loadRelatedStudioData();
  }, []);

  // Synchronize state when creatorProfile loads from Supabase
  useEffect(() => {
    if (profile || creatorProfile) {
      setAccountFullName(profile?.full_name || accountName || '');
      setBusinessName(creatorProfile?.professional_name || professionalName || '');
      setCity(creatorProfile?.city || 'Delhi NCR');
      setStateName(creatorProfile?.state || 'Delhi');
      setBio(creatorProfile?.biography || '');
      setExperienceYears(String(creatorProfile?.experience_years || 2));
      setBaseAddress(creatorProfile?.base_address || 'Connaught Place, New Delhi');
      setIncludedTravelKm(String(creatorProfile?.included_travel_km ?? 10));
      setTravelFeePerKm(String(creatorProfile?.travel_fee_per_km ?? 20));
      setMinTravelFee(String(creatorProfile?.min_travel_fee ?? 0));
      setServiceRadius(String(creatorProfile?.service_radius || 50));
      setAllowOutOfArea(creatorProfile?.allow_out_of_area ?? true);
      setPortfolioWebUrl(creatorProfile?.portfolio_url || '');
      if (creatorProfile?.cover_image_url) {
        setCurrentBanner(creatorProfile.cover_image_url);
      }
    }
  }, [profile, creatorProfile, accountName, professionalName]);

  // Avatar Upload Handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setAvatarToast(null);

    try {
      const res = await uploadAvatar(file);
      if (res.success) {
        setAvatarToast({ type: 'success', text: 'Profile picture updated successfully.' });
        await refreshProfile();
        setTimeout(() => setAvatarToast(null), 4000);
      } else {
        setAvatarToast({ type: 'error', text: res.error || 'Failed to upload photo.' });
      }
    } catch (err: any) {
      setAvatarToast({ type: 'error', text: err.message || 'Error uploading photo.' });
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // Banner Upload Handler
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|gif|jpg)$/i)) {
      setBannerToast({ type: 'error', text: 'Please select a JPG, PNG, or WebP image.' });
      return;
    }

    setIsUploadingBanner(true);
    setBannerToast(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/photographers/banner', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentBanner(data.bannerUrl);
        setBannerToast({ type: 'success', text: 'Studio cover banner updated successfully!' });
        await refreshProfile();
        setTimeout(() => setBannerToast(null), 4000);
      } else {
        setBannerToast({ type: 'error', text: data.error || 'Failed to update cover banner.' });
      }
    } catch (err: any) {
      setBannerToast({ type: 'error', text: err.message || 'Network error uploading banner.' });
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  // Remove Banner Handler
  const handleRemoveBanner = async () => {
    setIsUploadingBanner(true);
    try {
      const res = await fetch('/api/photographers/banner', { method: 'DELETE' });
      if (res.ok) {
        setCurrentBanner(null);
        setBannerToast({ type: 'success', text: 'Cover banner removed.' });
        await refreshProfile();
        setTimeout(() => setBannerToast(null), 3000);
      }
    } catch {
      setBannerToast({ type: 'error', text: 'Could not remove banner.' });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Create Package Handler
  const handleCreatePackage = async () => {
    if (!newPkgTitle.trim()) {
      alert('Package title is required.');
      return;
    }

    const price = Number(newPkgPrice) || 2999;
    const durHours = Number(newPkgDurationHours) || 2;

    try {
      setIsSavingPackage(true);
      const res = await fetch('/api/photographers/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser?.id,
          creatorId: creatorProfile?.id,
          title: newPkgTitle.trim(),
          basePrice: price,
          durationMinutes: durHours * 60,
          deliveryTimeHours: 48,
          description: newPkgDesc.trim() || 'Color-graded high-resolution deliverables and private online client gallery.',
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.service) {
        throw new Error(data.error || 'Failed to create package.');
      }

      setDbServices((prev) => [data.service, ...prev]);
      setShowAddPackageModal(false);
      setNewPkgTitle('');
      setNewPkgDesc('');
    } catch (err: any) {
      alert(err.message || 'Failed to save package.');
    } finally {
      setIsSavingPackage(false);
    }
  };

  // Toggle Specialty chip
  const toggleSpecialty = (spec: string) => {
    setIsDirty(true);
    if (selectedSpecialties.includes(spec)) {
      if (selectedSpecialties.length === 1) return;
      setSelectedSpecialties(selectedSpecialties.filter((s) => s !== spec));
    } else {
      setSelectedSpecialties([...selectedSpecialties, spec]);
    }
  };

  // Toggle Language chip
  const toggleLanguage = (lang: string) => {
    setIsDirty(true);
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length === 1) return;
      setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  // Save Studio Profile
  const handleSaveProfile = async (asDraft = false) => {
    setErrorMessage('');

    if (!accountFullName.trim()) {
      setErrorMessage('Account owner full name cannot be blank.');
      setActiveStep(1);
      return;
    }
    if (!businessName.trim()) {
      setErrorMessage('Professional studio display name cannot be blank.');
      setActiveStep(1);
      return;
    }

    try {
      setIsSaving(true);
      const res = await updateProfile({
        profileData: {
          fullName: accountFullName.trim(),
        },
        creatorData: {
          professionalName: businessName.trim(),
          city: city.trim() || 'Delhi NCR',
          state: stateName.trim() || 'Delhi',
          biography: bio.trim(),
          experienceYears: Number(experienceYears) || 1,
          portfolioUrl: portfolioWebUrl.trim() || null,
          baseAddress: baseAddress.trim() || city.trim(),
          includedTravelKm: Number(includedTravelKm) || 10,
          travelFeePerKm: Number(travelFeePerKm) || 20,
          minTravelFee: Number(minTravelFee) || 0,
          serviceRadius: Number(serviceRadius) || 50,
          allowOutOfArea,
        },
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to save studio profile.');
      }

      setSaveSuccess(true);
      setIsDirty(false);
      setLastSavedTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      await refreshProfile();
      setTimeout(() => setSaveSuccess(false), 4500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset Changes
  const handleDiscardChanges = () => {
    if (!confirm('Discard all unsaved changes and reset to last saved state?')) return;
    setAccountFullName(profile?.full_name || accountName);
    setBusinessName(creatorProfile?.professional_name || professionalName);
    setCity(creatorProfile?.city || 'Delhi NCR');
    setBio(creatorProfile?.biography || '');
    setExperienceYears(String(creatorProfile?.experience_years || 2));
    setBaseAddress(creatorProfile?.base_address || 'Connaught Place, New Delhi');
    setIncludedTravelKm(String(creatorProfile?.included_travel_km ?? 10));
    setTravelFeePerKm(String(creatorProfile?.travel_fee_per_km ?? 20));
    setMinTravelFee(String(creatorProfile?.min_travel_fee ?? 0));
    setServiceRadius(String(creatorProfile?.service_radius || 50));
    setAllowOutOfArea(creatorProfile?.allow_out_of_area ?? true);
    setIsDirty(false);
    setErrorMessage('');
  };

  const allSpecialtyOptions = [
    'Portrait',
    'Couple & Wedding',
    'Reels & Creator',
    'Fashion & Editorial',
    'Commercial',
    'Product & Culinary',
    'Architecture & Interior',
    'Events & Galas',
    'Family & Maternity',
  ];

  const allLanguageOptions = ['English', 'Hindi', 'Punjabi', 'Bengali', 'Gujarati', 'Marathi'];

  const publicUrl = creatorProfile?.id
    ? `/photographers/${creatorProfile.id}`
    : '/photographer/business';

  const stepsList = [
    { number: 1, title: 'Basic Identity', desc: 'Display name & bio' },
    { number: 2, title: 'Specialties', desc: 'Photography categories' },
    { number: 3, title: 'Services & Pricing', desc: `${dbServices.length} packages` },
    { number: 4, title: 'Cover Banner', desc: currentBanner ? 'Active' : 'Unset' },
    { number: 5, title: 'Portfolio Gallery', desc: `${portfolioCount} photos` },
    { number: 6, title: 'Professional Info', desc: `${experienceYears}y exp, gear` },
    { number: 7, title: 'Travel & Pricing Rules', desc: `${serviceRadius}km radius` },
    { number: 8, title: 'Preview & Verification', desc: creatorProfile?.verification_status || 'Draft' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      {/* ------------------------------------------------------------- */}
      {/* PAGE HEADER & QUICK ACTIONS                                   */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#14B8A6]/10 text-[#0D9488]">
              Creator Studio
            </span>
            <span className="text-xs text-slate-400 font-medium">· Profile Editor &amp; Publisher</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Studio Profile &amp; Business Presence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Configure your verified identity, specialties, packages, cover hero, and travel pricing rules synced with PostgreSQL.
          </p>
        </div>

        {/* Global Save / Discard Bar */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isDirty && (
            <button
              onClick={handleDiscardChanges}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard</span>
            </button>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={() => handleSaveProfile(false)}
            disabled={isSaving}
            leftIcon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            className="bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold shadow-sm"
          >
            {isSaving ? 'Saving...' : 'Save Profile Changes'}
          </Button>

          <Link
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
            title="Preview live public profile"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Notifications and Alerts */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Studio profile saved successfully! Changes are live across your workspace and marketplace profile.</span>
          </div>
          {lastSavedTimestamp && (
            <span className="text-[11px] font-normal text-emerald-600">Saved at {lastSavedTimestamp}</span>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 8-STEP GUIDED WORKFLOW TAB BAR                                */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200 p-2 sm:p-3 shadow-2xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {stepsList.map((step) => {
            const isActive = activeStep === step.number;
            return (
              <button
                key={step.number}
                onClick={() => setActiveStep(step.number)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#14B8A6] text-white shadow-xs font-bold'
                    : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {step.number}
                </div>
                <div className="pr-1">
                  <p className="text-xs font-bold leading-tight">{step.title}</p>
                  <p className={`text-[10px] ${isActive ? 'text-teal-100' : 'text-slate-400'}`}>
                    {step.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* STEP CONTENT CONTAINERS                                       */}
      {/* ------------------------------------------------------------- */}

      {/* STEP 1: BASIC IDENTITY */}
      {activeStep === 1 && (
        <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900">Step 1 — Basic Identity &amp; Profile Picture</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              These details establish your identity on the REEPY marketplace and public directory.
            </p>
          </div>

          {/* Profile Avatar section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] text-white flex items-center justify-center text-2xl font-black shadow-md border-2 border-white shrink-0 relative">
              <span>{initials}</span>
              {displayAvatar && (
                <img
                  src={displayAvatar}
                  alt={businessName || accountName}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-[#14B8A6]" />
                </div>
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">Profile Photo (Avatar)</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Clear, professional headshot or studio branding mark. JPG, PNG, or WebP under 5MB.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
                  className="bg-white border-slate-300 text-xs font-bold"
                >
                  {isUploadingAvatar ? 'Uploading...' : 'Change Photo'}
                </Button>
                {displayAvatar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (confirm('Remove profile avatar?')) {
                        await removeAvatar();
                        await refreshProfile();
                      }
                    }}
                    className="text-xs text-rose-600 hover:bg-rose-50"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          {avatarToast && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                avatarToast.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{avatarToast.text}</span>
            </div>
          )}

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Professional Display Name *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Sujal Garg Photography"
                className="w-full px-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20 transition-all"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Shown as your studio brand name</span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Account Holder Full Name *
              </label>
              <input
                type="text"
                value={accountFullName}
                onChange={(e) => {
                  setAccountFullName(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Sujal Garg"
                className="w-full px-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20 transition-all"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Legal account holder identity</span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Primary Hub City *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Delhi NCR"
                className="w-full px-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                State / Region
              </label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => {
                  setStateName(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Delhi"
                className="w-full px-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20 transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Professional Studio Biography
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Introduce yourself, your camera style, lighting techniques, and the story you love to capture for clients..."
                className="w-full px-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20 transition-all"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">{bio.length}/2000 characters</span>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              variant="primary"
              size="md"
              onClick={() => setActiveStep(2)}
              className="bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold"
            >
              Continue to Step 2 →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: PHOTOGRAPHY SPECIALTIES */}
      {activeStep === 2 && (
        <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900">Step 2 — Photography Specialties</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the creative categories you specialize in to receive matched client inquiries.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {allSpecialtyOptions.map((spec) => {
              const isSelected = selectedSpecialties.includes(spec);
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpecialty(spec)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-teal-50/70 border-[#14B8A6] text-slate-900 shadow-2xs font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold">{spec}</span>
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="secondary" size="md" onClick={() => setActiveStep(1)}>
              ← Back to Step 1
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setActiveStep(3)}
              className="bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold"
            >
              Continue to Step 3 →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: SERVICES & PRICING */}
      {activeStep === 3 && (
        <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">Step 3 — Services &amp; Packages</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your shoot deliverables, base prices, and delivery turnaround times.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddPackageModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold"
            >
              Add New Package
            </Button>
          </div>

          {isLoadingServices ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#14B8A6]" />
            </div>
          ) : dbServices.length === 0 ? (
            <div className="py-8 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
              <Package className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-800">No photography packages configured yet</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Clients book creators through published packages. Add at least one base shoot package.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddPackageModal(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="bg-[#14B8A6] text-white font-bold mt-2"
              >
                Create First Package
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dbServices.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-[#14B8A6] transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{pkg.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        ⏱️ {Math.round((pkg.duration_minutes || 60) / 60)} Hours • Delivery in {pkg.delivery_time_hours || 48}h
                      </p>
                    </div>
                    <span className="text-base font-black text-[#0D9488]">
                      ₹{Number(pkg.base_price).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{pkg.description}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="secondary" size="md" onClick={() => setActiveStep(2)}>
              ← Back to Step 2
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setActiveStep(4)}
              className="bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold"
            >
              Continue to Step 4 →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: COVER BANNER */}
      {activeStep === 4 && (
        <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">Step 4 — Studio Cover Banner</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                High-resolution hero banner displayed at the top of your public photographer profile.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleBannerUpload}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => bannerInputRef.current?.click()}
                disabled={isUploadingBanner}
                leftIcon={isUploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                className="bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold"
              >
                {isUploadingBanner ? 'Uploading...' : currentBanner ? 'Replace Banner' : 'Upload Banner'}
              </Button>
              {currentBanner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveBanner}
                  disabled={isUploadingBanner}
                  className="text-xs text-rose-600 hover:bg-rose-50"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>

          {bannerToast && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                bannerToast.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{bannerToast.text}</span>
            </div>
          )}

          {/* Banner Preview Canvas */}
          <div className="relative h-48 sm:h-64 w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentBanner || '/reference-assets/seller_banner_photographer.jpg'}
              alt="Studio Cover Banner"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end justify-between p-4 sm:p-6">
              <div className="text-white space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30">
                  {currentBanner ? 'Active Profile Banner' : 'Default Platform Cover'}
                </span>
                <p className="text-sm sm:text-base font-black">
                  {businessName || 'Your Studio'}
                </p>
                <p className="text-xs text-slate-200 font-medium">
                  Resolution: 1920 × 600 px (3:1 ratio, max 15MB)
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="secondary" size="md" onClick={() => setActiveStep(3)}>
              ← Back to Step 3
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setActiveStep(5)}
              className="bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold"
            >
              Continue to Step 5 →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 5: PORTFOLIO GALLERY OVERVIEW */}
      {activeStep === 5 && (
        <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">Step 5 — Portfolio Gallery</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload and manage your high-resolution portfolio images and client showcase reels.
              </p>
            </div>
            <Link
              href="/photographer/portfolio"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold transition-all shadow-sm"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Open Full Portfolio Studio →</span>
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-3">
            <Camera className="w-10 h-10 text-[#0D9488] mx-auto" />
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {portfolioCount} Photographs in Your Active Gallery
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Use the dedicated Portfolio Studio to upload photos, add external links, reorder items, and manage photo categories.
              </p>
            </div>
            <Link
              href="/photographer/portfolio"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#14B8A6] text-xs font-bold text-slate-800 transition-all shadow-2xs"
            >
              <span>Manage Photographs</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="secondary" size="md" onClick={() => setActiveStep(4)}>
              ← Back to Step 4
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setActiveStep(6)}
              className="bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold"
            >
              Continue to Step 6 →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 6: PROFESSIONAL INFORMATION */}
      {activeStep === 6 && (
        <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900">Step 6 — Professional Information &amp; Gear</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Highlight your industry experience, camera equipment, and client languages.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Years of Professional Experience *
              </label>
              <input
                type="number"
                min="0"
                max="80"
                value={experienceYears}
                onChange={(e) => {
                  setExperienceYears(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                External Portfolio Link (Optional)
              </label>
              <input
                type="url"
                value={portfolioWebUrl}
                onChange={(e) => {
                  setPortfolioWebUrl(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="https://myphotography.com or Instagram URL"
                className="w-full px-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Camera Gear &amp; Equipment
              </label>
              <input
                type="text"
                value={cameraGear}
                onChange={(e) => {
                  setCameraGear(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Sony A7IV, DJI RS3 Gimbal, 24-70mm f/2.8, 50mm Prime"
                className="w-full px-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Languages Spoken with Clients
              </label>
              <div className="flex flex-wrap gap-2">
                {allLanguageOptions.map((lang) => {
                  const isSelected = selectedLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#14B8A6] text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="secondary" size="md" onClick={() => setActiveStep(5)}>
              ← Back to Step 5
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setActiveStep(7)}
              className="bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold"
            >
              Continue to Step 7 →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 7: AVAILABILITY & TRAVEL PRICING RULES */}
      {activeStep === 7 && (
        <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900">Step 7 — Studio Location &amp; Travel Pricing Rules</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distance-based pricing rules automatically calculate billable travel fees for client shoot locations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Studio Hub / Base Location Address *
              </label>
              <input
                type="text"
                value={baseAddress}
                onChange={(e) => {
                  setBaseAddress(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Connaught Place, New Delhi"
                className="w-full px-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6]"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Travel distance to customer shoot venues is measured from this location.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Included Free Travel (km)
              </label>
              <input
                type="number"
                min="0"
                value={includedTravelKm}
                onChange={(e) => {
                  setIncludedTravelKm(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6]"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Kilometres included before travel charges apply</span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Travel Fee per Chargeable km (₹)
              </label>
              <input
                type="number"
                min="0"
                value={travelFeePerKm}
                onChange={(e) => {
                  setTravelFeePerKm(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6]"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Rate in INR for each km beyond free allowance</span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Service Radius (km)
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={serviceRadius}
                onChange={(e) => {
                  setServiceRadius(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Minimum Travel Fee Floor (₹)
              </label>
              <input
                type="number"
                min="0"
                value={minTravelFee}
                onChange={(e) => {
                  setMinTravelFee(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6]"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="secondary" size="md" onClick={() => setActiveStep(6)}>
              ← Back to Step 6
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setActiveStep(8)}
              className="bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold"
            >
              Continue to Step 8 (Preview &amp; Publish) →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 8: PREVIEW & VERIFICATION PUBLICATION */}
      {activeStep === 8 && (
        <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900">Step 8 — Profile Review &amp; Publication Status</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your completed creator profile summary before publishing or saving changes.
            </p>
          </div>

          {/* Verification Status Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                  creatorProfile?.verification_status === 'approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : creatorProfile?.verification_status === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    Publication Status: {creatorProfile?.verification_status?.toUpperCase() || 'DRAFT'}
                  </h4>
                </div>
                <p className="text-xs text-slate-500">
                  {creatorProfile?.verification_status === 'approved'
                    ? 'Your studio profile is approved and live on the public directory.'
                    : creatorProfile?.verification_status === 'pending'
                    ? 'Your studio credentials are under review by the platform team.'
                    : 'Submit your profile for verification once setup is complete.'}
                </p>
              </div>
            </div>

            <Link
              href="/photographer/verification"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 hover:bg-white text-xs font-bold text-slate-800 transition-colors"
            >
              <span>Verification Center</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>

          {/* Profile Overview Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Studio Name</span>
              <p className="font-bold text-slate-900">{businessName || 'Not Set'}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Hub City</span>
              <p className="font-bold text-slate-900">{city}, {stateName}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Packages Configured</span>
              <p className="font-bold text-slate-900">{dbServices.length} Active Packages</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Portfolio Gallery</span>
              <p className="font-bold text-slate-900">{portfolioCount} Published Photographs</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" size="md" onClick={() => setActiveStep(7)}>
              ← Back to Step 7
            </Button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Link
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
              >
                <Eye className="w-4 h-4 text-slate-400" />
                <span>View Live Profile</span>
              </Link>

              <Button
                variant="primary"
                size="md"
                onClick={() => handleSaveProfile(false)}
                disabled={isSaving}
                leftIcon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                className="bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold shadow-sm"
              >
                {isSaving ? 'Saving...' : 'Save & Publish Profile'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD PACKAGE                                            */}
      {/* ------------------------------------------------------------- */}
      {showAddPackageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Add Photography Package</h3>
              <button onClick={() => setShowAddPackageModal(false)} className="p-1 text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Package Title *
                </label>
                <input
                  type="text"
                  value={newPkgTitle}
                  onChange={(e) => setNewPkgTitle(e.target.value)}
                  placeholder="e.g. Standard Portrait / Reels Session"
                  className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newPkgPrice}
                    onChange={(e) => setNewPkgPrice(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Duration (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={newPkgDurationHours}
                    onChange={(e) => setNewPkgDurationHours(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Deliverables &amp; Details
                </label>
                <textarea
                  rows={3}
                  value={newPkgDesc}
                  onChange={(e) => setNewPkgDesc(e.target.value)}
                  placeholder="30 color-graded frames, online private gallery, commercial rights..."
                  className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setShowAddPackageModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreatePackage}
                disabled={isSavingPackage}
                className="bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold"
              >
                {isSavingPackage ? 'Saving...' : 'Add Package'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
