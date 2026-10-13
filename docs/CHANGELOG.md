# Changelog

## 2026-10-13 — Owner dashboard, administrator permissions, and photographer verification (branch `arena/d4413e1c-fhoto`)

### Added

- **Migration `20261013000002_owner_roles_admin_permissions_and_verification.sql`** (additive, idempotent): `owner` in `user_roles.role`; `public.is_owner()`; `public.is_admin()` now accepts owners so every existing policy covers them; `admin_permissions`; `creator_verification_submissions` (one open application per creator, private document metadata, review columns); `suspended` as a creator verification state; column guards and two mirror triggers so a filing or a review keeps `creator_profiles.verification_status`, the admin queue, the photographer's notifications, and the public directory in step.
- `GET /api/owner/stats` — executive figures computed from the tables (accounts, administrators, owners, open verifications, creator profiles per verification state, bookings per status, gross booked value, platform fees, paid revenue, supply per city).
- `GET/POST /api/admin/roles` — administrators with their effective permissions, search over registered accounts, promote an existing account, replace a permission set, revoke, and owner-only `grantOwner` / `revokeOwner`.
- `GET/PATCH /api/admin/verification` and `GET /api/admin/verification/document` — the review queue, the decision write, and 120-second signed URLs for private documents.
- `GET/POST/DELETE /api/photographers/verification` — the applicant side of the same workflow: state, filing (ID numbers stored masked), and withdrawal of an unreviewed application.
- `apps/web/src/middleware.ts` — a session check in front of `/admin`, `/owner`, `/photographer`, and `/customer`. Anonymous visitors are redirected to `/login?next=<path>`; `/login` honours `next` through the existing `resolvePostAuthRedirect` sanitizer.
- `apps/web/src/lib/server/verification.ts` — queue read, filing, review, and directory revalidation in one place, so the two dashboards cannot disagree.
- `components/admin/VerificationQueue.tsx`, `components/admin/AdministratorPanel.tsx`, `components/owner/OwnerDashboardView.tsx`.

### Changed

