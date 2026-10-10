'use client';

import React, { useState } from 'react';
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
  FileText
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { DemoNoticeBanner } from '../../../../components/photographer/DemoNoticeBanner';
import {
  INITIAL_PHOTOGRAPHER_PROFILE,
  INITIAL_SERVICES,
  INITIAL_PORTFOLIO
} from '../../../../data/photographerDashboardData';

export default function PhotographerOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Step 1: Personal
  const [personal, setPersonal] = useState({
    name: INITIAL_PHOTOGRAPHER_PROFILE.name,
    phone: INITIAL_PHOTOGRAPHER_PROFILE.phone,
    email: INITIAL_PHOTOGRAPHER_PROFILE.email,
    city: INITIAL_PHOTOGRAPHER_PROFILE.city,
    serviceArea: INITIAL_PHOTOGRAPHER_PROFILE.serviceArea.join(', '),
  });

  // Step 2: Professional
  const [professional, setProfessional] = useState({
    bio: INITIAL_PHOTOGRAPHER_PROFILE.bio,
    experienceYears: INITIAL_PHOTOGRAPHER_PROFILE.experienceYears,
    specialties: ['Editorial Portraits', 'Creator Shoots', 'Couples', 'Culinary & Cafe'],
    languages: INITIAL_PHOTOGRAPHER_PROFILE.languages.join(', '),
    cameras: INITIAL_PHOTOGRAPHER_PROFILE.equipment.cameras.join(', '),
    lenses: INITIAL_PHOTOGRAPHER_PROFILE.equipment.lenses.join(', '),
  });

  // Step 3: Portfolio
  const [portfolioItems, setPortfolioItems] = useState(
    INITIAL_PORTFOLIO.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      imageUrl: p.imageUrl,
    }))
  );

  // Step 4: Services
  const [services, setServices] = useState(INITIAL_SERVICES.slice(0, 3));

  // Step 5: Verification docs
  const [idDocType, setIdDocType] = useState('Aadhaar Card');
  const [idFileUploaded, setIdFileUploaded] = useState('aadhaar_front_back_scan.pdf (1.8 MB)');
  const [equipmentInvoiceUploaded, setEquipmentInvoiceUploaded] = useState('sony_camera_invoice.pdf (840 KB)');

  // Form error
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Step validation
  const validateStep = (step: number) => {
    setErrorMsg('');
    if (step === 1) {
      if (!personal.name.trim() || !personal.phone.trim() || !personal.city.trim()) {
        setErrorMsg('Please complete your full name, phone number, and city.');
        return false;
      }
    }
    if (step === 2) {
      if (!professional.bio.trim() || professional.experienceYears < 1) {
        setErrorMsg('Please enter a bio and at least 1 year of photography experience.');
        return false;
      }
    }
    if (step === 3) {
      if (portfolioItems.length < 2) {
        setErrorMsg('Please keep at least 2 portfolio samples for review.');
        return false;
      }
    }
    if (step === 4) {
      if (services.length < 1) {
        setErrorMsg('Please offer at least 1 service package.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setIsSubmitted(true);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setErrorMsg('');
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const stepsHeader = [
    { num: 1, title: 'Personal Info', icon: User },
    { num: 2, title: 'Profile & Gear', icon: Camera },
    { num: 3, title: 'Portfolio', icon: ImageIcon },
    { num: 4, title: 'Services', icon: Package },
    { num: 5, title: 'Verification', icon: ShieldCheck },
    { num: 6, title: 'Review & Finish', icon: CheckCircle2 },
  ];

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
            Onboarding Profile Submitted for Review!
          </h1>
          <p className="text-sm text-ink-secondary max-w-lg mx-auto">
            Your creator profile and credentials have been received. Our review team will verify your equipment specifications and identity documentation within 24 to 48 hours.
          </p>
        </div>

        <Card className="bg-canvas-secondary/60 p-6 text-left space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="warning" size="sm">Status: Under Review</Badge>
            <span className="text-xs font-mono font-bold text-ink-muted">Application Ref: ONB-DEL-9842</span>
          </div>
          <p className="text-xs text-ink-secondary">
            While your verification is pending, your public profile is visible in draft status. You can continue configuring your availability and adding services.
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
              Go to Workspace Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <DemoNoticeBanner moduleName="Creator Onboarding Wizard" />

      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
          Creator Onboarding & Approval Flow
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Complete the 6 verification steps to qualify for on-demand booking dispatch on SnapShoot.
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
                    ? 'bg-brand text-white font-bold'
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

        {/* Bar */}
        <div className="w-full bg-canvas-secondary rounded-full h-1.5 mt-4 overflow-hidden">
          <div
            className="bg-brand h-1.5 rounded-full transition-all duration-300"
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
            <p className="text-xs text-ink-secondary mt-1">Provide verified details for identity and marketplace dispatch.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Full Legal Name *</label>
              <input
                type="text"
                value={personal.name}
                onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Phone Number (SMS OTP) *</label>
              <input
                type="text"
                value={personal.phone}
                onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Email Address *</label>
              <input
                type="email"
                value={personal.email}
                onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Primary City / Hub *</label>
              <input
                type="text"
                value={personal.city}
                onChange={(e) => setPersonal({ ...personal, city: e.target.value })}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Service Coverage Areas *</label>
              <input
                type="text"
                value={personal.serviceArea}
                onChange={(e) => setPersonal({ ...personal, serviceArea: e.target.value })}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
                placeholder="e.g. South Delhi, Connaught Place, Gurugram Cyber Hub, Noida"
              />
              <p className="text-[11px] text-ink-muted">Separate multiple neighborhoods with commas.</p>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: PROFESSIONAL PROFILE */}
      {currentStep === 2 && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-contour-subtle pb-4">
            <h2 className="text-xl font-bold text-ink-primary">Step 2: Professional Profile & Gear</h2>
            <p className="text-xs text-ink-secondary mt-1">Showcase your creative background, camera gear, and specialties.</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Creative Bio *</label>
              <textarea
                rows={3}
                value={professional.bio}
                onChange={(e) => setProfessional({ ...professional, bio: e.target.value })}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
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
                  className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-ink-primary">Languages Spoken *</label>
                <input
                  type="text"
                  value={professional.languages}
                  onChange={(e) => setProfessional({ ...professional, languages: e.target.value })}
                  className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Camera Bodies (Dual Card Slot Preferred) *</label>
              <input
                type="text"
                value={professional.cameras}
                onChange={(e) => setProfessional({ ...professional, cameras: e.target.value })}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Prime & Zoom Lenses *</label>
              <input
                type="text"
                value={professional.lenses}
                onChange={(e) => setProfessional({ ...professional, lenses: e.target.value })}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
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
              <p className="text-xs text-ink-secondary mt-1">Add, preview, and reorder samples to show prospective clients.</p>
            </div>
            <Badge variant="brand" size="sm">{portfolioItems.length} photos selected</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {portfolioItems.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-canvas-secondary/50 rounded-card-sm border border-contour-subtle"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-16 h-16 rounded object-cover shrink-0"
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

          <p className="text-xs text-ink-muted bg-canvas-primary p-3 rounded border border-contour-subtle">
            ℹ️ You can upload additional client deliverables and high-resolution galleries anytime from the dedicated Portfolio Manager.
          </p>
        </Card>
      )}

      {/* STEP 4: SERVICES */}
      {currentStep === 4 && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-contour-subtle pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink-primary">Step 4: Photography Services & Pricing</h2>
              <p className="text-xs text-ink-secondary mt-1">Configure client-facing packages with duration and INR rates.</p>
            </div>
            <Badge variant="brand" size="sm">{services.length} packages active</Badge>
          </div>

          <div className="space-y-4">
            {services.map((srv, idx) => (
              <div key={srv.id} className="p-4 bg-canvas-secondary/40 rounded-card-sm border border-contour-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold uppercase text-brand mr-2">[{srv.category}]</span>
                    <span className="text-sm font-bold text-ink-primary">{srv.title}</span>
                  </div>
                  <span className="text-base font-extrabold text-ink-primary">₹{srv.priceInr.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-xs text-ink-secondary">{srv.description}</p>
                <div className="flex items-center gap-4 text-[11px] text-ink-muted pt-1">
                  <span>⏱️ {srv.durationHours} Hours Duration</span>
                  <span>•</span>
                  <span>📦 {srv.deliverables[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* STEP 5: VERIFICATION */}
      {currentStep === 5 && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-contour-subtle pb-4">
            <h2 className="text-xl font-bold text-ink-primary">Step 5: Identity & Equipment Verification</h2>
            <p className="text-xs text-ink-secondary mt-1">
              SnapShoot requires trust and safety verification for all photographers before marketplace dispatch.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-card-sm bg-brand-subtle/50 border border-brand-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-ink-primary">
                <ShieldCheck className="w-4 h-4 text-brand" />
                <span>Zero Public Exposure Guarantee</span>
              </div>
              <p className="text-xs text-ink-secondary">
                Government identity cards and GST invoices are encrypted at rest and audited exclusively by certified compliance officers. Documents are never exposed to clients or public URLs.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-ink-primary">Select ID Document Type *</label>
              <select
                value={idDocType}
                onChange={(e) => setIdDocType(e.target.value)}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
              >
                <option value="Aadhaar Card">Government Aadhaar Card (Front + Back)</option>
                <option value="PAN Card">Permanent Account Number (PAN Card)</option>
                <option value="Indian Passport">Republic of India Passport</option>
                <option value="Voter ID">Election Commission Voter ID</option>
              </select>
            </div>

            {/* Document upload placeholder */}
            <div className="border-2 border-dashed border-contour-strong rounded-card-md p-6 text-center space-y-2 bg-canvas-primary/60">
              <UploadCloud className="w-8 h-8 text-brand mx-auto" />
              <p className="text-xs font-bold text-ink-primary">Attached Document Preview (Simulated)</p>
              <p className="text-xs font-mono text-ink-muted">{idFileUploaded}</p>
              <Button variant="secondary" size="sm" type="button">
                Replace File (PDF, JPG, PNG)
              </Button>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold uppercase text-ink-primary">Camera Gear Purchase Invoice / Studio Proof</label>
              <div className="flex items-center justify-between p-3 bg-canvas-secondary rounded-card-sm text-xs border border-contour-subtle">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand" />
                  <span className="font-mono text-ink-primary">{equipmentInvoiceUploaded}</span>
                </div>
                <Badge variant="success" size="sm">Attached</Badge>
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
              Confirm your application details before sending to the SnapShoot curation team.
            </p>
          </div>

          <div className="space-y-4 divide-y divide-contour-subtle text-xs">
            {/* Sec 1 */}
            <div className="pt-2 flex items-start justify-between">
              <div>
                <span className="font-bold uppercase text-ink-muted">Personal Info</span>
                <p className="text-sm font-bold text-ink-primary mt-0.5">{personal.name}</p>
                <p className="text-ink-secondary">{personal.phone} • {personal.email}</p>
                <p className="text-ink-secondary">Hub: {personal.city} ({personal.serviceArea})</p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-bold text-brand hover:underline"
              >
                Edit
              </button>
            </div>

            {/* Sec 2 */}
            <div className="pt-3 flex items-start justify-between">
              <div>
                <span className="font-bold uppercase text-ink-muted">Professional Profile</span>
                <p className="text-ink-secondary mt-0.5 line-clamp-2">{professional.bio}</p>
                <p className="text-ink-secondary mt-1">Gear: {professional.cameras}</p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs font-bold text-brand hover:underline"
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
                className="text-xs font-bold text-brand hover:underline"
              >
                Edit
              </button>
            </div>

            {/* Sec 4 */}
            <div className="pt-3 flex items-start justify-between">
              <div>
                <span className="font-bold uppercase text-ink-muted">Verification Attached</span>
                <p className="text-ink-secondary mt-0.5">{idDocType}: {idFileUploaded}</p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="text-xs font-bold text-brand hover:underline"
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
          disabled={currentStep === 1}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Previous Step
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
          rightIcon={currentStep === totalSteps ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        >
          {currentStep === totalSteps ? 'Submit Application for Review' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  );
}
