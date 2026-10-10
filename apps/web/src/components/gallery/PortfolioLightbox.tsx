'use client';

import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export interface GalleryImage {
  id: string;
  url: string;
  title: string;
  category: string;
}

interface PortfolioLightboxProps {
  images: GalleryImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
}

export const PortfolioLightbox: React.FC<PortfolioLightboxProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onSelectIndex,
}) => {
  const handlePrev = useCallback(() => {
    onSelectIndex((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onSelectIndex]);

  const handleNext = useCallback(() => {
    onSelectIndex((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onSelectIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8 select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Image Lightbox Preview"
    >
      {/* Top Controls Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-20">
        <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold">
          <span>{currentIndex + 1}</span>
          <span className="text-gray-400"> / {images.length}</span>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
          aria-label="Close Lightbox (Escape)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Previous Button */}
      <button
        onClick={handlePrev}
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all z-20 focus:outline-none focus:ring-2 focus:ring-brand"
        aria-label="Previous Image (Left Arrow)"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Main Image Container */}
      <div className="relative max-w-5xl max-h-[82vh] w-full h-full flex flex-col items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage.url}
          alt={currentImage.title}
          className="max-w-full max-h-[75vh] object-contain rounded-card-sm shadow-2xl transition-all"
        />

        {/* Caption */}
        <div className="mt-3 text-center text-white">
          <p className="text-sm sm:text-base font-bold">{currentImage.title}</p>
          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
            {currentImage.category}
          </span>
        </div>
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all z-20 focus:outline-none focus:ring-2 focus:ring-brand"
        aria-label="Next Image (Right Arrow)"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
};
