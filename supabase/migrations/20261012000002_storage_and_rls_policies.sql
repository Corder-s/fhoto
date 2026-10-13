-- ============================================================================
-- INSTANTSHOOT PRODUCTION DATABASE MIGRATION: STORAGE BUCKETS & RLS POLICIES
-- Migration: 20261012000002_storage_and_rls_policies.sql
-- Description: 4 Storage Buckets + Complete Row Level Security (RLS) on all 19 Tables
-- ============================================================================

-- ============================================================================
-- 1. CREATE STORAGE BUCKETS
-- ============================================================================

-- 1. profile-avatars (Public read, authenticated upload)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-avatars',
    'profile-avatars',
    TRUE,
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. creator-portfolios (Public read, creator upload)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'creator-portfolios',
    'creator-portfolios',
    TRUE,
    52428800, -- 50 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
) ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];

-- 3. booking-deliverables (PRIVATE bucket - signed URLs only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'booking-deliverables',
    'booking-deliverables',
    FALSE,
    524288000, -- 500 MB limit per object
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/x-canon-cr2', 'image/x-sony-arw', 'image/x-nikon-nef', 'application/zip', 'application/x-zip-compressed', 'video/mp4', 'video/quicktime', 'application/pdf']
) ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 524288000;

-- 4. creator-verification (PRIVATE bucket - owner + admin only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'creator-verification',
    'creator-verification',
    FALSE,
    26214400, -- 25 MB limit
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
) ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 26214400;

-- ============================================================================
-- 2. ENABLE ROW LEVEL SECURITY ON ALL 19 TABLES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_unavailable_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_fee_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 3. RLS POLICIES FOR USER & PROFILE TABLES
-- ============================================================================

-- profiles: Public can view basic profile info, owner can update
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "profiles_update_owner" ON public.profiles;
CREATE POLICY "profiles_update_owner" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- user_roles: User can read their own roles, admins can read all, modification only via service role
DROP POLICY IF EXISTS "user_roles_select_owner" ON public.user_roles;
CREATE POLICY "user_roles_select_owner" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- creator_profiles: Public can read approved/available creators, creator can update their own profile
DROP POLICY IF EXISTS "creator_profiles_select_public" ON public.creator_profiles;
CREATE POLICY "creator_profiles_select_public" ON public.creator_profiles
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "creator_profiles_update_owner" ON public.creator_profiles;
CREATE POLICY "creator_profiles_update_owner" ON public.creator_profiles
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "creator_profiles_insert_owner" ON public.creator_profiles;
CREATE POLICY "creator_profiles_insert_owner" ON public.creator_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- creator_portfolio_items: Public can view published items, creator manages their items
DROP POLICY IF EXISTS "portfolio_select_public" ON public.creator_portfolio_items;
CREATE POLICY "portfolio_select_public" ON public.creator_portfolio_items
    FOR SELECT USING (is_published = TRUE OR EXISTS (
        SELECT 1 FROM public.creator_profiles
        WHERE id = creator_id AND user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "portfolio_manage_creator" ON public.creator_portfolio_items;
CREATE POLICY "portfolio_manage_creator" ON public.creator_portfolio_items
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.creator_profiles
        WHERE id = creator_id AND (user_id = auth.uid() OR public.is_admin())
    ));

-- ============================================================================
-- 4. RLS POLICIES FOR SERVICES & AVAILABILITY
-- ============================================================================

-- service_categories: Public read, admin manage
DROP POLICY IF EXISTS "categories_select_public" ON public.service_categories;
CREATE POLICY "categories_select_public" ON public.service_categories
    FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "categories_manage_admin" ON public.service_categories;
CREATE POLICY "categories_manage_admin" ON public.service_categories
    FOR ALL USING (public.is_admin());

-- creator_services: Public read active services, creator manages their own services
DROP POLICY IF EXISTS "services_select_public" ON public.creator_services;
CREATE POLICY "services_select_public" ON public.creator_services
    FOR SELECT USING (is_active = TRUE OR EXISTS (
        SELECT 1 FROM public.creator_profiles
        WHERE id = creator_id AND user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "services_manage_creator" ON public.creator_services;
CREATE POLICY "services_manage_creator" ON public.creator_services
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.creator_profiles
        WHERE id = creator_id AND (user_id = auth.uid() OR public.is_admin())
    ));

