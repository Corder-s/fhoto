-- ============================================================================
-- SNAPSHOOT MIGRATION: GOOGLE OAUTH ACCOUNT SELECTION WORKFLOW
-- Migration: 20261014000002_oauth_account_selection_workflow.sql
-- Description:
--   1. Adds `role_selected` column to public.profiles to track whether a user
--      has finalized their account type (Client vs Photographer/Creator).
--   2. Updates `handle_new_auth_user()` trigger so Google OAuth signups do not
--      prematurely assign a default role before the user makes their selection.
--   3. Migrates all existing users to `role_selected = true` so established
--      clients, photographers, and administrators are never prompted again.
--   4. Preserves all existing bookings, portfolios, and verification records.
-- ============================================================================

-- 1. ADD role_selected TO public.profiles
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role_selected BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.role_selected IS
'Tracks whether the user has explicitly selected their account type (Client vs Photographer). False for new OAuth signups until they make their selection on /auth/select-role.';

-- 2. MIGRATE EXISTING USERS
-- ----------------------------------------------------------------------------
-- Any user who already has a role recorded, has a creator profile, or has bookings
-- has already completed account setup. Mark role_selected = true.
UPDATE public.profiles
SET role_selected = true
WHERE id IN (SELECT user_id FROM public.user_roles)
   OR id IN (SELECT user_id FROM public.creator_profiles)
   OR id IN (SELECT customer_id FROM public.bookings);

-- 3. UPDATE handle_new_auth_user() TRIGGER FUNCTION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    requested_role TEXT;
    assigned_role TEXT;
    has_role BOOLEAN := false;
    user_name TEXT;
    user_phone TEXT;
    user_avatar TEXT;
BEGIN
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    user_phone := NEW.raw_user_meta_data->>'phone';
    user_avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'
    );

    requested_role := NEW.raw_user_meta_data->>'role';

    -- Check if an explicit self-service role was provided at signup (e.g. from /api/auth/register).
    -- If 'creator' was requested, grant 'creator'.
    -- If another non-empty role was requested (e.g. crafted 'admin'), downgrade to 'customer'
    -- (security guard: self-assigned admin can never be granted).
    -- If no role was specified (standard Google OAuth login), leave role unassigned until
    -- the user completes role selection on /auth/select-role.
    IF requested_role = 'creator' THEN
        assigned_role := 'creator';
        has_role := true;
    ELSIF requested_role IS NOT NULL AND requested_role <> '' THEN
        assigned_role := 'customer';
        has_role := true;
    ELSE
        assigned_role := NULL;
        has_role := false;
    END IF;

    -- Insert or update public.profiles
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone_number,
        avatar_url,
        account_status,
        role_selected
    )
    VALUES (
        NEW.id,
        user_name,
        NEW.email,
        user_phone,
        user_avatar,
        'active',
        has_role
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
        email = EXCLUDED.email,
        phone_number = COALESCE(public.profiles.phone_number, EXCLUDED.phone_number),
        updated_at = NOW();

    -- Only assign a role automatically if an explicit valid role was chosen upfront
    IF has_role AND assigned_role IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, assigned_role)
        ON CONFLICT (user_id, role) DO NOTHING;

        IF assigned_role = 'creator' THEN
            INSERT INTO public.creator_profiles (user_id, professional_name, city, verification_status)
            VALUES (NEW.id, user_name, 'Delhi NCR', 'unsubmitted')
            ON CONFLICT (user_id) DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. GRANT COLUMN PRIVILEGES FOR AUTHENTICATED USERS
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    GRANT SELECT (role_selected) ON public.profiles TO authenticated;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