- `/owner/dashboard` no longer renders fabricated revenue. The previous page printed a fixed combined net revenue, a take-rate split, three subscription tiers with counts, an MRR/ARR figure, a churn rate, growth arrows, and a "Live Production Metrics" badge — none of it computed. It is now live data plus the access-control manager, and it states plainly that subscription revenue is not in this schema (KNOWN_ISSUES #27).
- `/photographer/verification` no longer offers a dropdown of fake lifecycle states with an invented ticket id and a hardcoded document checklist; it reads and writes the database.
- `AdminDashboardView`: the shallow "approve / reject" list is replaced by the verification queue (reason required for rejection, `needs_info` supported, reloaded from the server after a decision); user filter gains `Admins`; the administrator roster and permission state are shown read-only with the caller's own capabilities.
- `authorize()` takes a `permission`; every `admin` route now declares which capability it needs, and `/api/auth/session` reports `permissions` and `isOwner` so the UI can reflect them (presentation only — the routes re-check).
- `resolveSession()` reads `admin_permissions` alongside `user_roles`; a missing table does not lock an admin out.
- `/api/admin/creators`: `suspend_profile` / `reinstate_profile` change the publication state without touching the login, and a rejection must carry a reason.
- `/api/admin/users`: an owner's account can only be changed by an owner.
- `useServerSession()` exposes the permission set; `packages/shared` gains `AppRoleType`, `AdminPermissionType`, `VerificationStatus.SUSPENDED`, and the verification size limits.

### Security

- Privilege escalation surface reviewed: `user_roles` and `admin_permissions` have no client write policy, `handle_new_auth_user()` still downgrades any requested role that is not `creator`, and `/api/auth/register` cannot ask for `admin` or `owner`.
- A review decision cannot be written by an applicant: the submission guard resets a client insert to `pending`, refuses another user's creator id, and rejects every client update.
- Service-role keys, document storage paths, and raw ID numbers are absent from client payloads; documents are read through signed URLs scoped to the applicant's own folder.

### Tests

- `tests/web-policy.test.mjs`: 19 → 34 cases (owner role, permission resolution including the legacy-inheritance rule, self-lockout guards, verification filing/decision rules, identifier masking, storage-path safety, submission sanitization).
- `supabase/tests/rls-policies.test.mjs`: 30 → 42 cases (owner accepted by `user_roles`, `is_admin()`/`is_owner()`, cross-account reads by an owner, self-grant refusal, `has_admin_permission()` for owner/legacy/narrowed/creator, forced-pending filing, foreign creator refusal, one-open-application, queue visibility, publish-and-notify on approval, suspension closing the open application, withdrawal, private bucket scoping) and the idempotency check now replays both hardening and access migrations.

### Not verified

- Nothing was exercised against the live Vercel deployment or the production Supabase project: this sandbox has no network path to `*.vercel.app` or `*.supabase.co`, and no `vercel` or `supabase` CLI credentials. See docs/TEST_RESULTS.md.

## 2026-10-13 — Vercel deployment fix and deployment variables (branch `arena/67428ada-fhoto`)

### Fixed

- **Vercel build failure:** `Failed to compile. Module not found: Can't resolve '@snapshoot/shared'` in `apps/web`. The package resolves through `packages/shared/dist`, which is not committed and was never built on a fresh clone, so webpack could not resolve it. `apps/web` and `apps/api` typechecks failed the same way.
- `apps/api` `start:prod` pointed at `dist/main`, but `nest build` emits `dist/src/main.js`.

### Changed

- `packages/shared`: added an `exports` map, a `prepare` hook that compiles the package on `npm install` / `npm ci`, and a `clean` script.
- `apps/web` and `apps/api`: added a `prebuild` step (`build:shared`) that compiles `@snapshoot/shared` before `next build`, `nest build`, or the API test compile. The API test script also rebuilds it (`pretest`).
- Root scripts: `build` now builds the shared package and the web app in order. Added `build:shared`, `build:web`, `build:api`, `build:all`, and `env:check`.
- `apps/web/next.config.mjs`: the `/api/v1/*` rewrite is no longer hardcoded to `http://localhost:4000`. It reads `NEST_API_BASE_URL` (or `API_BASE_URL`) and registers no rewrite when unset, so a deployment without the NestJS service answers 404 instead of proxying to the build machine. The config file also fails fast with instructions when the shared package has not been built.
- New `apps/web/scripts/check-env.mjs` (`npm run env:check`, wired into `prebuild`): reports configured and missing deployment variables per Vercel scope, warns when required values are absent (fails when `STRICT_ENV_CHECK=true`), and always fails on unsafe values — a `service_role` key in `NEXT_PUBLIC_SUPABASE_ANON_KEY`, an anon key in `SUPABASE_SERVICE_ROLE_KEY`, an `sk.*` token in `NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`, or a localhost API URL on Vercel.
- Both `package.json` files pin Node.js 22 through `engines.node`.
- `apps/web/.env.local.example`: documents required versus optional values, the Vercel scope for each, the variables that no code path reads yet, and that `NEXT_PUBLIC_*` changes need a redeploy.

### Documentation

- README: new "Deploying to Vercel" section — project settings, the full environment-variable table with scopes, Supabase URL configuration, optional NestJS deployment, and post-deploy checks — plus a "Building the shared package" explanation and the verification commands.
- DEPLOYMENT_GUIDE.md: build-order section (why `@snapshoot/shared` must be compiled first), a Vercel path with the environment table, corrected API build and start commands.
- ENVIRONMENT_SETUP.md, TROUBLESHOOTING.md, CODEBASE_STRUCTURE.md: shared-package build step, `NEST_API_BASE_URL`, `env:check`, and the new failure-mode entries.

## 2026-10-13 — Security, integration, and documentation pass (branch `arena/217a1005-fhoto`)

### Security

- NestJS subscriptions: test-only signatures (`test_webhook_valid_signature`, `test_sig_<id>`, `valid_test_signature_*`) are accepted only in non-production mock mode.
- NestJS gateway secrets: no placeholder fallbacks. Production returns 503 when unset; development uses a random per-process value.
- NestJS auth: all token-minting routes are disabled unless `ENABLE_MOCK_AUTH=true` outside production. JWT secret has no fallback; production refuses to boot without it.
- Database: hardening migration `20261013000001_security_hardening.sql` — signup role allowlist, restricted-column triggers for profiles, creator profiles, and bookings, creator defaults on insert, profile read limits with an anon column grant, participation-scoped deliverables and messages, folder-scoped storage writes, and removal of the direct customer booking insert policy.
- Route handlers: `authorize()` with ownership checks on bookings, packages, portfolio, onboarding, deliverables, payments, profile, AI chat, and geocoding. Prices, fees, and statuses are computed on the server.
- Admin: new admin-only routes for stats, creator review (approve, reject, suspend, reinstate), and users (suspend, reactivate). Admins cannot act on their own account.
- Client: layouts read the server session (`/api/auth/session`) instead of localStorage roles.
- Settings: client no longer writes `account_status`. Avatar upload is a plain insert under the user's folder.
- Errors: generic messages to clients; detail logged on the server.
- Secrets: seed scripts read credentials from the environment; Gemini key fallback removed; `.env.example` placeholders only.

### Features and behaviour

- Creator packages: partial updates merge into the stored row; the active toggle sends only `id` and `isActive`.
- Portfolio: browser uploads to `creator-portfolios/<uid>/…`, then saves the public URL through the API. Files over 10 MB are rejected.
- Booking cancellation: customers can cancel `pending`, `accepted`, or `confirmed` bookings with a reason in history.
- Booking actions for creators and admins: `update_status`, `request_cancellation`, `resolve_cancellation`, `force_cancel`, `force_confirm`, each with history entries.
- Explore: shows only live approved creators. Sample creators removed. `/photographers` redirects to `/explore`.
- Admin dashboard: live stats and review queues. The "Verify Photographer" anchor resolves on the page.
- Password recovery: `/forgot-password` and a new `/reset-password` page.
- Public creator listing: returns a generic 500 on failure.

### Quality

- ESLint 8 and `eslint-config-next` 14 added as dev dependencies of `apps/web`. `next lint` reports 0 errors (from 6). Rules are not disabled.
- Unescaped quotes fixed in four files.
- Root scripts: `test:unit` (19 policy tests) and the existing `test:db` (30 RLS tests) run from the repository root.
- NestJS tests: `auth-lockdown.test.ts` (10 cases) and 5 payment and webhook lockdown cases added. Subscription tests set the mock flag in setup; assertions are unchanged.

### Documentation

- Added the `docs/` set: overview, architecture, codebase structure, environment setup, database schema, API documentation, authentication, authorization, the three role workflows, end-to-end data flow, feature inventory, testing strategy, test results, security review, deployment, troubleshooting, and known issues.
- Replaced the root README claims that did not match the code.

### Known regressions and removals

- `scratch/test-apis.js` no longer prints a success banner unconditionally. It asserts status codes and exits non-zero on failure. Its earlier flow required anonymous booking creation, which is no longer allowed.
- The NestJS `forgot-password` route returns 501 (web recovery uses Supabase).
- Sign-up is unchanged in behaviour (email still auto-confirmed); see KNOWN_ISSUES #1.
