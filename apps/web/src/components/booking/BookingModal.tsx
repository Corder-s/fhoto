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
import { VenueLocationPicker } from '../maps/VenueLocationPicker';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  photographerName: string;
  creatorId?: string;
  selectedPackage: PhotographerServicePackage | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  photographerName,
  creatorId,
  selectedPackage,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [date, setDate] = useState('2026-10-20');
  const [time, setTime] = useState('16:00');
  const [locationAddress, setLocationAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [createdBookingData, setCreatedBookingData] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  // Live Distance-Based Pricing State
  const [quote, setQuote] = useState<any | null>(null);
  const [isCalculatingQuote, setIsCalculatingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Recalculate quote whenever location address or coordinates change
  React.useEffect(() => {
    if (!isOpen || !selectedPackage || !locationAddress.trim() || locationAddress.trim().length < 3) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      setIsCalculatingQuote(true);
      setQuoteError(null);

      try {
        const res = await fetch('/api/bookings/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creatorId: creatorId || photographerName,
            serviceId: selectedPackage.id,
            basePackagePrice: selectedPackage.priceInr,
            durationHours: 2,
            eventLocation: locationAddress.trim(),
            locationLatitude: coordinates?.lat,
            locationLongitude: coordinates?.lng,
          }),
        });

        const data = await res.json();
        if (isCancelled) return;

        if (res.ok && data.success && data.quote) {
          setQuote(data.quote);
          setQuoteError(null);
        } else {
          setQuoteError(data.error || 'Could not calculate travel pricing.');
        }
      } catch (err: any) {
        if (!isCancelled) {
          setQuoteError(err?.message || 'Distance calculation error.');
        }
      } finally {
        if (!isCancelled) setIsCalculatingQuote(false);
      }
    }, 400);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, selectedPackage, locationAddress, coordinates, creatorId, photographerName]);

  if (!isOpen || !selectedPackage) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
    if (isCalculatingQuote) {
      setError('Please wait for travel distance and pricing calculation to complete.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const startDateTime = `${date}T${time}:00Z`;
      const endDateTime = `${date}T${(parseInt(time.split(':')[0], 10) + 2).toString().padStart(2, '0')}:${time.split(':')[1] || '00'}:00Z`;

      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user?.id,
          creatorId: creatorId || photographerName,
          serviceId: selectedPackage.id,
          eventTitle: `${selectedPackage.name} with ${photographerName}`,
          eventDate: date,
          durationHours: 2,
          startAt: startDateTime,
          endAt: endDateTime,
          eventLocation: locationAddress,
          locationLatitude: coordinates?.lat || null,
          locationLongitude: coordinates?.lng || null,
          customerNotes: specialInstructions,
          bookingType: 'scheduled',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to create booking.');
        setIsSubmitting(false);
        return;
      }

      setCreatedBookingData(data);
      setBookingConfirmed(true);
      setIsSubmitting(false);

      // Create payment intent
      const idempotencyKey = `idemp_${data.booking.id}_${Date.now()}`;
      await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: data.booking.id,
          customerId: user?.id,
          idempotencyKey,
        }),
      });
    } catch (err: any) {
      setError(err?.message || 'Network error creating booking.');
      setIsSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!createdBookingData?.booking?.id) return;
    setIsProcessingPayment(true);
    try {
      const res = await fetch('/api/payments/confirm-sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: createdBookingData.booking.id,
          paymentId: `pay_dev_${Date.now()}`,
        }),
      });
      const resData = await res.json();
      if (res.ok) {
        setPaymentDone(true);
      }
    } catch (err) {
      console.error('Payment confirm err:', err);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const resetAndClose = () => {
    setBookingConfirmed(false);
    setCreatedBookingData(null);
    setPaymentDone(false);
    setError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center p-3 sm:p-4 md:p-6 overflow-y-auto overflow-x-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) resetAndClose();
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-primary/60 backdrop-blur-sm transition-opacity"
        onClick={resetAndClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-lg my-auto bg-white rounded-card-lg border border-contour-subtle shadow-elevated p-6 sm:p-8 z-10 transition-all transform animate-in fade-in zoom-in-95 duration-200 max-h-[calc(100vh-1.5rem)] max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        <div className="flex items-start justify-between mb-4 shrink-0">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-brand">
              Instantshoot Booking Checkout
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

        <div className="overflow-y-auto overscroll-contain flex-1 pr-0.5">
        {bookingConfirmed ? (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-ink-primary">
                {paymentDone ? 'Booking Confirmed & Escrow Secured!' : 'Booking Created & Ready for Checkout'}
              </h3>
              <p className="text-xs text-ink-secondary max-w-xs mx-auto">
                Reference: <strong className="text-brand font-mono">{createdBookingData?.booking?.booking_reference || 'INST-2026-PENDING'}</strong>
              </p>
            </div>

            {/* Server-Calculated Price Breakdown */}
            <div className="bg-canvas-primary p-4 rounded-card-md border border-contour-subtle text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-muted">Package Selected:</span>
                <span className="font-bold text-ink-primary">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Scheduled Slot:</span>
                <span className="font-bold text-ink-primary">{date} at {time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Shoot Venue:</span>
                <span className="font-bold text-ink-primary truncate max-w-[180px]">{locationAddress}</span>
              </div>
              <div className="border-t border-contour-subtle pt-2 space-y-1.5">
                <div className="flex justify-between text-ink-muted">
                  <span>Base Service Fee:</span>
                  <span>₹{(createdBookingData?.breakdown?.agreedServicePrice || selectedPackage.priceInr).toLocaleString('en-IN')}</span>
                </div>
                {createdBookingData?.breakdown?.travelDistanceKm !== undefined && (
                  <div className="flex justify-between text-ink-muted">
                    <span>Shoot Distance:</span>
                    <span>{createdBookingData.breakdown.travelDistanceKm} km ({createdBookingData.breakdown.includedTravelKm || 20} km included)</span>
                  </div>
                )}
                {createdBookingData?.breakdown?.chargeableDistanceKm !== undefined && createdBookingData.breakdown.chargeableDistanceKm > 0 && (
                  <div className="flex justify-between text-ink-muted">
                    <span>Chargeable Distance:</span>
                    <span>{createdBookingData.breakdown.chargeableDistanceKm} km</span>
                  </div>
                )}
                <div className="flex justify-between text-ink-muted">
                  <span>Travel Fee:</span>
                  <span className={createdBookingData?.breakdown?.travelFee > 0 ? 'font-bold text-amber-700' : 'text-green-700'}>
                    {createdBookingData?.breakdown?.travelFee > 0
                      ? `₹${createdBookingData.breakdown.travelFee.toLocaleString('en-IN')}`
                      : 'FREE (Included)'}
                  </span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>Marketplace Platform Fee (10%):</span>
                  <span>₹{(createdBookingData?.breakdown?.platformFee || Math.round(selectedPackage.priceInr * 0.1)).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>GST Taxes (18%):</span>
                  <span>₹{(createdBookingData?.breakdown?.taxes || Math.round(selectedPackage.priceInr * 0.198)).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t border-contour-subtle pt-1.5 text-sm font-extrabold">
                  <span className="text-ink-primary">Total Payable:</span>
                  <span className="text-brand">₹{(createdBookingData?.breakdown?.totalAmount || Math.round(selectedPackage.priceInr * 1.298)).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {paymentDone ? (
              <div className="p-3 bg-green-50 rounded-card-sm border border-green-200 text-left flex items-start gap-2 text-xs text-green-800">
                <ShieldCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Escrow Active:</strong> Funds are locked in platform escrow until the shoot is completed and deliverables are reviewed.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-card-sm border border-amber-200 text-left flex items-start gap-2 text-xs text-amber-800">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Sandbox Test Environment:</strong> Authorize payment in development mode to simulate escrow lock and verify booking status transitions.
                </span>
              </div>
            )}

            {!paymentDone ? (
              <Button
                onClick={handleConfirmPayment}
                variant="primary"
                className="w-full"
                size="md"
                isLoading={isProcessingPayment}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Authorize Payment (Development Sandbox)
              </Button>
            ) : (
              <a
                href="/customer/bookings"
                className="block w-full py-2.5 px-4 bg-brand text-white font-extrabold text-xs text-center rounded-card-sm shadow-sm hover:bg-brand-hover transition-colors"
              >
                View in Customer Bookings Dashboard
              </a>
            )}

            <Button onClick={resetAndClose} variant="ghost" className="w-full text-xs text-ink-muted" size="sm">
              Close Window
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

            {/* Shoot Location Address with Autocomplete & Geocoded Venue Map */}
            <VenueLocationPicker
              value={locationAddress}
              onChange={(addr, coords) => {
                setLocationAddress(addr);
                if (coords) setCoordinates(coords);
              }}
              required
            />

            {/* Live Distance & Pricing Calculation Box */}
            {isCalculatingQuote && (
              <div className="p-3 bg-amber-50/80 rounded-card-sm border border-amber-200 flex items-center gap-2.5 text-xs text-amber-800 animate-pulse">
                <div className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Calculating travel distance and travel fee from artist hub...</span>
              </div>
            )}

            {quoteError && !isCalculatingQuote && (
              <div className="p-2.5 bg-red-50 rounded-card-sm border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{quoteError}</span>
              </div>
            )}

            {quote && !isCalculatingQuote && (
              <div className="p-3.5 bg-canvas-primary rounded-card-sm border border-contour-subtle space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-contour-subtle font-bold text-ink-primary">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand" />
                    Distance-Based Travel Pricing
                  </span>
                  <span className="font-mono text-brand text-[11px]">
                    {quote.calculatedDistanceKm} km {quote.distanceMethod === 'road' ? 'Road' : 'Geodesic'}
                  </span>
                </div>

                <div className="flex justify-between text-ink-secondary">
                  <span>Package Base Price:</span>
                  <span className="font-bold text-ink-primary">₹{quote.baseServicePrice.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-ink-secondary">
                  <span>Included Travel:</span>
                  <span>{quote.includedTravelKm} km</span>
                </div>

                <div className="flex justify-between text-ink-secondary">
                  <span>Chargeable Distance:</span>
                  <span className="font-semibold">{quote.chargeableDistanceKm} km (@ ₹{quote.travelRatePerKm}/km)</span>
                </div>

                <div className="flex justify-between text-ink-secondary">
                  <span>Travel Fee:</span>
                  <span className={`font-bold ${quote.travelFee > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                    {quote.travelFee > 0 ? `₹${quote.travelFee.toLocaleString('en-IN')}` : 'FREE (Included in base)'}
                  </span>
                </div>

                <div className="flex justify-between text-ink-secondary">
                  <span>Platform Fee ({quote.platformFeePercent}%):</span>
                  <span>₹{quote.platformFee.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-ink-secondary">
                  <span>GST Taxes ({quote.taxPercent}%):</span>
                  <span>₹{quote.taxes.toLocaleString('en-IN')}</span>
                </div>

                {quote.warnings && quote.warnings.length > 0 && (
                  <div className="p-2 bg-amber-50 rounded-card-xs border border-amber-200 text-[11px] text-amber-800">
                    {quote.warnings[0]}
                  </div>
                )}

                <div className="flex justify-between pt-1.5 border-t border-contour-subtle text-sm font-black text-ink-primary">
                  <span>Total Estimated Price:</span>
                  <span className="text-brand">₹{quote.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

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
    </div>
  );
};
