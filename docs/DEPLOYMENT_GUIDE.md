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
2. Apply migrations in order: `20261012000001_master_instantshoot_schema.sql`, `20261012000002_storage_and_rls_policies.sql`, `20261013000001_security_hardening.sql`, `20261013000002_owner_roles_admin_permissions_and_verification.sql`. Use `supabase db push` after `supabase link`. Each file is additive and idempotent, and `npm run test:db` replays all four in PGlite.
3. Confirm the buckets exist: `profile-avatars` (public), `creator-portfolios` (public), `booking-deliverables` (private), and the verification bucket.
4. Authentication settings:
   - Site URL: the public web origin.
   - Redirect URLs: include `<origin>/reset-password` for the recovery flow.
   - Decide on email confirmation (KNOWN_ISSUES #1). The app's sign-up route currently confirms email automatically.
5. Create the first owner by inserting a `user_roles` row with `role = 'owner'` for an existing auth user, through the SQL editor with the service role:

   ```sql
   INSERT INTO public.user_roles (user_id, role)
   SELECT p.id, 'owner'
     FROM public.profiles p
    WHERE lower(p.email) = 'you@example.com'
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

   That one row is the entire bootstrap: the account can now open `/owner/dashboard`,
   where further admins and owners are promoted from the UI. There is no self-service
   path to ownership, and `/api/auth/register` cannot request it. Admins created before
   this migration keep full access (they have no `admin_permissions` rows, which means
   "unrestricted"); narrow them from the owner dashboard when you want to limit them.
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
curl -s -o /dev/null -w "%{http_code}\n" https://<web>/api/admin/stats              # expect 401
curl -s -o /dev/null -w "%{http_code}\n" https://<web>/api/owner/stats              # expect 401
curl -s -o /dev/null -w "%{http_code}\n" https://<web>/owner/dashboard              # expect 307 to /login?next=/owner/dashboard
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

### Preview URLs and Vercel Deployment Protection

Vercel's Deployment Protection (Vercel Authentication) sits in front of preview URLs for accounts
that are not members of the Vercel team, so `https://<branch>-fhoto-<team>.vercel.app` answers
Vercel's own sign-in page to a curl from another machine or a CI job. That is Vercel refusing, not
the app. To exercise a preview from outside, browse it while signed in to Vercel, or temporarily
disable protection (or pass the project's `x-vercel-protection-bypass` value). Production is not
behind protection, so the checks above work there.

### A `501` from the new routes means the migration is missing

`/api/photographers/verification`, `/api/admin/verification` and `/api/admin/roles` answer
`501 — Verification and administrator-permission storage is not set up on this project yet` when
the database they talk to has not had
`20261013000002_owner_roles_admin_permissions_and_verification.sql` applied. The deployment is
fine; apply the migration to the project that `NEXT_PUBLIC_SUPABASE_URL` points at. Do not "fix"
this by editing policies or granting wider keys.

## 5. Rollback

- Web: redeploy the previous build. Database migrations are not reversed automatically. The hardening and access migrations are idempotent, so re-applying them is safe. Rolling back past `20261013000002` leaves the extra `creator_verification_submissions` table and `admin_permissions` table in place; the older app code ignores them.
- Database: restore from a backup before the migration if a rollback past `20261013000001` is needed. Plan for this before migrating production.

## 6. Pre-launch blockers

See KNOWN_ISSUES.md items 1–4 and the open risks in SECURITY_REVIEW.md. The web app is not ready for real payments.
