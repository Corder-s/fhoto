import { RoleType, BookingStatus, BookingType, VerificationStatus, PaymentStatus } from './enums.js';

export interface UserDto {
  id: string;
  phoneNumber: string;
  email?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  roles: RoleType[];
  createdAt: string;
}

export interface PhotographerCardDto {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  ratingAverage: number;
  ratingCount: number;
  distanceKm?: number;
  startingPricePaise: number;
  baseCity: string;
  categories: string[];
  featuredPortfolioUrls: string[];
}

export interface ServicePackageDto {
  id: string;
  tierName: 'Basic' | 'Standard' | 'Premium';
  description: string;
  durationHours: number;
  editedPhotosCount: number;
  rawPhotosIncluded: boolean;
  pricePaise: number;
}

export interface PriceBreakdown {
  packagePricePaise: number;
  platformFeePaise: number;
  gstPaise: number;
  totalClientPayablePaise: number;
  creatorEarningPaise: number;
  commissionAmountPaise: number;
}

export interface BookingSummaryDto {
  id: string;
  bookingReference: string;
  status: BookingStatus;
  bookingType: BookingType;
  shootAddress: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  totalAmountPaise: number;
  customerName: string;
  photographerName?: string | null;
  shootStartOtp?: string; // Only exposed to authorized customer
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
