'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  HelpCircle,
  LifeBuoy,
  MessageSquare,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Paperclip,
  Send,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Calendar,
  CreditCard,
  Image as ImageIcon,
  Camera,
  DollarSign,
  KeyRound,
  ExternalLink,
  User,
  Headphones,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useAuthModal } from '../auth/AuthModalContext';
import {
  FAQ_ARTICLES,
  SUPPORT_CATEGORIES,
  FaqArticle,
} from '../../lib/supportKnowledgeBase';

interface TicketItem {
  id: string;
  ticket_reference: string;
  subject: string;
  category: string;
  description: string;
  related_booking_id?: string;
  booking?: {
    id: string;
    booking_reference: string;
    event_title: string;
    event_date: string;
  };
  status: 'new' | 'open' | 'awaiting_response' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  attachment_url?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  message_count: number;
  latest_reply?: {
    text: string;
    created_at: string;
    sender_role: string;
  };
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

interface UnifiedHelpCenterProps {
  variant: 'customer' | 'creator' | 'public';
}

export const UnifiedHelpCenter: React.FC<UnifiedHelpCenterProps> = ({ variant }) => {
  const { user, isAuthenticated, isMounted } = useAuth();
  const { openAuthModal } = useAuthModal();

  const [activeTab, setActiveTab] = useState<'faqs' | 'my_tickets' | 'new_ticket'>('faqs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Tickets state
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  // Active Ticket Details / Thread state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<TicketItem | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // New Ticket Form state
  const [formCategory, setFormCategory] = useState('bookings_reservations');
  const [formSubject, setFormSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBookingId, setFormBookingId] = useState('');
  const [userBookings, setUserBookings] = useState<Array<{ id: string; ref: string; title: string; date: string }>>([]);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // File Attachment state
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter FAQs based on audience, category, and search query
  const filteredFaqs = useMemo(() => {
    return FAQ_ARTICLES.filter((article) => {
      // Audience filter
      if (variant === 'customer' && article.audience === 'creator') return false;
      if (variant === 'creator' && article.audience === 'customer') return false;

      // Category filter
      if (selectedCategory !== 'all') {
        const catObj = SUPPORT_CATEGORIES.find((c) => c.id === selectedCategory);
        if (catObj && catObj.key !== article.category) {
          // Check direct category mapping
          const directMatch =
            (selectedCategory === 'cat_bookings' && article.category === 'bookings') ||
            (selectedCategory === 'cat_otp' && article.category === 'otp_arrival') ||
            (selectedCategory === 'cat_payments' && article.category === 'payments') ||
            (selectedCategory === 'cat_cancellations' && article.category === 'cancellations') ||
            (selectedCategory === 'cat_deliverables' && article.category === 'deliverables') ||
            (selectedCategory === 'cat_creator_studio' && article.category === 'creator_studio') ||
            (selectedCategory === 'cat_account' && article.category === 'account');
          if (!directMatch) return false;
        }
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        article.question.toLowerCase().includes(q) ||
        article.answer.toLowerCase().includes(q)
      );
    });
  }, [variant, selectedCategory, searchQuery]);

  // Load User's Tickets
  const loadTickets = async () => {
    if (!isAuthenticated) return;
    setIsLoadingTickets(true);
    setTicketsError(null);
    try {
      const res = await fetch('/api/support/tickets', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch support tickets.');
      }
      setTickets(data.tickets || []);
    } catch (err: any) {
      setTicketsError(err.message || 'Could not load your support tickets.');
    } finally {
      setIsLoadingTickets(false);
    }
  };

  // Load User's Bookings for the dropdown
  const loadUserBookings = async () => {
    if (!isAuthenticated) return;
    try {
      const endpoint = variant === 'creator' ? '/api/photographers/bookings' : '/api/customer/bookings';
      const res = await fetch(endpoint, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.bookings)) {
        setUserBookings(
          data.bookings.map((b: any) => ({
            id: b.id || b.rawId,
            ref: b.booking_reference || b.bookingReference || b.id.slice(0, 8),
            title: b.event_title || b.packageTitle || 'Photography Shoot',
            date: b.event_date || b.date || '',
          }))
        );
      }
    } catch {
      // Non-fatal
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isAuthenticated) {
      loadTickets();
      loadUserBookings();
    }
  }, [isAuthenticated]);

