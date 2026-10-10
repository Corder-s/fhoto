'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { DemoNoticeBanner } from '../../../../components/photographer/DemoNoticeBanner';
import {
  INITIAL_PHOTOGRAPHER_PROFILE,
  PhotographerProfile,
} from '../../../../data/photographerDashboardData';

export default function PhotographerBusinessPage() {
  const [profile, setProfile] = useState<PhotographerProfile>(INITIAL_PHOTOGRAPHER_PROFILE);
  const [originalProfile] = useState<PhotographerProfile>(INITIAL_PHOTOGRAPHER_PROFILE);

  // Form Fields
  const [businessName, setBusinessName] = useState(profile.name);
  const [tagline, setTagline] = useState('Editorial & Portrait Specialist');
  const [city, setCity] = useState(profile.city);
  const [baseHub, setBaseHub] = useState('Greater Noida / Delhi NCR');
  const [experienceYears, setExperienceYears] = useState('6+');
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
    'Mumbai',
  ]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
    'English',
    'Hindi',
    'Punjabi',
  ]);
  const [bio, setBio] = useState(profile.bio);

  // Status feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDirty, setIsDirty] = useState(false);

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
      if (selectedSpecialties.length === 1) return; // Keep at least one
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!businessName.trim()) {
      setErrorMessage('Business display name cannot be blank.');
      return;
    }
    if (!bio.trim() || bio.length < 20) {
      setErrorMessage('Please provide a descriptive studio biography (at least 20 characters).');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setIsDirty(false);
      setProfile((prev) => ({
        ...prev,
        name: businessName.trim(),
        city: city.trim(),
        bio: bio.trim(),
      }));
      setTimeout(() => setSaveSuccess(false), 4000);
    }, 600);
  };

  const handleReset = () => {
    setBusinessName(originalProfile.name);
    setCity(originalProfile.city);
    setBio(originalProfile.bio);
    setErrorMessage('');
    setIsDirty(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <DemoNoticeBanner moduleName="Creator Business Identity & Studio Profile" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand/10 text-brand">
              SaaS Business Suite
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
            href="/photographers/pro-aman"
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
          <span>Business studio profile updated successfully! Changes are live on your public profile.</span>
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
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
              />
              <span className="absolute bottom-0 right-0 p-1 bg-brand text-white rounded-full shadow-xs">
                <Camera className="w-3 h-3" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-ink-primary">{businessName}</h2>
                <Badge variant="brand" size="sm">
                  PRO Plan
                </Badge>
              </div>
              <p className="text-xs text-ink-secondary mt-0.5">{tagline}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-ink-muted">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand" />
                  {city}, India
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {profile.rating} ({profile.reviewCount} client reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Server-Controlled Trust & KYC Status */}
          <div className="p-3 bg-canvas-primary rounded-card-sm border border-contour-subtle text-left sm:text-right space-y-1">
            <div className="flex items-center gap-1.5 sm:justify-end text-xs font-bold text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Identity Verified Pro</span>
            </div>
            <p className="text-[11px] text-ink-muted">
              KYC Status: <span className="font-bold text-ink-primary">APPROVED</span> (Server-governed)
            </p>
            <p className="text-[10px] text-ink-muted italic">
              Verification badges are managed by platform administrators and cannot be altered locally.
            </p>
          </div>
        </div>

        {/* Business Settings Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                placeholder="e.g. Aman Sharma Photography"
                required
              />
              <p className="text-[11px] text-ink-muted mt-1">
                This title appears across search results, customer invoices, and quotes.
              </p>
            </div>

            {/* Professional Tagline */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary mb-1.5">
                Professional Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => {
                  setTagline(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2.5 text-xs font-medium border border-contour-subtle rounded-card-sm bg-white focus:outline-none focus:border-brand"
                placeholder="e.g. Editorial & Portrait Specialist"
              />
              <p className="text-[11px] text-ink-muted mt-1">
                A concise punchline shown under your studio title.
              </p>
            </div>

            {/* Primary City */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary mb-1.5">
                Primary Studio Base City *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2.5 text-xs font-medium border border-contour-subtle rounded-card-sm bg-white focus:outline-none focus:border-brand"
                placeholder="e.g. Noida / Delhi NCR"
                required
              />
            </div>

            {/* Experience */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary mb-1.5">
                Professional Experience
              </label>
              <input
                type="text"
                value={experienceYears}
                onChange={(e) => {
                  setExperienceYears(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2.5 text-xs font-medium border border-contour-subtle rounded-card-sm bg-white focus:outline-none focus:border-brand"
                placeholder="e.g. 6+ Years"
              />
            </div>
          </div>

          {/* Photography Specialties Selection */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary mb-2">
              Photography Specialties &amp; Niches
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
                        ? 'bg-brand text-white shadow-xs'
                        : 'bg-canvas-secondary text-ink-secondary hover:text-ink-primary border border-contour-subtle'
                    }`}
                  >
                    {spec} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-ink-muted mt-1.5">
              Select specialties to be indexed in category discovery and marketplace search filters.
            </p>
          </div>

          {/* Service Cities Coverage */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary mb-2">
              Service Regions &amp; Travel Coverage
            </label>
            <div className="flex flex-wrap gap-2">
              {allCities.map((c) => {
                const isSelected = selectedCities.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCityToggle(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-ink-primary text-white shadow-xs'
                        : 'bg-canvas-secondary text-ink-secondary hover:text-ink-primary border border-contour-subtle'
                    }`}
                  >
                    {c} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-ink-muted mt-1.5">
              Clients in these regions will discover your packages when filtering by city.
            </p>
          </div>

          {/* Languages Spoken */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary mb-2">
              Client Communication Languages
            </label>
            <div className="flex flex-wrap gap-2">
              {allLanguages.map((lang) => {
                const isSelected = selectedLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageToggle(lang)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-canvas-secondary text-ink-secondary hover:text-ink-primary border border-contour-subtle'
                    }`}
                  >
                    {lang} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Studio Biography */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary mb-1.5">
              Studio Biography &amp; Creative Vision *
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                setIsDirty(true);
              }}
              className="w-full px-3.5 py-2.5 text-xs font-medium border border-contour-subtle rounded-card-sm bg-white focus:outline-none focus:border-brand"
              placeholder="Introduce your studio philosophy, lighting style, and approach..."
              required
            />
            <p className="text-[11px] text-ink-muted mt-1">
              Minimum 20 characters. Highlight your camera craft, direction approach, and turnaround standards.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-contour-subtle">
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty || isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-ink-secondary hover:text-ink-primary disabled:opacity-40 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cancel Changes</span>
            </button>

            <button
              type="submit"
              disabled={!isDirty || isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-card-sm bg-brand text-white text-xs font-bold shadow-md hover:bg-brand-dark disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Profile...' : 'Save Business Profile'}</span>
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
