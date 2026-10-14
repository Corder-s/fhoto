import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';
import { listUserNotifications, markNotificationsAsRead } from '@/lib/server/notifications';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications
 * Returns the current authenticated user's authoritative notifications and unread count.
 */
export async function GET(req: NextRequest) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;
  const { user } = auth;

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);

  const { notifications, unreadCount } = await listUserNotifications(user.id, limit);

  return NextResponse.json({
    success: true,
    notifications,
    unreadCount,
  });
}

/**
 * PATCH /api/notifications
 * Marks specific notification or all notifications as read.
 */
export async function PATCH(req: NextRequest) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;
  const { user } = auth;

  let body: Record<string, any> = {};
  try {
    body = await req.json();
  } catch {
    // Empty body marks all as read
  }

  const notificationId = body.notificationId || (body.all ? 'all' : undefined);
  const ok = await markNotificationsAsRead(user.id, notificationId);

  if (!ok) {
    return jsonError(500, 'Could not update notification status.');
  }

  return NextResponse.json({
    success: true,
    message: 'Notifications updated.',
  });
}
