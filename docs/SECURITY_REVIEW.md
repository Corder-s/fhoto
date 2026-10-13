# Security review

Scope: the Next.js app and its route handlers, the Supabase schema, RLS, triggers and storage policies, and the NestJS service. Method: code review of every route and migration, PGlite-based RLS tests, NestJS runtime probes over HTTP, and a production-server smoke test. Not covered: a penetration test, a live Supabase project, and dependency CVE scanning.

## Findings fixed in this pass

| ID | Severity | Finding | Fix |
| --- | --- | --- | --- |
| F-01 | Critical | NestJS subscriptions accepted the literal signature `test_webhook_valid_signature` on the webhook, so a forged payment event could activate a plan | Test shortcuts now require `isTestSignatureAllowed()` (non-production and mock flag). Verified: production refuses the shortcut (401). |
| F-02 | Critical | NestJS payment verification accepted `test_sig_<paymentId>` and any `valid_test_signature_*` string | Same gate. Verified over HTTP and in `auth-lockdown.test.ts`. |
| F-03 | High | Gateway key and webhook secret fell back to public placeholder strings, so HMACs could be forged with a known key | Production fails closed with 503 when unset. Development uses a random per-process secret. Verified: a correct HMAC with the configured secret is accepted, a placeholder-signed request is refused. |
| F-04 | High | NestJS auth endpoints issued tokens for fixed development accounts with no password check | All auth minting is gated by `ENABLE_MOCK_AUTH` and disabled in production (503). Verified over HTTP. |
| F-05 | High | NestJS JWT secret had a hardcoded fallback | No fallback. Production refuses to boot without `JWT_ACCESS_SECRET` (≥32 chars). Verified: boot exits 1. |
| F-06 | High | Server routes trusted client-supplied IDs, roles, prices, and statuses | Handlers resolve ownership from the session and compute prices on the server; the database refuses restricted column changes (triggers). |
| F-07 | High | Self-signup could claim any role, and creators could approve themselves or set their own rating | `handle_new_auth_user` allowlists `customer`/`creator`; creator and profile guard triggers; creator defaults forced on insert. Covered by the RLS suite. |
| F-08 | High | Profiles were readable by anonymous visitors, exposing email and phone | Profile reads limited to self, admin, or approved creator; anon column grant excludes contact fields. Covered by the RLS suite. |
| F-09 | High | Pending creators were visible in public listings | Public listing filters `verification_status = approved`; RLS applies to the browser fallback. |
| F-10 | High | Admin and creator screens relied on localStorage roles | Layouts use the server session. Data is refused by the API for non-admins. |
| F-11 | High | AI chat and geocoding were reachable without a session; a Gemini key fallback existed in code | `authorize()` added; key fallback removed. |
| F-12 | Medium | Layout gating is client-side, so anonymous visitors receive page shells | Partially mitigated: shells render no data and the API refuses requests. A server-side redirect is still recommended (KNOWN_ISSUES #11). |
| F-13 | Medium | Raw database errors returned to clients | Generic messages; detail logged server-side. |
| F-14 | Medium | Storage uploads were not scoped to the uploader | INSERT policies require the first folder to equal `auth.uid()`. Portfolio and avatar paths follow this. |
| F-15 | Medium | Seed scripts contained a password and project URL | Scripts read these from the environment and exit when missing. The old values remain in git history (F-19). |
| F-16 | Medium | Client-side profile write included `account_status` | Removed from the settings upsert. The trigger also refuses it. |
| F-17 | Medium | Avatar upload used `upsert`, which needs an UPDATE policy that does not exist | Plain insert with a unique timestamped path. |
| F-18 | Low | Admins could suspend their own account | Refused in both admin routes. |

## Open risks

| ID | Severity | Risk | Mitigation today | Recommended action |
| --- | --- | --- | --- | --- |
| R-01 | High | Old creator seed password and Supabase project URL remain in git history (commit history before this pass) | Not in working tree; scripts read env | Rotate the password; check any live project still using it; consider history rewrite |
| R-02 | High | Sign-up does not verify email ownership (`email_confirm: true`) | Accounts still need a password | Product decision: enable confirmation and adjust immediate sign-in |
| R-03 | High | Real payment gateway not implemented; sandbox confirmation is a database write from an authenticated customer | Refused when a gateway key is set | Implement gateway order creation and a signed webhook before taking real money |
| R-04 | Medium | Refund on cancellation changes labels only | Admin action only | Implement refund records and provider refunds |
| R-05 | Medium | Booking overlap check is not atomic | Application check on accepted, confirmed, and in-progress bookings | Add an exclusion constraint on time ranges per creator |
| R-06 | Medium | Booking audit misattributes `changed_by` to the customer | History text records the action | Fix the trigger to take the actor from the session or from the route |
| R-07 | Medium | Browser-local data (client CRM, some preferences) | Not used for authorization | Move to server storage if needed |
| R-08 | Medium | Several screens show fixture data (KNOWN_ISSUES #8) | Not connected to real data | Wire or remove |
| R-09 | Medium | NestJS data paths and Prisma-backed controllers not runtime-tested | Guards verified at HTTP for auth-level routes | Generate Prisma client and run the two blocked suites |
| R-10 | Low | `handle_new_auth_user` and the NestJS mock both produce predictable development identities | Mock is disabled in production | Keep the flag off in all shared environments |
| R-11 | Low | Public Mapbox token is visible in the browser | Designed as public (`pk.*`) | Restrict the token by URL in the Mapbox dashboard |
| R-12 | Low | 87 lint warnings, mostly `<img>` usage | No rule disabled | Migrate to `next/image` over time |

## Secrets handling

- No live credentials are in the repository. `.env.example` and `.env.local.example` contain placeholders only.
- `SUPABASE_SERVICE_ROLE_KEY`, `PAYMENT_PROVIDER_SECRET_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `JWT_ACCESS_SECRET`, `GEMINI_API_KEY`, and `MAPBOX_ACCESS_TOKEN` are read on the server only.
- Logs do not print tokens or passwords. Route errors are logged with the message only.
- `NEXT_PUBLIC_MAPBOX_TOKEN` is the only public map key and must be a `pk.*` token.

## Verification evidence

- RLS and trigger suite: 30/30 (TEST_RESULTS.md).
- NestJS runtime probes for F-01 to F-05 (TEST_RESULTS.md, "Runtime probes").
- Anonymous refusal on 7 protected routes against the production build.

## Reporting a vulnerability

Report privately to the repository owner. Do not open a public issue with exploit details.
