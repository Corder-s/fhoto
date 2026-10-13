# API documentation

Base URL for the web API: `https://<web-host>/api/...` (Next.js route handlers, `apps/web/src/app/api`).
NestJS API: `/api/v1/...` on the NestJS service, reached through the `/api/v1/*` rewrite in production.

Conventions:

- Request and response bodies are JSON.
- Errors: `{ "error": "<message>" }` with an HTTP status. Internal errors are logged server-side and returned as a generic message.
- "Auth" means the route calls `authorize()` and returns **401** when there is no valid session, **403** when the role or ownership check fails, and **403** with "account suspended" for inactive accounts.
- IDs in bodies and query strings are never trusted for ownership. The handler resolves the caller's own creator or customer row and checks against it.

## Next.js route handlers

| Route | Methods | Auth | Purpose |
| --- | --- | --- | --- |
| `/api/auth/session` | GET | none (reports the caller) | Returns `{ authenticated, user: { id, email, name, role, roles, accountStatus }, configured }`. `configured:false` when Supabase env is missing. |
| `/api/auth/register` | POST | none | Creates a Supabase auth user and profile. Role is `customer` or `creator` only. Email is confirmed automatically (KNOWN_ISSUES #1). |
| `/api/profile/me` | GET, PATCH | Auth | Own profile. PATCH accepts only `fullName`, `phone`, and `avatarUrl`; `account_status` and verification fields are not writable here. |
| `/api/categories` | GET | none | Service category list |
| `/api/photographers` | GET | none | Public creator listing for `/explore`. Returns approved creators only. Uses the service-role client when configured, otherwise the RLS-protected browser client. |
| `/api/geocoding` | GET | Auth | Server-side proxy to Mapbox geocoding. Token never reaches the browser. |
| `/api/bookings/create` | POST | Auth (customer) | Creates a booking. Body: `creatorId`, `eventTitle`, `eventDate`, `eventLocation`, `customerNotes`, `bookingType`, optional `serviceId`. Price, fee, GST, and total are computed on the server. Rejects overlapping commitments for the same creator. |
| `/api/customer/bookings` | GET | Auth (customer) | Lists the caller's bookings |
| `/api/customer/bookings` | PATCH | Auth (customer) | Body: `{ bookingId, action: "cancel", reason? }`. Allowed from `pending`, `accepted`, or `confirmed`. |
| `/api/photographers/bookings` | GET | Auth (creator) | Lists bookings for the caller's creator profile |
| `/api/photographers/bookings` | PATCH | Auth (creator) | Body: `{ bookingId, action, ... }`. Actions: `accept`/`decline` (from `pending` only), `update_status` with `newStatus` (see state machine in AUTHORIZATION_AND_ROLE_ACCESS.md), `request_cancellation` with `reason` (moves to `disputed`). |
| `/api/photographers/onboarding` | GET, POST | Auth (any signed-in user; submitting makes the account a creator applicant) | Creator application: business profile, categories, initial packages. Upserts on `user_roles` and `creator_profiles`. Sets status to pending review. |
| `/api/photographers/services` | GET, POST, DELETE | Auth (creator) | GET lists own packages. POST creates (no `id`) or updates (with `id`, owner-checked). Partial updates merge into the stored row, so omitted fields keep their values. Body `{ id, isActive }` alone toggles availability. DELETE removes an owned package. |
| `/api/photographers/portfolio` | GET, POST, DELETE | Auth (creator) | Portfolio rows. POST saves a row after the browser has uploaded the file to `creator-portfolios/<uid>/...` and passes the public https URL. Files over 10 MB are rejected in the UI. |
| `/api/deliverables` | GET | Auth (participant) | Lists deliverables for `?bookingId=`. Supabase-stored files get a 1-hour signed URL. |
| `/api/deliverables` | POST | Auth (creator of the booking or admin) | Adds a deliverable row with `delivery_status = ready_for_review`. For `google_drive` the URL must match a Drive file or folder pattern. For `supabase_storage` the storage path must be `<booking_id>/<filename>`. Note: no UI calls this route yet. |
| `/api/payments/create-intent` | POST | Auth (customer) | Creates a pending payment for a booking with an idempotency key. Sandbox only: returns **501** when `PAYMENT_PROVIDER_SECRET_KEY` is set, because gateway order creation is not implemented. |
| `/api/payments/confirm-sandbox` | POST | Auth (customer) | Marks a `dev_sandbox` payment paid and sets `payment_status = paid`. A `pending` booking becomes `confirmed` (KNOWN_ISSUES #2). Returns **403** when a gateway key is configured. |
| `/api/admin/stats` | GET | Auth (admin) | Platform counts and revenue totals from live tables |
| `/api/admin/creators` | GET | Auth (admin) | Creator review queue |
| `/api/admin/creators` | PATCH | Auth (admin) | Body: `{ creatorProfileId, action: approve | reject | suspend | reinstate, reason? }`. Admins cannot suspend their own account. Suspend and reinstate set the linked profile's `account_status`. |
| `/api/admin/users` | GET | Auth (admin) | Profile list with roles |
| `/api/admin/users` | PATCH | Auth (admin) | Body: `{ userId, accountStatus: active | suspended }`. Own account refused. |
| `/api/admin/bookings` | GET | Auth (admin) | All bookings |
| `/api/admin/bookings` | PATCH | Auth (admin) | Actions: `resolve_cancellation` (`decision`, `adminNotes`), `force_cancel`, `force_confirm`. Writes history rows. |
| `/api/v1/ai/chat` | POST | Auth | AI assistant. Returns a configuration message with code `GEMINI_API_KEY_MISSING` when no key is set. Responses are not used for any booking action. |

Removed in this pass: the `/explore` sample-creator merge and the Gemini key fallback.

## NestJS controllers (`apps/api`)

These controllers are compiled and wired in `app.module.ts`. Their data paths depend on a generated Prisma client, which could not be generated in the verification sandbox. Auth-level behaviour was verified at runtime; data behaviour was not (see TEST_RESULTS.md).

| Controller | Routes | Guard | Notes |
| --- | --- | --- | --- |
| `health` | `GET /health` | `@Public` | Liveness |
| `auth` | `POST /auth/request-otp`, `POST /auth/verify-otp`, `POST /auth/login`, `POST /auth/forgot-password` (501), `GET /auth/me` | mock-only; `me` needs JWT | Login family returns **503** unless `ENABLE_MOCK_AUTH=true` and not production. Forgot-password returns 501 and points to the web app. |
| `subscriptions` | `GET /subscriptions/plans` (`@Public`), `GET /subscriptions/current`, `POST /subscriptions/checkout-session`, `POST /subscriptions/verify-checkout`, `POST /subscriptions/toggle-cancel`, `GET /subscriptions/invoices`, `POST /subscriptions/webhook` (`@Public`, HMAC-verified) | JWT (except the two `@Public` routes) | Webhook returns 401 for an invalid signature and 503 in production when `RAZORPAY_WEBHOOK_SECRET` is unset. |
| `bookings` | `GET /bookings/my-bookings`, `GET /bookings/:id`, `POST /bookings/:id/verify-otp`, `POST /bookings/:id/cancel` | JWT + roles | |
| `photographers` | `GET /photographers`, `GET /photographers/:id`, `GET/PUT /photographer/profile`, `GET/POST /photographer/packages`, `PUT/DELETE /photographer/packages/:id`, `GET/PUT /photographer/availability` | JWT + roles | Public detail routes return only public fields |
| `galleries` | `GET/POST /galleries/bookings/:bookingId` | JWT | |
| `clients` | `GET/POST /photographer/clients`, `GET/PUT/DELETE /photographer/clients/:id` | JWT (creator) | Backed by Prisma |
| `admin` | `GET /admin/kyc-queue`, `POST /admin/kyc/:id/review`, `GET /owner/analytics` | JWT + admin/owner roles | |
| `ai` | `POST /ai/chat` | JWT | The Next.js route of the same path is served first |

The NestJS app also registers a global `RateLimitGuard`.

## Webhooks

- **Subscriptions** (`POST /api/v1/subscriptions/webhook`): the body is verified against `x-razorpay-signature` using HMAC-SHA256 and `RAZORPAY_WEBHOOK_SECRET`. There is no test-signature shortcut outside non-production mock mode.
- **Booking payments**: no webhook route exists. Sandbox confirmation is the only payment-state transition.
