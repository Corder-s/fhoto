import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';
import { isUuid } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

const STATUS_FILTERS = ['pending', 'approved', 'rejected', 'unsubmitted', 'all'] as const;

/**
 * GET /api/admin/creators?status=pending|approved|rejected|unsubmitted|all
 * Lists photographer (creator) applications for review.
 */
export async function GET(req: NextRequest) {
  const auth = await authorize({ roles: ['admin'] });
  if (!auth.ok) return auth.response;
  const { admin } = auth;

  const status = new URL(req.url).searchParams.get('status') || 'pending';
  if (!(STATUS_FILTERS as readonly string[]).includes(status)) {
    return jsonError(400, 'Unsupported status filter.');
  }

  let query = admin
    .from('creator_profiles')
    .select(`
      id,
      user_id,
      professional_name,
      city,
      state,
      experience_years,
      verification_status,
      average_rating,
      total_reviews,
      created_at,
      updated_at,
      user:profiles!user_id (
        id,
        full_name,
        email,
        phone_number,
        account_status
      )
    `)
    .order('updated_at', { ascending: false });

  if (status !== 'all') query = query.eq('verification_status', status);

  const { data, error } = await query;
  if (error) return jsonError(500, 'Could not load creator applications.');
  return NextResponse.json({ success: true, creators: data || [] });
}

/**
 * PATCH /api/admin/creators
 * Body: { creatorProfileId, action: 'approve' | 'reject' | 'suspend' | 'reinstate', reason? }
 *  - approve / reject: sets creator_profiles.verification_status (drives public listing).
 *  - suspend / reinstate: sets the account_status of the photographer's login.
 */
export async function PATCH(req: NextRequest) {
  const auth = await authorize({ roles: ['admin'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid JSON payload.');
  }

  const { creatorProfileId, action } = body;
  if (!isUuid(creatorProfileId)) return jsonError(400, 'Invalid creatorProfileId.');
  if (!['approve', 'reject', 'suspend', 'reinstate'].includes(action)) {
    return jsonError(400, 'Unknown action.');
  }

  const { data: creator, error: fetchErr } = await admin
    .from('creator_profiles')
    .select('id, user_id, verification_status')
    .eq('id', creatorProfileId)
    .maybeSingle();
  if (fetchErr) return jsonError(500, 'Could not load creator.');
  if (!creator) return jsonError(404, 'Creator not found.');

  const now = new Date().toISOString();

  if (action === 'approve' || action === 'reject') {
    if (creator.user_id === user.id) return jsonError(403, 'You cannot review your own application.');
    const nextStatus = action === 'approve' ? 'approved' : 'rejected';
    const { data, error } = await admin
      .from('creator_profiles')
      .update({ verification_status: nextStatus, updated_at: now })
      .eq('id', creatorProfileId)
      .select('id, user_id, verification_status')
      .single();
    if (error || !data) return jsonError(500, 'Could not update the application.');
    return NextResponse.json({ success: true, creator: data });
  }

  // suspend / reinstate
  if (creator.user_id === user.id) return jsonError(403, 'You cannot suspend your own account.');
  const nextAccount = action === 'suspend' ? 'suspended' : 'active';
  const { data, error } = await admin
    .from('profiles')
    .update({ account_status: nextAccount, updated_at: now })
    .eq('id', creator.user_id)
    .select('id, account_status')
    .single();
  if (error || !data) return jsonError(500, 'Could not update the account status.');
  return NextResponse.json({ success: true, account: data });
}
