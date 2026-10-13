# Environment setup

## Prerequisites

- Node.js 22 (the root test scripts use `node --test` with a glob; a directory argument does not work on Node 22)
- npm (workspaces)
- A Supabase project (for real sign-in, storage, and RLS). The Supabase CLI is needed to apply migrations.
- Optional: a Prisma-capable Postgres and `prisma generate` for the NestJS service

## Install

```bash
git clone <repo> fhoto && cd fhoto
npm install
```

## Web app environment (`apps/web/.env.local`)

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

| Variable | Required | Side | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | public | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | public | Anon key. RLS protects data. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes for admin and public listing | **server only** | Never prefix with `NEXT_PUBLIC_` |
| `PAYMENT_PROVIDER_SECRET_KEY` | no | server only | When set, gateway order creation is not implemented, so create-intent returns 501 and sandbox confirmation returns 403 |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | no | public by design | Must be a `pk.*` token |
| `MAPBOX_ACCESS_TOKEN` | no | server only | Geocoding |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | no | server only | AI chat. Without the key the route returns a configuration message with error code `GEMINI_API_KEY_MISSING`. |

If `NEXT_PUBLIC_SUPABASE_URL` or the anon key is missing, `/api/auth/session` reports `configured: false` and sign-in is unavailable.

## NestJS environment (`apps/api/.env`)

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | yes | `production` enables fail-closed checks |
| `PORT` | no | Defaults to 4000. The Next.js rewrite expects 4000. |
| `DATABASE_URL` | yes for Prisma | Read by `prisma/schema.prisma` |
| `JWT_ACCESS_SECRET` | yes in production | At least 32 characters. Production refuses to boot without it. Development uses a random per-process secret if unset. |
| `ENABLE_MOCK_AUTH` | no | `true` enables the development-only mock login. Ignored when `NODE_ENV=production`. |
| `RAZORPAY_KEY_ID` | no | Public key id; a placeholder is used if unset |
| `RAZORPAY_KEY_SECRET` | yes in production | Used to verify payment signatures. Production returns 503 for checkout if unset. |
| `RAZORPAY_WEBHOOK_SECRET` | yes in production | Used to verify webhook HMACs. Production returns 503 if unset. |

The rest of the variables in `.env.example` (SMS, S3, Redis, Twilio, MSG91, and others) are not read by any code path yet. They are listed there as placeholders for planned integrations.

## Root `.env.example`

Copy to `.env` if you run the NestJS service from the repository root. Real secrets must never be committed. The file contains only placeholders.

## Database

Apply migrations in order:

```bash
supabase link --project-ref <your-ref>
supabase db push          # applies supabase/migrations/*.sql in order
```

Migrations: `20261012000001_master_instantshoot_schema.sql`, `20261012000002_storage_and_rls_policies.sql`, `20261013000001_security_hardening.sql`. The hardening migration is idempotent and must be applied after the first two.

## Running

```bash
npm run dev:web            # http://localhost:3000
npm run dev:api            # http://localhost:4000/api/v1 (needs prisma generate first)
```

## Seed scripts

`scratch/seed_creators.js` and `scratch/seed_vikram.js` create demo creator accounts. They read the Supabase URL, service-role key, and seed password from the environment and refuse to run without them. There are no default passwords. Use them only against a development project.

## Verification commands

See TESTING_STRATEGY.md. The short form:

```bash
npm run test:unit          # 19 policy unit tests
npm run test:db            # 30 RLS and trigger tests (PGlite)
npm test --workspace=apps/api
cd apps/web && npx tsc --noEmit && npx next lint && npx next build
```
