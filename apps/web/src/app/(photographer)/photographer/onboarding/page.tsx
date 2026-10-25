'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Camera,
  Image as ImageIcon,
  Package,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  UploadCloud,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  AlertCircle,
  FileText,
  Loader2,
  Sparkles,
  X
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { useAuth } from '../../../../lib/auth';

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
}

interface ServiceItem {
  id: string;
  title: string;
  category: string;
  priceInr: number;
  durationHours: number;
  description: string;
  deliverables: string[];
}

export default function PhotographerOnboardingPage() {
  const { user, isAuthenticated, isMounted } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationRef, setApplicationRef] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Available categories from Supabase
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);

  // Step 1: Personal
  const [personal, setPersonal] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    serviceArea: '',
  });

  // Step 2: Professional
  const [professional, setProfessional] = useState({
    bio: '',
    experienceYears: 2,
    specialties: ['Editorial Portraits', 'Creator Shoots', 'Couples', 'Events'],
    languages: 'English, Hindi',
    cameras: '',
    lenses: '',
  });

  // Step 3: Portfolio
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false);
  const [newPhoto, setNewPhoto] = useState({
    title: '',
    category: 'Portraits',
    imageUrl: '',
  });

  // Step 4: Services
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newService, setNewService] = useState({
    title: '',
    category: 'Portraits',
    priceInr: 4999,
    durationHours: 2,
    description: '',
    deliverables: '25 Retouched Photos, Online Private Gallery',
  });

  // Step 5: Verification docs
  const [idDocType, setIdDocType] = useState('Aadhaar Card');
  const [idFileName, setIdFileName] = useState('');
  const [invoiceFileName, setInvoiceFileName] = useState('');
  const [idDoc, setIdDoc] = useState<{
    type: string;
    storage_path: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
  } | null>(null);
  const [invoiceDoc, setInvoiceDoc] = useState<{
    type: string;
    storage_path: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
  } | null>(null);
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleUploadDoc = async (file: File, type: 'government_id' | 'equipment_invoice') => {
    setUploadError('');
    if (type === 'government_id') {
      setIsUploadingId(true);
    } else {
      setIsUploadingInvoice(true);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('/api/photographers/verification/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.document) {
        throw new Error(data.error || 'Failed to upload document.');
      }

      if (type === 'government_id') {
        setIdDoc(data.document);
        setIdFileName(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
      } else {
        setInvoiceDoc(data.document);
        setInvoiceFileName(`${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
      }
    } catch (err: any) {
      console.error('Document upload error:', err);
      setUploadError(err.message || 'Error uploading document.');
    } finally {
      if (type === 'government_id') {
        setIsUploadingId(false);
      } else {
        setIsUploadingInvoice(false);
      }
    }
  };

  // 1. Fetch real creator profile and categories from Supabase on mount
  useEffect(() => {
    let isCancelled = false;

    async function loadSupabaseData() {
      try {
        setIsLoadingData(true);
        const url = user?.id
          ? `/api/photographers/onboarding?userId=${user.id}`
          : '/api/photographers/onboarding';

        const res = await fetch(url);
        const data = await res.json();

        if (isCancelled) return;

        if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }

        // Populate with authentic user & creator profile from Supabase
        const pName = data.creatorProfile?.professional_name || data.profile?.full_name || user?.name || '';
        const pEmail = data.profile?.email || user?.email || '';
        const pPhone = data.profile?.phone_number || user?.phone || '';
        const pCity = data.creatorProfile?.city || '';
        const pServiceArea = pCity ? `${pCity} & NCR (Radius 25km)` : '';

        setPersonal({
          name: pName,
          email: pEmail,
          phone: pPhone,
          city: pCity,
          serviceArea: pServiceArea,
        });

        if (data.creatorProfile) {
          setProfessional({
            bio: data.creatorProfile.biography || '',
            experienceYears: data.creatorProfile.experience_years || 2,
            specialties: ['Portraits', 'Weddings', 'Events', 'Commercial'],
            languages: 'English, Hindi',
            cameras: '',
            lenses: '',
          });

          // Check if already submitted or under review
          if (data.creatorProfile.verification_status === 'pending') {
            setIsSubmitted(true);
            setApplicationRef(`ONB-${user?.id?.slice(0, 8).toUpperCase()}`);
          }
        }

        // Populate authentic portfolio items from Supabase
        if (data.portfolioItems && data.portfolioItems.length > 0) {
          setPortfolioItems(
            data.portfolioItems.map((p: any) => ({
              id: p.id,
              title: p.title,
              category: p.description || 'Showcase',
              imageUrl: p.preview_url,
            }))
          );
        }

        // Populate authentic services from Supabase
        if (data.services && data.services.length > 0) {
          setServices(
            data.services.map((s: any) => ({
              id: s.id,
              title: s.title,
              category: s.service_categories?.name || 'Photography',
              priceInr: Number(s.base_price) || 4999,
              durationHours: Math.max(1, Math.round((s.duration_minutes || 120) / 60)),
              description: s.description || '',
              deliverables: ['High-res retouched photos', 'Online client gallery'],
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load creator onboarding data from Supabase:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingData(false);
        }
      }
    }

    if (isMounted) {
      loadSupabaseData();
    }

    return () => {
      isCancelled = true;
    };
  }, [user?.id, user?.name, user?.email, user?.phone, isMounted]);

  // Step validation
  const validateStep = (step: number) => {
    setErrorMsg('');
    if (step === 1) {
      if (!personal.name.trim() || !personal.email.trim()) {
        setErrorMsg('Please enter your full legal name and verified email.');
        return false;
      }
      if (!personal.city.trim()) {
        setErrorMsg('Please specify your primary city or operating hub.');
        return false;
      }
    }
    if (step === 2) {
      if (!professional.bio.trim()) {
        setErrorMsg('Please enter a creative bio describing your style and background.');
        return false;
      }
      if (professional.experienceYears < 1) {
        setErrorMsg('Please enter at least 1 year of photography experience.');
        return false;
      }
    }
    if (step === 3) {
      if (portfolioItems.length < 1) {
        setErrorMsg('Please add at least 1 portfolio photograph for your review submission.');
        return false;
      }
    }
    if (step === 4) {
      if (services.length < 1) {
        setErrorMsg('Please configure at least 1 service package to offer clients.');
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Final Step: Submit Application directly to Supabase
      await submitApplicationToSupabase();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setErrorMsg('');
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const submitApplicationToSupabase = async () => {
    if (!user?.id) {
      setErrorMsg('You must be logged in with a creator account to submit onboarding.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const res = await fetch('/api/photographers/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          personal,
          professional,
          portfolioItems,
          services,
          verification: {
            idDocType,
            idFileName,
            equipmentInvoiceFileName: invoiceFileName,
            documents: [idDoc, invoiceDoc].filter(Boolean),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit onboarding profile.');
      }

      setApplicationRef(data.referenceCode || `ONB-${user.id.slice(0, 8).toUpperCase()}`);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setErrorMsg(err.message || 'Error occurred while saving application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const movePortfolioItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...portfolioItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setPortfolioItems(newItems);
  };

  const removePortfolioItem = (index: number) => {
    setPortfolioItems(portfolioItems.filter((_, i) => i !== index));
  };

  const handleAddPhoto = () => {
    if (!newPhoto.title.trim() || !newPhoto.imageUrl.trim()) {
      alert('Please provide a title and image URL for your photograph.');
      return;
    }
    const newItem: PortfolioItem = {
      id: `port-${Date.now()}`,
      title: newPhoto.title.trim(),
      category: newPhoto.category,
      imageUrl: newPhoto.imageUrl.trim(),
    };
    setPortfolioItems([...portfolioItems, newItem]);
    setNewPhoto({ title: '', category: 'Portraits', imageUrl: '' });
    setShowAddPortfolioModal(false);
  };

  const handleAddService = () => {
    if (!newService.title.trim() || !newService.description.trim()) {
      alert('Please fill in package title and description.');
      return;
    }
    const newSrv: ServiceItem = {
      id: `srv-${Date.now()}`,
      title: newService.title.trim(),
      category: newService.category,
      priceInr: Number(newService.priceInr) || 4999,
      durationHours: Number(newService.durationHours) || 2,
      description: newService.description.trim(),
      deliverables: newService.deliverables.split(',').map((d) => d.trim()).filter(Boolean),
    };
    setServices([...services, newSrv]);
    setNewService({
      title: '',
      category: 'Portraits',
      priceInr: 4999,
      durationHours: 2,
      description: '',
      deliverables: '25 Retouched Photos, Online Private Gallery',
    });
    setShowAddServiceModal(false);
  };

  const removeService = (id: string) => {
    setServices(services.filter((s) => s.id !== id));
  };

  const stepsHeader = [
    { num: 1, title: 'Personal Info', icon: User },
    { num: 2, title: 'Profile & Gear', icon: Camera },
    { num: 3, title: 'Portfolio', icon: ImageIcon },
    { num: 4, title: 'Services', icon: Package },
    { num: 5, title: 'Verification', icon: ShieldCheck },
    { num: 6, title: 'Review & Finish', icon: CheckCircle2 },
  ];

  if (isLoadingData) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-4">
        <Loader2 className="w-8 h-8 text-[#14B8A6] animate-spin mx-auto" />
        <p className="text-sm font-semibold text-ink-secondary">
          Syncing creator profile...
        </p>
      </div>
    );
  }

  // Submitted / Success State
  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
            Onboarding Profile Submitted!
          </h1>
          <p className="text-sm text-ink-secondary max-w-lg mx-auto">
            Your creator profile, packages, and credentials have been recorded. Our curation team will verify your details within 24 to 48 hours.
          </p>
        </div>

        <Card className="bg-canvas-secondary/60 p-6 text-left space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="warning" size="sm">Status: Pending Verification</Badge>
            <span className="text-xs font-mono font-bold text-ink-muted">
              Reference: {applicationRef || `ONB-${user?.id?.slice(0, 8).toUpperCase()}`}
            </span>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Your public listing is safely registered in pending status. You can check your compliance progress or continue to your creator workspace dashboard.
          </p>
        </Card>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link href="/photographer/verification">
            <Button variant="primary">
              View Verification Status →
            </Button>
          </Link>
          <Link href="/photographer/dashboard">
            <Button variant="secondary">
              Go to Creator Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Live Sync Active</span>
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
          Creator Onboarding & Approval Flow
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Complete the 6 steps to publish your photography packages and qualify for on-demand booking dispatch.
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="bg-white rounded-card-md border border-contour-subtle p-4 sm:p-6 shadow-subtle">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {stepsHeader.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.num < currentStep;
            const isCurrent = step.num === currentStep;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => {
                  if (step.num < currentStep) setCurrentStep(step.num);
                }}
                disabled={step.num > currentStep}
                className={`flex flex-col items-center text-center p-2 rounded-card-sm transition-all ${
                  isCurrent
                    ? 'bg-[#14B8A6] text-white font-bold'
                    : isCompleted
                    ? 'bg-canvas-secondary text-ink-primary hover:bg-canvas-tertiary'
                    : 'text-ink-muted opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-current">
                    {step.num}
                  </span>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-semibold truncate w-full">
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-canvas-secondary rounded-full h-1.5 mt-4 overflow-hidden">
          <div
            className="bg-[#14B8A6] h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Error prompt */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-card-sm text-xs font-semibold text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: PERSONAL INFORMATION */}
      {currentStep === 1 && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-contour-subtle pb-4">
            <h2 className="text-xl font-bold text-ink-primary">Step 1: Personal & Contact Information</h2>
            <p className="text-xs text-ink-secondary mt-1">Verified creator details synced from your profile.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Full Legal Name *</label>
              <input
                type="text"
                value={personal.name}
                onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
                placeholder="e.g. Your Legal Name"
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-[#14B8A6] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Phone Number *</label>
              <input
                type="text"
                value={personal.phone}
                onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-[#14B8A6] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Email Address *</label>
              <input
                type="email"
                value={personal.email}
                onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                placeholder="your.email@example.com"
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-[#14B8A6] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Primary City / Operating Hub *</label>
              <input
                type="text"
                value={personal.city}
                onChange={(e) => setPersonal({ ...personal, city: e.target.value })}
                placeholder="e.g. New Delhi, Mumbai, Bengaluru"
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-[#14B8A6] outline-none"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Service Coverage Areas</label>
              <input
                type="text"
                value={personal.serviceArea}
                onChange={(e) => setPersonal({ ...personal, serviceArea: e.target.value })}
                placeholder="e.g. South Delhi, Connaught Place, Gurugram Cyber Hub, Noida"
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-[#14B8A6] outline-none"
              />
              <p className="text-[11px] text-ink-muted">Separate multiple neighborhoods or cities with commas.</p>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: PROFESSIONAL PROFILE */}
      {currentStep === 2 && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-contour-subtle pb-4">
            <h2 className="text-xl font-bold text-ink-primary">Step 2: Professional Profile & Gear</h2>
            <p className="text-xs text-ink-secondary mt-1">Showcase your creative background, equipment, and experience.</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Creative Bio *</label>
              <textarea
                rows={3}
                value={professional.bio}
                onChange={(e) => setProfessional({ ...professional, bio: e.target.value })}
                placeholder="Describe your photography style, creative approach, and what clients can expect..."
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-[#14B8A6] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-ink-primary">Years of Professional Experience *</label>
                <input
                  type="number"
                  min={1}
                  value={professional.experienceYears}
                  onChange={(e) => setProfessional({ ...professional, experienceYears: Number(e.target.value) })}
                  className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-[#14B8A6] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-ink-primary">Languages Spoken</label>
                <input
                  type="text"
                  value={professional.languages}
                  onChange={(e) => setProfessional({ ...professional, languages: e.target.value })}
                  placeholder="e.g. English, Hindi, Punjabi"
                  className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-[#14B8A6] outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Camera Bodies (Primary & Backup)</label>
              <input
                type="text"
                value={professional.cameras}
                onChange={(e) => setProfessional({ ...professional, cameras: e.target.value })}
                placeholder="e.g. Sony A7 IV, Canon EOS R6, Nikon Z6 II"
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-[#14B8A6] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Prime & Zoom Lenses</label>
              <input
                type="text"
                value={professional.lenses}
                onChange={(e) => setProfessional({ ...professional, lenses: e.target.value })}
                placeholder="e.g. 24-70mm f/2.8, 85mm f/1.4, 50mm f/1.8"
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-[#14B8A6] outline-none"
              />
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: PORTFOLIO */}
      {currentStep === 3 && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-contour-subtle pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink-primary">Step 3: Curate Portfolio Highlights</h2>
              <p className="text-xs text-ink-secondary mt-1">Upload and manage your sample photographs.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="brand" size="sm">{portfolioItems.length} photos</Badge>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowAddPortfolioModal(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Photo
              </Button>
            </div>
          </div>

          {portfolioItems.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-contour-strong rounded-card-md p-6 space-y-3 bg-[#F5F7F9]/50">
              <ImageIcon className="w-10 h-10 text-[#14B8A6] mx-auto opacity-70" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-ink-primary">No portfolio items added yet</p>
                <p className="text-xs text-ink-secondary max-w-sm mx-auto">
                  Click the button below to add your sample photographs. Clients will see these on your verified creator profile.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowAddPortfolioModal(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Sample Photograph
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {portfolioItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-canvas-secondary/50 rounded-card-sm border border-contour-subtle"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-16 h-16 rounded object-cover shrink-0 bg-zinc-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/reference-assets/cat_portrait.jpg';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-ink-primary truncate">{item.title}</p>
                    <p className="text-[11px] text-ink-muted">{item.category}</p>
                    <span className="text-[10px] font-mono text-ink-muted">Position #{idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => movePortfolioItem(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-ink-muted hover:text-ink-primary disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => movePortfolioItem(idx, 'down')}
                      disabled={idx === portfolioItems.length - 1}
                      className="p-1 text-ink-muted hover:text-ink-primary disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePortfolioItem(idx)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Portfolio Modal */}
          {showAddPortfolioModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-contour-subtle">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-sm text-ink-primary">Add Portfolio Highlight</h3>
                  <button
                    onClick={() => setShowAddPortfolioModal(false)}
                    className="p-1 text-ink-muted hover:text-ink-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-ink-primary mb-1">
                      Photograph Title *
                    </label>
                    <input
                      type="text"
                      value={newPhoto.title}
                      onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
                      placeholder="e.g. Sunset Golden Hour Portrait"
                      className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#14B8A6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-ink-primary mb-1">
                      Category *
                    </label>
                    <select
                      value={newPhoto.category}
                      onChange={(e) => setNewPhoto({ ...newPhoto, category: e.target.value })}
                      className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#14B8A6] bg-white"
                    >
                      <option value="Portraits">Portraits</option>
                      <option value="Weddings">Weddings</option>
                      <option value="Events">Events</option>
                      <option value="Fashion">Fashion & Editorial</option>
                      <option value="Commercial">Commercial & Products</option>
                      <option value="Couples">Couples & Pre-Wedding</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-ink-primary mb-1">
                      Image URL (or Reference Image) *
                    </label>
                    <input
                      type="url"
                      value={newPhoto.imageUrl}
                      onChange={(e) => setNewPhoto({ ...newPhoto, imageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/... or /reference-assets/..."
                      className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#14B8A6]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="secondary" size="sm" onClick={() => setShowAddPortfolioModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleAddPhoto}>
                    Add to Portfolio
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* STEP 4: SERVICES */}
      {currentStep === 4 && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-contour-subtle pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink-primary">Step 4: Photography Services & Pricing</h2>
              <p className="text-xs text-ink-secondary mt-1">Configure packages and instant booking services.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="brand" size="sm">{services.length} packages</Badge>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowAddServiceModal(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Package
              </Button>
            </div>
          </div>

          {services.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-contour-strong rounded-card-md p-6 space-y-3 bg-[#F5F7F9]/50">
              <Package className="w-10 h-10 text-[#14B8A6] mx-auto opacity-70" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-ink-primary">No service packages added yet</p>
                <p className="text-xs text-ink-secondary max-w-sm mx-auto">
                  Add at least 1 service package with pricing and turnaround time to receive bookings.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowAddServiceModal(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add First Package
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((srv) => (
                <div key={srv.id} className="p-4 bg-canvas-secondary/40 rounded-card-sm border border-contour-subtle space-y-2 relative group">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold uppercase text-[#14B8A6] mr-2">[{srv.category}]</span>
                      <span className="text-sm font-bold text-ink-primary">{srv.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-extrabold text-ink-primary">₹{srv.priceInr.toLocaleString('en-IN')}</span>
                      <button
                        type="button"
                        onClick={() => removeService(srv.id)}
                        className="p-1 text-ink-muted hover:text-red-600 transition-colors"
                        title="Delete Package"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-ink-secondary">{srv.description}</p>
                  <div className="flex items-center gap-4 text-[11px] text-ink-muted pt-1">
                    <span>⏱️ {srv.durationHours} Hours Duration</span>
                    <span>•</span>
                    <span>📦 {srv.deliverables?.[0] || 'Digital Delivery'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Service Modal */}
          {showAddServiceModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-contour-subtle">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-sm text-ink-primary">Add Photography Package</h3>
                  <button
                    onClick={() => setShowAddServiceModal(false)}
                    className="p-1 text-ink-muted hover:text-ink-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-ink-primary mb-1">
                      Package Title *
                    </label>
                    <input
                      type="text"
                      value={newService.title}
                      onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                      placeholder="e.g. Standard Portrait Session"
                      className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#14B8A6]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-ink-primary mb-1">
                        Category *
                      </label>
                      <select
                        value={newService.category}
                        onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                        className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#14B8A6] bg-white"
                      >
                        <option value="Portraits">Portraits</option>
                        <option value="Weddings">Weddings</option>
                        <option value="Events">Events</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Couples">Couples</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-ink-primary mb-1">
                        Price (INR ₹) *
                      </label>
                      <input
                        type="number"
                        min={500}
                        step={500}
                        value={newService.priceInr}
                        onChange={(e) => setNewService({ ...newService, priceInr: Number(e.target.value) })}
                        className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#14B8A6]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-ink-primary mb-1">
                      Duration (Hours) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={newService.durationHours}
                      onChange={(e) => setNewService({ ...newService, durationHours: Number(e.target.value) })}
                      className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#14B8A6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-ink-primary mb-1">
                      Package Description *
                    </label>
                    <textarea
                      rows={2}
                      value={newService.description}
                      onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                      placeholder="e.g. 2 hours of outdoor portrait photography with 2 outfit changes..."
                      className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#14B8A6]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="secondary" size="sm" onClick={() => setShowAddServiceModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleAddService}>
                    Save Package
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* STEP 5: VERIFICATION */}
      {currentStep === 5 && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-contour-subtle pb-4">
            <h2 className="text-xl font-bold text-ink-primary">Step 5: Identity & Equipment Verification</h2>
            <p className="text-xs text-ink-secondary mt-1">
              REEPY requires trust and safety verification for all photographers before marketplace dispatch.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-card-sm bg-brand-subtle/50 border border-brand-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-ink-primary">
                <ShieldCheck className="w-4 h-4 text-[#14B8A6]" />
                <span>Zero Public Exposure Guarantee</span>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Government identity cards and invoices are encrypted at rest and audited exclusively by certified compliance officers. Documents are never exposed to clients or public URLs.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-ink-primary">Select ID Document Type *</label>
              <select
                value={idDocType}
                onChange={(e) => setIdDocType(e.target.value)}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-[#14B8A6] outline-none"
              >
                <option value="Aadhaar Card">Government Aadhaar Card (Front + Back)</option>
                <option value="PAN Card">Permanent Account Number (PAN Card)</option>
                <option value="Indian Passport">Republic of India Passport</option>
                <option value="Voter ID">Election Commission Voter ID</option>
              </select>
            </div>

            {uploadError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Document Upload Input */}
            <div className="border-2 border-dashed border-contour-strong rounded-card-md p-6 text-center space-y-2 bg-canvas-primary/60">
              {isUploadingId ? (
                <Loader2 className="w-8 h-8 text-[#14B8A6] mx-auto animate-spin" />
              ) : (
                <UploadCloud className="w-8 h-8 text-[#14B8A6] mx-auto" />
              )}
              <p className="text-xs font-bold text-ink-primary">
                {isUploadingId
                  ? 'Uploading Document to Secure Storage...'
                  : idFileName
                  ? 'Identity Document Attached & Secured:'
                  : 'Attach Identity Verification Document *'}
              </p>
              {idFileName ? (
                <p className="text-xs font-mono text-emerald-700 font-semibold">{idFileName}</p>
              ) : (
                <p className="text-xs text-ink-muted">PDF, JPG, PNG, or WebP (Max 25 MB)</p>
              )}
              <label className="inline-block cursor-pointer">
                <span className="py-1.5 px-3 rounded-lg border border-contour-strong hover:bg-white text-ink-primary font-semibold text-xs transition-colors inline-flex items-center gap-1.5">
                  {isUploadingId ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#14B8A6]" />
                      <span>Uploading...</span>
                    </>
                  ) : idFileName ? (
                    'Replace ID File'
                  ) : (
                    'Choose File to Upload'
                  )}
                </span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  disabled={isUploadingId}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUploadDoc(file, 'government_id');
                    }
                  }}
                />
              </label>
            </div>

            {/* Camera Invoice Upload */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold uppercase text-ink-primary">Camera Gear Purchase Invoice / Proof</label>
              <div className="flex items-center justify-between p-3 bg-canvas-secondary rounded-card-sm text-xs border border-contour-subtle">
                <div className="flex items-center gap-2 min-w-0">
                  {isUploadingInvoice ? (
                    <Loader2 className="w-4 h-4 text-[#14B8A6] animate-spin shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-[#14B8A6] shrink-0" />
                  )}
                  <span className="font-mono text-ink-primary truncate">
                    {isUploadingInvoice
                      ? 'Uploading invoice...'
                      : invoiceFileName || 'No equipment invoice attached yet (Optional)'}
                  </span>
                </div>
                <label className="cursor-pointer shrink-0 ml-2">
                  <Badge variant={invoiceFileName ? 'success' : 'neutral'} size="sm">
                    {isUploadingInvoice ? 'Uploading...' : invoiceFileName ? 'Attached' : 'Upload Proof'}
                  </Badge>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    disabled={isUploadingInvoice}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadDoc(file, 'equipment_invoice');
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 6: REVIEW */}
      {currentStep === 6 && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-contour-subtle pb-4">
            <h2 className="text-xl font-bold text-ink-primary">Step 6: Review & Confirmation</h2>
            <p className="text-xs text-ink-secondary mt-1">
              Confirm your application details before sending to the REEPY curation team.
            </p>
          </div>

          <div className="space-y-4 divide-y divide-contour-subtle text-xs">
            {/* Sec 1 */}
            <div className="pt-2 flex items-start justify-between">
              <div>
                <span className="font-bold uppercase text-ink-muted">Personal Info</span>
                <p className="text-sm font-bold text-ink-primary mt-0.5">{personal.name}</p>
                <p className="text-ink-secondary">{personal.phone} • {personal.email}</p>
                <p className="text-ink-secondary">Hub: {personal.city} {personal.serviceArea ? `(${personal.serviceArea})` : ''}</p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-bold text-[#14B8A6] hover:underline"
              >
                Edit
              </button>
            </div>

            {/* Sec 2 */}
            <div className="pt-3 flex items-start justify-between">
              <div>
                <span className="font-bold uppercase text-ink-muted">Professional Profile</span>
                <p className="text-ink-secondary mt-0.5 line-clamp-2">{professional.bio || 'Not provided'}</p>
                <p className="text-ink-secondary mt-1">
                  Experience: {professional.experienceYears} Years {professional.cameras ? `• Gear: ${professional.cameras}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs font-bold text-[#14B8A6] hover:underline"
              >
                Edit
              </button>
            </div>

            {/* Sec 3 */}
            <div className="pt-3 flex items-start justify-between">
              <div>
                <span className="font-bold uppercase text-ink-muted">Portfolio & Services</span>
                <p className="text-ink-secondary mt-0.5">{portfolioItems.length} curated portfolio samples</p>
                <p className="text-ink-secondary">{services.length} active service packages configured</p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-xs font-bold text-[#14B8A6] hover:underline"
              >
                Edit
              </button>
            </div>

            {/* Sec 4 */}
            <div className="pt-3 flex items-start justify-between">
              <div>
                <span className="font-bold uppercase text-ink-muted">Verification Attached</span>
                <p className="text-ink-secondary mt-0.5">
                  {idDocType}: {idFileName || 'Document pending upload'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="text-xs font-bold text-[#14B8A6] hover:underline"
              >
                Edit
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-canvas-secondary rounded-card-sm text-xs text-ink-secondary space-y-1">
            <p className="font-bold text-ink-primary">Creator Commitment Statement:</p>
            <p>
              By submitting, you confirm that you will arrive promptly at booked venues, carry the documented equipment, and strictly adhere to client privacy and quality standards.
            </p>
          </div>
        </Card>
      )}

      {/* Action Controls Bottom */}
      <div className="flex items-center justify-between pt-4 border-t border-contour-subtle">
        <Button
          type="button"
          variant="secondary"
          onClick={handleBack}
          disabled={currentStep === 1 || isSubmitting}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Previous Step
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
          disabled={isSubmitting}
          rightIcon={
            isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentStep === totalSteps ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          }
        >
          {isSubmitting
            ? 'Submitting Application...'
            : currentStep === totalSteps
            ? 'Submit Application for Review'
            : 'Save & Continue'}
        </Button>
      </div>
    </div>
  );
}
