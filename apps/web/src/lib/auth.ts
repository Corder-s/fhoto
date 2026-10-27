'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from './supabase/client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'creator' | 'photographer' | 'admin' | 'owner';
  phone?: string;
  avatarUrl?: string;
  roleSelected?: boolean;
}

const STORAGE_KEY = 'snapshoot_session';
const COOKIE_NAME = 'snapshoot_session';

// ============================================================================
// SINGLETON AUTH STORE
// Eliminates duplicate Supabase getSession calls and listener proliferation
// across all 30+ components that call useAuth().
// ============================================================================

let cachedUser: AuthUser | null = null;
let isCacheLoaded = false;
let isGlobalSubscriptionInitialized = false;
const authSubscribers = new Set<() => void>();

function getOrLoadCachedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  if (!isCacheLoaded) {
    cachedUser = getStoredSession();
    isCacheLoaded = true;
  }
  return cachedUser;
}

function notifyAuthSubscribers(newUser: AuthUser | null): void {
  cachedUser = newUser;
  isCacheLoaded = true;
  authSubscribers.forEach((subscriber) => {
    try {
      subscriber();
    } catch (err) {
      console.error('Error in auth subscriber callback:', err);
    }
  });
}

function initGlobalAuthSubscription(): void {
  if (typeof window === 'undefined' || isGlobalSubscriptionInitialized) return;
  isGlobalSubscriptionInitialized = true;

  // Window event listeners for cross-tab or external changes
  const handleAuthChange = () => {
    const updated = getStoredSession();
    notifyAuthSubscribers(updated);
  };

  window.addEventListener('snapshoot:auth-change', handleAuthChange);
  window.addEventListener('storage', handleAuthChange);

  // Initialize Supabase Auth listener ONCE globally
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const syncSessionUser = async (session: any) => {
      if (!session?.user) return;
      const meta = session.user.user_metadata || {};
      const existing = getStoredSession();

      const hasExplicitRole = Boolean(meta.role);
      const role = (meta.role as AuthUser['role']) || existing?.role || 'customer';
      const roleSelected = hasExplicitRole
        ? true
        : existing?.roleSelected !== undefined
        ? existing.roleSelected
        : false;

      const authUser: AuthUser = {
        id: session.user.id,
        name: meta.full_name || session.user.email?.split('@')[0] || existing?.name || 'User',
        email: session.user.email || existing?.email || '',
        phone: meta.phone || session.user.phone || existing?.phone,
        avatarUrl: meta.avatar_url || existing?.avatarUrl,
        role: role === 'photographer' ? 'creator' : role,
        roleSelected,
      };

      saveAuthSession(authUser, session.access_token);

      // If user came with no explicit role in metadata, verify authoritative state with server
      if (!hasExplicitRole) {
        try {
          const res = await fetch('/api/auth/session', {
            headers: session.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.authenticated && data?.user) {
              const verifiedRole = data.user.role || 'customer';
              const verifiedRoleSelected = Boolean(data.user.roleSelected);
              saveAuthSession(
                {
                  ...authUser,
                  role: verifiedRole,
                  roleSelected: verifiedRoleSelected,
                },
                session.access_token
              );
            }
          }
        } catch {
          // Keep safe defaults if offline
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncSessionUser(session);
      } else if (!getStoredSession()) {
        fetch('/api/auth/session', { cache: 'no-store', credentials: 'same-origin' })
          .then((r) => (r.ok ? r.json() : null))
          .then((body) => {
            if (body?.authenticated && body.user) {
              const u = body.user;
              const syncd: AuthUser = {
                id: u.id,
                name: u.name || 'User',
                email: u.email || '',
                role: u.role || 'customer',
                avatarUrl: u.avatarUrl || undefined,
                roleSelected: u.roleSelected !== undefined ? u.roleSelected : true,
              };
              saveAuthSession(syncd);
            }
          })
          .catch(() => {});
      }
    });

    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        syncSessionUser(session);
      } else if (event === 'SIGNED_OUT') {
        clearAuthSession();
      }
    });
  }
}

export function getStoredSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check localStorage
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      return JSON.parse(local) as AuthUser;
    }

    // 2. Fallback to Cookie
    const match = document.cookie.match(new RegExp('(^| )' + COOKIE_NAME + '=([^;]+)'));
    if (match && match[2]) {
      const decoded = decodeURIComponent(match[2]);
      return JSON.parse(decoded) as AuthUser;
    }
  } catch (err) {
    console.error('Error reading auth session:', err);
  }

  return null;
}

export function saveAuthSession(user: AuthUser, token?: string): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(user);
    localStorage.setItem(STORAGE_KEY, serialized);
    // 7-day cookie for session retention
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(serialized)}; path=/; max-age=604800; SameSite=Lax`;
    if (token) {
      localStorage.setItem('auth_token', token);
      document.cookie = `snapshoot_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
    }
    notifyAuthSubscribers(user);
    window.dispatchEvent(new Event('snapshoot:auth-change'));
  } catch (err) {
    console.error('Error saving auth session:', err);
  }
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('auth_token');
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `snapshoot_token=; path=/; max-age=0; SameSite=Lax`;
    notifyAuthSubscribers(null);
    window.dispatchEvent(new Event('snapshoot:auth-change'));
  } catch (err) {
    console.error('Error clearing auth session:', err);
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getOrLoadCachedUser);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    initGlobalAuthSubscription();

    // Ensure state synchronization on mount
    setUser(getOrLoadCachedUser());

    const handleChange = () => {
      setUser(getOrLoadCachedUser());
    };

    authSubscribers.add(handleChange);
    return () => {
      authSubscribers.delete(handleChange);
    };
  }, []);

  const login = useCallback((userData: AuthUser) => {
    saveAuthSession(userData);
  }, []);

  const logout = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Supabase signOut error:', err);
      }
    }
    clearAuthSession();
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isMounted,
    login,
    logout,
  };
}
