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

  const isDirectNav = req.headers.get('accept')?.includes('text/html') || params.get('view') === '1';

  // 1. Links the applicant supplied themselves (for example a shared Drive file)
  if (!document.storage_path && document.external_url) {
    if (isDirectNav) {
      return NextResponse.redirect(document.external_url);
    }
    return NextResponse.json({ success: true, kind: 'external', url: document.external_url });
  }

  if (!isSafeStorageObjectPath(document.storage_path)) {
    return jsonError(400, 'The stored document reference is not a valid object path.');
  }

  // Verify ownership boundary
  if (!String(document.storage_path).startsWith(`${submission.user_id}/`)) {
    return jsonError(403, 'This document does not belong to that application.');
  }

  // Attempt signed URL first (valid for 10 minutes)
  const { data: signed, error: signError } = await admin.storage
    .from('creator-verification')
    .createSignedUrl(String(document.storage_path), 600);

  if (!signError && signed?.signedUrl) {
    if (isDirectNav) {
      return NextResponse.redirect(signed.signedUrl);
    }
    return NextResponse.json(
      { success: true, kind: 'storage', url: signed.signedUrl, expiresIn: 600 },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Fallback: If signed URL fails or bucket configuration restricts it, stream the buffer directly
  try {
    const { data: blob, error: downloadError } = await admin.storage
      .from('creator-verification')
      .download(String(document.storage_path));

    if (downloadError || !blob) {
      console.error('Signed URL and download fallback both failed:', signError?.message, downloadError?.message);
      return jsonError(500, 'Could not load document from storage.');
    }

    const mimeType = document.mime_type || blob.type || 'application/octet-stream';
    const fileName = document.file_name || 'verification-document';
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (streamErr: any) {
    console.error('Error streaming document fallback:', streamErr);
    return jsonError(500, 'Failed to stream document.');
  }
}
