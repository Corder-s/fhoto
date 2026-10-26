/**
 * Database policy tests for the Supabase schema.
 *
 * Runs the real migration SQL in an in-process PostgreSQL (PGlite) and checks
 * row-level security, column guards and storage policies from the perspective
 * of the `anon`, `authenticated` and `service_role` database roles.
 *
 * The Supabase-managed `auth` and `storage` schemas are minimal stubs that
 * reproduce the functions the migrations depend on (auth.uid(), auth.role(),
 * storage.foldername()). This is an approximation of the hosted platform and
 * is documented in docs/TESTING_STRATEGY.md.
 *
 * Run: npm run test:db   (from the repository root)
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, '..', 'migrations');
const MIGRATIONS = [
  '20261012000001_master_instantshoot_schema.sql',
  '20261012000002_storage_and_rls_policies.sql',
  '20261013000001_security_hardening.sql',
  '20261013000002_owner_roles_admin_permissions_and_verification.sql',
  '20261014000001_marketplace_workflow_and_pricing.sql',
  '20261014000002_oauth_account_selection_workflow.sql',
  '20261014000003_complete_account_deletion_and_cleanup.sql',
  '20261014000004_admin_distance_settings_and_tracking.sql',
  '20261014000005_booking_duration_and_itemized_pricing.sql',
  '20261014000006_razorpay_order_and_payment_system.sql',
];

const SUPABASE_STUBS = `
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE SCHEMA IF NOT EXISTS storage;
  CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY,
    email TEXT,
    phone TEXT,
    raw_user_meta_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$
    SELECT NULLIF(COALESCE(current_setting('request.jwt.claims', true), '{}')::json->>'sub', '')::uuid
  $$;
  CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT LANGUAGE sql STABLE AS $$
    SELECT COALESCE(NULLIF(COALESCE(current_setting('request.jwt.claims', true), '{}')::json->>'role', ''), 'anon')
  $$;
  CREATE TABLE IF NOT EXISTS storage.buckets (
    id TEXT PRIMARY KEY, name TEXT, public BOOLEAN DEFAULT FALSE,
    file_size_limit BIGINT, allowed_mime_types TEXT[]
  );
  CREATE TABLE IF NOT EXISTS storage.objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id TEXT REFERENCES storage.buckets(id),
    name TEXT NOT NULL,
    owner UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  CREATE OR REPLACE FUNCTION storage.foldername(name TEXT) RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$
    SELECT (regexp_split_to_array(name, '/'))[1:array_length(regexp_split_to_array(name, '/'), 1) - 1]
  $$;
  DO $$ BEGIN
    CREATE ROLE anon NOLOGIN;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    CREATE ROLE authenticated NOLOGIN;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;
  GRANT EXECUTE ON FUNCTION auth.uid(), auth.role() TO anon, authenticated, service_role;
`;

// Supabase default privileges: broad table grants, row access controlled by RLS.
// Applied BEFORE the migrations, as on a fresh Supabase project, so that the
// migrations' explicit REVOKE/GRANT statements take effect.
const SUPABASE_DEFAULT_GRANTS = `
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
  GRANT ALL ON ALL TABLES IN SCHEMA storage TO anon, authenticated, service_role;
  GRANT ALL ON ALL TABLES IN SCHEMA auth TO anon, authenticated, service_role;
`;

let db;

/** Run a statement as a database role with the given JWT claims. */
async function asRole(role, sub, query, params = []) {
  const claims = JSON.stringify(
    role === 'service_role' ? { role: 'service_role' } : { role, sub: sub ?? null }
  );
  await db.exec('RESET ROLE');
  await db.query("SELECT set_config('request.jwt.claims', $1, false)", [claims]);
  await db.exec(`SET ROLE ${role}`);
  try {
    return await db.query(query, params);
  } finally {
    await db.exec('RESET ROLE');
    await db.query("SELECT set_config('request.jwt.claims', '{}', false)");
  }
}

/** Expect a statement to fail with a database error; returns the error message. */
async function expectDenied(role, sub, query, params = []) {
  try {
    await asRole(role, sub, query, params);
  } catch (err) {
    return String(err.message || err);
  }
  assert.fail(`Expected statement to be denied for role ${role}: ${query}`);
}

async function signUp(id, email, role) {
  await db.query(
    'INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)',
    [id, email, JSON.stringify(role === undefined ? {} : { role })]
  );
}

const IDS = {
  customerA: '00000000-0000-4000-8000-00000000000a',
  customerB: '00000000-0000-4000-8000-00000000000b',
  creatorA: '00000000-0000-4000-8000-0000000000c1',
  creatorB: '00000000-0000-4000-8000-0000000000c2',
  attacker: '00000000-0000-4000-8000-0000000000ad',
  admin: '00000000-0000-4000-8000-0000000000ff',
};

