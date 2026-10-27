'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  LifeBuoy,
  Search,
  RefreshCw,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  MessageSquare,
  Paperclip,
  Send,
  User,
  Shield,
  Calendar,
  X,
  ArrowRight,
  ExternalLink,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../../../lib/auth';

interface AdminTicket {
  id: string;
  ticket_reference: string;
  requester_id: string;
  requester_role: 'customer' | 'creator' | 'admin';
  subject: string;
  category: string;
  description: string;
  related_booking_id?: string;
  status: 'new' | 'open' | 'awaiting_response' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_admin_id?: string;
  attachment_url?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  requester?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  assigned_admin?: {
    id: string;
    full_name: string;
    email: string;
  };
  booking?: {
    id: string;
    booking_reference: string;
    event_title: string;
    event_date: string;
    agreed_service_price: number;
    booking_status: string;
  };
  messages?: any[];
}

interface TicketMessage {
  id: string;
  sender_id: string;
  sender_role: string;
  message_text: string;
  is_internal_note: boolean;
  attachment_url?: string;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export default function AdminSupportPage() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    new: 0,
    open: 0,
    awaiting_response: 0,
    resolved: 0,
    closed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Ticket Drawer
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<AdminTicket | null>(null);
  const [activeMessages, setActiveMessages] = useState<TicketMessage[]>([]);
  const [isLoadingThread, setIsLoadingThread] = useState(false);

