import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name, phone, role, city } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'Supabase admin client is not configured. Check SUPABASE_SERVICE_ROLE_KEY in .env.local' },
        { status: 500 }
      );
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name?.trim(),
        name: full_name?.trim(),
        phone: phone?.trim(),
        role: role || 'customer',
        city: city?.trim(),
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Upsert into public.profiles to guarantee immediate DB presence
    if (data.user) {
      try {
        await admin.from('profiles').upsert(
          {
            id: data.user.id,
            full_name: full_name?.trim() || email.split('@')[0],
            email: email.trim(),
            phone_number: phone?.trim() || null,
            account_status: 'active',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (upsertErr) {
        console.warn('Notice: Profile sync will rely on trigger:', upsertErr);
      }
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      message: 'User successfully created and verified in Supabase.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
