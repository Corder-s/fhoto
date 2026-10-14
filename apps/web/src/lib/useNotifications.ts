'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth';

export interface AppNotification {
  id: string;
  userId: string;
  notificationType: string;
  title: string;
  body: string;
  relatedBookingId?: string | null;
  readAt?: string | null;
  createdAt: string;
  actionUrl?: string | null;
}

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.warn('Could not load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, all: !notificationId }),
      });

      setNotifications((prev) =>
        prev.map((n) =>
          !notificationId || n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
        )
      );

      if (!notificationId) {
        setUnreadCount(0);
      } else {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchNotifications,
    markAsRead,
  };
}
