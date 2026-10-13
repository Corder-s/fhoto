-- ============================================================================
-- INSTANTSHOOT PRODUCTION DATABASE MIGRATION: MASTER SCHEMA
-- Migration: 20261012000001_master_instantshoot_schema.sql
-- Description: Core 15 Tables + Supporting Communication Tables + Indexes & Triggers
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. USER AND AUTHENTICATION TABLES
-- ============================================================================

-- 1. profiles
-- Application-level information for authenticated users (maps 1-to-1 with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending_verification')),
    email_verified_at TIMESTAMPTZ,
    phone_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. user_roles
-- Role-based access control (customer, creator, admin)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('customer', 'creator', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role)
);

-- 3. creator_profiles
-- Professional details and credentials for verified creators
CREATE TABLE IF NOT EXISTS public.creator_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    professional_name TEXT NOT NULL,
    biography TEXT,
    experience_years INTEGER NOT NULL DEFAULT 1 CHECK (experience_years >= 0),
    city TEXT NOT NULL DEFAULT 'Delhi NCR',
    state TEXT NOT NULL DEFAULT 'Delhi',
    service_radius INTEGER NOT NULL DEFAULT 25 CHECK (service_radius > 0), -- in km
    portfolio_url TEXT,
    verification_status TEXT NOT NULL DEFAULT 'unsubmitted' CHECK (verification_status IN ('unsubmitted', 'pending', 'approved', 'rejected')),
    average_rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (average_rating >= 1.00 AND average_rating <= 5.00),
    total_reviews INTEGER NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. creator_portfolio_items
-- Curated high-resolution photographs and cinema previews
CREATE TABLE IF NOT EXISTS public.creator_portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    media_type TEXT NOT NULL DEFAULT 'photo' CHECK (media_type IN ('photo', 'video')),
    preview_url TEXT NOT NULL,
    thumbnail_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. SERVICES AND AVAILABILITY TABLES
-- ============================================================================

-- 5. service_categories
-- High-demand creative categories across India
CREATE TABLE IF NOT EXISTS public.service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. creator_services
-- Creator-specific pricing, turnaround time, and package deliverables
CREATE TABLE IF NOT EXISTS public.creator_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC(12, 2) NOT NULL CHECK (base_price >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
    delivery_time_hours INTEGER NOT NULL DEFAULT 48 CHECK (delivery_time_hours > 0),
    service_type TEXT NOT NULL DEFAULT 'scheduled' CHECK (service_type IN ('instant', 'scheduled')),
    instant_booking_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. creator_availability
-- Creator working calendar intervals
CREATE TABLE IF NOT EXISTS public.creator_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    availability_status TEXT NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'tentative')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_creator_avail_range CHECK (end_at > start_at)
);

-- 8. creator_unavailable_periods
-- Blocked timeframes / blackouts preventing booking collisions
CREATE TABLE IF NOT EXISTS public.creator_unavailable_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_creator_unavail_range CHECK (end_at > start_at)
);

-- ============================================================================
-- 3. CUSTOMER BOOKINGS & STATUS HISTORY
-- ============================================================================

-- 9. bookings
-- Master customer booking contracts with financial snapshotting
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES public.creator_services(id) ON DELETE RESTRICT,
    event_title TEXT NOT NULL,
    event_date DATE NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    event_location TEXT NOT NULL,
    location_latitude NUMERIC(10, 7),
    location_longitude NUMERIC(10, 7),
    customer_notes TEXT,
    agreed_service_price NUMERIC(12, 2) NOT NULL CHECK (agreed_service_price >= 0),
    platform_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (platform_fee >= 0),
    taxes NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (taxes >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    booking_type TEXT NOT NULL DEFAULT 'scheduled' CHECK (booking_type IN ('instant', 'scheduled')),
    booking_status TEXT NOT NULL DEFAULT 'pending' CHECK (booking_status IN ('pending', 'accepted', 'rejected', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed')),
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'partially_refunded', 'refunded', 'failed')),
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_booking_time_range CHECK (end_at > start_at)
);

