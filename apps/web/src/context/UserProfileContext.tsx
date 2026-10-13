'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, AuthUser, saveAuthSession } from '../lib/auth';

export interface UserDbProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  account_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatorDbProfile {
  id: string;
  user_id: string;
  professional_name: string;
  biography?: string | null;
  experience_years: number;
  city: string;
  state: string;
  service_radius: number;
  portfolio_url?: string | null;
  verification_status: 'unsubmitted' | 'pending' | 'approved' | 'rejected';
  average_rating: number;
  total_reviews: number;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileDashboardStats {
  totalBookings: number;
  newRequests: number;
  upcomingShoots: number;
  monthEarnings: number;
  totalReviews: number;
  averageRating: number;
  profileViews: number;
}

export interface UpdateProfileParams {
  profileData?: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string | null;
  };
  creatorData?: {
    professionalName?: string;
    biography?: string;
    experienceYears?: number;
    city?: string;
    state?: string;
    serviceRadius?: number;
    portfolioUrl?: string | null;
  };
}

interface UserProfileContextValue {
  authUser: AuthUser | null;
  profile: UserDbProfile | null;
  creatorProfile: CreatorDbProfile | null;
  role: 'customer' | 'creator' | 'admin';
  isCreator: boolean;
  isCustomer: boolean;
  stats: ProfileDashboardStats;
  loading: boolean;
  error: string | null;
  accountName: string;
  professionalName: string;
  displayAvatar: string | null;
  initials: string;
  refreshProfile: () => Promise<void>;
  updateProfile: (params: UpdateProfileParams) => Promise<{ success: boolean; error?: string }>;
}

const defaultStats: ProfileDashboardStats = {
  totalBookings: 0,
  newRequests: 0,
  upcomingShoots: 0,
  monthEarnings: 0,
  totalReviews: 0,
  averageRating: 5.0,
  profileViews: 0,
};

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

function computeInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, isMounted } = useAuth();
  const [userRole, setUserRole] = useState<'customer' | 'creator' | 'admin'>('customer');
  const [profile, setProfile] = useState<UserDbProfile | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorDbProfile | null>(null);
  const [stats, setStats] = useState<ProfileDashboardStats>(defaultStats);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Request ID tracker to prevent stale async responses
  const activeFetchIdRef = useRef<number>(0);

  const fetchProfileData = useCallback(async (userId: string) => {
    const currentFetchId = ++activeFetchIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/profile/me?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();

      // Check if another request was launched in the meantime
      if (currentFetchId !== activeFetchIdRef.current) return;

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load user profile from database.');
      }

      setProfile(data.profile || null);
      setCreatorProfile(data.creatorProfile || null);
      const resolvedRole: 'customer' | 'creator' | 'admin' = data.role
        ? data.role
        : data.creatorProfile
        ? 'creator'
        : 'customer';

      setUserRole(resolvedRole);

      if (authUser && authUser.role !== resolvedRole) {
        saveAuthSession({ ...authUser, role: resolvedRole });
      }
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err: any) {
      if (currentFetchId !== activeFetchIdRef.current) return;
      console.error('Error in UserProfileProvider fetchProfileData:', err);
      setError(err.message || 'Error syncing profile.');
    } finally {
      if (currentFetchId === activeFetchIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Sync on auth user change
  useEffect(() => {
    if (!isMounted) return;

    if (!authUser?.id) {
      // User is logged out: reset all account-specific state
      activeFetchIdRef.current++;
      setProfile(null);
      setCreatorProfile(null);
      setStats(defaultStats);
      setLoading(false);
      setError(null);
      return;
    }

    fetchProfileData(authUser.id);
  }, [authUser?.id, isMounted, fetchProfileData]);

  // Listen to profile update broadcast events across windows/tabs
  useEffect(() => {
    const handleProfileChange = () => {
      if (authUser?.id) {
        fetchProfileData(authUser.id);
      }
    };

    window.addEventListener('snapshoot:profile-change', handleProfileChange);
    return () => {
      window.removeEventListener('snapshoot:profile-change', handleProfileChange);
    };
  }, [authUser?.id, fetchProfileData]);

  const refreshProfile = useCallback(async () => {
    if (authUser?.id) {
      await fetchProfileData(authUser.id);
    }
  }, [authUser?.id, fetchProfileData]);

  const updateProfile = useCallback(
    async (params: UpdateProfileParams): Promise<{ success: boolean; error?: string }> => {
      if (!authUser?.id) {
        return { success: false, error: 'User is not authenticated' };
      }

      try {
        setError(null);
        const res = await fetch('/api/profile/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: authUser.id,
            profileData: params.profileData,
            creatorData: params.creatorData,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to update profile in database.');
        }

        // Apply immediate updates to local state
        if (data.profile) {
          setProfile(data.profile);
        }
        if (data.creatorProfile) {
          setCreatorProfile(data.creatorProfile);
        }

        // Sync auth session if full_name or avatar changed
        if (params.profileData) {
          const updatedAuthUser: AuthUser = {
            ...authUser,
            name: params.profileData.fullName || authUser.name,
            phone: params.profileData.phone || authUser.phone,
            avatarUrl:
              params.profileData.avatarUrl !== undefined
                ? (params.profileData.avatarUrl || undefined)
                : authUser.avatarUrl,
          };
          saveAuthSession(updatedAuthUser);
        }

        // Broadcast change event
        window.dispatchEvent(new Event('snapshoot:profile-change'));

        return { success: true };
      } catch (err: any) {
        console.error('Error in UserProfileProvider updateProfile:', err);
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [authUser]
  );

  // Policy-compliant display selectors:
  // Account name: authentic profile full_name, fallback to authUser.name, fallback to 'Creator' (never mock names!)
  const accountName = profile?.full_name || authUser?.name || (authUser?.email ? authUser.email.split('@')[0] : 'Creator');

  // Professional name for public creator context: creator_profiles.professional_name if set, else accountName
  const professionalName = creatorProfile?.professional_name || accountName;

  // Avatar: profile avatar_url or auth avatar, or null
  const displayAvatar = profile?.avatar_url || authUser?.avatarUrl || null;

  const initials = computeInitials(accountName);
  const isCreator = userRole === 'creator';
  const isCustomer = userRole === 'customer';

  return (
    <UserProfileContext.Provider
      value={{
        authUser,
        profile,
        creatorProfile,
        role: userRole,
        isCreator,
        isCustomer,
        stats,
        loading,
        error,
        accountName,
        professionalName,
        displayAvatar,
        initials,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};

export function useCurrentUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useCurrentUserProfile must be used within a UserProfileProvider');
  }
  return context;
}
