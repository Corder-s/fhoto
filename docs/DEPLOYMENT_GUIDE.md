# Deployment guide

This guide describes what the code requires. Vercel is the supported host for the web app, and section 2 covers it in detail; the rest stays host-agnostic so a container host or another platform can follow it directly.

## 0. Build order in this monorepo

`apps/web` and `apps/api` import `@snapshoot/shared`, which resolves to the compiled files in `packages/shared/dist`. That directory is not committed. Any build must compile the shared package first, or `next build` fails with:

```
Module not found: Can't resolve '@snapshoot/shared'
```

The scripts handle it:

- `npm install` / `npm ci` runs `packages/shared`'s `prepare` hook.
- `npm run build` (root) builds the shared package, then the web app.
- `apps/web` and `apps/api` have a `prebuild` step that compiles the shared package.
- `apps/web/next.config.mjs` refuses to start with a one-line instruction when the artifact is missing, instead of a webpack resolution error.

Valid commands: `npm run build` (shared + web), `npm run build:web`, `npm run build:api`, `npm run build:all`, `npm run build:shared`.

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

### 2.1 Vercel

Project settings:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root Directory | `apps/web` (recommended). The repository root also works: npm workspaces are detected. |
| Build Command | Default (`npm run build`) |
| Install Command | Default (`npm install`) — runs the workspace `prepare` hook |
| Output Directory | Default (`.next`) |
| Node.js version | 22 (`engines.node` in `package.json`) |

Environment variables, set per environment under **Settings → Environment Variables**:

| Variable | Required | Environments | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | all | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | all | Anon key. RLS protects data. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Production, Preview | Server only. Never `NEXT_PUBLIC_`. |
| `NEST_API_BASE_URL` | no | Production, Preview | Origin of `apps/api`, for example `https://api.example.com`. Enables the `/api/v1/*` proxy. Unset means those paths 404. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | no | all | Public `pk.*` token |
| `MAPBOX_ACCESS_TOKEN` | no | Production, Preview | Server-side geocoding |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | no | Production, Preview | AI chat. Without the key the route returns `GEMINI_API_KEY_MISSING`. |
| `PAYMENT_PROVIDER_SECRET_KEY` | no | Production, Preview | When set, gateway order creation is not implemented, so create-intent returns 501 and sandbox confirmation returns 403. Leave unset for sandbox mode. |
| `STRICT_ENV_CHECK` | no | Production, Preview | `true` fails the build on missing required or malformed values. |

`NEXT_PUBLIC_*` values are compiled into the client bundle: redeploy after changing one. The build prints an environment report and fails hard on unsafe values (service-role key in a public variable, `sk.*` token in `NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`, or a localhost API URL on Vercel).

Verify after the first deployment:

```bash
curl -s https://<web>/api/auth/session        # expect {"authenticated":false,"configured":true,...}
curl -s -o /dev/null -w "%{http_code}\n" https://<web>/api/bookings/create -X POST   # expect 401
curl -s -o /dev/null -w "%{http_code}\n" https://<web>/api/v1/health                # expect 200 only when Nest is reachable
```

### 2.2 Any host (container, VM, another platform)

Environment: the table above, in the process environment or `.env.local`.

```bash
npm ci
npm run env:check
npm run build            # builds packages/shared, then apps/web
cd apps/web
npx next start -H 0.0.0.0 -p 3000
```

Before deploying, run `npx tsc --noEmit`, `npx next lint`, and the root `npm run test:unit` and `npm run test:db`.

## 3. NestJS service (`apps/api`), optional for the web flows

Needed only for the `/api/v1/*` rewrite (subscriptions, and the NestJS-only endpoints). It is a long-running server: deploy it as a container (or a separate Vercel project with Root Directory `apps/api`), not as part of the web build. On the web side, point `NEST_API_BASE_URL` at it.

```bash
npm ci
npm run build --workspace=apps/api      # builds packages/shared, then nest build
NODE_ENV=production PORT=4000 npm run start:prod --workspace=apps/api
```

`nest build` emits `apps/api/dist/src/main.js`; `start:prod` runs that file.

Production environment:

- `NODE_ENV=production`
- `JWT_ACCESS_SECRET` (at least 32 characters). The process refuses to start without it.
- `ENABLE_MOCK_AUTH` must be unset or `false`.
- `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`. Checkout and webhooks return 503 until these are set.
- `DATABASE_URL` for Prisma.
- `FRONTEND_URL` set to the web origin, so CORS accepts it.

Run the test suite in CI with Prisma generated: `npm test --workspace=apps/api`. The Prisma-dependent suites must pass (see TEST_RESULTS.md).

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
