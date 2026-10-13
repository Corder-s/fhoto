# Feature inventory

Status legend: **Live** = reads and writes real data through the backend and is covered by a test or a runtime check. **Partial** = works with stated limits. **Fixture** = renders sample data. **Not built** = absent.

| Area | Feature | Status | Where | Notes |
| --- | --- | --- | --- | --- |
| Auth | Email/password sign-up | Partial | `SnapShootAuthView`, `/api/auth/register` | Email not verified (KNOWN_ISSUES #1) |
| Auth | Email/password sign-in | Live | sign-in modal, Supabase Auth | |
| Auth | Password recovery by email | Live | `/forgot-password`, `/reset-password` | Uses Supabase recovery link |
| Auth | Phone OTP / phone recovery | Not built (web) | — | NestJS OTP is mock-only |
| Auth | Session check for layouts | Live | `/api/auth/session`, `useServerSession` | Display and navigation |
| Auth | Account suspension | Live | `authorize()` refuses suspended accounts | |
| Discovery | Explore creators | Live | `/explore`, `/api/photographers` | Approved creators only |
| Discovery | Category list | Live | `/api/categories` | |
| Discovery | Map search (Mapbox) | Partial | `/api/geocoding` | Needs `MAPBOX_ACCESS_TOKEN` |
| Discovery | `/photographers` | Redirect | → `/explore` | Keeps query string |
| Booking | Create booking | Live | `/api/bookings/create` | Server-side pricing; overlap check against accepted/confirmed/in_progress (not atomic); instant bookings confirm immediately |
| Booking | Customer list and cancel | Live | `/customer/bookings` | |
| Booking | Customer booking detail | Fixture | `/customer/bookings/[id]` | |
| Booking | Creator accept/decline/progress | Live | `/photographer/bookings` | State machine in policy.ts |
| Booking | Creator request cancellation | Live | same | Moves to disputed |
| Booking | Admin dispute resolution and force actions | Live | `/admin/bookings` | Refund is a status label only |
| Booking | On-the-way / arrived-at-venue | Partial | API | History only |
| Payments | Sandbox payment create and confirm | Live (sandbox) | `/api/payments/*` | Requires no gateway key |
| Payments | Gateway order creation (Razorpay/Cashfree/Stripe) | Not built | create-intent returns 501 | |
| Payments | Booking payment webhook | Not built | — | |
| Payments | Refunds | Not built | `refunds` table exists | |
| Payments | Customer payments screen | Fixture | `/customer/payments` | |
| Creator | Onboarding and application | Live | `/photographer/onboarding` | Admin approval required |
| Creator | Packages (create, edit, pause, delete) | Live (not yet exercised on real Supabase) | `/photographer/services` | |
| Creator | Portfolio upload and delete | Live (not yet exercised on real Supabase) | `/photographer/portfolio` | 10 MB UI limit |
| Creator | Availability calendar | Fixture | `/photographer/availability` | Server conflict check still applies at booking |
| Creator | Deliverables upload from UI | Not built | — | API accepts metadata; no UI calls it |
| Creator | Deliverables list for participants | Live (API) | `/api/deliverables` GET | No customer or creator screen lists them yet |
| Creator | Galleries | Fixture / local | `/photographer/galleries` | Browser-local only |
| Creator | Payouts | Fixture | `/photographer/payouts` | No payout execution |
| Creator | Reviews | Fixture | `/photographer/reviews` | |
| Creator | Clients CRM | Local only | `/photographer/clients` | localStorage, per device |
| Creator | Subscription plans | Partial | `/photographer/subscription` → NestJS | Real checkout not verified |
| Creator | Analytics | Fixture | `/photographer/analytics` | Monthly ledger and category arrays are hardcoded; demo banner shown |
| Customer | Gallery | Fixture | `/customer/gallery` | |
| Customer | Notifications | Fixture | `/customer/notifications` | `notifications` table exists |
| Customer | Reviews | Fixture | `/customer/reviews` | |
| Customer | Messages | Partial | `/customer/messages` | RLS restricts to participants |
| Customer | Settings and avatar | Live | `/customer/settings` | Avatar is public-read storage |
| Admin | Dashboard stats | Live | `/admin/dashboard` | |
| Admin | Creator review queue (approve/reject/suspend/reinstate) | Live | `/admin/dashboard`, `/api/admin/creators` | |
| Admin | User list and suspend/reactivate | Live | `/admin/dashboard`, `/api/admin/users` | |
| Admin | Booking management | Live | `/admin/bookings` | Silent failure on non-OK responses (KNOWN_ISSUES #13) |
| AI | Assistant chat | Partial | `/api/v1/ai/chat` | Needs `GEMINI_API_KEY`; not connected to bookings |
| Owner | Owner dashboard | Not built | `/owner/*` closed | No owner role |
| Platform | Platform fee settings | Live (read) | `platform_fee_settings` | Seeded at 10% |
| Platform | NestJS API | Partial | `apps/api` | Auth mock-only; data paths need Prisma client |
