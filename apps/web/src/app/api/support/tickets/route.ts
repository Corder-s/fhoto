import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const url = new URL(req.url);
  const statusParam = url.searchParams.get('status');
  const roleParam = url.searchParams.get('role');
  const priorityParam = url.searchParams.get('priority');
  const searchParam = (url.searchParams.get('search') || '').trim().toLowerCase();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(5, parseInt(url.searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  const isAdminOrOwner = user.roles.includes('admin') || user.roles.includes('owner') || user.isOwner;

  try {
    if (!isAdminOrOwner) {
      // Requesters (customer or creator) view only their own tickets
      const { data: tickets, error, count } = await admin
        .from('support_tickets')
        .select(`
          id,
          ticket_reference,
          subject,
          category,
          description,
          related_booking_id,
          status,
          priority,
          attachment_url,
          created_at,
          updated_at,
          resolved_at,
          booking:bookings(id, booking_reference, event_title, event_date),
          messages:support_ticket_messages(id, message_text, is_internal_note, created_at, sender_role)
        `, { count: 'exact' })
        .eq('requester_id', user.id)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return jsonError(500, 'Could not fetch your support tickets.');
      }

      // Filter out internal notes from message snippets
      const sanitized = (tickets || []).map((t: any) => {
        const publicMsgs = (t.messages || []).filter((m: any) => !m.is_internal_note);
        const lastMsg = publicMsgs[publicMsgs.length - 1];
        return {
          id: t.id,
          ticket_reference: t.ticket_reference,
          subject: t.subject,
          category: t.category,
          description: t.description,
          related_booking_id: t.related_booking_id,
          booking: t.booking,
          status: t.status,
          priority: t.priority,
          attachment_url: t.attachment_url,
          created_at: t.created_at,
          updated_at: t.updated_at,
          resolved_at: t.resolved_at,
          message_count: publicMsgs.length,
          latest_reply: lastMsg ? {
            text: lastMsg.message_text.slice(0, 100),
            created_at: lastMsg.created_at,
            sender_role: lastMsg.sender_role,
          } : null,
        };
      });

      return NextResponse.json({
        success: true,
        tickets: sanitized,
        total: count || sanitized.length,
        page,
        limit,
      });
    }

    // Admin / Owner Support Desk
    let query = admin
      .from('support_tickets')
      .select(`
        id,
        ticket_reference,
        requester_id,
        requester_role,
        subject,
        category,
        description,
        related_booking_id,
        status,
        priority,
        assigned_admin_id,
        attachment_url,
        created_at,
        updated_at,
        resolved_at,
        requester:profiles!support_tickets_requester_id_fkey(id, full_name, email, avatar_url),
        assigned_admin:profiles!support_tickets_assigned_admin_id_fkey(id, full_name, email),
        booking:bookings(id, booking_reference, event_title, event_date, agreed_service_price, booking_status),
        messages:support_ticket_messages(id, message_text, is_internal_note, created_at, sender_role)
      `, { count: 'exact' });

    if (statusParam && statusParam !== 'all') {
      query = query.eq('status', statusParam);
    }
    if (roleParam && roleParam !== 'all') {
      query = query.eq('requester_role', roleParam);
    }
    if (priorityParam && priorityParam !== 'all') {
      query = query.eq('priority', priorityParam);
    }

    const { data: tickets, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return jsonError(500, `Could not fetch support queue: ${error.message}`);
    }

    // Filter tickets by search query client-side if provided
    let results = tickets || [];
    if (searchParam) {
      results = results.filter((t: any) =>
        t.ticket_reference?.toLowerCase().includes(searchParam) ||
        t.subject?.toLowerCase().includes(searchParam) ||
        t.requester?.full_name?.toLowerCase().includes(searchParam) ||
        t.requester?.email?.toLowerCase().includes(searchParam) ||
        t.booking?.booking_reference?.toLowerCase().includes(searchParam)
      );
    }

    // Calculate queue summary stats
    const { data: allStats } = await admin
      .from('support_tickets')
      .select('status, priority');

    const counts = {
      total: allStats?.length || 0,
      new: allStats?.filter((s) => s.status === 'new').length || 0,
      open: allStats?.filter((s) => s.status === 'open').length || 0,
      awaiting_response: allStats?.filter((s) => s.status === 'awaiting_response').length || 0,
      resolved: allStats?.filter((s) => s.status === 'resolved').length || 0,
      closed: allStats?.filter((s) => s.status === 'closed').length || 0,
    };

    return NextResponse.json({
      success: true,
      tickets: results,
      total: count || results.length,
      counts,
      page,
      limit,
    });
  } catch (err: any) {
    return jsonError(500, err.message || 'Internal server error while retrieving tickets.');
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  try {
    const body = await req.json().catch(() => ({}));
    const { subject, category, description, related_booking_id, attachment_url } = body;

    if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
      return jsonError(400, 'Please provide a clear ticket subject (minimum 3 characters).');
    }
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return jsonError(400, 'Please provide a detailed description of your issue (minimum 10 characters).');
    }

    const validCategories = [
      'bookings_reservations',
      'payments_refunds',
      'photographer_communication',
      'cancellations_rescheduling',
      'account_profile',
      'portfolio_uploads',
      'verification_identity',
      'payouts_earnings',
      'technical_problems',
      'other',
    ];

    if (!category || !validCategories.includes(category)) {
      return jsonError(400, 'Please select a valid help category.');
    }

    // If related_booking_id is provided, verify user ownership
    if (related_booking_id) {
      const { data: booking } = await admin
        .from('bookings')
        .select('id, customer_id, creator:creator_profiles(user_id)')
        .eq('id', related_booking_id)
        .maybeSingle();

      if (!booking) {
        return jsonError(400, 'Referenced booking could not be found.');
      }

      const creatorUserId = Array.isArray(booking.creator)
        ? (booking.creator as any)[0]?.user_id
        : (booking.creator as any)?.user_id;

      const isParticipant =
        booking.customer_id === user.id ||
        creatorUserId === user.id ||
        user.roles.includes('admin') ||
        user.roles.includes('owner');

      if (!isParticipant) {
        return jsonError(403, 'You can only link support tickets to your own bookings.');
      }
    }

    // Generate unique human-readable ticket reference
    const refCode = `${Date.now().toString(36).slice(-4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const ticketReference = `TCK-${refCode}`;

    // Determine requester role: creator or customer
    const primaryRequesterRole = user.roles.includes('creator')
      ? 'creator'
      : user.roles.includes('admin')
      ? 'admin'
      : 'customer';

    const { data: ticket, error: ticketError } = await admin
      .from('support_tickets')
      .insert({
        ticket_reference: ticketReference,
        requester_id: user.id,
        requester_role: primaryRequesterRole,
        subject: subject.trim(),
        category,
        description: description.trim(),
        related_booking_id: related_booking_id || null,
        status: 'open',
        priority: 'medium',
        attachment_url: attachment_url || null,
      })
      .select()
      .single();

    if (ticketError || !ticket) {
      return jsonError(500, `Failed to create support ticket: ${ticketError?.message}`);
    }

    // Insert initial message
    await admin.from('support_ticket_messages').insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      sender_role: primaryRequesterRole,
      message_text: description.trim(),
      is_internal_note: false,
      attachment_url: attachment_url || null,
    });

    // In-app notification for the requester
    await admin.from('notifications').insert({
      user_id: user.id,
      notification_type: 'support_ticket_created',
      title: 'Support Ticket Received',
      body: `Your ticket #${ticket.ticket_reference} has been received. Our concierge support desk will update you shortly.`,
      related_booking_id: related_booking_id || null,
    });

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticket_reference: ticket.ticket_reference,
        status: ticket.status,
        created_at: ticket.created_at,
      },
      message: `Support ticket #${ticket.ticket_reference} submitted successfully.`,
    });
  } catch (err: any) {
    return jsonError(500, err.message || 'Failed to submit support ticket.');
  }
}
