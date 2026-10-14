/**
 * In-App Notification Engine
 *
 * Provides authoritative in-app notification persistence, unread tracking,
 * and multi-role dashboard synchronization for customer, photographer, and admin.
 */

import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  relatedBookingId?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, any>;
}

export interface InAppNotificationRecord {
  id: string;
  userId: string;
  notificationType: string;
  title: string;
  body: string;
  relatedBookingId?: string | null;
  readAt?: string | null;
  createdAt: string;
  actionUrl?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Creates an in-app notification in the authoritative database table.
 */
export async function createInAppNotification(input: CreateNotificationInput): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  if (!admin) return false;

  try {
    const { error } = await admin.from('notifications').insert({
      user_id: input.userId,
      notification_type: input.type,
      title: input.title,
      body: input.body,
      related_booking_id: input.relatedBookingId || null,
      action_url: input.actionUrl || null,
      metadata: input.metadata || {},
    });

    if (error) {
      console.error('Failed to create in-app notification:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception creating notification:', err);
    return false;
  }
}

/**
 * Lists authoritative notifications for an authenticated user with unread count.
 */
export async function listUserNotifications(
  userId: string,
  limit = 40
): Promise<{ notifications: InAppNotificationRecord[]; unreadCount: number }> {
  const admin = getSupabaseAdminClient();
  if (!admin) return { notifications: [], unreadCount: 0 };

  try {
    const { data, error } = await admin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return { notifications: [], unreadCount: 0 };
    }

    const mapped: InAppNotificationRecord[] = data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      notificationType: row.notification_type,
      title: row.title,
      body: row.body,
      relatedBookingId: row.related_booking_id,
      readAt: row.read_at,
      createdAt: row.created_at,
      actionUrl: row.action_url,
      metadata: row.metadata,
    }));

    const unreadCount = mapped.filter((n) => !n.readAt).length;

    return { notifications: mapped, unreadCount };
  } catch (err) {
    console.error('Error fetching user notifications:', err);
    return { notifications: [], unreadCount: 0 };
  }
}

/**
 * Marks single notification or all notifications as read for a user.
 */
export async function markNotificationsAsRead(
  userId: string,
  notificationId?: string
): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  if (!admin) return false;

  try {
    const now = new Date().toISOString();
    let query = admin
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', userId);

    if (notificationId && notificationId !== 'all') {
      query = query.eq('id', notificationId);
    } else {
      query = query.is('read_at', null);
    }

    const { error } = await query;
    return !error;
  } catch (err) {
    console.error('Error marking notifications read:', err);
    return false;
  }
}
