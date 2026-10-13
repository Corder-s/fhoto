# Admin workflows (as implemented)

Admin = account with the `admin` role in `user_roles`. Admins are granted in the database; there is no self-service path. Pages: `apps/web/src/app/(admin)/admin/`.

### Access

- The admin layout checks `/api/auth/session`. Non-admins see no admin content and the sign-in modal.
- Every admin API route calls `authorize({ roles: ['admin'] })`. A non-admin receives 403 even when they call the API directly.
- Admins cannot suspend or demote their own account.

## Dashboard (`/admin/dashboard`)

- Stats come from `GET /api/admin/stats`: counts of creators, pending applications, bookings, and payments from live tables.
- Quick action "Verify Photographer" links to `#pending-photographers` on the same page. That anchor now wraps the full verification queue (`components/admin/VerificationQueue.tsx`), which reads `/api/admin/verification`.
- The dashboard does not show fixture data.

## Creator review (on `/admin/dashboard`, `/api/admin/creators`)

The dashboard loads the application queue from `GET /api/admin/verification` (one row per
submitted application), and `GET /api/admin/creators?status=pending` still lists the
profiles behind them. There is no separate creators page.

### Reviewing an application (`/api/admin/verification`)

1. `GET /api/admin/verification?status=pending|needs_info|approved|rejected|all` returns
   each application with its details, the masked ID, document metadata (never a storage
   path), the profile's current `verification_status`, and the applicant's account state.
2. `PATCH` with `{ submissionId, action, reason?, notes? }`:
   - `approve` → `status='approved'`; the trigger sets the profile to `approved`, which
     is what puts the photographer into `/explore`.
   - `reject` → `status='rejected'` and requires a `reason`; the profile becomes
     `rejected` and the applicant may file again.
   - `needs_info` → the application stays out of the published set (profile remains
     `pending`) and the reason tells the photographer what to re-upload.
3. The route refuses a reviewer's own application (403) and a second decision on an
   already-reviewed application (409), so two open tabs cannot overwrite each other
   silently.
4. `GET /api/admin/verification/document?submissionId=&index=` answers a signed URL that
   is valid for 120 seconds, after checking that the object lives in that applicant's own
   storage folder. Documents are private; the queue payload never carries a URL.
5. `revalidatePath` runs for `/explore`, `/photographers`, and `/photographers/[id]` after
   a decision, so an approval is visible on the next page view without a redeploy.

1. `GET /api/admin/creators` lists creators with their verification status and linked profile.
2. `PATCH` with `{ creatorProfileId, action }`:
   - `approve` — sets the creator's verification to approved. The creator appears on `/explore` and can receive bookings.
   - `reject` — sets rejected with a reason. The creator stays hidden.
   - `suspend` — sets the linked profile `account_status` to `suspended`. The creator's sessions are refused by `authorize()` on their next request.
   - `reinstate` — sets `account_status` back to `active`.
3. Each action is refused for the admin's own account.
4. `suspend_profile` and `reinstate_profile` write `creator_profiles.verification_status`
   (`suspended` / `approved`) rather than the login state, so a profile can leave the
   directory without locking the photographer out of their account. A profile moving to
   `approved`, `rejected`, or `suspended` also closes the open application and files a
   notification — the two tables are kept in step by database triggers, so no code path
   can update one and forget the other.

## Users (on `/admin/dashboard`, `/api/admin/users`)

The dashboard's user section calls the users endpoints. There is no separate users page.

- `GET` lists profiles with roles, effective permissions, and account status. `filter=administrators` limits the list to admins and owners.
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

The owner role exists (`user_roles.role = 'owner'`) and `/owner/dashboard` is the place
where administration itself is administered.

### Access

- `apps/web/src/app/(owner)/owner/layout.tsx` renders the area only when the **server**
  session lists `owner`. `GET /api/owner/stats` calls `authorize({ roles: ['owner'] })`,
  so an admin — even one holding every permission — gets 403 there.
- `/api/admin/roles` requires the `manage_administrators` permission, which an owner
  always holds. Granting or revoking **ownership** additionally requires the caller to
  be an owner.

### Promote an existing account

1. The owner searches a registered e-mail (`GET /api/admin/roles?filter=all&search=`).
   The list is read from `profiles`, so it can only ever show accounts that already
   signed up.
2. "Make admin" posts `{ action: 'promote', userId, permissions? }`. The route inserts a
   `user_roles` row with `role = 'admin'` for that same user id. **No auth user is
   created** — there is one login per person, and the person's existing customer or
   photographer access is untouched. An unknown e-mail is a 404 with an explanation, not
   a signup.
3. `permissions` is optional. Omitted, the new admin inherits the full set; supplied, it
   is stored as `admin_permissions` rows and narrows them immediately.

### Change or revoke permissions

- `{ action: 'setPermissions', userId, permissions: [...] }` replaces the row set for
  that admin. An empty list deletes the rows, which returns them to the inherited full
  set (KNOWN_ISSUES #26).
- Owners cannot be narrowed (`403`), and the last owner cannot be removed
  (`409`), so the platform cannot end up with nobody able to administer access.
- An admin cannot strip their own `manage_administrators` grant while they hold it, and
  cannot revoke their own admin role.
- `{ action: 'revoke', userId }` removes the `admin` row and the permission rows. The
  account keeps any `creator` or `customer` role it had.
- `suspend`/`reinstate` on another **owner**'s account is refused for non-owners in
  `/api/admin/users`.

### What the owner dashboard shows

`/api/owner/stats` computes every figure from the tables: accounts, administrators and
owners, open verification applications, creator profiles per verification state, bookings
per status, gross booked value and platform fees from `bookings`, paid revenue from
`payments`, and photographer supply per city. There are no fixture numbers and no
subscription revenue, because the schema has no subscription table (KNOWN_ISSUES #27).

## Fixture-backed admin screens

None of the admin screens listed in this workflow is fixture-backed.
