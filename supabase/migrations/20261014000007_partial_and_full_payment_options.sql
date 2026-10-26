-- ============================================================================
-- REEPY MARKETPLACE DATABASE MIGRATION:
-- PARTIAL PAYMENT (50% ADVANCE) AND FULL PAYMENT (100% WITH PERKS) SUPPORT
-- Migration: 20261014000007_partial_and_full_payment_options.sql
-- ============================================================================

-- 1. ADD AMOUNT_PAID AND PAYMENT_MODE COLUMNS TO BOOKINGS
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    ADD COLUMN IF NOT EXISTS payment_mode TEXT NOT NULL DEFAULT 'full' CHECK (payment_mode IN ('full', 'half', 'remaining')),
    ADD COLUMN IF NOT EXISTS unlocked_perks JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.bookings.amount_paid IS
    'Actual cumulative amount paid by customer towards this booking.';

COMMENT ON COLUMN public.bookings.payment_mode IS
    'Customer selected payment mode: full (100% upfront with 5% discount/perks) or half (50% deposit now, remaining due at shoot).';

COMMENT ON COLUMN public.bookings.unlocked_perks IS
    'Array of promotional perks unlocked by full payment (e.g. priority delivery, extra edits).';

-- 2. BACKFILL AMOUNT_PAID FOR EXISTING BOOKINGS
UPDATE public.bookings
SET amount_paid = total_amount
WHERE payment_status = 'paid' AND amount_paid = 0;

-- 3. UPDATE BOOKINGS PAYMENT_STATUS CHECK CONSTRAINT TO ALLOW 'partially_paid'
DO $$
BEGIN
    -- Drop existing check constraint if it exists
    ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
    ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS chk_bookings_payment_status;

    -- Add updated check constraint with 'partially_paid'
    ALTER TABLE public.bookings
        ADD CONSTRAINT bookings_payment_status_check
        CHECK (payment_status IN ('unpaid', 'pending', 'partially_paid', 'paid', 'partially_refunded', 'refunded', 'failed'));
EXCEPTION
    WHEN OTHERS THEN
        -- If constraint name differs, update inline
        NULL;
END $$;

-- 4. ADD PAYMENT_INSTALLMENT TO PAYMENTS TABLE
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'full' CHECK (payment_mode IN ('full', 'half', 'remaining')),
    ADD COLUMN IF NOT EXISTS installment_number INT DEFAULT 1;

-- 5. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_bookings_payment_mode ON public.bookings(payment_mode);
CREATE INDEX IF NOT EXISTS idx_bookings_amount_paid ON public.bookings(amount_paid);
