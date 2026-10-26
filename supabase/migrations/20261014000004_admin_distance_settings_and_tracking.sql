-- ============================================================================
-- REEPY MARKETPLACE DATABASE MIGRATION:
-- PLATFORM DISTANCE SETTINGS (20 KM FREE TRAVEL POLICY) & LIVE TRACKING
-- Migration: 20261014000004_admin_distance_settings_and_tracking.sql
-- ============================================================================

-- 1. PLATFORM DISTANCE & TRAVEL PRICING SETTINGS
CREATE TABLE IF NOT EXISTS public.platform_distance_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    free_travel_km NUMERIC(8, 2) NOT NULL DEFAULT 20.00 CHECK (free_travel_km >= 0),
    travel_fee_per_km NUMERIC(10, 2) NOT NULL DEFAULT 20.00 CHECK (travel_fee_per_km >= 0),
    distance_method TEXT NOT NULL DEFAULT 'haversine_geodesic'
        CHECK (distance_method IN ('haversine_geodesic', 'road')),
    round_trip_billing BOOLEAN NOT NULL DEFAULT FALSE,
    min_travel_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (min_travel_fee >= 0),
    max_travel_fee NUMERIC(10, 2) CHECK (max_travel_fee IS NULL OR max_travel_fee >= 0),
    allow_photographer_override BOOLEAN NOT NULL DEFAULT TRUE,
    require_quote_approval BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.platform_distance_settings IS
    'Configurable platform-wide distance and travel pricing rules. Free distance defaults to 20 km.';

-- Ensure single active settings row or versioned rows
INSERT INTO public.platform_distance_settings (
    free_travel_km,
    travel_fee_per_km,
    distance_method,
    round_trip_billing,
    min_travel_fee,
    allow_photographer_override,
    is_active
)
SELECT 20.00, 20.00, 'haversine_geodesic', FALSE, 0.00, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.platform_distance_settings WHERE is_active = TRUE);

-- Update default included travel distance on profiles and bookings to 20 km
ALTER TABLE public.creator_profiles
    ALTER COLUMN included_travel_km SET DEFAULT 20;

ALTER TABLE public.bookings
    ALTER COLUMN included_travel_km SET DEFAULT 20;

-- Enable RLS on platform_distance_settings
ALTER TABLE public.platform_distance_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_distance_settings_select" ON public.platform_distance_settings;
CREATE POLICY "platform_distance_settings_select" ON public.platform_distance_settings
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "platform_distance_settings_admin_write" ON public.platform_distance_settings;
CREATE POLICY "platform_distance_settings_admin_write" ON public.platform_distance_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'owner')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'owner')
        )
    );

-- 2. LIVE BOOKING LOCATIONS TABLE FOR REAL-TIME PHOTOGRAPHER TRACKING
CREATE TABLE IF NOT EXISTS public.live_booking_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    accuracy_meters NUMERIC(8, 2),
    heading NUMERIC(6, 2),
    speed_mps NUMERIC(6, 2),
    is_sharing BOOLEAN NOT NULL DEFAULT TRUE,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_booking_locations_booking ON public.live_booking_locations(booking_id);
CREATE INDEX IF NOT EXISTS idx_live_booking_locations_creator ON public.live_booking_locations(creator_id);

COMMENT ON TABLE public.live_booking_locations IS
    'Live GPS coordinates broadcast by assigned photographers during active shoots. Broadcast stops on completion/cancellation.';

-- Enable RLS on live_booking_locations
ALTER TABLE public.live_booking_locations ENABLE ROW LEVEL SECURITY;

-- Reading location: only customer of this booking, assigned creator, or admins
DROP POLICY IF EXISTS "live_locations_select" ON public.live_booking_locations;
CREATE POLICY "live_locations_select" ON public.live_booking_locations
    FOR SELECT
    USING (
        -- 1. Admins/owners
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'owner')
        )
        OR
        -- 2. The customer of the booking
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id AND b.customer_id = auth.uid()
        )
        OR
        -- 3. The assigned photographer
        EXISTS (
            SELECT 1 FROM public.creator_profiles cp
            WHERE cp.id = creator_id AND cp.user_id = auth.uid()
        )
    );

-- Writing location: only the assigned creator while booking is in an active state
DROP POLICY IF EXISTS "live_locations_creator_insert" ON public.live_booking_locations;
CREATE POLICY "live_locations_creator_insert" ON public.live_booking_locations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.creator_profiles cp
            WHERE cp.id = creator_id AND cp.user_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id
              AND b.creator_id = creator_id
              AND b.booking_status IN ('confirmed', 'in_progress', 'accepted')
        )
    );

DROP POLICY IF EXISTS "live_locations_creator_update" ON public.live_booking_locations;
CREATE POLICY "live_locations_creator_update" ON public.live_booking_locations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.creator_profiles cp
            WHERE cp.id = creator_id AND cp.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.creator_profiles cp
            WHERE cp.id = creator_id AND cp.user_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id
              AND b.creator_id = creator_id
              AND b.booking_status IN ('confirmed', 'in_progress', 'accepted')
        )
    );

-- Enable Supabase Realtime broadcast for live_booking_locations if publication exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_booking_locations;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Publication might not exist in local test/pglite environments
    NULL;
END $$;
