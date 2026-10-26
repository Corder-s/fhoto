-- Performance Indexes and Query Optimization
-- Migration: 20261014000008_performance_indexes_and_query_optimization.sql
--
-- Adds targeted composite and foreign-key indexes identified during the performance audit
-- to eliminate sequential scans, avoid in-memory sorting, and optimize photographer discovery,
-- profile lookups, customer/photographer dashboard lists, and payment audits.

-- 1. Creator Profiles: lookup by authenticated user_id and fast discovery ranking
CREATE INDEX IF NOT EXISTS idx_creator_profiles_user_id
  ON public.creator_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_creator_profiles_verification_rating
  ON public.creator_profiles(verification_status, average_rating DESC);

-- 2. Creator Services: filter by creator and active status
CREATE INDEX IF NOT EXISTS idx_creator_services_creator_active
  ON public.creator_services(creator_id, is_active);

-- 3. Creator Portfolio: sorted published portfolio items per creator
CREATE INDEX IF NOT EXISTS idx_creator_portfolio_creator_published
  ON public.creator_portfolio_items(creator_id, is_published, display_order);

-- 4. Bookings: fast booking reference lookup and sorted dashboard filtering
CREATE INDEX IF NOT EXISTS idx_bookings_reference
  ON public.bookings(booking_reference);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_created
  ON public.bookings(customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_creator_event_date
  ON public.bookings(creator_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_status_created
  ON public.bookings(booking_status, created_at DESC);

-- 5. Payments: fast per-booking chronological resolution
CREATE INDEX IF NOT EXISTS idx_payments_booking_created
  ON public.payments(booking_id, created_at DESC);

-- 6. Reviews: creator rating distribution and review summaries
CREATE INDEX IF NOT EXISTS idx_reviews_creator_rating
  ON public.reviews(creator_id, rating);
