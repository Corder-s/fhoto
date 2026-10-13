# Photographer (creator) workflows (as implemented)

Photographer = account with the `creator` role. Pages live under `apps/web/src/app/(photographer)/photographer/`. In the database the same person is a `creator_profiles` row.

## 1. Apply and onboard

1. Sign up as a creator, or switch an account via onboarding (any signed-in user can open `/photographer/onboarding`).
2. `GET /api/photographers/onboarding` returns categories and the current profile. `POST` saves the business profile (name, city, bio, categories) and creates the creator row with `verification_status = pending` after submission.
3. Until an admin approves the application, the creator does not appear on `/explore` and cannot receive bookings (`/api/bookings/create` returns 404 "not available for bookings").

### 1b. Verification (KYC)

`/photographer/verification` is the lifecycle screen and it is live: every state on it is
read from the database, and the submit button writes one row.

1. `GET /api/photographers/verification` returns the creator profile's
   `verification_status`, the applicant's submissions, and whether filing is currently
   allowed. Nothing is simulated locally any more — the page used to have a state
   dropdown that faked "Under Active Review".
2. Documents are uploaded by the browser straight into the private
   `creator-verification/<own uid>/…` folder (RLS restricts the write to the applicant's
   own folder and the read to the applicant plus administrators), or an https link to a
   shared file is attached instead.
3. `POST /api/photographers/verification` validates the payload and inserts a submission
   with `status = 'pending'`. The ID number is reduced to its last four characters before
   it is stored; the raw value never reaches the database. A missing government-ID
   document, an over-long file list, a bad GSTIN, or a traversal-shaped storage path is
   refused with 400.
4. The insert trigger sets `creator_profiles.verification_status = 'pending'`, so the
   admin queue sees the application without the API touching two tables. Filing while a
   decision is already recorded, or while approved, is a 409.
5. An administrator with `manage_photographer_verification` reviews it
   (`/api/admin/verification`). The decision updates the submission, the update trigger
   publishes or unpublishes the profile, and a `notifications` row is filed for the
   photographer — which is why the photographer's dashboard and the public directory
   change without any client-side involvement.
6. `DELETE /api/photographers/verification?submissionId=` withdraws an application that is
   still pending and returns the profile to `unsubmitted`; a reviewed application is
   immutable to its author.
7. `rejected` and `suspended` both hide the public profile. A rejection carries the
   reviewer's reason on the page, and re-applying files a new application.
8. After approval the profile appears in `/explore` and `/api/photographers`, both of
   which filter on `verification_status = 'approved'` server-side.

## 2. Packages (services)

- `/photographer/services` (SellerDashboardView) manages packages through `/api/photographers/services`.
- **Create:** POST with title, base price, duration, delivery time, and optional description.
- **Edit:** POST with `id`. The row is loaded, ownership is checked, and only the fields sent are changed. Omitted fields keep stored values.
- **Pause or resume:** POST with `{ id, isActive }` only. This toggles availability without resending the rest of the package.
- **Delete:** DELETE with the package id. Only the owner's rows match.

Not yet exercised against a real Supabase project (KNOWN_ISSUES #16).

## 3. Portfolio

- `/photographer/portfolio` uploads an image from the browser to `creator-portfolios/<uid>/<timestamp>-<name>` using the signed-in browser session. The file must be 10 MB or less.
- After the upload succeeds, the page POSTs the public https URL to `/api/photographers/portfolio`. The item is saved only after both steps succeed.
- Items can be deleted with DELETE on the same route.

## 4. Bookings

`/photographer/bookings` loads `GET /api/photographers/bookings` and acts with `PATCH`:

| Action | From status | To status | Notes |
| --- | --- | --- | --- |
| accept | pending | confirmed | Assigns the booking to the creator |
| decline | pending | rejected | |
| update_status → in_progress | confirmed | in_progress | Shoot has started |
| update_status → completed | confirmed or in_progress | completed | Terminal |
| on_the_way, arrived_at_venue | confirmed | confirmed (history only) | Logged, not stored as a status (KNOWN_ISSUES #7) |
| request_cancellation | accepted, confirmed, in_progress | disputed | Needs a reason; an admin resolves it |

Other combinations return 409. Terminal bookings cannot be reopened.

## 5. Deliverables

`POST /api/deliverables` records a deliverable on one of the creator's bookings:

- `storageProvider: supabase_storage` with a path `<booking_id>/<filename>` where the file was placed in the `booking-deliverables` bucket by a trusted process.
- `storageProvider: google_drive` with a Drive file or folder link matching the accepted pattern (`drive.google.com` or `docs.google.com`).
- Other external video links.

Status is set to `ready_for_review`. **No screen calls this route yet**, and the route does not upload files. Deliverable upload from the photographer UI is a missing feature (FEATURE_INVENTORY.md).

## 5a. Analytics

`/photographer/analytics` shows hardcoded monthly and category figures and a demo banner. It is not connected to booking data (KNOWN_ISSUES #8).

## 6. Availability and calendar

`/photographer/availability` is **fixture-backed** (`INITIAL_AVAILABILITY`). Booking conflicts are checked on the server when a booking is created, so the calendar does not block dates in the database yet.

## 7. Payouts, reviews, galleries

- `/photographer/payouts`: fixture-backed (`INITIAL_PAYOUTS`). No payout execution.
- `/photographer/reviews`: fixture-backed (`INITIAL_REVIEWS`).
- `/photographer/galleries`: uses a browser-local gallery model (`INITIAL_PORTFOLIO`). Deliverable upload is not connected to it.
- `/photographer/clients` (CRM): stored in localStorage only through `clientService.ts`. It is per device and not visible to the platform.

## 8. Subscription plans (NestJS)

`/photographer/subscription` calls the NestJS subscription API. Plans are public (`GET /api/v1/subscriptions/plans`). Checkout uses Razorpay signatures; sandbox signature shortcuts are accepted only in non-production mock mode. The real gateway checkout has not been verified end to end (KNOWN_ISSUES #4).

## 9. Settings

`/photographer/settings` writes the profile through the browser client under RLS. It does not write `account_status`.
