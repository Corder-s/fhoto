import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleType } from '@snapshoot/shared';
import { AuthenticatedUser } from '../common/auth.guard';

export interface BookingRecord {
  id: string;
  bookingReference: string;
  customerId: string;
  customerName: string;
  photographerId: string;
  photographerName: string;
  category: string;
  packageTitle: string;
  shootDate: string;
  timeSlot: string;
  venueAddress: string;
  totalAmountInr: number;
  status: 'CONFIRMED' | 'ON_THE_WAY' | 'ARRIVED_AT_VENUE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PAID_ESCROW' | 'RELEASED' | 'REFUNDED';
  shootStartOtp: string; // Plaintext OTP stored securely
  deliveredPhotosCount?: number;
  createdAt: string;
}

@Injectable()
export class BookingsService {
  private bookingsStore: Map<string, BookingRecord> = new Map([
    [
      'SNP-2026-98042',
      {
        id: 'SNP-2026-98042',
        bookingReference: 'SNP-2026-98042',
        customerId: 'cust-001',
        customerName: 'Aman Sharma',
        photographerId: 'pro-aman',
        photographerName: 'Aman Verma',
        category: 'PORTRAIT',
        packageTitle: 'Signature Portrait Session',
        shootDate: 'Today, 11 Oct 2026',
        timeSlot: '04:00 PM – 06:00 PM',
        venueAddress: 'Lodhi Art District & Lodhi Gardens, New Delhi',
        totalAmountInr: 4500,
        status: 'ARRIVED_AT_VENUE',
        paymentStatus: 'PAID_ESCROW',
        shootStartOtp: '482910',
        deliveredPhotosCount: 0,
        createdAt: '2026-10-10T14:00:00.000Z',
      },
    ],
    [
      'SNP-2026-97910',
      {
        id: 'SNP-2026-97910',
        bookingReference: 'SNP-2026-97910',
        customerId: 'cust-002', // Different customer!
        customerName: 'Priya Sundaram',
        photographerId: 'pro-aman',
        photographerName: 'Aman Verma',
        category: 'COUPLE',
        packageTitle: 'Anniversary Outdoor Shoot',
        shootDate: '08 Oct 2026',
        timeSlot: '05:00 PM – 07:00 PM',
        venueAddress: 'Sunder Nursery, Heritage Park, Nizamuddin, New Delhi',
        totalAmountInr: 12000,
        status: 'COMPLETED',
        paymentStatus: 'RELEASED',
        shootStartOtp: '193847',
        deliveredPhotosCount: 35,
        createdAt: '2026-10-05T11:30:00.000Z',
      },
    ],
  ]);

  constructor(private readonly prisma: PrismaService) {}

  // List bookings authorized for current user
  async getMyBookings(user: AuthenticatedUser): Promise<BookingRecord[]> {
    const all = Array.from(this.bookingsStore.values());

    if (user.roles.includes(RoleType.ADMIN) || user.roles.includes(RoleType.OWNER)) {
      return all;
    }

    if (user.photographerId) {
      return all.filter((b) => b.photographerId === user.photographerId);
    }

    if (user.customerId) {
      return all.filter((b) => b.customerId === user.customerId);
    }

    return [];
  }

  // Get single booking with strict authorization & OTP masking
  async getBookingById(bookingId: string, user: AuthenticatedUser): Promise<BookingRecord> {
    const booking = this.bookingsStore.get(bookingId);
    if (!booking) {
      throw new NotFoundException(`Booking with reference '${bookingId}' not found.`);
    }

    // Authorization check
    const isOwner = user.roles.includes(RoleType.OWNER);
    const isAdmin = user.roles.includes(RoleType.ADMIN);
    const isCustomer = user.customerId === booking.customerId;
    const isPhotographer = user.photographerId === booking.photographerId;

    if (!isOwner && !isAdmin && !isCustomer && !isPhotographer) {
      throw new ForbiddenException(
        'Access denied: You are not authorized to view this private booking.',
      );
    }

    // CRITICAL SECURITY RULE:
    // OTP is strictly visible to the customer who booked it.
    // Photographers receive masked OTP until customer shares it on venue arrival.
    if (!isCustomer && !isAdmin && !isOwner) {
      return {
        ...booking,
        shootStartOtp: '••••••', // Masked from photographer
      };
    }

    return booking;
  }

  // Verify venue arrival OTP (Photographer action)
  async verifyArrivalOtp(
    bookingId: string,
    otpEntered: string,
    user: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string; booking: BookingRecord }> {
    const booking = this.bookingsStore.get(bookingId);
    if (!booking) {
      throw new NotFoundException(`Booking '${bookingId}' not found.`);
    }

    if (user.photographerId !== booking.photographerId && !user.roles.includes(RoleType.ADMIN)) {
      throw new ForbiddenException('Only the assigned photographer can verify arrival OTP.');
    }

    if (booking.status !== 'ARRIVED_AT_VENUE' && booking.status !== 'ON_THE_WAY') {
      throw new BadRequestException(
        `Cannot verify OTP for booking currently in '${booking.status}' state.`,
      );
    }

    if (otpEntered !== booking.shootStartOtp) {
      throw new BadRequestException('Invalid 6-digit start OTP. Please verify with client.');
    }

    // Transition to IN_PROGRESS
    const updated: BookingRecord = {
      ...booking,
      status: 'IN_PROGRESS',
    };
    this.bookingsStore.set(bookingId, updated);

    return {
      success: true,
      message: 'OTP verified successfully. Shoot officially started!',
      booking: updated,
    };
  }

  // Cancel booking (Customer or Photographer action)
  async cancelBooking(
    bookingId: string,
    reason: string,
    user: AuthenticatedUser,
  ): Promise<{ success: boolean; booking: BookingRecord }> {
    const booking = this.bookingsStore.get(bookingId);
    if (!booking) {
      throw new NotFoundException(`Booking '${bookingId}' not found.`);
    }

    const isCustomer = user.customerId === booking.customerId;
    const isPhotographer = user.photographerId === booking.photographerId;
    const isAdmin = user.roles.includes(RoleType.ADMIN) || user.roles.includes(RoleType.OWNER);

    if (!isCustomer && !isPhotographer && !isAdmin) {
      throw new ForbiddenException('Not authorized to cancel this booking.');
    }

    if (booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel a shoot that is already in progress or completed.');
    }

    const updated: BookingRecord = {
      ...booking,
      status: 'CANCELLED',
      paymentStatus: 'REFUNDED',
    };
    this.bookingsStore.set(bookingId, updated);

    return { success: true, booking: updated };
  }
}
