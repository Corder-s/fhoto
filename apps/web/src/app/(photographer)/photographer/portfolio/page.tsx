'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  X,
  UploadCloud,
  AlertCircle,
  Filter,
  Loader2,
  Camera,
  ExternalLink,
  Sparkles,
  Layers
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { useCurrentUserProfile } from '../../../../context/UserProfileContext';

interface PortfolioDisplayItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  uploadedAt?: string;
  mediaType?: 'photo' | 'video';
  displayOrder?: number;
}

export default function PhotographerPortfolioPage() {
  const { authUser, creatorProfile, refreshProfile } = useCurrentUserProfile();
  const [items, setItems] = useState<PortfolioDisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Lightbox / Fullscreen Preview Modal
  const [previewItem, setPreviewItem] = useState<PortfolioDisplayItem | null>(null);

  // Edit Metadata Modal State
  const [editItem, setEditItem] = useState<PortfolioDisplayItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Confirmation Modal State
  const [deleteCandidate, setDeleteCandidate] = useState<PortfolioDisplayItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add via URL Modal State
  const [showAddUrlModal, setShowAddUrlModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Portrait');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSubmittingUrl, setIsSubmittingUrl] = useState(false);
  const [modalError, setModalError] = useState('');
  const [urlPreviewValid, setUrlPreviewValid] = useState<boolean | null>(null);

  // File Upload State (Upload Photo)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0);
  const [photoUploadError, setPhotoUploadError] = useState('');
  const [photoToast, setPhotoToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Cover Banner Management State
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [currentBanner, setCurrentBanner] = useState<string | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerToast, setBannerToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync banner from creatorProfile or fetch
  useEffect(() => {
    if (creatorProfile?.cover_image_url) {
      setCurrentBanner(creatorProfile.cover_image_url);
    } else if (authUser?.id) {
      fetch(`/api/photographers/banner?userId=${authUser.id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.bannerUrl) setCurrentBanner(d.bannerUrl);
        })
        .catch(() => {});
    }
  }, [creatorProfile?.cover_image_url, authUser?.id]);

  // Load real portfolio from Supabase
  const loadPortfolio = async () => {
    if (!authUser?.id) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/photographers/portfolio?userId=${authUser.id}`);
      const data = await res.json();

      if (data.items && Array.isArray(data.items)) {
        setItems(
          data.items.map((i: any) => ({
            id: i.id,
            title: i.title || 'Portfolio Highlight',
            category: i.description || 'Portrait',
            imageUrl: i.preview_url,
            mediaType: i.media_type || 'photo',
            displayOrder: i.display_order ?? 0,
            uploadedAt: i.created_at
              ? new Date(i.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Recent',
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching creator portfolio:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, [authUser?.id]);

  // Handle Cover Banner Upload
  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|gif|jpg)$/i)) {
      setBannerToast({ type: 'error', text: 'Please select a valid image (JPG, PNG, or WebP).' });
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setBannerToast({ type: 'error', text: 'Banner image must be 15 MB or smaller.' });
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      return;
    }

    setIsUploadingBanner(true);
    setBannerToast(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/photographers/banner', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentBanner(data.bannerUrl);
        setBannerToast({ type: 'success', text: 'Studio cover banner updated successfully!' });
        await refreshProfile();
        setTimeout(() => setBannerToast(null), 4000);
      } else {
        setBannerToast({ type: 'error', text: data.error || 'Failed to update cover banner.' });
      }
    } catch (err: any) {
      setBannerToast({ type: 'error', text: err?.message || 'Network error uploading banner.' });
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  // Handle Remove Cover Banner
  const handleRemoveBanner = async () => {
    if (!confirm('Are you sure you want to remove your studio cover banner?')) return;
    setIsUploadingBanner(true);
    try {
      const res = await fetch('/api/photographers/banner', { method: 'DELETE' });
      if (res.ok) {
        setCurrentBanner(null);
        setBannerToast({ type: 'success', text: 'Cover banner removed.' });
        await refreshProfile();
        setTimeout(() => setBannerToast(null), 3000);
      }
    } catch {
      setBannerToast({ type: 'error', text: 'Could not remove cover banner.' });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Handle Native Photo File Upload
  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|gif|jpg)$/i) && !file.type.match(/^video\/(mp4|quicktime|webm)$/i)) {
      setPhotoUploadError('Please select a supported image file (JPG, PNG, WebP) or video (MP4).');
      if (photoInputRef.current) photoInputRef.current.value = '';
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setPhotoUploadError('Photographs must be 25 MB or smaller.');
      if (photoInputRef.current) photoInputRef.current.value = '';
      return;
    }

    if (!authUser?.id) {
      setPhotoUploadError('Please sign in again to upload photographs.');
      return;
    }

    setPhotoUploadError('');
    setIsUploadingPhoto(true);
    setPhotoUploadProgress(25);

    const defaultTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const chosenCategory = selectedCategory === 'All' ? 'Portrait' : selectedCategory;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', defaultTitle);
    formData.append('category', chosenCategory);

    try {
      setPhotoUploadProgress(60);
      const res = await fetch('/api/photographers/portfolio', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success || !data.item) {
        throw new Error(data.error || 'Could not save the portfolio photograph.');
      }

      setPhotoUploadProgress(100);

      const newItem: PortfolioDisplayItem = {
        id: data.item.id,
        title: data.item.title || defaultTitle,
        category: data.item.description || chosenCategory,
        imageUrl: data.item.preview_url,
        mediaType: data.item.media_type || 'photo',
        displayOrder: data.item.display_order ?? 0,
        uploadedAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      };

      setItems((prev) => [newItem, ...prev]);
      setPhotoToast({ type: 'success', text: `"${defaultTitle}" uploaded to your gallery successfully!` });
      setTimeout(() => setPhotoToast(null), 4000);
    } catch (err: any) {
      setPhotoUploadError(err?.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      setPhotoUploadProgress(0);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // Handle Add by URL
  const handleCreatePhotoFromUrl = async () => {
    if (!newTitle.trim() || !newImageUrl.trim()) {
      setModalError('Please enter both a title and a valid image URL.');
      return;
    }

    const trimmedUrl = newImageUrl.trim();
    if (!trimmedUrl.startsWith('https://') && !trimmedUrl.startsWith('/reference-assets/')) {
      setModalError('Please enter a secure HTTPS image URL (e.g. https://images.unsplash.com/...)');
      return;
    }

    try {
      setIsSubmittingUrl(true);
      setModalError('');

      const res = await fetch('/api/photographers/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser?.id,
          creatorId: creatorProfile?.id,
          title: newTitle.trim(),
          description: newCategory,
          previewUrl: trimmedUrl,
          mediaType: 'photo',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.item) {
        throw new Error(data.error || 'Failed to save portfolio item.');
      }

      const created: PortfolioDisplayItem = {
        id: data.item.id,
        title: data.item.title,
        category: data.item.description || newCategory,
        imageUrl: data.item.preview_url,
        mediaType: data.item.media_type || 'photo',
        displayOrder: data.item.display_order ?? 0,
        uploadedAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      };

      setItems((prev) => [created, ...prev]);
      setShowAddUrlModal(false);
      setNewTitle('');
      setNewImageUrl('');
      setUrlPreviewValid(null);
      setPhotoToast({ type: 'success', text: 'Portfolio photo added via URL!' });
      setTimeout(() => setPhotoToast(null), 4000);
    } catch (err: any) {
      setModalError(err.message || 'Error saving portfolio item.');
    } finally {
      setIsSubmittingUrl(false);
    }
  };

  // Handle Delete Item
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/photographers/portfolio?id=${encodeURIComponent(deleteCandidate.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not delete item.');
      }
      setItems((prev) => prev.filter((i) => i.id !== deleteCandidate.id));
      if (previewItem?.id === deleteCandidate.id) setPreviewItem(null);
      setDeleteCandidate(null);
      setPhotoToast({ type: 'success', text: 'Photograph removed from portfolio.' });
      setTimeout(() => setPhotoToast(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to delete photograph.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: PortfolioDisplayItem) => {
    setEditItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditError('');
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editItem) return;
    if (!editTitle.trim()) {
      setEditError('Title cannot be blank.');
      return;
    }

    try {
      setIsSavingEdit(true);
      setEditError('');

      const res = await fetch('/api/photographers/portfolio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editItem.id,
          title: editTitle.trim(),
          category: editCategory.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update metadata.');
      }

      setItems((prev) =>
        prev.map((i) =>
          i.id === editItem.id ? { ...i, title: editTitle.trim(), category: editCategory.trim() } : i
        )
      );
      setEditItem(null);
      setPhotoToast({ type: 'success', text: 'Photograph details updated!' });
      setTimeout(() => setPhotoToast(null), 3000);
    } catch (err: any) {
      setEditError(err.message || 'Could not save changes.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const categories = [
    'All',
    'Portrait',
    'Couple & Wedding',
    'Reels & Creator',
    'Events',
    'Product & Culinary',
    'Fashion & Commercial',
  ];

  const filteredItems =
    selectedCategory === 'All'
      ? items
      : items.filter((item) => item.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  const publicProfileUrl = creatorProfile?.id
    ? `/photographers/${creatorProfile.id}`
    : '/photographer/business';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER & ACTION BUTTONS                                   */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#14B8A6]/10 text-[#0D9488]">
              Portfolio Studio
            </span>
            <span className="text-xs text-slate-400 font-medium">· Media Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Portfolio Gallery Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Curate high-resolution imagery and video reels synced directly to your verified creator profile and public booking listing.
          </p>
        </div>

        {/* Action Buttons: Add by URL & Upload Photo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowAddUrlModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold"
          >
            Add by URL
          </Button>

          {/* Hidden File Input triggered by button click */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
            className="hidden"
            onChange={handlePhotoFileUpload}
            id="portfolio-file-upload-input"
          />
          <Button
            variant="primary"
            size="md"
            onClick={() => photoInputRef.current?.click()}
            leftIcon={isUploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            disabled={isUploadingPhoto}
            className="bg-[#14B8A6] hover:bg-[#0D9488] text-white shadow-sm font-bold cursor-pointer"
          >
            {isUploadingPhoto ? `Uploading (${photoUploadProgress}%)...` : 'Upload Photo'}
          </Button>
        </div>
      </div>

      {/* Global Alerts & Toast notifications */}
      {photoToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{photoToast.text}</span>
        </div>
      )}

      {photoUploadError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{photoUploadError}</span>
          </div>
          <button onClick={() => setPhotoUploadError('')} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STUDIO COVER BANNER SECTION                                   */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900">Studio Cover Banner</h2>
              <Badge variant="brand" size="sm" className="bg-[#14B8A6]/10 text-[#0D9488] border-none font-bold">
                Profile Hero
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Featured as the top hero background of your public photographer profile. Distinct from gallery photographs.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Hidden Banner File Input */}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleBannerFileChange}
              id="studio-banner-file-input"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => bannerInputRef.current?.click()}
              disabled={isUploadingBanner}
              leftIcon={isUploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              className="bg-[#14B8A6] hover:bg-[#0D9488] text-white cursor-pointer font-bold shadow-2xs"
            >
              {isUploadingBanner ? 'Uploading Banner...' : currentBanner ? 'Replace Banner' : 'Upload Banner'}
            </Button>

            {currentBanner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveBanner}
                disabled={isUploadingBanner}
                className="text-xs text-rose-600 hover:bg-rose-50"
              >
                Remove
              </Button>
            )}

            <Link
              href={publicProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors"
              title="Preview banner on public profile"
            >
              <span>Public Preview</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </div>

        {bannerToast && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              bannerToast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {bannerToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{bannerToast.text}</span>
          </div>
        )}

        {/* Banner Preview Canvas */}
        <div className="relative h-48 sm:h-64 w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentBanner || '/reference-assets/seller_banner_photographer.jpg'}
            alt="Studio Cover Banner"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end justify-between p-4 sm:p-6">
            <div className="text-white space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30">
                {currentBanner ? 'Active Profile Banner' : 'Default Platform Cover'}
              </span>
              <p className="text-sm sm:text-base font-black drop-shadow-sm">
                {creatorProfile?.professional_name || authUser?.name || 'Your Studio'}
              </p>
              <p className="text-xs text-slate-200 font-medium">
                Recommended banner resolution: 1920 × 600 px (3:1 ratio, max 15MB)
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => bannerInputRef.current?.click()}
              className="bg-white/90 hover:bg-white text-slate-900 border-none backdrop-blur-md shadow-sm font-bold text-xs"
            >
              Change Cover
            </Button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PORTFOLIO GALLERY HEADER & CATEGORY FILTER                    */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900">Gallery Photographs</h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {items.length} {items.length === 1 ? 'Photograph' : 'Photographs'}
            </span>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#14B8A6] text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* GALLERY GRID OR EMPTY STATE                                  */}
        {/* ------------------------------------------------------------- */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="aspect-square rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center space-y-4 shadow-2xs">
            <div className="w-16 h-16 rounded-2xl bg-[#14B8A6]/10 text-[#0D9488] flex items-center justify-center mx-auto">
              <Camera className="w-8 h-8 stroke-[1.8]" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-black text-slate-900">
                {selectedCategory === 'All' ? 'Your portfolio gallery is empty' : `No photographs in "${selectedCategory}"`}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add showcase photographs to demonstrate your camera skills and style. Clients book creators with verified portfolio galleries.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => photoInputRef.current?.click()}
                leftIcon={<UploadCloud className="w-4 h-4" />}
                className="bg-[#14B8A6] hover:bg-[#0D9488] text-white shadow-sm font-bold"
              >
                Upload First Photo
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowAddUrlModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
                className="border-slate-300 font-semibold"
              >
                Add by URL
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col"
              >
                {/* Photo Image Aspect Container */}
                <div className="aspect-square relative overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/reference-assets/cat_portrait.jpg';
                    }}
                  />

                  {/* Hover Overlay with Quick Actions */}
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3 backdrop-blur-2xs">
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="p-2.5 rounded-xl bg-white text-slate-900 hover:bg-[#14B8A6] hover:text-white transition-colors shadow-md cursor-pointer"
                      title="Fullscreen Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2.5 rounded-xl bg-white text-slate-900 hover:bg-[#14B8A6] hover:text-white transition-colors shadow-md cursor-pointer"
                      title="Edit Title & Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteCandidate(item)}
                      className="p-2.5 rounded-xl bg-white text-rose-600 hover:bg-rose-600 hover:text-white transition-colors shadow-md cursor-pointer"
                      title="Delete from Portfolio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Photo Metadata Footer */}
                <div className="p-3 bg-white flex flex-col justify-between flex-1 border-t border-slate-100">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 truncate" title={item.title}>
                      {item.title}
                    </p>
                    <p className="text-[11px] font-semibold text-[#0D9488]">
                      {item.category}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100 text-[10px] text-slate-400">
                    <span>{item.uploadedAt || 'Published'}</span>
                    <button
                      onClick={() => setDeleteCandidate(item)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD BY URL                                             */}
      {/* ------------------------------------------------------------- */}
      {showAddUrlModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#14B8A6]/10 text-[#0D9488] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-slate-900">Add Portfolio Photograph by URL</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddUrlModal(false);
                  setUrlPreviewValid(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Photograph Title *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sunset Golden Hour Editorial"
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Category *
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20 bg-white"
                >
                  <option value="Portrait">Portrait</option>
                  <option value="Couple & Wedding">Couple & Wedding</option>
                  <option value="Reels & Creator">Reels & Creator</option>
                  <option value="Product & Culinary">Product & Culinary</option>
                  <option value="Events">Events</option>
                  <option value="Fashion & Commercial">Fashion & Commercial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Image URL (HTTPS) *
                </label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => {
                    setNewImageUrl(e.target.value);
                    setUrlPreviewValid(null);
                  }}
                  placeholder="https://images.unsplash.com/... or https://cdn.mysite.com/image.jpg"
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20 transition-all"
                />
              </div>

              {/* Realtime Live Image Preview in Modal */}
              {newImageUrl.trim() && (
                <div className="pt-1">
                  <p className="text-[11px] font-bold text-slate-600 mb-1.5">Live Image Preview:</p>
                  <div className="h-40 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={newImageUrl.trim()}
                      alt="URL Preview"
                      className="w-full h-full object-contain"
                      onLoad={() => setUrlPreviewValid(true)}
                      onError={() => setUrlPreviewValid(false)}
                    />
                    {urlPreviewValid === false && (
                      <div className="absolute inset-0 bg-rose-50/90 flex flex-col items-center justify-center p-3 text-center">
                        <AlertCircle className="w-5 h-5 text-rose-500 mb-1" />
                        <span className="text-xs font-bold text-rose-700">Image failed to load</span>
                        <span className="text-[10px] text-rose-500">Check the URL or access permissions</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setShowAddUrlModal(false);
                  setUrlPreviewValid(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleCreatePhotoFromUrl}
                disabled={isSubmittingUrl || !newTitle.trim() || !newImageUrl.trim()}
                leftIcon={isSubmittingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                className="bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold"
              >
                {isSubmittingUrl ? 'Saving...' : 'Save to Gallery'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT PHOTO METADATA                                    */}
      {/* ------------------------------------------------------------- */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Edit Photograph Details</h3>
              <button onClick={() => setEditItem(null)} className="p-1 text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                {editError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-[#14B8A6] bg-white"
                >
                  <option value="Portrait">Portrait</option>
                  <option value="Couple & Wedding">Couple & Wedding</option>
                  <option value="Reels & Creator">Reels & Creator</option>
                  <option value="Product & Culinary">Product & Culinary</option>
                  <option value="Events">Events</option>
                  <option value="Fashion & Commercial">Fashion & Commercial</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setEditItem(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold"
              >
                {isSavingEdit ? 'Saving...' : 'Update Details'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DELETE CONFIRMATION                                    */}
      {/* ------------------------------------------------------------- */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">Delete Photograph</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900">&ldquo;{deleteCandidate.title}&rdquo;</strong> from your portfolio? It will also be deleted from storage if hosted here.
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setDeleteCandidate(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Photo'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: FULLSCREEN LIGHTBOX PREVIEW                            */}
      {/* ------------------------------------------------------------- */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl space-y-3 p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">{previewItem.title}</h3>
                <p className="text-xs text-[#0D9488] font-bold">{previewItem.category}</p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[72vh] w-full flex items-center justify-center bg-slate-950 rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewItem.imageUrl}
                alt={previewItem.title}
                className="max-h-[72vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