  // Admin reply form
  const [replyMode, setReplyMode] = useState<'public' | 'internal'>('public');
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Load Tickets
  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/support/tickets?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch tickets.');
      }

      setTickets(data.tickets || []);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading support queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, roleFilter, priorityFilter]);

  // Load ticket details and messages
  const loadTicketDetails = async (ticketId: string) => {
    setIsLoadingThread(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load ticket.');
      }
      setActiveTicket(data.ticket);
      setActiveMessages(data.messages || []);
    } catch (err: any) {
      setReplyError(err.message || 'Could not load conversation.');
    } finally {
      setIsLoadingThread(false);
    }
  };

  const handleOpenTicket = (ticket: AdminTicket) => {
    setSelectedTicketId(ticket.id);
    setActiveTicket(ticket);
    loadTicketDetails(ticket.id);
  };

  const handleCloseDrawer = () => {
    setSelectedTicketId(null);
    setActiveTicket(null);
    setActiveMessages([]);
    fetchTickets();
  };

  // Update Status / Priority
  const handleUpdateTicket = async (updates: {
    status?: 'new' | 'open' | 'awaiting_response' | 'resolved' | 'closed';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) => {
    if (!selectedTicketId) return;
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveTicket((prev) => (prev ? { ...prev, ...updates } : null));
        fetchTickets();
      }
    } catch {
      // Non-fatal
    }
  };

  // Post Admin Reply or Internal Note
  const handleSendAdminReply = async () => {
    if (!selectedTicketId || !replyText.trim()) return;

    setIsSendingReply(true);
    setReplyError(null);

    try {
      const res = await fetch(`/api/support/tickets/${selectedTicketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_text: replyText.trim(),
          is_internal_note: replyMode === 'internal',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to post message.');
      }

      setReplyText('');
      await loadTicketDetails(selectedTicketId);
      fetchTickets();
    } catch (err: any) {
      setReplyError(err.message || 'Failed to submit response.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const getPriorityPill = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-200 uppercase">Urgent</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 border border-amber-200 uppercase">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 border border-blue-200 uppercase">Medium</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gray-100 text-gray-700 border border-gray-200 uppercase">Low</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">New</span>;
      case 'open':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Open</span>;
      case 'awaiting_response':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EFFCF8] text-[#0F766E] border border-[#99F6E4]">Awaiting User</span>;
      case 'resolved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>;
      case 'closed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#14B8A6] uppercase tracking-wider mb-1">
            <LifeBuoy className="w-4 h-4" />
            <span>Operations & Support Desk</span>
          </div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
            Support Ticket Management
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Resolve customer and creator inquiries, investigate disputed bookings, and manage platform communication.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-bold text-[#0F172A] transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-[#0F172A] text-white border-[#0F172A]'
              : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:border-[#CBD5E1]'
          }`}
        >
          <div className="text-[11px] font-black uppercase tracking-wider opacity-75">All Tickets</div>
          <div className="text-2xl font-black mt-1">{counts.total}</div>
        </div>

        <div
          onClick={() => setStatusFilter('new')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'new'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:border-[#CBD5E1]'
          }`}
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-blue-600">New</div>
          <div className="text-2xl font-black mt-1">{counts.new}</div>
        </div>

        <div
          onClick={() => setStatusFilter('open')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'open'
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:border-[#CBD5E1]'
          }`}
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-amber-600">Under Review</div>
          <div className="text-2xl font-black mt-1">{counts.open}</div>
        </div>

        <div
          onClick={() => setStatusFilter('awaiting_response')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'awaiting_response'
              ? 'bg-[#0F766E] text-white border-[#0F766E]'
              : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:border-[#CBD5E1]'
          }`}
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-[#0F766E]">Awaiting User</div>
          <div className="text-2xl font-black mt-1">{counts.awaiting_response}</div>
        </div>

        <div
          onClick={() => setStatusFilter('resolved')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'resolved'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:border-[#CBD5E1]'
          }`}
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-emerald-600">Resolved</div>
          <div className="text-2xl font-black mt-1">{counts.resolved}</div>
        </div>

        <div
          onClick={() => setStatusFilter('closed')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'closed'
              ? 'bg-gray-700 text-white border-gray-700'
              : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:border-[#CBD5E1]'
          }`}
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-gray-500">Closed</div>
          <div className="text-2xl font-black mt-1">{counts.closed}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
            placeholder="Search by ticket ref (#TCK-...), subject, customer name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] outline-none focus:bg-white focus:border-[#14B8A6]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] outline-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="creator">Photographers</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#14B8A6]" />
            <p className="text-xs font-semibold text-[#64748B]">Loading tickets queue...</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center space-y-2 text-red-600">
            <AlertCircle className="w-6 h-6 mx-auto" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        ) : tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-black uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Requester</th>
                  <th className="py-3.5 px-4">Category & Subject</th>
                  <th className="py-3.5 px-4">Shoot Ref</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => handleOpenTicket(ticket)}
                    className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-black text-[#0F172A]">
                      #{ticket.ticket_reference}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#14B8A6] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                          {ticket.requester?.full_name ? ticket.requester.full_name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-[#0F172A]">
                            {ticket.requester?.full_name || 'User'}
                          </div>
                          <div className="text-[10px] text-[#64748B]">
                            {ticket.requester?.email || ticket.requester_role}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-[10px] font-bold text-[#14B8A6] uppercase tracking-wider">
                        {ticket.category.replace('_', ' ')}
                      </div>
                      <div className="font-bold text-[#0F172A] truncate">
                        {ticket.subject}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {ticket.booking ? (
                        <span className="font-mono text-xs font-bold text-[#0F172A]">
                          #{ticket.booking.booking_reference}
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {getPriorityPill(ticket.priority)}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(ticket.status)}
                    </td>

                    <td className="py-3.5 px-4 text-[#64748B] text-[11px]">
                      {new Date(ticket.updated_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTicket(ticket);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#14B8A6] text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-[#0F172A]">Support queue is all clear</h3>
            <p className="text-xs text-[#64748B] max-w-xs mx-auto">
              No tickets found matching the selected filters.
            </p>
          </div>
        )}
      </div>

      {/* AUTHORIZED TICKET DETAILS SLIDE-OVER DRAWER */}
      {selectedTicketId && activeTicket && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            onClick={handleCloseDrawer}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-[#0F172A]">
                  #{activeTicket.ticket_reference}
                </span>
                {getStatusBadge(activeTicket.status)}
                {getPriorityPill(activeTicket.priority)}
              </div>
              <button
                onClick={handleCloseDrawer}
                className="w-8 h-8 rounded-full hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Ticket Info Card */}
              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span>Requester: <strong className="text-[#0F172A]">{activeTicket.requester?.full_name}</strong> ({activeTicket.requester?.email})</span>
                  <span className="capitalize px-2 py-0.5 rounded bg-gray-200 text-gray-800 text-[10px] font-bold">
                    {activeTicket.requester_role}
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-black text-[#0F172A]">
                  {activeTicket.subject}
                </h2>

                <p className="text-xs sm:text-sm text-[#334155] leading-relaxed whitespace-pre-line">
                  {activeTicket.description}
                </p>

                {activeTicket.attachment_url && (
                  <div className="pt-2">
                    <a
                      href={activeTicket.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-[#E2E8F0] hover:bg-gray-50 text-xs font-bold text-[#0F172A]"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-[#14B8A6]" />
                      <span>View Uploaded Attachment</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Related Shoot / Booking Card if linked */}
              {activeTicket.booking && (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-700" />
                      <span>Linked Booking: #{activeTicket.booking.booking_reference}</span>
                    </div>
                    <span>₹{Number(activeTicket.booking.agreed_service_price).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-xs text-amber-800 flex items-center justify-between">
                    <span>{activeTicket.booking.event_title} ({activeTicket.booking.event_date})</span>
                    <span className="capitalize font-bold">Status: {activeTicket.booking.booking_status}</span>
                  </div>
                </div>
              )}

              {/* Status and Priority Controls */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white border border-[#E2E8F0]">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#64748B] block mb-1">
                    Update Status
                  </label>
                  <select
                    value={activeTicket.status}
                    onChange={(e) => handleUpdateTicket({ status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] outline-none"
                  >
                    <option value="new">New</option>
                    <option value="open">Open (Under Review)</option>
                    <option value="awaiting_response">Awaiting User Response</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#64748B] block mb-1">
                    Set Priority
                  </label>
                  <select
                    value={activeTicket.priority}
                    onChange={(e) => handleUpdateTicket({ priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Conversation History */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#64748B]">
                  Thread History ({activeMessages.length})
                </h3>

                {isLoadingThread ? (
                  <div className="p-8 text-center text-xs text-[#64748B]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#14B8A6]" />
                    <span>Loading messages...</span>
                  </div>
                ) : activeMessages.length > 0 ? (
                  <div className="space-y-3">
                    {activeMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1.5 ${
                          msg.is_internal_note
                            ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                            : msg.sender_role === 'admin'
                            ? 'bg-[#EFFCF8] border-[#99F6E4] text-[#0F766E]'
                            : 'bg-white border-[#E2E8F0] text-[#334155]'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-[11px]">
                          <div className="flex items-center gap-1.5">
                            {msg.is_internal_note ? (
                              <Lock className="w-3.5 h-3.5 text-amber-700" />
                            ) : (
                              <User className="w-3.5 h-3.5" />
                            )}
                            <span>{msg.sender?.full_name || msg.sender_role}</span>
                            <span className="opacity-75 uppercase font-mono text-[9px]">
                              ({msg.is_internal_note ? 'INTERNAL ADMIN NOTE' : msg.sender_role})
                            </span>
                          </div>
                          <span className="opacity-60 text-[10px]">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="whitespace-pre-line pl-5">{msg.message_text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#94A3B8] italic">No replies yet.</p>
                )}
              </div>
            </div>

            {/* Drawer Footer: Reply / Internal Note Input */}
            <div className="p-4 border-t border-[#E2E8F0] bg-white space-y-3 shrink-0">
              {/* Tab Selector between Public Reply and Internal Note */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReplyMode('public')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    replyMode === 'public'
                      ? 'bg-[#14B8A6] text-white'
                      : 'bg-gray-100 text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Public Reply (Visible to User)
                </button>
                <button
                  type="button"
                  onClick={() => setReplyMode('internal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    replyMode === 'internal'
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-[#64748B] hover:text-amber-800'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>Internal Note (Private)</span>
                </button>
              </div>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={
                  replyMode === 'internal'
                    ? 'Write an internal note for platform administrators (never shown to customer)...'
                    : 'Compose reply sent directly to the customer / creator...'
                }
                rows={3}
                className={`w-full p-3 rounded-xl border text-xs sm:text-sm font-semibold outline-none resize-none transition-all ${
                  replyMode === 'internal'
                    ? 'bg-amber-50/50 border-amber-300 focus:bg-amber-50 text-amber-900 placeholder-amber-700/50'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] focus:bg-white focus:border-[#14B8A6] text-[#0F172A]'
                }`}
              />

              {replyError && (
                <p className="text-xs text-red-600 font-bold">{replyError}</p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#94A3B8]">
                  {replyMode === 'internal'
                    ? '⚠️ Internal notes are visible only to platform admins.'
                    : 'Sends immediate in-app notification to the user.'}
                </span>

                <button
                  onClick={handleSendAdminReply}
                  disabled={!replyText.trim() || isSendingReply}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-white text-xs font-bold transition-all cursor-pointer ${
                    replyMode === 'internal'
                      ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-gray-200'
                      : 'bg-[#14B8A6] hover:bg-[#0D9488] disabled:bg-gray-200'
                  }`}
                >
                  {isSendingReply ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{replyMode === 'internal' ? 'Save Internal Note' : 'Send User Reply'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
