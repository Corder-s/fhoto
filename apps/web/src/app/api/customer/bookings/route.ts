import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const client = admin || getSupabaseBrowserClient();

    if (!client) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 503 });
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
        taxes,
        total_amount,
        booking_status,
        payment_status,
        customer_notes,
        cancellation_reason,
        created_at,
        creator:creator_profiles!creator_id (
          id,
          professional_name,
          city,
          average_rating,
          total_reviews,
          user:profiles!user_id (
            id,
            full_name,
            phone_number,
            avatar_url
          )
        ),
        service:creator_services!service_id (
          id,
          title,
          duration_minutes
        )
      `)
      .eq('customer_id', userId)
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
    const { bookingId, action, reason, userId } = body;

    if (!bookingId || !action) {
      return NextResponse.json({ success: false, error: 'Missing bookingId or action' }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const client = admin || getSupabaseBrowserClient();

    if (!client) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 503 });
    }

    // Verify booking belongs to customer
    const { data: booking, error: fetchErr } = await client
      .from('bookings')
      .select('id, customer_id, booking_status')
      .eq('id', bookingId)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (userId && booking.customer_id !== userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized to modify this booking' }, { status: 403 });
    }

    if (action === 'cancel') {
      if (booking.booking_status === 'in_progress' || booking.booking_status === 'completed') {
        return NextResponse.json(
          { success: false, error: 'Shoots that are already in progress or completed cannot be cancelled.' },
          { status: 400 }
        );
      }

      const { data: updated, error: updateErr } = await client
        .from('bookings')
        .update({
          booking_status: 'cancelled',
          cancellation_reason: reason || 'Cancelled by customer',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
      }

      await client.from('booking_status_history').insert({
        booking_id: bookingId,
        previous_status: booking.booking_status,
        new_status: 'cancelled',
        changed_by: userId || null,
        change_reason: `Customer cancelled booking: ${reason || 'Customer request'}`,
      });

      return NextResponse.json({ success: true, booking: updated });
    }

    return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
