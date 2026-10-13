import { INITIAL_CUSTOMER_PROFILE, CustomerProfile } from '../data/customerDashboardData';
import { INITIAL_PHOTOGRAPHER_PROFILE, PhotographerProfile } from '../data/photographerDashboardData';
import { getSupabaseBrowserClient } from './supabase/client';
import { AuthUser, saveAuthSession } from './auth';

export interface SavedLocation {
  id: string;
  label: string; // e.g. "Home Studio", "South Delhi Venue", "DLF Cyber Hub"
  address: string;
  city: string;
  isDefault?: boolean;
  instructions?: string;
}

export interface CustomerPreferences {
  profile: CustomerProfile & {
    firstName: string;
    lastName: string;
    displayName: string;
    handle: string;
    tagline: string;
    dob: string;
    gender: string;
    phoneCountryCode: string;
    preferredLanguage: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    accountStatus: string;
    accountType: string;
    userId: string;
    lastLogin: string;
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

export function createEmptyCustomerPreferences(user?: AuthUser | null): CustomerPreferences {
  const email = user?.email || '';
  const fullName = user?.name || (email ? email.split('@')[0] : '');
  const parts = fullName.trim().split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  const initialId = user?.id ? `#${user.id.slice(0, 8).toUpperCase()}` : '';

  return {
    profile: {
      ...INITIAL_CUSTOMER_PROFILE,
      id: user?.id || '',
      name: fullName,
      firstName,
      lastName,
      displayName: fullName,
      handle: email ? `@${email.split('@')[0]}` : '',
      tagline: '',
      email,
      phone: user?.phone || '',
      phoneCountryCode: '+91',
      dob: '',
      gender: '',
      city: '',
      preferredLanguage: 'English',
      emailVerified: Boolean(user?.email),
      phoneVerified: Boolean(user?.phone),
      avatar: user?.avatarUrl || '',
      accountStatus: 'Active',
      accountType: 'Customer',
      userId: initialId,
      memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      lastLogin: 'Active session',
    },
    savedLocations: [],
    bookingPreferences: {
      preferredGenres: [],
      shootStyle: 'natural',
      bringOwnProps: false,
      receiveRawPreviews: false,
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
      twoFactorEnabled: false,
      lastPasswordChange: 'Recently',
      activeSessions: [
        {
          id: 'sess-current',
          device: typeof window !== 'undefined' && window.navigator?.userAgent?.includes('Windows')
            ? 'Windows PC'
            : typeof window !== 'undefined' && window.navigator?.userAgent?.includes('Mac')
            ? 'Mac'
            : 'Web Browser',
          browser: typeof window !== 'undefined' && window.navigator?.userAgent?.includes('Chrome')
            ? 'Chrome'
            : typeof window !== 'undefined' && window.navigator?.userAgent?.includes('Safari')
            ? 'Safari'
            : 'Browser',
          location: 'Current Device',
          ipMasked: 'Session Active',
          lastActive: 'Active now',
          isCurrent: true,
        },
      ],
    },
  };
}

export const DEFAULT_CUSTOMER_PREFERENCES: CustomerPreferences = createEmptyCustomerPreferences(null);

export function createEmptyPhotographerPreferences(
  user?: AuthUser | null,
  creator?: any | null
): PhotographerPreferences {
  const name = creator?.professional_name || user?.name || (user?.email ? user.email.split('@')[0] : 'Creator');
  const email = user?.email || '';
  const city = creator?.city || 'Delhi NCR';

  return {
    profile: {
      id: user?.id || 'creator',
      name,
      handle: `@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      email,
      phone: user?.phone || '',
      city,
      serviceArea: [city, 'Delhi NCR'],
      avatar: user?.avatarUrl || '',
      bio: creator?.biography || 'Professional visual storyteller documenting portraits, events, and commercial campaigns.',
      experienceYears: creator?.experience_years || 2,
      rating: creator?.average_rating ? Number(creator?.average_rating) : 5.0,
      reviewCount: creator?.total_reviews || 0,
      completedShoots: 0,
      verificationStatus: creator?.verification_status || 'unsubmitted',
      profileCompletion: 80,
      equipment: {
        cameras: ['Dual Slot Mirrorless Camera'],
        lenses: ['24-70mm f/2.8 Standard Zoom', '85mm f/1.4 Portrait Prime'],
        lighting: ['Portable Strobe & Softbox'],
        accessories: ['Carbon Fiber Tripod', 'Wireless Mic System']
      },
      languages: ['English', 'Hindi'],
      tagline: 'Natural light & portrait specialist',
      travelRadiusKm: creator?.service_radius || 25,
      additionalCities: ['Delhi NCR'],
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
      upiIdMasked: '',
      bankAccountMasked: '',
      bankName: '',
      ifscMasked: '',
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
}

export const DEFAULT_PHOTOGRAPHER_PREFERENCES: PhotographerPreferences = createEmptyPhotographerPreferences(null, null);

/**
 * Synchronous local retrieval with auto-purge of old dummy data
 */
export function getCustomerPreferences(user?: AuthUser | null): CustomerPreferences {
  const base = createEmptyCustomerPreferences(user);
  if (typeof window === 'undefined') return base;

  try {
    const key = user?.id ? `${CUSTOMER_SETTINGS_KEY}_${user.id}` : CUSTOMER_SETTINGS_KEY;
    const raw = localStorage.getItem(key) || localStorage.getItem(CUSTOMER_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Auto-purge old dummy 'Priya Sharma' profile cache
      if (
        parsed?.profile?.email === 'priya.sharma@example.com' ||
        parsed?.profile?.name === 'Priya Sharma' ||
        parsed?.profile?.userId === '#USR102938'
      ) {
        localStorage.removeItem(key);
        localStorage.removeItem(CUSTOMER_SETTINGS_KEY);
        return base;
      }
      return {
        ...base,
        ...parsed,
        profile: {
          ...base.profile,
          ...(parsed.profile || {}),
        },
      };
    }
  } catch (err) {
    console.error('Error loading customer settings:', err);
  }
  return base;
}

export function saveCustomerPreferences(prefs: CustomerPreferences, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = userId ? `${CUSTOMER_SETTINGS_KEY}_${userId}` : CUSTOMER_SETTINGS_KEY;
    localStorage.setItem(key, JSON.stringify(prefs));
    localStorage.setItem(CUSTOMER_SETTINGS_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Error saving customer settings:', err);
  }
}

/**
 * Fetch and sync customer settings from Supabase
 */
export async function fetchCustomerPreferencesFromSupabase(
  user?: AuthUser | null
): Promise<CustomerPreferences> {
  const base = createEmptyCustomerPreferences(user);
  if (!user?.id) return base;

  const cacheKey = `${CUSTOMER_SETTINGS_KEY}_${user.id}`;
  let localData: Partial<CustomerPreferences> | null = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed?.profile?.email !== 'priya.sharma@example.com' &&
          parsed?.profile?.name !== 'Priya Sharma'
        ) {
          localData = parsed;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (e) {
      console.warn('Error reading local customer settings cache:', e);
    }
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    if (localData) {
      return { ...base, ...localData, profile: { ...base.profile, ...(localData.profile || {}) } };
    }
    return base;
  }

  try {
    // 1. Fetch profile row from public.profiles table
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // 2. Fetch auth user metadata
    const { data: { user: authUserRecord } } = await supabase.auth.getUser();
    const meta = authUserRecord?.user_metadata || {};

    const fullName =
      profileRow?.full_name ||
      meta.full_name ||
      meta.name ||
      user.name ||
      base.profile.name;
    const parts = fullName.trim().split(' ');
    const firstName = meta.first_name || parts[0] || base.profile.firstName;
    const lastName = meta.last_name || parts.slice(1).join(' ') || base.profile.lastName;

    const merged: CustomerPreferences = {
      ...base,
      ...(localData || {}),
      profile: {
        ...base.profile,
        ...(localData?.profile || {}),
        id: user.id,
        name: fullName,
        firstName,
        lastName,
        displayName: meta.displayName || fullName,
        handle: meta.handle || (user.email ? `@${user.email.split('@')[0]}` : base.profile.handle),
        tagline: meta.tagline || (localData?.profile?.tagline ?? ''),
        email: profileRow?.email || user.email || base.profile.email,
        phone: profileRow?.phone_number || meta.phone || user.phone || base.profile.phone,
        dob: meta.dob || (localData?.profile?.dob ?? ''),
        gender: meta.gender || (localData?.profile?.gender ?? ''),
        city: meta.city || (localData?.profile?.city ?? ''),
        preferredLanguage: meta.preferred_language || (localData?.profile?.preferredLanguage ?? 'English'),
        avatar: profileRow?.avatar_url || meta.avatar_url || user.avatarUrl || base.profile.avatar,
        accountStatus: profileRow?.account_status || 'Active',
        userId: `#${user.id.slice(0, 8).toUpperCase()}`,
        memberSince: profileRow?.created_at
          ? new Date(profileRow.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : base.profile.memberSince,
        emailVerified: Boolean(profileRow?.email_verified_at || authUserRecord?.email_confirmed_at || user.email),
        phoneVerified: Boolean(profileRow?.phone_verified_at || authUserRecord?.phone_confirmed_at || user.phone),
      },
      savedLocations: Array.isArray(meta.saved_locations)
        ? meta.saved_locations
        : (localData?.savedLocations || []),
      bookingPreferences: {
        ...base.bookingPreferences,
        ...(meta.booking_preferences || {}),
        ...(localData?.bookingPreferences || {}),
      },
      notifications: {
        ...base.notifications,
        ...(meta.notifications || {}),
        ...(localData?.notifications || {}),
      },
      privacy: {
        ...base.privacy,
        ...(meta.privacy || {}),
        ...(localData?.privacy || {}),
      },
      security: {
        ...base.security,
        ...(meta.security || {}),
        ...(localData?.security || {}),
      },
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(merged));
      } catch {}
    }

    return merged;
  } catch (err) {
    console.error('Error fetching customer settings from Supabase:', err);
    if (localData) {
      return { ...base, ...localData, profile: { ...base.profile, ...(localData.profile || {}) } };
    }
    return base;
  }
}

