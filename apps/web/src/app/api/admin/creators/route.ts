import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';
import { cleanText, isUuid } from '@/lib/server/policy';
import { revalidatePublicDirectory } from '@/lib/server/verification';

export const dynamic = 'force-dynamic';

const STATUS_FILTERS = ['pending', 'approved', 'rejected', 'unsubmitted', 'suspended', 'all'] as const;

/**
 * GET /api/admin/creators?status=pending|approved|rejected|unsubmitted|suspended|all
 * Lists photographer (creator) profiles with their verification status.
 *
 * Requires the `manage_photographer_verification` permission. The application
 * itself (documents, reviewer notes) lives in /api/admin/verification; this
 * route is the profile-level list and the account actions.
 */
export async function GET(req: NextRequest) {
  const auth = await authorize({
    roles: ['admin', 'owner'],
    permission: 'manage_photographer_verification',
  });
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

  // Attach the open application reference so the reviewer can jump from a
  // profile row to the submission that needs a decision.
  const creators = data || [];
  const creatorIds = creators.map((c: any) => c.id).filter((id: string) => isUuid(id));
  let openByCreator: Record<string, { id: string; reference_code: string; submitted_at: string }> = {};
  if (creatorIds.length > 0) {
    const { data: submissions } = await admin
      .from('creator_verification_submissions')
      .select('id, creator_id, reference_code, submitted_at, status')
      .in('creator_id', creatorIds)
      .in('status', ['pending', 'needs_info'])
      .order('submitted_at', { ascending: false })
      .limit(200);
    for (const submission of submissions || []) {
      if (!openByCreator[submission.creator_id]) openByCreator[submission.creator_id] = submission;
    }
  }

  return NextResponse.json({
    success: true,
    creators: creators.map((creator: any) => ({
      ...creator,
      openSubmission: openByCreator[creator.id] || null,
    })),
  });
}

/**
 * PATCH /api/admin/creators
 * Body: { creatorProfileId, action, reason? }
 *
 *  - 'suspend_profile'   verification_status -> 'suspended' (unpublished, account still usable)
 *  - 'reinstate_profile' verification_status -> 'approved'
 *  - 'suspend'            login disabled (profiles.account_status -> 'suspended')
 *  - 'reinstate'          login re-enabled
 *
 * 'approve' and 'reject' are still accepted for compatibility, but a
 * verification review is a decision about an application, so the dashboard uses
 * /api/admin/verification for those. Here they are translated to the same
 * database write, which the triggers mirror onto any open application.
 */
export async function PATCH(req: NextRequest) {
  const auth = await authorize({
    roles: ['admin', 'owner'],
    permission: 'manage_photographer_verification',
  });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid JSON payload.');
  }

  const { action } = body;
  const targetId = body.creatorProfileId || body.creatorId || body.userId;
  if (!targetId || !isUuid(targetId)) return jsonError(400, 'Invalid creator identifier.');
  const allowed = ['approve', 'reject', 'suspend', 'reinstate', 'suspend_profile', 'reinstate_profile'];
  if (!allowed.includes(action)) return jsonError(400, 'Unknown action.');

  let { data: creator, error: fetchErr } = await admin
    .from('creator_profiles')
    .select('id, user_id, verification_status')
    .eq('id', targetId)
    .maybeSingle();

  if (!creator) {
    const byUser = await admin
      .from('creator_profiles')
      .select('id, user_id, verification_status')
      .eq('user_id', targetId)
      .maybeSingle();
    creator = byUser.data;
    fetchErr = byUser.error;
  }

  if (fetchErr) return jsonError(500, 'Could not load creator.');
  if (!creator) return jsonError(404, 'Creator not found.');
  if (creator.user_id === user.id) {
    return jsonError(403, 'You cannot change the verification state of your own profile.');
  }

  const now = new Date().toISOString();

  if (action === 'approve' || action === 'reject' || action === 'suspend_profile' || action === 'reinstate_profile') {
    const reason = cleanText(body.reason, 1000);
    if (action === 'reject' && !reason) {
      return jsonError(400, 'A rejection must include a reason for the photographer.');
    }
    const nextStatus =
      action === 'approve' || action === 'reinstate_profile'
        ? 'approved'
        : action === 'reject'
          ? 'rejected'
          : 'suspended';

    const { data, error } = await admin
      .from('creator_profiles')
      .update({ verification_status: nextStatus, updated_at: now })
      .eq('id', creator.id)
      .select('id, user_id, verification_status')
      .single();
    if (error || !data) {
      console.error('Creator status update failed:', error?.message);
      return jsonError(500, 'Could not update the application.');
    }

    // Record the reviewer's explanation on the open application, if any. The
    // status itself is already mirrored by the database trigger.
    if (reason) {
      await admin
        .from('creator_verification_submissions')
        .update({ review_reason: reason, reviewed_by: user.id, updated_at: now })
        .eq('creator_id', creator.id)
        .in('status', ['pending', 'needs_info']);
    }
    try {
      await admin.from('notifications').insert({
        user_id: creator.user_id,
        notification_type: 'creator_verification',
        title:
          nextStatus === 'approved'
            ? 'Your photographer profile is live'
            : nextStatus === 'rejected'
              ? 'Your photographer profile is not approved'
              : 'Your photographer profile is suspended',
        body:
          nextStatus === 'approved'
            ? 'An administrator published your profile. You now appear in the directory.'
            : `${nextStatus === 'rejected' ? 'An administrator rejected' : 'An administrator suspended'} your public profile.${reason ? ` Reason: ${reason}` : ''}`,
      });
    } catch (notifyErr) {
      // The decision is already stored; a missed notification must not undo it.
      console.warn('Could not file the creator status notification:', notifyErr);
    }

    revalidatePublicDirectory();
    return NextResponse.json({ success: true, creator: data });
  }

  // suspend / reinstate: the login account, not the publication state.
  const nextAccount = action === 'suspend' ? 'suspended' : 'active';
  const { data, error } = await admin
    .from('profiles')
    .update({ account_status: nextAccount, updated_at: now })
    .eq('id', creator.user_id)
    .select('id, account_status')
    .single();
  if (error || !data) {
    console.error('Account status update failed:', error?.message);
    return jsonError(500, 'Could not update the account status.');
  }
  return NextResponse.json({ success: true, account: data });
}
