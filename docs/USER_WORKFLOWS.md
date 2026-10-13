# Customer workflows (as implemented)

Customer = signed-in account with the `customer` role. Pages live under `apps/web/src/app/(customer)/customer/`.

## 1. Sign up and sign in

1. Open the sign-in modal from the header or from any protected page. The modal has login and register tabs.
2. Register: name, email, password, phone. The form first calls `POST /api/auth/register`; if that fails it falls back to Supabase sign-up. The account is created as a customer.
3. Sign in with email and password. After sign-in the header shows the account. Protected pages reload the role from `/api/auth/session`.
4. Forgot password: `/forgot-password` sends a recovery email. The link opens `/reset-password`, which sets the new password.

Known: sign-up does not verify email ownership (KNOWN_ISSUES #1). Phone OTP sign-in is not available.

## 2. Discover creators

1. `/explore` lists approved creators from `GET /api/photographers`. Filters are applied to the live list.
2. Creators with no packages or not yet approved are not shown.
3. Opening a creator goes to `/photographers/[id]`, which reads the creator profile and packages.
4. `/photographers` redirects to `/explore` and keeps the query string.

## 3. Book a creator

1. From a creator page, choose a package and open the booking modal.
2. Enter event title, date, location, and notes. The form posts to `POST /api/bookings/create`.
3. The server checks that the creator is approved and available, that the package belongs to that creator, and that the time window does not overlap an `accepted`, `confirmed`, or `in_progress` booking for the creator. It then stores the price snapshot: package price, platform fee, GST (18%), and total.
4. A scheduled booking starts as `pending` and waits for the creator. An instant booking starts as `confirmed`. Two pending requests can overlap; the conflict is detected when the creator accepts (KNOWN_ISSUES #5).

The customer never sends a price. A booking request that overlaps another commitment is refused with a message.

## 4. Track bookings

- `/customer/bookings` lists the customer's bookings from `GET /api/customer/bookings`.
- Booking detail `/customer/bookings/[id]` is **fixture-backed** (`INITIAL_CUSTOMER_BOOKINGS`). It does not show live status. Use the list for live status (KNOWN_ISSUES #8).

## 5. Cancel a booking

- Allowed from `pending`, `accepted`, or `confirmed`. Sent as `PATCH /api/customer/bookings` with `{ bookingId, action: "cancel", reason? }`.
- The reason is stored in history as "Customer cancelled booking: …".
- Once a booking is `in_progress`, `completed`, `cancelled`, `rejected`, or `disputed`, the customer cannot cancel it through this route. Disputes are resolved by an admin (ADMIN_WORKFLOWS.md).
- A refund is not issued automatically. The cancellation does not create a refund record (KNOWN_ISSUES #9).

## 6. Pay (sandbox only)

1. From a booking the customer can start payment. `POST /api/payments/create-intent` creates a `dev_sandbox` payment with an idempotency key. Repeating the request with the same key returns the same payment.
2. `POST /api/payments/confirm-sandbox` marks the payment `paid` and the booking's `payment_status` `paid`. A `pending` booking becomes `confirmed` (see KNOWN_ISSUES #2).
3. If `PAYMENT_PROVIDER_SECRET_KEY` is set, both routes refuse (501 for create, 403 for confirm). Real card or UPI payment is not implemented.

## 7. Deliverables

- Deliverable rows for a booking are returned by `GET /api/deliverables?bookingId=…` for the customer on that booking. Files stored in Supabase get a one-hour signed URL. External links are returned as-is.
- No customer screen currently lists deliverables live. The gallery screen `/customer/gallery` is **fixture-backed** (KNOWN_ISSUES #8).

## 8. Messages and settings

- `/customer/messages`: conversation UI for booking participants (RLS restricts inserts to participants).
- `/customer/settings`: profile edits write to `profiles` through the browser client. The avatar upload stores the image in `profile-avatars/<uid>/…` and saves the public URL to the profile. The account status cannot be changed from this page.

## 9. Fixture-backed customer screens

`/customer/notifications`, `/customer/payments`, `/customer/reviews`, `/customer/gallery`, and `/customer/bookings/[id]` display sample data. They are not production features until wired (KNOWN_ISSUES #8).
