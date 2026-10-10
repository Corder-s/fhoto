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
  Filter
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { DemoNoticeBanner } from '../../../../components/photographer/DemoNoticeBanner';
import { INITIAL_PORTFOLIO, PortfolioItem } from '../../../../data/photographerDashboardData';

export default function PhotographerPortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>(INITIAL_PORTFOLIO);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [previewItem, setPreviewItem] = useState<PortfolioItem | null>(null);
  const [editItem, setEditItem] = useState<PortfolioItem | null>(null);

  // Upload simulation state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  // Keep track of created object URLs to revoke them safely
  const objectUrlsRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      // Clean up object URLs on component unmount
      objectUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
    };
  }, []);

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
    : items.filter((item) => item.category === selectedCategory);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setUploadError('');
    setIsUploading(true);
    setUploadProgress(15);

    const objectUrl = URL.createObjectURL(file);
    objectUrlsRef.current.push(objectUrl);

    // Simulate progress bar
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);

      setTimeout(() => {
        const newItem: PortfolioItem = {
          id: `port-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          category: selectedCategory === 'All' ? 'Portrait' : selectedCategory,
          imageUrl: objectUrl,
          isCover: false,
          uploadedAt: new Date().toISOString().split('T')[0],
          tags: ['Local Preview', 'New Upload'],
        };
        setItems([newItem, ...items]);
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 300);
    }, 700);
  };

  const handleDeleteItem = (id: string) => {
    const itemToDelete = items.find((i) => i.id === id);
    if (itemToDelete && itemToDelete.imageUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(itemToDelete.imageUrl);
      } catch {
        // ignore
      }
    }
    setItems(items.filter((i) => i.id !== id));
    if (previewItem?.id === id) setPreviewItem(null);
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
    setItems(
      items.map((i) => (i.id === editItem.id ? editItem : i))
    );
    setEditItem(null);
  };

  return (
    <div className="space-y-8">
      <DemoNoticeBanner moduleName="Portfolio Management" />

      {/* Header & Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
            Portfolio Gallery Management
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Curate the high-resolution imagery and video stills presented on your public profile.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
              Add New Photo
            </Button>
          </label>
        </div>
      </div>

      {/* Local Storage Banner */}
      <div className="bg-canvas-secondary/70 border border-contour-subtle rounded-card-sm p-3.5 text-xs text-ink-secondary flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-brand shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-ink-primary mr-1">Local Browser Preview Notice:</span>
          Newly selected images generate temporary in-browser preview URLs (`blob:`). In production Phase 7, photos will upload directly to AWS S3 / Cloudflare R2 object storage.
        </div>
      </div>

      {/* Upload Progress Bar if active */}
      {isUploading && (
        <Card className="p-4 border-brand space-y-2 bg-brand-subtle/20">
          <div className="flex items-center justify-between text-xs font-bold text-ink-primary">
            <span className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-brand animate-bounce" />
              Processing Image File...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-contour-subtle rounded-full h-2 overflow-hidden">
            <div
              className="bg-brand h-2 rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </Card>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-card-sm text-xs font-bold text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* CATEGORY FILTER TABS */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-contour-subtle">
        <Filter className="w-3.5 h-3.5 text-ink-muted mr-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-ink-primary text-white shadow-sm'
                : 'bg-white text-ink-secondary hover:text-ink-primary border border-contour-subtle hover:bg-canvas-secondary'
            }`}
          >
            {cat} {cat === 'All' ? `(${items.length})` : ''}
          </button>
        ))}
      </div>

      {/* PORTFOLIO GRID */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <ImageIcon className="w-12 h-12 text-ink-muted mx-auto" />
          <h3 className="text-base font-bold text-ink-primary">No Images Found in this Category</h3>
          <p className="text-xs text-ink-secondary max-w-sm mx-auto">
            Upload new photography to showcase your work under {selectedCategory}.
          </p>
          <label htmlFor="portfolio-file-upload" className="cursor-pointer inline-block pt-2">
            <Button variant="secondary" size="sm">
              Upload First {selectedCategory} Photo
            </Button>
          </label>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="p-0 overflow-hidden flex flex-col group">
              {/* Image Preview Container */}
              <div className="relative aspect-[4/3] bg-zinc-100 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Cover Badge */}
                {item.isCover && (
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand text-white shadow-sm flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> Cover Image
                  </span>
                )}

                {/* Category Pill */}
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-card-sm text-[10px] font-bold bg-ink-primary/70 backdrop-blur-sm text-white">
                  {item.category}
                </span>

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-ink-primary/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="p-2 bg-white/90 hover:bg-white text-ink-primary rounded-full shadow-sm transition-transform hover:scale-110"
                    title="Fullscreen Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditItem(item)}
                    className="p-2 bg-white/90 hover:bg-white text-ink-primary rounded-full shadow-sm transition-transform hover:scale-110"
                    title="Edit Metadata"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-full shadow-sm transition-transform hover:scale-110"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Meta & Cover Button */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-ink-primary truncate">
                    {item.title}
                  </h4>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-canvas-secondary text-ink-secondary px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-contour-subtle text-xs">
                  <span className="text-[11px] text-ink-muted">
                    Uploaded: {item.uploadedAt}
                  </span>
                  {!item.isCover && (
                    <button
                      onClick={() => handleSetCover(item.id)}
                      className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
                    >
                      <Star className="w-3 h-3" /> Set as Cover
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* FULLSCREEN PREVIEW LIGHTBOX MODAL */}
      {previewItem && (
        <Modal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          title={previewItem.title}
          description={`Category: ${previewItem.category} • Uploaded ${previewItem.uploadedAt}`}
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="aspect-[16/10] bg-zinc-950 rounded-card-md overflow-hidden flex items-center justify-center">
              <img
                src={previewItem.imageUrl}
                alt={previewItem.title}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex gap-2">
                {previewItem.tags.map((t) => (
                  <Badge key={t} variant="neutral" size="sm">{t}</Badge>
                ))}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewItem(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* EDIT TITLE & CATEGORY MODAL */}
      {editItem && (
        <Modal
          isOpen={!!editItem}
          onClose={() => setEditItem(null)}
          title="Edit Image Details"
          description="Update public metadata and tags for this portfolio photograph."
          maxWidth="md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Title</label>
              <input
                type="text"
                required
                value={editItem.title}
                onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-primary">Category</label>
              <select
                value={editItem.category}
                onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                className="w-full bg-white border border-contour-strong rounded-card-sm p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
              >
                {categories.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setEditItem(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
