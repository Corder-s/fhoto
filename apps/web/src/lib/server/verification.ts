import type { SupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import {
  canFileVerificationApplication,
  cleanText,
  sanitizeVerificationSubmission,
  verificationDecision,
  verificationFilingBlockReason,
  type SanitizedVerificationSubmission,
} from './policy';

/**
 * Photographer verification workflow.
 *
 * Both dashboards and the public directory read the same two tables:
 *   creator_profiles.verification_status  -> publication state (directory, profile page)
 *   creator_verification_submissions      -> the application being reviewed
 *
 * The migration's triggers keep those two in sync (see
 * supabase/migrations/20261013000002_owner_roles_admin_permissions_and_verification.sql),
 * so this module writes a submission and never hand-edits the publication state
 * to "make the UI agree". Revalidation of the public routes happens after a
 * decision so an approval is visible without a redeploy.
 */

export const SUBMISSION_STATUSES = ['pending', 'approved', 'rejected', 'needs_info', 'all'] as const;

/**
 * Postgres 42P01 (undefined_table) means this project has not had
 * supabase/migrations/20261013000002_owner_roles_admin_permissions_and_verification.sql
 * applied yet. Routes answer 501 with that instruction instead of a bare 500,
 * because nobody should have to guess that the fix is a deployment step.
 */
export function isMissingRelationError(
  error: { code?: string; message?: string } | string | null | undefined
) {
  if (!error) return false;
  if (typeof error === 'string') return /does not exist|could not find the table/i.test(error);
  return error.code === '42P01' || /does not exist|could not find the table/i.test(error.message || '');
}

export const MIGRATION_REQUIRED_MESSAGE =
  'Verification and administrator-permission storage is not set up on this project yet. Apply ' +
  'supabase/migrations/20261013000002_owner_roles_admin_permissions_and_verification.sql ' +
  '(supabase db push, or the SQL editor) and try again.';

export type SubmissionStatusFilter = (typeof SUBMISSION_STATUSES)[number];

export interface SubmissionRow {
  id: string;
  creator_id: string;
  user_id: string;
  reference_code: string;
  status: string;
  legal_name: string | null;
  contact_phone: string | null;
  government_id_type: string | null;
  government_id_masked: string | null;
  gstin: string | null;
  business_name: string | null;
  equipment_summary: string | null;
  categories: string[] | null;
  city: string | null;
  state: string | null;
  service_radius_km: number | null;
  portfolio_url: string | null;
  documents: unknown;
  applicant_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  review_reason: string | null;
  review_notes: string | null;
  reviewer: { full_name: string | null; email: string | null } | null;
  creator: {
    id: string;
    professional_name: string | null;
    verification_status: string | null;
    average_rating: number | string | null;
    total_reviews: number | null;
  } | null;
  applicant: { full_name: string | null; email: string | null; account_status: string | null } | null;
}

const SUBMISSION_SELECT = `
  id,
  creator_id,
  user_id,
  reference_code,
  status,
  legal_name,
  contact_phone,
  government_id_type,
  government_id_masked,
  gstin,
  business_name,
  equipment_summary,
  categories,
  city,
  state,
  service_radius_km,
  portfolio_url,
  documents,
  applicant_notes,
  submitted_at,
  reviewed_at,
  review_reason,
  review_notes,
  reviewer:profiles!creator_verification_submissions_reviewed_by_fkey ( full_name, email ),
  creator:creator_profiles ( id, professional_name, verification_status, average_rating, total_reviews ),
  applicant:profiles!creator_verification_submissions_user_id_fkey ( full_name, email, account_status )
`;

/**
 * Admin-facing queue. `status = 'all'` returns every application so a reviewer
 * can look at history; results are newest-first and capped.
 */
export async function listVerificationSubmissions(
  admin: SupabaseClient,
  options: { status?: string; limit?: number } = {}
): Promise<{ rows: SubmissionRow[]; error: string | null }> {
  const status = options.status && (SUBMISSION_STATUSES as readonly string[]).includes(options.status)
    ? (options.status as SubmissionStatusFilter)
    : 'pending';
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 200);

  let query = admin
    .from('creator_verification_submissions')
    .select(SUBMISSION_SELECT)
    .order('submitted_at', { ascending: false })
    .limit(limit);

  if (status !== 'all') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    return { rows: [], error: error.message };
  }
  return { rows: (data || []) as unknown as SubmissionRow[], error: null };
}

