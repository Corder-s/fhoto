# System architecture

## Components

```
Browser
  │  pages (React, Tailwind), Supabase browser client for Auth and Storage
  ▼
Next.js 14 app (apps/web)  ── port 3000
  │  app/**/page.tsx                 UI routes
  │  app/api/**/route.ts             server route handlers (primary API)
  │  next.config rewrite /api/v1/*   ──►  NestJS API (apps/api) ── NEST_API_BASE_URL (port 4000 locally)
  ▼
Supabase project
  │  Auth           email + password sessions (cookies managed by @supabase/ssr)
  │  Postgres       public.* tables with row-level security
  │  Storage        profile-avatars (public), creator-portfolios (public),
  │                 booking-deliverables (private, signed URLs)
  ▼
Optional providers (not wired for real traffic yet)
     Razorpay / Cashfree / Stripe (payments), Mapbox (map search), Google Gemini (AI chat)
```

## Request paths

1. **Pages.** UI routes are rendered by Next.js. Role-specific layouts call `GET /api/auth/session` to learn the signed-in role and show a sign-in modal or nothing for anonymous visitors. The layout check is for display. Data protection is in the route handlers.
2. **Route handlers.** Every protected handler calls `authorize()` (see `apps/web/src/lib/server/session.ts`). It reads the Supabase session from cookies, verifies it with `auth.getUser()`, loads roles from `user_roles`, and rejects inactive accounts. Handlers then apply ownership checks against the session user, never against IDs in the body or query string.
3. **Database access.** Handlers use one of two Supabase clients:
   - the **service-role** client (`lib/supabase/admin.ts`), after `authorize()` has passed and the handler has checked ownership or role, or in public read endpoints that apply explicit, server-side filters and a column list (for example `/api/photographers`);
   - the **browser/anon** client with RLS, where the handler is public or the browser writes its own rows (for example, avatar upload and settings).
4. **NestJS.** Requests to `/api/v1/*` are proxied by Next to the origin in `NEST_API_BASE_URL` (server-side rewrite; browsers never call the API origin directly). It defaults to nothing: when the variable is unset, no rewrite is registered and those paths return 404. Locally the value is `http://localhost:4000`. The NestJS app has its own guards. Its auth endpoints are mock-only and return 503 unless `ENABLE_MOCK_AUTH=true` outside production. Its subscription webhook verifies an HMAC signature. The NestJS app needs a generated Prisma client and a `DATABASE_URL`, which is why its data paths are not runtime-verified in this sandbox (see TEST_RESULTS.md).

## Trust boundaries

| Boundary | Enforced by |
| --- | --- |
| Anonymous → API | `authorize()` returns 401 on every protected route handler |
| Customer ↔ Creator data | Ownership checks in handlers, plus RLS policies on bookings, messages, deliverables |
| Client → privileged fields | Route handlers ignore or reject role, status, price, and commission fields; BEFORE UPDATE/INSERT triggers in the database refuse restricted columns |
| Browser → Storage | Storage INSERT policies scope uploads to a folder named after `auth.uid()`; deliverables are read through server-issued signed URLs |
| Client → payment state | Sandbox confirmation requires a `dev_sandbox` payment and is refused when a gateway key is configured. Gateway webhooks are not implemented for bookings. |

## Data stores

- **Supabase Postgres:** system of record for profiles, creators, packages, bookings, payments, deliverables, messages, reviews.
- **Supabase Storage:** avatars, portfolio images, private deliverable files.
- **NestJS Prisma schema** (`apps/api/prisma/schema.prisma`): separate schema for the legacy NestJS service. It is not the same database model as the Supabase schema and is not used by the Next.js app.
- **Browser localStorage:** UI cache only (session display, client CRM in `clientService.ts`, fixture-era state). It never grants access.

## Deployment shape

Two processes plus Supabase: `next start` (or a Node host for Next.js) and optionally `node dist/src/main.js` for the NestJS service. The NestJS service is only needed for the `/api/v1/*` rewrite and for the subscription pages. See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).
