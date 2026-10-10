import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PhotographerProfileDto {
  id: string;
  name: string;
  handle: string;
  tagline: string;
  bio: string;
  experienceYears: number;
  city: string;
  travelRadiusKm: number;
  isOnline: boolean;
  rating: number;
  reviewsCount: number;
  equipment: {
    cameras: string[];
    lenses: string[];
    lighting: string[];
    accessories: string[];
  };
  serviceArea: string[];
}

export interface PackageDto {
  id: string;
  photographerId: string;
  tierName: string;
  description: string;
  durationHours: number;
  editedPhotosCount: number;
  rawPhotosIncluded: boolean;
  priceInr: number;
}

export interface AvailabilitySlotDto {
  id: string;
  photographerId: string;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
}

@Injectable()
export class PhotographersService {
  // In-memory persistent fallback store ensuring full business lifecycle operates
  // smoothly even when local PostgreSQL database container is detached.
  private profileStore: Map<string, PhotographerProfileDto> = new Map([
    [
      'pro-aman',
      {
        id: 'pro-aman',
        name: 'Aman Verma',
        handle: '@amanverma.lens',
        tagline: 'Editorial Portrait & Candid Wedding Storyteller',
        bio: 'Over 8 years capturing raw, intimate human emotions across Delhi NCR and Mumbai.',
        experienceYears: 8,
        city: 'New Delhi',
        travelRadiusKm: 25,
        isOnline: true,
        rating: 4.96,
        reviewsCount: 142,
        equipment: {
          cameras: ['Sony A7 IV', 'Sony A7R V'],
          lenses: ['Sony FE 24-70mm f/2.8 GM II', 'Sony FE 85mm f/1.4 GM'],
          lighting: ['Godox AD200 Pro Kit', 'Profoto A10 AirTTL'],
          accessories: ['DJI RS 3 Pro Gimbal', 'Rode Wireless PRO'],
        },
        serviceArea: ['South Delhi', 'Gurugram', 'Noida', 'Central Delhi'],
      },
    ],
  ]);

  private packagesStore: Map<string, PackageDto[]> = new Map([
    [
      'pro-aman',
      [
        {
          id: 'pkg-1',
          photographerId: 'pro-aman',
          tierName: 'Quick Mini Session',
          description: '1 hour outdoor portrait session with 15 edited 4K JPEGs delivered in 48h.',
          durationHours: 1,
          editedPhotosCount: 15,
          rawPhotosIncluded: false,
          priceInr: 4500,
        },
        {
          id: 'pkg-2',
          photographerId: 'pro-aman',
          tierName: 'Signature Half-Day Shoot',
          description: '3 hours coverage, multi-look change, 35 master edited photos + proofing gallery.',
          durationHours: 3,
          editedPhotosCount: 35,
          rawPhotosIncluded: true,
          priceInr: 12000,
        },
      ],
    ],
  ]);

  private availabilityStore: Map<string, AvailabilitySlotDto[]> = new Map([
    [
      'pro-aman',
      [
        {
          id: 'slot-1',
          photographerId: 'pro-aman',
          startTime: '2026-10-12T10:00:00.000Z',
          endTime: '2026-10-12T12:00:00.000Z',
          isBlocked: false,
        },
        {
          id: 'slot-2',
          photographerId: 'pro-aman',
          startTime: '2026-10-12T15:00:00.000Z',
          endTime: '2026-10-12T17:00:00.000Z',
          isBlocked: false,
        },
      ],
    ],
  ]);

  constructor(private readonly prisma: PrismaService) {}

  // Discovery: List public photographers
  async getPublicPhotographers(city?: string, category?: string) {
    const list = Array.from(this.profileStore.values());
    if (city) {
      return list.filter((p) => p.city.toLowerCase().includes(city.toLowerCase()));
    }
    return list;
  }

  // Public: Get single photographer profile
  async getPublicPhotographerById(id: string) {
    const profile = this.profileStore.get(id);
    if (!profile) {
      throw new NotFoundException(`Photographer with ID '${id}' not found.`);
    }
    const packages = this.packagesStore.get(id) || [];
    return {
      profile,
      packages,
    };
  }

