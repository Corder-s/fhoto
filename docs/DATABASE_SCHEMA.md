# Database schema

The system of record is the Supabase Postgres project. Schema is defined by four migrations in `supabase/migrations/`, applied in order:

1. `20261012000001_master_instantshoot_schema.sql` — tables, enums-as-CHECKs, base triggers, and seed data for categories and fee settings.
2. `20261012000002_storage_and_rls_policies.sql` — storage buckets and the first RLS policy set.
3. `20261013000001_security_hardening.sql` — tightened signup, column guards, privacy-aware profile reads, participation-scoped deliverables and messages, and folder-scoped storage writes. Idempotent (`DROP POLICY IF EXISTS` / `CREATE OR REPLACE`).
4. `20261013000002_owner_roles_admin_permissions_and_verification.sql` — the `owner` role, `admin_permissions`, `creator_verification_submissions` with the triggers that keep the profile's publication state in step with it, and `suspended` as a creator verification state. Idempotent and additive; it changes no existing rows.

## Tables (public schema)

| Table | Purpose | Key constraints |
| --- | --- | --- |
| `profiles` | One row per auth user: name, email, phone, avatar, `account_status` | `account_status` ∈ {active, suspended, pending_verification}; PK = `auth.users.id` |
| `user_roles` | Role grants | `UNIQUE(user_id, role)`; role ∈ {customer, creator, admin, owner} |
| `creator_profiles` | Creator (photographer) business profile | `user_id` UNIQUE; `verification_status` (unsubmitted → pending → approved/rejected, plus `suspended`); `is_available`; rating defaults |
| `admin_permissions` | Per-administrator capability grants | `user_id` + `permission` UNIQUE; five permission values (see AUTHORIZATION_AND_ROLE_ACCESS.md); no client write policy |
| `creator_verification_submissions` | Photographer verification applications and their review | one open application per creator (partial UNIQUE on `creator_id` where `status='pending'`); `documents` is a JSONB array; review columns are server-written |
| `creator_services` | Packages offered by a creator | `base_price ≥ 0`, `duration_minutes > 0`, `delivery_time_hours > 0`, `service_type` ∈ {instant, scheduled} |
| `creator_portfolio_items` | Portfolio images (URLs to `creator-portfolios`) | |
| `creator_availability`, `creator_unavailable_periods` | Weekly availability and blocked dates | |
| `service_categories` | Category catalogue | seeded |
| `platform_fee_settings` | Commission rate used at booking time | seeded (10%) |
| `bookings` | A customer's request to a creator | `booking_status` ∈ {pending, accepted, rejected, confirmed, in_progress, completed, cancelled, disputed}; `payment_status`; price snapshot columns |
| `booking_status_history` | Audit trail of status changes | `changed_by`, `reason`, `from`/`to` |
| `payments` | Payment attempts | `provider` ∈ {razorpay, cashfree, stripe, dev_sandbox}; `payment_status` ∈ {pending, captured, paid, failed, refunded}; `idempotency_key` UNIQUE |
| `refunds` | Refund records | |
| `creator_payouts` | Payout ledger | exists; no payout execution is implemented |
| `booking_deliverables` | Files or external links delivered for a booking | `storage_provider` ∈ {supabase_storage, google_drive, external_video, other_external}; `delivery_status` ∈ {uploaded, ready_for_review, approved} |
| `conversations`, `messages` | Booking-scoped messaging | insert requires participation |
| `reviews` | Customer reviews of creators | rating aggregates maintained by trigger |
| `notifications` | In-app notification rows | exists; the notifications screen is fixture-backed |

## Column-guard triggers

Restricted columns are protected in the database, not only in route handlers:

| Trigger | Table | Refuses non-privileged changes to |
| --- | --- | --- |
| `trg_guard_profile_restricted_columns` | profiles | `id`, `account_status`, `email_verified_at`, `phone_verified_at` |
| `trg_guard_creator_restricted_columns` | creator_profiles | verification status, rating and review aggregates, commission and fee fields |
| `trg_guard_verification_submission_columns` | creator_verification_submissions | forces a client insert to `pending`, ties the row to the caller's own creator profile, and refuses every client update |
| `trg_verification_submission_change` | creator_verification_submissions | mirrors a filing or a decision onto `creator_profiles.verification_status` and files a notification |
| `trg_creator_verification_status_change` | creator_profiles | closes the open application when a review is written on the profile instead (and notifies on suspension) |
| `trg_guard_booking_restricted_columns` | bookings | price, fee, tax, and total snapshot columns; status moves outside the allowed set |

`is_privileged_session()` is true for `service_role`, `postgres`, `supabase_admin`, and admins (`is_admin()`). Route handlers run with the service-role key, so the guards are the second line of defence for handlers that use the anon client.

Also in the hardening migration:

- `handle_new_auth_user` accepts only the `customer` or `creator` role from signup metadata. Any other value becomes `customer`.
- Creator rows are forced to `unsubmitted`, commission 5.00, and rating 0 on insert.
- `bookings_insert_customer` was removed. Bookings are created through `/api/bookings/create`, which checks the creator, package, and availability.

## Row-level security summary

| Table | Read | Write |
| --- | --- | --- |
| `profiles` | Self, admins, and approved creators. Email and phone are hidden from anon through a column-level grant. | Self (restricted columns guarded) |
| `creator_profiles` | Approved creators (public), the owner, admins | Owner (verification fields guarded) |
| `bookings` | Customer, creator, admin | Insert through the API only; updates through the API |
| `booking_deliverables` | Participants and admins | Creator of the booking (insert/update) |
| `messages` | Conversation participants | Sender who participates |
| `payments`, `refunds`, `creator_payouts` | Participants and admins (as defined in migration 2) | Service role |

The PGlite suite (`supabase/tests/rls-policies.test.mjs`) asserts these rules. Limitation: its `auth` and `storage` schemas are stubs, so storage policy behaviour is checked as SQL predicates only.

## Storage buckets

| Bucket | Public | Limit (bucket) | Object path convention | Write policy | Read |
| --- | --- | --- | --- | --- | --- |
| `profile-avatars` | yes | 5 MB, images only | `<auth uid>/<timestamp>.<ext>` | INSERT where first folder = `auth.uid()` | public URL |
| `creator-portfolios` | yes | 50 MB | `<auth uid>/<timestamp>-<name>` | INSERT where first folder = `auth.uid()` | public URL |
| `booking-deliverables` | no | 500 MB per object | `<booking_id>/<filename>` | creator of the booking | server-issued signed URL (1 hour) |
| verification bucket | no | — | owner folder | owner INSERT | admins |

The web UI enforces a 10 MB limit on portfolio files before upload. The bucket limit is higher; the UI limit is the effective one.

## Known schema gaps

- `handle_booking_status_change` writes `changed_by = customer_id` for every status change, whatever the actor. The audit history therefore misattributes creator and admin actions. (KNOWN_ISSUES #6.)
- The booking status CHECK does not include `on_the_way` or `arrived_at_venue`. The API logs those actions in history and leaves the status unchanged.
- There is no database constraint preventing two overlapping bookings for one creator. Availability is checked in the route before insert (KNOWN_ISSUES #5).
