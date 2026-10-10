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
import {
  INITIAL_NOTIFICATIONS,
  CustomerNotificationItem
} from '../../../../data/customerDashboardData';

export default function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState<CustomerNotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'transit' | 'delivery' | 'payment'>('all');

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  const filtered = notifications.filter((n) => (activeFilter === 'all' ? true : n.type === activeFilter));

  const getIcon = (type: CustomerNotificationItem['type']) => {
    switch (type) {
      case 'transit':
        return <Navigation className="w-4 h-4 text-[#FF6E00]" />;
      case 'delivery':
        return <Download className="w-4 h-4 text-green-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-[#8C847A]" />;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <CustomerNoticeBanner moduleName="Client Notification Center" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E1D6]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1816] tracking-tight">
            Client Notifications & Alerts
          </h1>
          <p className="text-xs sm:text-sm text-[#665E55] mt-1">
            Real-time transit updates, shoot OTP reminders, and photo delivery alerts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleMarkAllRead}
          className="text-xs font-bold text-[#FF6E00] hover:underline"
        >
          Mark all as read
        </button>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'transit', 'delivery', 'payment'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeFilter === tab
                ? 'bg-[#1A1816] text-white shadow-sm'
                : 'bg-white text-[#5A544D] hover:text-[#1A1816] border border-[#E8E1D6]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-3xl border transition-all flex items-start gap-4 ${
              item.unread
                ? 'bg-white border-[#FF6E00]/40 shadow-sm'
                : 'bg-white/80 border-[#EBE4DA]'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D6] flex items-center justify-center shrink-0">
              {getIcon(item.type)}
            </div>

            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-[#1A1816]">{item.title}</h4>
                <span className="text-[10px] text-[#8C847A] shrink-0">{item.time}</span>
              </div>
              <p className="text-xs text-[#665E55] leading-relaxed">{item.message}</p>

              {item.actionHref && (
                <div className="pt-2">
                  <Link
                    href={item.actionHref}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6E00] hover:underline"
                  >
                    <span>View details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
