'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  UserCheck,
  UserX,
  X,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useServerSession } from '../../../../lib/useServerSession';

interface CreatorItem {
  id: string;
  user_id: string;
  professional_name: string | null;
  city: string | null;
  state: string | null;
  experience_years: number | null;
  verification_status: string;
  average_rating: string | number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone_number: string | null;
    account_status: string | null;
  } | null;
  openSubmission: {
    id: string;
    reference_code: string;
    submitted_at: string;
    status: string;
  } | null;
}

type TabType = 'pending' | 'approved' | 'suspended' | 'all';

export default function AdminPhotographersPage() {
  const session = useServerSession();
  const [creators, setCreators] = useState<CreatorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);

  // Reject modal state
  const [rejectingCreator, setRejectingCreator] = useState<CreatorItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const isOwner = session.status === 'authenticated' && session.user.roles.includes('owner');
  const isAdmin = session.status === 'authenticated' && session.user.roles.includes('admin');
  const granted = session.status === 'authenticated' ? session.user.permissions : [];
  const canReview = isOwner || isAdmin || granted.includes('manage_photographer_verification');

  const showToast = useCallback((text: string, tone: 'ok' | 'error' = 'ok') => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadCreators = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/creators?status=all', { cache: 'no-store' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Could not load photographers (${res.status})`);
      setCreators(body.creators || []);
    } catch (err: any) {
      setLoadError(err?.message || 'Could not load photographers list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCreators();
  }, [loadCreators]);

  const handleApprove = async (creator: CreatorItem) => {
    setBusyId(creator.id);
    try {
      const res = await fetch('/api/admin/creators', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorProfileId: creator.id,
          userId: creator.user_id,
          action: 'approve',
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Could not approve photographer.');
      showToast(`Photographer ${creator.professional_name || creator.user?.full_name || 'profile'} verified and published!`);
      await loadCreators();
    } catch (err: any) {
      showToast(err?.message || 'Approval failed.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingCreator) return;
    if (!rejectReason.trim() || rejectReason.trim().length < 4) {
      showToast('Please provide a descriptive reason for rejection.', 'error');
      return;
    }
    setBusyId(rejectingCreator.id);
    try {
      const res = await fetch('/api/admin/creators', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorProfileId: rejectingCreator.id,
          userId: rejectingCreator.user_id,
          action: 'reject',
          reason: rejectReason.trim(),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Could not reject photographer.');
      showToast('Photographer application rejected.');
      setRejectingCreator(null);
      setRejectReason('');
      await loadCreators();
    } catch (err: any) {
      showToast(err?.message || 'Rejection failed.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (creator: CreatorItem, action: 'suspend_profile' | 'reinstate_profile') => {
    setBusyId(creator.id);
    try {
      const res = await fetch('/api/admin/creators', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorProfileId: creator.id,
          userId: creator.user_id,
          action,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Status update failed.');
      showToast(
        action === 'suspend_profile'
          ? 'Photographer profile unpublished and suspended.'
          : 'Photographer profile reinstated and published.'
      );
      await loadCreators();
    } catch (err: any) {
      showToast(err?.message || 'Status change failed.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  // Metrics
  const totalCount = creators.length;
  const pendingCount = creators.filter(
    (c) => c.verification_status === 'pending' || c.verification_status === 'unsubmitted'
  ).length;
  const approvedCount = creators.filter((c) => c.verification_status === 'approved').length;
  const suspendedCount = creators.filter(
    (c) => c.verification_status === 'suspended' || c.verification_status === 'rejected'
  ).length;

  // Filtered list
  const filtered = creators.filter((c) => {
    if (activeTab === 'pending') {
      if (c.verification_status !== 'pending' && c.verification_status !== 'unsubmitted') return false;
    } else if (activeTab === 'approved') {
      if (c.verification_status !== 'approved') return false;
    } else if (activeTab === 'suspended') {
      if (c.verification_status !== 'suspended' && c.verification_status !== 'rejected') return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const profName = (c.professional_name || '').toLowerCase();
    const fullName = (c.user?.full_name || '').toLowerCase();
    const email = (c.user?.email || '').toLowerCase();
    const city = (c.city || '').toLowerCase();
    return profName.includes(q) || fullName.includes(q) || email.includes(q) || city.includes(q);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed top-20 right-8 z-50 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 ${
            toast.tone === 'error' ? 'bg-red-600' : 'bg-[#191C22]'
          }`}
        >
          {toast.tone === 'ok' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFE8D6] text-[#14B8A6] flex items-center justify-center shadow-2xs">
              <Camera className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#191C22] tracking-tight">
                Photographers &amp; Verification
              </h1>
              <p className="text-xs text-[#64748B] font-medium">
                Approve pending creator applications, manage platform verification, and publish profiles to the directory.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadCreators()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E7EAEE] text-xs font-bold text-[#64748B] hover:text-[#191C22] hover:bg-[#F5F7F9] shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('all')}
          className={`bg-white rounded-2xl border p-4 shadow-2xs cursor-pointer transition-all ${
            activeTab === 'all' ? 'border-[#14B8A6] ring-2 ring-[#14B8A6]/10' : 'border-[#E7EAEE] hover:border-[#14B8A6]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Total Registered</span>
            <div className="w-8 h-8 rounded-xl bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#191C22] mt-2">{totalCount}</p>
          <p className="text-[11px] text-[#94A3B8] font-medium mt-0.5">Platform photographers</p>
        </div>

        <div
          onClick={() => setActiveTab('pending')}
          className={`bg-white rounded-2xl border p-4 shadow-2xs cursor-pointer transition-all ${
            activeTab === 'pending'
              ? 'border-amber-500 ring-2 ring-amber-500/10'
              : 'border-[#E7EAEE] hover:border-amber-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">Awaiting Approval</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-black text-amber-950">{pendingCount}</p>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white animate-pulse">
                Needs Review
              </span>
            )}
          </div>
          <p className="text-[11px] text-amber-800 font-medium mt-0.5">Profiles awaiting verification</p>
        </div>

        <div
          onClick={() => setActiveTab('approved')}
          className={`bg-white rounded-2xl border p-4 shadow-2xs cursor-pointer transition-all ${
            activeTab === 'approved'
              ? 'border-emerald-500 ring-2 ring-emerald-500/10'
              : 'border-[#E7EAEE] hover:border-emerald-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900">Verified &amp; Live</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-950 mt-2">{approvedCount}</p>
          <p className="text-[11px] text-emerald-800 font-medium mt-0.5">Published to public directory</p>
        </div>

        <div
          onClick={() => setActiveTab('suspended')}
          className={`bg-white rounded-2xl border p-4 shadow-2xs cursor-pointer transition-all ${
            activeTab === 'suspended'
              ? 'border-red-500 ring-2 ring-red-500/10'
              : 'border-[#E7EAEE] hover:border-red-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-900">Suspended / Rejected</span>
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-950 mt-2">{suspendedCount}</p>
          <p className="text-[11px] text-red-800 font-medium mt-0.5">Hidden or rejected accounts</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-3xl border border-[#E7EAEE] p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(
              [
                { id: 'pending', label: `Awaiting Approval (${pendingCount})` },
                { id: 'approved', label: `Verified (${approvedCount})` },
                { id: 'suspended', label: `Suspended (${suspendedCount})` },
                { id: 'all', label: `All Photographers (${totalCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#14B8A6] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#191C22] hover:bg-[#F5F7F9]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, city..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#F5F7F9] border border-[#E7EAEE] text-xs text-[#191C22] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#14B8A6] focus:bg-white transition-all"
            />
          </div>
        </div>

        {loadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {/* Photographers List */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#14B8A6] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#94A3B8] font-semibold">Loading photographer roster…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F7F9] text-[#94A3B8] flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-sm font-bold text-[#191C22]">No photographers found</p>
            <p className="text-xs text-[#94A3B8]">
              {searchQuery ? 'Try adjusting your search criteria.' : 'No profiles match the selected status tab.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F3F5]">
            {filtered.map((creator) => {
              const isApproved = creator.verification_status === 'approved';
              const isPending =
                creator.verification_status === 'pending' || creator.verification_status === 'unsubmitted';
              const isSuspended = creator.verification_status === 'suspended';
              const isRejected = creator.verification_status === 'rejected';
              const isBusy = busyId === creator.id;

              return (
                <div
                  key={creator.id}
                  className="py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 hover:bg-[#F5F7F9]/50 px-2 rounded-2xl transition-colors"
                >
                  {/* Left: Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-[#FFE8D6] text-[#14B8A6] font-black text-sm flex items-center justify-center shrink-0 border border-[#99F6E4]">
                      {(creator.professional_name || creator.user?.full_name || 'P')[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-[#191C22] truncate">
                          {creator.professional_name || creator.user?.full_name || 'Unnamed Photographer'}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                              : isSuspended
                              ? 'bg-orange-100 text-orange-800 border border-orange-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {isApproved
                            ? 'Verified & Live'
                            : isPending
                            ? 'Pending Approval'
                            : isSuspended
                            ? 'Suspended'
                            : 'Rejected'}
                        </span>
                        {creator.user?.account_status === 'suspended' && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-700">
                            Account Banned
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-[#64748B] flex-wrap">
                        {creator.user?.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3 h-3 text-[#94A3B8]" />
                            {creator.user.email}
                          </span>
                        )}
                        {creator.user?.phone_number && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#94A3B8]" />
                            {creator.user.phone_number}
                          </span>
                        )}
                        {(creator.city || creator.state) && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#94A3B8]" />
                            {[creator.city, creator.state].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-[#94A3B8] font-medium pt-0.5">
                        {creator.experience_years != null && (
                          <span>{creator.experience_years} years experience</span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>{creator.average_rating || '5.0'}</span>
                          <span>({creator.total_reviews || 0} reviews)</span>
                        </span>
                        <span>Joined {new Date(creator.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap lg:justify-end">
                    {/* Approve button */}
                    {!isApproved && canReview && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleApprove(creator)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve &amp; Publish</span>
                      </button>
                    )}

                    {/* Reject button */}
                    {isPending && canReview && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          setRejectingCreator(creator);
                          setRejectReason('');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    )}

                    {/* Suspend / Reinstate button */}
                    {isApproved && canReview && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStatusChange(creator, 'suspend_profile')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-orange-200 text-orange-700 hover:bg-orange-50 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Suspend</span>
                      </button>
                    )}

                    {isSuspended && canReview && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStatusChange(creator, 'reinstate_profile')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Reinstate</span>
                      </button>
                    )}

                    {/* View public profile */}
                    <Link
                      href={`/photographers/${creator.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F5F7F9] border border-[#E7EAEE] text-xs font-bold text-[#64748B] hover:text-[#191C22] hover:bg-white transition-colors"
                      title="View public profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Profile</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectingCreator && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E7EAEE] max-w-md w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-[#191C22]">Reject Photographer</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingCreator(null)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-[#191C22]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#64748B]">
              Explain to{' '}
              <strong>{rejectingCreator.professional_name || rejectingCreator.user?.full_name}</strong> why
              their profile is being turned down. They will see this reason in their notification.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Incomplete portfolio link or identity verification documents required. Please re-submit."
              rows={3}
              className="w-full rounded-2xl border border-[#E7EAEE] bg-[#F5F7F9] p-3 text-xs text-[#191C22] focus:outline-none focus:border-red-500 focus:bg-white transition-all"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingCreator(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#191C22] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId === rejectingCreator.id || rejectReason.trim().length < 4}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {busyId === rejectingCreator.id ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
