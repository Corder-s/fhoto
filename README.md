# SNAPSHOOT — On-Demand Photographer & Videographer Marketplace

> **SnapShoot** is a modern, responsive web application connecting customers with verified professional photographers and filmmakers across India. Built with Next.js 14 App Router, TypeScript, and Tailwind CSS.

---

## 📸 Key Features

### 1. Consumer Experience & Discovery
- **Faithful Design Replication:** Warm cream canvas (`#FAF7F2`), vibrant primary orange accents (`#FF6E00`), near-black typography (`#1A1816`), and refined card composition.
- **Hero & Geospatial Search:** Dynamic search bar filtering by Location, Shoot Type (Portraits, Reels, Couples, Events), Date, and Duration.
- **Verified Photographers Radar:** Multi-facet filtering on `/explore` by location/city, category, price range (₹500 to ₹15,000+), rating, and availability status.
- **Creator Profiles:** Rich portfolios with full-screen lightbox preview, camera gear breakdown, transparent package tiers, and client reviews.
- **4-Step Booking Wizard:** Interactive booking modal calculating transparent INR totals with platform fee and 100% Escrow security.

### 2. Customer Dashboard (`/customer/*`)
- **Active Appointment Tracker:** Live status milestone tracking (`REQUESTED` → `CONFIRMED` → `ON_THE_WAY` → `ARRIVED_AT_VENUE` → `IN_PROGRESS` → `COMPLETED`).
- **Shoot-Start OTP System:** 6-digit OTP verification handshake on arrival ensuring verified attendance before shoots begin.
- **Private Photo Proofing Gallery:** Watermarked client previews, high-res 4K JPEG downloads, and complete ZIP downloads.
- **Escrow Financial Ledger:** RBI-compliant escrow payment breakdown, downloadable GST invoices, and transaction history.
- **Reviews & Favorites:** Verified review submissions with star ratings and feedback validation.

### 3. Photographer Creator Studio (`/photographer/*`)
- **Studio Dashboard:** Real-time shoot requests, online/offline status switch, and on-site OTP handshake validator.
- **Financial Analytics & Payouts:** Gross Booking Value (GBV), guaranteed 80% net payouts, and instant UPI/Bank IMPS withdrawal dialog.
- **Portfolio & Packages Editor:** Create, update, and manage photography tiers and portfolio image collections.
- **Availability Calendar:** Slot and day management for instant bookings.
- **KYC Verification Desk:** 4-step identity verification (Govt ID, camera gear check, selfie verification, and bank details).

### 4. Operations & Executive Panels
- **Admin Operations Desk (`/admin/dashboard`):** KYC review queue, active shoots monitor, dispute mediation console, and platform integrity checks.
- **Owner Analytics (`/owner/dashboard`):** Marketplace liquidity, Gross Booking Value (GBV), 20% platform commission capture, and city density metrics.

---

## 🛠️ Tech Stack & Architecture

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server Components + Client Interactivity)
- **Language:** TypeScript 5.6
- **Styling:** Tailwind CSS with custom design tokens (`canvas`, `brand`, `ink`, `contour`)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Monorepo:** npm workspaces (`apps/web`, `apps/api`, `packages/*`)
- **Package Manager:** npm

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x (tested on Node v20 & v24)
- npm >= 9.x

### Installation

```bash
# Clone the repository
git clone https://github.com/Corder-s/fhoto.git
cd fhoto

# Install dependencies across monorepo
npm install
```

### Development Server

```bash
# Run web application locally (runs on http://localhost:3000)
npm run dev:web
```

### Production Build

```bash
# Build production bundle
npm run build --workspace=apps/web

# Start production server
npm run start --workspace=apps/web
```

---

## 📄 License
Private & Confidential — SnapShoot Technologies Pvt. Ltd.
