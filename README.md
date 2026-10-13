# INSTANTSHOOT — Production-Ready Creative Services Marketplace

> **Instantshoot** is an on-demand marketplace connecting customers with verified professional photographers, cinematographers, drone pilots, and short-form video creators across India. Built with Next.js 14 App Router, Supabase PostgreSQL, TypeScript, and Tailwind CSS.

---

## 📸 Core Capabilities

### 1. Visual Discovery & Radar Exploration (`/explore`)
- **Aesthetic Vibe Search & Smart Prompting:** Discover creators by AI mood presets (Golden Hour Romance, 4K Cinema Reels, Moody Editorial, Royal Heritage).
- **Multi-Parameter Database Filtering:** Live filtering by Indian metro/hub, creative genre, pricing tiers (₹1,500 – ₹15,000+), minimum ratings, same-day instant availability, and gear tier (Flagship FX3 / A7IV / Medium Format).
- **Side-by-Side Creator Comparison:** Compare up to 3 creative packages, deliverables, turnarounds, and rates in a unified modal.
- **Studio Radar Map:** Interactive coordinates map showing creators nearby.

### 2. Transactional Booking & Escrow Platform
- **Server-Authoritative Pricing:** Service prices, platform fees (10%), and 18% GST are calculated and snapshotted on the server — never trusting client inputs.
- **Atomic Availability Checks:** Prevents double-bookings or concurrent time conflicts for creators.
- **Auditable Status Machine:** `pending` → `accepted` → `confirmed` → `in_progress` → `completed`, logged permanently in `booking_status_history`.
- **Payment & Escrow System:** Full support for Razorpay/Cashfree order initiation with unique idempotency keys, webhook signature verification, and an auditable Development Sandbox Mode when gateway keys are unconfigured.

### 3. Media Delivery Engine (Supabase Storage + Google Drive)
- **Hybrid Deliverables:** Creators upload high-res JPEG/RAW ZIP archives directly to private Supabase Storage buckets or submit verified Google Drive shared links (`drive.google.com/drive/folders/...`) and cinema stream links (Vimeo/YouTube).
- **Private Access & Signed URLs:** Private Supabase Storage objects (`booking-deliverables`) are accessed exclusively via short-lived signed URLs generated on the server for authorized customers.

### 4. Supabase Auth & Role-Based Profiles
- **Consumer & Creator Journeys:** Unified authentication using Supabase Auth with custom application profiles (`profiles`) and strict role permissions (`user_roles`).
- **Context Retention:** Selected packages and creator profiles are preserved across authentication redirects.

---

## 🛠️ Database Schema & Supabase Migrations

The database is built on Supabase PostgreSQL with 19 version-controlled tables, automated triggers, and Row Level Security:

### Tables Overview
| Table Name | Description | Access Control (RLS) |
|---|---|---|
| `profiles` | User profiles linked 1:1 with `auth.users(id)` | Public read, owner update |
| `user_roles` | Customer, Creator, and Admin roles | Owner read, service role manage |
| `creator_profiles` | Creator professional details, city, ratings | Public read, creator update |
| `creator_portfolio_items` | High-res photos and video reel previews | Public read published items |
| `service_categories` | Configurable creative service categories | Public read |
| `creator_services` | Base prices, duration, turnaround, instant flag | Public read, creator manage |
| `creator_availability` | Creator schedule availability blocks | Public read, creator manage |
| `creator_unavailable_periods` | Blackout dates preventing booking conflicts | Public read, creator manage |
| `bookings` | Master customer booking contracts & financials | Customer & Creator assigned only |
| `booking_status_history` | Immutable audit trail of state transitions | Booking participants read-only |
| `platform_fee_settings` | Percentage and fixed fee settings | Public read, admin manage |
| `payments` | Customer payments with idempotency keys | Customer, Creator, Admin only |
| `creator_payouts` | Creator net payouts held in escrow | Creator and Admin only |
| `refunds` | Refund records and gateway status | Customer and Admin only |
| `booking_deliverables` | Raw files, edited media, and Google Drive links | Booking participants only |
| `reviews` | Customer ratings & reviews for completed shoots | Public read, customer create |
| `conversations` | Booking-related chat threads | Participants only |
| `messages` | Direct messages between customer and creator | Thread participants only |
| `notifications` | In-app user notifications | Target user only |

### Storage Buckets
1. `profile-avatars` (Public read, authenticated upload, 5 MB limit)
2. `creator-portfolios` (Public read, creator upload, 50 MB limit)
3. `booking-deliverables` (PRIVATE bucket, 500 MB limit, signed URLs only)
4. `creator-verification` (PRIVATE bucket, 25 MB limit, owner + admin only)

---

## 🚀 Local Setup & Supabase Configuration

### Step 1: Environment Variables
Copy `.env.local.example` to `.env.local` inside `apps/web`:

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Configure your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note:** If Supabase credentials are not configured, the application runs seamlessly in **Development Sandbox Mode**, displaying catalog fixtures and providing auditable test payment and booking simulations without crashing.

### Step 2: Apply Database Migrations
You can apply the SQL migrations via the Supabase Dashboard SQL Editor or Supabase CLI:

1. Open your Supabase Dashboard > **SQL Editor**.
2. Run [`supabase/migrations/20261012000001_master_instantshoot_schema.sql`](supabase/migrations/20261012000001_master_instantshoot_schema.sql) to create all 19 tables, indexes, triggers, and seed data.
3. Run [`supabase/migrations/20261012000002_storage_and_rls_policies.sql`](supabase/migrations/20261012000002_storage_and_rls_policies.sql) to provision storage buckets and enable Row Level Security.

### Step 3: Run Development Server

```bash
# Start Next.js development server
npm.cmd run dev:web
```
Open [http://localhost:3000/explore](http://localhost:3000/explore) in your browser.

---

## 🧪 Verification & Testing

Run linting and production build checks across the workspace:

```bash
# Typecheck and linting
npm.cmd run lint --workspace=apps/web

# Production build verification
npm.cmd run build --workspace=apps/web
```

---

## 📄 License
Private & Confidential — Instantshoot Creative Technologies Pvt. Ltd.