/**
 * Persist updated customer settings to Supabase
 */
export async function saveCustomerPreferencesToSupabase(
  userId: string,
  prefs: CustomerPreferences
): Promise<{ success: boolean; error?: string }> {
  // Always update local cache immediately
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${CUSTOMER_SETTINGS_KEY}_${userId}`, JSON.stringify(prefs));
      localStorage.setItem(CUSTOMER_SETTINGS_KEY, JSON.stringify(prefs));
    } catch {}
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { success: true };
  }

  try {
    const fullName =
      prefs.profile.displayName ||
      `${prefs.profile.firstName || ''} ${prefs.profile.lastName || ''}`.trim() ||
      prefs.profile.name;

    // 1. Upsert into public.profiles table
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: userId,
        full_name: fullName,
        email: prefs.profile.email,
        phone_number: prefs.profile.phone || null,
        avatar_url: prefs.profile.avatar || null,
        // account_status is platform-owned (admin/suspension). It is intentionally not written from the client.
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      console.warn('Supabase profiles table upsert error:', profileError.message);
    }

    // 2. Update user_metadata in Supabase Auth
    const { error: metaError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        first_name: prefs.profile.firstName,
        last_name: prefs.profile.lastName,
        displayName: prefs.profile.displayName,
        handle: prefs.profile.handle,
        tagline: prefs.profile.tagline,
        phone: prefs.profile.phone,
        avatar_url: prefs.profile.avatar,
        dob: prefs.profile.dob,
        gender: prefs.profile.gender,
        city: prefs.profile.city,
        preferred_language: prefs.profile.preferredLanguage,
        saved_locations: prefs.savedLocations,
        booking_preferences: prefs.bookingPreferences,
        notifications: prefs.notifications,
        privacy: prefs.privacy,
        security: {
          twoFactorEnabled: prefs.security.twoFactorEnabled,
          lastPasswordChange: prefs.security.lastPasswordChange,
        },
      },
    });

    if (metaError) {
      console.warn('Supabase updateUser metadata error:', metaError.message);
    }

    // 3. Keep local auth session in sync
    saveAuthSession({
      id: userId,
      name: fullName,
      email: prefs.profile.email,
      phone: prefs.profile.phone,
      avatarUrl: prefs.profile.avatar,
      role: 'customer',
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error saving customer preferences to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to sync with Supabase.' };
  }
}

export function getPhotographerPreferences(user?: AuthUser | null, creator?: any | null): PhotographerPreferences {
  const base = createEmptyPhotographerPreferences(user, creator);
  if (typeof window === 'undefined') return base;
  try {
    const key = user?.id ? `${PHOTOGRAPHER_SETTINGS_KEY}_${user.id}` : PHOTOGRAPHER_SETTINGS_KEY;
    const raw = localStorage.getItem(key) || localStorage.getItem(PHOTOGRAPHER_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Auto-purge old hardcoded dummy Aman Sharma profile data
      if (
        parsed?.profile?.email === 'aman.sharma@snapshoot.in' ||
        parsed?.profile?.name === 'Aman Sharma' ||
        parsed?.profile?.id === 'pro-aman'
      ) {
        localStorage.removeItem(key);
        localStorage.removeItem(PHOTOGRAPHER_SETTINGS_KEY);
        return base;
      }
      return {
        ...base,
        ...parsed,
        profile: {
          ...base.profile,
          ...(parsed.profile || {}),
        },
      };
    }
  } catch (err) {
    console.error('Error loading photographer settings:', err);
  }
  return base;
}

export function savePhotographerPreferences(prefs: PhotographerPreferences, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = userId ? `${PHOTOGRAPHER_SETTINGS_KEY}_${userId}` : PHOTOGRAPHER_SETTINGS_KEY;
    localStorage.setItem(key, JSON.stringify(prefs));
    localStorage.setItem(PHOTOGRAPHER_SETTINGS_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Error saving photographer settings:', err);
  }
}
