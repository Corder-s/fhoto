'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { 
  Star, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Camera, 
  ArrowRight,
  Share2,
  Calendar,
  AlertCircle,
  Eye,
  Check
} from 'lucide-react';
import { SAMPLE_PHOTOGRAPHERS, SamplePhotographer, PhotographerServicePackage } from '../../../data/photographers';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { PortfolioLightbox } from '../../../components/gallery/PortfolioLightbox';
import { BookingModal } from '../../../components/booking/BookingModal';

export default function PhotographerProfilePage({ params }: { params: { id: string } }) {
  const creator = SAMPLE_PHOTOGRAPHERS.find((p) => p.id === params.id);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PhotographerServicePackage | null>(null);

  // Copy Profile Link Toast State
  const [copiedToast, setCopiedToast] = useState(false);

  // 404 NOT FOUND STATE FOR UNKNOWN IDS
  if (!creator) {
    return (
      <>
        <Navbar />
        <main className="flex-1 bg-canvas-primary py-20">
          <div className="max-w-md mx-auto text-center px-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-ink-primary">Photographer Not Found</h1>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              We couldn&apos;t find a visual artist with the ID &ldquo;{params.id}&rdquo;. They may have moved or updated their profile handle.
            </p>
            <div className="pt-2">
              <Link href="/explore">
                <Button variant="primary" size="md">
                  Explore All Verified Photographers
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleInitiateBooking = (pkg: PhotographerServicePackage) => {
    setSelectedPackage(pkg);
    setBookingModalOpen(true);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-canvas-primary pb-20">
        {/* HERO PORTFOLIO COVER IMAGE */}
        <div className="relative h-64 sm:h-80 md:h-96 w-full bg-canvas-secondary overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={creator.coverImageUrl}
            alt={`${creator.name} cover`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 space-y-10">
          {/* PROFILE CARD */}
          <div className="bg-white rounded-card-lg border border-contour-subtle shadow-card p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
              {/* Avatar + Main Details */}
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-canvas-secondary border-4 border-white shadow-md shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={creator.avatarUrl}
                    alt={creator.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
                      {creator.name}
                    </h1>
                    {creator.isVerified && (
                      <span title="Government ID & Portfolio Authenticity Verified">
                        <CheckCircle2 className="w-5 h-5 text-brand fill-brand-subtle shrink-0" />
                      </span>
                    )}
                    <Badge variant="brand" size="sm">
                      Verified Artist
                    </Badge>
                  </div>

                  <p className="text-xs sm:text-sm text-ink-muted flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand shrink-0" />
                    <span>{creator.locationArea} • Base City: {creator.locationCity}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm font-semibold text-ink-primary pt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>{creator.rating}</span>
                      <span className="text-ink-muted font-normal">({creator.reviewCount} reviews)</span>
                    </div>
                    <span>•</span>
                    <span className="text-ink-secondary">{creator.experienceYears} Years Experience</span>
                    <span>•</span>
                    <Badge variant="success" size="sm">
                      {creator.availabilityStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 lg:pt-0">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleShare}
                  leftIcon={copiedToast ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
                >
                  {copiedToast ? 'Link Copied!' : 'Share'}
                </Button>

                <a href="#packages">
                  <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    View Packages
                  </Button>
                </a>
              </div>
            </div>

            {/* Bio & Specialties Grid */}
            <div className="mt-8 pt-6 border-t border-contour-subtle grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Professional Biography
                </h2>
                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                  {creator.bio}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                    Specialties
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {creator.specialties.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded-card-sm text-xs font-semibold bg-canvas-primary text-ink-primary border border-contour-subtle"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                    Equipment Information
                  </h2>
                  <p className="text-xs text-ink-secondary font-medium">
                    {creator.cameraGear}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* PORTFOLIO GALLERY SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-brand">
                  Visual Proof of Quality
                </span>
                <h2 className="text-2xl font-extrabold text-ink-primary">Portfolio Gallery</h2>
              </div>
              <span className="text-xs text-ink-muted font-medium">
                Click any photograph to view in full resolution
              </span>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
              {creator.fullPortfolio.map((img, index) => (
                <div
                  key={img.id}
                  onClick={() => handleOpenLightbox(index)}
                  className="group relative aspect-[4/3] rounded-card-sm overflow-hidden bg-canvas-secondary cursor-pointer shadow-subtle border border-contour-subtle"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3 text-white text-center">
                    <div>
                      <p className="text-xs font-bold">{img.title}</p>
                      <span className="text-[10px] text-gray-300 uppercase tracking-wider">
                        {img.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SERVICE PACKAGES & PRICING */}
          <div id="packages" className="space-y-6 pt-6">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-brand">
                Transparent Pricing
              </span>
              <h2 className="text-2xl font-extrabold text-ink-primary">
                Service Packages & Deliverables
              </h2>
              <p className="text-xs sm:text-sm text-ink-secondary mt-1">
                All packages include verified Shoot-Start OTP handshake & 100% platform escrow protection.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {creator.servicePackages.map((pkg) => (
                <Card
                  key={pkg.id}
                  hoverEffect
                  className={`flex flex-col justify-between relative ${
                    pkg.isPopular ? 'border-brand ring-1 ring-brand' : ''
                  }`}
                >
                  {pkg.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="brand" size="sm">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-ink-primary">{pkg.name}</h3>
                      <p className="text-2xl font-black text-brand mt-1">
                        ₹{pkg.priceInr.toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {pkg.duration} shoot • {pkg.photos}
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs sm:text-sm text-ink-secondary pt-2 border-t border-contour-subtle">
                      {pkg.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 mt-6 border-t border-contour-subtle">
                    <Button
                      variant={pkg.isPopular ? 'primary' : 'secondary'}
                      className="w-full"
                      size="md"
                      onClick={() => handleInitiateBooking(pkg)}
                    >
                      Book {pkg.name}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* CUSTOMER REVIEWS (CLEARLY LABELED DEMONSTRATION DATA) */}
          <div className="space-y-6 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-brand">
                  Client Feedback
                </span>
                <h2 className="text-2xl font-extrabold text-ink-primary">
                  Customer Reviews ({creator.reviews.length})
                </h2>
              </div>
              <span className="text-xs text-ink-muted">
                (Sample demonstration feedback for preview)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {creator.reviews.map((rev) => (
                <Card key={rev.id} className="p-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-ink-primary">{rev.clientName}</h3>
                      <p className="text-xs text-ink-muted">
                        {rev.clientLocation} • {rev.sessionType}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                  <p className="text-[10px] text-ink-muted pt-2 border-t border-contour-subtle">
                    Delivered on {rev.date} via SnapShoot Escrow
                  </p>
                </Card>
              ))}
            </div>
          </div>

          {/* CANCELLATION & TRUST BOX */}
          <div className="p-6 bg-canvas-secondary rounded-card-md border border-contour-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand" />
                <h3 className="text-sm font-bold text-ink-primary">
                  SnapShoot Cancellation & Escrow Protection
                </h3>
              </div>
              <p className="text-xs text-ink-secondary">
                100% full refund up to 24 hours before shoot. Funds held safely in escrow until you approve the delivered photographs.
              </p>
            </div>
            <Link href="/cancellation" className="text-xs font-bold text-brand hover:underline shrink-0">
              Read Refund Policy →
            </Link>
          </div>
        </div>
      </main>

      <Footer />

      {/* PORTFOLIO LIGHTBOX PREVIEW */}
      <PortfolioLightbox
        images={creator.fullPortfolio}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onSelectIndex={(idx) => setLightboxIndex(idx)}
      />

      {/* BOOKING MODAL */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        photographerName={creator.name}
        selectedPackage={selectedPackage}
      />
    </>
  );
}
