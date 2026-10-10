'use client';

import React, { useState } from 'react';
import {
  Download,
  Eye,
  X,
  Sparkles,
  Camera,
  CheckCircle2,
  Calendar,
  Layers,
  Filter,
  ArrowDownToLine
} from 'lucide-react';
import { CustomerNoticeBanner } from '../../../../components/customer/CustomerNoticeBanner';
import {
  INITIAL_GALLERY_PHOTOS,
  GalleryPhoto
} from '../../../../data/customerDashboardData';

export default function CustomerGalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(INITIAL_GALLERY_PHOTOS);
  const [selectedBookingFilter, setSelectedBookingFilter] = useState<string>('ALL');
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState('');

  const filterOptions = [
    { label: 'All Photos (65)', bookingId: 'ALL' },
    { label: 'Creator Reels (Karan Mehta)', bookingId: 'SNP-2026-98042' },
    { label: 'Anniversary Shoot (Aman Verma)', bookingId: 'SNP-2026-97910' },
  ];

  const filteredPhotos =
    selectedBookingFilter === 'ALL'
      ? photos
      : photos.filter((p) => p.bookingId === selectedBookingFilter);

  const handleDownloadZip = () => {
    setIsDownloadingZip(true);
    setTimeout(() => {
      setIsDownloadingZip(false);
      setDownloadSuccess('Simulated ZIP archive download started! (65 full-resolution Master JPEGs).');
      setTimeout(() => setDownloadSuccess(''), 5000);
    }, 1000);
  };

  const handleDownloadSingle = (photo: GalleryPhoto) => {
    setDownloadSuccess(`Simulated 4K master download: "${photo.title}" (${photo.sizeMb} MB)`);
    setTimeout(() => setDownloadSuccess(''), 4000);
  };

  return (
    <div className="space-y-8">
      <CustomerNoticeBanner moduleName="Client Delivered Photos & Proofing Gallery" />

      {/* Header & Batch Download */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E1D6]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1816] tracking-tight">
            Delivered Photo & Video Galleries
          </h1>
          <p className="text-xs sm:text-sm text-[#665E55] mt-1">
            Access, view in full resolution, and download high-res files from your completed shoots.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={isDownloadingZip}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#FF6E00] hover:bg-[#E86300] active:scale-95 shadow-sm transition-all shrink-0"
        >
          <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
          <span>{isDownloadingZip ? 'Packaging ZIP (380 MB)...' : 'Download Full Gallery ZIP'}</span>
        </button>
      </div>

      {downloadSuccess && (
        <div className="p-3.5 bg-green-50 border border-green-200 rounded-2xl text-xs font-bold text-green-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* SHOOT FILTER TABS */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <Filter className="w-3.5 h-3.5 text-[#8C847A] mr-1" />
        {filterOptions.map((opt) => (
          <button
            key={opt.bookingId}
            onClick={() => setSelectedBookingFilter(opt.bookingId)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedBookingFilter === opt.bookingId
                ? 'bg-[#1A1816] text-white shadow-sm'
                : 'bg-white text-[#5A544D] hover:text-[#1A1816] border border-[#E8E1D6]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* MASONRY / RESPONSIVE PHOTO GRID */}
      {filteredPhotos.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#EBE4DA] space-y-3">
          <Camera className="w-12 h-12 text-[#8C847A] mx-auto" />
          <h3 className="text-base font-bold text-[#1A1816]">No Delivered Photos in this Gallery</h3>
          <p className="text-xs text-[#665E55]">
            Photos will appear here as soon as your photographer uploads and finalizes editing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white rounded-3xl border border-[#EBE4DA] overflow-hidden shadow-subtle hover:shadow-card hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
            >
              {/* Photo Box */}
              <div
                className="relative aspect-[4/3] bg-[#FAF7F2] overflow-hidden cursor-pointer"
                onClick={() => setLightboxPhoto(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1A1816]/75 backdrop-blur-sm text-white">
                  {photo.category}
                </span>

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxPhoto(photo);
                    }}
                    className="p-2.5 rounded-full bg-white text-[#1A1816] hover:scale-110 transition-transform shadow-md"
                    title="Fullscreen Lightbox"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadSingle(photo);
                    }}
                    className="p-2.5 rounded-full bg-[#FF6E00] text-white hover:scale-110 transition-transform shadow-md"
                    title="Download Photo"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Photo Metadata */}
              <div className="p-4 space-y-2">
                <div>
                  <h4 className="text-xs font-bold text-[#1A1816] truncate">
                    {photo.title}
                  </h4>
                  <p className="text-[11px] text-[#8C847A] mt-0.5">
                    Photographer: {photo.photographerName}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-[11px] text-[#8C847A]">
                  <span>Delivered: {photo.deliveredAt}</span>
                  <span className="font-mono">{photo.sizeMb} MB RAW JPEG</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full bg-[#1A1816] rounded-3xl overflow-hidden p-4 sm:p-6 space-y-4 border border-white/10 shadow-elevated">
            {/* Top Close & Meta */}
            <div className="flex items-center justify-between text-white pb-2 border-b border-white/10">
              <div>
                <h3 className="text-sm sm:text-base font-bold truncate">{lightboxPhoto.title}</h3>
                <p className="text-xs text-white/60">
                  {lightboxPhoto.category} • Shot by {lightboxPhoto.photographerName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 text-white/70 hover:text-white rounded-full bg-white/10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Preview */}
            <div className="max-h-[65vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.title}
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between text-xs text-white/80 pt-2">
              <span className="font-mono">Ref: {lightboxPhoto.bookingId} ({lightboxPhoto.sizeMb} MB)</span>
              <button
                type="button"
                onClick={() => handleDownloadSingle(lightboxPhoto)}
                className="px-4 py-2 rounded-full text-xs font-bold text-white bg-[#FF6E00] hover:bg-[#E86300] flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Master JPEG</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
