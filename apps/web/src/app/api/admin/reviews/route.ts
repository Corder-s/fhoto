import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';
import { isUuid } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/reviews
 * Returns genuine customer reviews with customer, creator, and booking details.
 */
export async function GET() {
  const auth = await authorize({ roles: ['admin', 'owner'] });
  if (!auth.ok) return auth.response;
  const { admin } = auth;

  try {
    const { data: reviews, error } = await admin
      .from('reviews')
      .select(`
        id,
        booking_id,
        customer_id,
        creator_id,
        rating,
        review_text,
        created_at,
        customer:profiles!customer_id ( full_name, email, avatar_url ),
        creator:creator_profiles!creator_id ( professional_name, city ),
        booking:bookings!booking_id ( booking_reference, event_title, event_date )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return jsonError(500, error.message);
    }

    const rows = reviews || [];
    const totalReviews = rows.length;
    const avgRating = totalReviews > 0
      ? (rows.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / totalReviews).toFixed(1)
      : '0.0';

    return NextResponse.json({
      success: true,
      stats: {
        totalReviews,
        avgRating,
      },
      reviews: rows,
    });
  } catch (err: any) {
    return jsonError(500, err?.message || 'Failed to load reviews.');
  }
}

/**
 * DELETE /api/admin/reviews
 * Allows an authorized admin to remove abusive or fraudulent reviews.
 */
export async function DELETE(req: NextRequest) {
  const auth = await authorize({ roles: ['admin', 'owner'] });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id || !isUuid(id)) return jsonError(400, 'Invalid review ID.');

  try {
    const { error } = await admin.from('reviews').delete().eq('id', id);
    if (error) return jsonError(500, error.message);

    // Record audit log
    await admin.from('system_logs').insert({
      category: 'SYSTEM',
      level: 'WARN',
      action: 'DELETE_REVIEW',
      actor: user.id,
      actor_email: user.email,
      target: `review:${id}`,
      details: `Admin deleted review ${id}`,
    });

    return NextResponse.json({ success: true, message: 'Review removed.' });
  } catch (err: any) {
    return jsonError(500, err?.message || 'Failed to remove review.');
  }
}
