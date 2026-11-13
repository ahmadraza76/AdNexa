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
- Implemented refresh-token sessions: opaque random refresh credentials are stored only as SHA-256 hashes, grouped into token families, rotated on refresh, expired after 30 days, and revoked on logout. Reuse of a rotated token revokes the entire family. Access and refresh credentials are issued on login/registration; the Next.js proxy stores both in HttpOnly cookies, scopes the refresh cookie to `/api/auth`, and provides a CSRF-protected refresh endpoint.
- Added backend tests for refresh rotation, replay detection/family revocation, and logout revocation. These changes are committed but their new CI results are pending.
- Not yet verified: full browser end-to-end session behavior, Docker Compose full-stack startup, production deployment, email delivery, and real multi-worker behavior. Role-specific portals, email verification, password reset, Redis-backed distributed throttling, admin lifecycle/audit, campaign delivery, analytics and financial workflows remain pending.

## Current checkpoint
Current phase: Phase 1 — Foundation.
Status: Backend foundation and first frontend shell are committed. GitHub Actions run #73 passed backend PostgreSQL migration/schema checks, 11 tests, frontend typecheck and production build. Phase 1 remains in progress; full browser and Compose verification are pending.
Next: verify refresh-token migration, replay/logout tests, frontend typecheck and production build in GitHub Actions; then add browser session tests and email verification, followed by audited admin lifecycle and role-specific workspace shells.

### 2026-11-13 — Cross-tab session refresh
- Added `frontend/lib/session-lock.ts` using the browser Web Locks API with an exclusive same-origin lock for dashboard session bootstrap/refresh requests.
- Updated `frontend/app/dashboard/dashboard-session.tsx` so session requests run inside the cross-tab lock. Browsers without Web Locks fail closed with a visible retry/sign-in message; no uncoordinated refresh request is sent.
- Added `frontend/tests/session-lock.test.ts` with regression coverage for serialized operations and the unsupported-lock case.
- GitHub Actions run #43437560103 completed successfully: frontend and backend test jobs both passed. This verifies CI, not a real multi-tab browser session.
- The PR #2 P2 review finding is addressed in the dashboard refresh path by cross-tab serialization. Real browser E2E testing remains required before treating the session flow as fully verified.
- Phase 1 remains in progress. Docker Compose full-stack startup, deployed-browser/proxy behavior, email verification, password reset, Redis-backed distributed throttling, audited admin lifecycle, and role-specific workspaces remain pending.

## Current checkpoint — 2026-11-13
Current phase: Phase 1 — Foundation.
Status: Cross-tab refresh serialization and unit regression tests are committed on `feature/dashboard-session-refresh`. GitHub Actions run #43437560103 passed both jobs. No browser E2E or full-stack Compose verification has been completed; do not mark Phase 1 complete.
Next: add and run real browser multi-tab E2E coverage for simultaneous session bootstrap/refresh, then verify Docker Compose full-stack startup.
### 2026-11-13 — Browser E2E harness
- Added Playwright test tooling and frontend/playwright.config.ts.
- Added frontend/e2e/session-refresh.spec.ts: opens two real Chromium tabs, starts both dashboard session bootstraps together, rotates the refresh cookie in the first response, and asserts the second tab sends the rotated cookie rather than replaying the old one.
- Updated frontend CI to install Chromium and run npm run test:e2e before the production build.
- First CI attempt exposed a GitHub-hosted ubuntu-latest image newer than Playwright 1.56.1 supports. Pinned the frontend browser job to ubuntu-24.04; the browser test has not yet passed in CI.
- CI run #43438025401: frontend typecheck and all 8 Node tests passed; browser installation failed on the unsupported runner image. This is an infrastructure compatibility failure, not a passing E2E result.
- npm install reported existing dependency audit findings and a Next.js 15.3.3 security warning. Dependency remediation is still required; no automatic force-upgrade was applied.
- Phase 1 remains in progress. No real browser test result, Docker Compose full-stack verification, or production readiness claim is made.
