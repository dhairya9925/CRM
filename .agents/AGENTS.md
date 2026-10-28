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
- `POST /api/v1/auth/signup`: Public user self-registration (assigns `sales_rep` role, returns tokens, sets HttpOnly cookies).
- `POST /api/v1/auth/login`: Authenticate with email/password; returns access & refresh tokens, sets HttpOnly cookies.
- `POST /api/v1/auth/refresh`: Rotates refresh token and issues new access token.
- `POST /api/v1/auth/logout`: Clears session cookies.
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

#### Companies (`/api/v1/companies` — Phase 1)
- `POST   /api/v1/companies/`: Create company.
- `GET    /api/v1/companies/`: List companies (search, industry, owner, pagination).
- `GET    /api/v1/companies/{id}`: Get company detail.
- `PATCH  /api/v1/companies/{id}`: Update company attributes.
- `DELETE /api/v1/companies/{id}`: Soft delete company.
- `GET    /api/v1/companies/{id}/contacts`: Contacts belonging to company.
- `GET    /api/v1/companies/{id}/deals`: Deals linked to company.

#### Contacts (`/api/v1/contacts` — Phase 1)
- `POST   /api/v1/contacts/`: Create contact with custom fields.
- `GET    /api/v1/contacts/`: List contacts (search, filter, sort, paginate).
- `GET    /api/v1/contacts/{id}`: Get contact detail.
- `PATCH  /api/v1/contacts/{id}`: Update contact with JSONB merge-patch.
- `DELETE /api/v1/contacts/{id}`: Soft delete contact.
- `GET    /api/v1/contacts/{id}/deals`: Deals linked to contact.
- `GET    /api/v1/contacts/{id}/activities`: Interaction timeline for contact.

#### Leads (`/api/v1/leads` — Phase 2)
- `POST   /api/v1/leads/`: Create lead.
- `GET    /api/v1/leads/`: List leads (search, status, source, assigned_to, is_converted).
- `GET    /api/v1/leads/{id}`: Get lead detail.
- `PATCH  /api/v1/leads/{id}`: Update lead status/attributes.
- `DELETE /api/v1/leads/{id}`: Soft delete lead.
- `PATCH  /api/v1/leads/{id}/assign`: Reassign lead to team member (Manager/Admin).
- `POST   /api/v1/leads/{id}/convert`: Convert lead to Contact and Deal.
- `POST   /api/v1/leads/import`: Bulk import leads via CSV file (Manager/Admin).
- `GET    /api/v1/leads/{id}/activities`: Timeline activities linked to lead.

#### Deals & Sales Pipeline (`/api/v1/deals` — Phase 3)
- `POST   /api/v1/deals/`: Create deal.
- `GET    /api/v1/deals/?kanban=false`: List deals with table pagination.
- `GET    /api/v1/deals/?kanban=true`: Group deals by stage for Kanban board with pipeline totals.
- `GET    /api/v1/deals/{id}`: Get deal detail.
- `PATCH  /api/v1/deals/{id}`: Update deal info.
- `PATCH  /api/v1/deals/{id}/stage`: Move deal stage (logs stage transition activity).
- `DELETE /api/v1/deals/{id}`: Soft delete deal.
- `GET    /api/v1/deals/{id}/activities`: Activity timeline for deal.

#### Tasks & Reminders (`/api/v1/tasks` — Phase 4)
- `POST   /api/v1/tasks/`: Create task.
- `GET    /api/v1/tasks/`: List tasks (assigned_to, status, lead_id, contact_id, deal_id, due_today, overdue).
- `GET    /api/v1/tasks/{id}`: Get task detail.
- `PATCH  /api/v1/tasks/{id}`: Update task attributes.
- `PATCH  /api/v1/tasks/{id}/complete`: Complete task and auto-log activity.
- `DELETE /api/v1/tasks/{id}`: Delete task.

#### Activity Timeline (`/api/v1/activities` — Phase 5)
- `POST   /api/v1/activities/`: Log manual activity (call, email, meeting, note).
- `GET    /api/v1/activities/`: Filter activities by lead, contact, deal, or type.
- `GET    /api/v1/activities/{id}`: Get activity detail.
- `PATCH  /api/v1/activities/{id}`: Update activity notes or outcome.
- `DELETE /api/v1/activities/{id}`: Delete activity.

#### Dashboard & Reports (`/api/v1/dashboard` — Phase 6)
- `GET    /api/v1/dashboard/summary`: Executive KPIs (leads, deals, pipeline value, won value, tasks).
- `GET    /api/v1/dashboard/leads-by-status`: Lead count grouped by status.
- `GET    /api/v1/dashboard/leads-by-source`: Lead count grouped by acquisition channel.
- `GET    /api/v1/dashboard/pipeline`: Pipeline distribution grouped by stage.
- `GET    /api/v1/dashboard/tasks-due-today`: List tasks due today for current user.
- `GET    /api/v1/dashboard/tasks-overdue`: List overdue tasks for current user.

#### Hardening, Traceability & Security (Phase 7)
- **Request Tracing:** `RequestIdMiddleware` injects / propagates `X-Request-ID` across all requests/responses.
- **Throttling (`slowapi`):** 5 req/min on `/api/v1/auth/login`, 3 req/min on `/api/v1/auth/password-reset/request`.
- **Global Error Format:** Unified JSON error envelope with `detail`, `error`, and `request_id`.
- **RBAC Matrix:** Strict role enforcement on admin user-management, CSV imports, and lead reassignments.

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

---

## 4. Coding Standards

- **Layered Architecture:** Routes (`app/api/`) → Services (`app/services/`) → Models (`app/models/`). Keep route handlers lightweight and put business logic inside services.
- **Async Execution:** All database queries must use `AsyncSession` and `await session.execute(...)`.
- **Role Scoping:** Always verify permissions using `require_role(...)` or service-level ownership checks.
- **Documentation:** When adding new endpoints, update [`API_docs.md`](file:///home/dhairya/Project/CRM/API_docs.md) immediately.
