# AdNexa

AdNexa is an India-first advertising network for web and mobile publishers and advertisers. The first release is being built around direct, priority-based campaigns; real-time bidding and external demand integrations are not implemented.

## Repository layout

- `backend/`: FastAPI business API, SQLAlchemy models, Alembic migrations and tests.
- `docker-compose.yml`: local PostgreSQL and API development services.
- `.github/workflows/`: automated backend checks.

## Local backend setup

Requirements: Docker Engine with the Compose plugin, or Python 3.12+ and PostgreSQL 16.

1. Copy `backend/.env.example` to `backend/.env`.
2. Replace `SECRET_KEY` with a random secret of at least 32 characters. Never commit the real `.env`.
3. Start the stack: `docker compose up --build`.
4. Web app: `http://localhost:3000`.
5. API health: `http://localhost:8000/health`.
6. OpenAPI docs: `http://localhost:8000/docs`.

For frontend-only development, run `cd frontend && npm install && ADNEXA_API_URL=http://localhost:8000 npm run dev`.

The Compose database password is for local development only. Do not reuse it in production.

## Initial API

- `POST /api/v1/auth/register` — create an advertiser, publisher or developer account.
- `POST /api/v1/auth/login` — obtain an access token.
- `GET /api/v1/auth/me` — return the authenticated account.

Registration and login are limited to 10 requests per minute per client IP in this initial single-process setup. Before horizontal production deployment, configure shared Redis-backed rate-limit storage and trusted-proxy handling. Server-side role checks are available through `require_roles`; attach them to protected portal routes.

Public registration cannot create admin accounts. Admin provisioning is intentionally not exposed over HTTP. After applying migrations, a trusted operator can create the first admin from the backend directory with `python -m scripts.create_admin`. This one-time bootstrap refuses to run if an admin already exists.

## Run backend tests

From the `backend/` directory:

```bash
python -m pip install -r requirements.txt
SECRET_KEY="local-test-secret-key-that-is-at-least-32-chars" DATABASE_URL="sqlite:///./test.db" pytest -q
```

## Current implementation status

Phase 1 is in progress. This is an early foundation, not a production-ready advertising platform. The initial landing page, registration/login screens and authenticated account shell are implemented. Role-specific advertiser, publisher and developer dashboards are not implemented yet. Email verification, password reset, refresh-token rotation, Redis-backed distributed throttling, admin lifecycle management and audit trail, campaign delivery, analytics, billing and payouts are not implemented yet. Never use real customer funds or production traffic with this build.
