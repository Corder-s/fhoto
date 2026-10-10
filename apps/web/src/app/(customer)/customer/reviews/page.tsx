'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Star,
  Heart,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Camera,
  CornerDownRight,
  Send,
  Plus
} from 'lucide-react';
import { CustomerNoticeBanner } from '../../../../components/customer/CustomerNoticeBanner';
import {
  INITIAL_CUSTOMER_REVIEWS,
  CustomerReviewRecord
} from '../../../../data/customerDashboardData';

export default function CustomerReviewsPage() {
  const [reviews, setReviews] = useState<CustomerReviewRecord[]>(INITIAL_CUSTOMER_REVIEWS);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const [favorites, setFavorites] = useState([
    {
      id: 'pro-aman',
      name: 'Aman Verma',
      avatar: '/reference-assets/avatar_aman.jpg',
      category: 'Portraits & Lifestyle',
      location: 'Greater Noida, UP',
      rating: 4.9,
      reviewCount: 128,
      startingPrice: 800,
    },
    {
      id: 'pro-riya',
      name: 'Riya Sharma',
      avatar: '/reference-assets/avatar_riya.jpg',
      category: 'Couples & Pre-Weddings',
      location: 'Noida, UP',
      rating: 4.8,
      reviewCount: 96,
      startingPrice: 1200,
    },
    {
      id: 'pro-karan',
      name: 'Karan Mehta',
      avatar: '/reference-assets/avatar_karan.jpg',
      category: 'Creator Reels & Video',
      location: 'Delhi NCR',
      rating: 4.9,
      reviewCount: 112,
      startingPrice: 1500,
    },
  ]);

  const handleRemoveFavorite = (id: string) => {
    setFavorites(favorites.filter((f) => f.id !== id));
  };

  const handleOpenReviewModal = () => {
    setSelectedRating(5);
    setReviewComment('');
    setReviewError('');
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewComment.trim().length < 10) {
      setReviewError('Please share at least 10 characters of detailed feedback.');
      return;
    }

    const newRev: CustomerReviewRecord = {
      id: `rev-${Date.now()}`,
      bookingRef: 'SNP-2026-98119',
      photographerId: 'pro-riya',
      photographerName: 'Riya Sharma',
      photographerAvatar: '/reference-assets/avatar_riya.jpg',
      category: 'Couple Shoot',
      rating: selectedRating,
      date: 'Today (Just now)',
      comment: reviewComment.trim(),
      photographerReply: undefined,
    };

    setReviews([newRev, ...reviews]);
    setIsReviewModalOpen(false);
    setSubmitSuccess('Thank you! Your verified shoot review has been published (simulated demo state).');
    setTimeout(() => setSubmitSuccess(''), 5000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <CustomerNoticeBanner moduleName="Client Reviews & Favorite Creators" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1816] tracking-tight">
            Reviews & Favorite Photographers
          </h1>
          <p className="text-xs sm:text-sm text-[#665E55] mt-1">
            Rate completed sessions, leave helpful creator feedback, and manage your saved visual artists.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenReviewModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#FF6E00] hover:bg-[#E86300] active:scale-95 shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Write a Review</span>
        </button>
      </div>

      {submitSuccess && (
        <div className="p-3.5 bg-green-50 border border-green-200 rounded-2xl text-xs font-bold text-green-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* FAVORITE PHOTOGRAPHERS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C847A]">
            Saved Favorite Creators ({favorites.length})
          </span>
          <Link href="/explore" className="text-xs font-bold text-[#FF6E00] hover:underline">
            Explore More →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className="p-5 bg-white rounded-3xl border border-[#EBE4DA] space-y-3 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <img
                  src={fav.avatar}
                  alt={fav.name}
                  className="w-12 h-12 rounded-full object-cover border border-[#E8E1D6]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFavorite(fav.id)}
                  className="text-red-500 hover:scale-110 transition-transform p-1"
                  title="Remove from favorites"
                >
                  <Heart className="w-4 h-4 fill-red-500" />
                </button>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#1A1816]">{fav.name}</h4>
                <p className="text-xs text-[#8C847A]">{fav.category}</p>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1A1816] mt-1">
                  <span>⭐ {fav.rating} ({fav.reviewCount})</span>
                  <span>•</span>
                  <span>From ₹{fav.startingPrice}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F0EAE1]">
                <Link
                  href={`/photographers/${fav.id}`}
                  className="w-full text-center py-1.5 rounded-full text-xs font-bold text-[#1A1816] bg-[#F2ECE3] hover:bg-[#FF6E00] hover:text-white transition-all block"
                >
                  Book Shoot
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MY REVIEWS HISTORY */}
      <div className="space-y-4 pt-4 border-t border-[#E8E1D6]">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C847A]">
          My Submitted Shoot Reviews ({reviews.length})
        </span>

        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="p-6 bg-white rounded-3xl border border-[#EBE4DA] space-y-4 shadow-subtle">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={rev.photographerAvatar}
                    alt={rev.photographerName}
                    className="w-10 h-10 rounded-full object-cover border border-[#E8E1D6]"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1816]">{rev.photographerName}</h4>
                    <p className="text-[11px] text-[#8C847A]">
                      {rev.category} • Ref: {rev.bookingRef} • {rev.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-[#FF6E00] text-sm">
                  {'★'.repeat(rev.rating)}
                  {'☆'.repeat(5 - rev.rating)}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#665E55] leading-relaxed italic">
                &ldquo;{rev.comment}&rdquo;
              </p>

              {rev.photographerReply && (
                <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E8E1D6] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1816]">
                    <CornerDownRight className="w-3.5 h-3.5 text-[#FF6E00]" />
                    <span>{rev.photographerName}&apos;s Response:</span>
                  </div>
                  <p className="text-xs text-[#665E55] pl-5 italic">
                    &ldquo;{rev.photographerReply}&rdquo;
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* WRITE A REVIEW MODAL */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 border border-[#E8E1D6] shadow-elevated">
            <h3 className="text-lg font-bold text-[#1A1816]">Write a Verified Review</h3>
            <p className="text-xs text-[#665E55]">
              Share your feedback for your recent shoot with <strong>Riya Sharma</strong> (Pre-Wedding Session).
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              {reviewError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-semibold">
                  {reviewError}
                </div>
              )}

              {/* Star Rating Selector */}
              <div className="space-y-1.5">
                <label className="font-bold uppercase text-[#1A1816]">Rating *</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      className="text-2xl text-[#FF6E00] hover:scale-110 transition-transform"
                    >
                      {star <= selectedRating ? '★' : '☆'}
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#1A1816] ml-2">
                    {selectedRating}.0 / 5.0
                  </span>
                </div>
              </div>

              {/* Written Feedback */}
              <div className="space-y-1.5">
                <label className="font-bold uppercase text-[#1A1816]">Your Review *</label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How was the photographer's punctuality, pose direction, and photo quality?"
                  className="w-full bg-white border border-[#D5CEC4] rounded-2xl p-3 text-xs text-[#1A1816] focus:ring-2 focus:ring-[#FF6E00] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-full font-bold text-[#5A544D] hover:bg-[#F2ECE3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full font-bold text-white bg-[#FF6E00] hover:bg-[#E86300] shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
