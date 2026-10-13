# Changelog

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
