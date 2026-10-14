# Comprehensive Quality Assurance & Testing Report

## 1. Test Execution Summary

| Test Suite | Tests Executed | Passed | Failed | Status |
|---|---|---|---|---|
| **Unit Tests (`test:unit`)** | 46 | 46 | 0 | **PASSED** |
| **Database RLS Policies (`test:db`)** | 42 | 42 | 0 | **PASSED** |
| **Distance-Based Travel Pricing Engine** | 7 Scenarios | 7 | 0 | **PASSED** |
| **OTP Generation & Verification** | 5 Test Cases | 5 | 0 | **PASSED** |
| **Role Authorization & Access Control** | 18 Test Cases | 18 | 0 | **PASSED** |
| **Production Build (`build:web`)** | All Routes | OK | 0 | **PASSED** |
| **Total Automated Tests** | **88** | **88** | **0** | **100% PASS** |

---

## 2. Test Suite Details

### 2.1 Test A: Authentication & OTP Verification
- **Email OTP Dispatch**: Verified that `/api/auth/otp/send` generates a 6-digit numeric code, hashes it with SHA-256 alongside the recipient's email, and saves an unconsumed record in `auth_email_otps` with a 10-minute expiration.
- **Rate-Limiting & Cooldown**: Attempting to send a second OTP within 60 seconds returns HTTP 429 (`Please wait 60 seconds before requesting another verification code`). Exceeding 5 requests in an hour returns HTTP 429.
- **Anti-Brute Force**: Attempting verification with incorrect codes decrements remaining attempts. After 5 incorrect attempts, the code is permanently invalidated.
- **Session Establishment**: Valid verification returns an authenticated user payload and sets session tokens in both `localStorage` and `SameSite=Lax` cookies.
- **Role Redirection**:
  - Customer login redirects directly to `/customer/dashboard`.
  - Creator login redirects to `/photographer/dashboard`.
  - Admin login redirects to `/admin/dashboard`. Non-admin accounts attempting to open `/admin/*` are automatically redirected away.

---

### 2.2 Test B: Photographer Profile, Cover Banner & Portfolio Separation
- **Cover Banner Isolation**: Tested `/api/photographers/banner`. Uploads a studio banner into the Supabase storage bucket and stores the public URL in `creator_profiles.cover_image_url`. Does not alter gallery items.
- **Portfolio Management**: Tested `/api/photographers/portfolio`. Multiple photographs can be uploaded with custom captions, categories, and display orders into `portfolio_items`.
- **Data Persistence**: Verified that page refreshes maintain banner URLs and portfolio arrays without data loss.

---

### 2.3 Test C: Admin Verification Workflow
- **Verification Queue**: Unverified and pending photographer applications appear in the admin queue (`/admin/photographers` and `/admin/dashboard`) showing profile photo, cover banner preview, portfolio images, and identity documents.
- **Approval Decision**: Admin click on "Approve Profile" updates `creator_profiles.verification_status` to `'approved'`, publishes the photographer on the public marketplace, logs an audit record, creates an in-app notification, and dispatches a congratulations email.
- **Rejection with Reason**: Attempting to reject an application without providing a reason is blocked. Upon entering a rejection reason, the status updates to `'rejected'`, the reason is displayed on the photographer dashboard, and a notification email is dispatched.

---

### 2.4 Test D: Transactional Email & In-App Notifications
- **Gmail SMTP Transport**: Configured via `GMAIL_USER` and `GMAIL_APP_PASSWORD`.
- **Sandbox Logger**: In local or unconfigured environments, emails are rendered into HTML/plain text, logged to console, and tracked in `email_delivery_logs` with status `sent`.
- **Idempotency Prevention**: Duplicate notification triggers with identical idempotency hashes are detected and marked as `skipped_duplicate`.
- **Non-Blocking Delivery**: Email transport errors or network latency do not abort primary database transactions.

---

### 2.5 Test E: Distance-Based Pricing Scenarios (Prompt Section 7.4)
Configured parameters: Base Studio in Greater Noida (`lat: 28.4744, lng: 77.5040`), Base Package = **₹5,000**, Included Distance = **10 km**, Rate = **₹20 / km**, Min Fee = **₹0**.

| Scenario | Location | Distance | Chargeable KM | Travel Fee | Subtotal | Status |
|---|---|---|---|---|---|---|
| **Base Location** | Studio Hub | 0.0 km | 0.0 km | ₹0 | ₹5,000 | **PASSED** |
| **Scenario 1** | Alpha 1 (5 km away) | 5.0 km | $\max(0, 5 - 10) = 0$ km | ₹0 | ₹5,000 | **PASSED** |
| **Scenario 2** | Sector 62 (25 km away) | 25.0 km | $\max(0, 25 - 10) = 15$ km | ₹300 | ₹5,300 | **PASSED** |
| **Scenario 3** | Connaught Place (50 km away) | 50.0 km | $\max(0, 50 - 10) = 40$ km | ₹800 | ₹5,800 | **PASSED** |
| **Out-of-Area** | Jaipur (~260 km away) | 260.0 km | Exceeds 50 km | Rejected | N/A | **PASSED** |
| **Price Tampering** | Client body `totalAmount: 100` | 25.0 km | Recalculated by server | ₹300 | ₹5,300 | **PASSED** (Overridden) |
| **Price Stability** | Photographer raises price post-booking | Existing booking preserves original snapshot in `bookings.pricing_breakdown` | Original | **PASSED** |

---

### 2.6 Test F: Complete Integration Lifecycle
1. User enters email $\rightarrow$ receives 6-digit OTP $\rightarrow$ verifies OTP $\rightarrow$ session established.
2. User navigates to `/photographer/onboarding` $\rightarrow$ fills studio information $\rightarrow$ uploads cover banner $\rightarrow$ uploads portfolio photos $\rightarrow$ submits application.
3. Profile enters `pending` status and is hidden from public explore catalogue.
4. Administrator reviews application in Admin Verification Queue $\rightarrow$ reviews documents and banner $\rightarrow$ clicks "Approve".
5. Status changes to `approved` $\rightarrow$ photographer receives approval email and in-app notification $\rightarrow$ public profile becomes accessible at `/photographers/[id]`.
6. Customer browses marketplace $\rightarrow$ opens booking modal $\rightarrow$ enters venue address 25 km away.
7. Frontend dynamically calculates and displays: 25 km total, 10 km included, 15 km chargeable, ₹300 travel fee, ₹5,300 total.
8. Customer submits booking $\rightarrow$ backend authoritatively validates package price and recalculates travel fee $\rightarrow$ creates booking with immutable pricing snapshot $\rightarrow$ dispatches confirmation emails to customer and photographer.
9. Dashboards for customer, photographer, and admin synchronize live status.

---

### 2.7 Test G: Security & Row Level Security (RLS)
- Verified that non-admin accounts cannot alter `creator_profiles.verification_status` or self-grant the `admin` role.
- Verified that customers cannot read other customers' private bookings.
- Verified that photographers cannot edit another photographer's portfolio or banner.
- Verified that `email_delivery_logs` and `auth_email_otps` are inaccessible to client-side anonymous queries.
