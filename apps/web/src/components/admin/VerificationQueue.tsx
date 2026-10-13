'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';

/**
 * Photographer verification queue.
 *
 * One row is one database record in `creator_verification_submissions`. An
 * approve / reject / request-information click PATCHes that record; the database
 * trigger then publishes or unpublishes the photographer's profile and files the
 * notification. Nothing here flips a local "approved" flag: after a decision the
 * queue is re-read from the server, so what the reviewer sees is what Postgres
 * stored.
 *
 * Documents are never listed with their storage paths. Opening one asks the
 * server for a short-lived signed URL, which re-checks both the permission and
 * that the object belongs to that applicant.
 */

interface DocumentEntry {
  id: string;
  type: string;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  hasStorageObject: boolean;
  externalUrl: string | null;
}

export interface VerificationSubmission {
  id: string;
  referenceCode: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewReason: string | null;
  reviewNotes: string | null;
  reviewer: { full_name: string | null; email: string | null } | null;
  creatorProfileId: string;
  applicantUserId: string;
  legalName: string | null;
  businessName: string | null;
  contactPhone: string | null;
  governmentIdType: string | null;
  governmentIdMasked: string | null;
  gstin: string | null;
  equipmentSummary: string | null;
  categories: string[];
  city: string | null;
  state: string | null;
  serviceRadiusKm: number | null;
  portfolioUrl: string | null;
  applicantNotes: string | null;
  documentCount: number;
  documents: DocumentEntry[];
  professionalName: string | null;
  profileVerificationStatus: string | null;
  applicant: { fullName: string | null; email: string | null; accountStatus: string | null } | null;
}

