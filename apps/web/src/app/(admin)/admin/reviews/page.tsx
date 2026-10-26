'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Star,
  RefreshCw,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  ShieldAlert,
  Calendar,
} from 'lucide-react';

interface ReviewItem {
  id: string;
  booking_id: string;
  customer_id: string;
  creator_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  customer?: { full_name: string | null; email: string | null; avatar_url: string | null } | null;
  creator?: { professional_name: string | null; city: string | null } | null;
  booking?: { booking_reference: string | null; event_title: string | null; event_date: string | null } | null;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<{ totalReviews: number; avgRating: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [starFilter, setStarFilter] = useState<number | 'ALL'>('ALL');

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/reviews', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load reviews (${res.status})`);
      const data = await res.json();
      setReviews(data.reviews || []);
      setStats(data.stats || null);
    } catch (err: any) {
      setError(err?.message || 'Could not load reviews.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this review from the public platform?')) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove review');
      setSuccess('Review removed successfully.');
      setTimeout(() => setSuccess(null), 4000);
      fetchReviews();
    } catch (err: any) {
      setError(err?.message || 'Delete failed.');
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesStar = starFilter === 'ALL' || r.rating === starFilter;
    const custName = r.customer?.full_name || '';
    const photogName = r.creator?.professional_name || '';
    const text = r.review_text || '';
    const matchesSearch =
      custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photogName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStar && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Reviews & Content Moderation</h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Real customer feedback, verified photographer ratings, and moderation controls.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReviews}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#14B8A6]' : 'text-[#64748B]'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#64748B]">Total Verified Reviews</p>
            <p className="text-2xl font-black text-[#0F172A] mt-1">{stats?.totalReviews ?? 0}</p>
            <p className="text-[10px] text-[#94A3B8]">Linked strictly to completed bookings</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EFFCF8] text-[#14B8A6] flex items-center justify-center">
            <MessageSquare className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#64748B]">Platform Average Rating</p>
            <p className="text-2xl font-black text-[#0F172A] mt-1 flex items-center gap-1.5">
              <span>{stats?.avgRating ?? '0.0'}</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </p>
            <p className="text-[10px] text-[#94A3B8]">Derived from genuine customer submissions</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-amber-500 flex items-center justify-center">
            <Star className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
      </div>

      {/* Reviews Table Container */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer, photographer, or review content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#14B8A6]"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="text-[#64748B] text-[11px]">Filter Rating:</span>
            {(['ALL', 5, 4, 3, 2, 1] as const).map((star) => (
              <button
                key={star}
                onClick={() => setStarFilter(star)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs font-bold ${
                  starFilter === star
                    ? 'bg-[#14B8A6] text-white'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {star === 'ALL' ? 'All' : `${star}★`}
              </button>
            ))}
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="py-12 text-center text-[#94A3B8] text-xs space-y-1">
            <Star className="w-8 h-8 mx-auto text-[#CBD5E1]" />
            <p className="font-bold text-[#0F172A]">No customer reviews found.</p>
            <p className="text-[11px] text-[#64748B]">When clients complete photography sessions, their ratings will display here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#F1F5F9] text-[#94A3B8] text-[11px] font-semibold">
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Photographer</th>
                  <th className="py-2.5 px-3">Rating</th>
                  <th className="py-2.5 px-3">Review Details</th>
                  <th className="py-2.5 px-3">Booking Reference</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredReviews.map((r) => {
                  const custName = r.customer?.full_name || 'Customer';
                  const photogName = r.creator?.professional_name || 'Photographer';

                  return (
                    <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-[#0F172A]">
                        {custName}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <p className="font-semibold text-[#0F172A]">{photogName}</p>
                        <p className="text-[10px] text-[#94A3B8]">{r.creator?.city || 'India'}</p>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <span>{r.rating}</span>
                          <div className="flex">
                            {Array.from({ length: r.rating }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <p className="text-[#334155] line-clamp-2 italic text-xs">
                          &ldquo;{r.review_text || 'No comment text provided.'}&rdquo;
                        </p>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-[#64748B]">
                        {r.booking?.booking_reference || 'N/A'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-[#64748B] text-[11px]">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(r.id)}
                          title="Remove Review"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
