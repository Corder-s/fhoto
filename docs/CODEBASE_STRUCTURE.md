# Codebase structure

```
fhoto/
├── apps/
│   ├── web/                      Next.js 14 app (primary product)
│   │   ├── src/app/              App Router pages and route handlers
│   │   │   ├── (admin)/admin/    admin layout + dashboard, bookings, creators, users
│   │   │   ├── (customer)/customer/  customer layout + bookings, messages, settings, fixtures (see KNOWN_ISSUES)
│   │   │   ├── (photographer)/photographer/  photographer layout + onboarding, portfolio, services, bookings, fixtures
│   │   │   ├── (owner)/owner/    closed owner area (no owner role exists)
│   │   │   ├── api/              route handlers (see API_DOCUMENTATION.md)
│   │   │   ├── explore/          public creator discovery (live data)
│   │   │   ├── photographers/    redirects to /explore (keeps old links working)
│   │   │   ├── forgot-password/, reset-password/   Supabase password recovery
│   │   │   └── page.tsx          home
│   │   ├── src/components/       UI components by area (admin, customer, photographer, home, booking, ai, auth)
│   │   ├── src/context/          React contexts (user profile, auth modal, booking)
│   │   ├── src/lib/
│   │   │   ├── server/session.ts    authorize(): server-side session + role check
│   │   │   ├── server/policy.ts     pure policy functions (booking transitions, ownership) — unit tested
│   │   │   ├── supabase/            browser client, server client, admin (service-role) client
│   │   │   ├── useServerSession.ts  client hook for /api/auth/session (display and route guards)
│   │   │   ├── auth.ts              client auth helper; role read from user metadata is display-only
│   │   │   ├── settingsService.ts   profile and preference writes (RLS-protected)
│   │   │   ├── clientService.ts     photographer CRM, localStorage only
│   │   │   └── subscriptionService.ts  calls the NestJS subscriptions API
│   │   └── src/data/, fixtures      sample data used by fixture-backed screens (see KNOWN_ISSUES)
│   └── api/                      NestJS service (secondary)
│       ├── src/auth/             mock auth (ENABLE_MOCK_AUTH), JWT guard, auth-config
│       ├── src/subscriptions/    SaaS plans, checkout, webhook (signature verified)
│       ├── src/bookings/, photographers/, galleries/, clients/, admin/, ai/, common/
│       ├── prisma/               Prisma schema (legacy model; client must be generated)
│       └── test/                 node:test suites run from compiled dist/
├── packages/shared/              @snapshoot/shared: plan catalogue and DTO types used by the API and the web app
│   ├── src/                      enums, constants (SAAS_PLANS), DTO types
│   └── dist/                     compiled output, not committed. Consumers resolve the package through it,
│                                 so it must be built first: `npm run build:shared` (the `prepare` hook and the
│                                 apps' `prebuild` steps do this automatically)
├── supabase/
│   ├── migrations/               ordered SQL: master schema, storage + RLS, security hardening
│   └── tests/rls-policies.test.mjs   PGlite-based RLS suite (npm run test:db)
├── tests/web-policy.test.mjs     unit tests for lib/server/policy.ts (npm run test:unit)
├── scratch/                      developer scripts. seed_* read credentials from env; test-apis.js is an HTTP smoke test
├── docs/                         this documentation set
└── package.json                  npm workspaces + root test scripts
```

## Conventions

- Route handlers return JSON with an `error` string on failure. Internal errors are logged on the server and returned as generic messages.
- Route handlers that write use the service-role client only after an explicit check; the check is written next to the query.
- Booking status values and transitions live in `lib/server/policy.ts` and nowhere else; handlers must call the policy functions.
- Pages that still use fixture data are named in KNOWN_ISSUES.md. Do not add new fixture-backed production screens.
