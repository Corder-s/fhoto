-- ============================================================================
-- INSTANTSHOOT SECURITY HARDENING
-- Migration: 20261013000001_security_hardening.sql
-- Description:
--   Additive, idempotent fixes to the schema created by
--   20261012000001_master_instantshoot_schema.sql and
--   20261012000002_storage_and_rls_policies.sql. Existing migrations are NOT
--   edited so that databases where they were already applied stay consistent.
--
--   1. Self-service signup can only ever create 'customer' or 'creator' roles.
--      Admin is never granted from user metadata (privilege escalation fix).
--   2. Users can no longer change restricted profile fields (account_status,
--      verification timestamps) or restricted creator fields
--      (verification_status, rating, review counters) with the anon/user key.
--   3. Users can no longer insert bookings directly; bookings are created by
--      the server (service role) after authorization and server-side pricing.
--   4. Restricted booking money/status columns can only be changed by the
--      platform (service role / admin), not by booking participants.
--   5. Profile rows are no longer publicly readable for e-mail and phone
--      numbers; creator profiles are publicly visible only once approved.
--   6. Messages can only be inserted into conversations the sender belongs to.
--   7. Storage object policies are scoped to ownership:
--        profile-avatars        -> object path must start with auth.uid()
--        creator-verification   -> object path must start with auth.uid()
--        creator-portfolios     -> object path must start with auth.uid()
--        booking-deliverables   -> object path must start with the booking id,
--                                  readable only by booking participants/admin,
--                                  writable only by the booking's creator/admin.
--
-- Service-role connections (used by the Next.js route handlers) are treated as
-- privileged by public.is_privileged_session(), so server-side workflows keep
-- working while browser-side writes are constrained.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Helper: is the current database session a privileged (server) session?
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_privileged_session()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT
        COALESCE(auth.role(), '') = 'service_role'
        OR current_user IN ('postgres', 'supabase_admin', 'service_role')
        OR public.is_admin();
$$;

-- ----------------------------------------------------------------------------
-- 1. Signup role whitelist
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role TEXT;
    user_name TEXT;
    user_phone TEXT;
BEGIN
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    user_phone := NEW.raw_user_meta_data->>'phone';

    -- Self-service signup may request only 'creator'; anything else becomes 'customer'.
    -- 'admin' can never be self-assigned; it must be granted directly in user_roles.
    assigned_role := CASE
        WHEN NEW.raw_user_meta_data->>'role' = 'creator' THEN 'creator'
        ELSE 'customer'
    END;

    INSERT INTO public.profiles (id, full_name, email, phone_number, account_status)
    VALUES (NEW.id, user_name, NEW.email, user_phone, 'active')
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone_number = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number),
        updated_at = NOW();

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, assigned_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    IF assigned_role = 'creator' THEN
        INSERT INTO public.creator_profiles (user_id, professional_name, city)
        VALUES (NEW.id, user_name, 'Delhi NCR')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 2. Profile restricted-column guard
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_profile_restricted_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF public.is_privileged_session() THEN
        RETURN NEW;
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.account_status IS DISTINCT FROM OLD.account_status
       OR NEW.email_verified_at IS DISTINCT FROM OLD.email_verified_at
       OR NEW.phone_verified_at IS DISTINCT FROM OLD.phone_verified_at THEN
        RAISE EXCEPTION 'Restricted profile fields can only be changed by the platform'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_profile_restricted_columns ON public.profiles;
CREATE TRIGGER trg_guard_profile_restricted_columns
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_profile_restricted_columns();

-- ----------------------------------------------------------------------------
-- 3. Creator profile restricted-column guard (approval cannot be self-granted)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_creator_restricted_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF public.is_privileged_session() THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.verification_status := 'unsubmitted';
        NEW.average_rating := 5.00;
        NEW.total_reviews := 0;
        RETURN NEW;
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
       OR NEW.average_rating IS DISTINCT FROM OLD.average_rating
       OR NEW.total_reviews IS DISTINCT FROM OLD.total_reviews THEN
        RAISE EXCEPTION 'Creator verification and rating fields can only be changed by the platform'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_creator_restricted_columns ON public.creator_profiles;
CREATE TRIGGER trg_guard_creator_restricted_columns
    BEFORE INSERT OR UPDATE ON public.creator_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_creator_restricted_columns();

