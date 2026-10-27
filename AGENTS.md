# AGENTS.md — Apex CRM Workspace Guidelines

This document provides context, conventions, and operational instructions for all AI agents working on the **Apex CRM** codebase.

---

## 1. Project Overview

- **Frontend:** React + Vite (`/home/dhairya/Project/CRM/frontend`)
- **Backend:** FastAPI + SQLAlchemy 2.x async + asyncpg + PostgreSQL (`/home/dhairya/Project/CRM/backend`)
- **Database:** PostgreSQL (`crm_db` on localhost:5432, user `dhairya`)
- **Package Manager:** `uv` is strictly used for Python. Always run commands using `uv run ...` or `uv add ...`. Do NOT install global packages.

---

## 2. API Documentation (`API_docs.md`)

The comprehensive API documentation is maintained in:

- **[`API_docs.md`](file:///home/dhairya/Project/CRM/API_docs.md)**

All active endpoints, authentication mechanisms, request/response models, and role permissions are cataloged below for reference:

### Summary of Active APIs

#### System

- `GET /api/health`: Health check (DB ping, version, status).

#### Authentication (`/api/v1/auth`)

- `POST /api/v1/auth/login`: Authenticate with email/password; returns access & refresh tokens, sets HttpOnly cookie.
- `POST /api/v1/auth/refresh`: Rotates refresh token and issues new access token.
- `POST /api/v1/auth/logout`: Clears session cookie.
- `GET  /api/v1/auth/me`: Fetches profile of current authenticated user.
- `PATCH /api/v1/auth/me`: Updates profile (name, password) for authenticated user.
- `POST /api/v1/auth/register`: Admin-only endpoint to provision users with designated roles.
- `POST /api/v1/auth/password-reset/request`: Request single-use password reset token.
- `POST /api/v1/auth/password-reset/confirm`: Complete password reset with token.

#### User Management (`/api/v1/users` — Admin Only)

- `GET    /api/v1/users/`: Paginated list of registered users.
- `GET    /api/v1/users/{user_id}`: Fetch user by UUID.
- `PATCH  /api/v1/users/{user_id}`: Update user attributes, role, or active status.
- `DELETE /api/v1/users/{user_id}`: Soft-deactivate user account.

---

## 3. Development Workflow & Commands

### Running Backend Locally

```bash
cd /home/dhairya/Project/CRM/backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Running Tests

```bash
cd /home/dhairya/Project/CRM/backend
uv run pytest -v
```

### Running Migrations

```bash
cd /home/dhairya/Project/CRM/backend
uv run alembic revision --autogenerate -m "<description>"
uv run alembic upgrade head
```

### Seeding Admin Account

```bash
cd /home/dhairya/Project/CRM/backend
uv run python scripts/seed_admin.py
```

Default credentials: `admin@crm.com` / `Admin@123456`.

---

## 4. Coding Standards

- **Layered Architecture:** Routes (`app/api/`) → Services (`app/services/`) → Models (`app/models/`). Keep route handlers lightweight and put business logic inside services.
- **Async Execution:** All database queries must use `AsyncSession` and `await session.execute(...)`.
- **Role Scoping:** Always verify permissions using `require_role(...)` or service-level ownership checks.
- **Documentation:** When adding new endpoints, update [`API_docs.md`](file:///home/dhairya/Project/CRM/API_docs.md) immediately.
