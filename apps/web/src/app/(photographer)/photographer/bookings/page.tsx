'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Navigation,
  UploadCloud,
  DollarSign,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { DemoNoticeBanner } from '../../../../components/photographer/DemoNoticeBanner';
import {
  INITIAL_BOOKINGS,
  PhotographerBooking,
  BookingStatus
} from '../../../../data/photographerDashboardData';

export default function PhotographerBookingsPage() {
  const [bookings, setBookings] = useState<PhotographerBooking[]>(INITIAL_BOOKINGS);
  const [activeTab, setActiveTab] = useState<'ALL' | 'REQUESTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<PhotographerBooking | null>(null);

  // OTP Modal State
  const [otpModalBooking, setOtpModalBooking] = useState<PhotographerBooking | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Reject Modal State
  const [rejectingBooking, setRejectingBooking] = useState<PhotographerBooking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Schedule conflict with another shoot');

  // Filter Bookings by Tab
  const filterBookings = () => {
    if (activeTab === 'ALL') return bookings;
    if (activeTab === 'IN_PROGRESS') {
      return bookings.filter(
        (b) =>
          b.status === 'ON_THE_WAY' ||
          b.status === 'ARRIVED_AT_VENUE' ||
          b.status === 'IN_PROGRESS'
      );
    }
    return bookings.filter((b) => b.status === activeTab);
  };

  const currentBookings = filterBookings();

  // Counts for tabs
  const requestedCount = bookings.filter((b) => b.status === 'REQUESTED').length;
  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const inProgressCount = bookings.filter(
    (b) =>
      b.status === 'ON_THE_WAY' ||
      b.status === 'ARRIVED_AT_VENUE' ||
      b.status === 'IN_PROGRESS'
  ).length;
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;
  const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED').length;

  // State Transition Handlers
  const handleAcceptRequest = (id: string) => {
    setBookings(
      bookings.map((b) => (b.id === id ? { ...b, status: 'CONFIRMED' } : b))
    );
  };

  const handleConfirmReject = () => {
    if (!rejectingBooking) return;
    setBookings(
      bookings.map((b) =>
        b.id === rejectingBooking.id ? { ...b, status: 'CANCELLED' } : b
      )
    );
    setRejectingBooking(null);
  };

  const handleMarkOnTheWay = (id: string) => {
    setBookings(
      bookings.map((b) => (b.id === id ? { ...b, status: 'ON_THE_WAY' } : b))
    );
  };

  const handleMarkArrived = (id: string) => {
    setBookings(
      bookings.map((b) =>
        b.id === id ? { ...b, status: 'ARRIVED_AT_VENUE' } : b
      )
    );
  };

  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpModalBooking) return;

    if (enteredOtp !== otpModalBooking.startOtp && enteredOtp !== '482910') {
      setOtpError(`Incorrect OTP. Use client's code: ${otpModalBooking.startOtp}`);
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError('');

    setTimeout(() => {
      setIsVerifyingOtp(false);
      setBookings(
        bookings.map((b) =>
          b.id === otpModalBooking.id ? { ...b, status: 'IN_PROGRESS' } : b
        )
      );
      setOtpModalBooking(null);
      setEnteredOtp('');
    }, 500);
  };

  const handleMarkCompleted = (id: string) => {
    setBookings(
      bookings.map((b) => (b.id === id ? { ...b, status: 'COMPLETED' } : b))
    );
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'REQUESTED':
        return <Badge variant="warning" size="sm">New Request</Badge>;
      case 'CONFIRMED':
        return <Badge variant="brand" size="sm">Confirmed</Badge>;
      case 'ON_THE_WAY':
        return <Badge variant="brand" size="sm">On The Way</Badge>;
      case 'ARRIVED_AT_VENUE':
        return <Badge variant="warning" size="sm">At Venue (Awaiting OTP)</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="success" size="sm">Shoot In Progress</Badge>;
      case 'COMPLETED':
        return <Badge variant="success" size="sm">Shoot Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="error" size="sm">Cancelled</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <DemoNoticeBanner moduleName="Booking Pipeline & State Machine" />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
          Photographer Booking Management
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Review incoming requests, manage venue arrivals, verify start OTPs, and track completed assignments.
        </p>
      </div>

      {/* TABS FILTER */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-contour-subtle">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'ALL'
              ? 'bg-ink-primary text-white shadow-sm'
              : 'bg-white text-ink-secondary hover:text-ink-primary border border-contour-subtle hover:bg-canvas-secondary'
          }`}
        >
          All Bookings ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab('REQUESTED')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'REQUESTED'
              ? 'bg-brand text-white shadow-sm'
              : 'bg-white text-ink-secondary hover:text-ink-primary border border-contour-subtle hover:bg-canvas-secondary'
          }`}
        >
          <span>New Requests</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-900 font-extrabold">
            {requestedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CONFIRMED')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'CONFIRMED'
              ? 'bg-ink-primary text-white shadow-sm'
              : 'bg-white text-ink-secondary hover:text-ink-primary border border-contour-subtle hover:bg-canvas-secondary'
          }`}
        >
          Upcoming ({confirmedCount})
        </button>

        <button
          onClick={() => setActiveTab('IN_PROGRESS')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'IN_PROGRESS'
              ? 'bg-ink-primary text-white shadow-sm'
              : 'bg-white text-ink-secondary hover:text-ink-primary border border-contour-subtle hover:bg-canvas-secondary'
          }`}
        >
          In Progress / At Venue ({inProgressCount})
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'COMPLETED'
              ? 'bg-ink-primary text-white shadow-sm'
              : 'bg-white text-ink-secondary hover:text-ink-primary border border-contour-subtle hover:bg-canvas-secondary'
          }`}
        >
          Completed ({completedCount})
        </button>

        <button
          onClick={() => setActiveTab('CANCELLED')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'CANCELLED'
              ? 'bg-ink-primary text-white shadow-sm'
              : 'bg-white text-ink-secondary hover:text-ink-primary border border-contour-subtle hover:bg-canvas-secondary'
          }`}
        >
          Cancelled ({cancelledCount})
        </button>
      </div>

      {/* BOOKINGS LIST */}
      {currentBookings.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-ink-muted mx-auto" />
          <h3 className="text-base font-bold text-ink-primary">No Bookings in this Category</h3>
          <p className="text-xs text-ink-secondary max-w-sm mx-auto">
            There are currently no bookings with status matching the selected filter.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setActiveTab('ALL')}>
            View All Bookings
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {currentBookings.map((b) => (
            <Card
              key={b.id}
              className={`p-6 transition-all border ${
                b.status === 'ARRIVED_AT_VENUE' || b.status === 'IN_PROGRESS'
                  ? 'border-brand/50 bg-brand-subtle/10'
                  : 'border-contour-subtle bg-white'
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Overview */}
                <div className="lg:col-span-8 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-ink-primary">
                      {b.id}
                    </span>
                    <span>•</span>
                    <span className="text-xs text-ink-muted">{b.category}</span>
                    <span>•</span>
                    {getStatusBadge(b.status)}
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-ink-primary">
                      {b.packageTitle}
                    </h3>
                    <p className="text-xs text-ink-secondary mt-1 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-brand shrink-0" />
                      <span>{b.venueAddress}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-ink-secondary pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-ink-muted" />
                      <strong>{b.date}</strong>, {b.timeSlot}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-ink-muted" />
                      {b.duration}
                    </span>
                    <span>•</span>
                    <span>Client: <strong>{b.customerName}</strong></span>
                  </div>

                  {b.notes && (
                    <p className="text-xs text-ink-muted bg-canvas-primary p-2.5 rounded border border-contour-subtle italic">
                      &ldquo;{b.notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Right Financials & Action Buttons */}
                <div className="lg:col-span-4 flex flex-col justify-between items-start lg:items-end space-y-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-contour-subtle">
                  <div className="text-left lg:text-right">
                    <p className="text-xl font-black text-ink-primary">
                      ₹{b.netEarnings.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      Your 80% Net Payout (Gross: ₹{b.grossAmount.toLocaleString('en-IN')})
                    </p>
                  </div>

                  {/* Dynamic Action Buttons Depending on State */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedBooking(b)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Details
                    </Button>

                    {/* State: REQUESTED */}
                    {b.status === 'REQUESTED' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAcceptRequest(b.id)}
                        >
                          Accept Request
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRejectingBooking(b)}
                        >
                          Decline
                        </Button>
                      </>
                    )}

                    {/* State: CONFIRMED */}
                    {b.status === 'CONFIRMED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleMarkOnTheWay(b.id)}
                        leftIcon={<Navigation className="w-3.5 h-3.5" />}
                      >
                        Mark On The Way
                      </Button>
                    )}

                    {/* State: ON_THE_WAY */}
                    {b.status === 'ON_THE_WAY' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleMarkArrived(b.id)}
                        leftIcon={<MapPin className="w-3.5 h-3.5" />}
                      >
                        Mark Arrived at Venue
                      </Button>
                    )}

                    {/* State: ARRIVED_AT_VENUE */}
                    {b.status === 'ARRIVED_AT_VENUE' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setOtpModalBooking(b);
                          setEnteredOtp('');
                          setOtpError('');
                        }}
                        leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                      >
                        Verify Start OTP
                      </Button>
                    )}

                    {/* State: IN_PROGRESS */}
                    {b.status === 'IN_PROGRESS' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleMarkCompleted(b.id)}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Mark Shoot Completed
                      </Button>
                    )}

                    {/* State: COMPLETED */}
                    {b.status === 'COMPLETED' && (
                      <Link href="/photographer/portfolio">
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
                        >
                          {b.photosUploaded ? 'Delivered' : 'Upload Finished Photos'}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedBooking && (
        <Modal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title={`Booking Details: ${selectedBooking.id}`}
          description={`Category: ${selectedBooking.category} • Client: ${selectedBooking.customerName}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-xs text-ink-secondary">
            {/* Status & Package */}
            <div className="flex items-center justify-between p-3.5 bg-canvas-primary rounded-card-sm border border-contour-subtle">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-ink-muted">Shoot Package</span>
                <p className="text-sm font-bold text-ink-primary">{selectedBooking.packageTitle}</p>
                <p>{selectedBooking.duration}</p>
              </div>
              <div className="text-right">
                {getStatusBadge(selectedBooking.status)}
              </div>
            </div>

            {/* Client Info */}
            <div className="space-y-2">
              <p className="font-bold uppercase text-ink-primary">Customer & Contact</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-card-sm border border-contour-subtle">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand shrink-0" />
                  <div>
                    <p className="text-ink-muted">Phone Number</p>
                    <p className="font-bold text-ink-primary">{selectedBooking.customerPhone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand shrink-0" />
                  <div>
                    <p className="text-ink-muted">Email Address</p>
                    <p className="font-bold text-ink-primary">{selectedBooking.customerEmail}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Venue & Time */}
            <div className="space-y-1.5">
              <p className="font-bold uppercase text-ink-primary">Venue & Schedule</p>
              <p className="flex items-center gap-1.5 text-ink-primary font-medium">
                <MapPin className="w-4 h-4 text-brand shrink-0" />
                <span>{selectedBooking.venueAddress}</span>
              </p>
              <p className="flex items-center gap-1.5 text-ink-secondary">
                <Calendar className="w-4 h-4 text-ink-muted shrink-0" />
                <span>{selectedBooking.date}, {selectedBooking.timeSlot}</span>
              </p>
            </div>

            {/* Financials Breakdown */}
            <div className="space-y-2 border-t border-contour-subtle pt-3">
              <p className="font-bold uppercase text-ink-primary">Escrow Settlement Breakdown</p>
              <div className="bg-canvas-secondary p-3.5 rounded-card-sm space-y-1.5">
                <div className="flex justify-between">
                  <span>Gross Client Booking Total:</span>
                  <span className="font-bold text-ink-primary">₹{selectedBooking.grossAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>SnapShoot Marketplace Commission (20%):</span>
                  <span>-₹{selectedBooking.platformFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-brand pt-1 border-t border-contour-subtle">
                  <span>Net Creator Take-Rate (80%):</span>
                  <span>₹{selectedBooking.netEarnings.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Demo code notice */}
            <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px]">
              🔒 <strong>Shoot-Start OTP for Demo:</strong> {selectedBooking.startOtp}. The client displays this 6-digit code on arrival.
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedBooking(null)}>
                Close Details
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* VERIFY START OTP MODAL */}
      {otpModalBooking && (
        <Modal
          isOpen={!!otpModalBooking}
          onClose={() => setOtpModalBooking(null)}
          title="Verify Client's Shoot-Start OTP"
          description={`Appointment with ${otpModalBooking.customerName} at ${otpModalBooking.venueAddress}`}
          maxWidth="sm"
        >
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-4 text-center">
            <KeyRound className="w-10 h-10 text-brand mx-auto" />
            <p className="text-xs text-ink-secondary">
              Ask client for the 6-digit code shown on their booking card to officially start the shoot timer:
            </p>

            <input
              type="text"
              required
              maxLength={6}
              value={enteredOtp}
              onChange={(e) => {
                setEnteredOtp(e.target.value.replace(/\D/g, ''));
                setOtpError('');
              }}
              placeholder="Enter 6-digit OTP"
              className="w-full text-center text-2xl font-mono font-bold tracking-widest bg-white border border-contour-strong rounded-card-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand text-ink-primary"
            />

            {otpError && (
              <p className="text-xs font-semibold text-red-600 text-left">
                {otpError}
              </p>
            )}

            <p className="text-[11px] text-ink-muted">
              Demo code for this booking: <span className="font-mono font-bold text-ink-primary">{otpModalBooking.startOtp}</span>
            </p>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-1/2"
                onClick={() => setOtpModalBooking(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-1/2"
                isLoading={isVerifyingOtp}
              >
                Verify & Begin
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* DECLINE CONFIRMATION MODAL */}
      {rejectingBooking && (
        <Modal
          isOpen={!!rejectingBooking}
          onClose={() => setRejectingBooking(null)}
          title="Decline Booking Request?"
          description={`Decline ${rejectingBooking.packageTitle} from ${rejectingBooking.customerName}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-ink-secondary">
              Declined bookings are released immediately so the client can select another verified photographer in your area.
            </p>

            <div className="space-y-1.5">
              <label className="font-bold uppercase text-ink-primary">Reason for Declining</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-white border border-contour-strong rounded p-2 text-xs font-medium outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="Schedule conflict with another shoot">Schedule conflict with another shoot</option>
                <option value="Venue is outside my coverage area">Venue is outside my coverage area</option>
                <option value="Equipment maintenance / repair in progress">Equipment maintenance / repair in progress</option>
                <option value="Personal emergency">Personal emergency</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setRejectingBooking(null)}>
                Keep Request
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmReject}>
                Confirm Decline
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