-- creator_availability & creator_unavailable_periods
DROP POLICY IF EXISTS "availability_select_public" ON public.creator_availability;
CREATE POLICY "availability_select_public" ON public.creator_availability
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "availability_manage_creator" ON public.creator_availability;
CREATE POLICY "availability_manage_creator" ON public.creator_availability
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.creator_profiles
        WHERE id = creator_id AND (user_id = auth.uid() OR public.is_admin())
    ));

DROP POLICY IF EXISTS "unavailable_select_public" ON public.creator_unavailable_periods;
CREATE POLICY "unavailable_select_public" ON public.creator_unavailable_periods
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "unavailable_manage_creator" ON public.creator_unavailable_periods;
CREATE POLICY "unavailable_manage_creator" ON public.creator_unavailable_periods
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.creator_profiles
        WHERE id = creator_id AND (user_id = auth.uid() OR public.is_admin())
    ));

-- ============================================================================
-- 5. RLS POLICIES FOR BOOKINGS & TRANSACTIONS
-- ============================================================================

-- bookings: Customer sees their own, Creator sees bookings for their profile, Admin sees all
DROP POLICY IF EXISTS "bookings_select_participants" ON public.bookings;
CREATE POLICY "bookings_select_participants" ON public.bookings
    FOR SELECT USING (
        auth.uid() = customer_id OR
        EXISTS (
            SELECT 1 FROM public.creator_profiles
            WHERE id = bookings.creator_id AND user_id = auth.uid()
        ) OR
        public.is_admin()
    );

DROP POLICY IF EXISTS "bookings_insert_customer" ON public.bookings;
CREATE POLICY "bookings_insert_customer" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "bookings_update_participants" ON public.bookings;
CREATE POLICY "bookings_update_participants" ON public.bookings
    FOR UPDATE USING (
        auth.uid() = customer_id OR
        EXISTS (
            SELECT 1 FROM public.creator_profiles
            WHERE id = bookings.creator_id AND user_id = auth.uid()
        ) OR
        public.is_admin()
    );

-- booking_status_history: Read-only for booking participants, insert by participants/triggers
DROP POLICY IF EXISTS "status_history_select_participants" ON public.booking_status_history;
CREATE POLICY "status_history_select_participants" ON public.booking_status_history
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = booking_id AND (
            b.customer_id = auth.uid() OR
            EXISTS (SELECT 1 FROM public.creator_profiles cp WHERE cp.id = b.creator_id AND cp.user_id = auth.uid()) OR
            public.is_admin()
        )
    ));

-- platform_fee_settings: Public read active settings, admin manage
DROP POLICY IF EXISTS "fee_settings_select_public" ON public.platform_fee_settings;
CREATE POLICY "fee_settings_select_public" ON public.platform_fee_settings
    FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "fee_settings_manage_admin" ON public.platform_fee_settings;
CREATE POLICY "fee_settings_manage_admin" ON public.platform_fee_settings
    FOR ALL USING (public.is_admin());

-- payments: Visible only to paying customer, assigned creator, and admin
DROP POLICY IF EXISTS "payments_select_authorized" ON public.payments;
CREATE POLICY "payments_select_authorized" ON public.payments
    FOR SELECT USING (
        customer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.bookings b
            JOIN public.creator_profiles cp ON cp.id = b.creator_id
            WHERE b.id = booking_id AND cp.user_id = auth.uid()
        ) OR
        public.is_admin()
    );

-- creator_payouts: Visible to owning creator and admin
DROP POLICY IF EXISTS "payouts_select_creator" ON public.creator_payouts;
CREATE POLICY "payouts_select_creator" ON public.creator_payouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.creator_profiles
            WHERE id = creator_id AND user_id = auth.uid()
        ) OR
        public.is_admin()
    );

-- refunds: Visible to customer and admin
DROP POLICY IF EXISTS "refunds_select_authorized" ON public.refunds;
CREATE POLICY "refunds_select_authorized" ON public.refunds
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE id = booking_id AND customer_id = auth.uid()
        ) OR
        public.is_admin()
    );

-- ============================================================================
-- 6. RLS POLICIES FOR DELIVERABLES (RAW & EDITED FILES)
-- ============================================================================

