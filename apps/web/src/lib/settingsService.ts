/**
 * SNAPSHOOT SETTINGS SERVICE
 * Handles typed data access, client-side persistence (localStorage),
 * and separation of frontend state from production backend API endpoints.
 */

import { INITIAL_CUSTOMER_PROFILE, CustomerProfile } from '../data/customerDashboardData';
import { INITIAL_PHOTOGRAPHER_PROFILE, PhotographerProfile } from '../data/photographerDashboardData';

export interface SavedLocation {
  id: string;
  label: string; // e.g. "Home Studio", "Lodhi Art District", "Cyber Hub Office"
  address: string;
  city: string;
  isDefault?: boolean;
  instructions?: string;
}

export interface CustomerPreferences {
  profile: CustomerProfile & {
    displayName: string;
    preferredLanguage: string;
    emailVerified: boolean;
    phoneVerified: boolean;
  };
  savedLocations: SavedLocation[];
  bookingPreferences: {
    preferredGenres: string[];
    shootStyle: 'natural' | 'studio' | 'candid' | 'editorial';
    bringOwnProps: boolean;
    receiveRawPreviews: boolean;
  };
  notifications: {
    smsMilestones: boolean;
    whatsappTransit: boolean;
    emailReceipts: boolean;
    galleryReadyAlerts: boolean;
    promotionalOffers: boolean;
  };
  privacy: {
    maskPhoneUntilConfirmed: boolean;
    privateGalleries: boolean;
    allowUsageInCreatorPortfolios: boolean;
    analyticsConsent: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange: string;
    activeSessions: Array<{
      id: string;
      device: string;
      browser: string;
      location: string;
      ipMasked: string;
      lastActive: string;
      isCurrent: boolean;
    }>;
  };
}

export interface PhotographerPreferences {
  profile: PhotographerProfile & {
    tagline: string;
    travelRadiusKm: number;
    additionalCities: string[];
  };
  bookingRules: {
    instantRadarEnabled: boolean;
    autoAcceptInstant: boolean;
    minAdvanceNoticeHours: number;
    maxDailyShoots: number;
    bufferMinutesBetweenShoots: number;
    vacationMode: boolean;
  };
  payoutDetails: {
    payoutMethod: 'UPI' | 'NEFT';
    upiIdMasked: string;
    bankAccountMasked: string;
    bankName: string;
    ifscMasked: string;
    autoWithdrawalCycle: 'WEEKLY_TUESDAY' | 'ON_DEMAND';
  };
  notifications: {
    smsImmediateAlerts: boolean;
    whatsappBookings: boolean;
    emailReceipts: boolean;
    payoutConfirmations: boolean;
    marketingUpdates: boolean;
  };
  privacy: {
    showInPublicDirectory: boolean;
    maskPhoneUntilAccepted: boolean;
    autoWatermarkGalleries: boolean;
  };
}

const CUSTOMER_SETTINGS_KEY = 'snapshoot_customer_settings';
const PHOTOGRAPHER_SETTINGS_KEY = 'snapshoot_photographer_settings';

