'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Camera,
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  Layers,
  Star,
  BarChart2,
  Settings,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Bell,
  Search,
  CheckCircle2,
  Lock,
  ShieldAlert,
  LogOut,
  Sliders,
  Mail,
  Cpu
} from 'lucide-react';
import { useAuth } from '../../../lib/auth';
import { useServerSession } from '../../../lib/useServerSession';
import { useAuthModal } from '../../../components/auth/AuthModalContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/admin/dashboard';
  const { user, isAuthenticated, isMounted, logout } = useAuth();
  // Authorization is decided by the server session, not by the localStorage copy of the user.
  const serverSession = useServerSession();
  const { openAuthModal } = useAuthModal();

  // Collapsible menu states matching Reference Image B
  const [userMgmtOpen, setUserMgmtOpen] = useState(true);
  const [contentMgmtOpen, setContentMgmtOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dateRange] = useState('Oct 1, 2024 - Oct 31, 2024');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      openAuthModal({
        returnUrl: pathname,
        initialTab: 'login',
        message: 'Admin Operations Desk requires authenticated administrative credentials.',
      });
    }
  }, [isMounted, isAuthenticated, pathname, openAuthModal]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-canvas-primary flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#FF6E00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-canvas-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-contour-subtle p-8 text-center space-y-4 shadow-elevated">
          <div className="w-14 h-14 rounded-2xl bg-[#FF6E00] text-white flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-ink-primary">Admin Authentication Required</h1>
          <p className="text-xs sm:text-sm text-ink-secondary">
            Please log in with an administrator account to access the platform operations desk.
          </p>
          <button
            onClick={() => openAuthModal({ returnUrl: pathname, initialTab: 'login' })}
            className="w-full py-3 px-6 rounded-2xl bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            Log In as Administrator
          </button>
          <Link href="/" className="block text-xs font-semibold text-ink-muted hover:text-ink-primary pt-2">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (serverSession.status === 'loading') {
    return (
      <div className="min-h-screen bg-canvas-primary flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#FF6E00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  const isAdminOrOwner = serverSession.status === 'authenticated' && serverSession.user.roles.includes('admin');
  if (!isAdminOrOwner) {
    return (
      <div className="min-h-screen bg-canvas-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-contour-subtle p-8 text-center space-y-4 shadow-elevated">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-ink-primary">Access Denied</h1>
          <p className="text-xs sm:text-sm text-ink-secondary">
            Your current account (<strong>{user.email}</strong>, role: <em>{user.role}</em>) does not possess administrative privileges.
          </p>
          <div className="space-y-2 pt-2">
            <Link
              href={user.role === 'creator' ? '/photographer/dashboard' : '/customer/dashboard'}
              className="block w-full py-3 px-6 rounded-2xl bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs sm:text-sm font-bold shadow-sm transition-all text-center"
            >
              Return to Your Dashboard
            </Link>
            <button
              onClick={() => logout()}
              className="w-full py-2.5 text-xs font-semibold text-ink-muted hover:text-red-600 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1816] flex flex-col">
      {/* ======================================================== */}
      {/* TOP HEADER: EXACT REFERENCE IMAGE B                      */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E8E2D8] h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5 select-none cursor-default" aria-label="SnapShoot Brand">
            <div className="w-9 h-9 rounded-xl bg-[#FF6E00] flex items-center justify-center text-white shadow-2xs">
              <Camera className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-[#1A1816] uppercase">
                Snap<span className="text-[#FF6E00]">Shoot</span>
              </span>
              <p className="text-[9px] font-medium text-[#8C847A] leading-none">
                Moments. People. Stories.
              </p>
            </div>
          </div>
        </div>

        {/* Center Search Input with Ctrl + K */}
        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8C847A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users, photographers, bookings, payments, reports..."
              className="w-full pl-9 pr-16 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs text-[#1A1816] placeholder:text-[#8C847A] focus:outline-none focus:border-[#FF6E00] focus:bg-white transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md bg-white border border-[#E8E2D8] text-[9px] font-bold text-[#8C847A]">
              Ctrl + K
            </span>
          </div>
        </div>

        {/* Right Controls: Date Range, Notifications, Messages, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Date Range Selector Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs font-bold text-[#1A1816] cursor-pointer hover:bg-white transition-colors">
            <Calendar className="w-3.5 h-3.5 text-[#8C847A]" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8C847A]" />
          </div>

          {/* Notifications with Badge 5 */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifs(!showNotifs);
                setShowProfileMenu(false);
              }}
              className="relative p-2 text-[#5A544D] hover:text-[#1A1816] hover:bg-[#FAF7F2] rounded-xl transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5 stroke-[1.8]" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#FF4D4D] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                5
              </span>
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-[#E8E2D8] shadow-elevated p-3 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#F2ECE3]">
                  <span className="font-black text-[#1A1816]">Admin Notifications</span>
                  <span className="text-[10px] bg-[#FFE8D6] text-[#FF6E00] px-2 py-0.5 rounded-full font-bold">5 New</span>
                </div>
                <div className="divide-y divide-[#F2ECE3] py-2">
                  <div className="py-2">
                    <p className="font-bold text-[#1A1816]">New KYC Application</p>
                    <p className="text-[11px] text-[#736B63]">Rajat Kapoor submitted Aadhaar verification.</p>
                  </div>
                  <div className="py-2">
                    <p className="font-bold text-[#1A1816]">Dispute Raised</p>
                    <p className="text-[11px] text-[#736B63]">Client requested mediation on Booking #1042.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Bubble with Badge 3 */}
          <div className="relative">
            <button
              className="p-2 text-[#5A544D] hover:text-[#1A1816] hover:bg-[#FAF7F2] rounded-xl transition-colors relative cursor-pointer"
              title="Support & Messages"
            >
              <MessageSquare className="w-5 h-5 stroke-[1.8]" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#FF4D4D] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                3
              </span>
            </button>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifs(false);
              }}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              <img
                src="/reference-assets/seller_profile_aman.jpg"
                alt="System Administrator"
                className="w-8 h-8 rounded-full object-cover border border-[#E8E2D8]"
              />
              <div className="text-left hidden sm:block">
                <p className="text-xs font-black text-[#1A1816] leading-tight">
                  Admin Panel
                </p>
                <p className="text-[10px] text-[#8C847A] font-medium leading-tight">
                  System Administrator
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#8C847A]" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-[#E8E2D8] shadow-elevated p-2 z-50 text-xs">
                <div className="p-2 border-b border-[#F2ECE3]">
                  <p className="font-bold text-[#1A1816]">{user.email}</p>
                  <p className="text-[10px] text-[#8C847A] uppercase font-bold">Role: {user.role}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/"
                    className="block px-3 py-2 text-xs font-semibold text-[#5A544D] hover:bg-[#FAF7F2] rounded-lg"
                  >
                    Public Website
                  </Link>
                  <Link
                    href="/photographer/dashboard"
                    className="block px-3 py-2 text-xs font-semibold text-[#5A544D] hover:bg-[#FAF7F2] rounded-lg"
                  >
                    Photographer Studio
                  </Link>
                  <Link
                    href="/customer/dashboard"
                    className="block px-3 py-2 text-xs font-semibold text-[#5A544D] hover:bg-[#FAF7F2] rounded-lg"
                  >
                    Customer Account
                  </Link>
                </div>
                <div className="pt-1 border-t border-[#F2ECE3]">
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

      {/* ======================================================== */}
      {/* BODY FRAME: SIDEBAR + MAIN CONTENT                       */}
      {/* ======================================================== */}
      <div className="flex-1 flex min-h-[calc(100vh-4rem)]">
        {/* SIDEBAR: EXACT REFERENCE IMAGE B */}
        <aside className="w-64 bg-white border-r border-[#E8E2D8] flex flex-col justify-between shrink-0 hidden md:flex">
          <nav className="p-3 space-y-1 overflow-y-auto">
            {/* Dashboard (Active) */}
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#FFF2E8] text-[#FF6E00] font-black text-xs transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[#FF6E00]" />
              <span>Dashboard</span>
            </Link>

            {/* User Management (Collapsible) */}
            <div>
              <button
                onClick={() => setUserMgmtOpen(!userMgmtOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#5A544D] hover:text-[#1A1816] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-[#8C847A]" />
                  <span>User Management</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#8C847A] transition-transform ${
                    userMgmtOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {userMgmtOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1">
                  <Link
                    href="/admin/dashboard"
                    className="block px-3 py-1.5 text-xs font-semibold text-[#736B63] hover:text-[#1A1816] hover:bg-[#FAF7F2] rounded-lg"
                  >
                    Customers
                  </Link>
                  <Link
                    href="/admin/dashboard#pending-photographers"
                    className="block px-3 py-1.5 text-xs font-semibold text-[#736B63] hover:text-[#1A1816] hover:bg-[#FAF7F2] rounded-lg"
                  >
                    Photographers
                  </Link>
                  <Link
                    href="/admin/dashboard"
                    className="block px-3 py-1.5 text-xs font-semibold text-[#736B63] hover:text-[#1A1816] hover:bg-[#FAF7F2] rounded-lg"
                  >
                    Admins &amp; Roles
                  </Link>
                </div>
              )}
            </div>

            {/* Bookings */}
            <Link
              href="/admin/bookings"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#5A544D] hover:text-[#1A1816] hover:bg-[#FAF7F2] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[#8C847A]" />
                <span>Bookings</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#8C847A]" />
            </Link>

            {/* Payments & Transactions */}
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#5A544D] hover:text-[#1A1816] hover:bg-[#FAF7F2] transition-colors"
            >
              <CreditCard className="w-4 h-4 text-[#8C847A]" />
              <span>Payments &amp; Transactions</span>
            </Link>

            {/* Subscriptions */}
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#5A544D] hover:text-[#1A1816] hover:bg-[#FAF7F2] transition-colors"
            >
              <Layers className="w-4 h-4 text-[#8C847A]" />
              <span>Subscriptions</span>
            </Link>

            {/* Content Management (Collapsible) */}
            <div>
              <button
                onClick={() => setContentMgmtOpen(!contentMgmtOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#5A544D] hover:text-[#1A1816] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-[#8C847A]" />
                  <span>Content Management</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#8C847A] transition-transform ${
                    contentMgmtOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {contentMgmtOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1">
                  <Link
                    href="/categories"
                    className="block px-3 py-1.5 text-xs font-semibold text-[#736B63] hover:text-[#1A1816] hover:bg-[#FAF7F2] rounded-lg"
                  >
                    Categories
                  </Link>
                  <Link
                    href="/admin/dashboard"
                    className="block px-3 py-1.5 text-xs font-semibold text-[#736B63] hover:text-[#1A1816] hover:bg-[#FAF7F2] rounded-lg"
                  >
                    Packages
                  </Link>
                  <Link
                    href="/admin/dashboard"
                    className="block px-3 py-1.5 text-xs font-semibold text-[#736B63] hover:text-[#1A1816] hover:bg-[#FAF7F2] rounded-lg"
                  >
                    Gallery Review
                  </Link>
                </div>
              )}
            </div>

            {/* Reviews & Ratings */}
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#5A544D] hover:text-[#1A1816] hover:bg-[#FAF7F2] transition-colors"
            >
              <Star className="w-4 h-4 text-[#8C847A]" />
              <span>Reviews &amp; Ratings</span>
            </Link>

            {/* Reports & Analytics */}
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#5A544D] hover:text-[#1A1816] hover:bg-[#FAF7F2] transition-colors"
            >
              <BarChart2 className="w-4 h-4 text-[#8C847A]" />
              <span>Reports &amp; Analytics</span>
            </Link>

            {/* Platform Settings (Collapsible) */}
            <div>
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#5A544D] hover:text-[#1A1816] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-[#8C847A]" />
                  <span>Platform Settings</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#8C847A] transition-transform ${
                    settingsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {settingsOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1">
                  <Link
                    href="/admin/dashboard"
                    className="block px-3 py-1.5 text-xs font-semibold text-[#736B63] hover:text-[#1A1816] hover:bg-[#FAF7F2] rounded-lg"
                  >
                    General Settings
                  </Link>
                  <Link
                    href="/admin/dashboard"
                    className="block px-3 py-1.5 text-xs font-semibold text-[#736B63] hover:text-[#1A1816] hover:bg-[#FAF7F2] rounded-lg"
                  >
                    Email &amp; Notifications
                  </Link>
                  <Link
                    href="/admin/dashboard"
                    className="block px-3 py-1.5 text-xs font-semibold text-[#736B63] hover:text-[#1A1816] hover:bg-[#FAF7F2] rounded-lg"
                  >
                    Payment Settings
                  </Link>
                  <Link
                    href="/admin/dashboard"
                    className="block px-3 py-1.5 text-xs font-semibold text-[#736B63] hover:text-[#1A1816] hover:bg-[#FAF7F2] rounded-lg"
                  >
                    AI &amp; Integrations
                  </Link>
                </div>
              )}
            </div>

            {/* System Logs */}
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#5A544D] hover:text-[#1A1816] hover:bg-[#FAF7F2] transition-colors"
            >
              <FileText className="w-4 h-4 text-[#8C847A]" />
              <span>System Logs</span>
            </Link>

            {/* Support & Disputes */}
            <Link
              href="/admin/disputes"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#5A544D] hover:text-[#1A1816] hover:bg-[#FAF7F2] transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-[#8C847A]" />
                <span>Support &amp; Disputes</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#FF4D4D] text-white">
                12
              </span>
            </Link>
          </nav>

          {/* Bottom Platform Status Card */}
          <div className="p-3 m-3 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black text-emerald-950">Platform Status</span>
            </div>
            <p className="text-[11px] font-bold text-emerald-800">
              All Systems Operational
            </p>
            <p className="text-[10px] text-emerald-600 font-medium">99.9% Uptime</p>
          </div>
        </aside>

        {/* MAIN ADMIN CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