-- 10. booking_status_history
-- Immutable audit log of state changes
CREATE TABLE IF NOT EXISTS public.booking_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    change_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. PLATFORM FEE, PAYMENTS, PAYOUTS & REFUNDS
-- ============================================================================

-- 11. platform_fee_settings
-- Dynamic platform fee configuration
CREATE TABLE IF NOT EXISTS public.platform_fee_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_name TEXT NOT NULL,
    fee_type TEXT NOT NULL DEFAULT 'percentage' CHECK (fee_type IN ('percentage', 'fixed')),
    fee_value NUMERIC(10, 2) NOT NULL DEFAULT 10.00 CHECK (fee_value >= 0),
    applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'creator', 'customer')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. payments
-- Inbound customer payments with idempotency keys
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    provider TEXT NOT NULL DEFAULT 'razorpay' CHECK (provider IN ('razorpay', 'cashfree', 'stripe', 'dev_sandbox')),
    provider_payment_id TEXT,
    idempotency_key TEXT NOT NULL UNIQUE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'captured', 'paid', 'failed', 'refunded')),
    payment_method TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. creator_payouts
-- Escrow calculations and creator disbursements
CREATE TABLE IF NOT EXISTS public.creator_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE RESTRICT,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    gross_amount NUMERIC(12, 2) NOT NULL CHECK (gross_amount >= 0),
    platform_fee NUMERIC(12, 2) NOT NULL CHECK (platform_fee >= 0),
    adjustment_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(12, 2) NOT NULL CHECK (net_amount >= 0),
    payout_status TEXT NOT NULL DEFAULT 'in_escrow' CHECK (payout_status IN ('in_escrow', 'queued', 'processed', 'failed', 'disputed')),
    payout_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. refunds
