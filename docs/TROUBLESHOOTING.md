# Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `/api/auth/session` returns `configured: false` | `NEXT_PUBLIC_SUPABASE_URL` or the anon key is missing in the web environment | Set both in `apps/web/.env.local` and restart `next dev` or `next start`. Variables are read at build time for client code, so rebuild after changing them. |
| Every protected route returns 401 after sign-in | Session cookie not sent (different origin or domain), or the Supabase project does not match the keys | Check the origin of the app matches the Supabase site URL; check the URL and anon key belong to the same project |
| 403 "This account is suspended or not active" | `profiles.account_status` is not `active` | Reinstate through the admin dashboard, or update the row with the service role |
| 403 "You do not have permission" on an admin route | The account has no `admin` row in `user_roles` | Insert the role with the service role (see DEPLOYMENT_GUIDE.md) |
| `POST /api/bookings/create` returns 404 "not available for bookings" | Creator is not approved, or `is_available` is false | Approve in the admin dashboard; set availability |
| `POST /api/bookings/create` returns 409 "overlaps" | Another accepted, confirmed, or in-progress booking overlaps the time window | Choose another window. Pending requests do not block (KNOWN_ISSUES #5). |
| `POST /api/payments/create-intent` returns 501 | `PAYMENT_PROVIDER_SECRET_KEY` is set. Gateway order creation is not implemented. | Unset it for sandbox testing, or implement the gateway |
| `POST /api/payments/confirm-sandbox` returns 403 | A gateway key is configured, so sandbox confirmation is refused | Expected. Use the gateway flow when implemented. |
| `POST /api/deliverables` returns 400 about Google Drive | The link does not match a Drive file or folder URL | Use `https://drive.google.com/file/d/...` or `/drive/folders/...` |
| Portfolio upload fails with a storage error | The file is over 10 MB, or the storage policy rejected the path. Uploads must go under `<auth uid>/` in `creator-portfolios`. | Reduce the file size. Confirm the user is signed in. Check the migration applied. |
| Avatar upload fails | Bucket policy rejects the path or the MIME type (JPEG, PNG, WebP, GIF only, 5 MB) | Use a supported image under 5 MB |
| `/api/photographers` returns 500 "Could not load photographers." | Supabase unreachable, or the service key and anon key are both wrong | Check the Supabase URL and keys. The server log has the detailed error. |
| `/api/v1/*` returns a connection error | The NestJS service is not running on port 4000 | Start it (`node dist/src/main.js` with `PORT=4000`), or accept that NestJS-only features are unavailable |
| NestJS login returns 503 "Mock authentication is disabled" | Expected unless `ENABLE_MOCK_AUTH=true` and `NODE_ENV` is not `production` | Sign in through the web app. Use mock only in development. |
| NestJS fails to start with "JWT_ACCESS_SECRET must be set in production" | Expected fail-closed behaviour | Set a secret of at least 32 characters |
| NestJS webhook returns 503 "RAZORPAY_WEBHOOK_SECRET is not configured" | Expected in production without the secret | Set the secret from the gateway dashboard |
| NestJS test output says "@prisma/client did not initialize yet" | Prisma client not generated, or the engine could not be downloaded | Run `npx prisma generate` in `apps/api` with network access. `npm test` still exits 0 in this state, so read the output. |
| `next build` warns it could not download Google Fonts | No outbound access to fonts.googleapis.com | Harmless offline; the build still succeeds with system fonts |
| `next lint` shows warnings | Existing `<img>` usage and one hooks warning | Warnings are tracked (KNOWN_ISSUES #14). Errors fail the build. |
| `node --test tests/` fails with "Cannot find module" | Node 22 runs a directory argument as a file | Use the glob form in `package.json` (`npm run test:unit`) |
| `scratch/seed_*.js` exits 1 | A required environment variable is missing | Set `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SEED_CREATOR_PASSWORD`. Use a development project only. |
| AI chat returns `GEMINI_API_KEY_MISSING` | No Gemini key configured | Set `GEMINI_API_KEY` on the server |
| Admin action shows no error but nothing changes | The admin bookings page ignores failed responses (KNOWN_ISSUES #13) | Check the response in the browser network panel; check `booking_status_history` |
