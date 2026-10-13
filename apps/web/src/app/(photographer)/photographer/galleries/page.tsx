'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  UploadCloud,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Lock,
  Eye,
  KeyRound,
  Calendar,
  User,
  Sparkles,
  FileText,
  Search,
  Filter,
  X,
  ExternalLink,
  Share2,
  AlertCircle,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { DemoNoticeBanner } from '../../../../components/photographer/DemoNoticeBanner';
import { INITIAL_PORTFOLIO } from '../../../../data/photographerDashboardData';

interface ClientGalleryItem {
  id: string;
  bookingRef: string;
  clientName: string;
  clientEmail: string;
  shootTitle: string;
  shootDate: string;
  deliveredDate?: string;
  status: 'DELIVERED' | 'EDITING_IN_PROGRESS' | 'PENDING_UPLOAD';
  totalPhotos: number;
  expectedPhotos: number;
  accessPin: string;
  hasCustomWatermark: boolean;
  coverImage: string;
  photos: Array<{ id: string; url: string; title: string }>;
}

const INITIAL_CLIENT_GALLERIES: ClientGalleryItem[] = [
  {
    id: 'gal-001',
    bookingRef: 'SNP-2026-98124',
    clientName: 'Aman Verma',
    clientEmail: 'aman.verma@gmail.com',
    shootTitle: '5th Wedding Anniversary Couple Portrait Shoot',
    shootDate: '08 Oct 2026',
    deliveredDate: '10 Oct 2026',
    status: 'DELIVERED',
    totalPhotos: 35,
    expectedPhotos: 35,
    accessPin: '4829',
    hasCustomWatermark: true,
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    photos: INITIAL_PORTFOLIO.slice(0, 6).map((p) => ({
      id: p.id,
      url: p.imageUrl,
      title: p.title,
    })),
  },
  {
    id: 'gal-002',
    bookingRef: 'SNP-2026-94021',
    clientName: 'Simran Grover',
    clientEmail: 'simran.grover@fintech.co',
    shootTitle: 'Corporate Executive Leadership & Brand Headshots',
    shootDate: '28 Sep 2026',
    deliveredDate: '30 Sep 2026',
    status: 'DELIVERED',
    totalPhotos: 28,
    expectedPhotos: 25,
    accessPin: '8192',
    hasCustomWatermark: true,
    coverImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    photos: INITIAL_PORTFOLIO.slice(2, 7).map((p) => ({
      id: p.id,
      url: p.imageUrl,
      title: p.title,
    })),
  },
  {
    id: 'gal-003',
    bookingRef: 'SNP-2026-88412',
    clientName: 'Karan Mehta',
    clientEmail: 'karan.mehta@brandreels.in',
    shootTitle: 'Bandra Golden-Hour Street Fashion Lookbook',
    shootDate: '10 Oct 2026',
    status: 'EDITING_IN_PROGRESS',
    totalPhotos: 12,
    expectedPhotos: 30,
    accessPin: '5510',
    hasCustomWatermark: true,
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    photos: INITIAL_PORTFOLIO.slice(0, 3).map((p) => ({
      id: p.id,
      url: p.imageUrl,
      title: p.title,
    })),
  },
  {
    id: 'gal-004',
    bookingRef: 'SNP-2026-77319',
    clientName: 'Neha Kapoor',
    clientEmail: 'neha.kapoor@studio.design',
    shootTitle: 'Modern Interior & Architectural Boutique Shoot',
    shootDate: '11 Oct 2026',
    status: 'PENDING_UPLOAD',
    totalPhotos: 0,
    expectedPhotos: 20,
    accessPin: '9034',
    hasCustomWatermark: false,
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    photos: [],
  },
];