/** The signed-in photographer's own view: current publication state plus history. */
export async function getMyVerification(admin: SupabaseClient, userId: string) {
  const { data: creator } = await admin
    .from('creator_profiles')
    .select(
      'id, user_id, professional_name, biography, city, state, service_radius, portfolio_url, verification_status, experience_years, updated_at'
    )
    .eq('user_id', userId)
    .maybeSingle();

  let submissions: Array<Record<string, unknown>> = [];
  if (creator?.id) {
    const { data, error } = await admin
      .from('creator_verification_submissions')
      .select(
        'id, reference_code, status, legal_name, government_id_type, government_id_masked, gstin, business_name, equipment_summary, categories, city, state, service_radius_km, portfolio_url, documents, applicant_notes, submitted_at, reviewed_at, review_reason, review_notes'
      )
      .eq('creator_id', creator.id)
      .order('submitted_at', { ascending: false })
      .limit(10);
    if (error) return { creator: creator || null, submissions: [], error: error.message };
    submissions = (data || []) as Array<Record<string, unknown>>;
  }

  return { creator: creator || null, submissions, error: null };
}

/**
 * One place that turns a database failure into the response a caller should see:
 * 501 with the migration instruction when the new tables are missing, 500 with a
 * generic message otherwise (the raw Postgres text stays in the server log).
 */
function dbFailure(
  error: { code?: string; message?: string } | null | undefined,
  fallback: string
): { ok: false; status: number; error: string } {
  if (isMissingRelationError(error)) return { ok: false, status: 501, error: MIGRATION_REQUIRED_MESSAGE };
  if (error) console.error('[verification] database failure:', error.code || '', error.message || '');
  return { ok: false, status: 500, error: fallback };
}

function referenceCode(seed: string): string {
  const tail = seed.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase().padStart(6, '0');
  const random = Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase().padStart(6, '0');
  return `VER-${tail}-${random}`;
}

/**
 * Files (or re-files) an application for the signed-in photographer.
 *
 * The submission is written with status `pending`, which the database mirrors
 * onto `creator_profiles.verification_status`, so the admin queue and the
 * public directory update together. Profile details are refreshed from the
 * submitted values but the verification state is never written here.
 */
export async function fileVerificationApplication(
  admin: SupabaseClient,
  userId: string,
  body: Record<string, any>
): Promise<
  | { ok: true; submissionId: string; referenceCode: string; resubmission: boolean }
  | { ok: false; status: number; error: string }
> {
  const { data: creator } = await admin
    .from('creator_profiles')
    .select('id, verification_status, user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!creator) {
    return {
      ok: false,
      status: 409,
      error: 'Create your photographer profile first (onboarding), then submit verification.',
    };
  }

  if (!canFileVerificationApplication(creator.verification_status)) {
    return {
      ok: false,
      status: 409,
      error:
        verificationFilingBlockReason(creator.verification_status) ||
        'A verification decision is already recorded for this profile.',
    };
  }

  const existingPending = await admin
    .from('creator_verification_submissions')
    .select('id')
    .eq('creator_id', creator.id)
    .eq('status', 'pending')
    .maybeSingle();
  if (existingPending.error) {
    return dbFailure(existingPending.error, 'Could not check your existing application.');
  }
  if (existingPending.data) {
    return { ok: false, status: 409, error: 'Your application is already under review.' };
  }

  const sanitized = sanitizeVerificationSubmission(body || {});
  if (!sanitized.ok) {
    return { ok: false, status: sanitized.status, error: sanitized.error };
  }

  const payload = sanitized.value;
  const now = new Date().toISOString();
  const code = referenceCode(userId);

  const { data: submission, error: insertError } = await admin
    .from('creator_verification_submissions')
    .insert({
      creator_id: creator.id,
      user_id: userId,
      reference_code: code,
      status: 'pending',
      ...payload,
      submitted_at: now,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();

  if (insertError || !submission) {
    console.error('Verification submission failed:', insertError?.message);
    return dbFailure(insertError, 'Could not submit your verification application.');
  }

  // Public profile details follow the application. verification_status is
  // deliberately absent: the insert trigger owns it, and touching that column
  // here would make the reviewer triggers chase each other.
  const profilePatch = buildProfilePatch(payload);
  if (Object.keys(profilePatch).length > 0) {
    const { error: patchError } = await admin.from('creator_profiles').update(profilePatch).eq('id', creator.id);
    if (patchError) console.error('Could not sync profile details after verification filing:', patchError.message);
  }

  return {
    ok: true,
    submissionId: submission.id as string,
    referenceCode: code,
    resubmission: creator.verification_status === 'rejected' || creator.verification_status === 'suspended',
  };
}

function buildProfilePatch(payload: SanitizedVerificationSubmission): Record<string, unknown> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.business_name) patch.professional_name = payload.business_name;
  if (payload.city) patch.city = payload.city;
  if (payload.state) patch.state = payload.state;
  if (payload.service_radius_km) patch.service_radius = payload.service_radius_km;
  if (payload.portfolio_url) patch.portfolio_url = payload.portfolio_url;
  if (payload.equipment_summary) patch.biography = payload.equipment_summary.slice(0, 2000);
  return Object.keys(patch).length > 1 ? patch : {};
}

