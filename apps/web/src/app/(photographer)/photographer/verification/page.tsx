'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { getSupabaseBrowserClient } from '../../../../lib/supabase/client';
import { useAuth } from '../../../../lib/auth';

/**
 * Photographer verification (KYC) page.
 *
 * Everything on this screen is read from or written to the database through
 * /api/photographers/verification. The previous build was a demo: a local
 * `selectedState` dropdown let the page pretend to be "Under Active Review" with
 * a fake ticket id and a fake document checklist, so it could not be used to
 * actually become a verified photographer.
 *
 * Lifecycle (all persisted):
 *   unsubmitted -> pending (application filed) -> approved | rejected | needs_info
 *   approved    -> visible in /explore and on the public profile
 *   suspended   -> set by the platform; hidden, appeal through support
 * The admin decision arrives through the same row this page reads, so a refresh
 * after a review shows the new state without any client-side trick.
 */

type VerificationStatus = 'unsubmitted' | 'pending' | 'approved' | 'rejected' | 'suspended';

interface DocumentDraft {
  type: string;
  fileName: string;
  sizeBytes: number | null;
  mimeType: string | null;
  storagePath: string | null;
  externalUrl: string | null;
  uploading: boolean;
  error?: string;
}

interface SubmissionRow {
  id: string;
  reference_code: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  review_reason: string | null;
  review_notes: string | null;
  legal_name: string | null;
  government_id_type: string | null;
  government_id_masked: string | null;
  categories: string[] | null;
  documents: Array<Record<string, any>> | null;
}

const DOCUMENT_TYPES = [
  { id: 'government_id', label: 'Government ID' },
  { id: 'address_proof', label: 'Address proof' },
  { id: 'gst_certificate', label: 'GST certificate' },
  { id: 'equipment_invoice', label: 'Equipment invoice' },
  { id: 'business_registration', label: 'Business registration' },
  { id: 'portfolio_sample', label: 'Portfolio sample' },
  { id: 'other', label: 'Other' },
];

const ID_TYPES = [
  { id: 'aadhaar', label: 'Aadhaar card' },
  { id: 'pan', label: 'PAN card' },
  { id: 'passport', label: 'Passport' },
  { id: 'driving_licence', label: 'Driving licence' },
  { id: 'voter_id', label: 'Voter ID' },
];

const STATUS_PRESENTATION: Record<
  VerificationStatus,
  { label: string; badge: 'neutral' | 'brand' | 'warning' | 'success' | 'error'; icon: React.ElementType; tone: string; title: string; description: string }
> = {
  unsubmitted: {
    label: 'Not submitted',
    badge: 'neutral',
    icon: Info,
    tone: 'bg-zinc-100 text-zinc-600',
    title: 'No verification application on file',
    description:
      'Complete the form below with your identity document and equipment details. Your submission is saved as “pending” and appears in the administrator review queue.',
  },
  pending: {
    label: 'Pending review',
    badge: 'warning',
    icon: Clock,
    tone: 'bg-amber-100 text-amber-800',
    title: 'Your application is waiting for an administrator',
    description:
      'An administrator with the “Review photographer verification” permission sees this application in the admin dashboard. Your profile stays out of the public directory until a decision is recorded.',
  },
  approved: {
    label: 'Verified',
    badge: 'success',
    icon: CheckCircle2,
    tone: 'bg-green-100 text-green-700',
    title: 'Verified and published',
    description:
      'Your profile is visible in the photographer directory and on your public page, and you can receive bookings. Keep your documents current — a suspension hides the profile again.',
  },
  rejected: {
    label: 'Rejected',
    badge: 'error',
    icon: XCircle,
    tone: 'bg-red-100 text-red-700',
    title: 'Application not approved',
    description:
      'Read the reviewer’s reason below, fix what was flagged, and submit again. Re-applying creates a new application in the pending state.',
  },
  suspended: {
    label: 'Suspended',
    badge: 'error',
    icon: AlertCircle,
    tone: 'bg-red-100 text-red-700',
    title: 'Profile suspended by the platform',
    description:
      'Your public profile is unpublished while your sign-in keeps working. You may file a new application; an administrator reviews it before anything is published again.',
  },
};

const formatBytes = (value: number | null) =>
  value && value > 0 ? `${Math.max(1, Math.round(value / 1024))} KB` : '';

