import { NextRequest, NextResponse } from 'next/server';
import { authorize, getOwnCreatorProfile, jsonError } from '@/lib/server/session';
import { cleanText, isSafeHttpsUrl, matchesSessionUser } from '@/lib/server/policy';
import { revalidatePublicDirectory } from '@/lib/server/verification';

export const dynamic = 'force-dynamic';

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

  const creator = await getOwnCreatorProfile(admin, user.id);
  if (!creator) return jsonError(404, 'Creator profile not found.');

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

  const creator = await getOwnCreatorProfile(admin, user.id);
  if (!creator) return jsonError(404, 'Creator profile not found.');

  const contentType = req.headers.get('content-type') || '';
  let finalBannerUrl: string | null = null;

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return jsonError(400, 'No file provided in form data.');

    if (!file.type.startsWith('image/')) {
      return jsonError(400, 'Please upload a valid image file (JPG, PNG, WebP).');
    }
    if (file.size > 15 * 1024 * 1024) {
      return jsonError(400, 'Banner image must be 15 MB or smaller.');
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-60);
    const objectPath = `${user.id}/banner-${Date.now()}-${safeName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from('creator-portfolios')
      .upload(objectPath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Banner upload to storage failed:', uploadError.message);
      return jsonError(500, 'Could not upload banner to storage.');
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
    const isValidUrl = Boolean(bannerUrl && (bannerUrl.startsWith('/') || bannerUrl.startsWith('https://')));
    if (!bannerUrl || !isValidUrl) {
      return jsonError(400, 'A valid image URL is required for the banner.');
    }
    finalBannerUrl = bannerUrl;
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

  const creator = await getOwnCreatorProfile(admin, user.id);
  if (!creator) return jsonError(404, 'Creator profile not found.');

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
