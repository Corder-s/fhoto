import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { cleanText } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 *
 * Creates a Supabase Auth user with the server (service role) client.
 * Self-service signup may request only the 'customer' or 'creator' role.
 * The 'admin' role can never be requested here; the database trigger also
 * enforces this, so a crafted request cannot escalate privileges.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const email = cleanText(body.email, 254);
  const password = typeof body.password === 'string' ? body.password : '';
  const fullName = cleanText(body.full_name, 120);
  const phone = cleanText(body.phone, 20);
  const city = cleanText(body.city, 80);

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }
  if (password.length < 6 || password.length > 72) {
    return NextResponse.json({ error: 'Password must be between 6 and 72 characters.' }, { status: 400 });
  }

  // Only 'creator' is honoured; any other value (including 'admin') becomes 'customer'.
  const role = body.role === 'creator' ? 'creator' : 'customer';

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: 'Supabase admin client is not configured. Check SUPABASE_SERVICE_ROLE_KEY in .env.local' },
      { status: 503 }
    );
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      name: fullName,
      phone,
      role,
      city,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data.user) {
    const { error: profileErr } = await admin.from('profiles').upsert(
      {
        id: data.user.id,
        full_name: fullName || email.split('@')[0],
        email,
        phone_number: phone,
        account_status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (profileErr) {
      // The auth trigger also provisions the profile, so this is a warning, not a failure.
      console.warn('Profile sync deferred to database trigger:', profileErr.message);
    }
  }

  return NextResponse.json({
    success: true,
    user: data.user ? { id: data.user.id, email: data.user.email } : null,
    role,
    message: 'User successfully created.',
  });
}
