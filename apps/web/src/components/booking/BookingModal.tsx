'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  ArrowRight,
  Info
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PhotographerServicePackage } from '../../data/photographers';
import { useAuth } from '../../lib/auth';
import { useAuthModal } from '../auth/AuthModalContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  photographerName: string;
  selectedPackage: PhotographerServicePackage | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  photographerName,
  selectedPackage,
}) => {
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [date, setDate] = useState('2026-10-20');
  const [time, setTime] = useState('16:00');
  const [locationAddress, setLocationAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  if (!isOpen || !selectedPackage) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onClose();
      openAuthModal({
        message: `Please log in or create an account to reserve your shoot with ${photographerName}.`,
      });
      return;
    }
    if (!date) {
      setError('Please select a preferred date for the shoot.');
      return;
    }
    if (!locationAddress.trim()) {
      setError('Please provide a shoot location or venue address.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setBookingConfirmed(true);
    }, 700);
  };

  const resetAndClose = () => {
    setBookingConfirmed(false);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-primary/60 backdrop-blur-sm transition-opacity"
        onClick={resetAndClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-lg bg-white rounded-card-lg border border-contour-subtle shadow-elevated p-6 sm:p-8 z-10 transition-all transform animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-brand">
              Initiate Shoot Booking
            </span>
            <h2 id="booking-modal-title" className="text-xl sm:text-2xl font-extrabold text-ink-primary">
              Book with {photographerName}
            </h2>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1 rounded-card-sm text-ink-muted hover:text-ink-primary hover:bg-canvas-secondary transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {bookingConfirmed ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-ink-primary">Booking Request Prepared!</h3>
              <p className="text-xs sm:text-sm text-ink-secondary max-w-xs mx-auto">
                Your shoot package with <strong>{photographerName}</strong> has been configured.
              </p>
            </div>

            {/* Summary Box */}
            <div className="bg-canvas-primary p-4 rounded-card-md border border-contour-subtle text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-muted">Package:</span>
                <span className="font-bold text-ink-primary">{selectedPackage.name} ({selectedPackage.duration})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Scheduled Date & Time:</span>
                <span className="font-bold text-ink-primary">{date} at {time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Shoot Venue:</span>
                <span className="font-bold text-ink-primary">{locationAddress}</span>
              </div>
              <div className="flex justify-between border-t border-contour-subtle pt-2 text-sm">
                <span className="font-bold text-ink-primary">Package Price:</span>
                <span className="font-black text-brand">₹{selectedPackage.priceInr.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-card-sm border border-amber-200 text-left flex items-start gap-2 text-xs text-amber-800">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Demonstration Note:</strong> In the upcoming backend phases, this triggers the payment gateway escrow checkout and generates the 6-digit Shoot-Start OTP.
              </span>
            </div>

            <Button onClick={resetAndClose} variant="primary" className="w-full" size="md">
              Return to Profile
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Package Summary Header Card */}
            <div className="p-3.5 bg-canvas-primary rounded-card-sm border border-contour-subtle flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-ink-primary">{selectedPackage.name}</p>
                <p className="text-[11px] text-ink-secondary">{selectedPackage.duration} • {selectedPackage.photos}</p>
              </div>
              <p className="text-base font-black text-brand">
                ₹{selectedPackage.priceInr.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-primary mb-1">
                  Preferred Date
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-primary mb-1">
                  Start Time
                </label>
                <div className="relative">
                  <Input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Shoot Location Address */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-primary mb-1">
                Shoot Venue / Location Address
              </label>
              <Input
                placeholder="e.g. Lodhi Gardens, New Delhi or Client Studio"
                required
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4 text-brand" />}
              />
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-primary mb-1">
                Creative Notes or Requirements (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. We have 2 outfit changes and prefer outdoor natural light."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full bg-white text-ink-primary text-xs sm:text-sm font-medium rounded-card-sm border border-contour-subtle p-3 transition-colors placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>

            {error && <p className="text-xs font-bold text-red-600">{error}</p>}

            {/* Escrow Guarantee Note */}
            <div className="flex items-center gap-2 text-xs text-ink-muted pt-1">
              <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
              <span>100% Escrow Protection • 6-Digit OTP Handshake at venue</span>
            </div>

            {/* Submit CTA */}
            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              size="md"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Confirm Shoot Details
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