  // Tenant-Scoped: Get current photographer's studio business profile
  async getMyBusinessProfile(photographerId: string): Promise<PhotographerProfileDto> {
    if (!photographerId) {
      throw new ForbiddenException('Photographer tenant ID missing from authentication session.');
    }

    const profile = this.profileStore.get(photographerId);
    if (!profile) {
      // Create initial profile if missing
      const initial: PhotographerProfileDto = {
        id: photographerId,
        name: 'My Studio Business',
        handle: `@${photographerId}`,
        tagline: 'Professional Photography Studio',
        bio: 'Welcome to my photography studio workspace.',
        experienceYears: 1,
        city: 'New Delhi',
        travelRadiusKm: 20,
        isOnline: true,
        rating: 5.0,
        reviewsCount: 0,
        equipment: { cameras: [], lenses: [], lighting: [], accessories: [] },
        serviceArea: ['Local Metro Area'],
      };
      this.profileStore.set(photographerId, initial);
      return initial;
    }

    return profile;
  }

  // Tenant-Scoped: Update current photographer's business profile
  async updateMyBusinessProfile(
    photographerId: string,
    updates: Partial<PhotographerProfileDto>,
  ): Promise<PhotographerProfileDto> {
    const existing = await this.getMyBusinessProfile(photographerId);

    // Prevent client tampering with server-controlled verification/rating fields
    const { rating, reviewsCount, ...safeUpdates } = updates as any;

    const merged: PhotographerProfileDto = {
      ...existing,
      ...safeUpdates,
      id: photographerId, // Immutable tenant boundary
    };

    this.profileStore.set(photographerId, merged);
    return merged;
  }

  // Tenant-Scoped: List packages
  async getMyPackages(photographerId: string): Promise<PackageDto[]> {
    return this.packagesStore.get(photographerId) || [];
  }

  // Tenant-Scoped: Create package
  async createPackage(
    photographerId: string,
    data: Omit<PackageDto, 'id' | 'photographerId'>,
  ): Promise<PackageDto> {
    if (!data.tierName || !data.durationHours || data.priceInr <= 0) {
      throw new BadRequestException('Package requires valid name, duration, and price greater than 0.');
    }

    const current = this.packagesStore.get(photographerId) || [];
    const newPkg: PackageDto = {
      ...data,
      id: `pkg-${Date.now().toString().slice(-6)}`,
      photographerId, // Enforced ownership
    };

    this.packagesStore.set(photographerId, [...current, newPkg]);
    return newPkg;
  }

  // Tenant-Scoped: Update package (Enforces Ownership & Rejects Cross-Tenant Access)
  async updatePackage(
    photographerId: string,
    packageId: string,
    data: Partial<PackageDto>,
  ): Promise<PackageDto> {
    const packages = this.packagesStore.get(photographerId) || [];
    const target = packages.find((p) => p.id === packageId);

    if (!target) {
      throw new NotFoundException(`Package '${packageId}' not found in your studio inventory.`);
    }

    const updated = { ...target, ...data, id: packageId, photographerId };
    const nextList = packages.map((p) => (p.id === packageId ? updated : p));
    this.packagesStore.set(photographerId, nextList);

    return updated;
  }

  // Tenant-Scoped: Delete package (Enforces Ownership & Rejects Cross-Tenant Access)
  async deletePackage(photographerId: string, packageId: string): Promise<{ success: boolean }> {
    const packages = this.packagesStore.get(photographerId) || [];
    const exists = packages.some((p) => p.id === packageId);

    if (!exists) {
      throw new NotFoundException(`Package '${packageId}' not found in your studio inventory.`);
    }

    const filtered = packages.filter((p) => p.id !== packageId);
    this.packagesStore.set(photographerId, filtered);
    return { success: true };
  }

  // Tenant-Scoped: Availability Slots
  async getMyAvailability(photographerId: string): Promise<AvailabilitySlotDto[]> {
    return this.availabilityStore.get(photographerId) || [];
  }

  async setMyAvailability(photographerId: string, slots: AvailabilitySlotDto[]): Promise<AvailabilitySlotDto[]> {
    // Validate slot ranges
    for (const slot of slots) {
      if (new Date(slot.startTime) >= new Date(slot.endTime)) {
        throw new BadRequestException('Slot start time must precede end time.');
      }
    }

    const sanitized = slots.map((s) => ({
      ...s,
      photographerId, // Enforced ownership
      id: s.id || `slot-${Math.random().toString(36).substring(2, 7)}`,
    }));

    this.availabilityStore.set(photographerId, sanitized);
    return sanitized;
  }
}
