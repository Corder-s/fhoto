# Instantshoot / SnapShoot — creative services marketplace

Instantshoot connects customers with photographers and other creative professionals. Customers discover approved creators, book a package, and track the booking. Creators (called photographers in the UI) manage their packages, portfolio, and bookings. Admins review applications and resolve disputes.

- **Web app:** Next.js 14 (App Router), Tailwind CSS, Supabase (Auth, Postgres with RLS, Storage). Location: `apps/web`.
- **Legacy API:** NestJS with Prisma, used for `/api/v1/*` and SaaS subscriptions. Location: `apps/api`.
- **Shared package:** `packages/shared` (plan catalogue and DTO types).

## Status

Live: sign-up and sign-in, creator discovery, creator onboarding, packages, portfolio, booking creation and management for all three roles, admin review and suspension, admin stats, sandbox payments, deliverable records.

Not finished: real payment gateway, refunds and payouts, deliverable upload from the UI, and several screens that still show sample data. The full list, with what each gap means, is in [docs/FEATURE_INVENTORY.md](docs/FEATURE_INVENTORY.md) and [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md). The app is not ready for real payments.

## Quick start

```bash
npm install
cp apps/web/.env.local.example apps/web/.env.local   # fill in your Supabase project values
supabase db push                                     # apply supabase/migrations
npm run dev:web                                      # http://localhost:3000
```

Optional NestJS service: see [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md).

## Verification

```bash
npm run test:unit      # policy unit tests (19)
npm run test:db        # RLS and trigger tests on PGlite (30)
npm test --workspace=apps/api
cd apps/web && npx tsc --noEmit && npx next lint && npx next build
```

Results and their limits are in [docs/TEST_RESULTS.md](docs/TEST_RESULTS.md).

## Documentation

Start at [docs/README.md](docs/README.md). It indexes the architecture, API, authorization rules, workflows, security review, deployment, and troubleshooting documents.

## Security

No credentials are stored in this repository. Server secrets (service-role key, payment and JWT secrets) must be set in the environment and never prefixed with `NEXT_PUBLIC_`. See [docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md).
