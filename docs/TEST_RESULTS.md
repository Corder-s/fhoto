# Test results

Verification run on branch `arena/217a1005-fhoto`, 2026-10-13, after the final code edits. Sandbox: Node 22, no Docker, no Postgres, no browser, no outbound access to Supabase or Prisma binary hosts.

## Summary

| Check | Command | Result | Notes |
| --- | --- | --- | --- |
| Web type check | `npx tsc --noEmit` (apps/web) | **exit 0** | Final run after the settings and avatar edits |
| Web lint | `npx next lint` (apps/web) | **exit 0**, 0 errors, **87 warnings** | Warnings: `@next/next/no-img-element` across many files, one `react-hooks/exhaustive-deps` in `UserProfileContext.tsx`. No rule disabled. |
| Web production build | `npx next build` (apps/web) | **exit 0** | Built after all code edits. Google Fonts download failed (sandbox has no access); fonts were skipped. |
| Policy unit tests | `npm run test:unit` | **19 / 19 pass**, exit 0 | |
| RLS and trigger tests | `npm run test:db` | **30 / 30 pass**, exit 0 | PGlite. `auth` and `storage` are stubs. |
| NestJS build | `npx nest build` (apps/api) | **exit 0** | |
| NestJS tests | `npm test` (apps/api) | **39 tests pass, 0 fail** across 3 loaded suites. **2 of 5 suites failed to load** (see below). The command exits 0, but those two suites are not passing. | Blocked by the sandbox, not by the code under test |
| HTTP smoke, anonymous | `node scratch/test-apis.js` against the production server | **7 / 7 pass** (protected routes return 401 without a session) | |
| Public routes (production server) | curl | `/photographers` → 307 `/explore`; `/explore`, `/forgot-password`, `/reset-password` → 200; `/api/auth/session` → 200 `configured:true, authenticated:false` | |
| Public listing with placeholder backend | `GET /api/photographers` | 500 with generic message `Could not load photographers.` | Expected: placeholder Supabase host is unreachable. Raw error logged server-side only. |
| Nest auth and billing runtime | harness (below) | See table | Verified over HTTP |

## NestJS details

`npm test` ran these test files:

- `security-and-tenancy.test.ts` — **did not load**: `@prisma/client did not initialize yet. Please run "prisma generate".`
- `subscription-billing.test.ts` — pass (includes the test-signature checks; the file now sets `ENABLE_MOCK_AUTH=true`, with no assertion changes)
- `security-audit-and-readiness.test.ts` — pass
- `ai-service-and-tools.test.ts` — **did not load**: same Prisma error
- `auth-lockdown.test.ts` — pass, including 5 new payment and webhook lockdown cases

Attempts to run `prisma generate` failed with a TLS error reaching `binaries.prisma.sh` (no outbound access). Those two suites therefore cannot run here. They must be run in an environment with the Prisma engines available.

### Runtime probes (NestJS over HTTP)

A harness booted `AuthModule` and `SubscriptionsModule` with a stub Prisma provider. The full application cannot boot in this sandbox because the Prisma client is not generated.

| Mode | Request | Result |
| --- | --- | --- |
| Development, mock auth **off** | `POST /auth/login`, `request-otp`, `verify-otp` | 503 "Mock authentication is disabled" |
| | `POST /auth/forgot-password` | 501 |
| | `GET /auth/me` (no token) | 401 |
| | `GET /subscriptions/plans` (public) | 200 |
| | `GET /subscriptions/current`, `invoices`, `toggle-cancel` (no token) | 401 |
| | `POST /subscriptions/webhook` with `test_webhook_valid_signature` | 401 "Invalid Razorpay webhook signature" |
| Development, mock auth **on** | `POST /auth/login` | 200, JWT issued for a development account |
| | `GET /auth/me` with that token | 200 |
| | webhook with `test_webhook_valid_signature` | 201 (sandbox shortcut, allowed only here) |
| | webhook with an arbitrary signature | 401 |
| Production, mock flag **set**, no webhook secret | `POST /auth/login` | 503 (mock is disabled in production) |
| | `GET /subscriptions/plans` | 200 |
| | webhook with `test_webhook_valid_signature` | 503 "RAZORPAY_WEBHOOK_SECRET is not configured." |
| Production, webhook secret configured | webhook with `test_webhook_valid_signature` | 401 |
| | webhook with a correct HMAC-SHA256 of the body | 201 |
| Production, no `JWT_ACCESS_SECRET` | process start | exits 1: "JWT_ACCESS_SECRET must be set in production." |

