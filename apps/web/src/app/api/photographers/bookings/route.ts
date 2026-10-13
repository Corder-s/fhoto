import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get('creatorId');
    const userId = searchParams.get('userId');

    const admin = getSupabaseAdminClient();
    const client = admin || getSupabaseBrowserClient();

    if (!client) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 503 });
    }

    let targetCreatorId = creatorId;

    if (!targetCreatorId && userId) {
      const { data: creator } = await client
        .from('creator_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      targetCreatorId = creator?.id;
    }

    if (!targetCreatorId) {
      return NextResponse.json({ success: true, bookings: [] });
    }

    const { data: bookings, error } = await client
      .from('bookings')
      .select(`
        id,
        booking_reference,
        event_title,
        event_date,
        start_at,
        end_at,
        event_location,
        agreed_service_price,
        platform_fee,
        total_amount,
        booking_status,
        payment_status,
        customer_notes,
        created_at,
        customer:profiles!customer_id (
          id,
          full_name,
          email,
          phone_number,
          avatar_url
        ),
        service:creator_services!service_id (
          id,
          title,
          duration_minutes
        )
      `)
      .eq('creator_id', targetCreatorId)
      .order('event_date', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, bookings: bookings || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, action, reason, newStatus, userId } = body;

    if (!bookingId || !action) {
      return NextResponse.json({ success: false, error: 'Missing bookingId or action' }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const client = admin || getSupabaseBrowserClient();

    if (!client) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 503 });
    }

    // Fetch current booking state
    const { data: currentBooking, error: fetchErr } = await client
      .from('bookings')
      .select('id, booking_status, creator_id, cancellation_reason')
      .eq('id', bookingId)
      .single();

    if (fetchErr || !currentBooking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    let targetStatus = currentBooking.booking_status;
    let updateFields: any = { updated_at: new Date().toISOString() };
    let historyReason = '';

    if (action === 'accept' || action === 'approve') {
      targetStatus = 'confirmed';
      updateFields.booking_status = targetStatus;
      historyReason = 'Photographer accepted and confirmed booking assignment';
    } else if (action === 'decline' || action === 'reject') {
      if (currentBooking.booking_status === 'confirmed' || currentBooking.booking_status === 'in_progress') {
        return NextResponse.json(
          { success: false, error: 'Confirmed shoots cannot be directly declined. Please submit a cancellation request to Admin.' },
          { status: 403 }
        );
      }
      targetStatus = 'rejected';
      updateFields.booking_status = targetStatus;
      updateFields.cancellation_reason = reason || 'Photographer unavailable for requested schedule';
      historyReason = `Photographer declined booking request: ${reason || 'Schedule conflict'}`;
    } else if (action === 'request_cancellation') {
      // Once approved/confirmed, creator cannot directly cancel without admin mediation
      targetStatus = 'disputed';
      const fullReason = `[Photographer Emergency Cancellation Request]: ${reason || 'Unforeseen conflict'}`;
      updateFields.booking_status = targetStatus;
      updateFields.cancellation_reason = fullReason;
      historyReason = fullReason;
    } else if (action === 'update_status') {
      const allowedStatuses = ['on_the_way', 'arrived_at_venue', 'in_progress', 'completed'];
      if (!allowedStatuses.includes(newStatus)) {
        return NextResponse.json({ success: false, error: `Invalid status transition: ${newStatus}` }, { status: 400 });
      }
      targetStatus = newStatus;
      updateFields.booking_status = targetStatus;
      historyReason = `Shoot progressed to ${newStatus}`;
    } else {
      return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Update booking in Supabase
    const { data: updated, error: updateErr } = await client
      .from('bookings')
      .update(updateFields)
      .eq('id', bookingId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    // Log state change in booking_status_history
    try {
      await client.from('booking_status_history').insert({
        booking_id: bookingId,
        previous_status: currentBooking.booking_status,
        new_status: targetStatus,
        change_reason: historyReason,
      });
    } catch (histErr) {
      console.warn('Could not record status history:', histErr);
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
