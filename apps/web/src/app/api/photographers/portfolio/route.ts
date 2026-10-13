import { NextRequest, NextResponse } from 'next/server';
import { authorize, getOwnCreatorProfile, jsonError } from '@/lib/server/session';
import { cleanText, isSafeHttpsUrl, isUuid, matchesSessionUser } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

const MEDIA_TYPES = ['photo', 'video'] as const;

/** GET: the caller's own portfolio items (creator role required). */
export async function GET(req: NextRequest) {
  const auth = await authorize({ roles: ['creator'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const { searchParams } = new URL(req.url);
  if (!matchesSessionUser(user.id, searchParams.get('userId'))) {
    return jsonError(403, 'You can only view your own portfolio.');
  }
  const creator = await getOwnCreatorProfile(admin, user.id);
  if (!creator) return NextResponse.json({ success: true, items: [] });
  if (searchParams.get('creatorId') && searchParams.get('creatorId') !== creator.id) {
    return jsonError(403, 'You can only view your own portfolio.');
  }

  const { data: items, error } = await admin
    .from('creator_portfolio_items')
    .select('*')
    .eq('creator_id', creator.id)
    .order('display_order', { ascending: true });

  if (error) return jsonError(500, 'Could not load portfolio.');
  return NextResponse.json({ success: true, items: items || [] });
}

/** POST: add a portfolio item to the caller's own studio. */
export async function POST(req: NextRequest) {
  const auth = await authorize({ roles: ['creator'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid JSON payload.');
  }

  const creator = await getOwnCreatorProfile(admin, user.id);
  if (!creator) return jsonError(403, 'Creator profile not found for this account.');
  if (!matchesSessionUser(user.id, body.userId) || (body.creatorId && body.creatorId !== creator.id)) {
    return jsonError(403, 'You can only manage your own portfolio.');
  }

  if (!isSafeHttpsUrl(body.previewUrl)) {
    return jsonError(400, 'A portfolio item needs an https preview URL.');
  }
  const mediaType = body.mediaType === undefined ? 'photo' : body.mediaType;
  if (!(MEDIA_TYPES as readonly string[]).includes(mediaType)) {
    return jsonError(400, 'mediaType must be "photo" or "video".');
  }

  const { data, error } = await admin
    .from('creator_portfolio_items')
    .insert({
      creator_id: creator.id,
      title: cleanText(body.title, 150) || 'Untitled Portfolio Photo',
      description: cleanText(body.description, 500) || 'Portfolio Showcase',
      preview_url: body.previewUrl,
      media_type: mediaType,
      is_published: true,
    })
    .select()
    .single();

  if (error) return jsonError(500, 'Could not add the portfolio item.');
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

  const creator = await getOwnCreatorProfile(admin, user.id);
  if (!creator) return jsonError(403, 'Creator profile not found for this account.');

  const { data: item } = await admin
    .from('creator_portfolio_items')
    .select('id, creator_id')
    .eq('id', id)
    .maybeSingle();
  if (!item || item.creator_id !== creator.id) {
    return jsonError(404, 'Portfolio item not found');
  }

  const { error } = await admin
    .from('creator_portfolio_items')
    .delete()
    .eq('id', id)
    .eq('creator_id', creator.id);

  if (error) return jsonError(500, 'Could not delete the portfolio item.');
  return NextResponse.json({ success: true });
}
