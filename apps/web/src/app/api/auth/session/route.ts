import { NextResponse } from 'next/server';
import { resolveSession } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/session
 *
 * Returns the server's view of the signed-in user (identity, application role
 * and account status) derived from the Supabase session cookie. The frontend
 * uses this as the source of truth for navigation and route guards; client
 * storage is only a cache.
 */
export async function GET() {
  const session = await resolveSession();

  if (session.status === 'unconfigured') {
    return NextResponse.json(
      { authenticated: false, user: null, configured: false },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (session.status === 'error') {
    return NextResponse.json(
      { authenticated: false, user: null, configured: true, error: 'Could not load account details.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (session.status === 'anonymous') {
    return NextResponse.json(
      { authenticated: false, user: null, configured: true },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const { user } = session;
  return NextResponse.json(
    {
      authenticated: true,
      configured: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roles: user.roles,
        // Effective administrator capabilities. The UI uses these to show or hide
        // controls; every route re-checks them, so hiding is presentation only.
        permissions: user.permissions,
        isOwner: user.isOwner,
        accountStatus: user.accountStatus,
      },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