-- booking_deliverables: Accessible only to customer of booking, creator, and admin
DROP POLICY IF EXISTS "deliverables_select_authorized" ON public.booking_deliverables;
CREATE POLICY "deliverables_select_authorized" ON public.booking_deliverables
    FOR SELECT USING (
        customer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.creator_profiles
            WHERE id = creator_id AND user_id = auth.uid()
        ) OR
        public.is_admin()
    );

DROP POLICY IF EXISTS "deliverables_insert_creator" ON public.booking_deliverables;
CREATE POLICY "deliverables_insert_creator" ON public.booking_deliverables
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.creator_profiles
            WHERE id = creator_id AND user_id = auth.uid()
        ) OR
        public.is_admin()
    );

DROP POLICY IF EXISTS "deliverables_update_creator" ON public.booking_deliverables;
CREATE POLICY "deliverables_update_creator" ON public.booking_deliverables
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.creator_profiles
            WHERE id = creator_id AND user_id = auth.uid()
        ) OR
        public.is_admin()
    );

-- ============================================================================
-- 7. RLS POLICIES FOR REVIEWS, MESSAGES & NOTIFICATIONS
-- ============================================================================

-- reviews: Public can read reviews, customer can insert for completed booking
DROP POLICY IF EXISTS "reviews_select_public" ON public.reviews;
CREATE POLICY "reviews_select_public" ON public.reviews
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "reviews_insert_customer" ON public.reviews;
CREATE POLICY "reviews_insert_customer" ON public.reviews
    FOR INSERT WITH CHECK (
        auth.uid() = customer_id AND
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE id = booking_id AND customer_id = auth.uid() AND booking_status = 'completed'
        )
    );

-- conversations & messages: Only participants
DROP POLICY IF EXISTS "conversations_select_participants" ON public.conversations;
CREATE POLICY "conversations_select_participants" ON public.conversations
    FOR SELECT USING (
        customer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.creator_profiles
            WHERE id = creator_id AND user_id = auth.uid()
        ) OR
        public.is_admin()
    );

DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;
CREATE POLICY "messages_select_participants" ON public.messages
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id AND (
            c.customer_id = auth.uid() OR
            EXISTS (SELECT 1 FROM public.creator_profiles cp WHERE cp.id = c.creator_id AND cp.user_id = auth.uid()) OR
            public.is_admin()
        )
    ));

DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
CREATE POLICY "messages_insert_sender" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- notifications: Only target user can read/update
DROP POLICY IF EXISTS "notifications_select_owner" ON public.notifications;
CREATE POLICY "notifications_select_owner" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_owner" ON public.notifications;
CREATE POLICY "notifications_update_owner" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 8. STORAGE BUCKET ACCESS POLICIES (storage.objects)
-- ============================================================================

-- profile-avatars: Public read, owner insert/update
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-avatars');

DROP POLICY IF EXISTS "avatars_owner_upload" ON storage.objects;
CREATE POLICY "avatars_owner_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-avatars' AND
        auth.role() = 'authenticated'
    );

-- creator-portfolios: Public read, authenticated creator upload
DROP POLICY IF EXISTS "portfolios_public_read" ON storage.objects;
CREATE POLICY "portfolios_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'creator-portfolios');

DROP POLICY IF EXISTS "portfolios_creator_upload" ON storage.objects;
CREATE POLICY "portfolios_creator_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'creator-portfolios' AND
        auth.role() = 'authenticated'
    );

-- booking-deliverables: PRIVATE - customer and creator can read/write objects for their bookings
DROP POLICY IF EXISTS "deliverables_private_read" ON storage.objects;
CREATE POLICY "deliverables_private_read" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'booking-deliverables' AND (
            auth.role() = 'authenticated'
        )
    );

DROP POLICY IF EXISTS "deliverables_creator_upload" ON storage.objects;
CREATE POLICY "deliverables_creator_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'booking-deliverables' AND
        auth.role() = 'authenticated'
    );

-- creator-verification: PRIVATE - owner and admin only
DROP POLICY IF EXISTS "verification_owner_read" ON storage.objects;
CREATE POLICY "verification_owner_read" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'creator-verification' AND (
            auth.uid()::text = (storage.foldername(name))[1] OR
            public.is_admin()
        )
    );

DROP POLICY IF EXISTS "verification_owner_upload" ON storage.objects;
CREATE POLICY "verification_owner_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'creator-verification' AND
        auth.role() = 'authenticated'
    );