describe('Supabase schema security (RLS, column guards, storage policies)', () => {
  before(async () => {
    db = await new PGlite({ extensions: { uuid_ossp, pgcrypto } });
    await db.exec(SUPABASE_STUBS);
    await db.exec(SUPABASE_DEFAULT_GRANTS);
    for (const file of MIGRATIONS) {
      await db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
    }

    // Accounts created through the real signup trigger.
    await signUp(IDS.customerA, 'a@example.test', 'customer');
    await signUp(IDS.customerB, 'b@example.test', 'customer');
    await signUp(IDS.creatorA, 'creatorA@example.test', 'creator');
    await signUp(IDS.creatorB, 'creatorB@example.test', 'creator');
    // Hostile signup: tries to self-assign the admin role via metadata.
    await signUp(IDS.attacker, 'attacker@example.test', 'admin');
    // Platform-granted admin (direct insert, as an operator would do).
    await signUp(IDS.admin, 'admin@example.test', 'customer');
    await db.query("INSERT INTO public.user_roles (user_id, role) VALUES ($1, 'admin') ON CONFLICT DO NOTHING", [IDS.admin]);
    // Approve creator A through the platform (service/admin path).
    await db.query("UPDATE public.creator_profiles SET verification_status = 'approved' WHERE user_id = $1", [IDS.creatorA]);
  });

  describe('signup role assignment', () => {
    test('self-assigned admin metadata is downgraded to customer', async () => {
        const roles = await db.query(
          "SELECT role FROM public.user_roles WHERE user_id = $1 ORDER BY role",
          [IDS.attacker]
        );
        assert.deepEqual(roles.rows.map((r) => r.role), ['customer']);
    });

    test('creator signup creates a creator profile in the unsubmitted state', async () => {
      const cp = await db.query(
        "SELECT verification_status FROM public.creator_profiles WHERE user_id = $1",
        [IDS.creatorB]
      );
      assert.equal(cp.rows[0].verification_status, 'unsubmitted');
    });

    test('customer signup does not create a creator profile', async () => {
      const cp = await db.query('SELECT 1 FROM public.creator_profiles WHERE user_id = $1', [IDS.customerA]);
      assert.equal(cp.rows.length, 0);
    });
  });

  describe('column guards', () => {
    test('a user cannot reactivate or suspend an account via their own profile', async () => {
      await db.query("UPDATE public.profiles SET account_status = 'suspended' WHERE id = $1", [IDS.customerB]);
      const msg = await expectDenied(
        'authenticated',
        IDS.customerB,
        "UPDATE public.profiles SET account_status = 'active' WHERE id = $1",
        [IDS.customerB]
      );
      assert.match(msg, /Restricted profile fields/);
      await db.query("UPDATE public.profiles SET account_status = 'active' WHERE id = $1", [IDS.customerB]);
    });

    test('a user can still update ordinary profile fields', async () => {
      await asRole('authenticated', IDS.customerA, "UPDATE public.profiles SET full_name = 'Aman S.' WHERE id = $1", [IDS.customerA]);
      const r = await db.query('SELECT full_name FROM public.profiles WHERE id = $1', [IDS.customerA]);
      assert.equal(r.rows[0].full_name, 'Aman S.');
    });

    test('a creator cannot approve their own verification status', async () => {
      const msg = await expectDenied(
        'authenticated',
        IDS.creatorB,
        "UPDATE public.creator_profiles SET verification_status = 'approved' WHERE user_id = $1",
        [IDS.creatorB]
      );
      assert.match(msg, /Creator verification and rating fields/);
    });

    test('a creator cannot inflate their own rating', async () => {
      await expectDenied(
        'authenticated',
        IDS.creatorB,
        'UPDATE public.creator_profiles SET average_rating = 5.00, total_reviews = 99 WHERE user_id = $1',
        [IDS.creatorB]
      );
    });

    test('a creator can still update their professional details', async () => {
      await asRole(
        'authenticated',
        IDS.creatorB,
        "UPDATE public.creator_profiles SET biography = 'Wedding and events' WHERE user_id = $1",
        [IDS.creatorB]
      );
    });

    test('a creator cannot insert a pre-approved creator profile', async () => {
      // A second creator row for an existing user is blocked by UNIQUE(user_id); the
      // guard is exercised by checking that insert resets verification to unsubmitted.
      await db.query('DELETE FROM public.creator_profiles WHERE user_id = $1', [IDS.creatorB]);
      await asRole(
        'authenticated',
        IDS.creatorB,
        "INSERT INTO public.creator_profiles (user_id, professional_name, city, verification_status) VALUES ($1, 'B', 'Pune', 'approved')",
        [IDS.creatorB]
      );
      const r = await db.query('SELECT verification_status FROM public.creator_profiles WHERE user_id = $1', [IDS.creatorB]);
      assert.equal(r.rows[0].verification_status, 'unsubmitted');
    });
  });

  describe('public visibility', () => {
    test('anonymous clients cannot read e-mail or phone numbers from profiles', async () => {
      const msg = await expectDenied('anon', null, 'SELECT email FROM public.profiles');
      assert.match(msg, /permission denied/i);
    });

    test('anonymous clients can read non-sensitive profile columns', async () => {
      const r = await asRole('anon', null, 'SELECT id, full_name FROM public.profiles WHERE id = $1', [IDS.creatorA]);
      assert.equal(r.rows.length, 1);
    });

    test('unapproved creator profiles are hidden from anonymous clients', async () => {
      const r = await asRole('anon', null, 'SELECT id FROM public.creator_profiles');
      const ids = r.rows.map((row) => row.id);
      const pending = await db.query('SELECT id FROM public.creator_profiles WHERE user_id = $1', [IDS.creatorB]);
      assert.ok(!ids.includes(pending.rows[0].id), 'pending creator must not be publicly listed');
      assert.ok(ids.length >= 1, 'approved creator must remain listed');
    });

    test('a creator can read their own unapproved profile', async () => {
      const r = await asRole('authenticated', IDS.creatorB, 'SELECT id FROM public.creator_profiles WHERE user_id = $1', [IDS.creatorB]);
      assert.equal(r.rows.length, 1);
    });

    test('a user cannot read another customer\u2019s profile contact details', async () => {
      const r = await asRole('authenticated', IDS.customerA, 'SELECT email FROM public.profiles WHERE id = $1', [IDS.customerB]);
      assert.equal(r.rows.length, 0);
    });
  });

  describe('bookings', () => {
    let bookingOfA;
    let serviceOfCreatorA;

    before(async () => {
      const cp = await db.query('SELECT id FROM public.creator_profiles WHERE user_id = $1', [IDS.creatorA]);
      const creatorA = cp.rows[0].id;
      const svc = await db.query(
        `INSERT INTO public.creator_services (creator_id, title, base_price) VALUES ($1, 'Wedding', 8500) RETURNING id`,
        [creatorA]
      );
      serviceOfCreatorA = svc.rows[0].id;
      const bk = await db.query(
        `INSERT INTO public.bookings (booking_reference, customer_id, creator_id, service_id, event_title, event_date,
           start_at, end_at, event_location, agreed_service_price, total_amount)
         VALUES ('INST-TEST-0001', $1, $2, $3, 'Sangeet', '2026-12-01', '2026-12-01T10:00:00Z', '2026-12-01T14:00:00Z',
           'Delhi', 8500, 10030) RETURNING id`,
        [IDS.customerA, creatorA, serviceOfCreatorA]
      );
      bookingOfA = bk.rows[0].id;
    });

    test('a customer cannot insert bookings directly (server-only booking creation)', async () => {
      await expectDenied(
        'authenticated',
        IDS.customerB,
        `INSERT INTO public.bookings (booking_reference, customer_id, creator_id, service_id, event_title, event_date,
           start_at, end_at, event_location, agreed_service_price, total_amount, booking_status, payment_status)
         SELECT 'INST-HACK-0001', $1, id, $2, 'x', '2026-12-02', '2026-12-02T10:00:00Z', '2026-12-02T11:00:00Z', 'x', 1, 1, 'confirmed', 'paid'
         FROM public.creator_profiles WHERE user_id = $3`,
        [IDS.customerB, serviceOfCreatorA, IDS.creatorA]
      );
    });

    test('a customer cannot mark their own booking paid or completed', async () => {
      const msg = await expectDenied(
        'authenticated',
        IDS.customerA,
        "UPDATE public.bookings SET payment_status = 'paid', booking_status = 'completed' WHERE id = $1",
        [bookingOfA]
      );
      assert.match(msg, /Booking commercial and status fields/);
    });

    test('a customer cannot lower the agreed price of their booking', async () => {
      await expectDenied(
        'authenticated',
        IDS.customerA,
        'UPDATE public.bookings SET agreed_service_price = 1 WHERE id = $1',
        [bookingOfA]
      );
    });

    test('a customer can still update free-text booking notes', async () => {
      await asRole('authenticated', IDS.customerA, "UPDATE public.bookings SET customer_notes = 'Gate 2' WHERE id = $1", [bookingOfA]);
    });

    test('a customer cannot read another customer\u2019s booking', async () => {
      const r = await asRole('authenticated', IDS.customerB, 'SELECT id FROM public.bookings WHERE id = $1', [bookingOfA]);
      assert.equal(r.rows.length, 0);
    });

    test('the booking creator can read the booking; the customer can read it', async () => {
      const creator = await asRole('authenticated', IDS.creatorA, 'SELECT id FROM public.bookings WHERE id = $1', [bookingOfA]);
      const customer = await asRole('authenticated', IDS.customerA, 'SELECT id FROM public.bookings WHERE id = $1', [bookingOfA]);
      assert.equal(creator.rows.length, 1);
      assert.equal(customer.rows.length, 1);
    });

    test('the platform (service role) can change booking status', async () => {
      await asRole('service_role', null, "UPDATE public.bookings SET booking_status = 'confirmed' WHERE id = $1", [bookingOfA]);
      const r = await db.query('SELECT booking_status FROM public.bookings WHERE id = $1', [bookingOfA]);
      assert.equal(r.rows[0].booking_status, 'confirmed');
    });

    test('a creator cannot mark a booking as completed to unlock a review', async () => {
      await expectDenied(
        'authenticated',
        IDS.creatorA,
        "UPDATE public.bookings SET booking_status = 'completed' WHERE id = $1",
        [bookingOfA]
      );
    });

    test('a non-participant cannot send a message into a conversation', async () => {
      const conv = await db.query(
        `INSERT INTO public.conversations (booking_id, customer_id, creator_id)
         SELECT $1, $2, id FROM public.creator_profiles WHERE user_id = $3 RETURNING id`,
        [bookingOfA, IDS.customerA, IDS.creatorA]
      );
      await expectDenied(
        'authenticated',
        IDS.attacker,
        "INSERT INTO public.messages (conversation_id, sender_id, message_text) VALUES ($1, $2, 'hi')",
        [conv.rows[0].id, IDS.attacker]
      );
      await asRole(
        'authenticated',
        IDS.customerA,
        "INSERT INTO public.messages (conversation_id, sender_id, message_text) VALUES ($1, $2, 'hello')",
        [conv.rows[0].id, IDS.customerA]
      );
    });
  });

  describe('storage object policies', () => {
    before(async () => {
      await db.query(
        `INSERT INTO storage.objects (bucket_id, name, owner) VALUES
           ('profile-avatars', $1, $2),
           ('creator-verification', $3, $2)`,
        [`${IDS.customerA}/1.jpg`, IDS.customerA, `${IDS.creatorA}/id-card.pdf`]
      );
      const b = await db.query(
        "SELECT id FROM public.bookings WHERE booking_reference = 'INST-TEST-0001'"
      );
      await db.query(
        "INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('booking-deliverables', $1, $2)",
        [`${b.rows[0].id}/final.zip`, IDS.creatorA]
      );
    });

    test('a user can upload an avatar into their own folder', async () => {
      await asRole('authenticated', IDS.customerB, "INSERT INTO storage.objects (bucket_id, name) VALUES ('profile-avatars', $1)", [`${IDS.customerB}/2.jpg`]);
    });

    test('a user cannot upload an avatar into another user\u2019s folder', async () => {
      await expectDenied(
        'authenticated',
        IDS.customerB,
        "INSERT INTO storage.objects (bucket_id, name) VALUES ('profile-avatars', $1)",
        [`${IDS.customerA}/evil.jpg`]
      );
    });

    test('a user cannot write verification documents into another user\u2019s folder', async () => {
      await expectDenied(
        'authenticated',
        IDS.attacker,
        "INSERT INTO storage.objects (bucket_id, name) VALUES ('creator-verification', $1)",
        [`${IDS.creatorA}/forged.pdf`]
      );
    });

    test('verification documents are readable only by their owner and admins', async () => {
      const owner = await asRole('authenticated', IDS.creatorA, "SELECT name FROM storage.objects WHERE bucket_id = 'creator-verification'");
      const other = await asRole('authenticated', IDS.customerB, "SELECT name FROM storage.objects WHERE bucket_id = 'creator-verification'");
      const admin = await asRole('authenticated', IDS.admin, "SELECT name FROM storage.objects WHERE bucket_id = 'creator-verification'");
      assert.equal(owner.rows.length, 1);
      assert.equal(other.rows.length, 0);
      assert.equal(admin.rows.length, 1);
    });

    test('private booking deliverables are readable by participants only', async () => {
      const customer = await asRole('authenticated', IDS.customerA, "SELECT name FROM storage.objects WHERE bucket_id = 'booking-deliverables'");
      const creator = await asRole('authenticated', IDS.creatorA, "SELECT name FROM storage.objects WHERE bucket_id = 'booking-deliverables'");
      const stranger = await asRole('authenticated', IDS.attacker, "SELECT name FROM storage.objects WHERE bucket_id = 'booking-deliverables'");
      assert.equal(customer.rows.length, 1);
      assert.equal(creator.rows.length, 1);
      assert.equal(stranger.rows.length, 0, 'an authenticated stranger must not read private deliverables');
    });

    test('a different creator cannot upload deliverables for a booking they do not serve', async () => {
      const b = await db.query("SELECT id FROM public.bookings WHERE booking_reference = 'INST-TEST-0001'");
      await expectDenied(
        'authenticated',
        IDS.creatorB,
        "INSERT INTO storage.objects (bucket_id, name) VALUES ('booking-deliverables', $1)",
        [`${b.rows[0].id}/injected.zip`]
      );
    });
  });

  describe('owner role, permissions and verification submissions (20261013000002)', () => {
    const IDS2 = {
      owner: '00000000-0000-4000-8000-00000000000d',
      reviewAdmin: '00000000-0000-4000-8000-0000000000e1',
      applicant: '00000000-0000-4000-8000-0000000000e2',
      bystander: '00000000-0000-4000-8000-0000000000e3',
    };
    let applicantCreatorId;

    before(async () => {
      await signUp(IDS2.owner, 'owner@example.test', 'customer');
      await signUp(IDS2.reviewAdmin, 'reviewer@example.test', 'customer');
      await signUp(IDS2.applicant, 'applicant@example.test', 'creator');
      await signUp(IDS2.bystander, 'bystander@example.test', 'customer');

      await db.query("INSERT INTO public.user_roles (user_id, role) VALUES ($1, 'owner')", [IDS2.owner]);
      await db.query("INSERT INTO public.user_roles (user_id, role) VALUES ($1, 'admin')", [IDS2.reviewAdmin]);
      // A reviewer narrowed down to one capability.
      await db.query(
        "INSERT INTO public.admin_permissions (user_id, permission) VALUES ($1, 'manage_photographer_verification')",
        [IDS2.reviewAdmin]
      );
      const creator = await db.query('SELECT id FROM public.creator_profiles WHERE user_id = $1', [IDS2.applicant]);
      applicantCreatorId = creator.rows[0].id;
    });

    test('the owner role exists and counts as a platform administrator', async () => {
      const roles = await db.query('SELECT role FROM public.user_roles WHERE user_id = $1 ORDER BY role', [IDS2.owner]);
      // Signup grants 'customer'; the platform then adds 'owner' on top of it,
      // so an owner keeps whatever ordinary access the account already had.
      assert.ok(roles.rows.map((row) => row.role).includes('owner'), 'user_roles must accept the owner role');

      const check = await asRole('authenticated', IDS2.owner, 'SELECT public.is_admin() AS admin, public.is_owner() AS owner');
      assert.equal(check.rows[0].admin, true, 'is_admin() must accept owners so RLS policies cover them');
      assert.equal(check.rows[0].owner, true);

      // A customer is neither.
      const customerCheck = await asRole('authenticated', IDS2.bystander, 'SELECT public.is_admin() AS admin, public.is_owner() AS owner');
      assert.equal(customerCheck.rows[0].admin, false);
      assert.equal(customerCheck.rows[0].owner, false);
    });

    test('an owner reads contact details across accounts, an applicant does not', async () => {
      const asOwner = await asRole(
        'authenticated',
        IDS2.owner,
        'SELECT email FROM public.profiles WHERE id = $1',
        [IDS2.bystander]
      );
      assert.equal(asOwner.rows.length, 1);
      const asBystander = await asRole(
        'authenticated',
        IDS2.bystander,
        'SELECT email FROM public.profiles WHERE id = $1',
        [IDS2.applicant]
      );
      assert.equal(asBystander.rows.length, 0);
    });

    test('roles and permissions cannot be self-granted from a client session', async () => {
      await expectDenied(
        'authenticated',
        IDS2.bystander,
        "INSERT INTO public.user_roles (user_id, role) VALUES ($1, 'owner')",
        [IDS2.bystander]
      );
      await expectDenied(
        'authenticated',
        IDS2.bystander,
        "UPDATE public.user_roles SET role = 'owner' WHERE user_id = $1",
        [IDS2.bystander]
      );
      await expectDenied(
        'authenticated',
        IDS2.bystander,
        "INSERT INTO public.admin_permissions (user_id, permission) VALUES ($1, 'manage_users')",
        [IDS2.bystander]
      );
      await expectDenied(
        'authenticated',
        IDS2.bystander,
        'DELETE FROM public.admin_permissions WHERE user_id = $1',
        [IDS2.reviewAdmin]
      );
    });

    test('has_admin_permission() resolves owner, legacy admin and narrowed admin', async () => {
      const owner = await db.query("SELECT public.has_admin_permission($1, 'manage_administrators') AS ok", [IDS2.owner]);
      assert.equal(owner.rows[0].ok, true, 'an owner holds every capability');

      const legacy = await db.query("SELECT public.has_admin_permission($1, 'manage_users') AS ok", [IDS.admin]);
      assert.equal(legacy.rows[0].ok, true, 'an admin with no grant rows keeps the inherited set');

      const narrowedOk = await db.query("SELECT public.has_admin_permission($1, 'manage_photographer_verification') AS ok", [IDS2.reviewAdmin]);
      assert.equal(narrowedOk.rows[0].ok, true);
      const narrowedNo = await db.query("SELECT public.has_admin_permission($1, 'manage_users') AS ok", [IDS2.reviewAdmin]);
      assert.equal(narrowedNo.rows[0].ok, false, 'a narrowed admin must not reach other duties');

      const creator = await db.query("SELECT public.has_admin_permission($1, 'manage_users') AS ok", [IDS.creatorA]);
      assert.equal(creator.rows[0].ok, false, 'a creator is not an administrator');
    });

    test('a creator can file a pending application but cannot approve themselves', async () => {
      await asRole(
        'authenticated',
        IDS2.applicant,
        `INSERT INTO public.creator_verification_submissions
           (creator_id, user_id, reference_code, status, legal_name, government_id_type, documents)
         VALUES ($1, $2, 'VER-TEST-1', 'approved', 'Applicant One', 'aadhaar', '[]'::jsonb)`,
        [applicantCreatorId, IDS2.applicant]
      );
      const stored = await db.query(
        "SELECT status, reviewed_at, user_id FROM public.creator_verification_submissions WHERE reference_code = 'VER-TEST-1'"
      );
      assert.equal(stored.rows[0].status, 'pending', 'a client insert is forced back to pending');
      assert.equal(stored.rows[0].reviewed_at, null);

      // ...and filing demotes the profile to pending, which the directory honours.
      const profile = await db.query('SELECT verification_status FROM public.creator_profiles WHERE id = $1', [applicantCreatorId]);
      assert.equal(profile.rows[0].verification_status, 'pending');
    });

    test('an application cannot target somebody else, and cannot be reviewed by the applicant', async () => {
      await expectDenied(
        'authenticated',
        IDS2.applicant,
        `INSERT INTO public.creator_verification_submissions (creator_id, user_id, reference_code, legal_name)
         VALUES ($1, $2, 'VER-TEST-OTHER', 'Framed')`,
        [applicantCreatorId, IDS2.bystander]
      );
      await expectDenied(
        'authenticated',
        IDS2.applicant,
        "UPDATE public.creator_verification_submissions SET status = 'approved' WHERE reference_code = 'VER-TEST-1'",
        []
      );
    });

    test('only one application per creator waits for review at a time', async () => {
      await expectDenied(
        'authenticated',
        IDS2.applicant,
        `INSERT INTO public.creator_verification_submissions (creator_id, user_id, reference_code, legal_name)
         VALUES ($1, $2, 'VER-TEST-2', 'Duplicate')`,
        [applicantCreatorId, IDS2.applicant]
      );
    });

    test('strangers and anonymous clients cannot read applications', async () => {
      const anon = await asRole('anon', null, 'SELECT id FROM public.creator_verification_submissions');
      assert.equal(anon.rows.length, 0);
      const bystander = await asRole('authenticated', IDS2.bystander, 'SELECT id FROM public.creator_verification_submissions');
      assert.equal(bystander.rows.length, 0);
      const own = await asRole('authenticated', IDS2.applicant, 'SELECT id FROM public.creator_verification_submissions');
      assert.equal(own.rows.length, 1, 'the applicant always sees their own');
      const reviewer = await asRole('authenticated', IDS2.reviewAdmin, 'SELECT id FROM public.creator_verification_submissions');
      assert.equal(reviewer.rows.length, 1, 'administrators read the queue');
    });

    test('a review decision publishes the profile and notifies the photographer', async () => {
      const before = await db.query('SELECT count(*)::int AS n FROM public.notifications WHERE user_id = $1', [IDS2.applicant]);
      await db.query(
        "UPDATE public.creator_verification_submissions SET status = 'approved', reviewed_at = NOW(), reviewed_by = $1 WHERE reference_code = 'VER-TEST-1'",
        [IDS2.reviewAdmin]
      );
      const profile = await db.query('SELECT verification_status FROM public.creator_profiles WHERE id = $1', [applicantCreatorId]);
      assert.equal(profile.rows[0].verification_status, 'approved', 'the trigger must publish the profile');

      const after = await db.query("SELECT count(*)::int AS n FROM public.notifications WHERE user_id = $1 AND notification_type = 'creator_verification'", [IDS2.applicant]);
      assert.equal(after.rows[0].n, before.rows[0].n + 1, 'the photographer gets a notification of the decision');

      // An approved profile is now readable without a session.
      const listed = await asRole('anon', null, 'SELECT id FROM public.creator_profiles WHERE id = $1', [applicantCreatorId]);
      assert.equal(listed.rows.length, 1);
    });

    test('a review written on the profile closes the open application instead of drifting', async () => {
      const again = await db.query(
        `INSERT INTO public.creator_verification_submissions (creator_id, user_id, reference_code, legal_name, status)
         VALUES ($1, $2, 'VER-TEST-3', 'Applicant One', 'pending') RETURNING id`,
        [applicantCreatorId, IDS2.applicant]
      );
      await db.query("UPDATE public.creator_profiles SET verification_status = 'suspended' WHERE id = $1", [applicantCreatorId]);
      const submission = await db.query(
        "SELECT status, review_reason FROM public.creator_verification_submissions WHERE id = $1",
        [again.rows[0].id]
      );
      assert.equal(submission.rows[0].status, 'rejected', 'a suspension closes the pending application');
      assert.match(submission.rows[0].review_reason, /suspended/i);

      const listed = await asRole('anon', null, 'SELECT id FROM public.creator_profiles WHERE id = $1', [applicantCreatorId]);
      assert.equal(listed.rows.length, 0, 'a suspended profile is out of the public directory');
    });

    test('an applicant withdraws an unreviewed application and can file again', async () => {
      const inserted = await db.query(
        `INSERT INTO public.creator_verification_submissions (creator_id, user_id, reference_code, legal_name)
         VALUES ($1, $2, 'VER-TEST-4', 'Applicant One') RETURNING id`,
        [applicantCreatorId, IDS2.applicant]
      );
      await asRole(
        'authenticated',
        IDS2.applicant,
        "DELETE FROM public.creator_verification_submissions WHERE id = $1 AND status = 'pending'",
        [inserted.rows[0].id]
      );
      const remaining = await db.query('SELECT id FROM public.creator_verification_submissions WHERE id = $1', [inserted.rows[0].id]);
      assert.equal(remaining.rows.length, 0);

      // A reviewed application cannot be removed: the delete policy only matches
      // rows still pending, so the statement runs but finds nothing to delete.
      await asRole(
        'authenticated',
        IDS2.applicant,
        "DELETE FROM public.creator_verification_submissions WHERE reference_code = 'VER-TEST-1'",
        []
      );
      const decision = await db.query(
        "SELECT status FROM public.creator_verification_submissions WHERE reference_code = 'VER-TEST-1'"
      );
      assert.equal(decision.rows.length, 1, 'a recorded decision is immutable for the applicant');
      assert.equal(decision.rows[0].status, 'approved');
    });

    test('the verification bucket stays private to the applicant and reviewers', async () => {
      await db.query("INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('creator-verification', $1, $2)", [
        `${IDS2.applicant}/aadhaar.jpg`,
        IDS2.applicant,
      ]);
      const own = await asRole('authenticated', IDS2.applicant, "SELECT name FROM storage.objects WHERE bucket_id = 'creator-verification'");
      assert.equal(own.rows.length, 1);
      const stranger = await asRole('authenticated', IDS2.bystander, "SELECT name FROM storage.objects WHERE bucket_id = 'creator-verification'");
      assert.equal(stranger.rows.length, 0);
      await expectDenied(
        'authenticated',
        IDS2.bystander,
        "INSERT INTO storage.objects (bucket_id, name) VALUES ('creator-verification', $1)",
        [`${IDS2.applicant}/forged.pdf`]
      );
    });
  });

  describe('Google OAuth account selection workflow (20261014000002)', () => {
    const oauthUserId = '00000000-0000-4000-a000-000000000099';
    const directCreatorId = '00000000-0000-4000-a000-000000000098';

    test('new Google OAuth user without role metadata gets role_selected = false and no premature user_roles entry', async () => {
      // Simulate Supabase creating auth.users record via Google OAuth (trigger runs automatically)
      await db.query(
        "INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)",
        [oauthUserId, 'google.user@example.com', JSON.stringify({ full_name: 'Google User', picture: 'https://example.com/avatar.jpg' })]
      );

      const p = await db.query("SELECT role_selected, full_name, avatar_url FROM public.profiles WHERE id = $1", [oauthUserId]);
      assert.equal(p.rows.length, 1);
      assert.equal(p.rows[0].role_selected, false, 'role_selected must be false for new Google OAuth user');
      assert.equal(p.rows[0].full_name, 'Google User');
      assert.equal(p.rows[0].avatar_url, 'https://example.com/avatar.jpg');

      const roles = await db.query("SELECT role FROM public.user_roles WHERE user_id = $1", [oauthUserId]);
      assert.equal(roles.rows.length, 0, 'user_roles must not be prematurely populated before user selects role');
    });

    test('direct creator signup with explicit role metadata gets role_selected = true and creator_profiles initialized', async () => {
      // Simulate direct signup with explicit role (trigger runs automatically)
      await db.query(
        "INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)",
        [directCreatorId, 'direct.creator@example.com', JSON.stringify({ full_name: 'Direct Creator', role: 'creator' })]
      );

      const p = await db.query("SELECT role_selected FROM public.profiles WHERE id = $1", [directCreatorId]);
      assert.equal(p.rows.length, 1);
      assert.equal(p.rows[0].role_selected, true, 'role_selected must be true when explicit role was requested');

      const roles = await db.query("SELECT role FROM public.user_roles WHERE user_id = $1", [directCreatorId]);
      assert.equal(roles.rows[0].role, 'creator');

      const creator = await db.query("SELECT verification_status FROM public.creator_profiles WHERE user_id = $1", [directCreatorId]);
      assert.equal(creator.rows[0].verification_status, 'unsubmitted');
    });

    test('user selecting role afterwards marks role_selected = true and records role in user_roles', async () => {
      // Simulate POST /api/auth/select-role for customer
      await db.query("UPDATE public.profiles SET role_selected = true WHERE id = $1", [oauthUserId]);
      await db.query("INSERT INTO public.user_roles (user_id, role) VALUES ($1, 'customer') ON CONFLICT (user_id, role) DO NOTHING", [oauthUserId]);

      const p = await db.query("SELECT role_selected FROM public.profiles WHERE id = $1", [oauthUserId]);
      assert.equal(p.rows[0].role_selected, true);

      const roles = await db.query("SELECT role FROM public.user_roles WHERE user_id = $1", [oauthUserId]);
      assert.equal(roles.rows[0].role, 'customer');
    });

    test('client later becoming photographer adds creator role without deleting customer role or bookings', async () => {
      // Existing client with customer role upgrades to creator
      await db.query("INSERT INTO public.user_roles (user_id, role) VALUES ($1, 'creator') ON CONFLICT (user_id, role) DO NOTHING", [oauthUserId]);
      await db.query("INSERT INTO public.creator_profiles (user_id, professional_name, city, verification_status) VALUES ($1, 'Google Creator', 'Delhi NCR', 'pending')", [oauthUserId]);

      const roles = await db.query("SELECT role FROM public.user_roles WHERE user_id = $1 ORDER BY role", [oauthUserId]);
      assert.equal(roles.rows.length, 2, 'user now possesses both customer and creator capabilities');
      assert.equal(roles.rows[0].role, 'creator');
      assert.equal(roles.rows[1].role, 'customer');

      const cp = await db.query("SELECT verification_status FROM public.creator_profiles WHERE user_id = $1", [oauthUserId]);
      assert.equal(cp.rows[0].verification_status, 'pending', 'photographer application remains pending until reviewed');
    });
  });

  describe('complete account deletion with zero footprint (20261014000003)', () => {
    test('deleting user from auth.users leaves zero footprint across all tables', async () => {
      const delUserId = '00000000-0000-4000-8000-000000000099';
      await db.query("INSERT INTO auth.users (id, email) VALUES ($1, 'delete.me@example.com')", [delUserId]);
      await db.query("UPDATE public.profiles SET full_name = 'Delete Me', role_selected = true WHERE id = $1", [delUserId]);
      await db.query("INSERT INTO public.user_roles (user_id, role) VALUES ($1, 'customer')", [delUserId]);
      await db.query("INSERT INTO public.notifications (user_id, notification_type, title, body) VALUES ($1, 'system', 'Welcome', 'Welcome to SnapShoot')", [delUserId]);

      // Verify records exist
      const p1 = await db.query("SELECT count(*)::int AS n FROM public.profiles WHERE id = $1", [delUserId]);
      const r1 = await db.query("SELECT count(*)::int AS n FROM public.user_roles WHERE user_id = $1", [delUserId]);
      const n1 = await db.query("SELECT count(*)::int AS n FROM public.notifications WHERE user_id = $1", [delUserId]);
      assert.equal(p1.rows[0].n, 1);
      assert.equal(r1.rows[0].n, 1);
      assert.equal(n1.rows[0].n, 1);

      // Delete from auth.users (simulating admin.deleteUser or client account deletion)
      await db.query("DELETE FROM auth.users WHERE id = $1", [delUserId]);

      // Verify zero footprint left behind
      const p2 = await db.query("SELECT count(*)::int AS n FROM public.profiles WHERE id = $1", [delUserId]);
      const r2 = await db.query("SELECT count(*)::int AS n FROM public.user_roles WHERE user_id = $1", [delUserId]);
      const n2 = await db.query("SELECT count(*)::int AS n FROM public.notifications WHERE user_id = $1", [delUserId]);
      assert.equal(p2.rows[0].n, 0, 'profile must be completely deleted');
      assert.equal(r2.rows[0].n, 0, 'roles must be completely deleted');
      assert.equal(n2.rows[0].n, 0, 'notifications must be completely deleted');
    });
  });

  describe('migration idempotency', () => {
    test('re-applying the hardening and access migrations leaves the policies intact', async () => {
      await db.exec(readFileSync(join(migrationsDir, '20261013000001_security_hardening.sql'), 'utf8'));
      // The access migration must be safe to replay (a redeploy or a repair run
      // re-applies it), including its CHECK constraints and triggers.
      await db.exec(
        readFileSync(join(migrationsDir, '20261013000002_owner_roles_admin_permissions_and_verification.sql'), 'utf8')
      );
      const verificationPolicies = await db.query(
        "SELECT count(*)::int AS n FROM pg_policies WHERE schemaname = 'public' AND tablename = 'creator_verification_submissions'"
      );
      assert.equal(verificationPolicies.rows[0].n, 3, 'select, insert and delete policies, not doubled');
      const adminStillWorks = await asRole('authenticated', IDS.admin, 'SELECT public.is_admin() AS admin');
      assert.equal(adminStillWorks.rows[0].admin, true, 'is_admin() must survive a re-apply');
      const pendingGuard = await db.query(
        "SELECT count(*)::int AS n FROM pg_indexes WHERE tablename = 'creator_verification_submissions' AND indexname = 'uq_verification_one_pending_per_creator'"
      );
      assert.equal(pendingGuard.rows[0].n, 1);
      const r = await db.query("SELECT count(*)::int AS n FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'SELECT'");
      assert.equal(r.rows[0].n, 1, 'exactly one SELECT policy on profiles after re-apply');
      const bk = await db.query("SELECT count(*)::int AS n FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookings' AND cmd = 'INSERT'");
      assert.equal(bk.rows[0].n, 0);
    });
  });

  describe('platform distance settings and live tracking (20261014000004)', () => {
    test('platform distance settings default to 20 km free travel and are publicly readable', async () => {
      const res = await asRole('anon', null, 'SELECT free_travel_km, travel_fee_per_km, is_active FROM public.platform_distance_settings LIMIT 1');
      assert.ok(res.rows.length > 0, 'settings row must exist');
      assert.equal(Number(res.rows[0].free_travel_km), 20, 'free travel distance must default to 20 km');
      assert.equal(Number(res.rows[0].travel_fee_per_km), 20, 'travel fee per km must default to 20');
      assert.equal(res.rows[0].is_active, true);
    });

    test('non-administrators cannot modify platform distance settings', async () => {
      // Direct UPDATE matches 0 rows due to RLS USING clause
      const updateRes = await asRole('authenticated', IDS.customerA, 'UPDATE public.platform_distance_settings SET free_travel_km = 0');
      assert.equal(updateRes.affectedRows ?? 0, 0, 'non-admin update must affect 0 rows under RLS');

      // Direct INSERT by non-admin must fail RLS WITH CHECK policy
      await expectDenied('authenticated', IDS.customerA, 'INSERT INTO public.platform_distance_settings (free_travel_km) VALUES (0)');
    });

    test('administrators can update platform distance settings', async () => {
      await asRole('authenticated', IDS.admin, 'UPDATE public.platform_distance_settings SET free_travel_km = 25 WHERE is_active = TRUE');
      const check = await db.query('SELECT free_travel_km FROM public.platform_distance_settings WHERE is_active = TRUE');
      assert.equal(Number(check.rows[0].free_travel_km), 25);
      // Revert back to 20
      await asRole('authenticated', IDS.admin, 'UPDATE public.platform_distance_settings SET free_travel_km = 20 WHERE is_active = TRUE');
    });
  });

  describe('booking duration and itemized pricing snapshot (20261014000005)', () => {
    test('bookings table has duration_hours column and stores selected duration', async () => {
      const colCheck = await db.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'duration_hours'"
      );
      assert.ok(colCheck.rows.length > 0, 'duration_hours column must exist on bookings table');

      const cp = await db.query('SELECT id FROM public.creator_profiles WHERE user_id = $1', [IDS.creatorA]);
      const creatorA = cp.rows[0].id;
      const svc = await db.query('SELECT id FROM public.creator_services WHERE creator_id = $1 LIMIT 1', [creatorA]);
      const serviceId = svc.rows[0].id;

      // Insert server-side test booking with 8 hours
      const testRef = `TEST-DUR-${Date.now()}`;
      const insRes = await db.query(
        `INSERT INTO public.bookings (
           booking_reference, customer_id, creator_id, service_id, event_title, event_date,
           duration_hours, start_at, end_at, event_location, agreed_service_price, platform_fee,
           taxes, total_amount, pricing_breakdown, booking_status, payment_status
         ) VALUES (
           $1, $2, $3, $4, '8-Hour Reel Shoot', '2026-11-01',
           8.00, '2026-11-01T10:00:00Z', '2026-11-01T18:00:00Z', 'Delhi NCR', 4000.00, 400.00,
           792.00, 5192.00, '{"durationHours": 8, "serviceSubtotal": 4000, "totalAmount": 5192}'::jsonb,
           'pending', 'unpaid'
         ) RETURNING id`,
        [testRef, IDS.customerA, creatorA, serviceId]
      );
      const bookingId = insRes.rows[0].id;

      // Customer A can read their own booking with duration_hours = 8
      const custRead = await asRole('authenticated', IDS.customerA, 'SELECT duration_hours, agreed_service_price, total_amount FROM public.bookings WHERE id = $1', [bookingId]);
      assert.equal(custRead.rows.length, 1);
      assert.equal(Number(custRead.rows[0].duration_hours), 8);
      assert.equal(Number(custRead.rows[0].agreed_service_price), 4000);
      assert.equal(Number(custRead.rows[0].total_amount), 5192);

      // Customer B cannot read Customer A's booking
      const custBRead = await asRole('authenticated', IDS.customerB, 'SELECT id FROM public.bookings WHERE id = $1', [bookingId]);
      assert.equal(custBRead.rows.length, 0, 'Customer B cannot read Customer A booking');

      // Assigned Creator can read the booking duration
      const creatorRead = await asRole('authenticated', IDS.creatorA, 'SELECT duration_hours FROM public.bookings WHERE id = $1', [bookingId]);
      assert.equal(creatorRead.rows.length, 1);
      assert.equal(Number(creatorRead.rows[0].duration_hours), 8);

      // Cleanup
      await db.query('DELETE FROM public.bookings WHERE id = $1', [bookingId]);
    });
  });

  describe('Razorpay payment order tracking and RLS security (20261014000006)', () => {
    test('payments table has provider_order_id, signature, and metadata columns with RLS protection', async () => {
      // 1. Column presence check
      const cols = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'payments'
          AND column_name IN ('provider_order_id', 'signature', 'metadata')
        ORDER BY column_name
      `);
      assert.equal(cols.rows.length, 3, 'payments table must contain provider_order_id, signature, and metadata');

      // 2. Setup a test booking
      const creatorRes = await db.query('SELECT id FROM public.creator_profiles WHERE user_id = $1', [IDS.creatorA]);
      const creatorA = creatorRes.rows[0].id;
      const sRes = await db.query('SELECT id FROM public.creator_services WHERE creator_id = $1 LIMIT 1', [creatorA]);
      const serviceId = sRes.rows[0].id;
      const bRes = await db.query(
        `INSERT INTO public.bookings (
           booking_reference, customer_id, creator_id, service_id, event_title, event_date,
           duration_hours, start_at, end_at, event_location, agreed_service_price,
           total_amount, booking_status, payment_status
         ) VALUES (
           'TEST-PAY-001', $1, $2, $3, 'Payment Security Test', '2026-11-05',
           2.00, '2026-11-05T10:00:00Z', '2026-11-05T12:00:00Z', 'Connaught Place', 2000.00,
           2596.00, 'confirmed', 'unpaid'
         ) RETURNING id`,
        [IDS.customerA, creatorA, serviceId]
      );
      const bookingId = bRes.rows[0].id;

      // 3. Customer directly inserting payment without service role must fail
      await expectDenied(
        'authenticated',
        IDS.customerA,
        `INSERT INTO public.payments (
           booking_id, customer_id, provider, provider_order_id, idempotency_key, amount, currency, payment_status
         ) VALUES (
           $1, $2, 'razorpay', 'order_direct_hacker', 'idem_direct_001', 2596.00, 'INR', 'paid'
         )`,
        [bookingId, IDS.customerA]
      );

      // 4. Privileged server insert succeeds
      const pRes = await db.query(
        `INSERT INTO public.payments (
           booking_id, customer_id, provider, provider_order_id, provider_payment_id,
           signature, idempotency_key, amount, currency, payment_status, metadata
         ) VALUES (
           $1, $2, 'razorpay', 'order_rzp_test_12345', 'pay_rzp_test_67890',
           'mock_sha256_signature_abc', 'idem_safe_server_001', 2596.00, 'INR', 'paid',
           '{"provider": "razorpay", "method": "upi"}'::jsonb
         ) RETURNING id`,
        [bookingId, IDS.customerA]
      );
      const paymentId = pRes.rows[0].id;

      // 5. Customer A can read their payment record including provider_order_id
      const custRead = await asRole(
        'authenticated',
        IDS.customerA,
        'SELECT provider_order_id, provider_payment_id, amount, payment_status FROM public.payments WHERE id = $1',
        [paymentId]
      );
      assert.equal(custRead.rows.length, 1);
      assert.equal(custRead.rows[0].provider_order_id, 'order_rzp_test_12345');
      assert.equal(custRead.rows[0].payment_status, 'paid');

      // 6. Customer B CANNOT read Customer A's payment record
      const custBRead = await asRole(
        'authenticated',
        IDS.customerB,
        'SELECT id FROM public.payments WHERE id = $1',
        [paymentId]
      );
      assert.equal(custBRead.rows.length, 0, 'Customer B cannot read Customer A payment record');

      // 7. Assigned Creator A can read the payment for their booking
      const creatorRead = await asRole(
        'authenticated',
        IDS.creatorA,
        'SELECT id, amount, payment_status FROM public.payments WHERE id = $1',
        [paymentId]
      );
      assert.equal(creatorRead.rows.length, 1, 'Assigned creator can audit payment for their shoot');

      // 8. Admin can read all payments
      const adminRead = await asRole(
        'authenticated',
        IDS.admin,
        'SELECT id FROM public.payments WHERE id = $1',
        [paymentId]
      );
      assert.equal(adminRead.rows.length, 1, 'Admin can read payment record');

      // Cleanup
      await db.query('DELETE FROM public.payments WHERE id = $1', [paymentId]);
      await db.query('DELETE FROM public.bookings WHERE id = $1', [bookingId]);
    });
  });
});