export const DEFAULT_CUSTOMER_PREFERENCES: CustomerPreferences = {
  profile: {
    ...INITIAL_CUSTOMER_PROFILE,
    displayName: 'Aarav S.',
    preferredLanguage: 'English (India)',
    emailVerified: true,
    phoneVerified: true,
  },
  savedLocations: [
    {
      id: 'loc-1',
      label: 'Home Terrace Studio',
      address: 'B-4/12, Hauz Khas Enclave, New Delhi 110016',
      city: 'New Delhi',
      isDefault: true,
      instructions: 'Ring doorbell 2B. Elevator available to 3rd floor, stairs to open terrace.',
    },
    {
      id: 'loc-2',
      label: 'Lodhi Art District (Outdoor)',
      address: 'Block 14, Near Khanna Market, Lodhi Colony, New Delhi 110003',
      city: 'New Delhi',
      instructions: 'Meet near the mural intersection. Ample street parking available.',
    },
    {
      id: 'loc-3',
      label: 'Cyber City Office Lounge',
      address: 'Building 10C, DLF Cyber City, Gurugram, Haryana 122002',
      city: 'Gurugram',
      instructions: 'Visitor pass required at tower lobby with government ID.',
    },
  ],
  bookingPreferences: {
    preferredGenres: ['Portraits', 'Events', 'Reels'],
    shootStyle: 'editorial',
    bringOwnProps: false,
    receiveRawPreviews: true,
  },
  notifications: {
    smsMilestones: true,
    whatsappTransit: true,
    emailReceipts: true,
    galleryReadyAlerts: true,
    promotionalOffers: false,
  },
  privacy: {
    maskPhoneUntilConfirmed: true,
    privateGalleries: true,
    allowUsageInCreatorPortfolios: true,
    analyticsConsent: true,
  },
  security: {
    twoFactorEnabled: true,
    lastPasswordChange: '15 September 2026',
    activeSessions: [
      {
        id: 'sess-1',
        device: 'Windows 11 PC',
        browser: 'Chrome 129',
        location: 'New Delhi, India',
        ipMasked: '103.212.***.***',
        lastActive: 'Active now',
        isCurrent: true,
      },
      {
        id: 'sess-2',
        device: 'Apple iPhone 15 Pro',
        browser: 'Mobile Safari 18',
        location: 'New Delhi, India',
        ipMasked: '103.212.***.***',
        lastActive: '3 hours ago',
        isCurrent: false,
      },
    ],
  },
};

export const DEFAULT_PHOTOGRAPHER_PREFERENCES: PhotographerPreferences = {
  profile: {
    ...INITIAL_PHOTOGRAPHER_PROFILE,
    tagline: 'Natural light & outdoor editorial specialist in Delhi NCR',
    travelRadiusKm: 25,
    additionalCities: ['Noida', 'Gurugram', 'Greater Noida'],
  },
  bookingRules: {
    instantRadarEnabled: true,
    autoAcceptInstant: false,
    minAdvanceNoticeHours: 12,
    maxDailyShoots: 3,
    bufferMinutesBetweenShoots: 60,
    vacationMode: false,
  },
  payoutDetails: {
    payoutMethod: 'UPI',
    upiIdMasked: 'rahul.verma****@okhdfcbank',
    bankAccountMasked: 'HDFC Bank ••••••4819',
    bankName: 'HDFC Bank Ltd, Connaught Place',
    ifscMasked: 'HDFC0000***',
    autoWithdrawalCycle: 'WEEKLY_TUESDAY',
  },
  notifications: {
    smsImmediateAlerts: true,
    whatsappBookings: true,
    emailReceipts: true,
    payoutConfirmations: true,
    marketingUpdates: false,
  },
  privacy: {
    showInPublicDirectory: true,
    maskPhoneUntilAccepted: true,
    autoWatermarkGalleries: true,
  },
};

export function getCustomerPreferences(): CustomerPreferences {
  if (typeof window === 'undefined') return DEFAULT_CUSTOMER_PREFERENCES;
  try {
    const raw = localStorage.getItem(CUSTOMER_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading customer settings:', err);
  }
  return DEFAULT_CUSTOMER_PREFERENCES;
}

export function saveCustomerPreferences(prefs: CustomerPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOMER_SETTINGS_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Error saving customer settings:', err);
  }
}

export function getPhotographerPreferences(): PhotographerPreferences {
  if (typeof window === 'undefined') return DEFAULT_PHOTOGRAPHER_PREFERENCES;
  try {
    const raw = localStorage.getItem(PHOTOGRAPHER_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading photographer settings:', err);
  }
  return DEFAULT_PHOTOGRAPHER_PREFERENCES;
}

export function savePhotographerPreferences(prefs: PhotographerPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PHOTOGRAPHER_SETTINGS_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Error saving photographer settings:', err);
  }
}
