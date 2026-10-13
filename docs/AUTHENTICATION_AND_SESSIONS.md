# Authentication and sessions

## Identity provider

Supabase Auth is the only production identity provider for the web app. It issues the session as cookies through `@supabase/ssr`. The browser client (`lib/supabase/client.ts`) reads the anon key. Route handlers read the same cookies through the server client.

## Sign-up

1. The sign-up form first posts to `POST /api/auth/register`. The server creates the auth user with `email_confirm: true` and the profile.
2. If that request fails (other than a rate limit), the form falls back to a client-side `supabase.auth.signUp` call. The `handle_new_auth_user` trigger creates the profile for either path.
3. Both paths accept only `customer` or `creator` as the role. Any other value becomes `customer`. Creator rows start as `unsubmitted`.
4. Creators then complete `/photographer/onboarding`. Admin approval is required before they appear publicly.

**Known gap:** email ownership is not verified because `email_confirm` is true. Changing this breaks immediate sign-in and needs a product decision (KNOWN_ISSUES #1).

## Sign-in

- Email and password through Supabase Auth on the sign-in modal (`SnapShootAuthView`).
- Phone OTP is not available in the web app. The NestJS OTP flow is mock-only.
- Password recovery: `/forgot-password` sends a Supabase recovery email; `/reset-password` completes it with the recovery link. Phone-based recovery is not available.

## Session check (server side)

`GET /api/auth/session` is the single source of truth for the client's role display and layout guards:

```json
{ "authenticated": true, "user": { "id": "...", "email": "...", "name": "...", "role": "customer", "roles": ["customer"], "accountStatus": "active" }, "configured": true }
```

- `configured: false` means the Supabase environment is not set.
- `accountStatus` is read from `profiles`. Suspended accounts are reported as such and are refused by `authorize()`.

## Route-level check (`authorize()`)

Every protected route handler calls `authorize()` from `lib/server/session.ts`:

1. Build the server Supabase client from request cookies.
2. `auth.getUser()` — verifies the token with Supabase (not just decodes it).
3. Load roles from `user_roles` for that user id.
4. Load `profiles.account_status`. Non-active accounts get 403.
5. Return the user, roles, and the requested role check result.

Handlers pass a required role or list of roles. Ownership is then checked by the handler.

## Client-side state

- `useServerSession()` (`lib/useServerSession.ts`) calls `/api/auth/session` and is used by the admin, photographer, customer, and owner layouts.
- `useAuth()` (`lib/auth.ts`) reads the Supabase user and its metadata. The role from metadata is used for navigation display only. It never gates data.
- `localStorage` holds UI cache (client CRM, some preferences). It is never trusted for authorization.

## Sessions and expiry

Supabase sessions refresh automatically in the browser. Server handlers read the access token from cookies on each request; there is no server-side session store in this app.

## NestJS mock auth (development only)

`apps/api/src/auth/auth-config.ts` defines the rules:

- `isMockAuthEnabled()` is true only when `ENABLE_MOCK_AUTH=true` **and** `NODE_ENV` is not `production`.
- With mock auth off, login, request-otp, and verify-otp return 503. `forgot-password` returns 501.
- With mock auth on, the login route issues a JWT for one of two fixed development accounts (customer or photographer). The OTP `123456` exists only in this mode and is never echoed in responses.
- The JWT signing secret: `JWT_ACCESS_SECRET` is required in production (at least 32 characters, otherwise boot fails). In development it falls back to a random per-process secret, so tokens do not survive a restart.
- Tokens expire after one hour.

This mock mode must never run in production. It is for the NestJS developer workflow only.

## Secrets

- `SUPABASE_SERVICE_ROLE_KEY`, payment secrets, and AI keys are server-only. None is prefixed `NEXT_PUBLIC_`.
- The Mapbox token that is shipped to browsers must be a public `pk.*` token.
- No credentials are stored in the repository. Seed scripts read their password from the environment and have no default.
