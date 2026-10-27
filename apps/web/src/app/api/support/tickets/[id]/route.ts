import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;
  const ticketId = params.id;

  const isAdminOrOwner = user.roles.includes('admin') || user.roles.includes('owner') || user.isOwner;

  try {
    const { data: ticket, error: ticketErr } = await admin
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
        booking:bookings(id, booking_reference, event_title, event_date, agreed_service_price, booking_status)
      `)
      .eq('id', ticketId)
      .maybeSingle();

    if (ticketErr || !ticket) {
      return jsonError(404, 'Support ticket not found.');
    }

    // Ownership boundary: requesters can only view their own tickets
    if (!isAdminOrOwner && ticket.requester_id !== user.id) {
      return jsonError(403, 'You do not have permission to view this ticket.');
    }

    // Messages query
    let msgQuery = admin
      .from('support_ticket_messages')
      .select(`
        id,
        sender_id,
        sender_role,
        message_text,
        is_internal_note,
        attachment_url,
        created_at,
        sender:profiles!support_ticket_messages_sender_id_fkey(id, full_name, avatar_url)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    // Requesters can NEVER see internal admin notes
    if (!isAdminOrOwner) {
      msgQuery = msgQuery.eq('is_internal_note', false);
    }

    const { data: messages, error: msgErr } = await msgQuery;

    if (msgErr) {
      return jsonError(500, 'Could not retrieve ticket conversation.');
    }

    return NextResponse.json({
      success: true,
      ticket,
      messages: messages || [],
    });
  } catch (err: any) {
    return jsonError(500, err.message || 'Internal server error.');
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;
  const ticketId = params.id;

  const isAdminOrOwner = user.roles.includes('admin') || user.roles.includes('owner') || user.isOwner;

  try {
    const { data: ticket, error: ticketErr } = await admin
      .from('support_tickets')
      .select('id, requester_id, ticket_reference, status')
      .eq('id', ticketId)
      .maybeSingle();

    if (ticketErr || !ticket) {
      return jsonError(404, 'Support ticket not found.');
    }

    const body = await req.json().catch(() => ({}));
    const { status, priority, assigned_admin_id } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (isAdminOrOwner) {
      if (status) {
        const validStatuses = ['new', 'open', 'awaiting_response', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) {
          return jsonError(400, 'Invalid ticket status.');
        }
        updates.status = status;
        if (status === 'resolved' || status === 'closed') {
          updates.resolved_at = new Date().toISOString();
        }
      }

      if (priority) {
        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        if (!validPriorities.includes(priority)) {
          return jsonError(400, 'Invalid priority level.');
        }
        updates.priority = priority;
      }

      if (assigned_admin_id !== undefined) {
        updates.assigned_admin_id = assigned_admin_id || null;
      }
    } else {
      // Requesters can ONLY close their own open tickets
      if (ticket.requester_id !== user.id) {
        return jsonError(403, 'Permission denied.');
      }
      if (status !== 'closed') {
        return jsonError(400, 'Requesters can only mark tickets as closed.');
      }
      updates.status = 'closed';
      updates.resolved_at = new Date().toISOString();
    }

    const { data: updated, error: updateErr } = await admin
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId)
      .select()
      .single();

    if (updateErr) {
      return jsonError(500, `Failed to update ticket: ${updateErr.message}`);
    }

    // If status was changed by admin, notify the ticket requester
    if (isAdminOrOwner && status && status !== ticket.status) {
      await admin.from('notifications').insert({
        user_id: ticket.requester_id,
        notification_type: 'support_ticket_updated',
        title: `Ticket #${ticket.ticket_reference} ${status.toUpperCase().replace('_', ' ')}`,
        body: `Your support ticket has been updated to ${status.replace('_', ' ')}.`,
      });
    }

    return NextResponse.json({
      success: true,
      ticket: updated,
    });
  } catch (err: any) {
    return jsonError(500, err.message || 'Failed to update ticket.');
  }
}
