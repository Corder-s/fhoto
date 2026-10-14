-- ============================================================================
-- Migration: Complete Account Deletion & Zero-Footprint Cleanup
-- Migration ID: 20261014000003
-- ============================================================================
-- Ensures that when an authenticated user (Google OAuth or email/password)
-- deletes their account, ALL traces, identities, profiles, roles, and related
-- records are completely wiped from both auth.users and the public schema
-- without leaving any orphaned rows or tripping RESTRICT foreign keys.
-- ============================================================================

-- 1. UPDATE RESTRICT FOREIGN KEYS TO ON DELETE CASCADE
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT 
            tc.table_schema,
            tc.table_name,
            tc.constraint_name,
            kcu.column_name,
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        JOIN pg_constraint AS pgc
            ON pgc.conname = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND ccu.table_schema = 'public'
          AND ccu.table_name IN ('profiles', 'creator_profiles')
          AND pgc.confdeltype IN ('r', 'a') -- RESTRICT or NO ACTION
    ) LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I;', r.table_schema, r.table_name, r.constraint_name);
        EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I.%I(%I) ON DELETE CASCADE;',
            r.table_schema, r.table_name, r.constraint_name, r.column_name, r.foreign_table_schema, r.foreign_table_name, r.foreign_column_name);
    END LOOP;
END $$;

-- 2. CREATE BEFORE-DELETE TRIGGER FUNCTION ON auth.users
-- ----------------------------------------------------------------------------
-- When a user is deleted from auth.users (via admin.deleteUser or client deletion),
-- this trigger guarantees that all bookings, creator profiles, portfolios,
-- verification submissions, notifications, and application profiles are deleted.
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Delete all bookings where this user is customer
    DELETE FROM public.bookings WHERE customer_id = OLD.id;

    -- 2. Delete all bookings where this user is the photographer/creator
    DELETE FROM public.bookings WHERE creator_id IN (
        SELECT id FROM public.creator_profiles WHERE user_id = OLD.id
    );

    -- 3. Delete creator profile (which cascades creator_services, packages, portfolio, availability)
    DELETE FROM public.creator_profiles WHERE user_id = OLD.id;

    -- 4. Delete user profile (which cascades user_roles, favorites, notifications, chat)
    DELETE FROM public.profiles WHERE id = OLD.id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. BIND TRIGGER TO auth.users
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_on_auth_user_deleted ON auth.users;
CREATE TRIGGER trigger_on_auth_user_deleted
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_deleted();
