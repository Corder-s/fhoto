# Authorization and role access

Authorization is enforced in three layers. A UI check is never the only check.

1. **Layouts (display):** `useServerSession()` decides whether a role-specific layout shows its content or the sign-in modal. Anonymous visitors receive the page shell but no data.
2. **Route handlers (enforcement):** `authorize()` plus ownership checks, described below.
3. **Database (last line):** RLS policies and column-guard triggers. They apply to the anon client and to any direct browser write.

## Role matrix

| Capability | Anonymous | Customer | Creator | Admin | Owner |
| --- | --- | --- | --- | --- | --- |
| Browse `/explore` and approved creator listing | yes | yes | yes | yes | yes |
| Create a booking | no | own | no | no | no (owners act as customers through their own account) |
| Cancel a booking | no | own (pending, accepted, confirmed) | no | via admin actions | via admin actions |
| Accept or decline a booking | no | no | own bookings, pending only | no | no |
| Progress a booking (confirmed → in_progress → completed) | no | no | own bookings | force actions | force actions |
| Request cancellation (dispute) | no | no | own bookings (accepted, confirmed, in_progress) | no | no |
| Resolve a dispute | no | no | no | yes | yes |
| Manage own packages and portfolio | no | no | own | no | no |
| Add deliverables | no | no | own bookings | yes | yes |
| Read deliverables | no | participant (signed URL) | participant | yes | yes |
| Create a payment (sandbox) and confirm it | no | own booking | no | no | no |
| Review creators (approve/reject) | no | no | no | yes | yes |
| Suspend or reinstate an account | no | no | no | yes (not own account) | yes (not own account, and not another owner) |
| View platform stats | no | no | no | yes | yes |
| File a verification application | no | no | own | no (own application only) | no (own application only) |
| See the verification queue | no | no | no | with `manage_photographer_verification` | always |
| Promote or narrow an administrator | no | no | no | with `manage_administrators` (never owners) | always |
| Read `/api/owner/stats` | no | no | no | ✘ | ✔ |

## Administrator permissions

`user_roles.role` holds `customer`, `creator`, `admin`, or `owner`. The admin role is
further narrowed by rows in `admin_permissions`:

| Permission | Unlocks |
| --- | --- |
| `manage_photographer_verification` | `GET/PATCH /api/admin/verification`, `GET/PATCH /api/admin/creators` |
| `manage_users` | `GET/PATCH /api/admin/users` |
| `manage_bookings` | `GET/PATCH /api/admin/bookings` |
| `manage_platform_settings` | platform configuration routes (none write-capable yet) |
| `manage_administrators` | `GET/POST /api/admin/roles` — promote, set permissions, revoke |

Rules:

- An **owner** holds every permission implicitly and is the only role that may grant
  or revoke ownership. `public.is_admin()` in SQL accepts both roles, so every policy
  written for administrators covers an owner.