const when = (value: string | null) =>
  value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function PhotographerVerificationPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<VerificationStatus>('unsubmitted');
  const [creatorProfile, setCreatorProfile] = useState<Record<string, any> | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [canSubmit, setCanSubmit] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    legalName: '',
    businessName: '',
    contactPhone: '',
    governmentIdType: 'aadhaar',
    governmentIdNumber: '',
    gstin: '',
    city: '',
    state: 'Delhi',
    serviceRadiusKm: '25',
    portfolioUrl: '',
    equipmentSummary: '',
    notes: '',
    categories: [] as string[],
  });
  const [documents, setDocuments] = useState<DocumentDraft[]>([]);
  const [documentType, setDocumentType] = useState('government_id');
  const [linkDraft, setLinkDraft] = useState('');
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  const flash = useCallback((text: string, tone: 'ok' | 'error' = 'ok') => {
    setNotice({ text, tone });
    setTimeout(() => setNotice(null), 6000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/photographers/verification', { cache: 'no-store', credentials: 'same-origin' });
      const body = (await res.json().catch(() => ({}))) as {
        verificationStatus?: VerificationStatus;
        creatorProfile?: Record<string, any> | null;
        submissions?: SubmissionRow[];
        canSubmit?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(body.error || `Could not load your verification status (${res.status}).`);
      setStatus((body.verificationStatus as VerificationStatus) || 'unsubmitted');
      setCreatorProfile(body.creatorProfile || null);
      setSubmissions(body.submissions || []);
      setCanSubmit(body.canSubmit !== false);
      setLoadError(null);
      setForm((prev) => ({
        ...prev,
        businessName: prev.businessName || body.creatorProfile?.professional_name || '',
        city: prev.city || body.creatorProfile?.city || '',
        state: prev.state || body.creatorProfile?.state || 'Delhi',
        portfolioUrl: prev.portfolioUrl || body.creatorProfile?.portfolio_url || '',
      }));
    } catch (err: any) {
      setLoadError(err?.message || 'Could not load your verification status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetch('/api/categories', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { categories: [] }))
      .then((body) => {
        const list = Array.isArray(body?.categories) ? body.categories : [];
        setCategories(list.map((entry: any) => ({ id: String(entry.slug || entry.id), name: String(entry.name) })).slice(0, 24));
      })
      .catch(() => setCategories([]));
  }, [load]);

  // Seed the legal name from the account so the required field is not blank work.
  useEffect(() => {
    if (user?.name && !form.legalName) setForm((prev) => ({ ...prev, legalName: user.name }));
  }, [user?.name, form.legalName]);

  const presentation = STATUS_PRESENTATION[status] || STATUS_PRESENTATION.unsubmitted;
  const StatusIcon = presentation.icon;
  const openSubmission = useMemo(() => submissions.find((row) => row.status === 'pending' || row.status === 'needs_info'), [submissions]);

  const uploadFiles = async (files: FileList) => {
    if (!user?.id) {
      flash('Sign in again before uploading documents.', 'error');
      return;
    }
    for (const file of Array.from(files)) {
      if (file.size > 25 * 1024 * 1024) {
        setDocuments((prev) => [
          ...prev,
          { type: documentType, fileName: file.name, sizeBytes: file.size, mimeType: file.type, storagePath: null, externalUrl: null, uploading: false, error: 'Larger than the 25 MB limit' },
        ]);
        continue;
      }
      setDocuments((prev) => [
        ...prev,
        { type: documentType, fileName: file.name, sizeBytes: file.size, mimeType: file.type || null, storagePath: null, externalUrl: null, uploading: true },
      ]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', documentType);

        const res = await fetch('/api/photographers/verification/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();

        setDocuments((prev) => {
          const copy = [...prev];
          let index = -1;
          for (let position = copy.length - 1; position >= 0; position -= 1) {
            if (copy[position].fileName === file.name && copy[position].uploading) {
              index = position;
              break;
            }
          }
          if (index === -1) return copy;
          copy[index] = !res.ok || !data.success
            ? { ...copy[index], uploading: false, error: data.error || 'Upload failed' }
            : { ...copy[index], uploading: false, storagePath: data.document.storage_path };
          return copy;
        });
      } catch (err: any) {
        setDocuments((prev) => {
          const copy = [...prev];
          let index = -1;
          for (let position = copy.length - 1; position >= 0; position -= 1) {
            if (copy[position].fileName === file.name && copy[position].uploading) {
              index = position;
              break;
            }
          }
          if (index === -1) return copy;
          copy[index] = { ...copy[index], uploading: false, error: err?.message || 'Upload error' };
          return copy;
        });
      }
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  const addLink = () => {
    const value = linkDraft.trim();
    if (!value) return;
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      flash('That is not a valid https link.', 'error');
      return;
    }
    if (parsed.protocol !== 'https:') {
      flash('Only https links can be attached.', 'error');
      return;
    }
    setDocuments((prev) => [
      ...prev,
      { type: documentType, fileName: parsed.hostname + parsed.pathname.slice(0, 40), sizeBytes: null, mimeType: null, storagePath: null, externalUrl: value, uploading: false },
    ]);
    setLinkDraft('');
  };

  const submitApplication = async () => {
    if (!documents.some((doc) => !doc.uploading && (doc.storagePath || doc.externalUrl) && doc.type === 'government_id')) {
      flash('Upload your government ID first — it is required.', 'error');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        legalName: form.legalName,
        businessName: form.businessName,
        contactPhone: form.contactPhone,
        governmentIdType: form.governmentIdType,
        governmentIdNumber: form.governmentIdNumber,
        gstin: form.gstin,
        city: form.city,
        state: form.state,
        serviceRadiusKm: form.serviceRadiusKm ? Number(form.serviceRadiusKm) : undefined,
        portfolioUrl: form.portfolioUrl,
        equipmentSummary: form.equipmentSummary,
        notes: form.notes,
        categories: form.categories,
        documents: documents
          .filter((doc) => !doc.uploading && (doc.storagePath || doc.externalUrl))
          .map((doc) => ({
            type: doc.type,
            storagePath: doc.storagePath,
            externalUrl: doc.externalUrl,
            fileName: doc.fileName,
            mimeType: doc.mimeType,
            sizeBytes: doc.sizeBytes,
          })),
      };
      const res = await fetch('/api/photographers/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string; referenceCode?: string };
      if (!res.ok) throw new Error(body.error || 'Could not submit your application.');
      flash(`${body.message || 'Application submitted.'}${body.referenceCode ? ` Reference ${body.referenceCode}.` : ''}`);
      setGovernmentIdNumberClear();
      await load();
    } catch (err: any) {
      flash(err?.message || 'Could not submit your application.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const setGovernmentIdNumberClear = () => {
    setForm((prev) => ({ ...prev, governmentIdNumber: '' }));
  };

  const withdraw = async (submissionId: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/photographers/verification?submissionId=${encodeURIComponent(submissionId)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || 'Could not withdraw the application.');
      flash('Application withdrawn. You can edit and submit again.');
      await load();
    } catch (err: any) {
      flash(err?.message || 'Could not withdraw the application.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">Creator verification</h1>
        <p className="text-sm text-ink-secondary mt-1">
          Submit the documents the platform requires, watch the review state, and know exactly when your profile goes
          public.
        </p>
      </div>

      {loadError && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          {loadError}
        </div>
      )}

      <Card className="p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${presentation.tone}`}>
              <StatusIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Status</span>
                <Badge variant={presentation.badge} size="sm">
                  {presentation.label}
                </Badge>
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-ink-muted" />}
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-ink-primary mt-1">{presentation.title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-xl border border-[#E7EAEE] text-[11px] font-bold text-ink-secondary hover:text-ink-primary cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Check for a decision</span>
          </button>
        </div>

        <p className="text-sm text-ink-secondary leading-relaxed">{presentation.description}</p>

        {openSubmission && (
          <div className="rounded-2xl bg-canvas-primary border border-contour-subtle p-4 space-y-1 text-[11px]">
            <p className="font-bold text-ink-primary">
              Application {openSubmission.reference_code} filed {when(openSubmission.submitted_at)}
            </p>
            {openSubmission.status === 'needs_info' && (
              <p className="text-purple-700 font-semibold">
                The reviewer needs more information: {openSubmission.review_reason || 'see the reviewer note'}. Update
                the documents and submit again.
              </p>
            )}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                disabled={busy}
                onClick={() => withdraw(openSubmission.id)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:underline disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Withdraw and edit</span>
              </button>
              {status !== 'approved' && (
                <span className="text-ink-muted">
                  Documents are stored privately; only you and platform reviewers can open them.
                </span>
              )}
            </div>
          </div>
        )}

        {status === 'approved' && creatorProfile?.id && (
          <Link href={`/photographers/${creatorProfile.user_id || creatorProfile.id}`} className="inline-flex">
            <Button variant="outline" size="sm" leftIcon={<ShieldCheck className="w-4 h-4" />}>
              View my public profile
            </Button>
          </Link>
        )}
      </Card>

      {canSubmit && (
        <Card className="p-6 sm:p-8 space-y-5">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-primary">
              {submissions.length > 0 ? 'Re-apply with updated details' : 'Verification application'}
            </h3>
            <p className="text-[11px] text-ink-muted mt-1">
              Fields marked * are required. The ID number is stored only as its last four characters; the file itself
              stays in private storage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Legal name (as printed on your ID) *">
              <input
                value={form.legalName}
                onChange={(event) => setForm((prev) => ({ ...prev, legalName: event.target.value }))}
                className={inputClass}
                placeholder="Vikramaditya Rathore"
              />
            </Field>
            <Field label="Studio / business name">
              <input
                value={form.businessName}
                onChange={(event) => setForm((prev) => ({ ...prev, businessName: event.target.value }))}
                className={inputClass}
                placeholder="Rathore Studios"
              />
            </Field>
            <Field label="Contact number">
              <input
                value={form.contactPhone}
                onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
                className={inputClass}
                placeholder="+91 98765 43210"
                inputMode="tel"
              />
            </Field>
            <Field label="Government ID type *">
              <select
                value={form.governmentIdType}
                onChange={(event) => setForm((prev) => ({ ...prev, governmentIdType: event.target.value }))}
                className={inputClass}
              >
                {ID_TYPES.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="ID number (only the last 4 characters are stored) *">
              <input
                value={form.governmentIdNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, governmentIdNumber: event.target.value }))}
                className={inputClass}
                placeholder="1234 5678 9012"
                autoComplete="off"
              />
            </Field>
            <Field label="GSTIN (optional)">
              <input
                value={form.gstin}
                onChange={(event) => setForm((prev) => ({ ...prev, gstin: event.target.value.toUpperCase() }))}
                className={inputClass}
                placeholder="07ABCDE1234F1Z5"
              />
            </Field>
            <Field label="City">
              <input
                value={form.city}
                onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                className={inputClass}
                placeholder="Delhi NCR"
              />
            </Field>
            <Field label="State">
              <input
                value={form.state}
                onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))}
                className={inputClass}
                placeholder="Delhi"
              />
            </Field>
            <Field label="Service radius (km)">
              <input
                type="number"
                min={1}
                max={500}
                value={form.serviceRadiusKm}
                onChange={(event) => setForm((prev) => ({ ...prev, serviceRadiusKm: event.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="Portfolio link (https)">
              <input
                value={form.portfolioUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, portfolioUrl: event.target.value }))}
                className={inputClass}
                placeholder="https://instagram.com/your.work"
              />
            </Field>
          </div>

          {categories.length > 0 && (
            <Field label="Categories you cover">
              <div className="flex flex-wrap gap-2 pt-1">
                {categories.map((category) => {
                  const active = form.categories.includes(category.name);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          categories: active
                            ? prev.categories.filter((name) => name !== category.name)
                            : [...prev.categories, category.name],
                        }))
                      }
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#191C22] text-white border-[#191C22]'
                          : 'bg-white text-ink-secondary border-[#E7EAEE] hover:text-ink-primary'
                      }`}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          <Field label="Equipment you own (helps the reviewer judge capability)">
            <textarea
              rows={3}
              value={form.equipmentSummary}
              onChange={(event) => setForm((prev) => ({ ...prev, equipmentSummary: event.target.value }))}
              className={inputClass}
              placeholder="Sony A7 IV (dual slot), 24-70 f/2.8, 85 f/1.8, 3 lights, backup bodies"
            />
          </Field>

          <Field label="Anything the reviewer should know">
            <textarea
              rows={2}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              className={inputClass}
              placeholder="Availability constraints, insurance, team size…"
            />
          </Field>

          <div className="space-y-3 pt-2 border-t border-contour-subtle">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-ink-primary">Documents *</p>
                <p className="text-[10px] text-ink-muted">JPG, PNG or PDF up to 25 MB each.</p>
              </div>
              <div className="flex items-end gap-2">
                <label className="text-[10px] font-bold text-ink-muted">
                  <span>Attach as</span>
                  <select
                    value={documentType}
                    onChange={(event) => setDocumentType(event.target.value)}
                    className={`${inputClass} mt-0.5`}
                  >
                    {DOCUMENT_TYPES.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </label>
                <input ref={fileInput} type="file" multiple accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={(event) => event.target.files && uploadFiles(event.target.files)} />
                <Button size="sm" variant="secondary" onClick={() => fileInput.current?.click()} leftIcon={<UploadCloud className="w-4 h-4" />}>
                  Choose files
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                value={linkDraft}
                onChange={(event) => setLinkDraft(event.target.value)}
                placeholder="…or paste an https link to a shared document"
                className={inputClass}
              />
              <Button size="sm" variant="outline" onClick={addLink}>
                Attach link
              </Button>
            </div>

            {documents.length > 0 && (
              <ul className="divide-y divide-contour-subtle rounded-2xl border border-contour-subtle">
                {documents.map((doc, index) => (
                  <li key={`${doc.fileName}-${index}`} className="flex items-center justify-between gap-2 p-2.5 text-[11px]">
                    <span className="inline-flex items-center gap-2 min-w-0">
                      {doc.uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-brand shrink-0" />
                      ) : doc.error ? (
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-ink-muted shrink-0" />
                      )}
                      <span className="min-w-0">
                        <span className="block font-bold text-ink-primary truncate">{doc.fileName}</span>
                        <span className="block text-[10px] text-ink-muted">
                          {DOCUMENT_TYPES.find((entry) => entry.id === doc.type)?.label || doc.type} •{' '}
                          {formatBytes(doc.sizeBytes) || 'linked file'}
                          {doc.error ? ` • ${doc.error}` : doc.storagePath ? ' • uploaded privately' : ''}
                        </span>
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setDocuments((prev) => prev.filter((_, position) => position !== index))}
                      className="p-1 rounded-md text-ink-muted hover:text-red-600 cursor-pointer shrink-0"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {notice && (
            <div
              role="status"
              className={`rounded-xl px-3 py-2 text-[11px] font-bold text-white ${notice.tone === 'error' ? 'bg-red-600' : 'bg-[#191C22]'}`}
            >
              {notice.text}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button onClick={submitApplication} disabled={busy} variant="primary" size="md">
              {busy ? 'Submitting…' : submissions.length > 0 ? 'Submit application again' : 'Submit for verification'}
            </Button>
            <span className="text-[10px] text-ink-muted">
              Submitting writes one pending record and takes your profile out of the directory until it is approved.
            </span>
          </div>
        </Card>
      )}

      {submissions.length > 0 && (
        <Card className="p-6 sm:p-8 space-y-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-primary">Application history</h3>
          <ul className="divide-y divide-contour-subtle">
            {submissions.map((row) => (
              <li key={row.id} className="py-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold text-ink-primary">
                    {row.reference_code}
                    <span className="ml-2 font-mono text-[10px] text-ink-muted">{row.legal_name ? `ID ${row.government_id_masked || '—'}` : ''}</span>
                  </p>
                  <Badge
                    size="sm"
                    variant={
                      row.status === 'approved'
                        ? 'success'
                        : row.status === 'rejected'
                          ? 'error'
                          : row.status === 'needs_info'
                            ? 'warning'
                            : 'neutral'
                    }
                  >
                    {row.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-[10px] text-ink-muted">
                  Filed {when(row.submitted_at)} • Reviewed {when(row.reviewed_at)} •{' '}
                  {Array.isArray(row.documents) ? row.documents.length : 0} document(s)
                  {row.categories?.length ? ` • ${row.categories.join(', ')}` : ''}
                </p>
                {(row.review_reason || row.review_notes) && (
                  <p className="text-[11px] text-ink-secondary italic">
                    Reviewer: {row.review_reason || row.review_notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-[#E7EAEE] bg-white px-3 py-2 text-[12px] text-ink-primary outline-none focus:border-brand';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block space-y-1">
    <span className="text-[10px] font-black uppercase tracking-wider text-ink-muted">{label}</span>
    {children}
  </label>
);
