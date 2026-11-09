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
4. API health: `http://localhost:8000/health`.
5. OpenAPI docs: `http://localhost:8000/docs`.

The Compose database password is for local development only. Do not reuse it in production.

## Initial API

- `POST /api/v1/auth/register` — create an advertiser, publisher or developer account.
- `POST /api/v1/auth/login` — obtain an access token.
- `GET /api/v1/auth/me` — return the authenticated account.

Public registration cannot create admin accounts. Admin provisioning is intentionally not exposed yet.

## Run backend tests

From the `backend/` directory:

```bash
python -m pip install -r requirements.txt
SECRET_KEY="local-test-secret-key-that-is-at-least-32-chars" DATABASE_URL="sqlite:///./test.db" pytest -q
```

## Current implementation status

Phase 1 is in progress. This is an early foundation, not a production-ready advertising platform. Email verification, password reset, refresh-token rotation, request throttling, admin provisioning, granular authorization policies, frontend portals, campaign delivery, analytics, billing and payouts are not implemented yet. Never use real customer funds or production traffic with this build.
