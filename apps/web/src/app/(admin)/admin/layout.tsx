'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Camera,
  LayoutDashboard,
  Users,
  Calendar,
  CalendarDays,
  CreditCard,
  Layers,
  Star,
  BarChart2,
  TrendingUp,
  Settings,
  Folder,
  Image as ImageIcon,
  MessageSquare,
  ChevronDown,
  Bell,
  Search,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Scale,
  Clock,
  ArrowDownCircle,
  Mail,
  Sliders,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth';
import { useServerSession } from '../../../lib/useServerSession';
import { useAuthModal } from '../../../components/auth/AuthModalContext';
import { useNotifications } from '../../../lib/useNotifications';
import { AdminProvider, useAdmin, DateRangeOption } from '../../../components/admin/AdminContext';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/admin/dashboard';
  const router = useRouter();
  const { user, isAuthenticated, isMounted, logout } = useAuth();
  const serverSession = useServerSession();
  const { openAuthModal } = useAuthModal();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const {
    dateRange,
    setDateRange,
    dateRangeLabel,
    searchQuery,
    setSearchQuery,
    mobileMenuOpen,
    setMobileMenuOpen,
  } = useAdmin();

  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [liveDisputeCount, setLiveDisputeCount] = useState<number>(0);
  const [livePendingPhotographers, setLivePendingPhotographers] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d?.stats?.disputedBookings != null) {
          setLiveDisputeCount(d.stats.disputedBookings);
        }
        if (d?.stats?.creatorsPending != null) {
          setLivePendingPhotographers(d.stats.creatorsPending);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      openAuthModal({
        returnUrl: pathname,
        initialTab: 'login',
        message: 'Admin Operations Desk requires authenticated administrative credentials.',
      });
    }
  }, [isMounted, isAuthenticated, pathname, openAuthModal]);

  const serverRoles = serverSession.status === 'authenticated' ? serverSession.user.roles : [];
  const isAdminOrOwner = serverRoles.includes('admin') || serverRoles.includes('owner');
  const isCreator = !isAdminOrOwner && serverRoles.includes('creator');

  // Automatically redirect non-admin accounts to their appropriate workspace
  useEffect(() => {
    if (isMounted && isAuthenticated && serverSession.status === 'authenticated' && !isAdminOrOwner) {
      if (isCreator) {
        router.replace('/photographer/dashboard');
      } else {
        router.replace('/customer/dashboard');
      }
    }
  }, [isMounted, isAuthenticated, serverSession.status, isAdminOrOwner, isCreator, router]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E2E8F0] p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#14B8A6] text-white flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-[#0F172A]">Admin Authentication Required</h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Please log in with an administrator account to access the platform operations desk.
          </p>
          <button
            onClick={() => openAuthModal({ returnUrl: pathname, initialTab: 'login' })}
            className="w-full py-3 px-6 rounded-2xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            Log In as Administrator
          </button>
          <Link href="/" className="block text-xs font-semibold text-[#64748B] hover:text-[#0F172A] pt-2">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (serverSession.status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAdminOrOwner) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4">
        <div className="text-center space-y-3 text-white">
          <div className="w-8 h-8 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#94A3B8]">
            {isCreator ? 'Redirecting to Creator Studio Dashboard...' : 'Redirecting to Customer Dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  // REEPY Navigation Groups matching screenshot
  const navGroups = [
    {
      title: 'MAIN',
      items: [
        { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'MANAGE USERS',
      items: [
        { label: 'Customers', href: '/admin/dashboard?tab=customers', icon: Users },
        {
          label: 'Photographers',
          href: '/admin/photographers',
          icon: Camera,
          badge: livePendingPhotographers > 0 ? livePendingPhotographers : undefined,
          badgeColor: 'bg-amber-500',
        },
        { label: 'Admins & Roles', href: '/admin/dashboard?tab=roles', icon: ShieldCheck },
      ],
    },
    {
      title: 'BOOKINGS',
      items: [
        { label: 'All Bookings', href: '/admin/bookings', icon: Calendar },
        { label: 'Calendar View', href: '/admin/bookings?view=calendar', icon: CalendarDays },
        {
          label: 'Booking Requests',
          href: '/admin/bookings?status=pending',
          icon: Clock,
          badge: 12,
          badgeColor: 'bg-[#FF4D4D]',
        },
        {
          label: 'Disputes',
          href: '/admin/disputes',
          icon: Scale,
          badge: liveDisputeCount > 0 ? liveDisputeCount : undefined,
          badgeColor: 'bg-[#FF4D4D]',
        },
      ],
    },
    {
      title: 'PAYMENTS',
      items: [
        { label: 'Transactions', href: '/admin/bookings', icon: CreditCard },
        { label: 'Payouts', href: '/admin/bookings', icon: ArrowDownCircle },
        { label: 'Subscriptions', href: '/admin/dashboard#subscriptions', icon: Layers },
      ],
    },
    {
      title: 'CONTENT',
      items: [
        { label: 'Categories', href: '/categories', icon: Folder },
        { label: 'Portfolio & Media', href: '/admin/photographers', icon: ImageIcon },
        { label: 'Reviews & Ratings', href: '/admin/dashboard#reviews', icon: Star },
        { label: 'Reported Content', href: '/admin/disputes', icon: ShieldAlert },
      ],
    },
    {
      title: 'REPORTS',
      items: [
        { label: 'Analytics', href: '/admin/dashboard', icon: BarChart2 },
        { label: 'Revenue Reports', href: '/admin/dashboard', icon: TrendingUp },
      ],
    },
    {
      title: 'SETTINGS',
      items: [
        { label: 'Platform Settings', href: '/admin/dashboard#settings', icon: Settings },
        { label: 'Email & Notifications', href: '/admin/dashboard#notifications', icon: Mail },
        { label: 'Appearance', href: '/admin/dashboard#appearance', icon: Sliders },
      ],
    },
  ];

  const dateOptions: { id: DateRangeOption; label: string }[] = [
    { id: '30d', label: 'Oct 1, 2024 - Oct 31, 2024' },
    { id: '7d', label: 'Last 7 days' },
    { id: 'month', label: 'This month' },
    { id: 'today', label: 'Today' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full select-none">
      {/* Top Branding */}
      <div className="p-5 flex items-center gap-3 border-b border-[#1E293B] shrink-0">
        <div className="w-10 h-10 rounded-xl bg-[#14B8A6] flex items-center justify-center text-white shadow-sm shrink-0">
          <Camera className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <span className="text-base font-black tracking-tight text-white uppercase block leading-tight">
            REEPY
          </span>
          <p className="text-[10px] font-medium text-[#94A3B8] leading-tight">
            Moments. People. Stories.
          </p>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h4 className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider px-3 pb-1">
              {group.title}
            </h4>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/admin/dashboard'
                    ? pathname === '/admin/dashboard' || pathname === '/admin'
                    : pathname.startsWith(item.href.split('?')[0]);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                      isActive
                        ? 'bg-[#0D9488] text-white font-bold shadow-sm'
                        : 'text-[#94A3B8] hover:text-white hover:bg-white/5 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#94A3B8]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge != null && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black text-white ${
                          item.badgeColor || 'bg-[#14B8A6]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
      {/* ======================================================== */}
      {/* DESKTOP DARK SIDEBAR (#0B0F17)                          */}
      {/* ======================================================== */}
      <aside className="w-64 bg-[#0B0F17] border-r border-[#1E293B] shrink-0 hidden md:flex flex-col h-screen sticky top-0 z-40">
        <SidebarContent />
      </aside>

      {/* ======================================================== */}
      {/* MOBILE SIDEBAR DRAWER OVERLAY                            */}
      {/* ======================================================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] bg-[#0B0F17] h-full shadow-2xl flex flex-col z-10">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-3 text-[#94A3B8] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* RIGHT SIDE: HEADER + MAIN WORKSPACE                      */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER: Clean White (#FFFFFF), height 64px */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Search */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar with Ctrl K indicator */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users, photographers, bookings, payments..."
                className="w-full pl-9 pr-14 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#14B8A6] focus:bg-white transition-all"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-[9px] font-bold text-[#94A3B8] select-none pointer-events-none hidden sm:inline">
                Ctrl K
              </span>
            </div>
          </div>

          {/* Right Controls: Date Range, Notifications, Messages, Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Date Range Selector Pill */}
            <div className="relative">
              <button
                onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                <span>{dateRangeLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
              </button>

              {dateDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-1.5 z-50 text-xs">
                  <div className="px-3 py-2 text-[10px] font-bold text-[#94A3B8] uppercase">
                    Select Period
                  </div>
                  {dateOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setDateRange(opt.id);
                        setDateDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                        dateRange === opt.id
                          ? 'bg-[#EFFCF8] text-[#0D9488] font-bold'
                          : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {dateRange === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Button with Red Badge 3 */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifs(!showNotifs);
                  setShowProfileMenu(false);
                }}
                className="relative p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-xl transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5 stroke-[1.8]" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#FF4D4D] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {unreadCount > 0 ? unreadCount : 3}
                </span>
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-3 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                    <span className="font-bold text-[#0F172A]">Notifications</span>
                    <button
                      onClick={() => markAsRead()}
                      className="text-[10px] font-semibold text-[#14B8A6] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="divide-y divide-[#F1F5F9] max-h-72 overflow-y-auto py-1">
                    {notifications.length === 0 ? (
                      <div className="py-4 text-center text-[#94A3B8]">
                        3 pending administrative alerts
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <Link
                          key={item.id}
                          href={item.actionUrl || '/admin/dashboard'}
                          onClick={() => {
                            markAsRead(item.id);
                            setShowNotifs(false);
                          }}
                          className="block py-2.5 px-2 rounded-lg hover:bg-[#F8FAFC] transition-colors"
                        >
                          <p className="text-xs font-bold text-[#0F172A]">{item.title}</p>
                          <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2">{item.body}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Messages Button with Red Badge 5 */}
            <div className="relative">
              <button
                className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-xl transition-colors relative cursor-pointer"
                title="Support & Inquiries"
              >
                <MessageSquare className="w-5 h-5 stroke-[1.8]" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#FF4D4D] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  5
                </span>
              </button>
            </div>

            {/* Admin Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifs(false);
                }}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                <img
                  src="/reference-assets/seller_profile_aman.jpg"
                  alt="Administrator Avatar"
                  className="w-8 h-8 rounded-full object-cover border border-[#E2E8F0]"
                />
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-[#0F172A] leading-tight">
                    Admin Panel
                  </p>
                  <p className="text-[10px] text-[#64748B] font-medium leading-tight">
                    System Administrator
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-2 z-50 text-xs">
                  <div className="p-2 border-b border-[#F1F5F9]">
                    <p className="font-bold text-[#0F172A] truncate">{user.email}</p>
                    <p className="text-[10px] text-[#94A3B8] uppercase font-bold">Role: {user.role}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/"
                      className="block px-3 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] rounded-lg"
                    >
                      Public Website
                    </Link>
                    <Link
                      href="/photographer/dashboard"
                      className="block px-3 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] rounded-lg"
                    >
                      Photographer Studio
                    </Link>
                    <Link
                      href="/customer/dashboard"
                      className="block px-3 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] rounded-lg"
                    >
                      Customer Account
                    </Link>
                  </div>
                  <div className="pt-1 border-t border-[#F1F5F9]">
                    <button
                      onClick={() => logout()}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN ADMIN WORKSPACE */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminProvider>
  );
}
