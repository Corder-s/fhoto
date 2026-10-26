-- ============================================================================
-- REEPY MARKETPLACE DATABASE MIGRATION:
-- BOOKING DURATION PERSISTENCE & ITEMIZED PRICING SNAPSHOT INTEGRITY
-- Migration: 20261014000005_booking_duration_and_itemized_pricing.sql
-- ============================================================================

-- 1. ADD DURATION_HOURS COLUMN TO BOOKINGS
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS duration_hours NUMERIC(5, 2) NOT NULL DEFAULT 2.00 CHECK (duration_hours > 0);

COMMENT ON COLUMN public.bookings.duration_hours IS
    'Authoritative selected shoot duration in hours (e.g. 1.0, 2.0, 4.0, 8.0). Preserves customer choice from booking modal.';

-- 2. BACKFILL DURATION_HOURS FOR EXISTING BOOKINGS FROM START_AT / END_AT INTERVAL
UPDATE public.bookings
SET duration_hours = GREATEST(1.00, ROUND(EXTRACT(EPOCH FROM (end_at - start_at)) / 3600.0, 2))
WHERE end_at > start_at;

-- 3. INDEX FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_bookings_duration_hours ON public.bookings(duration_hours);
