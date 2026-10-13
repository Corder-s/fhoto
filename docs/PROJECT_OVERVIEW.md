# Project overview

## What it is

Instantshoot (also branded SnapShoot in parts of the UI) is a marketplace where customers book creative professionals (photographers, videographers, and related creators) and pay through the platform. Creators are called **creators** in the database and **photographers** in the UI. This document uses both terms.

The primary product is a **Next.js 14 App Router** application backed by **Supabase** (Postgres, Auth, Storage). A secondary **NestJS** service in `apps/api` holds older and partly-mocked endpoints, including SaaS subscription billing.

## Roles

| Role | Stored as | Entry point | What they can do |
| --- | --- | --- | --- |
| Customer | `user_roles.role = 'customer'` | `/customer/*` | Search creators, book a package, see booking status, cancel a pending or accepted booking, pay (sandbox only), view deliverables |
| Photographer (creator) | `user_roles.role = 'creator'` | `/photographer/*` | Onboard, manage packages (services), portfolio, accept or decline bookings, progress bookings through their lifecycle, add deliverables, request cancellation |
| Admin | `user_roles.role = 'admin'` | `/admin/*` | Review creator applications, approve or reject, suspend or reinstate accounts, resolve cancellation disputes, force a booking state, view platform stats |
| Owner | (no database role) | `/owner/*` | Layout is closed. The database has no owner role, so no account can enter. |

## Status of the product

Not every screen is backed by live data yet. The authoritative list is [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md). In summary:

- **Live:** sign-up and sign-in, the explore page (live creators only), creator onboarding, packages, portfolio images, booking creation, booking management for all three roles, admin creator review, admin user suspension, admin stats, sandbox payment confirmation, deliverable metadata.
- **Partial:** payments (sandbox only; real gateway order creation returns 501), deliverables (the UI cannot upload files; metadata and external links are accepted), subscriptions (NestJS only).
- **Fixture:** ten screens still render sample data or browser-local state instead of live data. They are listed in KNOWN_ISSUES.md #8.

## Money flow in brief

Prices are calculated on the server. Each booking stores the package price, a platform fee (10% by default, overridable from `platform_fee_settings`), GST at 18% on the subtotal plus fee, and the total. Clients never send prices. See [END_TO_END_DATA_FLOW.md](END_TO_END_DATA_FLOW.md).

## Out of scope for this codebase today

- Real card or UPI processing (no gateway order creation or payment webhook for bookings)
- Automated payouts (the `creator_payouts` table exists and the payouts screen is fixture-backed)
- Email and SMS delivery
- Native mobile apps
