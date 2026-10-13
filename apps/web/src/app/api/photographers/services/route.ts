import { NextRequest, NextResponse } from 'next/server';
import { authorize, getOwnCreatorProfile, jsonError } from '@/lib/server/session';
import { cleanText, isUuid, matchesSessionUser } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

/** Creator must be signed in with the creator role; the studio is resolved from the session. */
async function requireOwnStudio(userId: string, admin: Parameters<typeof getOwnCreatorProfile>[0]) {
  const creator = await getOwnCreatorProfile(admin, userId);
  if (!creator) return { error: jsonError(403, 'Creator profile not found for this account.') };
  return { creator };
}

export async function GET(req: NextRequest) {
  const auth = await authorize({ roles: ['creator'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const { searchParams } = new URL(req.url);
  if (!matchesSessionUser(user.id, searchParams.get('userId'))) {
    return jsonError(403, 'You can only view your own packages.');
  }

  const own = await requireOwnStudio(user.id, admin);
  if (own.error) return own.error;

  const { data: services, error } = await admin
    .from('creator_services')
    .select('*, service_categories(name)')
    .eq('creator_id', own.creator.id)
    .order('base_price', { ascending: true });

  if (error) return jsonError(500, 'Could not load packages.');
  return NextResponse.json({ success: true, services: services || [] });
}

/**
 * POST /api/photographers/services
 * Creates a package, or updates one when `id` is supplied. Updates are limited to
 * packages that belong to the caller's studio.
 */
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

  const own = await requireOwnStudio(user.id, admin);
  if (own.error) return own.error;

  // The studio is resolved from the session; a client-supplied creatorId is accepted only if it is the caller's own.
  if (!matchesSessionUser(user.id, body.userId) || (body.creatorId && body.creatorId !== own.creator.id)) {
    return jsonError(403, 'You can only manage your own packages.');
  }

  const { id } = body;
  if (id !== undefined && id !== null && id !== '' && !isUuid(id)) {
    return jsonError(400, 'Invalid package identifier.');
  }

  // Updates may send only the fields that changed (e.g. the active toggle); missing fields keep their stored values.
  let existingRow: Record<string, any> | null = null;
  if (id) {
    const { data: existing } = await admin
      .from('creator_services')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!existing || existing.creator_id !== own.creator.id) {
      return jsonError(404, 'Package not found');
    }
    existingRow = existing;
  }
  const has = (key: string) => body[key] !== undefined;

  const title = has('title') ? cleanText(body.title, 150) : existingRow?.title ?? null;
  if (!title) return jsonError(400, 'Package title is required.');

  const basePrice = has('basePrice') ? Number(body.basePrice) : Number(existingRow?.base_price);
  if (!Number.isFinite(basePrice) || basePrice < 0 || basePrice > 10_000_000) {
    return jsonError(400, 'Price must be a number between 0 and 10,000,000 INR.');
  }
  const durationMinutes = has('durationMinutes')
    ? Number(body.durationMinutes)
    : Number(existingRow?.duration_minutes ?? 120);
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0 || durationMinutes > 24 * 60) {
    return jsonError(400, 'Duration must be a whole number of minutes between 1 and 1440.');
  }
  const deliveryTimeHours = has('deliveryTimeHours')
    ? Number(body.deliveryTimeHours)
    : Number(existingRow?.delivery_time_hours ?? 48);
  if (!Number.isInteger(deliveryTimeHours) || deliveryTimeHours <= 0 || deliveryTimeHours > 24 * 90) {
    return jsonError(400, 'Delivery time must be a whole number of hours between 1 and 2160.');
  }

  const payload = {
    creator_id: own.creator.id,
    title,
    description: has('description')
      ? cleanText(body.description, 2000) || 'High-res retouched photographs and private client gallery.'
      : existingRow?.description ?? 'High-res retouched photographs and private client gallery.',
    base_price: basePrice,
    duration_minutes: durationMinutes,
    delivery_time_hours: deliveryTimeHours,
    is_active: has('isActive') ? Boolean(body.isActive) : existingRow?.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { data, error } = await admin
      .from('creator_services')
      .update(payload)
      .eq('id', id)
      .eq('creator_id', own.creator.id)
      .select()
      .single();
    if (error) return jsonError(500, 'Could not update the package.');
    return NextResponse.json({ success: true, service: data });
  }

  const { data, error } = await admin.from('creator_services').insert(payload).select().single();
  if (error) return jsonError(500, 'Could not create the package.');
  return NextResponse.json({ success: true, service: data });
}

/**
 * DELETE /api/photographers/services?id=<uuid>
 * Packages referenced by bookings cannot be removed (booking history must stay intact),
 * so they are deactivated instead and stop appearing in the public catalogue.
 */
export async function DELETE(req: NextRequest) {
  const auth = await authorize({ roles: ['creator'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return jsonError(400, 'Service ID is required');
  if (!isUuid(id)) return jsonError(400, 'Invalid service identifier.');

  const own = await requireOwnStudio(user.id, admin);
  if (own.error) return own.error;

  const { data: existing } = await admin
    .from('creator_services')
    .select('id, creator_id')
    .eq('id', id)
    .maybeSingle();
  if (!existing || existing.creator_id !== own.creator.id) {
    return jsonError(404, 'Package not found');
  }

  const { error } = await admin.from('creator_services').delete().eq('id', id).eq('creator_id', own.creator.id);
  if (!error) return NextResponse.json({ success: true, deleted: true });

  if (error.code === '23503') {
    const { error: deactivateErr } = await admin
      .from('creator_services')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('creator_id', own.creator.id);
    if (deactivateErr) return jsonError(500, 'Could not remove the package.');
    return NextResponse.json({
      success: true,
      deleted: false,
      deactivated: true,
      message: 'Package has bookings and was hidden instead of deleted.',
    });
  }

  return jsonError(500, 'Could not remove the package.');
}
