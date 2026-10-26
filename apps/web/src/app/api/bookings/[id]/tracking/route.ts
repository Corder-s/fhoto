import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';
import { isUuid } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/bookings/[id]/tracking
 * Reads real-time location coordinates for an active booking.
 * Allowed for:
 *  - The assigned customer
 *  - The assigned photographer
 *  - An authorized administrator
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const bookingId = params.id;
  if (!isUuid(bookingId)) return jsonError(400, 'Invalid booking ID.');

  try {
    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .select(`
        id,
        booking_reference,
        booking_status,
        event_date,
        event_location,
        location_coordinates,
        customer_id,
        creator_id,
        customer:profiles!customer_id ( id, full_name, avatar_url ),
        creator:creator_profiles!creator_id (
          id,
          professional_name,
          city,
          user:profiles!user_id ( id, avatar_url )
        )
      `)
      .eq('id', bookingId)
      .maybeSingle();

    if (bErr || !booking) return jsonError(404, 'Booking not found.');

    const isCustomer = booking.customer_id === user.id;
    const isCreator = (booking.creator as any)?.user?.id === user.id;
    const isAdmin = user.roles.includes('admin') || user.roles.includes('owner');

    if (!isCustomer && !isCreator && !isAdmin) {
      return jsonError(403, 'You do not have permission to view tracking for this booking.');
    }

    const { data: locationRow, error: lErr } = await admin
      .from('live_booking_locations')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (lErr && lErr.code !== 'PGRST116') {
      console.warn('[tracking] Could not read live location:', lErr.message);
    }

    const isEligible = ['confirmed', 'in_progress'].includes(booking.booking_status);

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingReference: booking.booking_reference,
        bookingStatus: booking.booking_status,
        eventLocation: booking.event_location,
        destinationCoordinates: booking.location_coordinates,
        photographerName: (booking.creator as any)?.professional_name,
        photographerAvatar: (booking.creator as any)?.user?.avatar_url,
      },
      tracking: {
        isEligible,
        isSharing: Boolean(locationRow?.is_sharing) && isEligible,
        latitude: locationRow?.latitude ?? null,
        longitude: locationRow?.longitude ?? null,
        accuracyMeters: locationRow?.accuracy_meters ?? null,
        lastUpdatedAt: locationRow?.last_updated_at ?? null,
      },
    });
  } catch (err: any) {
    return jsonError(500, err?.message || 'Could not retrieve tracking status.');
  }
}

/**
 * POST /api/bookings/[id]/tracking
 * Photographer location update broadcast.
 * Authenticated creator updates their GPS position for this confirmed booking.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const auth = await authorize({ roles: ['creator', 'admin'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const bookingId = params.id;
  if (!isUuid(bookingId)) return jsonError(400, 'Invalid booking ID.');

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid JSON body.');
  }

  const { latitude, longitude, accuracyMeters, isSharing } = body;

  try {
    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .select(`
        id,
        booking_status,
        creator_id,
        creator:creator_profiles!creator_id ( id, user_id )
      `)
      .eq('id', bookingId)
      .maybeSingle();

    if (bErr || !booking) return jsonError(404, 'Booking not found.');

    const creatorUserId = (booking.creator as any)?.user_id;
    const isAssignedCreator = creatorUserId === user.id;
    const isAdmin = user.roles.includes('admin') || user.roles.includes('owner');

    if (!isAssignedCreator && !isAdmin) {
      return jsonError(403, 'Only the assigned photographer can broadcast tracking location.');
    }

    if (!['confirmed', 'in_progress'].includes(booking.booking_status)) {
      return jsonError(409, `Tracking is not eligible when booking is ${booking.booking_status}.`);
    }

    // Stop sharing request
    if (isSharing === false) {
      await admin
        .from('live_booking_locations')
        .update({
          is_sharing: false,
          last_updated_at: new Date().toISOString(),
        })
        .eq('booking_id', bookingId);

      return NextResponse.json({
        success: true,
        message: 'Location sharing stopped.',
        isSharing: false,
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const acc = accuracyMeters != null ? Number(accuracyMeters) : null;

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      return jsonError(400, 'Invalid GPS coordinates provided.');
    }

    const now = new Date().toISOString();
    const { data: upserted, error: uErr } = await admin
      .from('live_booking_locations')
      .upsert(
        {
          booking_id: bookingId,
          creator_id: booking.creator_id,
          latitude: lat,
          longitude: lng,
          accuracy_meters: acc,
          is_sharing: true,
          last_updated_at: now,
        },
        { onConflict: 'booking_id' }
      )
      .select('*')
      .single();

    if (uErr) {
      return jsonError(500, `Failed to update live coordinates: ${uErr.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Live location updated successfully.',
      tracking: {
        isSharing: true,
        latitude: upserted.latitude,
        longitude: upserted.longitude,
        accuracyMeters: upserted.accuracy_meters,
        lastUpdatedAt: upserted.last_updated_at,
      },
    });
  } catch (err: any) {
    return jsonError(500, err?.message || 'Failed to update location broadcast.');
  }
}
