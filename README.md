# Instantshoot / SnapShoot — creative services marketplace

Instantshoot connects customers with photographers and other creative professionals. Customers discover approved creators, book a package, and track the booking. Creators (called photographers in the UI) manage their packages, portfolio, and bookings. Admins review applications and resolve disputes.

- **Web app:** Next.js 14 (App Router), Tailwind CSS, Supabase (Auth, Postgres with RLS, Storage). Location: `apps/web`. This is the deployable app.
- **Legacy API:** NestJS with Prisma, used for `/api/v1/*` and SaaS subscriptions. Location: `apps/api`. Optional for the web flows.
- **Shared package:** `packages/shared` (plan catalogue and DTO types). It compiles to `packages/shared/dist` and is imported by both apps as `@snapshoot/shared`.

## Status

Live: sign-up and sign-in, creator discovery, creator onboarding, packages, portfolio, booking creation and management for all three roles, admin review and suspension, admin stats, sandbox payments, deliverable records.

Not finished: real payment gateway, refunds and payouts, deliverable upload from the UI, and several screens that still show sample data. The full list, with what each gap means, is in [docs/FEATURE_INVENTORY.md](docs/FEATURE_INVENTORY.md) and [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md). The app is not ready for real payments.

## Quick start

```bash
npm install
cp apps/web/.env.local.example apps/web/.env.local   # fill in your Supabase project values
npm run env:check                                    # reports anything missing or unsafe
supabase db push                                     # apply supabase/migrations
npm run dev:web                                      # http://localhost:3000
```

Optional NestJS service: see [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md).

### Building the shared package

`apps/web` and `apps/api` import `@snapshoot/shared`, whose entry points are the compiled files in `packages/shared/dist`. That directory is not committed, so it has to be built before anything that resolves the package. This is automatic:

- `npm install` / `npm ci` runs `prepare` in `packages/shared`, which compiles it.
- `npm run build`, `npm run dev:web`, and the `build`/`test` scripts of both apps rebuild it first (`build:shared`).
- If a host runs `next build` directly, `next.config.mjs` stops with a one-line instruction instead of a webpack "Module not found" error.

To build it by hand: `npm run build:shared`.

## Deploying to Vercel

The web app deploys to Vercel. The NestJS service is separate and optional: the site works without it except for the `/api/v1/*` paths that only NestJS serves.

### 1. Project settings

Import the repository in Vercel, then:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js (detected) |
| Root Directory | `apps/web` (recommended). The repository root also works: npm workspaces are detected and the web workspace is built. |
| Build Command | Leave the default (`npm run build`). It runs `prebuild`, which compiles `@snapshoot/shared` and validates the environment before `next build`. |
| Install Command | Leave the default (`npm install`). It runs the workspace `prepare` hook that builds `@snapshoot/shared`. |
| Output Directory | Leave the default (`.next`). |
| Node.js version | 22 (pinned through `engines.node` in `package.json`). |

Only the production branch (`main`) builds by default; pull requests get preview deployments with their own environment values.

### 2. Environment variables

Add these under **Project → Settings → Environment Variables**. `npm run env:check` (also part of every build) prints the same list with what is missing for the deployment being built.

