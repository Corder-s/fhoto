# Deployment guide

This guide describes what the code requires. It does not assume a specific host.

## 1. Supabase

1. Create a project. Note the URL, the anon key, and the service-role key. The service-role key is a server secret.
2. Apply migrations in order: `20261012000001_master_instantshoot_schema.sql`, `20261012000002_storage_and_rls_policies.sql`, `20261013000001_security_hardening.sql`. Use `supabase db push` after `supabase link`.
3. Confirm the buckets exist: `profile-avatars` (public), `creator-portfolios` (public), `booking-deliverables` (private), and the verification bucket.
4. Authentication settings:
   - Site URL: the public web origin.
   - Redirect URLs: include `<origin>/reset-password` for the recovery flow.
   - Decide on email confirmation (KNOWN_ISSUES #1). The app's sign-up route currently confirms email automatically.
5. Create the first admin by inserting a `user_roles` row with `role = 'admin'` for an existing auth user. Do this through the SQL editor with the service role. The app has no self-service admin path.
6. Do not run the seed scripts against production. They are for development projects only.

## 2. Web app (`apps/web`)

Environment (server secrets are never `NEXT_PUBLIC_`):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `NEXT_PUBLIC_MAPBOX_TOKEN` (public `pk.*`), `MAPBOX_ACCESS_TOKEN` (server, optional)
- `GEMINI_API_KEY`, `GEMINI_MODEL` (server, optional)
- `PAYMENT_PROVIDER_SECRET_KEY` (server; leave unset until gateway order creation is implemented)

Build and run:

```bash
npm ci
cd apps/web
npx next build
npx next start -H 0.0.0.0 -p 3000
```

Before deploying, run `npx tsc --noEmit`, `npx next lint`, and the root `npm run test:unit` and `npm run test:db`.

## 3. NestJS service (`apps/api`), optional for the web flows

Needed only for the `/api/v1/*` rewrite (subscriptions, and the NestJS-only endpoints).

```bash
cd apps/api
npx prisma generate            # requires access to the Prisma engine host
npx nest build
NODE_ENV=production PORT=4000 node dist/src/main.js
```

Production environment:

- `NODE_ENV=production`
- `JWT_ACCESS_SECRET` (at least 32 characters). The process refuses to start without it.
- `ENABLE_MOCK_AUTH` must be unset or `false`.
- `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`. Checkout and webhooks return 503 until these are set.
- `DATABASE_URL` for Prisma.

Run the test suite in CI with Prisma generated: `npm test --workspace=apps/api`. The two Prisma-dependent suites must pass (see TEST_RESULTS.md).

## 4. Verify after deploy

```bash
curl -s https://<web>/api/auth/session        # expect {"authenticated":false,"configured":true,...}
curl -s -o /dev/null -w "%{http_code}\n" https://<web>/api/bookings/create -X POST   # expect 401
curl -s -o /dev/null -w "%{http_code}\n" https://<web>/api/v1/health                # expect 200 when Nest is running
```

With the NestJS service in production, `POST /api/v1/auth/login` must return 503.

Smoke test with a session: `SMOKE_BASE_URL=https://<web> SMOKE_COOKIE='<cookie header>' SMOKE_CREATOR_ID=<approved creator id> node scratch/test-apis.js`. Do not paste the cookie into shared logs.

## 5. Rollback

- Web: redeploy the previous build. Database migrations are not reversed automatically. The hardening migration is idempotent, so re-applying it is safe.
- Database: restore from a backup before the migration if a rollback past `20261013000001` is needed. Plan for this before migrating production.

## 6. Pre-launch blockers

See KNOWN_ISSUES.md items 1–4 and the open risks in SECURITY_REVIEW.md. The web app is not ready for real payments.
