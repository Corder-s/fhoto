# Testing strategy

Testing is layered by what can be run in this repository without external services.

| Layer | Command | Location | What it proves | What it cannot prove |
| --- | --- | --- | --- | --- |
| Type check | `cd apps/web && npx tsc --noEmit` | `apps/web` | Types across pages, routes, and libs | Runtime behaviour |
| Lint | `cd apps/web && npx next lint` | `apps/web` | Rules pass (0 errors). Warnings are tracked, not disabled. | Logic |
| Production build | `cd apps/web && npx next build` | `apps/web` | Pages and route handlers compile and prerender | Live data |
| Policy unit tests | `npm run test:unit` | `tests/web-policy.test.mjs` (19 cases) | Pure policy functions: booking state machine, ownership matching, role allowlists, status rules | Route wiring |
| Database and RLS tests | `npm run test:db` | `supabase/tests/rls-policies.test.mjs` (30 cases) | Policies and triggers on PGlite (in-process Postgres): signup role allowlist, self-approval and rating guards, restricted column guards, anon exposure of PII, pending creators hidden, booking insert and status guards, service-role bypass, message participation, storage folder scope, private deliverable reads, migration idempotency | Real Supabase `auth` and `storage` behaviour (both are stubs); real network |
| NestJS tests | `npm test --workspace=apps/api` | `apps/api/test/*.test.ts` compiled to `dist/test` | Subscriptions billing and signature checks, auth lockdown, payment-signature lockdown, security and tenancy, AI tool execution | Two suites need the Prisma client (see TEST_RESULTS.md) |
| HTTP smoke | `SMOKE_BASE_URL=… node scratch/test-apis.js` | `scratch/test-apis.js` | Anonymous refusals on protected routes; with `SMOKE_COOKIE` and `SMOKE_CREATOR_ID`, booking creation and deliverable validation | Browser flows |
| Runtime auth probe | start `AuthModule` and `SubscriptionsModule` in a harness (see TEST_RESULTS.md) | ad hoc | 503/401/501 behaviour and webhook signature handling over HTTP | Prisma data paths |

## Principles

- **No weakened assertions.** When a test is updated to match a security fix, the assertion stays and only the setup changes. For example, the subscription billing suite sets `ENABLE_MOCK_AUTH=true` so the sandbox signatures it depends on are honoured in non-production mode.
- **No skipped suites.** A suite that cannot load is reported as a failure. Do not hide it with `skip`.
- **Honest counts.** Report what ran. A describe-level failure is not a pass.
- **Dedicated test data only.** Seed scripts and test fixtures are the only places mock data may appear. Production paths must not depend on them.

## Gaps

- No browser end-to-end tests. Playwright or Cypress would need a browser and a seeded Supabase project.
- No automated test against a real Supabase project. The portfolio upload and the services toggle have been reviewed in code but never run against one.
- Storage RLS is checked as predicates only.
- Visual regression is not tested.

## Running everything

```bash
npm run test:unit
npm run test:db
npm test --workspace=apps/api
cd apps/web && npx tsc --noEmit && npx next lint && npx next build
```
