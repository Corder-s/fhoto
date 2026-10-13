import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Edge route protection.
 *
 * Before this file existed, the role areas were gated only inside client
 * layouts: an anonymous visitor who typed /admin/dashboard received the page
 * shell and then saw the sign-in modal. Every API call was refused, so no data
 * leaked, but the shell was reachable. This middleware adds the missing first
 * gate: no session cookie for a protected area means a redirect to /login, for
 * direct navigation and for client-side soft navigation alike.
 *
 * What it deliberately does NOT do is decide roles. A role lives in
 * `user_roles` in Postgres, behind Row Level Security; reading it here would
 * either mean trusting a client-writable cookie (worse than today) or doing a
 * database round trip on every static asset request. So the split is:
 *
 *   middleware   -> authenticated or not (redirect to sign-in, remember the path)
 *   layouts      -> which role area renders (display)
 *   route handlers + RLS -> authorization (enforcement)
 *
 * An administrator who loses a permission therefore still loads the shell, and
 * every action answers 403; nothing is granted by this file.
 */

/** Path prefixes that require a session. Anonymous visitors go to /login?next=<path>. */
const PROTECTED_PREFIXES = ['/admin', '/owner', '/photographer', '/customer'] as const;

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url && anonKey && !url.includes('your-project-id') && !anonKey.includes('your-anon-key')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const matched = PROTECTED_PREFIXES.some(
    // "/admin" itself and anything below it; "/administration" must not match.
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Unconfigured preview deployments (no Supabase project linked) keep serving
  // the app so the build and the public pages remain inspectable; the API routes
  // answer 503 in that state, so no data is exposed.
  if (!matched || !isSupabaseConfigured()) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Reading the user through the SSR client is what refreshes an expired access
  // token. Writing the refreshed cookies back onto the response is what keeps a
  // signed-in visitor signed in after a refresh on the deployed domain.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Fail closed: if the identity check itself blows up (Supabase unreachable from
  // the edge, malformed cookie), treat the visitor as anonymous rather than
  // letting the request through to the protected shell.
  let user: { id: string } | null = null;
  try {
    user = (await supabase.auth.getUser()).data.user;
  } catch (error) {
    console.warn('[middleware] session check failed:', (error as Error)?.message);
    user = null;
  }

  if (user) return response;

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = '';
  loginUrl.searchParams.set('next', `${pathname}${search}`);

  const redirect = NextResponse.redirect(loginUrl);
  // Carry the refreshed cookies across the redirect, or a visitor with an
  // expired-but-refreshable session would be bounced to sign-in unnecessarily.
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

export const config = {
  // Next.js serves /api routes with their own authorization; excluding them keeps
  // a fetch from being answered with a 302 to an HTML page.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|reference-assets|.*\\..*).*)'],
};
