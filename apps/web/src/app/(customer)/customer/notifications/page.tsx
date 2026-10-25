'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  Navigation,
  Download,
  CreditCard,
  Clock,
  ArrowRight
} from 'lucide-react';
import { CustomerNoticeBanner } from '../../../../components/customer/CustomerNoticeBanner';
import { useNotifications } from '../../../../lib/useNotifications';

export default function CustomerNotificationsPage() {
  const { notifications: liveNotifs, unreadCount, markAsRead, loading } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<'all' | 'booking' | 'payment'>('all');

  const handleMarkAllRead = () => {
    markAsRead();
  };

  const filtered = liveNotifs.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'booking') return n.notificationType.includes('booking') || n.notificationType.includes('shoot');
    if (activeFilter === 'payment') return n.notificationType.includes('payment') || n.notificationType.includes('escrow');
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'transit':
        return <Navigation className="w-4 h-4 text-[#14B8A6]" />;
      case 'delivery':
        return <Download className="w-4 h-4 text-green-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-[#94A3B8]" />;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <CustomerNoticeBanner moduleName="Client Notification Center" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E7EAEE]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#191C22] tracking-tight">
            Client Notifications & Alerts
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Real-time transit updates, shoot OTP reminders, and photo delivery alerts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleMarkAllRead}
          className="text-xs font-bold text-[#14B8A6] hover:underline"
        >
          Mark all as read
        </button>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'booking', 'payment'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeFilter === tab
                ? 'bg-[#191C22] text-white shadow-sm'
                : 'bg-white text-[#64748B] hover:text-[#191C22] border border-[#E7EAEE]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-[#E7EAEE] space-y-2">
            <Bell className="w-8 h-8 text-[#94A3B8] mx-auto opacity-40" />
            <p className="text-sm font-bold text-[#191C22]">No notifications in this category</p>
            <p className="text-xs text-[#94A3B8]">You will receive updates here whenever a booking is placed or confirmed.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-3xl border transition-all flex items-start gap-4 ${
                !item.readAt
                  ? 'bg-white border-[#14B8A6]/40 shadow-sm'
                  : 'bg-white/80 border-[#EBE4DA]'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-[#F5F7F9] border border-[#E7EAEE] flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-[#14B8A6]" />
              </div>

              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-[#191C22]">{item.title}</h4>
                  <span className="text-[10px] text-[#94A3B8] shrink-0">
                    {new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">{item.body}</p>

                {item.actionUrl && (
                  <div className="pt-2">
                    <Link
                      href={item.actionUrl}
                      onClick={() => markAsRead(item.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#14B8A6] hover:underline"
                    >
                      <span>View details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
