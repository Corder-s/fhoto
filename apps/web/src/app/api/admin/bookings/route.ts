import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const admin = getSupabaseAdminClient();
    const client = admin || getSupabaseBrowserClient();

    if (!client) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 503 });
    }

    let query = client
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
        taxes,
        total_amount,
        booking_status,
        payment_status,
        customer_notes,
        cancellation_reason,
        created_at,
        customer:profiles!customer_id (
          id,
          full_name,
          email,
          phone_number,
          avatar_url
        ),
        creator:creator_profiles!creator_id (
          id,
          professional_name,
          city,
          average_rating,
          user:profiles!user_id (
            id,
            full_name,
            phone_number,
            email,
            avatar_url
          )
        ),
        service:creator_services!service_id (
          id,
          title,
          duration_minutes
        )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'ALL') {
      if (status === 'CANCELLATION_REQUESTED') {
        query = query.eq('booking_status', 'disputed');
      } else {
        query = query.eq('booking_status', status.toLowerCase());
      }
    }

    const { data: bookings, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    let filtered = bookings || [];
    if (search && search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((b: any) =>
        b.booking_reference?.toLowerCase().includes(q) ||
        b.customer?.full_name?.toLowerCase().includes(q) ||
        b.creator?.professional_name?.toLowerCase().includes(q) ||
        b.event_location?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, bookings: filtered });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, action, decision, adminNotes, adminId } = body;

    if (!bookingId || !action) {
      return NextResponse.json({ success: false, error: 'Missing bookingId or action' }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const client = admin || getSupabaseBrowserClient();

    if (!client) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 503 });
    }

    const { data: currentBooking, error: fetchErr } = await client
      .from('bookings')
      .select('id, booking_status, cancellation_reason')
      .eq('id', bookingId)
      .single();

    if (fetchErr || !currentBooking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    let targetStatus = currentBooking.booking_status;
    let updateFields: any = { updated_at: new Date().toISOString() };
    let historyReason = '';

    if (action === 'resolve_cancellation') {
      if (decision === 'approve') {
        // Admin approves photographer's cancellation request
        targetStatus = 'cancelled';
        updateFields.booking_status = targetStatus;
        updateFields.cancellation_reason = `Admin Approved Cancellation: ${adminNotes || 'Photographer emergency accepted'}`;
        updateFields.payment_status = 'refunded';
        historyReason = `Admin approved photographer cancellation: ${adminNotes || 'Emergency accepted'}`;
      } else if (decision === 'reject') {
        // Admin rejects photographer's cancellation request; booking remains confirmed
        targetStatus = 'confirmed';
        updateFields.booking_status = targetStatus;
        historyReason = `Admin rejected photographer cancellation request: ${adminNotes || 'Photographer must fulfill commitment'}`;
      }
    } else if (action === 'force_cancel') {
      targetStatus = 'cancelled';
      updateFields.booking_status = targetStatus;
      updateFields.cancellation_reason = `Administrative Override: ${adminNotes || 'Cancelled by Admin Operations'}`;
      updateFields.payment_status = 'refunded';
      historyReason = `Admin forcefully cancelled booking: ${adminNotes || 'Administrative discretion'}`;
    } else if (action === 'force_confirm') {
      targetStatus = 'confirmed';
      updateFields.booking_status = targetStatus;
      historyReason = `Admin forcefully confirmed booking: ${adminNotes || 'Admin override'}`;
    }

    const { data: updated, error: updateErr } = await client
      .from('bookings')
      .update(updateFields)
      .eq('id', bookingId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    await client.from('booking_status_history').insert({
      booking_id: bookingId,
      previous_status: currentBooking.booking_status,
      new_status: targetStatus,
      changed_by: adminId || null,
      change_reason: historyReason,
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
