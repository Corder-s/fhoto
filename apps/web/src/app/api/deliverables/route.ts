import { NextRequest, NextResponse } from 'next/server';
import { authorize, getOwnCreatorProfile, jsonError } from '@/lib/server/session';
import { cleanText, isSafeHttpsUrl, isUuid } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

// Google Drive link validator regex
const GOOGLE_DRIVE_REGEX = /^https:\/\/(drive|docs)\.google\.com\/(file\/d\/|drive\/folders\/|open\?id=|document\/d\/)[a-zA-Z0-9_-]+/;

const DELIVERABLE_TYPES = [
  'raw_photos', 'raw_video', 'edited_photos', 'edited_video', 'final_album', 'project_files', 'other',
] as const;
const STORAGE_PROVIDERS = ['supabase_storage', 'google_drive', 'external_video', 'other_external'] as const;

/**
 * Loads a booking and determines the caller's relationship to it.
 * Returns null when the booking does not exist or the caller is not a participant.
 */
async function loadBookingForParticipant(
  admin: Parameters<typeof getOwnCreatorProfile>[0],
  bookingId: string,
  userId: string,
  isAdmin: boolean
) {
  const { data: booking } = await admin
    .from('bookings')
    .select('id, customer_id, creator_id')
    .eq('id', bookingId)
    .maybeSingle();
  if (!booking) return null;
  if (isAdmin) return { booking, role: 'admin' as const };
  if (booking.customer_id === userId) return { booking, role: 'customer' as const };
  const { data: creator } = await admin
    .from('creator_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (creator && creator.id === booking.creator_id) return { booking, role: 'creator' as const };
  return null;
}

/**
 * GET /api/deliverables?bookingId=<uuid>
 * Booking participants (customer, the booking's photographer, or an admin) receive the
 * deliverables with short-lived signed URLs for private storage objects.
 */
export async function GET(request: NextRequest) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const bookingId = new URL(request.url).searchParams.get('bookingId');
  if (!bookingId) return jsonError(400, 'bookingId is required.');
  if (!isUuid(bookingId)) return jsonError(400, 'Invalid bookingId.');

  try {
    const access = await loadBookingForParticipant(admin, bookingId, user.id, user.roles.includes('admin'));
    if (!access) return jsonError(404, 'Booking not found.');

    const { data: deliverables, error } = await admin
      .from('booking_deliverables')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (error) return jsonError(500, 'Could not load deliverables.');

    const processed = await Promise.all(
      (deliverables || []).map(async (item) => {
        if (item.storage_provider === 'supabase_storage' && item.storage_path) {
          try {
            const { data: signedData } = await admin.storage
              .from('booking-deliverables')
              .createSignedUrl(item.storage_path, 3600); // 1 hour validity
            return { ...item, download_url: signedData?.signedUrl || null };
          } catch {
            return { ...item, download_url: null };
          }
        }
        return { ...item, download_url: item.external_url || null };
      })
    );

    return NextResponse.json({ success: true, deliverables: processed });
  } catch (err) {
    console.error('Error fetching deliverables:', err);
    return jsonError(500, 'Could not load deliverables.');
  }
}

/**
 * POST /api/deliverables
 * Records a deliverable (uploaded file path or verified external link) for a booking.
 * Only the booking's photographer (or an admin) may add deliverables. The customer
 * is taken from the booking record, not from the request.
 */
export async function POST(request: NextRequest) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON payload.');
  }

  const { bookingId, storagePath, externalUrl, fileName, mimeType } = body;
  const title = cleanText(body.title, 150);
  const description = cleanText(body.description, 1000);
  const deliverableType = body.deliverableType || 'edited_photos';
  const storageProvider = body.storageProvider || 'supabase_storage';
  const fileSizeBytes = body.fileSizeBytes === undefined ? null : Number(body.fileSizeBytes);

  if (!bookingId || !title) return jsonError(400, 'Missing bookingId or title.');
  if (!isUuid(bookingId)) return jsonError(400, 'Invalid bookingId.');
  if (!(DELIVERABLE_TYPES as readonly string[]).includes(deliverableType)) {
    return jsonError(400, 'Unsupported deliverable type.');
  }
  if (!(STORAGE_PROVIDERS as readonly string[]).includes(storageProvider)) {
    return jsonError(400, 'Unsupported storage provider.');
  }
  if (fileSizeBytes !== null && (!Number.isFinite(fileSizeBytes) || fileSizeBytes < 0)) {
    return jsonError(400, 'Invalid file size.');
  }

  if (storageProvider === 'google_drive') {
    if (!externalUrl || !GOOGLE_DRIVE_REGEX.test(String(externalUrl).trim())) {
      return jsonError(
        400,
        'Invalid Google Drive link format. Please provide a valid shareable file or folder link (e.g., https://drive.google.com/drive/folders/... or https://drive.google.com/file/d/...) and ensure viewer access permissions are enabled.'
      );
    }
  } else if (storageProvider === 'supabase_storage') {
    // Storage objects are stored under "<bookingId>/<file>" (see storage policies).
    if (typeof storagePath !== 'string' || !storagePath.startsWith(`${bookingId}/`) || storagePath.includes('..')) {
      return jsonError(400, 'Uploaded file path must be inside the booking folder.');
    }
  } else if (!isSafeHttpsUrl(externalUrl)) {
    return jsonError(400, 'External links must be https URLs.');
  }

  try {
    const isAdmin = user.roles.includes('admin');
    const access = await loadBookingForParticipant(admin, bookingId, user.id, isAdmin);
    if (!access) return jsonError(404, 'Booking not found.');
    if (access.role === 'customer') return jsonError(403, 'Only the photographer can add deliverables.');

    const ownCreator = await getOwnCreatorProfile(admin, user.id);
    const creatorId = access.role === 'admin' ? access.booking.creator_id : ownCreator?.id;
    if (!creatorId) return jsonError(403, 'Only the photographer can add deliverables.');

    const { data, error } = await admin
      .from('booking_deliverables')
      .insert({
        booking_id: bookingId,
        creator_id: access.booking.creator_id,
        customer_id: access.booking.customer_id,
        title,
        description,
        deliverable_type: deliverableType,
        storage_provider: storageProvider,
        storage_path: storageProvider === 'supabase_storage' ? storagePath : null,
        external_url: storageProvider === 'supabase_storage' ? null : externalUrl,
        file_name: cleanText(fileName, 255) || title,
        mime_type: cleanText(mimeType, 100) || 'application/octet-stream',
        file_size_bytes: fileSizeBytes,
        delivery_status: 'ready_for_review',
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Could not save deliverable:', error?.message);
      return jsonError(500, 'Could not save the deliverable.');
    }

    return NextResponse.json({ success: true, deliverable: data });
  } catch (err) {
    console.error('Error saving deliverable:', err);
    return jsonError(500, 'Could not save the deliverable.');
  }
}
