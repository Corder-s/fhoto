import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

export async function POST(req: NextRequest) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return jsonError(400, 'No file provided.');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return jsonError(400, 'Invalid file type. Allowed formats: JPG, PNG, WEBP, and PDF.');
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonError(400, 'File size exceeds maximum allowed limit of 15MB.');
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${user.id}/${Date.now()}-${cleanFileName}`;

    const { error: uploadError } = await admin.storage
      .from('support-attachments')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return jsonError(500, `Storage upload failed: ${uploadError.message}`);
    }

    // Generate signed URL valid for 30 days
    const { data: signedData, error: signError } = await admin.storage
      .from('support-attachments')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 30);

    const attachmentUrl = signedData?.signedUrl || `/api/support/attachment?path=${encodeURIComponent(storagePath)}`;

    return NextResponse.json({
      success: true,
      url: attachmentUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
  } catch (err: any) {
    return jsonError(500, err.message || 'Failed to process attachment upload.');
  }
}
