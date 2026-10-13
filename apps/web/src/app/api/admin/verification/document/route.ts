import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin, jsonError } from '@/lib/server/session';
import { isSafeStorageObjectPath, isUuid } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/verification/document?submissionId=<uuid>&index=<n>
 *
 * Returns a short-lived signed URL for one verification document so a reviewer
 * can open it. The bucket is private and nothing about it is put in the queue
 * payload: the caller names a submission and an index, and the server resolves
 * the object path from the stored record. That keeps a reviewer from using this
 * endpoint to read another applicant's file, and keeps a document URL out of
 * any long-lived cache.
 */
export async function GET(req: NextRequest) {
  const auth = await authorizeAdmin('manage_photographer_verification');
  if (!auth.ok) return auth.response;
  const { admin } = auth;

  const params = new URL(req.url).searchParams;
  const submissionId = params.get('submissionId') || '';
  const index = Number.parseInt(params.get('index') || '', 10);
  if (!isUuid(submissionId)) return jsonError(400, 'Invalid submissionId.');
  if (!Number.isInteger(index) || index < 0 || index > 50) return jsonError(400, 'Invalid document index.');

  const { data: submission, error } = await admin
    .from('creator_verification_submissions')
    .select('id, user_id, status, documents')
    .eq('id', submissionId)
    .maybeSingle();

  if (error) return jsonError(500, 'Could not load the application.');
  if (!submission) return jsonError(404, 'Verification submission not found.');

  const documents = Array.isArray(submission.documents) ? (submission.documents as Array<Record<string, any>>) : [];
  const document = documents[index];
  if (!document) return jsonError(404, 'That document is not part of the application.');

  // Links the applicant supplied themselves (for example a shared Drive file)
  // are returned as-is; the reviewer already sees them in the submission.
  if (!document.storage_path && document.external_url) {
    return NextResponse.json({ success: true, kind: 'external', url: document.external_url });
  }
  if (!isSafeStorageObjectPath(document.storage_path)) {
    return jsonError(400, 'The stored document reference is not a valid object path.');
  }
  // The object must sit in the applicant's own folder, which is what the storage
  // policy enforced on upload.
  if (!String(document.storage_path).startsWith(`${submission.user_id}/`)) {
    return jsonError(403, 'This document does not belong to that application.');
  }

  const { data: signed, error: signError } = await admin.storage
    .from('creator-verification')
    .createSignedUrl(String(document.storage_path), 120);

  if (signError || !signed?.signedUrl) {
    console.error('Signed document URL failed:', signError?.message);
    return jsonError(500, 'Could not open the document. It may have been removed from storage.');
  }

  return NextResponse.json(
    { success: true, kind: 'storage', url: signed.signedUrl, expiresIn: 120 },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
