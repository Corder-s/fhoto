'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  UploadCloud,
  ChevronRight,
  Info,
  Camera,
  RefreshCw
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { DemoNoticeBanner } from '../../../../components/photographer/DemoNoticeBanner';

type VerificationState =
  | 'not_submitted'
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'additional_info';

export default function PhotographerVerificationPage() {
  const [selectedState, setSelectedState] = useState<VerificationState>('under_review');

  const statesConfig: Record<
    VerificationState,
    {
      label: string;
      badgeVariant: 'neutral' | 'brand' | 'warning' | 'success' | 'error';
      icon: React.ElementType;
      iconBg: string;
      title: string;
      description: string;
      nextAction: string;
      actionButtonText: string;
      actionButtonHref: string;
    }
  > = {
    not_submitted: {
      label: 'Not Submitted',
      badgeVariant: 'neutral',
      icon: Info,
      iconBg: 'bg-zinc-100 text-zinc-600',
      title: 'Verification Documents Not Yet Submitted',
      description: 'To begin accepting bookings on SnapShoot, you must complete your creator onboarding and submit government-issued ID and equipment proofs.',
      nextAction: 'Complete the 6-step onboarding wizard and submit your documents.',
      actionButtonText: 'Start Onboarding Now →',
      actionButtonHref: '/photographer/onboarding',
    },
    draft: {
      label: 'Draft Application',
      badgeVariant: 'warning',
      icon: FileText,
      iconBg: 'bg-amber-100 text-amber-700',
      title: 'Verification In Draft Mode',
      description: 'You have started your application, but mandatory documents (e.g. proof of camera equipment) are still pending submission.',
      nextAction: 'Resume your application and upload the remaining required files.',
      actionButtonText: 'Resume Application →',
      actionButtonHref: '/photographer/onboarding',
    },
    submitted: {
      label: 'Submitted',
      badgeVariant: 'brand',
      icon: Clock,
      iconBg: 'bg-blue-100 text-blue-700',
      title: 'Application Received & Queued',
      description: 'Your verification dossier has been uploaded to our secure compliance repository and assigned a ticket ID (SNP-KYC-8821).',
      nextAction: 'Our team will begin manual review shortly.',
      actionButtonText: 'View Studio Dashboard',
      actionButtonHref: '/photographer/dashboard',
    },
    under_review: {
      label: 'Under Active Review',
      badgeVariant: 'warning',
      icon: Clock,
      iconBg: 'bg-amber-100 text-amber-800',
      title: 'Compliance Team Review In Progress',
      description: 'A dedicated SnapShoot quality specialist is currently auditing your photography portfolio, Aadhaar credentials, and equipment list.',
      nextAction: 'Expected turnaround time is 24 to 48 business hours. You will receive an SMS and email notification upon resolution.',
      actionButtonText: 'Explore Available Bookings',
      actionButtonHref: '/photographer/bookings',
    },
    approved: {
      label: 'Approved & Verified',
      badgeVariant: 'success',
      icon: CheckCircle2,
      iconBg: 'bg-green-100 text-green-700',
      title: 'Congratulations! Creator Status Verified',
      description: 'Your identity and professional gear have been verified. Your public profile displays the verified badge and you are eligible for on-demand radar dispatch.',
      nextAction: 'Turn on your radar switch to start receiving instant booking requests across your coverage areas.',
      actionButtonText: 'Go to Radar & Availability →',
      actionButtonHref: '/photographer/availability',
    },
    rejected: {
      label: 'Application Rejected',
      badgeVariant: 'error',
      icon: XCircle,
      iconBg: 'bg-red-100 text-red-700',
      title: 'Application Not Approved',
      description: 'Unfortunately, your current submission did not meet SnapShoot quality benchmarks. Reason: Portfolio images lacked original EXIF camera metadata and camera bodies were not dual card slot certified.',
      nextAction: 'You may update your portfolio and re-apply in 14 days or contact our creator support team.',
      actionButtonText: 'Contact Creator Support',
      actionButtonHref: '/photographer/settings',
    },
    additional_info: {
      label: 'Additional Info Required',
      badgeVariant: 'warning',
      icon: AlertCircle,
      iconBg: 'bg-purple-100 text-purple-700',
      title: 'Additional Documentation Requested',
      description: 'The review team requires clearer image scans of your government Aadhaar card (the initial file had glare over the date of birth).',
      nextAction: 'Please re-upload a clear high-resolution scan of your document.',
      actionButtonText: 'Re-upload Document Now →',
      actionButtonHref: '/photographer/onboarding',
    },
  };

  const currentConfig = statesConfig[selectedState];
  const StatusIcon = currentConfig.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <DemoNoticeBanner moduleName="Creator Verification Lifecycle" />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
          Creator Verification & KYC Lifecycle
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Monitor your identity audit, equipment inspection, and platform dispatch eligibility.
        </p>
      </div>

      {/* CURRENT STATUS PRESENTATION CARD */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-contour-subtle">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-sm ${currentConfig.iconBg}`}>
              <StatusIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Verification Status:</span>
                <Badge variant={currentConfig.badgeVariant} size="sm">
                  {currentConfig.label}
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-ink-primary mt-1">
                {currentConfig.title}
              </h2>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-ink-muted shrink-0">
            <p>Application ID: <span className="font-mono font-bold text-ink-primary">SNP-KYC-8821</span></p>
            <p className="mt-0.5">Last Checked: Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {/* Description & Action */}
        <div className="space-y-4">
          <p className="text-sm text-ink-secondary leading-relaxed">
            {currentConfig.description}
          </p>

          <div className="p-4 rounded-card-sm bg-canvas-primary border border-contour-subtle space-y-1">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-primary">Required Next Action:</p>
            <p className="text-xs text-ink-secondary">{currentConfig.nextAction}</p>
          </div>

          <div className="pt-2">
            <Link href={currentConfig.actionButtonHref}>
              <Button variant="primary" size="md">
                {currentConfig.actionButtonText}
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* DOCUMENT AUDIT CHECKLIST */}
      <Card className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-primary">
            Submitted Credential Checklist
          </h3>
          <span className="text-xs text-ink-muted">Security: AES-256 Encrypted</span>
        </div>

        <div className="divide-y divide-contour-subtle text-xs">
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <div>
                <p className="font-bold text-ink-primary">Government Identity Proof</p>
                <p className="text-ink-muted">Aadhaar Card (UIDAI Verified)</p>
              </div>
            </div>
            <span className="font-mono text-ink-muted">aadhaar_scan.pdf</span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <div>
                <p className="font-bold text-ink-primary">Dual-Slot Professional Camera Body</p>
                <p className="text-ink-muted">Sony A7 IV + Invoice attached</p>
              </div>
            </div>
            <span className="font-mono text-ink-muted">sony_invoice.pdf</span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <div>
                <p className="font-bold text-ink-primary">Portfolio Original EXIF Audit</p>
                <p className="text-ink-muted">6 high-res RAW/JPEG samples verified</p>
              </div>
            </div>
            <span className="text-green-700 font-bold">Passed</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