Not verified at runtime: Prisma-backed data endpoints (bookings, photographers, galleries, clients, admin, AI), the rate-limit guard under load, and real Razorpay order flows.

## Web runtime probes

Production server (`next start`) with placeholder Supabase settings:

- `scratch/test-apis.js`: 7 anonymous checks passed: `POST /api/bookings/create`, `POST /api/payments/create-intent`, `POST /api/deliverables`, `GET /api/deliverables`, `POST /api/photographers/services`, `GET /api/admin/stats`, `GET /api/admin/users`. All returned 401.
- The signed-in checks were **not run**: they need `SMOKE_COOKIE` and `SMOKE_CREATOR_ID` from a real account.
- Pages `/admin/dashboard`, `/customer/bookings`, `/photographer/portfolio` return 200 as shells. Their content is gated in the browser and their data is refused by the API (see SECURITY_REVIEW.md, F-12).

## Not verified

- Any flow against a real Supabase project: sign-up, sign-in, portfolio upload, services toggle, avatar upload, admin actions, RLS on the live database.
- Browser behaviour of every page. No browser is available in this sandbox.
- Real payments and webhooks for bookings (not built).

## Reproduce

See TESTING_STRATEGY.md. The smoke script also takes `SMOKE_BASE_URL`, and it needs the production server started with `npx next start -H 0.0.0.0 -p 3000`.

## 2026-10-13 — Deployment fix verification (branch `arena/67428ada-fhoto`)

Sandbox: Node 22.22.3, npm 10.9.8, same limits as above (no Docker, no Postgres server, no outbound access to Supabase, Vercel, or the Prisma engine host). Prisma Client was present in `node_modules/.prisma/client`, so the API suites that were blocked in the previous run loaded this time.

| Check | Command | Result | Notes |
| --- | --- | --- | --- |
| Failure reproduced | `npm run build` (apps/web, no `packages/shared/dist`) | **exit 1** | Same error as the Vercel log: `Module not found: Can't resolve '@snapshoot/shared'` in `subscription/page.tsx` and `subscriptionService.ts` |
| Same command after the shared build | `npx tsc -p ../../packages/shared/tsconfig.json` then `npm run build` | **exit 0** | Confirms the cause and the fix |
| Fresh install builds the shared package | `rm -rf node_modules packages/shared/dist && npm ci` | **exit 0** | The `prepare` hook created `packages/shared/dist/index.js` |
| Fresh build with the artifact deleted | `rm -rf packages/shared/dist && npm run build` (in `apps/web`, the way Vercel invokes the workspace) | **exit 0** | `prebuild` rebuilt the shared package; `Compiled successfully`, 52 static pages |
| Root build | `npm run build` (repository root) | **exit 0** | Shared package, then the web app |
| API build | `rm -rf packages/shared/dist && npm run build --workspace=apps/api` | **exit 0** | `prebuild` ran; emitted `apps/api/dist/src/main.js` |
| Web type check | `npx tsc --noEmit` (apps/web) | **exit 0** | With `packages/shared/dist` present |
| Web lint | `npx next lint` (apps/web) | **exit 0**, warnings only | Same pre-existing `no-img-element` and hooks warnings |
| API tests | `npm test --workspace=apps/api` | **39 tests pass, 0 fail** | `pretest` built the shared package first |
| Policy unit tests | `npm run test:unit` | **19 / 19 pass** | |
| RLS and trigger tests | `npm run test:db` | **30 / 30 pass** | PGlite |
| Environment check, empty environment | `node scripts/check-env.mjs` (apps/web) | **exit 0**, report printed | Lists the three required Supabase values as missing; warnings do not fail the build |
| Environment check, unsafe values | same script with a `service_role` key in the anon variable, an `sk.*` Mapbox token, `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`, and a localhost API URL on Vercel | **exit 1** | Five errors reported, as intended |

Not verified here: the Vercel build itself (no network access to Vercel), and the runtime behaviour of `NEST_API_BASE_URL` against a running NestJS service.