export interface ReviewOutcome {
  ok: true;
  submissionId: string;
  status: string;
  creatorId: string;
  userId: string;
  /** creator_profiles.verification_status after the decision. */
  profileStatus: string;
  published: boolean;
}

/**
 * Records a reviewer decision. The submission row is the only thing written
 * here; the profile's publication state and the photographer's notification
 * are produced by the database triggers, so no caller can approve a profile in
 * one table and forget the other.
 */
export async function reviewVerificationSubmission(
  admin: SupabaseClient,
  options: {
    submissionId: string;
    action: unknown;
    reason?: unknown;
    notes?: unknown;
    reviewerId: string;
  }
): Promise<ReviewOutcome | { ok: false; status: number; error: string }> {
  const decision = verificationDecision(options.action, options.reason);
  if (!decision.ok) return { ok: false, status: decision.status, error: decision.error };

  const { data: submission, error: fetchError } = await admin
    .from('creator_verification_submissions')
    .select('id, creator_id, user_id, status, review_reason')
    .eq('id', options.submissionId)
    .maybeSingle();

  if (fetchError) return dbFailure(fetchError, 'Could not load the application.');
  if (!submission) return { ok: false, status: 404, error: 'Verification submission not found.' };

  if (submission.user_id === options.reviewerId) {
    return { ok: false, status: 403, error: 'You cannot review your own application.' };
  }
  if (submission.status !== 'pending' && submission.status !== 'needs_info') {
    return {
      ok: false,
      status: 409,
      error: `This application was already ${submission.status}. Reload the queue.`,
    };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from('creator_verification_submissions')
    .update({
      status: decision.status,
      reviewed_at: now,
      reviewed_by: options.reviewerId,
      review_reason: cleanText(options.reason, 1000),
      review_notes: cleanText(options.notes, 1000),
      updated_at: now,
    })
    .eq('id', options.submissionId);

  if (updateError) {
    console.error('Verification review failed:', updateError.message);
    return dbFailure(updateError, 'Could not record the review decision.');
  }

  // Reflect the state the database settled on rather than assuming it matches
  // the requested decision.
  const { data: creator } = await admin
    .from('creator_profiles')
    .select('id, verification_status')
    .eq('id', submission.creator_id)
    .maybeSingle();

  revalidatePublicDirectory();

  return {
    ok: true,
    submissionId: options.submissionId,
    status: decision.status,
    creatorId: submission.creator_id,
    userId: submission.user_id,
    profileStatus: creator?.verification_status || decision.profileStatus,
    published: creator?.verification_status === 'approved',
  };
}

/**
 * The public catalogue is served from /explore (and /photographers, which
 * redirects there), and individual profiles from /photographers/<id>. Both read
 * through /api/photographers, which is force-dynamic, so a fresh page view
 * already sees a new decision; the calls below additionally drop the Next.js
 * router cache for those routes so an approval is visible on the page a visitor
 * still has open. Revalidating the layout-free dynamic segment covers every
 * photographer profile without enumerating ids.
 */
export function revalidatePublicDirectory() {
  try {
    revalidatePath('/explore');
    revalidatePath('/photographers');
    revalidatePath('/photographers/[id]', 'page');
  } catch (error) {
    // revalidatePath outside a request context is a no-op in tests; never fail a
    // committed database write because of it.
    console.warn('Directory revalidation skipped:', (error as Error)?.message);
  }
}
