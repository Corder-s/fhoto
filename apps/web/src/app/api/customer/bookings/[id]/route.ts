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
  amount_paid,
  payment_mode,
  unlocked_perks,
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
    .select('id, provider, provider_order_id, provider_payment_id, amount, currency, payment_status, payment_mode, installment_number, paid_at, created_at')
    .eq('booking_id', booking.id)
    .order('created_at', { ascending: false });

  const verifiedPayments = (payments || []).filter(
    (p: any) => p.payment_status === 'paid' || p.payment_status === 'captured'
  );
  const verifiedAmountPaid = verifiedPayments.reduce(
    (acc: number, p: any) => acc + (Number(p.amount) || 0),
    0
  );

  const totalAmount = Number(booking.total_amount) || 0;
  const discountAmount = Number(booking.discount_amount) || 0;
  const finalDiscountedTotal = Math.max(0, totalAmount - discountAmount);

  let authoritativePaid = Number(booking.amount_paid) || verifiedAmountPaid;
  let authoritativeStatus = booking.payment_status || 'unpaid';

  if (verifiedAmountPaid > 0) {
    authoritativePaid = verifiedAmountPaid;
    if (verifiedAmountPaid >= (finalDiscountedTotal > 0 ? finalDiscountedTotal : totalAmount)) {
      authoritativeStatus = 'paid';
    } else {
      authoritativeStatus = 'partially_paid';
    }
  } else if (booking.payment_status === 'unpaid') {
    authoritativePaid = 0;
    authoritativeStatus = 'unpaid';
  }

  const remainingDue = Math.max(0, (finalDiscountedTotal > 0 ? finalDiscountedTotal : totalAmount) - authoritativePaid);

  return NextResponse.json({
    success: true,
    booking: {
      ...booking,
      amount_paid: authoritativePaid,
      payment_status: authoritativeStatus,
      remainingDue,
      finalDiscountedTotal: finalDiscountedTotal > 0 ? finalDiscountedTotal : totalAmount,
      payments: payments || [],
      verifiedPayments,
    },
  });
}