| Variable | Required | Environment(s) in the dashboard | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Production, Preview, Development | Supabase project URL. Sign-in, storage, and all data routes. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Production, Preview, Development | Supabase anon public key. RLS protects the data. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Production, Preview | Server-only key for admin routes and the public creator listing. Never expose it to the browser and never prefix it with `NEXT_PUBLIC_`. |
| `NEST_API_BASE_URL` | No | Production, Preview | Origin of the NestJS service, for example `https://api.example.com`. Enables the `/api/v1/*` proxy. Leave it out when `apps/api` is not deployed: those paths then return 404 instead of a connection error. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | No | Production, Preview, Development | Map and venue search. Must be a public `pk.*` token. Map features stay disabled without it. |
| `MAPBOX_ACCESS_TOKEN` | No | Production, Preview | Server-side geocoding for `/api/geocoding`. Useful even without the public token. |
| `GEMINI_API_KEY` | No | Production, Preview | AI assistant. Without it `/api/v1/ai/chat` answers with `GEMINI_API_KEY_MISSING`. |
| `GEMINI_MODEL` | No | Production, Preview | Model id for the AI assistant. Defaults to `gemini-1.5-flash`. |
| `PAYMENT_PROVIDER_SECRET_KEY` | No | Production, Preview | Leave unset for sandbox test mode. When set, `create-intent` returns 501 and `confirm-sandbox` returns 403, because gateway order creation is not implemented ([KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) #3). |
| `STRICT_ENV_CHECK` | No | Production, Preview | `true` turns missing required values above (and malformed values) into a build failure instead of a warning. Recommended for production once the values are in place. |

Notes:

- `NEXT_PUBLIC_*` values are inlined into the client bundle at build time. After changing one in the dashboard, **redeploy**; a restart or a cache purge is not enough.
- Values marked "server only" must not be prefixed with `NEXT_PUBLIC_`. The environment check fails the build if it sees `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`, a `service_role` key in `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or an `sk.*` Mapbox token in `NEXT_PUBLIC_MAPBOX_TOKEN`.
- Preview deployments for untrusted branches should use a separate Supabase project; a shared service-role key gives preview builds production data access.
- `PAYMENT_PROVIDER_WEBHOOK_SECRET` and `NEXT_PUBLIC_APP_URL` are in the example file but are not read by any code path yet.

### 3. Supabase settings for the deployment

1. **Authentication → URL Configuration:** set Site URL to the production origin and add `https://<your-domain>/reset-password` to the redirect URLs (password recovery). Add `https://<preview-domain>/**` too if preview sign-in should work.
2. Apply the migrations to the production project: `supabase link --project-ref <ref> && supabase db push`.
3. Create the first admin by inserting a `user_roles` row with `role = 'admin'` (see [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)).
4. Never run `scratch/seed_*.js` against production.

### 4. Deploying the NestJS service too

`apps/api` is a long-running server, not a serverless function. Give it its own Vercel project (Root Directory `apps/api`, no Next.js preset), or run it on a container host. Set at least `NODE_ENV=production`, `JWT_ACCESS_SECRET` (32+ characters), `DATABASE_URL`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`; the process refuses to start in production without the JWT secret. Then point `NEST_API_BASE_URL` at it from the web project. Full list in [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md).

### 5. Verify the deployment

```bash
curl -s https://<your-domain>/api/auth/session            # configured:true, authenticated:false
curl -s -o /dev/null -w "%{http_code}\n" https://<your-domain>/api/bookings/create -X POST   # 401
curl -s -o /dev/null -w "%{http_code}\n" https://<your-domain>/api/v1/health                 # 200 only when NestJS is deployed
```

If the build fails with `Module not found: Can't resolve '@snapshoot/shared'`, the shared package was not compiled before `next build`. The default build command handles this; a custom build command must include `npm run build:shared` (or `tsc -p ../../packages/shared/tsconfig.json`) first. See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

## Verification

```bash
npm run test:unit      # policy unit tests (19)
npm run test:db        # RLS and trigger tests on PGlite (30)
npm test --workspace=apps/api
cd apps/web && npx tsc --noEmit && npx next lint && npm run build
```

`npx tsc --noEmit` and the API tests read types and values from `packages/shared/dist`. Run `npm run build:shared` first if that directory was deleted by hand; the package scripts do it for you.

Results and their limits are in [docs/TEST_RESULTS.md](docs/TEST_RESULTS.md).

## Documentation

Start at [docs/README.md](docs/README.md). It indexes the architecture, API, authorization rules, workflows, security review, deployment, and troubleshooting documents.

## Security

No credentials are stored in this repository. Server secrets (service-role key, payment and JWT secrets) must be set in the environment and never prefixed with `NEXT_PUBLIC_`. See [docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md).
