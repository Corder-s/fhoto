import {
  RoleType,
  BookingStatus,
  BookingType,
  VerificationStatus,
  PaymentStatus,
  PlanTier,
  SubscriptionStatus,
  BillingInterval,
  ClientStatus,
  StudioRole
} from './enums.js';

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

export interface SubscriptionPlanDto {
  id: string;
  tier: PlanTier;
  name: string;
  tagline: string;
  priceMonthlyInr: number;
  priceAnnualInr: number;
  maxPortfolioItems: number;
  maxServicePackages: number;
  hasClientCrm: boolean;
  hasAdvancedAnalytics: boolean;
  hasPriorityListing: boolean;
  hasCustomGalleryBranding: boolean;
  features: string[];
  isPopular?: boolean;
}

export interface PhotographerSubscriptionDto {
  id: string;
  photographerId: string;
  planId: string;
  tier: PlanTier;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface PhotographerClientDto {
  id: string;
  photographerId: string;
  name: string;
  email?: string | null;
  phone: string;
  totalShoots: number;
  totalSpentInr: number;
  lastShootDate?: string | null;
  notes?: string | null;
  status: ClientStatus | 'ACTIVE' | 'COMPLETED' | 'VIP';
  createdAt: string;
}

export interface StudioMemberDto {
  id: string;
  photographerId: string;
  userId: string;
  role: StudioRole;
  isActive: boolean;
  createdAt: string;
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
