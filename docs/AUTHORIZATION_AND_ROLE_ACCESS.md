# Authorization and role access

Authorization is enforced in three layers. A UI check is never the only check.

1. **Layouts (display):** `useServerSession()` decides whether a role-specific layout shows its content or the sign-in modal. Anonymous visitors receive the page shell but no data.
2. **Route handlers (enforcement):** `authorize()` plus ownership checks, described below.
3. **Database (last line):** RLS policies and column-guard triggers. They apply to the anon client and to any direct browser write.

## Role matrix

| Capability | Anonymous | Customer | Creator | Admin |
| --- | --- | --- | --- | --- |
| Browse `/explore` and approved creator listing | yes | yes | yes | yes |
| Create a booking | no | own | no | no |
| Cancel a booking | no | own (pending, accepted, confirmed) | no | via admin actions |
| Accept or decline a booking | no | no | own bookings, pending only | no |
| Progress a booking (confirmed → in_progress → completed) | no | no | own bookings | force actions |
| Request cancellation (dispute) | no | no | own bookings (accepted, confirmed, in_progress) | no |
| Resolve a dispute | no | no | no | yes |
| Manage own packages and portfolio | no | no | own | no |
| Add deliverables | no | no | own bookings | yes |
| Read deliverables | no | participant (signed URL) | participant | yes |
| Create a payment (sandbox) and confirm it | no | own booking | no | no |
| Review creators (approve/reject) | no | no | no | yes |
| Suspend or reinstate an account | no | no | no | yes (not own account) |
| View platform stats | no | no | no | yes |

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
| `/api/admin/*` | ✘ | ✘ | ✔ | 401 |
| `/api/photographers/onboarding` | any signed-in user (applicant) | own | ✘ | 401 |
| `/api/photographers/services`, `/portfolio` | ✘ | own | ✘ | 401 |
| `/api/deliverables` GET | participant | participant | ✔ | 401 |
| `/api/deliverables` POST | ✘ | own booking | ✔ | 401 |
| `/api/payments/*` | own booking | ✘ | ✘ | 401 |
| `/api/profile/me` | self | self | self | 401 |
| `/api/photographers` GET, `/api/categories` GET | public | public | public | public |

A 403 is returned when the caller is authenticated but lacks the role or ownership. The admin layout and the admin self-action guard are separate from the API checks and do not replace them.

## Admin safeguards

- Admins cannot suspend or demote their own account (`/api/admin/creators`, `/api/admin/users`).
- Suspension changes `profiles.account_status`. `authorize()` refuses suspended accounts on the next request.
- Force actions are recorded in `booking_status_history`.

## NestJS

Controllers use `JwtAuthGuard` and role guards at the controller level. Only `health`, `subscriptions/plans`, and `subscriptions/webhook` are public. Owner and admin routes in the NestJS service are gated by role guards; no owner role exists in the database, so owner access is not reachable through the web app.
