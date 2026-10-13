# Known issues

Numbers are referenced from other documents. Keep them stable.

## Blocking for real-money use

1. **Sign-up does not verify email ownership.** `/api/auth/register` creates users with `email_confirm: true` so that immediate sign-in works. Changing this needs a product decision about sign-in flow. The client fallback (`supabase.auth.signUp`) follows the Supabase project's confirmation setting.
2. **Paying a pending booking confirms it without the creator's acceptance.** `/api/payments/confirm-sandbox` sets `pending` → `confirmed`. The creator's accept/decline step is skipped, and decline is unavailable after payment. The code comment says this is deliberate. Confirm the product rule before launch.
3. **No gateway payments.** `create-intent` returns 501 when `PAYMENT_PROVIDER_SECRET_KEY` is set. No gateway order creation, no booking payment webhook, no capture, and no refund API are implemented.
4. **Subscription checkout is unverified end to end.** The NestJS billing path has its security fixes and tests, but the Razorpay order flow has not been run against a live gateway, and the NestJS Prisma client could not be generated in the verification sandbox (see #15).

## Data and workflow

5. **Booking overlap check is not atomic and ignores pending requests.** The route checks `accepted`, `confirmed`, and `in_progress` bookings before insert. Two pending requests can overlap, and two concurrent requests can both pass the check. A database exclusion constraint is the fix.
6. **Booking audit misattributes the actor.** `handle_booking_status_change` writes `changed_by = customer_id` for every change, including creator and admin actions.
7. **`on_the_way` and `arrived_at_venue` are not persisted.** The API logs them in history, and the status stays `confirmed` because the database CHECK does not allow them.
8. **Fixture-backed screens (production paths).** These render sample data from fixture constants, not live data:
   - `/customer/bookings/[id]`
   - `/customer/gallery`
   - `/customer/notifications`
   - `/customer/payments`
   - `/customer/reviews`
   - `/photographer/availability`
   - `/photographer/payouts`
   - `/photographer/reviews`
   - `/photographer/analytics` (hardcoded ledger and category data, with a demo banner)
   - `/photographer/galleries` (browser-local model only)

   Now live against the database and no longer on this list: `/owner/dashboard` (was fabricated executive metrics), `/photographer/verification` (was a state-selector demo), `/admin/dashboard` (already live).

   Wire them to the live tables or remove them before launch. Do not add new fixture-backed production screens.
9. **Refunds and payouts are labels, not money movement.** Cancellation by an admin sets `payment_status = refunded` without a `refunds` row or a provider refund. `creator_payouts` has no executor.
10. **No UI uploads deliverables.** `POST /api/deliverables` records metadata for a storage path or an external link. It does not upload files. Customers have no live list of deliverables yet.
11. **Layout gating is client-side — fixed for the session check, unchanged for roles.** `apps/web/src/middleware.ts` now checks the Supabase session cookie for `/admin`, `/owner`, `/photographer`, and `/customer` and redirects anonymous visitors to `/login?next=<path>`, so the page shell is no longer served. The middleware deliberately does not decide roles: a role lives in `user_roles` behind RLS, and the layouts plus `authorize()` remain the enforcement point. An authenticated account with the wrong role still receives the shell and a 403 from every API.
12. **Browser-local state.** `useAuth()` reads the role from user metadata for display only. `clientService.ts` (the creator CRM) is localStorage-only and per device.
13. **Admin bookings page fails silently.** `/admin/bookings` ignores non-OK responses from `PATCH /api/admin/bookings`. Show an error message.
14. **Lint warnings.** `next lint` reports 0 errors and 87 warnings: mostly `@next/next/no-img-element`, plus one `react-hooks/exhaustive-deps` in `src/context/UserProfileContext.tsx`. No rule is disabled.

## Verification gaps

15. **NestJS Prisma client not generated in the verification sandbox.** `prisma generate` failed with a TLS error (no outbound access to the Prisma binary host). `ai-service-and-tools` and `security-and-tenancy` fail to load, so the `npm test` command exits 0 while those two suites are not passing. The full NestJS app cannot boot here. Run `prisma generate` in CI and the two suites before release.
16. **Portfolio upload and package toggle are not exercised against a real Supabase project.** Both are reviewed in code and covered by the route logic, but neither has run with a real project.
17. **Phone-based sign-in and recovery are unavailable.** NestJS OTP is mock-only, and its `forgot-password` returns 501 by design. Web recovery uses email.
18. **Old credentials in git history.** A creator seed password and a Supabase project URL remain in earlier commits. The working tree no longer contains them. Rotate the password and check whether the project still uses it.
19. **Unused environment variables.** Several variables in `.env.example` (for example `PAYMENT_PROVIDER_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`, SMS, S3, Redis, and Twilio settings) are not read by any code path. They are placeholders for planned integrations.
20. **Development identities in NestJS mock mode.** Fixed IDs (`usr-pro-aman`, `usr-cust-aman`, `pro-aman`, `cust-001`) exist only when `ENABLE_MOCK_AUTH=true` outside production.
21. **Smoke script signed-in checks are opt-in.** `scratch/test-apis.js` runs anonymous checks by default. Set `SMOKE_COOKIE` and `SMOKE_CREATOR_ID` to run the booking and deliverable checks.
22. **Google Drive links are format-checked only.** The route validates the URL pattern. It does not confirm that the file is shared.
23. **Owner area is closed.** Resolved: `user_roles` accepts `owner`, `/owner/dashboard` is live, and administrators and their permissions are managed there. An owner is bootstrapped through SQL (see DEPLOYMENT_GUIDE.md §1); there is still no self-service path to ownership, which is intended.
24. **The `/api/v1/*` proxy needs `NEST_API_BASE_URL` and a running NestJS service.** When the variable is unset no rewrite is registered and those paths return 404; when it is set but the service is down, they fail with a connection error. The web app's own features do not depend on either.
25. **`/api/photographers` depends on the server service key for full access.** Without `SUPABASE_SERVICE_ROLE_KEY` it uses the browser client, which RLS limits to approved creators. Behaviour is correct but the set of columns and performance depend on RLS.
26. **Administrator permissions are additive, not a hard floor.** An admin with no rows in `admin_permissions` inherits every permission, so existing production admins keep working after the migration. Narrowing an account is explicit: the owner grants a list, and from that point the admin is restricted. If a permission set is ever emptied deliberately, the route clears the rows and the account returns to the full set. This is a documented trade-off, not a bug — but it means "grants nothing" cannot be expressed by an empty list.
27. **The owner dashboard shows no subscription revenue.** Creator SaaS billing (the MRR/ARR figures this page used to print as constants) has no table in the Supabase schema; it lives in the optional NestJS service. The page now says so in the ledger card instead of rendering invented numbers. Wiring the two together is a separate piece of work.
28. **Verification documents are stored, not validated.** The submission records an https link or a `creator-verification/<uid>/...` object path, and the reviewer opens it through a short-lived signed URL. Nothing checks that the file is legible, is the claimed document, or belongs to the applicant — that is the human reviewer's job. There is no virus scan or EXIF check.
29. **A review decision does not invalidate an in-flight request.** `resolveSession()` reads roles and permissions per request, so a revoked admin's next request is refused; but a decision made in the same instant as a reviewer's PATCH is resolved by the last write winning, with no optimistic-locking check on `creator_verification_submissions`.
