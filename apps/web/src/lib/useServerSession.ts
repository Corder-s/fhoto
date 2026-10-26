'use client';

import { useEffect, useState } from 'react';

export interface ServerSessionUser {
  id: string;
  email: string | null;
  name: string;
  avatarUrl?: string | null;
  role: string;
  roles: string[];
  /** Effective administrator capabilities; empty for customers and creators. */
  permissions: string[];
  isOwner: boolean;
  accountStatus: string;
  roleSelected: boolean;
  hasCreatorProfile?: boolean;
  creatorStatus?: string | null;
}

export type ServerSessionState =
  | { status: 'loading'; user: null }
  | { status: 'anonymous'; user: null }
  | { status: 'authenticated'; user: ServerSessionUser }
  | { status: 'error'; user: null };

/**
 * Reads the signed-in identity and roles from the server (/api/auth/session).
 * Use this for navigation and route guards. localStorage is a cache for display
 * only and must never grant access; the API routes enforce authorization anyway.
 */
export function useServerSession(): ServerSessionState {
  const [state, setState] = useState<ServerSessionState>({ status: 'loading', user: null });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session', { cache: 'no-store', credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) throw new Error('session request failed');
        return res.json();
      })
      .then((body) => {
        if (cancelled) return;
        if (body?.authenticated && body.user) {
          setState({ status: 'authenticated', user: body.user as ServerSessionUser });
        } else {
          setState({ status: 'anonymous', user: null });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', user: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
