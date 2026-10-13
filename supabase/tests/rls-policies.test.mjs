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

  describe('migration idempotency', () => {
    test('re-applying the hardening migration leaves the policies intact', async () => {
      await db.exec(readFileSync(join(migrationsDir, '20261013000001_security_hardening.sql'), 'utf8'));
      const r = await db.query("SELECT count(*)::int AS n FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'SELECT'");
      assert.equal(r.rows[0].n, 1, 'exactly one SELECT policy on profiles after re-apply');
      const bk = await db.query("SELECT count(*)::int AS n FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookings' AND cmd = 'INSERT'");
      assert.equal(bk.rows[0].n, 0);
    });
  });
});
