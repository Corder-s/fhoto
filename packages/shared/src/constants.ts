import { PlanTier } from './enums.js';
import { SubscriptionPlanDto } from './types.js';

export const PLATFORM_COMMISSION_PERCENT_DEFAULT = 20.0;
export const GST_RATE_PERCENT = 18.0;

export const OTP_EXPIRATION_SECONDS = 300; // 5 minutes
export const OTP_MAX_ATTEMPTS = 5;

export const DEFAULT_SEARCH_RADIUS_KM = 20;
export const MAX_SEARCH_RADIUS_KM = 50;
export const MIN_SEARCH_RADIUS_KM = 5;

export const BOOKING_ACCEPTANCE_TIMEOUT_SECONDS = 600; // 10 minutes before expiration

export const CURRENCY_DEFAULT = 'INR';

export const SAAS_PLANS: SubscriptionPlanDto[] = [
  {
    id: 'plan-free',
    tier: PlanTier.FREE,
    name: 'Starter Creator',
    tagline: 'Essential presence for aspiring photographers starting on SnapShoot.',
    priceMonthlyInr: 0,
    priceAnnualInr: 0,
    maxPortfolioItems: 10,
    maxServicePackages: 2,
    hasClientCrm: false,
    hasAdvancedAnalytics: false,
    hasPriorityListing: false,
    hasCustomGalleryBranding: false,
    features: [
      'Verified photographer public profile',
      'Up to 10 portfolio showcase images',
      '2 service & pricing package tiers',
      'Standard on-demand & scheduled bookings',
      'On-site OTP attendance verification',
      'Basic marketplace search visibility',
    ],
  },
  {
    id: 'plan-pro',
    tier: PlanTier.PRO,
    name: 'Pro Studio',
    tagline: 'Advanced tools, client CRM & priority placement for active professionals.',
    priceMonthlyInr: 999,
    priceAnnualInr: 9590, // ~20% discount (₹799/mo)
    maxPortfolioItems: 50,
    maxServicePackages: 6,
    hasClientCrm: true,
    hasAdvancedAnalytics: true,
    hasPriorityListing: true,
    hasCustomGalleryBranding: false,
    isPopular: true,
    features: [
      'Everything in Starter',
      'Up to 50 high-res portfolio images',
      '6 customizable service packages',
      'Client Relationship Management (CRM)',
      'Priority marketplace search radar placement',
      'Revenue & booking performance analytics',
      'Unlimited client photo proofing galleries',
      'Priority support response within 2 hours',
    ],
  },
  {
    id: 'plan-business',
    tier: PlanTier.BUSINESS,
    name: 'Business Elite',
    tagline: 'Comprehensive operating system for established studios and production agencies.',
    priceMonthlyInr: 2499,
    priceAnnualInr: 23990, // ~20% discount (₹1999/mo)
    maxPortfolioItems: 250,
    maxServicePackages: 20,
    hasClientCrm: true,
    hasAdvancedAnalytics: true,
    hasPriorityListing: true,
    hasCustomGalleryBranding: true,
    features: [
      'Everything in Pro Studio',
      'Up to 250 portfolio showcase items & video reels',
      '20 service packages & custom quotes',
      'Custom watermark & studio-branded client galleries',
      'Multi-operator calendar synchronization',
      'Instant payout fee waiver (100% free withdrawals)',
      'Dedicated partner success manager',
      'Commercial contract & invoice export',
    ],
  },
];
