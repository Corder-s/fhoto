import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';
import {
  fileVerificationApplication,
  getMyVerification,
  isMissingRelationError,
  MIGRATION_REQUIRED_MESSAGE,
  revalidatePublicDirectory,
} from '@/lib/server/verification';

export const dynamic = 'force-dynamic';

/**
 * GET /api/photographers/verification
 *
 * The signed-in photographer's verification state: their creator profile's
 * publication status plus the applications they have filed (documents, review
 * reason, timestamps). Data comes from the database, never from client state.
 */
export async function GET() {
  const auth = await authorize({ roles: ['creator', 'admin', 'owner'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  try {
    const result = await getMyVerification(admin, user.id);
    if (result.error) {
      if (isMissingRelationError(result.error)) return jsonError(501, MIGRATION_REQUIRED_MESSAGE);
      console.error('Photographer verification read failed:', result.error);
      return jsonError(500, 'Could not load your verification status.');
    }

    return NextResponse.json(
      {
        success: true,
        configured: true,
        creatorProfile: result.creator,
        verificationStatus: result.creator?.verification_status ?? 'unsubmitted',
        submissions: result.submissions,
        canSubmit: canFile(result.creator?.verification_status),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('Photographer verification read failed:', err);
    return jsonError(500, 'Could not load your verification status.');
  }
}

function canFile(status: string | null | undefined): boolean {
  return !status || ['unsubmitted', 'rejected', 'suspended'].includes(status);
}

/**
 * POST /api/photographers/verification
 *
 * Files (or re-files) a verification application. The row is written as
 * `pending`; a database trigger mirrors that onto the creator profile so the
 * admin queue and the public directory move together. Reviewers approve or
 * reject through /api/admin/verification.
 */
export async function POST(req: NextRequest) {
  const auth = await authorize({ roles: ['creator', 'admin', 'owner'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid JSON payload.');
  }

  const result = await fileVerificationApplication(admin, user.id, body);
  if (!result.ok) return jsonError(result.status, result.error);

  return NextResponse.json(
    {
      success: true,
      submissionId: result.submissionId,
      referenceCode: result.referenceCode,
      verificationStatus: 'pending',
      message: result.resubmission
        ? 'Your updated application was submitted for review.'
        : 'Your verification application was submitted and is pending review.',
    },
    { status: 201, headers: { 'Cache-Control': 'no-store' } }
  );
}

/**
 * DELETE /api/photographers/verification?submissionId=<uuid>
 *
 * Withdraws an application that has not been reviewed yet. Withdrawing returns
 * the profile to `unsubmitted` so a photographer who removed their documents is
 * not left advertised as pending.
 */
export async function DELETE(req: NextRequest) {
  const auth = await authorize({ roles: ['creator', 'admin', 'owner'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const submissionId = new URL(req.url).searchParams.get('submissionId') || '';
  if (!submissionId) return jsonError(400, 'submissionId is required.');

  const { data: submission } = await admin
    .from('creator_verification_submissions')
    .select('id, creator_id, user_id, status')
    .eq('id', submissionId)
    .maybeSingle();

  if (!submission) return jsonError(404, 'Application not found.');
  if (submission.user_id !== user.id) return jsonError(403, 'You can only withdraw your own application.');
  if (submission.status !== 'pending') {
    return jsonError(409, 'A reviewed application cannot be withdrawn.');
  }

  const { error } = await admin.from('creator_verification_submissions').delete().eq('id', submissionId);
  if (error) {
    console.error('Withdrawal failed:', error.message);
    return jsonError(500, 'Could not withdraw your application.');
  }

  await admin
    .from('creator_profiles')
    .update({ verification_status: 'unsubmitted', updated_at: new Date().toISOString() })
    .eq('id', submission.creator_id);

  revalidatePublicDirectory();
  return NextResponse.json({ success: true, verificationStatus: 'unsubmitted' });
}
