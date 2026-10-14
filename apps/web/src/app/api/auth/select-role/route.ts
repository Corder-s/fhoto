import { NextRequest, NextResponse } from 'next/server';
import { resolveSession, jsonError } from '@/lib/server/session';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { sanitizeRedirectUrl } from '@/lib/safeRedirect';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/select-role
 *
 * Finalizes account selection for new authenticated users (e.g. Google OAuth signups).
 * Enforces server-side validation:
 *  - Only 'customer' (Client) or 'creator' (Photographer) can be chosen.
 *  - Administrative escalation ('admin', 'owner') is rejected.
 *  - Updates public.profiles.role_selected = true.
 *  - Assigns the chosen role in public.user_roles.
 *  - For creators, initializes the creator_profiles record in 'unsubmitted' status
 *    and directs them to /photographer/onboarding.
 */
export async function POST(req: NextRequest) {
  const session = await resolveSession();

  if (session.status === 'unconfigured') {
    return jsonError(503, 'Authentication service is not configured on this server.');
  }

  if (session.status !== 'authenticated') {
    return jsonError(401, 'Authentication required to select account role. Please sign in.');
  }

  const { user } = session;
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return jsonError(503, 'Database service is unavailable.');
  }

  let body: { role?: string; returnUrl?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid JSON payload.');
  }

  const rawRole = typeof body.role === 'string' ? body.role.trim().toLowerCase() : '';
  const requestedRole = rawRole === 'photographer' ? 'creator' : rawRole === 'client' ? 'customer' : rawRole;

  // Strict role whitelist: Only customer or creator may be selected by self-service users.
  if (requestedRole !== 'customer' && requestedRole !== 'creator') {
    return jsonError(400, 'Invalid account type. Please select Client or Photographer.');
  }

  try {
    const now = new Date().toISOString();

    // 1. Mark role_selected = true in public.profiles
    const { error: profileErr } = await admin
      .from('profiles')
      .update({
        role_selected: true,
        updated_at: now,
      })
      .eq('id', user.id);

    if (profileErr) {
      console.error('Failed to update profiles.role_selected:', profileErr.message);
      return jsonError(500, 'Could not persist account role selection.');
    }

    // 2. Assign the chosen role in user_roles (idempotent)
    const { error: roleErr } = await admin
      .from('user_roles')
      .upsert(
        { user_id: user.id, role: requestedRole },
        { onConflict: 'user_id,role' }
      );

    if (roleErr) {
      console.error('Failed to insert user_roles record:', roleErr.message);
      return jsonError(500, 'Could not assign user role.');
    }

    // 3. Handle Creator initial setup & Redirect Target
    let redirectUrl = '/customer/dashboard';

    if (requestedRole === 'creator') {
      const { data: existingCreator } = await admin
        .from('creator_profiles')
        .select('id, verification_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingCreator) {
        const { error: creatorErr } = await admin.from('creator_profiles').insert({
          user_id: user.id,
          professional_name: user.name || 'Professional Creator',
          city: 'Delhi NCR',
          state: 'Delhi',
          experience_years: 1,
          service_radius: 25,
          verification_status: 'unsubmitted',
          is_available: false,
        });

        if (creatorErr) {
          console.error('Failed to create creator profile placeholder:', creatorErr.message);
          // Non-fatal if trigger or previous step already created it
        }
      }

      // New photographers must complete onboarding and submit for admin verification
      redirectUrl = '/photographer/onboarding';
    } else {
      // Client role redirection
      const sanitized = sanitizeRedirectUrl(body.returnUrl, '/customer/dashboard');
      if (
        sanitized.startsWith('/customer/') ||
        sanitized.startsWith('/photographers/') ||
        sanitized.startsWith('/explore')
      ) {
        redirectUrl = sanitized;
      } else {
        redirectUrl = '/customer/dashboard';
      }
    }

    return NextResponse.json({
      success: true,
      role: requestedRole,
      redirectUrl,
      message:
        requestedRole === 'creator'
          ? 'Photographer account selected. Proceeding to onboarding studio...'
          : 'Client account activated. Welcome to SnapShoot!',
    });
  } catch (err: any) {
    console.error('Unexpected error in /api/auth/select-role:', err);
    return jsonError(500, err?.message || 'Could not complete account setup.');
  }
}
