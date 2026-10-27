-- ============================================================================
-- REEPY PRODUCTION DATABASE MIGRATION: SUPPORT TICKETS & RESOLUTION SYSTEM
-- Migration: 20261014000009_support_tickets_system.sql
-- Description: Unified Help Center and Ticket Management across Customer, Creator, and Admin panels
-- ============================================================================

-- 1. Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_reference TEXT NOT NULL UNIQUE,
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    requester_role TEXT NOT NULL CHECK (requester_role IN ('customer', 'creator', 'photographer', 'admin')),
    subject TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'bookings_reservations',
        'payments_refunds',
        'photographer_communication',
        'cancellations_rescheduling',
        'account_profile',
        'portfolio_uploads',
        'verification_identity',
        'payouts_earnings',
        'technical_problems',
        'other'
    )),
    description TEXT NOT NULL,
    related_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('new', 'open', 'awaiting_response', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 2. Create support_ticket_messages table
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'creator', 'photographer', 'admin', 'system')),
    message_text TEXT NOT NULL,
    is_internal_note BOOLEAN NOT NULL DEFAULT FALSE,
    attachment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for high-performance query optimization
CREATE INDEX IF NOT EXISTS idx_support_tickets_requester ON public.support_tickets(requester_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_booking ON public.support_tickets(related_booking_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON public.support_ticket_messages(ticket_id, created_at ASC);

-- 4. Automatic updated_at trigger on support_tickets
CREATE OR REPLACE FUNCTION public.handle_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_ticket_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_ticket_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_support_ticket_updated_at();

-- 5. Enable Row Level Security
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for support_tickets
-- Users can see their own tickets; admins and owners can see all tickets
CREATE POLICY "Users can view their own tickets or admins view all"
    ON public.support_tickets
    FOR SELECT
    USING (
        auth.uid() = requester_id
        OR public.is_admin()
        OR auth.role() = 'service_role'
    );

-- Authenticated users can create tickets for themselves
CREATE POLICY "Users can create their own support tickets"
    ON public.support_tickets
    FOR INSERT
    WITH CHECK (
        auth.uid() = requester_id
        OR public.is_admin()
        OR auth.role() = 'service_role'
    );

-- Admins can update tickets (status, assignment, priority, resolved_at); users can mark their open ticket closed
CREATE POLICY "Admins or owners can update any ticket, user can close own"
    ON public.support_tickets
    FOR UPDATE
    USING (
        public.is_admin()
        OR auth.uid() = requester_id
        OR auth.role() = 'service_role'
    )
    WITH CHECK (
        public.is_admin()
        OR (auth.uid() = requester_id AND status = 'closed')
        OR auth.role() = 'service_role'
    );

-- Only admins can delete tickets if necessary
CREATE POLICY "Admins or owners can delete tickets"
    ON public.support_tickets
    FOR DELETE
    USING (
        public.is_admin()
        OR auth.role() = 'service_role'
    );

-- 7. RLS Policies for support_ticket_messages
-- Requesters can see non-internal messages for their tickets; admins see all messages
CREATE POLICY "Users see non-internal messages of own tickets; admins see all"
    ON public.support_ticket_messages
    FOR SELECT
    USING (
        (
            EXISTS (
                SELECT 1 FROM public.support_tickets
                WHERE public.support_tickets.id = ticket_id
                  AND public.support_tickets.requester_id = auth.uid()
            )
            AND is_internal_note = FALSE
        )
        OR public.is_admin()
        OR auth.role() = 'service_role'
    );

-- Requesters can insert replies to their tickets (never internal); admins can insert replies or internal notes
CREATE POLICY "Users reply to own open tickets; admins reply to any"
    ON public.support_ticket_messages
    FOR INSERT
    WITH CHECK (
        (
            EXISTS (
                SELECT 1 FROM public.support_tickets
                WHERE public.support_tickets.id = ticket_id
                  AND public.support_tickets.requester_id = auth.uid()
                  AND public.support_tickets.status != 'closed'
            )
            AND auth.uid() = sender_id
            AND is_internal_note = FALSE
        )
        OR public.is_admin()
        OR auth.role() = 'service_role'
    );

-- 8. Support Attachments Private Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'support-attachments',
    'support-attachments',
    FALSE,
    15728640, -- 15 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 15728640,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Storage RLS on support-attachments bucket
CREATE POLICY "Authenticated users can upload support attachments"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'support-attachments'
        AND (auth.role() = 'authenticated' OR public.is_admin() OR auth.role() = 'service_role')
    );

CREATE POLICY "Users and admins can read support attachments"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'support-attachments'
        AND (auth.role() = 'authenticated' OR public.is_admin() OR auth.role() = 'service_role')
    );
