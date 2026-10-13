import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleType } from '@snapshoot/shared';
import { AuthenticatedUser } from '../common/auth.guard';
import { BookingsService } from '../bookings/bookings.service';

export interface GalleryPhotoRecord {
  id: string;
  bookingId: string;
  title: string;
  url: string;
  sizeMb: number;
  aspectRatio: string;
  deliveredAt: string;
}

@Injectable()
export class GalleriesService {
  private galleryStore: Map<string, GalleryPhotoRecord[]> = new Map([
    [
      'SNP-2026-97910',
      [
        {
          id: 'photo-1',
          bookingId: 'SNP-2026-97910',
          title: 'Sunder Nursery Sunset Golden Hour Walk',
          url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
          sizeMb: 14.2,
          aspectRatio: '16:9',
          deliveredAt: '09 Oct 2026',
        },
        {
          id: 'photo-2',
          bookingId: 'SNP-2026-97910',
          title: 'Architectural Archway Silhouette',
          url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=85',
          sizeMb: 18.5,
          aspectRatio: '4:3',
          deliveredAt: '09 Oct 2026',
        },
      ],
    ],
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
  ) {}

  // Get delivered photos for a private booking
  async getBookingGallery(bookingId: string, user: AuthenticatedUser): Promise<GalleryPhotoRecord[]> {
    // 1. Verify user has legitimate authorization to this booking
    const booking = await this.bookingsService.getBookingById(bookingId, user);
    if (!booking) {
      throw new NotFoundException(`Booking '${bookingId}' not found.`);
    }

    const isCustomer = user.customerId === booking.customerId;
    const isPhotographer = user.photographerId === booking.photographerId;
    const isAdmin = user.roles.includes(RoleType.ADMIN) || user.roles.includes(RoleType.OWNER);

    if (!isCustomer && !isPhotographer && !isAdmin) {
      throw new ForbiddenException(
        'Private gallery access denied: You are not authorized to view this shoot gallery.',
      );
    }

    return this.galleryStore.get(bookingId) || [];
  }

  // Photographer delivers photo to booking gallery
  async deliverPhotoToGallery(
    bookingId: string,
    photoData: Omit<GalleryPhotoRecord, 'id' | 'bookingId' | 'deliveredAt'>,
    user: AuthenticatedUser,
  ): Promise<GalleryPhotoRecord> {
    const booking = await this.bookingsService.getBookingById(bookingId, user);

    if (user.photographerId !== booking.photographerId && !user.roles.includes(RoleType.ADMIN)) {
      throw new ForbiddenException(
        'Only the assigned photographer can upload delivered photos to this gallery.',
      );
    }

    const current = this.galleryStore.get(bookingId) || [];
    const newPhoto: GalleryPhotoRecord = {
      ...photoData,
      id: `photo-${Date.now().toString().slice(-6)}`,
      bookingId,
      deliveredAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    this.galleryStore.set(bookingId, [...current, newPhoto]);
    return newPhoto;
  }
}
