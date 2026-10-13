import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdminClient } from '../supabase/admin';
import {
  type AppRole,
  hasAnyRole,
  isAccountActive,
  primaryRole,
  resolveRoleSet,
} from './policy';

/**
 * Server-side identity for the current request.
 *
 * The identity comes from the Supabase session cookie, validated with
 * `auth.getUser()` (which asks Supabase Auth whether the session is still valid).
 * Roles and account status are read from the database. Nothing the browser
 * sends about its own role or ID is trusted.
 */
export interface SessionUser {
  id: string;
  email: string | null;
  name: string;
  roles: AppRole[];
  role: AppRole;
  accountStatus: string;
}

export function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error: message, ...(extra || {}) }, { status });
}

function getPublicSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || url.includes('your-project-id') || anonKey.includes('your-anon-key')) {
    return null;
  }
  return { url, anonKey };
}

/** Creates a Supabase client bound to the request's cookies (session read/refresh). */
export function getRequestSupabaseClient(): SupabaseClient | null {
  const config = getPublicSupabaseConfig();
  if (!config) return null;

  const cookieStore = cookies();
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Cookies cannot be mutated while rendering a Server Component; route handlers can.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // See above.
        }
      },
    },
  });
}

export type SessionResult =
  | { status: 'authenticated'; user: SessionUser }
  | { status: 'anonymous' }
  | { status: 'unconfigured' }
  | { status: 'error'; message: string };

/**
 * Resolves the authenticated user for this request.
 * Returns `anonymous` when there is no valid session, and `unconfigured` when
 * Supabase credentials are missing (so callers can respond with 503).
 */
export async function resolveSession(): Promise<SessionResult> {
  const supabase = getRequestSupabaseClient();
  if (!supabase) return { status: 'unconfigured' };

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { status: 'anonymous' };

  const admin = getSupabaseAdminClient();
  if (!admin) return { status: 'unconfigured' };

  const [{ data: roleRows, error: roleErr }, { data: profile, error: profileErr }] = await Promise.all([
    admin.from('user_roles').select('role').eq('user_id', user.id),
    admin.from('profiles').select('full_name, email, account_status').eq('id', user.id).maybeSingle(),
  ]);

  if (roleErr || profileErr) {
    return { status: 'error', message: (roleErr || profileErr)?.message || 'Could not load account' };
  }

  const roles = resolveRoleSet(roleRows || []);
  if (roles.length === 0) {
    // Signup always assigns 'customer'. An account with no role row (e.g. created outside the app)
    // is treated as a customer, which grants no administrative or creator privileges.
    roles.push('customer');
  }

  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const fallbackName = typeof meta.full_name === 'string' ? meta.full_name : (user.email || '').split('@')[0];

  return {
    status: 'authenticated',
    user: {
      id: user.id,
      email: profile?.email || user.email || null,
      name: profile?.full_name || fallbackName || 'User',
      roles,
      role: primaryRole(roles) || 'customer',
      accountStatus: profile?.account_status || 'active',
    },
  };
}

export type AuthorizeResult =
  | { ok: true; user: SessionUser; admin: SupabaseClient }
  | { ok: false; response: NextResponse };

/**
 * Authenticates the request and checks account status and role membership.
 *
 * Usage in a route handler:
 *   const auth = await authorize({ roles: ['creator'] });
 *   if (!auth.ok) return auth.response;
 *   const { user, admin } = auth;
 *
 * Route handlers must still check record ownership (e.g. that a booking belongs
 * to `user.id`) before reading or changing data.
 */
export async function authorize(options: { roles?: AppRole[] } = {}): Promise<AuthorizeResult> {
  const session = await resolveSession();

  if (session.status === 'unconfigured') {
    return {
      ok: false,
      response: jsonError(503, 'Authentication service is not configured on this server.'),
    };
  }
  if (session.status === 'error') {
    return { ok: false, response: jsonError(500, 'Could not load account details.') };
  }
  if (session.status === 'anonymous') {
    return { ok: false, response: jsonError(401, 'Authentication required. Please sign in.') };
  }

  const { user } = session;
  if (!isAccountActive(user.accountStatus)) {
    return {
      ok: false,
      response: jsonError(403, 'This account is suspended or not active. Contact support.', {
        code: 'ACCOUNT_INACTIVE',
      }),
    };
  }

  if (options.roles && options.roles.length > 0 && !hasAnyRole(user.roles, options.roles)) {
    return { ok: false, response: jsonError(403, 'You do not have permission to perform this action.') };
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return {
      ok: false,
      response: jsonError(503, 'Database service is not configured on this server.'),
    };
  }

  return { ok: true, user, admin };
}

/** Looks up the creator profile that belongs to the authenticated user (never a client-supplied ID). */
export async function getOwnCreatorProfile(
  admin: SupabaseClient,
  userId: string
): Promise<{ id: string; verification_status: string } | null> {
  const { data } = await admin
    .from('creator_profiles')
    .select('id, verification_status')
    .eq('user_id', userId)
    .maybeSingle();
  return (data as { id: string; verification_status: string } | null) || null;
}
