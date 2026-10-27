import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

export async function POST(
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
      .select('id, requester_id, ticket_reference, status, requester_role')
      .eq('id', ticketId)
      .maybeSingle();

    if (ticketErr || !ticket) {
      return jsonError(404, 'Support ticket not found.');
    }

    // Access check: only ticket requester or admin can add messages
    if (!isAdminOrOwner && ticket.requester_id !== user.id) {
      return jsonError(403, 'Permission denied.');
    }

    if (ticket.status === 'closed') {
      return jsonError(400, 'This support ticket has been closed. Please open a new request if you need further assistance.');
    }

    const body = await req.json().catch(() => ({}));
    const { message_text, is_internal_note, attachment_url } = body;

    if (!message_text || typeof message_text !== 'string' || message_text.trim().length === 0) {
      return jsonError(400, 'Message cannot be empty.');
    }

    // Security check: non-admins CANNOT post internal notes
    const internalNoteFlag = isAdminOrOwner ? Boolean(is_internal_note) : false;

    // Sender role label
    const senderRole = isAdminOrOwner
      ? 'admin'
      : user.roles.includes('creator')
      ? 'creator'
      : 'customer';

    const { data: message, error: msgErr } = await admin
      .from('support_ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        sender_role: senderRole,
        message_text: message_text.trim(),
        is_internal_note: internalNoteFlag,
        attachment_url: attachment_url || null,
      })
      .select(`
        id,
        ticket_id,
        sender_id,
        sender_role,
        message_text,
        is_internal_note,
        attachment_url,
        created_at,
        sender:profiles!support_ticket_messages_sender_id_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (msgErr || !message) {
      return jsonError(500, `Failed to post message: ${msgErr?.message}`);
    }

    // Update ticket status and updated_at
    const ticketUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (isAdminOrOwner) {
      if (!internalNoteFlag && ticket.status !== 'resolved') {
        ticketUpdates.status = 'awaiting_response';
      }
    } else {
      // Requester replied -> ticket status becomes open
      if (ticket.status === 'awaiting_response' || ticket.status === 'resolved') {
        ticketUpdates.status = 'open';
      }
    }

    await admin.from('support_tickets').update(ticketUpdates).eq('id', ticketId);

    // Notify the other party
    if (isAdminOrOwner && !internalNoteFlag) {
      await admin.from('notifications').insert({
        user_id: ticket.requester_id,
        notification_type: 'support_ticket_reply',
        title: `Reply on Ticket #${ticket.ticket_reference}`,
        body: `Support Concierge replied: "${message_text.trim().slice(0, 80)}..."`,
      });
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (err: any) {
    return jsonError(500, err.message || 'Failed to post message.');
  }
}
