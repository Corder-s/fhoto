'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Camera,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Star,
  Globe,
  ExternalLink,
  Save,
  RotateCcw,
  AlertCircle,
  Sparkles,
  Info,
  Clock,
  Layers,
  Award,
  Languages,
  Loader2
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
    loading: isContextLoading,
  } = useCurrentUserProfile();

  // Form Fields
  const [accountFullName, setAccountFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('Editorial & Portrait Specialist');
  const [city, setCity] = useState('');
  const [baseHub, setBaseHub] = useState('');
  const [experienceYears, setExperienceYears] = useState('2');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([
    'Portrait',
    'Reels & Creator',
    'Couple & Wedding',
    'Fashion & Editorial',
    'Commercial',
  ]);
  const [selectedCities, setSelectedCities] = useState<string[]>([
    'Delhi NCR',
    'Greater Noida',
    'Noida',
    'Gurgaon',
  ]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
    'English',
    'Hindi',
  ]);
  const [bio, setBio] = useState('');

  // Status feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Synchronize state when profile loads from Supabase
  useEffect(() => {
    if (profile || creatorProfile) {
      setAccountFullName(profile?.full_name || accountName);
      setBusinessName(creatorProfile?.professional_name || professionalName);
      setCity(creatorProfile?.city || 'Delhi NCR');
      setBaseHub(`${creatorProfile?.city || 'Delhi NCR'} & surrounding regions`);
      setExperienceYears(String(creatorProfile?.experience_years || 2));
      setBio(creatorProfile?.biography || '');
    }
  }, [profile, creatorProfile, accountName, professionalName]);

  const allSpecialties = [
    'Portrait',
    'Reels & Creator',
    'Couple & Wedding',
    'Fashion & Editorial',
    'Commercial',
    'Culinary & Food',
    'Architecture & Interior',
    'Corporate Events',
  ];

  const allCities = [
    'Delhi NCR',
    'Greater Noida',
    'Noida',
    'Gurgaon',
    'Mumbai',
    'Bengaluru',
    'Jaipur',
    'Chandigarh',
  ];

  const allLanguages = ['English', 'Hindi', 'Punjabi', 'Bengali', 'Gujarati', 'Marathi'];

  const handleSpecialtyToggle = (spec: string) => {
    setIsDirty(true);
    if (selectedSpecialties.includes(spec)) {
      if (selectedSpecialties.length === 1) return;
      setSelectedSpecialties(selectedSpecialties.filter((s) => s !== spec));
    } else {
      setSelectedSpecialties([...selectedSpecialties, spec]);
    }
  };

  const handleCityToggle = (c: string) => {
    setIsDirty(true);
    if (selectedCities.includes(c)) {
      if (selectedCities.length === 1) return;
      setSelectedCities(selectedCities.filter((x) => x !== c));
    } else {
      setSelectedCities([...selectedCities, c]);
    }
  };

  const handleLanguageToggle = (lang: string) => {
    setIsDirty(true);
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length === 1) return;
      setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!accountFullName.trim()) {
      setErrorMessage('Account full name cannot be blank.');
      return;
    }
    if (!businessName.trim()) {
      setErrorMessage('Business / professional display name cannot be blank.');
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
          city: city.trim(),
          biography: bio.trim(),
          experienceYears: Number(experienceYears) || 1,
        },
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to update studio profile in Supabase.');
      }

      setSaveSuccess(true);
      setIsDirty(false);
      setTimeout(() => setSaveSuccess(false), 4500);
    } catch (err: any) {
      console.error('Error saving studio profile:', err);
      setErrorMessage(err.message || 'Error occurred while saving to Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setAccountFullName(profile?.full_name || accountName);
    setBusinessName(creatorProfile?.professional_name || professionalName);
    setCity(creatorProfile?.city || 'Delhi NCR');
    setBio(creatorProfile?.biography || '');
    setExperienceYears(String(creatorProfile?.experience_years || 2));
    setErrorMessage('');
    setIsDirty(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FF6E00]/10 text-[#FF6E00]">
              Creator Studio Suite
            </span>
            <span className="text-xs text-ink-muted">· Commercial Studio Profile</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight mt-1">
            My Business &amp; Studio Presence
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Manage your public photography brand, specialties, regional coverage, and verified studio credentials.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={creatorProfile?.id ? `/photographers/${creatorProfile.id}` : '/photographer/portfolio'}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-card-sm border border-contour-subtle bg-white text-ink-primary font-bold text-xs hover:bg-canvas-secondary transition-colors"
          >
            <Camera className="w-3.5 h-3.5 text-brand" />
            <span>Public Preview</span>
            <ExternalLink className="w-3.5 h-3.5 text-ink-muted" />
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-card-sm text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Business studio profile updated successfully in Supabase! Changes are live across your dashboard and public listings.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-card-sm text-xs font-bold text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Studio Identity Card Preview */}
      <Card className="p-6 bg-white border-contour-subtle shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-contour-subtle pb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={businessName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#FF6E00] text-white flex items-center justify-center text-xl font-black border-2 border-white shadow-md shrink-0">
                  {initials}
                </div>
              )}
              <span className="absolute bottom-0 right-0 p-1 bg-brand text-white rounded-full shadow-xs">
                <Camera className="w-3 h-3" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-ink-primary">{businessName || 'Your Studio Name'}</h2>
                <Badge variant="brand" size="sm">
                  PRO Creator
                </Badge>
              </div>
              <p className="text-xs text-ink-secondary mt-0.5">{tagline}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-ink-muted">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand" />
                  {city || 'Operating Hub'}, India
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {creatorProfile?.average_rating ? Number(creatorProfile.average_rating).toFixed(1) : '5.0'} ({creatorProfile?.total_reviews || 0} client reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Server-Controlled Trust & KYC Status */}
          <div className="p-3 bg-canvas-primary rounded-card-sm border border-contour-subtle text-left sm:text-right space-y-1">
            <div className="flex items-center gap-1.5 sm:justify-end text-xs font-bold text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                {creatorProfile?.verification_status === 'approved'
                  ? 'Identity Verified Pro'
                  : creatorProfile?.verification_status === 'pending'
                  ? 'Verification In Review'
                  : 'KYC Document Pending'}
              </span>
            </div>
            <p className="text-[11px] text-ink-muted">
              KYC Status: <span className="font-bold text-ink-primary uppercase">{creatorProfile?.verification_status || 'unsubmitted'}</span> (Server-governed)
            </p>
            <p className="text-[10px] text-ink-muted italic">
              Verification badges are managed by platform administrators and audited against official ID proofs.
            </p>
          </div>
        </div>

        {/* Business Settings Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Legal Full Name */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary mb-1.5">
                Account Legal Full Name *
              </label>
              <input
                type="text"
                value={accountFullName}
                onChange={(e) => {
                  setAccountFullName(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2.5 text-xs font-medium border border-contour-subtle rounded-card-sm bg-white focus:outline-none focus:border-brand"
                placeholder="e.g. Your Full Legal Name"
                required
              />
              <p className="text-[11px] text-ink-muted mt-1">
                Used for your account identity, payouts verification, and legal receipts.
              </p>
            </div>

            {/* Business Display Name */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary mb-1.5">
                Business / Studio Display Name *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2.5 text-xs font-medium border border-contour-subtle rounded-card-sm bg-white focus:outline-none focus:border-brand"
                placeholder="e.g. Studio Brand or Professional Name"
                required
              />
              <p className="text-[11px] text-ink-muted mt-1">
                This title appears across search results, public portfolios, and quotes.
              </p>
            </div>

            {/* Primary Hub City */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary mb-1.5">
                Primary Operating City / Hub *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2.5 text-xs font-medium border border-contour-subtle rounded-card-sm bg-white focus:outline-none focus:border-brand"
                placeholder="e.g. Greater Noida, Delhi NCR, Mumbai"
                required
              />
              <p className="text-[11px] text-ink-muted mt-1">
                Your primary dispatch epicenter for local instant and scheduled shoots.
              </p>
            </div>

            {/* Experience Years */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary mb-1.5">
                Professional Experience (Years) *
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={experienceYears}
                onChange={(e) => {
                  setExperienceYears(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2.5 text-xs font-medium border border-contour-subtle rounded-card-sm bg-white focus:outline-none focus:border-brand"
                required
              />
              <p className="text-[11px] text-ink-muted mt-1">
                Number of documented years operating professionally as a creator.
              </p>
            </div>
          </div>

          {/* Studio Bio */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary mb-1.5">
              Studio Biography & Creative Philosophy
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                setIsDirty(true);
              }}
              className="w-full px-3.5 py-2.5 text-xs font-medium border border-contour-subtle rounded-card-sm bg-white focus:outline-none focus:border-brand leading-relaxed"
              placeholder="Describe your creative approach, camera gear specialties, client comfort methods, and session workflow..."
            />
          </div>

          {/* Specialties Badges Selection */}
          <div className="space-y-2 pt-2 border-t border-contour-subtle">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary">
              Featured Genre Specialties
            </label>
            <div className="flex flex-wrap gap-2">
              {allSpecialties.map((spec) => {
                const isSelected = selectedSpecialties.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => handleSpecialtyToggle(spec)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#FF6E00] text-white shadow-xs'
                        : 'bg-canvas-secondary text-ink-secondary hover:bg-canvas-tertiary'
                    }`}
                  >
                    {spec}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-contour-subtle">
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty || isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-ink-muted hover:text-ink-primary disabled:opacity-30 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Changes</span>
            </button>

            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              leftIcon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            >
              {isSaving ? 'Saving to Supabase...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
