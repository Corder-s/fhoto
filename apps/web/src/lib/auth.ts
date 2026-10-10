'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'creator';
  phone?: string;
  avatarUrl?: string;
}

const STORAGE_KEY = 'snapshoot_session';
const COOKIE_NAME = 'snapshoot_session';

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

export function saveAuthSession(user: AuthUser): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(user);
    localStorage.setItem(STORAGE_KEY, serialized);
    // 7-day cookie for session retention
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(serialized)}; path=/; max-age=604800; SameSite=Lax`;
    window.dispatchEvent(new Event('snapshoot:auth-change'));
  } catch (err) {
    console.error('Error saving auth session:', err);
  }
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    window.dispatchEvent(new Event('snapshoot:auth-change'));
  } catch (err) {
    console.error('Error clearing auth session:', err);
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const refreshSession = useCallback(() => {
    const current = getStoredSession();
    setUser(current);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    refreshSession();

    const handleAuthChange = () => {
      refreshSession();
    };

    window.addEventListener('snapshoot:auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('snapshoot:auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [refreshSession]);

  const login = useCallback((userData: AuthUser) => {
    saveAuthSession(userData);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isMounted,
    login,
    logout,
  };
}