export default function PhotographerGalleriesPage() {
  const [galleries, setGalleries] = useState<ClientGalleryItem[]>(INITIAL_CLIENT_GALLERIES);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'DELIVERED' | 'EDITING_IN_PROGRESS' | 'PENDING_UPLOAD'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Delivery Modal
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [selectedGalleryForDelivery, setSelectedGalleryForDelivery] = useState<ClientGalleryItem | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'upload' | 'google_drive' | 'video_link'>('upload');
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  const [videoStreamUrl, setVideoStreamUrl] = useState('');
  const [deliverableCategory, setDeliverableCategory] = useState<'edited_photos' | 'raw_photos' | 'edited_video'>('edited_photos');
  const [deliveryError, setDeliveryError] = useState('');
  const [uploadCount, setUploadCount] = useState(25);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [customPin, setCustomPin] = useState('');
  const [deliverySuccessMessage, setDeliverySuccessMessage] = useState('');

  // Preview Modal
  const [previewGallery, setPreviewGallery] = useState<ClientGalleryItem | null>(null);

  const filteredGalleries = galleries.filter((g) => {
    const matchesFilter = filterStatus === 'ALL' || g.status === filterStatus;
    const matchesSearch =
      g.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.shootTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.bookingRef.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenDeliver = (g: ClientGalleryItem) => {
    setSelectedGalleryForDelivery(g);
    setCustomPin(g.accessPin);
    setUploadProgress(0);
    setDeliveryError('');
    setGoogleDriveUrl('');
    setVideoStreamUrl('');
    setDeliveryMethod('upload');
    setIsDeliverModalOpen(true);
  };

  const handleConfirmDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGalleryForDelivery) return;

    if (deliveryMethod === 'google_drive') {
      const driveRegex = /^https:\/\/(drive|docs)\.google\.com\/(file\/d\/|drive\/folders\/|open\?id=|document\/d\/)[a-zA-Z0-9_-]+/;
      if (!driveRegex.test(googleDriveUrl.trim())) {
        setDeliveryError('Invalid Google Drive link format. Please provide a valid shareable link (e.g. https://drive.google.com/drive/folders/...) with view permissions enabled.');
        return;
      }
    }

    if (deliveryMethod === 'video_link' && !videoStreamUrl.trim()) {
      setDeliveryError('Please enter a valid video link (YouTube, Vimeo, or Frame.io).');
      return;
    }

    setDeliveryError('');
    setIsUploading(true);
    setUploadProgress(20);

    // Dispatch deliverable to server API
    fetch('/api/deliverables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: selectedGalleryForDelivery.bookingRef,
        creatorId: 'pro-current',
        customerId: selectedGalleryForDelivery.clientEmail,
        title: `${selectedGalleryForDelivery.shootTitle} — Deliverables`,
        deliverableType: deliverableCategory,
        storageProvider: deliveryMethod === 'google_drive' ? 'google_drive' : (deliveryMethod === 'video_link' ? 'external_video' : 'supabase_storage'),
        externalUrl: deliveryMethod === 'google_drive' ? googleDriveUrl.trim() : (deliveryMethod === 'video_link' ? videoStreamUrl.trim() : null),
      }),
    }).catch((err) => console.warn('Deliverable API notice:', err));

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            setGalleries((prevGals) =>
              prevGals.map((item) =>
                item.id === selectedGalleryForDelivery.id
                  ? {
                      ...item,
                      status: 'DELIVERED',
                      totalPhotos: deliveryMethod === 'upload' ? uploadCount : 50,
                      accessPin: customPin || item.accessPin,
                      deliveredDate: new Date().toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      }),
                    }
                  : item
              )
            );
            setIsDeliverModalOpen(false);
            setDeliverySuccessMessage(
              `Deliverables for ${selectedGalleryForDelivery.clientName} dispatched successfully! Verification notification sent to ${selectedGalleryForDelivery.clientEmail}.`
            );
            setTimeout(() => setDeliverySuccessMessage(''), 5000);
          }, 400);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <DemoNoticeBanner moduleName="Private Client Delivery Galleries (Isolated Tenancy)" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand/10 text-brand">
              SaaS Business Suite
            </span>
            <span className="text-xs text-ink-muted">· Isolated Client Galleries</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight mt-1">
            Private Client Galleries &amp; Deliverables
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Deliver finished high-resolution photos securely to your booked clients with password-protected cloud galleries.
          </p>
        </div>

        <div className="p-3 bg-canvas-primary border border-contour-subtle rounded-card-sm text-xs space-y-1 sm:max-w-xs">
          <div className="flex items-center gap-1.5 text-ink-primary font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Multi-Tenant Access Isolation</span>
          </div>
          <p className="text-[11px] text-ink-muted">
            Private galleries are strictly segregated from public portfolios. Only the assigned client with their secure PIN or JWT session can view raw/edited files.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {deliverySuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-card-sm text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{deliverySuccessMessage}</span>
        </div>
      )}

      {/* Summary Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-contour-subtle space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Delivered Galleries</p>
          <p className="text-2xl font-black text-emerald-600">
            {galleries.filter((g) => g.status === 'DELIVERED').length}
          </p>
          <p className="text-[11px] text-ink-muted">Ready for client download &amp; sharing</p>
        </Card>

        <Card className="p-4 bg-white border-contour-subtle space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Editing In Progress</p>
          <p className="text-2xl font-black text-amber-600">
            {galleries.filter((g) => g.status === 'EDITING_IN_PROGRESS').length}
          </p>
          <p className="text-[11px] text-ink-muted">Turnaround SLA within 48 hours</p>
        </Card>

        <Card className="p-4 bg-white border-contour-subtle space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Pending Upload</p>
          <p className="text-2xl font-black text-brand">
            {galleries.filter((g) => g.status === 'PENDING_UPLOAD').length}
          </p>
          <p className="text-[11px] text-ink-muted">Awaiting raw file import</p>
        </Card>

        <Card className="p-4 bg-white border-contour-subtle space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Cloud Delivery Storage</p>
          <p className="text-2xl font-black text-ink-primary">2.4 GB</p>
          <p className="text-[11px] text-ink-muted">of 25 GB PRO Cloud Quota used</p>
        </Card>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-card border border-contour-subtle shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, shoot, or ref..."
            className="w-full pl-9 pr-3.5 py-2 text-xs font-medium border border-contour-subtle rounded-card-sm bg-white focus:outline-none focus:border-brand"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'DELIVERED', 'EDITING_IN_PROGRESS', 'PENDING_UPLOAD'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-card-sm text-xs font-bold whitespace-nowrap transition-all ${
                filterStatus === st
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-canvas-secondary text-ink-secondary hover:text-ink-primary border border-contour-subtle'
              }`}
            >
              {st === 'ALL'
                ? 'All Galleries'
                : st === 'DELIVERED'
                ? 'Delivered'
                : st === 'EDITING_IN_PROGRESS'
                ? 'Editing'
                : 'Pending'}
            </button>
          ))}
        </div>
      </div>

      {/* Galleries Grid */}
      {filteredGalleries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-card border border-contour-subtle p-8 space-y-3">
          <Layers className="w-10 h-10 text-ink-muted mx-auto" />
          <h3 className="text-base font-bold text-ink-primary">No galleries match your search</h3>
          <p className="text-xs text-ink-secondary">Try adjusting your status filter or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGalleries.map((gallery) => (
            <Card
              key={gallery.id}
              className="bg-white border-contour-subtle shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Cover & Badges */}
                <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={gallery.coverImage}
                    alt={gallery.shootTitle}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <Badge
                      variant={
                        gallery.status === 'DELIVERED'
                          ? 'success'
                          : gallery.status === 'EDITING_IN_PROGRESS'
                          ? 'warning'
                          : 'brand'
                      }
                      size="sm"
                    >
                      {gallery.status === 'DELIVERED'
                        ? 'Delivered to Client'
                        : gallery.status === 'EDITING_IN_PROGRESS'
                        ? 'Editing in Progress'
                        : 'Awaiting Upload'}
                    </Badge>

                    {gallery.hasCustomWatermark && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-ink-primary backdrop-blur-sm">
                        Custom Watermark
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs font-mono font-bold text-white/80">Ref: {gallery.bookingRef}</p>
                    <h3 className="text-sm font-bold truncate text-white mt-0.5">{gallery.shootTitle}</h3>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[11px] font-bold text-ink-muted uppercase">Client Name</p>
                      <p className="font-bold text-ink-primary flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5 text-brand" />
                        <span>{gallery.clientName}</span>
                      </p>
                      <p className="text-[11px] text-ink-muted truncate">{gallery.clientEmail}</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold text-ink-muted uppercase">Shoot &amp; Delivery</p>
                      <p className="font-semibold text-ink-secondary mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-ink-muted" />
                        <span>{gallery.shootDate}</span>
                      </p>
                      {gallery.deliveredDate && (
                        <p className="text-[11px] text-emerald-700 font-bold">
                          Delivered: {gallery.deliveredDate}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Photos & Access PIN Box */}
                  <div className="p-3 bg-canvas-primary rounded-card-sm border border-contour-subtle flex items-center justify-between text-xs">
                    <div>
                      <p className="text-ink-muted font-bold text-[11px]">Photos Uploaded</p>
                      <p className="font-black text-ink-primary text-sm">
                        {gallery.totalPhotos} / {gallery.expectedPhotos} High-Res
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-ink-muted font-bold text-[11px]">Client Access PIN</p>
                      <p className="font-mono font-black text-brand text-sm tracking-widest">
                        {gallery.accessPin}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-canvas-secondary/50 border-t border-contour-subtle flex items-center justify-between gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPreviewGallery(gallery)}
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                >
                  Preview Gallery
                </Button>

                {gallery.status === 'DELIVERED' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDeliver(gallery)}
                    leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
                  >
                    Re-Deliver / Append
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenDeliver(gallery)}
                    leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
                  >
                    Upload &amp; Deliver
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Deliver Modal */}
      {isDeliverModalOpen && selectedGalleryForDelivery && (
        <Modal
          isOpen={isDeliverModalOpen}
          onClose={() => !isUploading && setIsDeliverModalOpen(false)}
          title={`Deliver Gallery — ${selectedGalleryForDelivery.clientName}`}
        >
          <form onSubmit={handleConfirmDelivery} className="space-y-5">
            <div className="p-3 bg-canvas-primary rounded-card-sm border border-contour-subtle text-xs space-y-1">
              <p className="font-bold text-ink-primary">{selectedGalleryForDelivery.shootTitle}</p>
              <p className="text-ink-secondary">Ref: {selectedGalleryForDelivery.bookingRef}</p>
              <p className="text-ink-muted">Client Notification Target: {selectedGalleryForDelivery.clientEmail}</p>
            </div>

            {/* Delivery Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary">
                Delivery Channel / Media Format *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('upload')}
                  className={`p-2.5 rounded-card-sm border text-xs font-bold text-center transition-all ${
                    deliveryMethod === 'upload'
                      ? 'border-brand bg-brand/5 text-brand shadow-xs'
                      : 'border-contour-subtle bg-white text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  Direct Upload
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('google_drive')}
                  className={`p-2.5 rounded-card-sm border text-xs font-bold text-center transition-all ${
                    deliveryMethod === 'google_drive'
                      ? 'border-brand bg-brand/5 text-brand shadow-xs'
                      : 'border-contour-subtle bg-white text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  Google Drive Link
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('video_link')}
                  className={`p-2.5 rounded-card-sm border text-xs font-bold text-center transition-all ${
                    deliveryMethod === 'video_link'
                      ? 'border-brand bg-brand/5 text-brand shadow-xs'
                      : 'border-contour-subtle bg-white text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  Video Stream Link
                </button>
              </div>
            </div>

            {/* Deliverable Category */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary mb-1">
                Asset Classification
              </label>
              <select
                value={deliverableCategory}
                onChange={(e: any) => setDeliverableCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border border-contour-subtle rounded-card-sm bg-white focus:outline-none focus:border-brand"
              >
                <option value="edited_photos">Curated High-Res Edited Photos</option>
                <option value="raw_photos">Raw Unedited Photographic Assets (CR2/ARW/DNG)</option>
                <option value="edited_video">4K Master Cinema Film / Vertical Reels</option>
              </select>
            </div>

            {deliveryMethod === 'upload' ? (
              /* Upload Area */
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary mb-1.5">
                  Upload Curated High-Res Files *
                </label>
                <div className="border-2 border-dashed border-contour-subtle rounded-card p-6 text-center bg-canvas-primary/50 hover:bg-canvas-primary transition-colors cursor-pointer">
                  <UploadCloud className="w-8 h-8 text-brand mx-auto mb-2" />
                  <p className="text-xs font-bold text-ink-primary">
                    Drag &amp; drop edited photos or click to browse
                  </p>
                  <p className="text-[11px] text-ink-muted mt-1">
                    Supports JPEG, PNG, TIFF, or compressed ZIP. Max 500MB per deliverable.
                  </p>
                </div>
              </div>
            ) : deliveryMethod === 'google_drive' ? (
              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary">
                  Google Drive Shared Link *
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/1a2b3c4d5e..."
                  value={googleDriveUrl}
                  onChange={(e) => setGoogleDriveUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium border border-contour-subtle rounded-card-sm bg-white focus:outline-none focus:border-brand"
                />
                <p className="text-[11px] text-ink-muted">
                  Ensure link sharing is set to "Anyone with the link can view". Platform verifies URL format before customer notification.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary">
                  External Video Preview Link (YouTube / Vimeo / Frame.io) *
                </label>
                <input
                  type="url"
                  placeholder="https://vimeo.com/... or https://youtu.be/..."
                  value={videoStreamUrl}
                  onChange={(e) => setVideoStreamUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium border border-contour-subtle rounded-card-sm bg-white focus:outline-none focus:border-brand"
                />
              </div>
            )}

            {deliveryError && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-card-sm border border-red-200">
                {deliveryError}
              </p>
            )}

            {/* Photo count selector */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary mb-1.5">
                  Photos Delivered Count
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={uploadCount}
                  onChange={(e) => setUploadCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs font-bold border border-contour-subtle rounded-card-sm bg-white focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-primary mb-1.5">
                  4-Digit Access PIN
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={customPin}
                  onChange={(e) => setCustomPin(e.target.value)}
                  placeholder="e.g. 4829"
                  className="w-full px-3 py-2 text-xs font-mono font-bold tracking-widest text-center border border-contour-subtle rounded-card-sm bg-white focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* Progress Bar when uploading */}
            {isUploading && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-brand">
                  <span>Uploading 4K Assets &amp; Generating Watermarked Previews...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-canvas-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-brand h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-contour-subtle">
              <Button
                variant="ghost"
                size="md"
                type="button"
                disabled={isUploading}
                onClick={() => setIsDeliverModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                isLoading={isUploading}
                leftIcon={<UploadCloud className="w-4 h-4" />}
              >
                Dispatch to Client
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Gallery Lightbox / Preview Modal */}
      {previewGallery && (
        <Modal
          isOpen={!!previewGallery}
          onClose={() => setPreviewGallery(null)}
          title={`Gallery Preview — ${previewGallery.clientName}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs border-b border-contour-subtle pb-3">
              <div>
                <p className="font-bold text-ink-primary">{previewGallery.shootTitle}</p>
                <p className="text-ink-muted">Access PIN: {previewGallery.accessPin}</p>
              </div>
              <Badge variant={previewGallery.status === 'DELIVERED' ? 'success' : 'warning'} size="sm">
                {previewGallery.status}
              </Badge>
            </div>

            {previewGallery.photos.length === 0 ? (
              <div className="text-center py-10 text-ink-muted text-xs space-y-2">
                <ImageIcon className="w-8 h-8 mx-auto" />
                <p>No photos uploaded to this gallery yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
                {previewGallery.photos.map((p) => (
                  <div key={p.id} className="group relative rounded-card-sm overflow-hidden aspect-square bg-slate-900">
                    <img
                      src={p.url}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center text-white text-[11px] font-bold">
                      {p.title}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setPreviewGallery(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
