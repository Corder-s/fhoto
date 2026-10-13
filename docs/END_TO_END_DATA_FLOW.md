# End-to-end data flow: one booking

This traces a single booking through every table and route, using the state machine in AUTHORIZATION_AND_ROLE_ACCESS.md.

## 0. Preconditions

- A customer account (`user_roles.role = customer`) and an approved creator (`creator_profiles.verification_status = approved`, `is_available = true`) with at least one active package in `creator_services`.

## 1. Discovery

| Step | Route / table | Result |
| --- | --- | --- |
| Load `/explore` | `GET /api/photographers` → `creator_profiles` + `creator_services` + `profiles` | Approved creators only; contact fields are not in the public response |

## 2. Booking request

| Step | Route / table | Result |
| --- | --- | --- |
| Submit booking | `POST /api/bookings/create` | `authorize()` → customer. Creator checked for approval and availability. Package checked against creator. |
| Price | server-side in the handler | `base_price` from `creator_services`; platform fee from `platform_fee_settings` (default 10%); GST 18% on (price + fee); total = price + fee + GST − discount |
| Overlap check | `bookings` | Rejects if an `accepted`, `confirmed`, or `in_progress` booking for the creator overlaps the window. Pending requests do not block. Application check, not atomic (KNOWN_ISSUES #5). |
| Insert | `bookings` | `booking_status = pending` (scheduled) or `confirmed` (instant); `payment_status = unpaid`; price snapshot columns |
| History | `booking_status_history` | Initial entry |

## 3. Creator response

| Step | Route | Transition |
| --- | --- | --- |
| Accept | `PATCH /api/photographers/bookings` `{ action: accept }` | pending → confirmed (history: "Photographer accepted and confirmed booking assignment") |
| Decline | same, `{ action: decline }` | pending → rejected |

Ownership: the handler resolves the caller's creator id and compares it with `bookings.creator_id`.

## 4. Payment (sandbox)

| Step | Route / table | Result |
| --- | --- | --- |
| Create intent | `POST /api/payments/create-intent` → `payments` | `provider = dev_sandbox`, `payment_status = pending`, unique `idempotency_key`. Returns 501 if a gateway key is set. |
| Confirm | `POST /api/payments/confirm-sandbox` → `payments`, `bookings` | `payments.payment_status = paid`, `paid_at`. `bookings.payment_status = paid`; `booking_status` becomes `confirmed` if it was `pending`. Returns 403 if a gateway key is set. |

## 5. Service delivery

| Step | Route | Transition |
| --- | --- | --- |
| Start | `PATCH /api/photographers/bookings` `{ action: update_status, newStatus: in_progress }` | confirmed → in_progress |
| Complete | same with `newStatus: completed` | confirmed/in_progress → completed |
| Deliverables | `POST /api/deliverables` (creator or admin) | `booking_deliverables` row, `delivery_status = ready_for_review`, Drive link or storage path |
| Read | `GET /api/deliverables?bookingId=` (participant) | Storage objects get a 1-hour signed URL; links are returned as stored |

Deliverable uploads to storage are not wired in the UI (FEATURE_INVENTORY.md).

## 6. Cancellation and dispute

| Path | Route | Result |
| --- | --- | --- |
| Customer cancels pending/accepted/confirmed | `PATCH /api/customer/bookings` `{ action: cancel }` | → cancelled, reason in history |
| Creator requests cancellation | `PATCH /api/photographers/bookings` `{ action: request_cancellation, reason }` | accepted/confirmed/in_progress → disputed |
| Admin resolves | `PATCH /api/admin/bookings` `{ action: resolve_cancellation, decision }` | disputed → cancelled (approve, payment refunded) or back to confirmed (reject) |

## 7. Where the data is visible

| Party | Surface | Source |
| --- | --- | --- |
| Customer | `/customer/bookings` list | `GET /api/customer/bookings` |
| Creator | `/photographer/bookings` | `GET /api/photographers/bookings` |
| Admin | `/admin/bookings` | `GET /api/admin/bookings` |
| Admin stats | `/admin/dashboard` | `GET /api/admin/stats` (live aggregates) |

## 8. Known breaks in this flow

- Paying a pending booking confirms it without the creator's acceptance (KNOWN_ISSUES #2).
- Refund on cancellation is a status and payment-label change only (KNOWN_ISSUES #9).
- `on_the_way` and `arrived_at_venue` are not persisted as statuses (KNOWN_ISSUES #7).
- The customer booking detail screen is fixture-backed (KNOWN_ISSUES #8).
