-- ============================================================================
-- INSTANTSHOOT OWNER ROLE, ADMIN PERMISSIONS AND PHOTOGRAPHER VERIFICATION
-- Migration: 20261013000002_owner_roles_admin_permissions_and_verification.sql
-- Description:
--   Additive, idempotent follow-up to the security hardening migration
--   (20261013000001). Earlier migrations are not edited, so databases where
--   they were already applied stay consistent. Re-applying this file is safe.
--
--   1. Adds the 'owner' role to user_roles and teaches the platform helpers
--      that an owner is a superset of an admin.
--   2. Adds granular administrator permissions (admin_permissions) so that an
--      admin can be restricted to the duties they actually hold. An admin with
--      no permission rows keeps the full set, so existing accounts are
--      unaffected until an owner narrows them down.
--   3. Adds creator_verification_submissions: the durable record behind the
--      photographer verification workflow (submission -> pending -> reviewed).
--      A trigger keeps creator_profiles.verification_status and the
--      photographer's notifications in sync with every review decision, so a
--      decision made anywhere (admin dashboard, API, SQL console) publishes or
--      unpublishes the profile.
--   4. Allows 'suspended' as a creator verification state so a profile can be
--      unpublished without locking the photographer out of their account.
--
-- Privilege notes:
--   * No client-side policy lets a user write a review decision, a role, or a
--     permission. Those tables are writable by the service role only, and the
--     column guards repeat the rule at row level.
--   * No production data is modified by this migration and no role is granted
--     automatically. Creating the first owner is an operator action; the SQL is
--     at the bottom of this file.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. The owner role
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_roles
    DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_role_check
    CHECK (role IN ('customer', 'creator', 'admin', 'owner'));

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'owner'
    );
$$;

-- An owner holds every administrator capability, so the single admin check used
-- by the RLS policies now accepts both roles.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Granular administrator permissions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    permission TEXT NOT NULL CHECK (
        permission IN (
            'manage_photographer_verification',
            'manage_users',
            'manage_bookings',
            'manage_platform_settings',
            'manage_administrators'
        )
    ),
    granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_admin_permissions_user_permission UNIQUE (user_id, permission)
);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_permissions_select_owner" ON public.admin_permissions;
CREATE POLICY "admin_permissions_select_owner" ON public.admin_permissions
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- No insert/update/delete policy: only the service role (the Next.js route
-- handlers behind authorize()) may grant or revoke a permission.

COMMENT ON TABLE public.admin_permissions IS
    'Per-administrator capability grants. An admin with no rows inherits every permission; an owner always has every permission.';

-- Effective permission check. Kept in SQL so the database and the route
-- handlers agree on one definition.
CREATE OR REPLACE FUNCTION public.has_admin_permission(p_user UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
    -- No specific permission requested: the caller only has to be a platform
    -- administrator.
    IF p_permission IS NULL OR p_permission = '' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = p_user AND role IN ('admin', 'owner')
        );
    END IF;

    IF p_user IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Owners are unrestricted.
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user AND role = 'owner') THEN
        RETURN TRUE;
    END IF;

    -- Everyone else needs the admin role.
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user AND role = 'admin') THEN
        RETURN FALSE;
    END IF;

    -- Legacy compatibility: an admin that has never been narrowed down keeps
    -- the full permission set.
    IF NOT EXISTS (SELECT 1 FROM public.admin_permissions ap WHERE ap.user_id = p_user) THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.admin_permissions ap
        WHERE ap.user_id = p_user AND ap.permission = p_permission
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Suspended is a first-class creator verification state
-- ----------------------------------------------------------------------------
ALTER TABLE public.creator_profiles
    DROP CONSTRAINT IF EXISTS creator_profiles_verification_status_check;
ALTER TABLE public.creator_profiles
    ADD CONSTRAINT creator_profiles_verification_status_check
    CHECK (verification_status IN ('unsubmitted', 'pending', 'approved', 'rejected', 'suspended'));

-- ----------------------------------------------------------------------------
-- 4. Photographer verification submissions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_verification_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reference_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'needs_info')),
    legal_name TEXT,
    contact_phone TEXT,
    government_id_type TEXT
        CHECK (government_id_type IS NULL OR government_id_type IN
            ('aadhaar', 'pan', 'passport', 'driving_licence', 'voter_id')),
    -- Only a masked identifier is stored. Never a full document number.
    government_id_masked TEXT,
    gstin TEXT,
    business_name TEXT,
    equipment_summary TEXT,
    categories TEXT[] NOT NULL DEFAULT '{}',
    city TEXT,
    state TEXT,
    service_radius_km INTEGER CHECK (service_radius_km IS NULL OR service_radius_km > 0),
    portfolio_url TEXT,
    documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    applicant_notes TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    review_reason TEXT,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_verification_documents_is_array
        CHECK (jsonb_typeof(documents) = 'array'),
    CONSTRAINT chk_verification_review_pairing CHECK (
        (status = 'pending' AND reviewed_at IS NULL AND reviewed_by IS NULL)
        OR status <> 'pending'
    )
);

