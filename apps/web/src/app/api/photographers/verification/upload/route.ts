import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * POST /api/photographers/verification/upload
 * Securely uploads an applicant's verification document (Government ID or Gear Invoice)
 * to the private 'creator-verification' Supabase Storage bucket.
 */
export async function POST(req: NextRequest) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  try {
    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('document')) as File | null;
    const documentType = (formData.get('type') || formData.get('documentType') || 'government_id') as string;

    if (!file || typeof file === 'string' || typeof (file as any).arrayBuffer !== 'function') {
      return jsonError(400, 'Please select a valid document or image file to upload.');
    }

    const mimeType = file.type?.toLowerCase() || '';
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return jsonError(400, 'Unsupported file format. Please upload a PDF, JPG, PNG, or WebP document.');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return jsonError(400, 'Document file is too large. Maximum allowed size is 25 MB.');
    }

    // Determine extension
    const ext = mimeType === 'application/pdf' ? 'pdf'
      : mimeType === 'image/jpeg' ? 'jpg'
      : mimeType === 'image/png' ? 'png'
      : mimeType === 'image/webp' ? 'webp'
      : 'bin';

    const safeOriginalName = file.name.replace(/[^A-Za-z0-9._-]+/g, '-').slice(-80) || 'document';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeOriginalName}`;
    const objectPath = `${user.id}/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to 'creator-verification' bucket using service role client
    const { error: uploadError } = await admin.storage
      .from('creator-verification')
      .upload(objectPath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading verification document:', uploadError);
      return jsonError(500, `Could not store verification document: ${uploadError.message}`);
    }

    return NextResponse.json({
      success: true,
      document: {
        type: documentType,
        storage_path: objectPath,
        file_name: file.name,
        mime_type: mimeType,
        size_bytes: file.size,
      },
    });
  } catch (err: any) {
    console.error('Exception in verification document upload:', err);
    return jsonError(500, err?.message || 'Error uploading document.');
  }
}
