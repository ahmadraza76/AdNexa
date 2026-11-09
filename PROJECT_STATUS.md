# AdNexa Project Status

Last updated: 2026-11-10
Repository: https://github.com/ahmadraza76/AdNexa
Working branch: develop/phase-1-foundation
Default branch: main

## Product definition
AdNexa is an independent, India-first and globally scalable advertising network for web and mobile inventory. The initial release uses direct/priority campaign selection. Do not claim real-time bidding, external demand integrations, native mobile SDKs, live payments, or production readiness until implemented and verified.

## Portals
1. Advertiser: account, verification, campaign creation, creatives, targeting, budgets, analytics, wallet and transactions.
2. Publisher: account, website/app inventory, ownership verification, approval, ad units, integration instructions, reporting, earnings and payout setup.
3. Ad delivery engine: validate inventory and requests, select eligible campaigns, enforce targeting/budget/frequency, deliver creative, track events, calculate revenue share, and reject invalid traffic.
4. Developer: API keys, API/SDK documentation, integration guides, test units, webhooks and logs.
5. Admin: user and business verification, inventory/campaign approvals, finance ledger, payouts, support, settings and audit logs.

## Technical direction
- Web frontend: Next.js + TypeScript.
- Business API: Python FastAPI.
- Database: PostgreSQL.
- Cache/queues: Redis.
- Analytics: PostgreSQL initially; ClickHouse-ready event pipeline later.
- Ad-serving service: separate Go service when the request volume and delivery requirements justify it.
- SDK direction: TypeScript web SDK first; Android/Kotlin, iOS/Swift and Flutter/Dart later.
- Deployment: Docker-based, environment-driven configuration.
- Do not use Firebase or a separate Supabase project.

## Delivery phases
- [ ] Phase 1: foundation, auth, database, roles, migrations, tests and local development.
- [ ] Phase 2: admin portal, approvals, RBAC, audit logs and operational controls.
- [ ] Phase 3: advertiser portal, campaigns, creatives, budgets and targeting.
- [ ] Phase 4: publisher portal, inventory ownership, ad units and approvals.
- [ ] Phase 5: ad selection API and first-party JavaScript web SDK.
- [ ] Phase 6: event tracking, analytics and double-entry financial ledger.
- [ ] Phase 7: payout workflows, invalid-traffic controls and reconciliation.
- [ ] Phase 8: developer portal, API keys, webhooks and mobile SDK foundations.
- [ ] Phase 9: security review, load/integration tests, deployment and production-readiness checks.

## Non-negotiable engineering rules
- Never represent mock data, simulated delivery, fake payments, or estimated earnings as real.
- No self-service admin registration; admin access must be provisioned securely.
- Financial balances must be ledger-derived; use immutable double-entry transactions.
- Enforce ownership checks and role-based permissions server-side, not only in the UI.
- Validate inputs, rate-limit sensitive endpoints, protect secrets, and audit privileged actions.
- Every phase must include tests and a clear list of completed work, remaining work and limitations.
- Do not merge to main until the phase is tested and explicitly reviewed.

## Progress log
### 2026-11-10
- Confirmed GitHub repository write access.
- Created working branch `develop/phase-1-foundation` from `main`.
- Confirmed current main branch contained only the initial README.
- Created this file as the project source of truth.
- Uploaded initial backend foundation: FastAPI app, settings, SQLAlchemy session, user/role models, password hashing, JWT access tokens, registration/login/current-user endpoints, Alembic environment and initial migration.
- Added backend dependency manifest, environment template, Dockerfile, local PostgreSQL/API Compose stack, health endpoint test, authentication integration tests, and GitHub Actions CI workflow.
- Added repository README with local setup instructions, initial API routes and explicit implementation limitations.
- Added normalized email/name validation, reusable server-side role authorization dependency, login/registration throttling (10 requests/minute per client IP), and one-time CLI bootstrap for the first admin. Admin creation remains unavailable over public HTTP.
- Added expanded authentication and role tests. GitHub Actions run #34 passed: PostgreSQL 16 migration applied, `alembic check` reported no schema drift, and pytest reported 11 passed (one upstream deprecation warning).
- The in-memory rate-limit store is single-process only; shared Redis storage and trusted proxy configuration are required before multi-worker public deployment.
- Added Next.js 15/React 19 frontend shell: landing page, advertiser/publisher/developer registration, login, authenticated account page, logout, and server-side API proxy routes.
- Access tokens are stored in HttpOnly, SameSite=Lax cookies (Secure in production); browser JavaScript does not receive the bearer token. Protected dashboard data is fetched server-side from the FastAPI API.
- Added frontend Docker image and integrated web service into Docker Compose. CI now runs backend PostgreSQL migrations/schema consistency/tests and frontend TypeScript/build checks.
- GitHub Actions run #73 passed: backend job successful; frontend `npm run typecheck` and production `npm run build` successful. Backend PostgreSQL migration and `alembic check` also passed; pytest reported 11 passed (one upstream deprecation warning).
- Added strict same-origin validation for the browser-facing login, registration and logout POST routes. The shared helper rejects cross-site Fetch Metadata, requires an Origin or Referer signal, rejects opaque/malformed origins, and compares the source origin with the request URL origin. Missing-origin requests fail closed.
- Added frontend Node test runner (`tsx`) and six automated CSRF unit tests covering same-origin Origin, same-origin Referer fallback, foreign Origin, cross-site Fetch Metadata, missing origin signals, and opaque `null` Origin. GitHub Actions now runs `npm test` between typecheck and production build.
- The CSRF helper currently protects the three auth mutation routes only; other future state-changing routes must use the same guard. Unit tests do not replace deployed-browser/proxy verification.
- Not yet verified: full browser end-to-end session behavior, Docker Compose full-stack startup, production deployment, email delivery, and real multi-worker behavior. Role-specific portals, email verification, password reset, refresh-token rotation, Redis-backed distributed throttling, admin lifecycle/audit, campaign delivery, analytics and financial workflows remain pending.

## Current checkpoint
Current phase: Phase 1 — Foundation.
Status: Backend foundation and first frontend shell are committed. GitHub Actions run #73 passed backend PostgreSQL migration/schema checks, 11 tests, frontend typecheck and production build. Phase 1 remains in progress; full browser and Compose verification are pending.
Next: verify the new CSRF unit-test job in GitHub Actions; then implement refresh-token rotation, email verification and audited admin lifecycle, followed by browser end-to-end tests and role-specific workspace shells.