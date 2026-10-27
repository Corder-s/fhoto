import { NextRequest, NextResponse } from 'next/server';
import { authorize, getOrCreateOwnCreatorProfile, jsonError } from '@/lib/server/session';
import { cleanText, isSafeHttpsUrl, isUuid, matchesSessionUser } from '@/lib/server/policy';
import { revalidatePublicDirectory } from '@/lib/server/verification';

export const dynamic = 'force-dynamic';

const MEDIA_TYPES = ['photo', 'video'] as const;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);
const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/** GET: the caller's own portfolio items (creator role required). */
export async function GET(req: NextRequest) {
  const auth = await authorize({ roles: ['creator'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const { searchParams } = new URL(req.url);
  if (!matchesSessionUser(user.id, searchParams.get('userId'))) {
    return jsonError(403, 'You can only view your own portfolio.');
  }

  const creator = await getOrCreateOwnCreatorProfile(admin, user.id, user.name);
  if (searchParams.get('creatorId') && searchParams.get('creatorId') !== creator.id) {
    return jsonError(403, 'You can only view your own portfolio.');
  }

  const { data: items, error } = await admin
    .from('creator_portfolio_items')
    .select('*')
    .eq('creator_id', creator.id)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching creator portfolio items:', error.message);
    return jsonError(500, 'Could not load portfolio.');
  }

  return NextResponse.json({ success: true, items: items || [] });
}

/**
 * POST: add a portfolio item to the caller's own studio.
 * Supports both:
 * 1. multipart/form-data with a file (Upload Photo)
 * 2. application/json with previewUrl (Add by URL / external link)
 */
export async function POST(req: NextRequest) {
  const auth = await authorize({ roles: ['creator'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const creator = await getOrCreateOwnCreatorProfile(admin, user.id, user.name);
  const contentType = req.headers.get('content-type') || '';

  let finalPreviewUrl = '';
  let title = 'Untitled Portfolio Item';
  let description = 'Portrait';
  let mediaType: 'photo' | 'video' = 'photo';

  if (contentType.includes('multipart/form-data')) {
    // ----------------------------------------------------
    // Direct file upload to Supabase Storage via server
    // ----------------------------------------------------
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (e: any) {
      return jsonError(400, 'Invalid multipart/form-data payload.');
    }

    const file = formData.get('file') as File | null;
    if (!file || typeof file === 'string' || typeof (file as any).arrayBuffer !== 'function') {
      return jsonError(400, 'Please select a valid image file to upload.');
    }

    const mime = (file.type || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mime)) {
      return jsonError(400, 'Unsupported media format. Please upload JPG, PNG, WebP, GIF, or MP4.');
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return jsonError(400, 'Media file is too large. Maximum allowed size is 25 MB.');
    }

    const customTitle = formData.get('title') as string | null;
    const customCategory = formData.get('category') as string | null;
    const customDescription = formData.get('description') as string | null;

    title = cleanText(customTitle, 150) || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Portfolio Highlight';
    description = cleanText(customCategory || customDescription, 500) || 'Portrait';
    mediaType = mime.startsWith('video/') ? 'video' : 'photo';

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-60);
    const objectPath = `${user.id}/portfolio-${Date.now()}-${safeName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from('creator-portfolios')
      .upload(objectPath, fileBuffer, {
        contentType: mime,
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload failed for creator portfolio:', uploadError.message);
      return jsonError(500, `Storage upload failed: ${uploadError.message}`);
    }

    const { data: publicData } = admin.storage
      .from('creator-portfolios')
      .getPublicUrl(objectPath);

    finalPreviewUrl = publicData.publicUrl;
  } else {
    // ----------------------------------------------------
    // JSON payload: Add by URL
    // ----------------------------------------------------
    let body: Record<string, any>;
    try {
      body = await req.json();
    } catch {
      return jsonError(400, 'Invalid JSON payload.');
    }

    if (!matchesSessionUser(user.id, body.userId) || (body.creatorId && body.creatorId !== creator.id)) {
      return jsonError(403, 'You can only manage your own portfolio.');
    }

    const inputUrl = cleanText(body.previewUrl ?? body.imageUrl, 2000);
    if (!inputUrl) {
      return jsonError(400, 'Image preview URL is required.');
    }

    const urlStr = String(inputUrl);
    const isValidUrl = urlStr.startsWith('https://') || urlStr.startsWith('/reference-assets/');
    if (!isValidUrl) {
      return jsonError(400, 'A portfolio item needs a valid https URL or standard reference path.');
    }

    finalPreviewUrl = urlStr;
    title = cleanText(body.title, 150) || 'Untitled Portfolio Photo';
    description = cleanText(body.description ?? body.category, 500) || 'Portrait';
    mediaType = body.mediaType === 'video' ? 'video' : 'photo';
  }

  // Get current highest display_order
  const { data: maxOrderData } = await admin
    .from('creator_portfolio_items')
    .select('display_order')
    .eq('creator_id', creator.id)
    .order('display_order', { ascending: false })
    .limit(1);

  const nextOrder = (maxOrderData?.[0]?.display_order ?? -1) + 1;

  const { data, error } = await admin
    .from('creator_portfolio_items')
    .insert({
      creator_id: creator.id,
      title,
      description,
      preview_url: finalPreviewUrl,
      media_type: mediaType,
      display_order: nextOrder,
      is_published: true,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Database insert error for creator portfolio item:', error?.message);
    return jsonError(500, 'Could not save the portfolio item to database.');
  }

  revalidatePublicDirectory();

  return NextResponse.json({ success: true, item: data });
}

/**
 * PATCH: update metadata or reorder portfolio items.
 * Accepts:
 * - { id, title?, description?, displayOrder?, isPublished? }
 * - { items: Array<{ id: string, displayOrder: number }> }
 */
export async function PATCH(req: NextRequest) {
  const auth = await authorize({ roles: ['creator'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid JSON payload.');
  }

  const creator = await getOrCreateOwnCreatorProfile(admin, user.id, user.name);

  // Bulk reorder support
  if (Array.isArray(body.items)) {
    const updates = body.items.filter((item) => isUuid(item?.id) && Number.isInteger(item?.displayOrder));
    for (const update of updates) {
      await admin
        .from('creator_portfolio_items')
        .update({ display_order: update.displayOrder })
        .eq('id', update.id)
        .eq('creator_id', creator.id);
    }
    revalidatePublicDirectory();
    return NextResponse.json({ success: true, message: 'Portfolio order updated.' });
  }

  const { id } = body;
  if (!id || !isUuid(id)) {
    return jsonError(400, 'Valid portfolio item identifier is required.');
  }

  const patchFields: Record<string, any> = {};
  if (body.title !== undefined) patchFields.title = cleanText(body.title, 150) || 'Untitled Photo';
  if (body.description !== undefined) patchFields.description = cleanText(body.description, 500) || '';
  if (body.category !== undefined) patchFields.description = cleanText(body.category, 500) || '';
  if (body.displayOrder !== undefined && Number.isInteger(body.displayOrder)) patchFields.display_order = body.displayOrder;
  if (body.isPublished !== undefined) patchFields.is_published = Boolean(body.isPublished);

  if (Object.keys(patchFields).length === 0) {
    return jsonError(400, 'No valid fields provided to update.');
  }

  const { data, error } = await admin
    .from('creator_portfolio_items')
    .update(patchFields)
    .eq('id', id)
    .eq('creator_id', creator.id)
    .select()
    .single();

  if (error || !data) {
    return jsonError(500, 'Could not update portfolio item.');
  }

  revalidatePublicDirectory();
  return NextResponse.json({ success: true, item: data });
}

/** DELETE ?id=<uuid>: remove one of the caller's own portfolio items. */
export async function DELETE(req: NextRequest) {
  const auth = await authorize({ roles: ['creator'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return jsonError(400, 'Portfolio item ID is required');
  if (!isUuid(id)) return jsonError(400, 'Invalid portfolio item identifier.');

  const creator = await getOrCreateOwnCreatorProfile(admin, user.id, user.name);

  const { data: item } = await admin
    .from('creator_portfolio_items')
    .select('id, creator_id, preview_url')
    .eq('id', id)
    .maybeSingle();

  if (!item || item.creator_id !== creator.id) {
    return jsonError(404, 'Portfolio item not found.');
  }

  // Attempt storage object cleanup if hosted in our creator-portfolios bucket
  try {
    if (item.preview_url && item.preview_url.includes('/creator-portfolios/')) {
      const parts = item.preview_url.split('/creator-portfolios/');
      if (parts[1]) {
        const objectPath = decodeURIComponent(parts[1]);
        if (objectPath.startsWith(`${user.id}/`)) {
          await admin.storage.from('creator-portfolios').remove([objectPath]);
        }
      }
    }
  } catch (storageErr) {
    console.warn('Non-fatal error removing storage object during portfolio item deletion:', storageErr);
  }

  const { error } = await admin
    .from('creator_portfolio_items')
    .delete()
    .eq('id', id)
    .eq('creator_id', creator.id);

  if (error) {
    return jsonError(500, 'Could not delete the portfolio item.');
  }

  revalidatePublicDirectory();
  return NextResponse.json({ success: true, message: 'Portfolio item deleted.' });
}