  // Load Thread when a ticket is selected
  const loadThread = async (ticketId: string) => {
    setIsLoadingThread(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load ticket details.');
      }
      setActiveTicket(data.ticket);
      setTicketMessages(data.messages || []);
    } catch (err: any) {
      setReplyError(err.message || 'Could not load conversation thread.');
    } finally {
      setIsLoadingThread(false);
    }
  };

  const handleSelectTicket = (ticket: TicketItem) => {
    setSelectedTicketId(ticket.id);
    setActiveTicket(ticket);
    loadThread(ticket.id);
  };

  const handleBackToList = () => {
    setSelectedTicketId(null);
    setActiveTicket(null);
    setTicketMessages([]);
    loadTickets();
  };

  // Upload file attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setFormError('Attachment must be under 15MB.');
      return;
    }

    setAttachmentFile(file);
    setIsUploadingFile(true);
    setFormError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/support/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Attachment upload failed.');
      }
      setAttachmentUrl(data.url);
    } catch (err: any) {
      setFormError(err.message || 'Failed to upload attachment.');
      setAttachmentFile(null);
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Submit New Ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal({ returnUrl: window.location.pathname });
      return;
    }

    if (!formSubject.trim() || formSubject.trim().length < 3) {
      setFormError('Please provide a subject line (at least 3 characters).');
      return;
    }
    if (!formDescription.trim() || formDescription.trim().length < 10) {
      setFormError('Please describe your issue in detail (at least 10 characters).');
      return;
    }

    setIsSubmittingTicket(true);
    setFormError(null);
    setFormSuccessMessage(null);

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: formSubject.trim(),
          category: formCategory,
          description: formDescription.trim(),
          related_booking_id: formBookingId || undefined,
          attachment_url: attachmentUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit ticket.');
      }

      setFormSuccessMessage(data.message || 'Support ticket submitted successfully!');
      setFormSubject('');
      setFormDescription('');
      setFormBookingId('');
      setAttachmentFile(null);
      setAttachmentUrl(null);

      // Refresh tickets and switch to view
      await loadTickets();
      setTimeout(() => {
        setActiveTab('my_tickets');
        if (data.ticket?.id) {
          handleSelectTicket(data.ticket);
        }
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Error submitting ticket.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Send Reply in open thread
  const handleSendReply = async () => {
    if (!selectedTicketId || !replyText.trim()) return;

    setIsSendingReply(true);
    setReplyError(null);

    try {
      const res = await fetch(`/api/support/tickets/${selectedTicketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_text: replyText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send reply.');
      }

      setReplyText('');
      // Reload thread
      await loadThread(selectedTicketId);
    } catch (err: any) {
      setReplyError(err.message || 'Could not send reply.');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Close ticket as resolved
  const handleCloseTicket = async () => {
    if (!selectedTicketId) return;
    if (!confirm('Are you sure you want to mark this support ticket as closed?')) return;

    try {
      const res = await fetch(`/api/support/tickets/${selectedTicketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadThread(selectedTicketId);
      }
    } catch {
      // Non-fatal
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">New</span>;
      case 'open':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Under Review</span>;
      case 'awaiting_response':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFFCF8] text-[#0F766E] border border-[#99F6E4]">Agent Replied</span>;
      case 'resolved':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>;
      case 'closed':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Hero */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#14B8A6]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFFCF8] border border-[#99F6E4] text-[#0F766E] text-xs font-bold">
            <LifeBuoy className="w-4 h-4 text-[#14B8A6]" />
            <span>REEPY Concierge Support & Help Center</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
            How can our support team help you today?
          </h1>

          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
            {variant === 'creator'
              ? 'Find fast answers about creator verification, portfolio uploads, custom pricing, Shoot OTP check-ins, and escrow payouts.'
              : 'Find fast answers about photographer bookings, Shoot-Start OTP arrival verification, 100% escrow protection, and photo delivery.'}
          </p>

          {/* Interactive Search Bar */}
          <div className="relative pt-2">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== 'faqs') setActiveTab('faqs');
              }}
              placeholder="Search help topics, booking rules, escrow, Shoot OTP, photo delivery..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] focus:bg-white focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20 text-sm text-[#0F172A] placeholder-[#94A3B8] transition-all outline-none shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-2">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => {
              setActiveTab('faqs');
              setSelectedTicketId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'faqs' && !selectedTicketId
                ? 'bg-[#14B8A6] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Knowledge Base & FAQs</span>
          </button>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal({ returnUrl: window.location.pathname });
                return;
              }
              setActiveTab('my_tickets');
              setSelectedTicketId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'my_tickets' || selectedTicketId
                ? 'bg-[#14B8A6] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>My Support Tickets</span>
            {tickets.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'my_tickets' ? 'bg-white text-[#14B8A6]' : 'bg-[#E2E8F0] text-[#0F172A]'
              }`}>
                {tickets.length}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={() => {
            if (!isAuthenticated) {
              openAuthModal({ returnUrl: window.location.pathname });
              return;
            }
            setActiveTab('new_ticket');
            setSelectedTicketId(null);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#14B8A6]" />
          <span>Submit a Support Request</span>
        </button>
      </div>

      {/* TAB 1: FAQS & KNOWLEDGE BASE */}
      {activeTab === 'faqs' && !selectedTicketId && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
              }`}
            >
              All Topics ({FAQ_ARTICLES.length})
            </button>
            {SUPPORT_CATEGORIES.map((cat) => {
              if (variant === 'customer' && cat.audience === 'creator') return null;
              if (variant === 'creator' && cat.audience === 'customer') return null;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#0F172A] text-white'
                      : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* FAQ Accordion List */}
          {filteredFaqs.length > 0 ? (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden transition-all shadow-xs hover:border-[#CBD5E1]"
                  >
                    <button
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#EFFCF8] border border-[#99F6E4] flex items-center justify-center text-[#14B8A6] shrink-0">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <span className="text-sm sm:text-base font-bold text-[#0F172A]">
                          {faq.question}
                        </span>
                      </div>
                      <div className="text-[#64748B] shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-[#14B8A6]" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-[#F1F5F9] text-xs sm:text-sm text-[#475569] leading-relaxed space-y-4">
                        <div className="whitespace-pre-line pl-11">
                          {faq.answer}
                        </div>
                        {faq.relatedLink && (
                          <div className="pl-11">
                            <Link
                              href={faq.relatedLink.href}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#14B8A6] hover:text-[#0D9488] transition-colors"
                            >
                              <span>{faq.relatedLink.label}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-12 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A]">No matching articles found</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                We couldn&apos;t find any articles matching &quot;{searchQuery}&quot;. You can submit a direct support ticket to our team below.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-xs font-bold text-[#14B8A6] hover:underline pt-2 cursor-pointer"
              >
                Clear search and view all articles
              </button>
            </div>
          )}

          {/* Need More Help Footer Box */}
          <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-1.5 text-center sm:text-left">
              <h3 className="text-lg font-black tracking-tight">Still have questions or need assistance?</h3>
              <p className="text-xs text-[#94A3B8]">
                Our concierge support team is available 9:00 AM – 9:00 PM IST (Mon–Sun).
              </p>
            </div>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal({ returnUrl: window.location.pathname });
                  return;
                }
                setActiveTab('new_ticket');
              }}
              className="py-3 px-6 rounded-2xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer shrink-0 flex items-center gap-2"
            >
              <span>Submit a Ticket</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: MY TICKETS LIST */}
      {activeTab === 'my_tickets' && !selectedTicketId && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0F172A]">Your Support Requests</h2>
            <button
              onClick={loadTickets}
              disabled={isLoadingTickets}
              className="flex items-center gap-1.5 text-xs font-bold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTickets ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {isLoadingTickets ? (
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-12 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
              <div className="w-8 h-8 border-3 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#64748B]">Loading your tickets...</p>
            </div>
          ) : ticketsError ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-red-600 mx-auto" />
              <p className="text-xs font-bold text-red-800">{ticketsError}</p>
              <button
                onClick={loadTickets}
                className="text-xs font-bold text-red-700 underline cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : tickets.length > 0 ? (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className="bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:border-[#14B8A6] transition-all cursor-pointer shadow-xs hover:shadow-sm space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#0F172A]">
                        #{ticket.ticket_reference}
                      </span>
                      {getStatusBadge(ticket.status)}
                      <span className="text-[11px] font-semibold text-[#64748B] capitalize">
                        • {ticket.category.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#94A3B8]">
                      {new Date(ticket.updated_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">
                      {ticket.subject}
                    </h3>
                    <p className="text-xs text-[#64748B] line-clamp-2 mt-1">
                      {ticket.description}
                    </p>
                  </div>

                  {ticket.booking && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#475569]">
                      <Calendar className="w-3.5 h-3.5 text-[#14B8A6]" />
                      <span>Shoot #{ticket.booking.booking_reference} • {ticket.booking.event_title}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] text-xs">
                    <div className="flex items-center gap-1.5 text-[#64748B]">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{ticket.message_count} {ticket.message_count === 1 ? 'message' : 'messages'}</span>
                      {ticket.latest_reply && (
                        <span className="text-[#94A3B8] hidden sm:inline">
                          — Latest from {ticket.latest_reply.sender_role}: &quot;{ticket.latest_reply.text}&quot;
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-[#14B8A6] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>View details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-12 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-[#EFFCF8] border border-[#99F6E4] flex items-center justify-center text-[#14B8A6] mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-[#0F172A]">No Open Support Tickets</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                You have no active support requests. If you ever experience any issues with bookings, Shoot OTP, or payouts, submit a request and our team will jump in.
              </p>
              <button
                onClick={() => setActiveTab('new_ticket')}
                className="py-2.5 px-5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Create Support Request
              </button>
            </div>
          )}
        </div>
      )}

      {/* TICKET DETAILS / CONVERSATION VIEW */}
      {selectedTicketId && activeTicket && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Back to Tickets</span>
            </button>
            <div className="flex items-center gap-2">
              {getStatusBadge(activeTicket.status)}
              {activeTicket.status !== 'closed' && (
                <button
                  onClick={handleCloseTicket}
                  className="px-3 py-1 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                >
                  Mark Closed
                </button>
              )}
            </div>
          </div>

          {/* Ticket Header Card */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B]">
              <span className="font-mono font-black text-[#0F172A] text-sm">
                #{activeTicket.ticket_reference}
              </span>
              <span>
                Opened on {new Date(activeTicket.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-[#0F172A]">
              {activeTicket.subject}
            </h2>

            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              {activeTicket.description}
            </p>

            {activeTicket.booking && (
              <div className="pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155]">
                  <Calendar className="w-4 h-4 text-[#14B8A6]" />
                  <span>
                    Linked to Shoot #{activeTicket.booking.booking_reference} ({activeTicket.booking.event_title})
                  </span>
                </div>
              </div>
            )}

            {activeTicket.attachment_url && (
              <div className="pt-2">
                <a
                  href={activeTicket.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-[#0F172A] transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5 text-[#14B8A6]" />
                  <span>View Attached Document</span>
                </a>
              </div>
            )}
          </div>

          {/* Message Thread */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#94A3B8]">
              Conversation History
            </h3>

            {isLoadingThread ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#14B8A6]" />
                <span>Loading messages...</span>
              </div>
            ) : ticketMessages.length > 0 ? (
              <div className="space-y-3">
                {ticketMessages.map((msg) => {
                  const isAdminMsg = msg.sender_role === 'admin' || msg.sender_role === 'system';
                  return (
                    <div
                      key={msg.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isAdminMsg
                          ? 'bg-[#EFFCF8]/60 border-[#99F6E4]/70 ml-0 sm:ml-8'
                          : 'bg-white border-[#E2E8F0] mr-0 sm:mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                            isAdminMsg ? 'bg-[#14B8A6] text-white' : 'bg-[#0F172A] text-white'
                          }`}>
                            {isAdminMsg ? <Headphones className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          </div>
                          <span className="font-bold text-[#0F172A]">
                            {isAdminMsg ? 'REEPY Concierge Support Desk' : msg.sender?.full_name || 'You'}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                            isAdminMsg ? 'bg-[#14B8A6] text-white' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {msg.sender_role}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#94A3B8]">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-[#334155] leading-relaxed whitespace-pre-line pl-8">
                        {msg.message_text}
                      </p>

                      {msg.attachment_url && (
                        <div className="pl-8 pt-2">
                          <a
                            href={msg.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-[#14B8A6] font-bold hover:underline"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>Attachment</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#64748B] italic">No messages found.</p>
            )}

            {/* Reply Input Box */}
            {activeTicket.status !== 'closed' ? (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs space-y-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  rows={3}
                  className="w-full text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none resize-none bg-transparent"
                />
                {replyError && (
                  <p className="text-xs text-red-600 font-bold">{replyError}</p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                  <span className="text-[11px] text-[#94A3B8]">
                    Support responds typically within a few hours.
                  </span>
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || isSendingReply}
                    className="flex items-center gap-2 py-2 px-4 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] disabled:bg-[#E2E8F0] text-white disabled:text-[#94A3B8] text-xs font-bold transition-all cursor-pointer"
                  >
                    {isSendingReply ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Send Reply</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center text-xs text-[#64748B]">
                This ticket has been marked closed. If you have a new question, please open a new support request.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SUBMIT NEW TICKET */}
      {activeTab === 'new_ticket' && (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-10 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
              Submit a Support Request
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Please describe your question or issue in detail. Our concierge operations team will review your ticket and reply promptly.
            </p>
          </div>

          {formSuccessMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{formSuccessMessage}</span>
            </div>
          )}

          {formError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitTicket} className="space-y-5">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-[#475569]">
                Help Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm font-semibold text-[#0F172A] outline-none focus:bg-white focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]"
              >
                <option value="bookings_reservations">Bookings & Reservations</option>
                <option value="payments_refunds">Payments & Escrow</option>
                <option value="photographer_communication">Communication / Attendance</option>
                <option value="cancellations_rescheduling">Cancellations & Refunds</option>
                <option value="account_profile">Account, Login & Profile</option>
                {variant === 'creator' && (
                  <>
                    <option value="portfolio_uploads">Portfolio Images & Banner</option>
                    <option value="verification_identity">Profile Verification</option>
                    <option value="payouts_earnings">Earnings & Payouts</option>
                  </>
                )}
                <option value="technical_problems">Technical Problems</option>
                <option value="other">Other Inquiries</option>
              </select>
            </div>

            {/* Related Booking Dropdown (if user has bookings) */}
            {userBookings.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#475569]">
                  Related Shoot / Booking (Optional)
                </label>
                <select
                  value={formBookingId}
                  onChange={(e) => setFormBookingId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm font-semibold text-[#0F172A] outline-none focus:bg-white focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]"
                >
                  <option value="">-- No specific shoot --</option>
                  {userBookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.ref} • {b.title} ({b.date})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-[#475569]">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                placeholder="e.g. Reschedule inquiry for Saturday portrait session"
                className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm font-semibold text-[#0F172A] placeholder-[#94A3B8] outline-none focus:bg-white focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-[#475569]">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Please describe what happened, what assistance you need, or any specific details..."
                rows={5}
                className="w-full p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm font-semibold text-[#0F172A] placeholder-[#94A3B8] outline-none focus:bg-white focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] resize-none"
                required
              />
            </div>

            {/* Optional Attachment */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-[#475569]">
                Attachment (Optional, max 15MB)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingFile}
                  className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-bold text-[#0F172A] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5 text-[#14B8A6]" />
                  <span>{isUploadingFile ? 'Uploading...' : 'Attach Image or PDF'}</span>
                </button>
                {attachmentFile && (
                  <span className="text-xs text-[#0F172A] font-semibold truncate max-w-xs">
                    {attachmentFile.name}
                  </span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('faqs')}
                className="px-5 py-3 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingTicket || isUploadingFile}
                className="px-6 py-3 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] disabled:bg-[#E2E8F0] text-white disabled:text-[#94A3B8] text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                {isSubmittingTicket ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Ticket...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
