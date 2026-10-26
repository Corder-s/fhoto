-- ============================================================================
-- REEPY MARKETPLACE DATABASE MIGRATION:
-- RAZORPAY PAYMENT SYSTEM, PROVIDER ORDER TRACKING & AUDIT INTEGRITY
-- Migration: 20261014000006_razorpay_order_and_payment_system.sql
-- ============================================================================

-- 1. ADD ORDER AND SIGNATURE COLUMNS TO PAYMENTS TABLE
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS provider_order_id TEXT,
    ADD COLUMN IF NOT EXISTS signature TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.payments.provider_order_id IS
    'Gateway order reference (e.g. order_XXXXX from Razorpay or pay_ord_dev_XXXX in sandbox).';

COMMENT ON COLUMN public.payments.signature IS
    'HMAC SHA-256 payment signature verified server-side.';

COMMENT ON COLUMN public.payments.metadata IS
    'Gateway-returned response parameters, notes, and fee breakdowns.';

-- 2. CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_payments_provider_order_id ON public.payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON public.payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON public.payments(payment_status);

-- 3. ENSURE BOOKINGS AND PAYMENTS RLS INTEGRITY
-- Allow authenticated customers to view their payment records
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

-- Prevent unauthorized direct client inserts/updates to payments table
DROP POLICY IF EXISTS "payments_insert_server_only" ON public.payments;
CREATE POLICY "payments_insert_server_only" ON public.payments
    FOR INSERT WITH CHECK (
        public.is_admin() OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "payments_update_server_only" ON public.payments;
CREATE POLICY "payments_update_server_only" ON public.payments
    FOR UPDATE USING (
        public.is_admin() OR auth.role() = 'service_role'
    );
