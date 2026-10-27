import { NextRequest, NextResponse } from 'next/server';
import { authorize, getOrCreateOwnCreatorProfile, jsonError } from '@/lib/server/session';
import { cleanText, isSafeHttpsUrl, matchesSessionUser } from '@/lib/server/policy';
import { revalidatePublicDirectory } from '@/lib/server/verification';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const MAX_BANNER_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * GET /api/photographers/banner
 * Returns the current cover banner URL for the creator.
 */
export async function GET(req: NextRequest) {
  const auth = await authorize({ roles: ['creator'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const { searchParams } = new URL(req.url);
  if (!matchesSessionUser(user.id, searchParams.get('userId'))) {
    return jsonError(403, 'You can only view your own banner.');
  }

  const creator = await getOrCreateOwnCreatorProfile(admin, user.id, user.name);

  return NextResponse.json({
    success: true,
    bannerUrl: creator.cover_image_url || null,
  });
}

/**
 * POST /api/photographers/banner
 * Sets or replaces the creator's cover banner image.
 * Accepts JSON { bannerUrl } or multipart/form-data with a file.
 */
export async function POST(req: NextRequest) {
  const auth = await authorize({ roles: ['creator'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const creator = await getOrCreateOwnCreatorProfile(admin, user.id, user.name);
  const contentType = req.headers.get('content-type') || '';
  let finalBannerUrl: string | null = null;

  if (contentType.includes('multipart/form-data')) {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return jsonError(400, 'Invalid multipart/form-data payload.');
    }

    const file = formData.get('file') as File | null;
    if (!file || typeof file === 'string' || typeof (file as any).arrayBuffer !== 'function') {
      return jsonError(400, 'No image file provided in upload request.');
    }

    const mime = (file.type || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mime)) {
      return jsonError(400, 'Please upload a valid image file (JPG, PNG, or WebP).');
    }
    if (file.size > MAX_BANNER_SIZE_BYTES) {
      return jsonError(400, 'Banner image must be 15 MB or smaller.');
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-60);
    const objectPath = `${user.id}/banner-${Date.now()}-${safeName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from('creator-portfolios')
      .upload(objectPath, fileBuffer, {
        contentType: mime,
        upsert: true,
      });

    if (uploadError) {
      console.error('Banner upload to storage failed:', uploadError.message);
      return jsonError(500, `Could not upload banner to storage: ${uploadError.message}`);
    }

    const { data: publicUrlData } = admin.storage
      .from('creator-portfolios')
      .getPublicUrl(objectPath);

    finalBannerUrl = publicUrlData.publicUrl;
  } else {
    let body: Record<string, any>;
    try {
      body = await req.json();
    } catch {
      return jsonError(400, 'Invalid JSON payload.');
    }

    const bannerUrl = cleanText(body.bannerUrl, 2000);
    const isValidUrl = Boolean(
      bannerUrl && (bannerUrl.startsWith('/reference-assets/') || isSafeHttpsUrl(bannerUrl))
    );
    if (!bannerUrl || !isValidUrl) {
      return jsonError(400, 'A valid https image URL is required for the banner.');
    }
    finalBannerUrl = bannerUrl;
  }

  // Clean up old banner if it was in our creator-portfolios bucket and owned by user
  if (creator.cover_image_url && creator.cover_image_url.includes('/creator-portfolios/')) {
    try {
      const parts = creator.cover_image_url.split('/creator-portfolios/');
      if (parts[1]) {
        const oldPath = decodeURIComponent(parts[1]);
        if (oldPath.startsWith(`${user.id}/`)) {
          await admin.storage.from('creator-portfolios').remove([oldPath]);
        }
      }
    } catch {
      // non-fatal
    }
  }

  const { error: updateError } = await admin
    .from('creator_profiles')
    .update({
      cover_image_url: finalBannerUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', creator.id);

  if (updateError) {
    console.error('Failed to update creator cover_image_url:', updateError.message);
    return jsonError(500, 'Could not save banner to your profile.');
  }

  revalidatePublicDirectory();

  return NextResponse.json({
    success: true,
    bannerUrl: finalBannerUrl,
    message: 'Profile cover banner updated successfully.',
  });
}

/**
 * DELETE /api/photographers/banner
 * Removes the creator's cover banner.
 */
export async function DELETE(req: NextRequest) {
  const auth = await authorize({ roles: ['creator'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const creator = await getOrCreateOwnCreatorProfile(admin, user.id, user.name);

  // Clean up storage object if present
  if (creator.cover_image_url && creator.cover_image_url.includes('/creator-portfolios/')) {
    try {
      const parts = creator.cover_image_url.split('/creator-portfolios/');
      if (parts[1]) {
        const oldPath = decodeURIComponent(parts[1]);
        if (oldPath.startsWith(`${user.id}/`)) {
          await admin.storage.from('creator-portfolios').remove([oldPath]);
        }
      }
    } catch {
      // non-fatal
    }
  }

  const { error } = await admin
    .from('creator_profiles')
    .update({
      cover_image_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', creator.id);

  if (error) {
    return jsonError(500, 'Could not remove cover banner.');
  }

  revalidatePublicDirectory();

  return NextResponse.json({
    success: true,
    message: 'Cover banner removed.',
  });
}
