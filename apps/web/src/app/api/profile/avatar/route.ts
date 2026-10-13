import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/profile/avatar
 * Uploads a profile picture to Supabase Storage ('profile-avatars' bucket)
 * and updates profiles.avatar_url in the database.
 */
export async function POST(req: NextRequest) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  try {
    const formData = await req.formData();
    const file = (formData.get('avatar') || formData.get('file')) as File | null;

    if (!file || typeof file === 'string' || typeof (file as any).arrayBuffer !== 'function') {
      return jsonError(400, 'Please select a valid image file to upload.');
    }

    // Validate mime type
    const mimeType = file.type?.toLowerCase() || '';
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return jsonError(400, 'Unsupported file format. Please upload a JPG, PNG, WebP, or GIF image.');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return jsonError(400, 'Image file is too large. Maximum allowed size is 5 MB.');
    }

    // Determine extension
    const ext = mimeType === 'image/jpeg' ? 'jpg'
      : mimeType === 'image/png' ? 'png'
      : mimeType === 'image/webp' ? 'webp'
      : mimeType === 'image/gif' ? 'gif'
      : 'jpg';

    // File path must be prefixed with user.id to satisfy Supabase storage ownership policies
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const objectPath = `${user.id}/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage using service role client
    const { error: uploadError } = await admin.storage
      .from('profile-avatars')
      .upload(objectPath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading avatar to Supabase Storage:', uploadError);
      return jsonError(500, `Could not store avatar image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicData } = admin.storage
      .from('profile-avatars')
      .getPublicUrl(objectPath);

    const publicUrl = publicData.publicUrl;

    if (!publicUrl) {
      return jsonError(500, 'Failed to generate public URL for uploaded avatar.');
    }

    // Update database profiles.avatar_url
    const { error: dbError } = await admin
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (dbError) {
      console.error('Error updating profiles.avatar_url in database:', dbError);
      return jsonError(500, `Uploaded image but failed to update profile: ${dbError.message}`);
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: 'Profile picture updated successfully.',
    });
  } catch (err: any) {
    console.error('Unexpected error in POST /api/profile/avatar:', err);
    return jsonError(500, err?.message || 'Internal server error while uploading avatar.');
  }
}

/**
 * DELETE /api/profile/avatar
 * Removes the user's avatar from profiles.avatar_url.
 */
export async function DELETE() {
  const auth = await authorize();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  try {
    const { error } = await admin
      .from('profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error removing avatar:', error);
      return jsonError(500, 'Could not remove profile picture.');
    }

    return NextResponse.json({
      success: true,
      message: 'Profile picture removed successfully.',
    });
  } catch (err: any) {
    console.error('Unexpected error in DELETE /api/profile/avatar:', err);
    return jsonError(500, err?.message || 'Internal server error.');
  }
}