-- ----------------------------------------------------------------------------
-- 4. Booking restricted-column guard
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_booking_restricted_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF public.is_privileged_session() THEN
        RETURN NEW;
    END IF;

    IF NEW.booking_reference IS DISTINCT FROM OLD.booking_reference
       OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
       OR NEW.creator_id IS DISTINCT FROM OLD.creator_id
       OR NEW.service_id IS DISTINCT FROM OLD.service_id
       OR NEW.event_date IS DISTINCT FROM OLD.event_date
       OR NEW.start_at IS DISTINCT FROM OLD.start_at
       OR NEW.end_at IS DISTINCT FROM OLD.end_at
       OR NEW.agreed_service_price IS DISTINCT FROM OLD.agreed_service_price
       OR NEW.platform_fee IS DISTINCT FROM OLD.platform_fee
       OR NEW.taxes IS DISTINCT FROM OLD.taxes
       OR NEW.discount_amount IS DISTINCT FROM OLD.discount_amount
       OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
       OR NEW.currency IS DISTINCT FROM OLD.currency
       OR NEW.booking_type IS DISTINCT FROM OLD.booking_type
       OR NEW.booking_status IS DISTINCT FROM OLD.booking_status
       OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
       OR NEW.cancellation_reason IS DISTINCT FROM OLD.cancellation_reason THEN
        RAISE EXCEPTION 'Booking commercial and status fields can only be changed through the booking service'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_booking_restricted_columns ON public.bookings;
CREATE TRIGGER trg_guard_booking_restricted_columns
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_booking_restricted_columns();

-- Direct browser inserts of bookings would bypass server-side pricing and the
-- availability check, so the insert policy is removed. Server routes insert
-- with the service role.
DROP POLICY IF EXISTS "bookings_insert_customer" ON public.bookings;

-- ----------------------------------------------------------------------------
-- 5. Profile & creator visibility
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_visible" ON public.profiles;
CREATE POLICY "profiles_select_visible" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.creator_profiles cp
            WHERE cp.user_id = profiles.id AND cp.verification_status = 'approved'
        )
    );

-- Anonymous (unauthenticated) API clients may read only non-sensitive profile columns.
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, full_name, avatar_url, account_status, created_at, updated_at) ON public.profiles TO anon;

DROP POLICY IF EXISTS "creator_profiles_select_public" ON public.creator_profiles;
DROP POLICY IF EXISTS "creator_profiles_select_visible" ON public.creator_profiles;
CREATE POLICY "creator_profiles_select_visible" ON public.creator_profiles
    FOR SELECT USING (
        verification_status = 'approved'
        OR user_id = auth.uid()
        OR public.is_admin()
    );

-- ----------------------------------------------------------------------------
-- 6. Deliverables: insert/update must belong to the booking's creator
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "deliverables_insert_creator" ON public.booking_deliverables;
CREATE POLICY "deliverables_insert_creator" ON public.booking_deliverables
    FOR INSERT WITH CHECK (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.bookings b
            JOIN public.creator_profiles cp ON cp.id = b.creator_id
            WHERE b.id = booking_deliverables.booking_id
              AND cp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "deliverables_update_creator" ON public.booking_deliverables;
CREATE POLICY "deliverables_update_creator" ON public.booking_deliverables
    FOR UPDATE USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.bookings b
            JOIN public.creator_profiles cp ON cp.id = b.creator_id
            WHERE b.id = booking_deliverables.booking_id
              AND cp.user_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- 7. Messages: sender must be a participant of the conversation
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
CREATE POLICY "messages_insert_sender" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
              AND (
                c.customer_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.creator_profiles cp
                    WHERE cp.id = c.creator_id AND cp.user_id = auth.uid()
                )
              )
        )
    );

-- ----------------------------------------------------------------------------
-- 8. Storage object policies (ownership-scoped)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "avatars_owner_upload" ON storage.objects;
CREATE POLICY "avatars_owner_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "portfolios_creator_upload" ON storage.objects;
CREATE POLICY "portfolios_creator_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'creator-portfolios'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "deliverables_private_read" ON storage.objects;
DROP POLICY IF EXISTS "deliverables_participant_read" ON storage.objects;
CREATE POLICY "deliverables_participant_read" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'booking-deliverables'
        AND (
            public.is_admin()
            OR EXISTS (
                SELECT 1
                FROM public.bookings b
                LEFT JOIN public.creator_profiles cp ON cp.id = b.creator_id
                WHERE b.id::text = (storage.foldername(name))[1]
                  AND (b.customer_id = auth.uid() OR cp.user_id = auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "deliverables_creator_upload" ON storage.objects;
CREATE POLICY "deliverables_creator_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'booking-deliverables'
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin()
            OR EXISTS (
                SELECT 1
                FROM public.bookings b
                JOIN public.creator_profiles cp ON cp.id = b.creator_id
                WHERE b.id::text = (storage.foldername(name))[1]
                  AND cp.user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "verification_owner_upload" ON storage.objects;
CREATE POLICY "verification_owner_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'creator-verification'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
