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
- Phase 1 implementation has not yet been uploaded or runtime-tested.

## Current checkpoint
Current phase: Phase 1 — Foundation.
Status: Planning/tracking committed first; implementation pending.
Next: implement the backend foundation and migrations, then frontend shell, then tests and verification.