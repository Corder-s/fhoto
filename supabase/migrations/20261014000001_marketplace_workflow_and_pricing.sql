-- ============================================================================
-- INSTANTSHOOT PRODUCTION DATABASE MIGRATION:
-- DISTANCE-BASED PRICING, COVER BANNERS, EMAIL LOGS & AUTH OTP
-- Migration: 20261014000001_marketplace_workflow_and_pricing.sql
-- ============================================================================

-- 1. EXTEND creator_profiles FOR COVER BANNER & DISTANCE-BASED TRAVEL PRICING
ALTER TABLE public.creator_profiles
    ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
    ADD COLUMN IF NOT EXISTS base_address TEXT DEFAULT 'Connaught Place, New Delhi',
    ADD COLUMN IF NOT EXISTS base_latitude NUMERIC(10, 7) DEFAULT 28.6315,
    ADD COLUMN IF NOT EXISTS base_longitude NUMERIC(10, 7) DEFAULT 77.2167,
    ADD COLUMN IF NOT EXISTS included_travel_km INTEGER NOT NULL DEFAULT 10 CHECK (included_travel_km >= 0),
    ADD COLUMN IF NOT EXISTS travel_fee_per_km NUMERIC(10, 2) NOT NULL DEFAULT 20.00 CHECK (travel_fee_per_km >= 0),
    ADD COLUMN IF NOT EXISTS min_travel_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (min_travel_fee >= 0),
    ADD COLUMN IF NOT EXISTS max_travel_fee NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS allow_out_of_area BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.creator_profiles.cover_image_url IS
    'High-resolution profile cover banner. Distinct from gallery portfolio items.';
COMMENT ON COLUMN public.creator_profiles.included_travel_km IS
    'Travel distance in kilometres included in the base package price before travel fee applies.';
COMMENT ON COLUMN public.creator_profiles.travel_fee_per_km IS
    'Rate in INR per chargeable kilometre beyond included travel distance.';

-- 2. EXTEND bookings FOR AUTHORITATIVE PRICING SNAPSHOTS & DISTANCE
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS travel_distance_km NUMERIC(8, 2),
    ADD COLUMN IF NOT EXISTS distance_method TEXT DEFAULT 'haversine_straight_line'
        CHECK (distance_method IN ('road', 'haversine_straight_line')),
    ADD COLUMN IF NOT EXISTS included_travel_km INTEGER DEFAULT 10,
    ADD COLUMN IF NOT EXISTS chargeable_distance_km NUMERIC(8, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS travel_rate_per_km NUMERIC(10, 2) DEFAULT 20.00,
    ADD COLUMN IF NOT EXISTS travel_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (travel_fee >= 0),
    ADD COLUMN IF NOT EXISTS pricing_breakdown JSONB;

COMMENT ON COLUMN public.bookings.pricing_breakdown IS
    'Immutable financial snapshot preserving package base price, distance, rates, travel fees, taxes, and platform fees at booking time.';

-- 3. EXTEND notifications FOR DEEP ACTION URLS & STRUCTURED METADATA
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS action_url TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 4. EMAIL DELIVERY LOGS
CREATE TABLE IF NOT EXISTS public.email_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email TEXT NOT NULL,
    recipient_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    template_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    event_type TEXT NOT NULL,
    related_entity_id UUID,
    idempotency_key TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_recipient ON public.email_delivery_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_status ON public.email_delivery_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_idemp ON public.email_delivery_logs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_created ON public.email_delivery_logs(created_at DESC);

ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Only service role and verified administrators may inspect email delivery logs
DROP POLICY IF EXISTS "email_delivery_logs_admin_select" ON public.email_delivery_logs;
CREATE POLICY "email_delivery_logs_admin_select" ON public.email_delivery_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'owner')
        )
    );

-- 5. AUTHENTICATION EMAIL OTP VERIFICATION
CREATE TABLE IF NOT EXISTS public.auth_email_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp_code_hash TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'login' CHECK (purpose IN ('login', 'register', 'verification')),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_email_otps_email ON public.auth_email_otps(email);
CREATE INDEX IF NOT EXISTS idx_auth_email_otps_expires ON public.auth_email_otps(expires_at);

ALTER TABLE public.auth_email_otps ENABLE ROW LEVEL SECURITY;

-- 6. NOTIFICATION RLS HARDENING
-- Ensure users can read and update (mark read) their own notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
    FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Allow creators to update their own cover_image_url and travel pricing
DROP POLICY IF EXISTS "creator_profiles_update_owner_pricing" ON public.creator_profiles;
-- The existing creator_profiles_update_owner policy already permits user_id = auth.uid()