- An **admin with no `admin_permissions` rows** inherits the full set (see
  KNOWN_ISSUES #26). Recording an explicit list narrows them immediately.
- The check runs in `authorize({ roles, permission })` on every request, and the same
  rule is available in SQL as `public.has_admin_permission(user, permission)` for
  policies and for auditing from the console. Hiding a button in the UI is never the
  check.
- `/api/owner/stats` and `/api/admin/roles` refuse an admin who lacks the capability
  with 403 and `code: "MISSING_PERMISSION"`.

## Ownership rules

- **Customer bookings:** `bookings.customer_id` must equal the caller's id.
- **Creator bookings:** `bookings.creator_id` must equal the caller's `creator_profiles.id`, resolved from `creator_profiles.user_id = auth.uid()`.
- **Packages:** `creator_services.creator_id` must equal the caller's creator id; both the lookup and the update include this predicate.
- **Deliverables:** the creator of the booking may insert; participants may read; admins may do both.
- **Profiles:** self only for writes; reads are self, admin, or approved creator.
- **Storage:** writes only into a folder whose name is the caller's auth uid. Booking deliverables are private and read through server-issued signed URLs.
- **Body IDs:** fields such as `creatorId` in a request are used only to find the resource. The handler then verifies the resource belongs to the caller. Fields that set roles, statuses, prices, or fees are ignored or rejected.

## Booking state machine

Implemented in `apps/web/src/lib/server/policy.ts`. Handlers call the policy functions and never write a status directly.

```
pending ──accept (creator)──────────► confirmed
pending ──decline (creator)─────────► rejected
pending ──customer cancel───────────► cancelled
pending ──payment (sandbox)─────────► confirmed   (see KNOWN_ISSUES #2)
accepted  (legacy; not produced by accept)
confirmed ──update_status──► in_progress ──update_status──► completed
confirmed/in_progress ──request_cancellation (creator)──► disputed
pending/accepted/confirmed ──customer cancel──► cancelled
disputed ──resolve_cancellation (admin)──► cancelled | confirmed
(admin) force_cancel / force_confirm ──► cancelled | confirmed (the handler sets refunded for cancel; see KNOWN_ISSUES #9)
```

Terminal states (`completed`, `rejected`, `cancelled`) cannot be reopened by creators or customers. Actions `on_the_way` and `arrived_at_venue` are accepted only from `confirmed`; they are written to history, and the status stays `confirmed` because the database CHECK does not include them.

`photographerBookingAction` rejects with 409 for any transition not listed above.

## Route-level matrix (Next.js)

| Route | Customer | Creator | Admin | Anonymous |
| --- | --- | --- | --- | --- |
| `/api/bookings/create` POST | ✔ | ✘ | ✘ | 401 |
| `/api/customer/bookings` GET/PATCH | own | ✘ | ✘ | 401 |
| `/api/photographers/bookings` GET/PATCH | ✘ | own | ✘ | 401 |
| `/api/admin/users`, `/api/admin/bookings` | ✘ | ✘ | ✔ with the matching permission | 401 |
| `/api/admin/verification`, `/api/admin/creators` | ✘ | ✘ | ✔ with `manage_photographer_verification` | 401 |
| `/api/admin/roles` | ✘ | ✘ | ✔ with `manage_administrators`; ownership changes need an owner | 401 |
| `/api/owner/stats` | ✘ | ✘ | ✘ | 401 |
| `/api/photographers/verification` GET/POST/DELETE | ✘ | own | own (own application only) | 401 |
| `/api/photographers/onboarding` | any signed-in user (applicant) | own | ✘ | 401 |
| `/api/photographers/services`, `/portfolio` | ✘ | own | ✘ | 401 |
| `/api/deliverables` GET | participant | participant | ✔ | 401 |
| `/api/deliverables` POST | ✘ | own booking | ✔ | 401 |
| `/api/payments/*` | own booking | ✘ | ✘ | 401 |
| `/api/profile/me` | self | self | self | 401 |
| `/api/photographers` GET, `/api/categories` GET | public | public | public | public |

A 403 is returned when the caller is authenticated but lacks the role, the permission, or ownership. The admin and owner layouts and the self-action guards are separate from the API checks and do not replace them.

`apps/web/src/middleware.ts` adds a session check in front of every role area: with no
valid session cookie the request is redirected to `/login?next=<path>` before the page
shell is served. It is a presence check, not an authorization decision, and it never
reads a role from a cookie.

## Admin safeguards

- Admins cannot suspend or demote their own account (`/api/admin/creators`, `/api/admin/users`).
- An admin cannot change another owner's account status, and no account can revoke its
  own ownership (`/api/admin/roles`).
- `/api/admin/roles` refuses to leave the platform with zero owners, and refuses to
  strip an admin's last `manage_administrators` grant by their own hand.
- Suspension changes `profiles.account_status`. `authorize()` refuses suspended accounts on the next request.
- Force actions are recorded in `booking_status_history`.

## NestJS

Controllers use `JwtAuthGuard` and role guards at the controller level. Only `health`, `subscriptions/plans`, and `subscriptions/webhook` are public. The NestJS service keeps its own role vocabulary (`RoleType.OWNER` in `@snapshoot/shared`) and does not read the Supabase `user_roles` table, so the web app's owner role is independent of it.
