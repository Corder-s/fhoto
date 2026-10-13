'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Star,
  CheckCircle2,
  X,
  UploadCloud,
  AlertCircle,
  Filter,
  Loader2
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { useCurrentUserProfile } from '../../../../context/UserProfileContext';

interface PortfolioDisplayItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  isCover?: boolean;
  uploadedAt?: string;
  tags?: string[];
}

export default function PhotographerPortfolioPage() {
  const { authUser, creatorProfile } = useCurrentUserProfile();
  const [items, setItems] = useState<PortfolioDisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [previewItem, setPreviewItem] = useState<PortfolioDisplayItem | null>(null);
  const [editItem, setEditItem] = useState<PortfolioDisplayItem | null>(null);

  // Add via URL or File Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Portrait');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [modalError, setModalError] = useState('');

  // Upload simulation state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  const objectUrlsRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load real portfolio from Supabase
  useEffect(() => {
    let isCancelled = false;

    async function fetchPortfolio() {
      if (!authUser?.id) return;
      try {
        setIsLoading(true);
        const res = await fetch(`/api/photographers/portfolio?userId=${authUser.id}`);
        const data = await res.json();
        if (isCancelled) return;

        if (data.items && Array.isArray(data.items)) {
          setItems(
            data.items.map((i: any) => ({
              id: i.id,
              title: i.title,
              category: i.description || 'Portrait',
              imageUrl: i.preview_url,
              uploadedAt: i.created_at ? new Date(i.created_at).toLocaleDateString() : 'Recent',
              tags: ['Published'],
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching creator portfolio:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    fetchPortfolio();

    return () => {
      isCancelled = true;
      objectUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
    };
  }, [authUser?.id]);

  const categories = [
    'All',
    'Portrait',
    'Reels & Creator',
    'Couple',
    'Product & Culinary',
    'Events',
  ];

  const filteredItems = selectedCategory === 'All'
    ? items
    : items.filter((item) => item.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  const handleCreatePhotoItem = async () => {
    if (!newTitle.trim() || !newImageUrl.trim()) {
      setModalError('Please enter photograph title and image URL.');
      return;
    }

    try {
      setIsSubmittingNew(true);
      setModalError('');

      const res = await fetch('/api/photographers/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser?.id,
          creatorId: creatorProfile?.id,
          title: newTitle.trim(),
          description: newCategory,
          previewUrl: newImageUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save portfolio item to Supabase.');
      }

      const created: PortfolioDisplayItem = {
        id: data.item.id,
        title: data.item.title,
        category: data.item.description || newCategory,
        imageUrl: data.item.preview_url,
        uploadedAt: new Date().toLocaleDateString(),
        tags: ['Published'],
      };

      setItems([created, ...items]);
      setShowAddModal(false);
      setNewTitle('');
      setNewImageUrl('');
    } catch (err: any) {
      setModalError(err.message || 'Error saving to Supabase');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setUploadError('');
    setIsUploading(true);
    setUploadProgress(20);

    const objectUrl = URL.createObjectURL(file);
    objectUrlsRef.current.push(objectUrl);

    // Save to Supabase API
    try {
      const res = await fetch('/api/photographers/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser?.id,
          creatorId: creatorProfile?.id,
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          description: selectedCategory === 'All' ? 'Portrait' : selectedCategory,
          previewUrl: objectUrl,
        }),
      });

      const data = await res.json();
      setUploadProgress(100);

      const newItem: PortfolioDisplayItem = {
        id: data.item ? data.item.id : `port-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        category: selectedCategory === 'All' ? 'Portrait' : selectedCategory,
        imageUrl: objectUrl,
        isCover: false,
        uploadedAt: new Date().toISOString().split('T')[0],
        tags: ['Uploaded'],
      };

      setItems([newItem, ...items]);
    } catch (err) {
      console.error('Error saving uploaded file record:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await fetch(`/api/photographers/portfolio?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      setItems(items.filter((i) => i.id !== id));
      if (previewItem?.id === id) setPreviewItem(null);
    } catch (err) {
      console.error('Failed to delete portfolio item:', err);
    }
  };

  const handleSetCover = (id: string) => {
    setItems(
      items.map((i) => ({
        ...i,
        isCover: i.id === id,
      }))
    );
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setItems(items.map((i) => (i.id === editItem.id ? editItem : i)));
    setEditItem(null);
  };

  return (
    <div className="space-y-8">
      {/* Header & Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
            Portfolio Gallery Management
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Curate high-resolution imagery and video previews synced directly to your verified creator profile.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add by URL
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
            id="portfolio-file-upload"
          />
          <label htmlFor="portfolio-file-upload" className="cursor-pointer">
            <Button
              variant="primary"
              size="md"
              leftIcon={<UploadCloud className="w-4 h-4" />}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
          </label>
        </div>
      </div>

      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-card-sm text-xs font-semibold text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Categories Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-contour-subtle pb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-[#FF6E00] text-white shadow-xs'
                : 'bg-canvas-secondary text-ink-secondary hover:bg-canvas-tertiary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid or Empty State */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#FF6E00] animate-spin mx-auto" />
          <p className="text-xs text-ink-muted">Loading portfolio from Supabase...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-[#E8E2D8] rounded-3xl bg-[#FAF7F2]/50 p-8 space-y-3">
          <ImageIcon className="w-12 h-12 text-[#FF6E00] mx-auto opacity-70" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-ink-primary">No portfolio photographs added yet</h3>
            <p className="text-xs text-ink-secondary max-w-md mx-auto">
              Your public profile displays your best work to prospective clients. Add photos using the buttons above to showcase your skills.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddModal(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Sample Photo
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden group border border-contour-subtle relative bg-white">
              <div className="aspect-square relative overflow-hidden bg-zinc-100">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/reference-assets/cat_portrait.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="p-2 rounded-full bg-white text-ink-primary hover:bg-brand hover:text-white transition-colors"
                    title="View Full Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 rounded-full bg-white text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                    title="Delete Photograph"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 space-y-1">
                <p className="text-xs font-bold text-ink-primary truncate">{item.title}</p>
                <div className="flex items-center justify-between text-[11px] text-ink-muted">
                  <span>{item.category}</span>
                  <span>{item.uploadedAt}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-contour-subtle">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-ink-primary">Add Portfolio Highlight</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-ink-muted hover:text-ink-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg font-medium">{modalError}</p>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-ink-primary mb-1">
                  Photograph Title *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sunset Golden Hour Portrait"
                  className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#FF6E00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-ink-primary mb-1">
                  Category *
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#FF6E00] bg-white"
                >
                  <option value="Portrait">Portrait</option>
                  <option value="Reels & Creator">Reels & Creator</option>
                  <option value="Couple">Couple & Pre-Wedding</option>
                  <option value="Product & Culinary">Product & Culinary</option>
                  <option value="Events">Events</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-ink-primary mb-1">
                  Image URL *
                </label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or /reference-assets/..."
                  className="w-full p-2.5 text-xs font-medium border rounded-xl outline-none focus:ring-2 focus:ring-[#FF6E00]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreatePhotoItem}
                disabled={isSubmittingNew}
                leftIcon={isSubmittingNew ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
              >
                {isSubmittingNew ? 'Saving...' : 'Save Photograph'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div className="max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl space-y-3 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-sm font-bold text-ink-primary">{previewItem.title}</h3>
              <button onClick={() => setPreviewItem(null)} className="p-1 hover:text-[#FF6E00]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewItem.imageUrl}
              alt={previewItem.title}
              className="w-full max-h-[70vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
