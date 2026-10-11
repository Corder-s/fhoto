'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  DollarSign,
  CreditCard,
  TrendingUp,
  UserPlus,
  ShieldCheck,
  Package,
  Send,
  BarChart2,
  Scale,
  Folder,
  Settings,
  ArrowRight,
  ChevronRight,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  Clock,
  Star,
  Layers,
  MapPin,
  Check,
  ExternalLink
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const [userFilter, setUserFilter] = useState<'all' | 'customers' | 'photographers'>('all');
  const [activeRange, setActiveRange] = useState('30D');
  const [actionToast, setActionToast] = useState<string | null>(null);

  const triggerAction = (label: string) => {
    setActionToast(`${label} action triggered`);
    setTimeout(() => setActionToast(null), 2500);
  };

  // 1. KPI Cards Data
  const kpiData = [
    {
      id: 'kpi-users',
      title: 'Total Users',
      value: '12,458',
      growth: '+12%',
      subtext: '8,092 Customers • 4,366 Photographers',
      icon: Users,
      iconColor: 'bg-[#FFF2E8] text-[#FF6E00] border-[#FFDFC6]',
      sparkColor: '#FF6E00',
    },
    {
      id: 'kpi-bookings',
      title: 'Total Bookings',
      value: '3,892',
      growth: '+18%',
      subtext: '+685 this month',
      icon: Calendar,
      iconColor: 'bg-red-50 text-red-500 border-red-200',
      sparkColor: '#EF4444',
    },
    {
      id: 'kpi-revenue',
      title: 'Total Revenue',
      value: '₹48,25,670',
      growth: '+24%',
      subtext: '+₹9,32,400 this month',
      icon: DollarSign,
      iconColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      sparkColor: '#10B981',
    },
    {
      id: 'kpi-subscriptions',
      title: 'Active Subscriptions',
      value: '1,248',
      growth: '+15%',
      subtext: '298 new this month',
      icon: CreditCard,
      iconColor: 'bg-purple-50 text-purple-600 border-purple-200',
      sparkColor: '#8B5CF6',
    },
  ];

  // 2. Quick Actions
  const quickActions = [
    { label: 'Add User', icon: UserPlus, color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
    { label: 'Verify Photographer', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
    { label: 'Manage Packages', icon: Package, color: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
    { label: 'Send Notification', icon: Send, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
    { label: 'View Reports', icon: BarChart2, color: 'text-red-600 bg-red-50 hover:bg-red-100' },
    { label: 'Resolve Dispute', icon: Scale, color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
    { label: 'Manage Content', icon: Folder, color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' },
    { label: 'Platform Settings', icon: Settings, color: 'text-stone-600 bg-stone-100 hover:bg-stone-200' },
  ];

  // 3. Recent Users Table Data
  const recentUsers = [
    {
      id: 'usr-1',
      name: 'Riya Sharma',
      role: 'Customer',
      location: 'Noida, UP',
      joinedOn: 'Oct 30, 2024',
      status: 'Active',
      avatar: '/reference-assets/avatar_riya.jpg',
    },
    {
      id: 'usr-2',
      name: 'Vikram Singh',
      role: 'Photographer',
      location: 'Delhi',
      joinedOn: 'Oct 29, 2024',
      status: 'Active',
      avatar: '/reference-assets/cat_events.jpg',
    },
    {
      id: 'usr-3',
      name: 'Mehak Gupta',
      role: 'Customer',
      location: 'Greater Noida',
      joinedOn: 'Oct 29, 2024',
      status: 'Active',
      avatar: '/reference-assets/cat_couple.jpg',
    },
    {
      id: 'usr-4',
      name: 'Arjun Mehta',
      role: 'Photographer',
      location: 'Mumbai',
      joinedOn: 'Oct 28, 2024',
      status: 'Pending',
      avatar: '/reference-assets/auth_polaroid_portrait.jpg',
    },
    {
      id: 'usr-5',
      name: 'Sneha Verma',
      role: 'Customer',
      location: 'Bengaluru',
      joinedOn: 'Oct 27, 2024',
      status: 'Active',
      avatar: '/reference-assets/auth_polaroid_couple.jpg',
    },
  ];

  const filteredUsers = recentUsers.filter((u) => {
    if (userFilter === 'customers') return u.role === 'Customer';
    if (userFilter === 'photographers') return u.role === 'Photographer';
    return true;
  });

  // 4. Recent Bookings Table Data
  const recentBookings = [
    {
      id: 'bk-1',
      client: 'Rohan & Neha',
      photographer: 'Aman Verma',
      date: 'Oct 30, 2024',
      amount: '₹25,000',
      status: 'Confirmed',
      avatar: '/reference-assets/auth_polaroid_couple.jpg',
    },
    {
      id: 'bk-2',
      client: 'Corporate Event',
      photographer: 'Sneha Kapoor',
      date: 'Oct 29, 2024',
      amount: '₹18,500',
      status: 'Completed',
      avatar: '/reference-assets/cat_events.jpg',
    },
    {
      id: 'bk-3',
      client: 'Pre-Wedding',
      photographer: 'Karan Malhotra',
      date: 'Oct 29, 2024',
      amount: '₹32,000',
      status: 'Confirmed',
      avatar: '/reference-assets/cat_couple.jpg',
    },
    {
      id: 'bk-4',
      client: 'Portrait Session',
      photographer: 'Priya Singh',
      date: 'Oct 28, 2024',
      amount: '₹8,000',
      status: 'Pending',
      avatar: '/reference-assets/auth_polaroid_portrait.jpg',
    },
    {
      id: 'bk-5',
      client: 'Wedding Ceremony',
      photographer: 'Aditya Sharma',
      date: 'Oct 27, 2024',
      amount: '₹45,000',
      status: 'Completed',
      avatar: '/reference-assets/auth_polaroid_mountain.jpg',
    },
  ];

  // 5. Recent Transactions Table Data
  const recentTransactions = [
    {
      id: 'tx-1',
      type: 'Booking Payment',
      user: 'Rohan & Neha',
      amount: '₹25,000',
      status: 'Success',
      date: 'Oct 30',
    },
    {
      id: 'tx-2',
      type: 'Subscription',
      user: 'Vikram Singh',
      amount: '₹2,999',
      status: 'Success',
      date: 'Oct 29',
    },
    {
      id: 'tx-3',
      type: 'Payout to Photographer',
      user: 'Sneha Kapoor',
      amount: '₹12,400',
      status: 'Processed',
      date: 'Oct 29',
    },
    {
      id: 'tx-4',
      type: 'Booking Payment',
      user: 'Corporate Client',
      amount: '₹18,500',
      status: 'Success',
      date: 'Oct 28',
    },
    {
      id: 'tx-5',
      type: 'Subscription',
      user: 'Arjun Mehta',
      amount: '₹4,999',
      status: 'Success',
      date: 'Oct 27',
    },
  ];

  // 6. Top Photographers
  const topPhotographers = [
    { rank: 1, name: 'Aman Verma', bookings: 124, revenue: '₹5,28,000', rating: '4.9 ★', avatar: '/reference-assets/seller_profile_aman.jpg' },
    { rank: 2, name: 'Sneha Kapoor', bookings: 98, revenue: '₹4,12,500', rating: '4.8 ★', avatar: '/reference-assets/cat_events.jpg' },
    { rank: 3, name: 'Karan Malhotra', bookings: 87, revenue: '₹3,86,000', rating: '4.7 ★', avatar: '/reference-assets/cat_couple.jpg' },
    { rank: 4, name: 'Priya Singh', bookings: 76, revenue: '₹3,25,500', rating: '4.6 ★', avatar: '/reference-assets/avatar_riya.jpg' },
    { rank: 5, name: 'Aditya Sharma', bookings: 68, revenue: '₹2,98,000', rating: '4.6 ★', avatar: '/reference-assets/auth_polaroid_portrait.jpg' },
  ];

  // 7. Top Categories
  const topCategories = [
    { rank: 1, name: 'Wedding Photography', bookings: 1248, revenue: '₹18,25,000', growth: '↑ 28%', avatar: '/reference-assets/auth_polaroid_couple.jpg' },
    { rank: 2, name: 'Pre-Wedding Shoot', bookings: 892, revenue: '₹12,40,000', growth: '↑ 22%', avatar: '/reference-assets/cat_couple.jpg' },
    { rank: 3, name: 'Portrait Session', bookings: 685, revenue: '₹6,85,000', growth: '↑ 18%', avatar: '/reference-assets/auth_polaroid_portrait.jpg' },
    { rank: 4, name: 'Event Photography', bookings: 542, revenue: '₹5,42,000', growth: '↑ 15%', avatar: '/reference-assets/cat_events.jpg' },
    { rank: 5, name: 'Maternity Shoot', bookings: 325, revenue: '₹3,25,000', growth: '↑ 12%', avatar: '/reference-assets/auth_polaroid_child.jpg' },
  ];

  // 8. Platform Activity
  const platformActivity = [
    {
      id: 'act-1',
      title: 'New photographer registration',
      detail: 'Vikram Singh completed registration',
      time: '5 min ago',
      color: 'bg-emerald-500',
    },
    {
      id: 'act-2',
      title: 'New booking received',
      detail: 'Rohan & Neha booked a wedding shoot',
      time: '18 min ago',
      color: 'bg-[#FF6E00]',
    },
    {
      id: 'act-3',
      title: 'Payout processed',
      detail: '₹12,400 paid to Sneha Kapoor',
      time: '1 hour ago',
      color: 'bg-blue-500',
    },
    {
      id: 'act-4',
      title: 'New review submitted',
      detail: 'Mehak Gupta left a 5-star review',
      time: '2 hours ago',
      color: 'bg-amber-500',
    },
    {
      id: 'act-5',
      title: 'Subscription upgraded',
      detail: 'Arjun Mehta upgraded to Pro Plan',
      time: '3 hours ago',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast popup */}
      {actionToast && (
        <div className="fixed top-20 right-8 z-50 bg-[#1A1816] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* ROW 1: WELCOME BANNER & QUICK ACTIONS                    */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* WELCOME BANNER (8 Cols) */}
        <div className="lg:col-span-8 relative rounded-3xl bg-[#FFF8F2] border border-[#FFDFC6] p-6 sm:p-8 overflow-hidden flex flex-col justify-between shadow-2xs">
          {/* Photographer background image right side */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-5/12 bg-cover bg-center pointer-events-none opacity-90 hidden sm:block"
            style={{
              backgroundImage: 'url(/reference-assets/admin_banner_photographer.jpg)',
              maskImage: 'linear-gradient(to right, transparent, black 35%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 35%)',
            }}
          />

          {/* Script Quote in Top Right of Photo */}
          <div className="hidden sm:block absolute right-6 top-6 z-10 font-script text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] text-lg font-bold leading-tight rotate-[-4deg] text-right">
            Manage
            <br />
            Grow
            <br />
            Empower
            <br />
            Creators
            <br />
            <span className="text-base">♡</span>
          </div>

          <div className="relative z-10 max-w-md space-y-2">
            <span className="text-sm font-semibold text-[#8C847A]">Welcome back,</span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1A1816] tracking-tight">
              Admin! <span className="inline-block animate-wave">👋</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#736B63] font-medium">
              Here's what's happening on SnapShoot today.
            </p>
          </div>

          <div className="relative z-10 pt-4 mt-6 border-t border-[#F3E7DC] flex items-center gap-4 text-xs font-semibold text-[#736B63]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E8E2D8] text-[11px] font-bold text-[#1A1816]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Platform Active</span>
            </span>
            <span className="text-[11px] text-[#8C847A]">Last synced: Just now</span>
          </div>
        </div>

        {/* QUICK ACTIONS (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8E2D8] p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-[#FFF2E8] text-[#FF6E00] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-black text-[#1A1816]">Quick Actions</h3>
          </div>

          <div className="grid grid-cols-4 gap-2 flex-1">
            {quickActions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.label}
                  onClick={() => triggerAction(act.label)}
                  className={`p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${act.color}`}
                  title={act.label}
                >
                  <Icon className="w-5 h-5 mb-1.5" />
                  <span className="text-[10px] font-bold leading-tight line-clamp-2">
                    {act.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ROW 2: 4 PLATFORM KPI CARDS                              */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              className="bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-2xs hover:border-[#FF6E00] transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center ${kpi.iconColor}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-0.5 text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <TrendingUp className="w-3 h-3" />
                  <span>{kpi.growth}</span>
                </span>
              </div>

              <div>
                <p className="text-xs text-[#736B63] font-medium">{kpi.title}</p>
                <p className="text-2xl font-black text-[#1A1816] tracking-tight mt-0.5">
                  {kpi.value}
                </p>
                <p className="text-[11px] text-[#8C847A] font-medium mt-1 truncate">
                  {kpi.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* ROW 3: REVENUE & BOOKINGS, USER GROWTH, PLATFORM DISTRIB */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* CHART 1: REVENUE & BOOKINGS OVERVIEW (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E8E2D8] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#FF6E00]" />
                <h3 className="text-xs sm:text-sm font-black text-[#1A1816]">
                  Revenue &amp; Bookings Overview
                </h3>
              </div>
              <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8E2D8]">
                {['7D', '30D', '6M', '1Y'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setActiveRange(range)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      activeRange === range
                        ? 'bg-[#FF6E00] text-white shadow-2xs'
                        : 'text-[#736B63] hover:text-[#1A1816]'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[11px] font-bold mb-4">
              <span className="flex items-center gap-1.5 text-[#1A1816]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6E00]" />
                <span>Revenue (₹)</span>
              </span>
              <span className="flex items-center gap-1.5 text-[#8C847A]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFD4A8]" />
                <span>Bookings</span>
              </span>
            </div>

            {/* Dual Axis Bar & Line Representation */}
            <div className="relative pt-6 pb-2 h-44 flex flex-col justify-between">
              {/* Grid Lines */}
              <div className="space-y-4 text-[9px] text-[#A69F96]">
                <div className="flex items-center justify-between">
                  <span>₹8L</span>
                  <div className="flex-1 mx-2 border-b border-[#F2ECE3] border-dashed" />
                  <span>400</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>₹6L</span>
                  <div className="flex-1 mx-2 border-b border-[#F2ECE3] border-dashed" />
                  <span>300</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>₹4L</span>
                  <div className="flex-1 mx-2 border-b border-[#F2ECE3] border-dashed" />
                  <span>200</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>₹2L</span>
                  <div className="flex-1 mx-2 border-b border-[#F2ECE3] border-dashed" />
                  <span>100</span>
                </div>
              </div>

              {/* Bars Columns */}
              <div className="absolute inset-x-8 bottom-4 flex items-end justify-between h-32">
                {[
                  { date: '1 Oct', barH: '35%', bookH: '40%' },
                  { date: '5 Oct', barH: '50%', bookH: '55%' },
                  { date: '10 Oct', barH: '30%', bookH: '35%' },
                  { date: '15 Oct', barH: '45%', bookH: '50%' },
                  { date: '20 Oct', barH: '60%', bookH: '65%' },
                  { date: '25 Oct', barH: '85%', bookH: '80%' },
                  { date: '31 Oct', barH: '95%', bookH: '90%' },
                ].map((col) => (
                  <div key={col.date} className="flex flex-col items-center gap-1">
                    <div
                      style={{ height: col.barH }}
                      className="w-4 sm:w-6 rounded-t-md bg-gradient-to-t from-[#FF6E00] to-[#FFA756] shadow-2xs"
                    />
                    <span className="text-[9px] font-bold text-[#8C847A]">{col.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CHART 2: USER GROWTH (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8E2D8] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FF6E00]" />
                <h3 className="text-xs sm:text-sm font-black text-[#1A1816]">User Growth</h3>
              </div>
              <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8E2D8]">
                {['7D', '30D', '6M', '1Y'].map((range) => (
                  <button
                    key={range}
                    className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold ${
                      range === '30D'
                        ? 'bg-[#FF6E00] text-white shadow-2xs'
                        : 'text-[#736B63]'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-[11px] font-bold mb-4">
              <span className="flex items-center gap-1.5 text-[#1A1816]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6E00]" />
                <span>Customers</span>
              </span>
              <span className="flex items-center gap-1.5 text-[#8C847A]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F3C49B]" />
                <span>Photographers</span>
              </span>
            </div>

            {/* Growth Curve Chart Container */}
            <div className="relative pt-4 pb-2 h-44 flex flex-col justify-between">
              {/* Stat Callout Badge */}
              <div className="absolute top-2 right-4 bg-[#FF6E00] text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-xs text-center z-10">
                <span>8,092 Customers</span>
                <span className="block text-[8px] opacity-90">4,366 Photographers</span>
              </div>

              {/* Grid Lines */}
              <div className="space-y-4 text-[9px] text-[#A69F96]">
                <div className="flex items-center gap-2"><span>10K</span><div className="flex-1 border-b border-[#F2ECE3] border-dashed" /></div>
                <div className="flex items-center gap-2"><span>8K</span><div className="flex-1 border-b border-[#F2ECE3] border-dashed" /></div>
                <div className="flex items-center gap-2"><span>6K</span><div className="flex-1 border-b border-[#F2ECE3] border-dashed" /></div>
                <div className="flex items-center gap-2"><span>4K</span><div className="flex-1 border-b border-[#F2ECE3] border-dashed" /></div>
                <div className="flex items-center gap-2"><span>2K</span><div className="flex-1 border-b border-[#F2ECE3] border-dashed" /></div>
              </div>

              {/* Curve visualization */}
              <svg className="absolute inset-x-8 bottom-6 h-28 w-4/5 overflow-visible pointer-events-none" viewBox="0 0 100 50" preserveAspectRatio="none">
                <path
                  d="M0,45 Q20,38 40,32 T70,20 T100,5"
                  fill="none"
                  stroke="#FF6E00"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="100" cy="5" r="4" fill="#FF6E00" stroke="#FFF" strokeWidth="2" />
              </svg>

              <div className="flex justify-between text-[9px] font-bold text-[#8C847A] pt-2 px-2">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
              </div>
            </div>
          </div>
        </div>

        {/* CHART 3: PLATFORM DISTRIBUTION (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-[#E8E2D8] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#FF6E00]" />
                <h3 className="text-xs sm:text-sm font-black text-[#1A1816]">Platform Distribution</h3>
              </div>
              <span className="text-[10px] font-bold text-[#736B63] bg-[#FAF7F2] px-2 py-0.5 rounded-lg border border-[#E8E2D8]">
                Users ▾
              </span>
            </div>

            {/* India Map Graphic */}
            <div className="relative rounded-2xl bg-[#FFF8F2] border border-[#FFDFC6] p-3 text-center overflow-hidden mb-3">
              <img
                src="/reference-assets/admin_india_map.png"
                alt="India Distribution Map"
                className="w-full h-32 object-contain mx-auto"
              />
              <div className="absolute top-2 right-2 bg-gradient-to-r from-[#FF6E00] to-[#E86300] text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow-xs text-left">
                <span className="block font-black">Uttar Pradesh</span>
                <span className="text-[8px] opacity-90">2,148 users • 17%</span>
              </div>
            </div>

            {/* States breakdown */}
            <div className="space-y-1.5 text-xs font-semibold text-[#1A1816]">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5A544D]">● Uttar Pradesh</span>
                <span className="font-bold">17%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5A544D]">● Delhi</span>
                <span className="font-bold">14%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5A544D]">● Maharashtra</span>
                <span className="font-bold">12%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5A544D]">● Karnataka</span>
                <span className="font-bold">10%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5A544D]">● Rajasthan</span>
                <span className="font-bold">8%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8C847A]">● Others</span>
                <span className="font-bold text-[#8C847A]">33%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ROW 4: 3 DATA TABLES                                     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* TABLE 1: RECENT USERS (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8E2D8] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FF6E00]" />
                <h3 className="text-sm font-black text-[#1A1816]">Recent Users</h3>
              </div>
              <div className="flex items-center gap-1">
                {(['all', 'customers', 'photographers'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setUserFilter(t)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize cursor-pointer ${
                      userFilter === t
                        ? 'bg-[#FF6E00] text-white shadow-2xs'
                        : 'text-[#736B63] hover:text-[#1A1816]'
                    }`}
                  >
                    {t === 'all' ? 'All' : t.slice(0, 4)}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-[#F2ECE3]">
              {filteredUsers.map((u) => (
                <div key={u.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#E8E2D8] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1A1816] truncate">{u.name}</p>
                      <p className="text-[10px] text-[#8C847A] truncate">
                        {u.role} • {u.location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        u.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {u.status}
                    </span>
                    <p className="text-[9px] text-[#A69F96] mt-0.5">{u.joinedOn.split(',')[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F2ECE3] text-right">
            <Link
              href="/admin/photographers"
              className="text-xs font-bold text-[#FF6E00] hover:underline inline-flex items-center gap-1"
            >
              <span>View All Users</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* TABLE 2: RECENT BOOKINGS (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8E2D8] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FF6E00]" />
                <h3 className="text-sm font-black text-[#1A1816]">Recent Bookings</h3>
              </div>
              <Link
                href="/admin/bookings"
                className="text-xs font-bold text-[#FF6E00] hover:underline inline-flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#F2ECE3]">
              {recentBookings.map((b) => (
                <div key={b.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={b.avatar}
                      alt={b.client}
                      className="w-8 h-8 rounded-xl object-cover border border-[#E8E2D8] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1A1816] truncate">{b.client}</p>
                      <p className="text-[10px] text-[#8C847A] truncate">
                        {b.photographer} • {b.date.split(',')[0]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-[#1A1816]">{b.amount}</p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold mt-0.5 ${
                        b.status === 'Confirmed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : b.status === 'Completed'
                          ? 'bg-teal-50 text-teal-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TABLE 3: RECENT TRANSACTIONS (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8E2D8] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#FF6E00]" />
                <h3 className="text-sm font-black text-[#1A1816]">Recent Transactions</h3>
              </div>
              <Link
                href="/admin/dashboard"
                className="text-xs font-bold text-[#FF6E00] hover:underline inline-flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#F2ECE3]">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1A1816] truncate">{tx.type}</p>
                    <p className="text-[10px] text-[#8C847A] truncate">
                      {tx.user} • {tx.date}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-[#1A1816]">{tx.amount}</p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold mt-0.5 ${
                        tx.status === 'Success'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ROW 5: TOP PHOTOGRAPHERS, TOP CATEGORIES, PLATFORM ACTIVITY */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* BLOCK 1: TOP PHOTOGRAPHERS (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8E2D8] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#FF6E00] fill-[#FF6E00]" />
                <h3 className="text-sm font-black text-[#1A1816]">Top Photographers</h3>
              </div>
              <Link
                href="/admin/photographers"
                className="text-xs font-bold text-[#FF6E00] hover:underline inline-flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {topPhotographers.map((p) => (
                <div
                  key={p.rank}
                  className="p-2.5 rounded-2xl bg-[#FAF7F2]/80 hover:bg-[#FAF7F2] border border-[#F2ECE3] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-center text-xs font-black text-[#8C847A]">
                      #{p.rank}
                    </span>
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#E8E2D8] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1A1816] truncate">{p.name}</p>
                      <p className="text-[10px] text-[#8C847A]">{p.bookings} Bookings</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-[#1A1816]">{p.revenue}</p>
                    <p className="text-[10px] font-bold text-amber-600">{p.rating}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BLOCK 2: TOP CATEGORIES (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8E2D8] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#FF6E00]" />
                <h3 className="text-sm font-black text-[#1A1816]">Top Categories</h3>
              </div>
              <Link
                href="/categories"
                className="text-xs font-bold text-[#FF6E00] hover:underline inline-flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {topCategories.map((c) => (
                <div
                  key={c.rank}
                  className="p-2.5 rounded-2xl bg-[#FAF7F2]/80 hover:bg-[#FAF7F2] border border-[#F2ECE3] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-center text-xs font-black text-[#8C847A]">
                      #{c.rank}
                    </span>
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="w-8 h-8 rounded-xl object-cover border border-[#E8E2D8] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1A1816] truncate">{c.name}</p>
                      <p className="text-[10px] text-[#8C847A]">{c.bookings} Bookings</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-[#1A1816]">{c.revenue}</p>
                    <p className="text-[10px] font-bold text-emerald-600">{c.growth}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BLOCK 3: PLATFORM ACTIVITY (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8E2D8] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-[#FF6E00]" />
              <h3 className="text-sm font-black text-[#1A1816]">Platform Activity</h3>
            </div>

            <div className="space-y-3">
              {platformActivity.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${act.color} mt-1.5 shrink-0 shadow-2xs`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-[#1A1816] truncate">{act.title}</h4>
                      <span className="text-[9px] text-[#8C847A] shrink-0">{act.time}</span>
                    </div>
                    <p className="text-[11px] text-[#736B63] truncate mt-0.5">{act.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F2ECE3] text-center">
            <span className="text-[10px] text-[#8C847A] font-semibold">
              Live Real-Time Activity Feed • SnapShoot Engine
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