CREATE INDEX IF NOT EXISTS idx_verification_submissions_creator
    ON public.creator_verification_submissions (creator_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_submissions_user
    ON public.creator_verification_submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_verification_submissions_status
    ON public.creator_verification_submissions (status, submitted_at DESC);

-- At most one application per photographer is awaiting review at a time. The
-- route handlers rely on this as the integrity backstop for re-submissions.
CREATE UNIQUE INDEX IF NOT EXISTS uq_verification_one_pending_per_creator
    ON public.creator_verification_submissions (creator_id)
    WHERE status = 'pending';

ALTER TABLE public.creator_verification_submissions ENABLE ROW LEVEL SECURITY;

-- The applicant sees their own submissions; administrators and owners see all.
DROP POLICY IF EXISTS "verification_submissions_select_owner" ON public.creator_verification_submissions;
CREATE POLICY "verification_submissions_select_owner" ON public.creator_verification_submissions
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- An applicant may file, and only ever in the pending state.
DROP POLICY IF EXISTS "verification_submissions_insert_owner" ON public.creator_verification_submissions;
CREATE POLICY "verification_submissions_insert_owner" ON public.creator_verification_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- An applicant may withdraw an application that has not been reviewed yet.
DROP POLICY IF EXISTS "verification_submissions_delete_pending" ON public.creator_verification_submissions;
CREATE POLICY "verification_submissions_delete_pending" ON public.creator_verification_submissions
    FOR DELETE USING (auth.uid() = user_id AND status = 'pending');

-- There is deliberately no UPDATE policy: review decisions come from the
-- server (service role) only.

COMMENT ON TABLE public.creator_verification_submissions IS
    'Photographer verification applications. Reviews are written by the service role; triggers publish or unpublish creator_profiles.';

-- ----------------------------------------------------------------------------
-- 5. Column guard: applicants cannot write review fields
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_verification_submission_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    own_creator_id UUID;
BEGIN
    IF public.is_privileged_session() THEN
        RETURN NEW;
    END IF;

    IF auth.uid() IS NULL OR NEW.user_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'You can only file verification for your own account'
            USING ERRCODE = '42501';
    END IF;

    SELECT id INTO own_creator_id FROM public.creator_profiles WHERE user_id = auth.uid();
    IF own_creator_id IS NULL OR NEW.creator_id IS DISTINCT FROM own_creator_id THEN
        RAISE EXCEPTION 'Verification submissions must reference your own photographer profile'
            USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.status := 'pending';
        NEW.reviewed_at := NULL;
        NEW.reviewed_by := NULL;
        NEW.review_reason := NULL;
        NEW.review_notes := NULL;
        IF NEW.reference_code IS NULL OR NEW.reference_code = '' THEN
            NEW.reference_code := 'VER-' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 10));
        END IF;
        RETURN NEW;
    END IF;

    -- Reviewers work through the platform service, so a non-privileged session
    -- has no reason to update a submission at all.
    RAISE EXCEPTION 'Verification submissions can only be reviewed by the platform'
        USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_verification_submission_columns ON public.creator_verification_submissions;
CREATE TRIGGER trg_guard_verification_submission_columns
    BEFORE INSERT OR UPDATE ON public.creator_verification_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_verification_submission_columns();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verification_submissions_touch ON public.creator_verification_submissions;
CREATE TRIGGER trg_verification_submissions_touch
    BEFORE UPDATE ON public.creator_verification_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- 6. Keep the directory and the photographer in sync with every decision
-- ----------------------------------------------------------------------------
-- Filing an application puts the profile back in review; a decision publishes
-- or unpublishes it and notifies the photographer. The work happens in the
-- database so the three dashboards and the public directory cannot drift apart,
-- regardless of which client wrote the row.
CREATE OR REPLACE FUNCTION public.handle_verification_submission_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_profile_status TEXT;
    notification_title TEXT;
    notification_body TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.creator_profiles
           SET verification_status = 'pending', updated_at = NOW()
         WHERE id = NEW.creator_id
           AND verification_status <> 'pending';
        RETURN NEW;
    END IF;

    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;

    next_profile_status := CASE NEW.status
        WHEN 'approved' THEN 'approved'
        WHEN 'rejected' THEN 'rejected'
        ELSE 'pending'  -- pending / needs_info stay out of the public directory
    END;

    UPDATE public.creator_profiles
       SET verification_status = next_profile_status,
           updated_at = NOW()
     WHERE id = NEW.creator_id;

    notification_title := CASE NEW.status
        WHEN 'approved' THEN 'Your photographer profile is verified'
        WHEN 'rejected' THEN 'Your verification application was not approved'
        ELSE 'More information is needed for your verification'
    END;
    notification_body := CASE NEW.status
        WHEN 'approved' THEN 'Your profile is now visible in the SnapShoot directory and you can receive bookings.'
        WHEN 'rejected' THEN 'Reason: ' || COALESCE(NULLIF(NEW.review_reason, ''), 'not specified') || '. You may update your details and apply again.'
        ELSE 'Please re-upload the requested documents: ' || COALESCE(NULLIF(NEW.review_reason, ''), 'see your verification page')
    END;

    INSERT INTO public.notifications (user_id, notification_type, title, body)
    VALUES (NEW.user_id, 'creator_verification', notification_title, notification_body);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verification_submission_change ON public.creator_verification_submissions;
