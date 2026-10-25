'use client';

import React, { useState } from 'react';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  ThumbsUp,
  AlertCircle,
  CornerDownRight,
  Send,
  Filter
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { DemoNoticeBanner } from '../../../../components/photographer/DemoNoticeBanner';
import {
  INITIAL_REVIEWS,
  PhotographerReviewItem
} from '../../../../data/photographerDashboardData';

export default function PhotographerReviewsPage() {
  const [reviews, setReviews] = useState<PhotographerReviewItem[]>(INITIAL_REVIEWS);
  const [replyingReview, setReplyingReview] = useState<PhotographerReviewItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | '5' | '4' | 'Unreplied'>('All');

  const ratingDistribution = [
    { stars: 5, count: 142, percentage: 96 },
    { stars: 4, count: 5, percentage: 3 },
    { stars: 3, count: 1, percentage: 1 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 },
  ];

  const handleOpenReply = (rev: PhotographerReviewItem) => {
    setReplyingReview(rev);
    setReplyText(rev.response?.text || '');
  };

  const handleSaveReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview || !replyText.trim()) return;

    setReviews(
      reviews.map((r) =>
        r.id === replyingReview.id
          ? {
              ...r,
              response: {
                text: replyText.trim(),
                respondedAt: 'Today (Just now)',
              },
            }
          : r
      )
    );
    setReplyingReview(null);
    setReplyText('');
  };

  const filteredReviews = reviews.filter((r) => {
    if (selectedFilter === '5') return r.rating === 5;
    if (selectedFilter === '4') return r.rating === 4;
    if (selectedFilter === 'Unreplied') return !r.response;
    return true;
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <DemoNoticeBanner moduleName="Client Reviews & Reputation Management" />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
          Client Feedback & Verified Reviews
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Reviews submitted by verified clients upon photo delivery approval on REEPY.
        </p>
      </div>

      {/* RATING SUMMARY HERO */}
      <Card className="p-6 sm:p-8 bg-white border border-contour-subtle">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Big Score */}
          <div className="md:col-span-4 text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-5xl font-black text-ink-primary">4.96</span>
              <div className="text-amber-500 text-3xl">★</div>
            </div>
            <p className="text-xs font-bold text-ink-primary">Outstanding Performance</p>
            <p className="text-xs text-ink-muted">Based on 148 verified shoot completions</p>
          </div>

          {/* Distribution Bars */}
          <div className="md:col-span-8 space-y-2">
            {ratingDistribution.map((row) => (
              <div key={row.stars} className="flex items-center gap-3 text-xs">
                <span className="w-10 font-bold text-ink-primary flex items-center gap-0.5">
                  {row.stars} <Star className="w-3 h-3 text-amber-500 fill-current" />
                </span>
                <div className="flex-1 bg-canvas-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: `${row.percentage}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-ink-muted">
                  {row.count} ({row.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 pb-2 border-b border-contour-subtle text-xs">
        <Filter className="w-3.5 h-3.5 text-ink-muted mr-1" />
        <button
          onClick={() => setSelectedFilter('All')}
          className={`px-3 py-1.5 rounded-full font-bold transition-all ${
            selectedFilter === 'All'
              ? 'bg-ink-primary text-white'
              : 'bg-white text-ink-secondary hover:text-ink-primary border border-contour-subtle'
          }`}
        >
          All Reviews ({reviews.length})
        </button>
        <button
          onClick={() => setSelectedFilter('5')}
          className={`px-3 py-1.5 rounded-full font-bold transition-all ${
            selectedFilter === '5'
              ? 'bg-ink-primary text-white'
              : 'bg-white text-ink-secondary hover:text-ink-primary border border-contour-subtle'
          }`}
        >
          5-Star ({reviews.filter((r) => r.rating === 5).length})
        </button>
        <button
          onClick={() => setSelectedFilter('4')}
          className={`px-3 py-1.5 rounded-full font-bold transition-all ${
            selectedFilter === '4'
              ? 'bg-ink-primary text-white'
              : 'bg-white text-ink-secondary hover:text-ink-primary border border-contour-subtle'
          }`}
        >
          4-Star ({reviews.filter((r) => r.rating === 4).length})
        </button>
        <button
          onClick={() => setSelectedFilter('Unreplied')}
          className={`px-3 py-1.5 rounded-full font-bold transition-all ${
            selectedFilter === 'Unreplied'
              ? 'bg-brand text-white'
              : 'bg-white text-ink-secondary hover:text-ink-primary border border-contour-subtle'
          }`}
        >
          Awaiting Response ({reviews.filter((r) => !r.response).length})
        </button>
      </div>

      {/* REVIEWS LIST */}
      <div className="space-y-4">
        {filteredReviews.map((rev) => (
          <Card key={rev.id} className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-ink-primary">{rev.customerName}</span>
                  <Badge variant="brand" size="sm">Verified Shoot</Badge>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-ink-muted mt-0.5">
                  <span>{rev.category}</span>
                  <span>•</span>
                  <span>{rev.date}</span>
                </div>
              </div>

              {/* Stars */}
              <div className="flex items-center text-amber-500 text-sm">
                {'★'.repeat(rev.rating)}
                {'☆'.repeat(5 - rev.rating)}
              </div>
            </div>

            {/* Comment */}
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              &ldquo;{rev.comment}&rdquo;
            </p>

            {/* Creator Response Area */}
            {rev.response ? (
              <div className="bg-canvas-primary p-3.5 rounded-card-sm border border-contour-subtle space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-ink-primary flex items-center gap-1.5">
                    <CornerDownRight className="w-3.5 h-3.5 text-brand" />
                    Rahul Verma (Your Public Reply):
                  </span>
                  <span className="text-ink-muted">{rev.response.respondedAt}</span>
                </div>
                <p className="text-xs text-ink-secondary pl-5 italic">
                  &ldquo;{rev.response.text}&rdquo;
                </p>
                <div className="pl-5 pt-1">
                  <button
                    onClick={() => handleOpenReply(rev)}
                    className="text-[11px] font-bold text-brand hover:underline"
                  >
                    Edit Reply
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-contour-subtle flex items-center justify-between">
                <span className="text-xs text-ink-muted">You haven&apos;t replied to this review yet.</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenReply(rev)}
                  leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                >
                  Write Response
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* REPLY MODAL */}
      {replyingReview && (
        <Modal
          isOpen={!!replyingReview}
          onClose={() => setReplyingReview(null)}
          title={`Reply to ${replyingReview.customerName}`}
          description="Your response is public and will appear beneath the review on your profile."
          maxWidth="md"
        >
          <form onSubmit={handleSaveReply} className="space-y-4">
            <div className="p-3 bg-canvas-secondary rounded text-xs text-ink-secondary italic">
              &ldquo;{replyingReview.comment}&rdquo;
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Your Response *</label>
              <textarea
                rows={4}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Thank the client, reference a specific moment from the shoot, or highlight next steps..."
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-xs font-medium focus:ring-2 focus:ring-brand outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setReplyingReview(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" rightIcon={<Send className="w-3.5 h-3.5" />}>
                Publish Reply
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