const FILTERS = [
  { id: 'pending', label: 'Awaiting review' },
  { id: 'needs_info', label: 'Waiting on applicant' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
] as const;

const STATUS_TONE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  needs_info: 'bg-purple-100 text-purple-800 border-purple-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

const inrDate = (value: string | null) =>
  value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export const VerificationQueue: React.FC<{ canReview: boolean; compact?: boolean }> = ({ canReview, compact }) => {
  const [status, setStatus] = useState<string>('pending');
  const [rows, setRows] = useState<VerificationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});

  const flash = useCallback((text: string, tone: 'ok' | 'error' = 'ok') => {
    setNotice({ text, tone });
    setTimeout(() => setNotice(null), 5000);
  }, []);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/admin/verification?status=${encodeURIComponent(status)}`, {
          cache: 'no-store',
        });
        const body = (await res.json().catch(() => ({}))) as { submissions?: VerificationSubmission[]; error?: string };
        if (!res.ok) throw new Error(body.error || `Could not load the queue (${res.status})`);
        setRows(body.submissions || []);
      } catch (err: any) {
        setLoadError(err?.message || 'Could not load the queue.');
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [status]
  );

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (submission: VerificationSubmission, action: 'approve' | 'reject' | 'needs_info') => {
    setBusyId(submission.id);
    try {
      const reason = (reasons[submission.id] || '').trim();
      if ((action === 'reject' || action === 'needs_info') && reason.length < 4) {
        throw new Error('Write a short reason first — the photographer sees it.');
      }
      const res = await fetch('/api/admin/verification', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ submissionId: submission.id, action, reason: reason || undefined }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string; creator?: { verificationStatus?: string } };
      if (!res.ok) throw new Error(body.error || 'Could not record the decision.');
      flash(
        body.message ||
          `Decision recorded. Profile is now ${body.creator?.verificationStatus || 'updated'} in the database.`
      );
      setReasons((prev) => ({ ...prev, [submission.id]: '' }));
      await load(true);
    } catch (err: any) {
      flash(err?.message || 'Could not record the decision.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const openDocument = async (submissionId: string, index: number) => {
    const key = `${submissionId}:${index}`;
    if (documentUrls[key]) {
      window.open(documentUrls[key], '_blank', 'noopener');
      return;
    }
    try {
      const res = await fetch(
        `/api/admin/verification/document?submissionId=${encodeURIComponent(submissionId)}&index=${index}`,
        { cache: 'no-store' }
      );
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error || 'Could not open that document.');
      setDocumentUrls((prev) => ({ ...prev, [key]: body.url as string }));
      window.open(body.url, '_blank', 'noopener');
    } catch (err: any) {
      flash(err?.message || 'Could not open that document.', 'error');
    }
  };

  return (
    <section id="verification-queue" className="scroll-mt-24 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#FF6E00]" />
          <h3 className="text-sm font-black text-[#1A1816]">Photographer verification</h3>
          <span className="text-[10px] font-bold text-[#8C847A]">
            {loading ? 'loading…' : `${rows.length} in “${FILTERS.find((f) => f.id === status)?.label || status}”`}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatus(filter.id)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                status === filter.id ? 'bg-[#FF6E00] text-white shadow-2xs' : 'text-[#736B63] hover:text-[#1A1816]'
              }`}
            >
              {filter.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => load()}
            title="Re-read from the database"
            className="p-1 rounded-md text-[#736B63] hover:text-[#1A1816] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {!canReview && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold text-amber-900">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Your administrator role does not include “Review photographer verification”, so the queue is read-only. An
            owner can grant it from the owner dashboard.
          </span>
        </div>
      )}

      {loadError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] font-semibold text-red-700">
          {loadError}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className={`rounded-xl px-3 py-2 text-[11px] font-bold text-white ${
            notice.tone === 'error' ? 'bg-red-600' : 'bg-[#1A1816]'
          }`}
        >
          {notice.text}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <p className="text-xs text-[#8C847A] py-6 text-center">No applications in this view.</p>
      )}

      <div className="divide-y divide-[#F2ECE3]">
        {rows.map((row) => {
          const expanded = openId === row.id;
          const busy = busyId === row.id;
          return (
            <article key={row.id} className="py-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1A1816] truncate">
                    {row.businessName || row.professionalName || row.legalName || 'Unnamed applicant'}
                  </p>
                  <p className="text-[10px] text-[#8C847A] truncate">
                    {row.applicant?.fullName || row.legalName || '—'} • {row.applicant?.email || 'no e-mail'}
                  </p>
                  <p className="text-[10px] text-[#A69F96] truncate">
                    {row.referenceCode} • {[row.city, row.state].filter(Boolean).join(', ') || 'location not set'} •
                    filed {inrDate(row.submittedAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wide ${
                      STATUS_TONE[row.status] || 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {row.status.replace('_', ' ')}
                  </span>
                  <span className="text-[9px] font-bold text-[#8C847A]">
                    profile: {row.profileVerificationStatus || 'unknown'}
                  </span>
                </div>
              </div>

              {!compact && row.reviewReason && (
                <p className="text-[10px] font-semibold text-[#736B63]">
                  Reviewer note ({row.reviewer?.full_name || 'platform'}): {row.reviewReason}
                </p>
              )}

              <button
                type="button"
                onClick={() => setOpenId(expanded ? null : row.id)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF6E00] cursor-pointer"
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                {expanded ? 'Hide application' : 'Open application'}
              </button>

              {expanded && (
                <div className="rounded-2xl border border-[#E8E2D8] bg-[#FCFAF7] p-3 space-y-3">
                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                    <Detail label="Legal name" value={row.legalName} />
                    <Detail label="Government ID" value={[row.governmentIdType, row.governmentIdMasked].filter(Boolean).join(' ')} />
                    <Detail label="GSTIN" value={row.gstin} />
                    <Detail label="Phone" value={row.contactPhone} />
                    <Detail label="Radius" value={row.serviceRadiusKm ? `${row.serviceRadiusKm} km` : null} />
                    <Detail label="Categories" value={row.categories?.join(', ')} />
                    <Detail label="Portfolio" value={row.portfolioUrl} />
                    <Detail label="Account" value={row.applicant?.accountStatus ?? null} />
                    <Detail label="Reviewed" value={row.reviewedAt ? inrDate(row.reviewedAt) : null} />
                  </dl>

                  {row.equipmentSummary && (
                    <p className="text-[11px] text-[#5A544D] leading-relaxed whitespace-pre-line">{row.equipmentSummary}</p>
                  )}
                  {row.applicantNotes && (
                    <p className="text-[11px] italic text-[#736B63]">“{row.applicantNotes}”</p>
                  )}

                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#8C847A]">
                      Documents ({row.documents.length})
                    </p>
                    {row.documents.length === 0 && <p className="text-[10px] text-[#A69F96]">No files attached.</p>}
                    <ul className="space-y-1">
                      {row.documents.map((doc, index) => (
                        <li key={`${doc.id}-${index}`} className="flex items-center justify-between gap-2 text-[10px]">
                          <span className="inline-flex items-center gap-1.5 min-w-0 text-[#1A1816] font-semibold">
                            <FileText className="w-3 h-3 shrink-0 text-[#8C847A]" />
                            <span className="truncate">
                              {doc.type.replace('_', ' ')} — {doc.fileName || 'unnamed file'}
                              {doc.sizeBytes ? ` (${Math.round(doc.sizeBytes / 1024)} KB)` : ''}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => openDocument(row.id, index)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-[#E8E2D8] font-bold text-[#FF6E00] cursor-pointer shrink-0"
                          >
                            {doc.hasStorageObject ? <Clock className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                            <span>Open</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-[#EFE7DC]">
                    <textarea
                      value={reasons[row.id] || ''}
                      onChange={(event) => setReasons((prev) => ({ ...prev, [row.id]: event.target.value }))}
                      placeholder="Reason shown to the photographer (required for rejection or for asking for more information)"
                      rows={2}
                      disabled={!canReview || busy}
                      className="w-full rounded-xl border border-[#E8E2D8] bg-white p-2 text-[11px] text-[#1A1816] disabled:opacity-60"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={!canReview || busy}
                        onClick={() => decide(row, 'approve')}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 text-white disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve &amp; publish</span>
                      </button>
                      <button
                        type="button"
                        disabled={!canReview || busy}
                        onClick={() => decide(row, 'needs_info')}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold bg-white border border-purple-200 text-purple-700 disabled:opacity-50 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Request information</span>
                      </button>
                      <button
                        type="button"
                        disabled={!canReview || busy}
                        onClick={() => decide(row, 'reject')}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold bg-white border border-red-200 text-red-600 disabled:opacity-50 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      {busy && <span className="text-[10px] font-bold text-[#8C847A]">saving…</span>}
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};

const Detail: React.FC<{ label: string; value: string | number | null }> = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="text-[9px] font-black uppercase tracking-wider text-[#A69F96]">{label}</dt>
    <dd className="text-[10px] font-semibold text-[#1A1816] break-words">{value || '—'}</dd>
  </div>
);

export default VerificationQueue;
