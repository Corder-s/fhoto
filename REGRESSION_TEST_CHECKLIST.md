# Regression Test Checklist — SnapShoot Platform

**Date:** October 14, 2026  
**Auditor:** Senior Performance Engineer  
**Status:** All Critical Workflows Verified & 100% Tests Passing

---

## 1. Automated Test Suites Execution

| Test Suite | Path | Tests Run | Passed | Failed | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Unit Tests & Policy Rules** | `tests/*.test.mjs` | 34 | 34 | 0 | ✅ PASS |
| **Database & Schema Security (RLS)** | `supabase/tests/rls-policies.test.mjs` | 42 | 42 | 0 | ✅ PASS |
| **Backend Security, Tenancy & AI** | `apps/api/test/*.test.ts` | 69 | 69 | 0 | ✅ PASS |
| **Next.js Production Build** | `apps/web` (Next.js 14.2.35) | 56 routes | 56 | 0 | ✅ PASS |
| **Total Test Count** | — | **145** | **145** | **0** | **✅ 100% PASS** |

---

## 2. Core Workflows Verification Matrix

### Authentication & Sessions
- [x] **Singleton Auth Session Initialization:** `useAuth()` loads cached session synchronously without cascading layout re-renders or flashing blank states.
- [x] **Supabase Single Listener:** Exactly one `onAuthStateChange` listener is registered across the entire application runtime.
- [x] **Login Flow:** User can log in with email/password or OTP; session token is written to storage/cookie and broadcasted cleanly.
- [x] **Logout Flow:** `logout()` clears session, notifies subscribers in one tick, and resets profile state.
- [x] **Multi-Tab Session Sync:** `storage` and `snapshoot:auth-change` events synchronize user identity across active browser tabs.
- [x] **Clean Brand Loading:** All Supabase mentions removed from auth toasts and dialogs.

### Profile & Identity Management
- [x] **User Profile Synchronization:** `/api/profile/me` loads profile and creator details concurrently via `Promise.all`.
- [x] **In-Flight Fetch Cancellation:** Rapid navigations or user switches abort obsolete requests via `AbortController`.
- [x] **Profile Updates:** Saving profile or uploading avatar updates local state and skips redundant self-triggered GET requests.
- [x] **Avatar Upload/Delete:** Avatar file validation (format, 5MB limit) intact; updates cookie session and UI immediately.

### Marketplace & Discovery
- [x] **Public Landing Page (`/`):** Zomato hero with `fetchPriority="high"` renders without layout shifts; Google Fonts self-hosted with zero external network requests.
- [x] **Live Photographers Query (`/api/photographers`):** Fetches services, portfolio items, and profiles concurrently; returns identical contract with `Cache-Control` header.
- [x] **Explore Page (`/explore`):** Search by location, category, budget, and natural language query filters smoothly via memoized state.
- [x] **Photographer Profile View (`/photographers/[id]`):** Hero cover banner and artist avatar prioritized; portfolio grid items lazy loaded; clean `"Loading verified artist profile..."` loading indicator without Supabase branding.

### Customer & Photographer Dashboards
- [x] **Customer Dashboard (`/customer/dashboard`):** Clean loading state (`"Loading your scheduled appointments..."`); memoized calculations for active shoots and escrow totals.
- [x] **Photographer Dashboard (`/photographer/dashboard`):** Studio sync status displays `"Realtime Studio Connected"`; portfolio thumbnails lazy loaded.
- [x] **Photographer Services (`/photographer/services`):** Clean loading indicator (`"Loading packages..."`); CRUD packages intact.
- [x] **Photographer Portfolio (`/photographer/portfolio`):** Clean loading indicator (`"Loading portfolio..."`); upload and category tagging intact.

### Security, Multi-Tenancy & Authorization
- [x] **Row Level Security (RLS):** Column guards protect `account_status`, `verification_status`, and `rating`.
- [x] **Multi-Tenant CRM Isolation:** Creator accounts cannot access or tamper with other photographers' clients, packages, or bookings.
- [x] **Owner Operations Desk:** Owner role retains unrestricted platform capabilities; admin permissions strictly enforced.
- [x] **OTP Security:** Arrival OTP is masked for photographers until customer reveals upon arrival.
- [x] **Private Galleries:** Customer deliverables accessible only to authorized participants.
- [x] **Reduced Motion Support:** `@media (prefers-reduced-motion: reduce)` disables CPU-heavy fluid animations for users who prefer minimal movement.