CREATE TRIGGER trg_verification_submission_change
    AFTER INSERT OR UPDATE ON public.creator_verification_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_verification_submission_change();

-- Reciprocal rule: a review written straight onto creator_profiles (the legacy
-- /api/admin/creators endpoint, or a suspension) closes the open application and
-- notifies the photographer, so the queue and the profile never disagree about a
-- photographer's state. Only terminal reviewer states are mirrored: a profile
-- moving into 'pending' is the applicant filing, not a decision.
CREATE OR REPLACE FUNCTION public.handle_creator_verification_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.verification_status IS NOT DISTINCT FROM OLD.verification_status THEN
        RETURN NEW;
    END IF;

    IF NEW.verification_status NOT IN ('approved', 'rejected', 'suspended') THEN
        RETURN NEW;
    END IF;

    UPDATE public.creator_verification_submissions
       SET status = CASE NEW.verification_status
               WHEN 'approved' THEN 'approved'
               ELSE 'rejected'
           END,
           reviewed_at = COALESCE(reviewed_at, NOW()),
           review_reason = COALESCE(
               review_reason,
               CASE WHEN NEW.verification_status = 'suspended'
                    THEN 'Photographer profile suspended by the platform.'
                    ELSE NULL
               END
           ),
           updated_at = NOW()
     WHERE creator_id = NEW.id
       AND status = 'pending';

    IF NEW.verification_status = 'suspended' THEN
        INSERT INTO public.notifications (user_id, notification_type, title, body)
        VALUES (
            NEW.user_id,
            'creator_verification',
            'Your photographer profile is suspended',
            'Your public profile has been unpublished by the platform. Contact support for details.'
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_creator_verification_status_change ON public.creator_profiles;
CREATE TRIGGER trg_creator_verification_status_change
    AFTER UPDATE OF verification_status ON public.creator_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_creator_verification_status_change();

-- ----------------------------------------------------------------------------
-- 7. Roles and permissions are service-role only
-- ----------------------------------------------------------------------------
-- user_roles already has no write policy for clients. The grant below removes
-- the ambiguity for anyone reading the schema, and the same holds for the new
-- tables: an authenticated browser session can read, file, and withdraw, but
-- cannot grant itself anything.
REVOKE UPDATE, DELETE, TRUNCATE ON public.user_roles FROM anon, authenticated;
REVOKE UPDATE, DELETE, TRUNCATE ON public.admin_permissions FROM anon, authenticated;
REVOKE UPDATE ON public.creator_verification_submissions FROM anon, authenticated;

-- A photographer must not be able to mark themselves verified by inserting an
-- already-approved row; the guard trigger resets the status, and the CHECK
-- constraint below is the belt.
DROP POLICY IF EXISTS "creator_profiles_insert_owner" ON public.creator_profiles;
CREATE POLICY "creator_profiles_insert_owner" ON public.creator_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id AND verification_status = 'unsubmitted');

-- ----------------------------------------------------------------------------
-- 8. Operator notes
-- ----------------------------------------------------------------------------
-- Create the first owner (run as postgres in the Supabase SQL editor, never
-- through a browser request). It targets an existing auth user, so no second
-- account is created:
--
--   INSERT INTO public.user_roles (user_id, role)
--   SELECT p.id, 'owner'
--     FROM public.profiles p
--    WHERE lower(p.email) = 'owner@example.com'
--   ON CONFLICT (user_id, role) DO NOTHING;
--
-- Narrow an existing admin down to specific duties:
--
--   DELETE FROM public.admin_permissions WHERE user_id = '<admin-user-id>';
--   INSERT INTO public.admin_permissions (user_id, permission)
--   VALUES ('<admin-user-id>', 'manage_photographer_verification');
--
-- Verify the guard rails:
--
--   SELECT public.has_admin_permission('<admin-user-id>', 'manage_users');    -- false
--   SELECT public.has_admin_permission('<admin-user-id>', 'manage_photographer_verification'); -- true
-- ============================================================================