-- Customer refund logs and gateway status tracking
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    refund_amount NUMERIC(12, 2) NOT NULL CHECK (refund_amount > 0),
    refund_reason TEXT,
    provider_refund_id TEXT,
    refund_status TEXT NOT NULL DEFAULT 'pending' CHECK (refund_status IN ('pending', 'processed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. RAW FILES, EDITED DELIVERABLES & MEDIA DELIVERY
-- ============================================================================

-- 15. booking_deliverables
-- Direct file uploads and external storage links (Google Drive, Vimeo, YouTube)
CREATE TABLE IF NOT EXISTS public.booking_deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    deliverable_type TEXT NOT NULL DEFAULT 'edited_photos' CHECK (deliverable_type IN ('raw_photos', 'raw_video', 'edited_photos', 'edited_video', 'final_album', 'project_files', 'other')),
    storage_provider TEXT NOT NULL DEFAULT 'supabase_storage' CHECK (storage_provider IN ('supabase_storage', 'google_drive', 'external_video', 'other_external')),
    storage_path TEXT,
    external_url TEXT,
    external_provider TEXT,
    file_name TEXT,
    mime_type TEXT,
    file_size_bytes BIGINT,
    delivery_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (delivery_status IN ('uploaded', 'ready_for_review', 'approved')),
    available_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. SUPPORTING TABLES: REVIEWS, MESSAGING & NOTIFICATIONS
-- ============================================================================

-- 16. reviews
-- Verified reviews linked strictly to completed bookings
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE RESTRICT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_conversation_participants UNIQUE (customer_id, creator_id, booking_id)
);

-- 18. messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- 19. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    related_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_creator_profiles_city ON public.creator_profiles(city);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_verification ON public.creator_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_available ON public.creator_profiles(is_available);
CREATE INDEX IF NOT EXISTS idx_creator_services_creator_id ON public.creator_services(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_services_category_id ON public.creator_services(category_id);
CREATE INDEX IF NOT EXISTS idx_creator_portfolio_creator_id ON public.creator_portfolio_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_creator_id ON public.bookings(creator_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON public.bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator_id ON public.creator_payouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_booking_deliverables_booking_id ON public.booking_deliverables(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_creator_id ON public.reviews(creator_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- ============================================================================
-- 8. AUTOMATION TRIGGERS & FUNCTIONS
-- ============================================================================

-- Auto-provision user profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role TEXT;
    user_name TEXT;
    user_phone TEXT;
BEGIN
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    user_phone := NEW.raw_user_meta_data->>'phone';
    assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');

    -- Insert into profiles
    INSERT INTO public.profiles (id, full_name, email, phone_number, account_status)
    VALUES (NEW.id, user_name, NEW.email, user_phone, 'active')
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone_number = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number),
        updated_at = NOW();

    -- Insert role if not exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, assigned_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- If registered as creator, initialize blank creator profile
    IF assigned_role = 'creator' THEN
        INSERT INTO public.creator_profiles (user_id, professional_name, city)
        VALUES (NEW.id, user_name, 'Delhi NCR')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_auth_user_created ON auth.users;
CREATE TRIGGER trigger_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

-- Trigger to record booking status transitions into booking_status_history
CREATE OR REPLACE FUNCTION public.handle_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.booking_status IS DISTINCT FROM NEW.booking_status THEN
        INSERT INTO public.booking_status_history (
            booking_id,
            previous_status,
            new_status,
            changed_by,
            change_reason
        ) VALUES (
            NEW.id,
            OLD.booking_status,
            NEW.booking_status,
            NEW.customer_id,
            'Status updated to ' || NEW.booking_status
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_booking_status_change ON public.bookings;
CREATE TRIGGER trigger_booking_status_change
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_booking_status_change();

-- Trigger to recalculate creator rating & total reviews
CREATE OR REPLACE FUNCTION public.handle_creator_review_update()
RETURNS TRIGGER AS $$
DECLARE
    new_avg NUMERIC(3, 2);
    new_count INTEGER;
BEGIN
    SELECT COALESCE(AVG(rating), 5.00), COUNT(*)
    INTO new_avg, new_count
    FROM public.reviews
    WHERE creator_id = NEW.creator_id;

    UPDATE public.creator_profiles
    SET average_rating = ROUND(new_avg, 2),
        total_reviews = new_count,
        updated_at = NOW()
    WHERE id = NEW.creator_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_creator_review_update ON public.reviews;
CREATE TRIGGER trigger_creator_review_update
    AFTER INSERT OR UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_creator_review_update();

-- ============================================================================
-- 9. DEFAULT SEED DATA (Service Categories & Platform Fee)
-- ============================================================================

INSERT INTO public.service_categories (name, slug, description)
VALUES 
    ('Wedding Photography', 'wedding-photography', 'Complete wedding celebration coverage, pheras, candid moments, and bridal portraits.'),
    ('Pre-Wedding Shoots', 'pre-wedding-shoots', 'Cinematic couple stories, destination visuals, and creative portraits.'),
    ('Event Photography', 'event-photography', 'Birthdays, corporate summits, anniversaries, and social galas.'),
    ('Product Photography', 'product-photography', 'E-commerce white-sweep cataloging, commercial lighting, and lifestyle staging.'),
    ('Videography & Reels', 'videography-reels', 'Trending 4K vertical Instagram reels, event highlight reels, and video coverage.'),
    ('Cinematography', 'cinematography', 'High-end cinema camera rigs, anamorphic aesthetics, and color-graded films.'),
    ('Corporate Photography', 'corporate-photography', 'Executive headshots, office culture, PR, and summit coverage.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.platform_fee_settings (fee_name, fee_type, fee_value, applies_to, is_active)
VALUES ('Standard Marketplace Platform Fee', 'percentage', 10.00, 'all', TRUE)
ON CONFLICT DO NOTHING;
