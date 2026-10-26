import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';
import { isUuid } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

const BOOKING_DETAIL_SELECT = `
  id,
  booking_reference,
  event_title,
  event_date,
  duration_hours,
  start_at,
  end_at,
  event_location,
  agreed_service_price,
  travel_distance_km,
  distance_method,
  included_travel_km,
  chargeable_distance_km,
  travel_rate_per_km,
  travel_fee,
  platform_fee,
  taxes,
  discount_amount,
  total_amount,
  pricing_breakdown,
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
`;

/**
 * GET /api/customer/bookings/[id]
 * Returns full booking details for the authenticated customer.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authorize({ roles: ['customer'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const targetId = params.id;
  if (!targetId) {
    return jsonError(400, 'Missing booking identifier.');
  }

  const isIdUuid = isUuid(targetId);
  let query = admin
    .from('bookings')
    .select(BOOKING_DETAIL_SELECT)
    .eq('customer_id', user.id);

  if (isIdUuid) {
    query = query.or(`id.eq.${targetId},booking_reference.eq.${targetId}`);
  } else {
    query = query.eq('booking_reference', targetId);
  }

  const { data: booking, error } = await query.maybeSingle();
  if (error) {
    console.error('Could not load customer booking detail:', error.message);
    return jsonError(500, 'Could not load booking detail.');
  }

  if (!booking) {
    return jsonError(404, 'Booking not found or not owned by you.');
  }

  // Fetch payment records associated with this booking
  const { data: payments } = await admin
    .from('payments')
    .select('id, provider, provider_order_id, provider_payment_id, amount, currency, payment_status, paid_at, created_at')
    .eq('booking_id', booking.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    success: true,
    booking: {
      ...booking,
      payments: payments || [],
    },
  });
}
