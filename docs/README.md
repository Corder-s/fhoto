# Instantshoot / SnapShoot documentation index

Last updated: 2026-10-13. Branch `arena/67428ada-fhoto`.

Start here:

| Document | What it covers |
| --- | --- |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | What the product is, the three roles, and what is and is not built |
| [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) | Runtime components: Next.js, Supabase, NestJS, storage, and how they connect |
| [CODEBASE_STRUCTURE.md](CODEBASE_STRUCTURE.md) | Repository layout and where things live |
| [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) | Local setup, environment variables, and seed scripts |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Tables, statuses, RLS, triggers, and storage buckets |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Every Next.js route handler and the NestJS controllers |
| [AUTHENTICATION_AND_SESSIONS.md](AUTHENTICATION_AND_SESSIONS.md) | Sign-in, sessions, and the server-side session check |
| [AUTHORIZATION_AND_ROLE_ACCESS.md](AUTHORIZATION_AND_ROLE_ACCESS.md) | Roles, route guards, ownership rules, and the booking state machine |
| [USER_WORKFLOWS.md](USER_WORKFLOWS.md) | Customer journeys as implemented |
| [PHOTOGRAPHER_WORKFLOWS.md](PHOTOGRAPHER_WORKFLOWS.md) | Photographer (creator) journeys as implemented |
| [ADMIN_WORKFLOWS.md](ADMIN_WORKFLOWS.md) | Admin journeys as implemented |
| [END_TO_END_DATA_FLOW.md](END_TO_END_DATA_FLOW.md) | A booking traced from request to payment to delivery |
| [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md) | Every feature, marked live, partial, or not built |
| [TESTING_STRATEGY.md](TESTING_STRATEGY.md) | What each test suite covers and what it cannot cover |
| [TEST_RESULTS.md](TEST_RESULTS.md) | Results of the verification run on this branch |
| [SECURITY_REVIEW.md](SECURITY_REVIEW.md) | Security findings, fixes made, and open risks |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Build order, deploying the web app to Vercel, the environment variables to set in the dashboard, the API, and the database |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common failures and their causes |
| [KNOWN_ISSUES.md](KNOWN_ISSUES.md) | Open defects, gaps, and product decisions |
| [CHANGELOG.md](CHANGELOG.md) | What changed in the 2026-10-13 hardening pass |

Conventions used in these documents:

- "Live" means the code path reads or writes real data through the backend and was checked by a test or by a runtime request.
- "Partial" means the path exists but has a gap listed in KNOWN_ISSUES.md.
- "Fixture" means the screen renders sample data from a fixture file. Fixture screens are not production features.
