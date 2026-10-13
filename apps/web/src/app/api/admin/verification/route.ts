import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin, jsonError } from '@/lib/server/session';
import {
  isMissingRelationError,
  listVerificationSubmissions,
  MIGRATION_REQUIRED_MESSAGE,
  reviewVerificationSubmission,
  SUBMISSION_STATUSES,
} from '@/lib/server/verification';
import { isUuid } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/verification?status=pending|approved|rejected|needs_info|all
 *
 * The photographer verification queue. Requires the
 * `manage_photographer_verification` administrator permission (an owner always
 * has it, and an admin with no explicit grants inherits it).
 */
export async function GET(req: NextRequest) {
  const auth = await authorizeAdmin('manage_photographer_verification');
  if (!auth.ok) return auth.response;
  const { admin } = auth;

  const params = new URL(req.url).searchParams;
  const status = params.get('status') || 'pending';
  if (!(SUBMISSION_STATUSES as readonly string[]).includes(status)) {
    return jsonError(400, 'Unsupported status filter.');
  }

  const { rows, error } = await listVerificationSubmissions(admin, { status });
  if (error) {
    if (isMissingRelationError(error)) {
      return jsonError(501, MIGRATION_REQUIRED_MESSAGE);
    }
    console.error('Verification queue failed:', error);
    return jsonError(500, 'Could not load verification submissions.');
  }

  // Documents live in a private bucket. The queue never exposes object paths or
  // file names to the browser; the reviewer opens them through the signed-URL
  // endpoint, which re-checks the caller and the owning applicant.
  const submissions = rows.map((row) => ({
    id: row.id,
    referenceCode: row.reference_code,
    status: row.status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewReason: row.review_reason,
    reviewNotes: row.review_notes,
    reviewer: row.reviewer,
    creatorProfileId: row.creator_id,
    applicantUserId: row.user_id,
    legalName: row.legal_name,
    businessName: row.business_name,
    contactPhone: row.contact_phone,
    governmentIdType: row.government_id_type,
    governmentIdMasked: row.government_id_masked,
    gstin: row.gstin,
    equipmentSummary: row.equipment_summary,
    categories: row.categories || [],
    city: row.city,
    state: row.state,
    serviceRadiusKm: row.service_radius_km,
    portfolioUrl: row.portfolio_url,
    applicantNotes: row.applicant_notes,
    documentCount: Array.isArray(row.documents) ? (row.documents as unknown[]).length : 0,
    documents: Array.isArray(row.documents)
      ? (row.documents as Array<Record<string, any>>).map((doc) => ({
          id: String(doc?.storage_path || doc?.external_url || ''),
          type: doc?.type || 'other',
          fileName: doc?.file_name || null,
          mimeType: doc?.mime_type || null,
          sizeBytes: doc?.size_bytes ?? null,
          hasStorageObject: Boolean(doc?.storage_path),
          externalUrl: doc?.external_url || null,
        }))
      : [],
    professionalName: row.creator?.professional_name ?? null,
    profileVerificationStatus: row.creator?.verification_status ?? null,
    applicant: row.applicant
      ? { fullName: row.applicant.full_name, email: row.applicant.email, accountStatus: row.applicant.account_status }
      : null,
  }));

  return NextResponse.json({ success: true, submissions }, { headers: { 'Cache-Control': 'no-store' } });
}

/**
 * PATCH /api/admin/verification
 * Body: { submissionId, action: 'approve' | 'reject' | 'needs_info', reason?, notes? }
 *
 * Persists the decision on creator_verification_submissions. The database
 * trigger then sets creator_profiles.verification_status and files a
 * notification, so the queue, the photographer's dashboard and the public
 * directory all move from this one write.
 */
export async function PATCH(req: NextRequest) {
  const auth = await authorizeAdmin('manage_photographer_verification');
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid JSON payload.');
  }

  const submissionId = body.submissionId ?? body.creatorProfileId ?? '';
  if (!isUuid(submissionId)) return jsonError(400, 'Invalid submissionId.');

  // A reviewer may also address the queue row by creator profile, which is what
  // the older /api/admin/creators contract sends.
  let targetId = submissionId;
  const direct = await admin
    .from('creator_verification_submissions')
    .select('id')
    .eq('id', submissionId)
    .maybeSingle();
  if (!direct.data) {
    const byCreator = await admin
      .from('creator_verification_submissions')
      .select('id')
      .eq('creator_id', submissionId)
      .in('status', ['pending', 'needs_info'])
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!byCreator.data) return jsonError(404, 'No open verification submission for that profile.');
    targetId = byCreator.data.id as string;
  }

  const result = await reviewVerificationSubmission(admin, {
    submissionId: targetId,
    action: body.action,
    reason: body.reason,
    notes: body.notes,
    reviewerId: user.id,
  });
  if (!result.ok) return jsonError(result.status, result.error);

  return NextResponse.json(
    {
      success: true,
      submission: { id: result.submissionId, status: result.status },
      creator: {
        id: result.creatorId,
        verificationStatus: result.profileStatus,
        published: result.published,
      },
      userId: result.userId,
      message:
        result.status === 'approved'
          ? 'Photographer verified and published to the directory.'
          : result.status === 'rejected'
            ? 'Application rejected; the photographer was notified.'
            : 'More information requested from the photographer.',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
