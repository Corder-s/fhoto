# Admin workflows (as implemented)

Admin = account with the `admin` role in `user_roles`. Admins are granted in the database; there is no self-service path. Pages: `apps/web/src/app/(admin)/admin/`.

## Access

- The admin layout checks `/api/auth/session`. Non-admins see no admin content and the sign-in modal.
- Every admin API route calls `authorize({ roles: ['admin'] })`. A non-admin receives 403 even when they call the API directly.
- Admins cannot suspend or demote their own account.

## Dashboard (`/admin/dashboard`)

- Stats come from `GET /api/admin/stats`: counts of creators, pending applications, bookings, and payments from live tables.
- Quick action "Verify Photographer" links to `#pending-photographers` on the same page. The anchor exists (`id="pending-photographers"` in `AdminDashboardView`).
- The dashboard does not show fixture data.

## Creator review (on `/admin/dashboard`, `/api/admin/creators`)

The dashboard loads the pending queue (`GET /api/admin/creators?status=pending`). There is no separate creators page.

1. `GET /api/admin/creators` lists creators with their verification status and linked profile.
2. `PATCH` with `{ creatorProfileId, action }`:
   - `approve` — sets the creator's verification to approved. The creator appears on `/explore` and can receive bookings.
   - `reject` — sets rejected with a reason. The creator stays hidden.
   - `suspend` — sets the linked profile `account_status` to `suspended`. The creator's sessions are refused by `authorize()` on their next request.
   - `reinstate` — sets `account_status` back to `active`.
3. Each action is refused for the admin's own account.

## Users (on `/admin/dashboard`, `/api/admin/users`)

The dashboard's user section calls the users endpoints. There is no separate users page.

- `GET` lists profiles with roles and account status.
- `PATCH` with `{ userId, accountStatus: "active" | "suspended" }` changes the account status. Own account is refused.

## Bookings and disputes (`/admin/bookings`, `/api/admin/bookings`)

- `GET` lists all bookings.
- `PATCH` actions:
  - `resolve_cancellation` with `decision: "approve" | "reject"` and `adminNotes`. Only for bookings in `disputed`. Approve cancels the booking and sets payment to `refunded`. Reject returns the booking to its prior commitment.
  - `force_cancel` — cancels the booking and sets payment to `refunded` (no refund record; KNOWN_ISSUES #9).
  - `force_confirm` — confirms the booking.
- Each action writes a `booking_status_history` row with the admin's note. The history `changed_by` column is currently set to the customer (KNOWN_ISSUES #6).
- The admin booking page ignores non-OK responses silently (KNOWN_ISSUES #13). Check the history and the list after acting.

## Owner

`/owner/*` is closed. The database has no owner role, so no account can open it.

## Fixture-backed admin screens

None of the admin screens listed in this workflow is fixture-backed.
