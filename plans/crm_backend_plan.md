# Apex CRM — FastAPI Backend Plan

> **Target directory:** [`/home/dhairya/Project/CRM/backend`](file:///home/dhairya/Project/CRM/backend)  
> **Runtime:** Python 3.12+, FastAPI, SQLAlchemy 2.x (async), PostgreSQL, JWT Auth  
> **Package Manager:** `uv`

---

## Technology Stack Decisions

| Concern | Choice | Rationale |
|---|---|---|
| Web framework | **FastAPI 0.162+** | Already installed; async-native, auto docs |
| ORM | **SQLAlchemy 2.x (async)** | Async sessions, type-safe queries, migrations |
| DB driver | **asyncpg** | Fastest async PostgreSQL driver |
| Migrations | **Alembic** | Standard SQLAlchemy migration tool |
| Auth | **python-jose + passlib[bcrypt]** | JWT tokens, bcrypt hashing |
| Validation | **Pydantic v2** | Already in deps via FastAPI |
| Email | **fastapi-mail** | Password reset emails |
| CSV parsing | **pandas / csv stdlib** | Lead import feature |
| Rate limiting | **slowapi** | Bruteforce protection on auth endpoints |
| Testing | **pytest-asyncio + httpx** | Async-aware API tests |
| Config | **pydantic-settings** | 12-factor `.env` configuration |
| CORS | **FastAPI middleware** | Frontend integration |

---

## Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app factory, lifespan
│   ├── config.py                # Settings via pydantic-settings
│   ├── database.py              # Async engine, SessionLocal, Base
│   │
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── contact.py
│   │   ├── company.py
│   │   ├── lead.py
│   │   ├── deal.py
│   │   ├── task.py
│   │   ├── activity.py
│   │   └── audit_log.py
│   │
│   ├── schemas/                 # Pydantic v2 request/response schemas
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── contact.py
│   │   ├── company.py
│   │   ├── lead.py
│   │   ├── deal.py
│   │   ├── task.py
│   │   ├── activity.py
│   │   └── dashboard.py
│   │
│   ├── api/                     # Route handlers, grouped by domain
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py        # Mounts all v1 sub-routers
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── contacts.py
│   │   │   ├── companies.py
│   │   │   ├── leads.py
│   │   │   ├── deals.py
│   │   │   ├── tasks.py
│   │   │   ├── activities.py
│   │   │   └── dashboard.py
│   │
│   ├── core/                    # Cross-cutting concerns
│   │   ├── __init__.py
│   │   ├── security.py          # JWT create/verify, password hash
│   │   ├── permissions.py       # Role checks, ownership guards
│   │   ├── dependencies.py      # get_db, get_current_user, require_role
│   │   ├── exceptions.py        # Custom HTTP exceptions
│   │   └── middleware.py        # Audit logging, request ID
│   │
│   ├── services/                # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── contact_service.py
│   │   ├── company_service.py
│   │   ├── lead_service.py
│   │   ├── deal_service.py
│   │   ├── task_service.py
│   │   ├── activity_service.py
│   │   ├── dashboard_service.py
│   │   └── csv_import_service.py
│   │
│   └── utils/
│       ├── __init__.py
│       ├── pagination.py        # Reusable Page[T] response wrapper
│       ├── filters.py           # Generic filter builder helpers
│       └── audit.py             # Audit log helper
│
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│
├── tests/
│   ├── conftest.py              # Async test DB, client fixtures
│   ├── test_auth.py
│   ├── test_contacts.py
│   ├── test_leads.py
│   ├── test_deals.py
│   └── test_dashboard.py
│
├── .env.example
├── pyproject.toml
├── alembic.ini
└── main.py                      # Entrypoint: uvicorn app.main:app
```

---

## Database Schema (ERD)

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email UK
        string hashed_password
        string full_name
        string role
        bool is_active
        datetime created_at
    }
    COMPANIES {
        uuid id PK
        string name
        string website
        string industry
        string phone
        string address
        uuid owner_id FK
        datetime created_at
    }
    CONTACTS {
        uuid id PK
        string first_name
        string last_name
        string email UK
        string phone
        uuid company_id FK
        uuid owner_id FK
        jsonb custom_fields
        datetime created_at
    }
    LEADS {
        uuid id PK
        string first_name
        string last_name
        string email
        string phone
        string source
        string status
        uuid assigned_to FK
        uuid converted_contact_id FK
        uuid converted_deal_id FK
        datetime created_at
    }
    DEALS {
        uuid id PK
        string name
        decimal value
        string stage
        date expected_close_date
        uuid owner_id FK
        uuid contact_id FK
        uuid company_id FK
        datetime created_at
    }
    TASKS {
        uuid id PK
        string title
        string type
        string priority
        string status
        datetime due_date
        uuid assigned_to FK
        uuid lead_id FK
        uuid contact_id FK
        uuid deal_id FK
        datetime created_at
    }
    ACTIVITIES {
        uuid id PK
        string type
        string notes
        string outcome
        uuid performed_by FK
        uuid lead_id FK
        uuid contact_id FK
        uuid deal_id FK
        datetime occurred_at
    }
    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        string entity_type
        uuid entity_id
        string action
        jsonb changes
        datetime created_at
    }

    USERS ||--o{ COMPANIES : owns
    USERS ||--o{ CONTACTS : owns
    USERS ||--o{ LEADS : assigned_to
    USERS ||--o{ DEALS : owns
    USERS ||--o{ TASKS : assigned_to
    USERS ||--o{ ACTIVITIES : performed
    CONTACTS }o--|| COMPANIES : belongs_to
    LEADS }o--o| CONTACTS : converts_to
    LEADS }o--o| DEALS : converts_to
    DEALS }o--|| CONTACTS : primary_contact
    TASKS }o--o| LEADS : linked_to
    TASKS }o--o| CONTACTS : linked_to
    TASKS }o--o| DEALS : linked_to
    ACTIVITIES }o--o| LEADS : linked_to
    ACTIVITIES }o--o| CONTACTS : linked_to
    ACTIVITIES }o--o| DEALS : linked_to
```

---

## API Endpoint Map

### Auth `/api/v1/auth`
| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/register` | Create user account | Admin only |
| POST | `/login` | Issue JWT access + refresh tokens | Public |
| POST | `/refresh` | Rotate access token from refresh token | Public |
| POST | `/logout` | Invalidate refresh token | Bearer |
| POST | `/password-reset/request` | Send reset email | Public |
| POST | `/password-reset/confirm` | Reset password via token | Public |
| GET | `/me` | Get current user profile | Bearer |
| PATCH | `/me` | Update current user profile | Bearer |

### Users `/api/v1/users` — Admin only
| Method | Path | Description |
|---|---|---|
| GET | `/` | List all users (paginated) |
| GET | `/{user_id}` | Get single user |
| PATCH | `/{user_id}` | Update role or status |
| DELETE | `/{user_id}` | Deactivate account |

### Contacts `/api/v1/contacts`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Create contact |
| GET | `/` | List contacts (search, filter, sort, paginate) |
| GET | `/{id}` | Get contact detail |
| PATCH | `/{id}` | Update contact |
| DELETE | `/{id}` | Soft-delete contact |
| GET | `/{id}/activities` | Contact activity timeline |
| GET | `/{id}/deals` | All deals linked to contact |
| GET | `/{id}/tasks` | All tasks linked to contact |

### Companies `/api/v1/companies`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Create company |
| GET | `/` | List companies (search, filter, paginate) |
| GET | `/{id}` | Get company detail |
| PATCH | `/{id}` | Update company |
| DELETE | `/{id}` | Soft-delete company |
| GET | `/{id}/contacts` | Contacts belonging to company |
| GET | `/{id}/deals` | Deals linked to company |

### Leads `/api/v1/leads`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Create lead manually |
| GET | `/` | List leads (filter by status, source, assignee) |
| GET | `/{id}` | Get lead detail |
| PATCH | `/{id}` | Update lead |
| DELETE | `/{id}` | Delete / mark lost |
| PATCH | `/{id}/assign` | Re-assign to another team member |
| POST | `/{id}/convert` | Convert lead to Contact + Deal |
| POST | `/import` | Bulk import via CSV upload |

### Deals `/api/v1/deals`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Create deal |
| GET | `/` | List deals (kanban or table, filter by stage/owner) |
| GET | `/{id}` | Get deal detail |
| PATCH | `/{id}` | Update deal info |
| PATCH | `/{id}/stage` | Move deal to a different stage |
| DELETE | `/{id}` | Delete deal |
| GET | `/{id}/activities` | Deal activity timeline |
| GET | `/{id}/tasks` | Tasks linked to deal |

### Tasks `/api/v1/tasks`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Create task |
| GET | `/` | List tasks (filter: due today, overdue, assignee) |
| GET | `/{id}` | Get task detail |
| PATCH | `/{id}` | Update task |
| PATCH | `/{id}/complete` | Mark task complete |
| DELETE | `/{id}` | Delete task |

### Activities `/api/v1/activities`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Log an activity (call, email, meeting, note) |
| GET | `/` | List activities (filter by type, entity, date range) |
| GET | `/{id}` | Get activity detail |
| PATCH | `/{id}` | Edit activity notes / outcome |
| DELETE | `/{id}` | Delete activity |

### Dashboard `/api/v1/dashboard`
| Method | Path | Description |
|---|---|---|
| GET | `/summary` | KPI aggregate: leads count, deals, revenue |
| GET | `/leads-by-status` | Lead counts grouped by status |
| GET | `/leads-by-source` | Lead counts grouped by source |
| GET | `/pipeline` | Per-stage deal count + total value |
| GET | `/tasks-due-today` | Tasks due today for current user |
| GET | `/tasks-overdue` | Overdue tasks count |

### System
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check (DB ping) |
| GET | `/docs` | Swagger UI (dev only) |
| GET | `/redoc` | ReDoc (dev only) |

---

## Authentication & Authorization Design

### JWT Strategy
- **Access Token**: Short-lived (15 min), signed with `HS256`, contains `user_id`, `role`, `exp`
- **Refresh Token**: Long-lived (7 days), stored in `HttpOnly` cookie, rotated on each use, one-per-session
- **Password Reset Token**: One-time OTP stored in DB, expires in 15 min

### Roles & RBAC Matrix

| Resource | Admin | Sales Manager | Sales Rep |
|---|---|---|---|
| Create/deactivate Users | ✅ | ❌ | ❌ |
| View all records | ✅ | ✅ (team) | ✅ (owned) |
| Edit any record | ✅ | ✅ (team) | ✅ (owned) |
| Delete any record | ✅ | ❌ | ❌ |
| Reassign leads/deals | ✅ | ✅ | ❌ |
| View dashboard (all) | ✅ | ✅ | ❌ |
| Import CSV leads | ✅ | ✅ | ❌ |
| View audit log | ✅ | ❌ | ❌ |

### Audit Logging
Every `CREATE`, `UPDATE`, `DELETE` on protected entities writes to `audit_logs` with `entity_type`, `entity_id`, `action`, `user_id`, `changes` (JSON diff), `created_at`. Implemented as a helper called from service methods.

---

## Phase 0 — Project Foundation & Auth

**Goal:** Working FastAPI app that boots, connects to DB, and provides secure JWT authentication.

### Tasks
- [ ] Install all required packages via `uv add`:
  - `sqlalchemy[asyncio]` `asyncpg` `alembic`
  - `python-jose[cryptography]` `passlib[bcrypt]`
  - `pydantic-settings` `python-dotenv`
  - `slowapi` `fastapi-mail`
  - `pytest-asyncio` `httpx` (dev deps)
- [ ] `app/config.py` — pydantic-settings `Settings` class loading from `.env`
- [ ] `app/database.py` — async SQLAlchemy engine, `AsyncSession` factory, `Base`, `get_db` dep
- [ ] `app/models/user.py` — `id` (UUID PK), `email`, `hashed_password`, `full_name`, `role` enum, `is_active`, timestamps
- [ ] `app/core/security.py` — `hash_password`, `verify_password`, `create_access_token`, `create_refresh_token`, `decode_token`
- [ ] `app/core/dependencies.py` — `get_current_user`, `require_role(*roles)`, `require_owner_or_admin`
- [ ] `app/api/v1/auth.py` — all 8 auth endpoints
- [ ] `app/main.py` — app factory, CORS, lifespan, router registration, `/api/health`
- [ ] Alembic init + first migration for `users` table
- [ ] Seed script: create first admin user from `.env`

### Deliverable
```
POST /api/v1/auth/login → { access_token, token_type }
GET  /api/v1/auth/me    → { id, email, full_name, role }
GET  /api/health        → { status: "ok", db: "connected" }
```

---

## Phase 1 — Contact & Company Management

**Goal:** Full CRUD for contacts and companies with search, filter, sort, pagination.

### Tasks
- [ ] `app/models/company.py` — `name`, `website`, `industry`, `phone`, `address`, `owner_id`, `is_deleted`, timestamps
- [ ] `app/models/contact.py` — `first_name`, `last_name`, `email`, `phone`, `company_id` FK, `owner_id`, `notes`, `custom_fields` JSONB, `is_deleted`, timestamps
- [ ] Alembic migration for both tables
- [ ] `app/utils/pagination.py` — generic `Page[T]` schema + `paginate()` helper
- [ ] `app/utils/filters.py` — `apply_search()` (ILIKE), `apply_sort()` (safe column sort)
- [ ] Pydantic schemas — `CompanyCreate/Update/Response`, `ContactCreate/Update/Response`
- [ ] `app/services/company_service.py` — CRUD + ownership check
- [ ] `app/services/contact_service.py` — CRUD + JSONB merge-patch for custom fields
- [ ] `app/api/v1/contacts.py` + `companies.py` — all routes including sub-resource endpoints
- [ ] Audit logging on write operations

### Key Query Parameters
```
GET /api/v1/contacts?search=john&company_id=&owner_id=&sort_by=created_at&sort_order=desc&page=1&page_size=20
```

### Deliverable
```
GET  /api/v1/contacts?search=john&page=1 → Page[ContactResponse]
POST /api/v1/contacts                    → ContactResponse
GET  /api/v1/contacts/{id}/activities   → []
```

---

## Phase 2 — Lead Management

**Goal:** Full lead lifecycle from intake to conversion, with CSV bulk import.

### Tasks
- [ ] `app/models/lead.py`:
  - `first_name`, `last_name`, `email`, `phone`, `company_name`
  - `source` enum: `website | referral | ads | cold_outreach | event | other`
  - `status` enum: `new | contacted | qualified | lost`
  - `assigned_to` FK, `converted_contact_id` FK, `converted_deal_id` FK, `is_converted`
- [ ] Alembic migration for `leads` table
- [ ] Pydantic schemas — `LeadCreate`, `LeadUpdate`, `LeadAssign`, `LeadConvertRequest`, `LeadResponse`, `LeadImportRow`
- [ ] `app/services/lead_service.py`:
  - `create_lead`, `get_lead`, `list_leads`, `update_lead`, `delete_lead`
  - `assign_lead(lead_id, user_id)` — Manager/Admin only
  - `convert_lead(lead_id, deal_data)`:
    1. Create `Contact` from lead fields
    2. Create `Deal` from `deal_data` linked to new contact
    3. Mark lead `is_converted=True`, store `converted_contact_id` + `converted_deal_id`
    4. Emit conversion `Activity` record
- [ ] `app/services/csv_import_service.py`:
  - Accept `UploadFile` (CSV), max 5 MB / 5000 rows
  - Validate each row against `LeadImportRow` schema
  - Bulk-insert valid rows, return `{ imported, failed, errors }`
- [ ] `app/api/v1/leads.py` — CRUD + `/assign` + `/convert` + `/import`
- [ ] Role guard: only Admin/Manager can reassign or import

### Deliverable
```
POST /api/v1/leads/import       → { imported: 42, failed: 2, errors: [...] }
POST /api/v1/leads/{id}/convert → { contact_id, deal_id }
GET  /api/v1/leads?status=new&source=referral → Page[LeadResponse]
```

---

## Phase 3 — Sales Pipeline & Deal Management

**Goal:** Deal CRUD with stage management suitable for Kanban and table views.

### Tasks
- [ ] `app/models/deal.py`:
  - `name`, `value` (Numeric), `stage` enum, `expected_close_date` (Date)
  - `owner_id`, `contact_id`, `company_id` FKs, `is_deleted`, timestamps
  - Stage enum: `qualification | proposal | negotiation | won | lost`
- [ ] Alembic migration for `deals` table
- [ ] Pydantic schemas — `DealCreate`, `DealUpdate`, `DealStageUpdate`, `DealResponse`, `DealKanbanResponse`
- [ ] `app/services/deal_service.py`:
  - Standard CRUD + `move_stage()` with transition validation
  - `list_deals()` — flat table OR grouped-by-stage (Kanban)
  - `get_pipeline_summary()` — per-stage counts + total value
  - `get_total_active_value()` — sum excluding won/lost
- [ ] `app/api/v1/deals.py`:
  - `GET /deals?kanban=true` → `{ stages: [DealKanbanResponse] }`
  - `GET /deals?kanban=false` → `Page[DealResponse]`
  - `PATCH /{id}/stage` — validates transition, emits stage-change activity
- [ ] Emit `Activity` record on stage change

### Deliverable
```
GET   /api/v1/deals?kanban=true → { stages: [{ stage, deals, total_value }] }
PATCH /api/v1/deals/{id}/stage  → { id, stage: "proposal" }
```

---

## Phase 4 — Tasks, Reminders & Follow-ups

**Goal:** Task management linked to any CRM entity, with due date filtering.

### Tasks
- [ ] `app/models/task.py`:
  - `title`, `description`, `type` enum (call/meeting/email/follow_up/other)
  - `priority` enum (low/medium/high), `status` enum (pending/in_progress/done/cancelled)
  - `due_date` (DateTime), `assigned_to` FK
  - `lead_id`, `contact_id`, `deal_id` — nullable FKs (at least one required)
- [ ] Alembic migration for `tasks` table
- [ ] Pydantic schemas — `TaskCreate`, `TaskUpdate`, `TaskComplete`, `TaskResponse`
- [ ] `app/services/task_service.py`:
  - `create_task`, `get_task`, `update_task`, `complete_task`, `delete_task`
  - `list_tasks(assigned_to, status, due_before, due_after, entity_type, entity_id)`
  - `get_tasks_due_today(user_id)` — due_date is today
  - `get_overdue_tasks(user_id)` — `due_date < now() AND status = pending`
- [ ] `app/api/v1/tasks.py`:
  - `PATCH /{id}/complete` — sets status + logs completion activity
  - Filters: `?assigned_to=&status=&due_today=true&overdue=true`

### Deliverable
```
GET   /api/v1/tasks?due_today=true  → [TaskResponse]
GET   /api/v1/tasks?overdue=true    → [TaskResponse]
PATCH /api/v1/tasks/{id}/complete   → TaskResponse
```

---

## Phase 5 — Activity Timeline

**Goal:** Append-only interaction log powering the per-customer history view.

> [!IMPORTANT]
> The `activity_service.log_activity()` function should be wired into Phases 2, 3, and 4 services as those emit events. Phase 5 adds the **API routes** and **manual logging** endpoint.

### Tasks
- [ ] `app/models/activity.py`:
  - `type` enum: `call | email | meeting | note | status_change | stage_change`
  - `notes` (Text), `outcome` (Text nullable), `performed_by` FK
  - `lead_id`, `contact_id`, `deal_id` — nullable FKs
  - `occurred_at` (DateTime, default now), `metadata` (JSONB)
- [ ] Alembic migration for `activities` table
- [ ] Pydantic schemas — `ActivityCreate`, `ActivityUpdate`, `ActivityResponse`
- [ ] `app/services/activity_service.py`:
  - `log_activity(type, notes, performed_by, **entity_ids)` — internal helper
  - `list_activities(entity_type, entity_id, activity_type, date_from, date_to)`
- [ ] `app/api/v1/activities.py`:
  - `POST /` — manually log call/email/meeting/note
  - `GET /?contact_id=&deal_id=&lead_id=&type=&from=&to=`
- [ ] `app/utils/audit.py` — audit helper calling into this service

### Deliverable
```
GET  /api/v1/activities?contact_id={uuid}&type=call → [ActivityResponse]
POST /api/v1/activities → ActivityResponse
```

---

## Phase 6 — Dashboard & Reports

**Goal:** Aggregated metrics and report endpoints powering the CRM overview.

### Tasks
- [ ] `app/services/dashboard_service.py` with SQLAlchemy `func` aggregates:
  - `get_summary(user_id, role)` → total/new leads, open deals + pipeline value, won/lost counts
  - `get_leads_by_status()` → `[{ status, count }]`
  - `get_leads_by_source()` → `[{ source, count }]`
  - `get_pipeline_by_stage()` → `[{ stage, deal_count, total_value }]`
  - `get_tasks_due_today(user_id)`, `get_overdue_tasks(user_id)`
- [ ] Pydantic schemas — `DashboardSummaryResponse`, `PipelineStageData`, `LeadGroupData`
- [ ] Role-based result scoping: Admin = all, Manager = team, Rep = owned
- [ ] `app/api/v1/dashboard.py` — read-only `GET` routes only

### Deliverable
```
GET /api/v1/dashboard/summary → {
  total_leads, new_leads_this_week,
  open_deals, pipeline_value,
  won_deals_this_month, won_value_this_month,
  tasks_due_today, overdue_tasks
}
GET /api/v1/dashboard/pipeline → [{ stage, deal_count, total_value }]
```

---

## Phase 7 — Hardening, Testing & Docs

**Goal:** Production-ready quality — tests, error handling, rate limiting, Swagger polish.

### Tasks
- [ ] `tests/conftest.py` — async test DB, `AsyncClient` fixture, entity factory helpers
- [ ] Integration tests for auth, contacts, leads, deals, RBAC enforcement
- [ ] Global exception handlers in `app/core/exceptions.py`:
  - `NotFoundException` → 404
  - `ForbiddenException` → 403
  - `ConflictException` → 409 (duplicate email)
  - `ValidationException` → 422
  - Unhandled → 500 with `X-Request-ID`
- [ ] `slowapi` rate limiting: 5 req/min on `/login`, 3 req/min on password-reset
- [ ] `X-Request-ID` header middleware for traceability
- [ ] Full Swagger metadata: `summary`, `description`, `response_model`, `tags` on all routes
- [ ] `.env.example` with all required variable names
- [ ] Clean `alembic upgrade head` from fresh state

---

## Environment Variables (`.env.example`)

```ini
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/apex_crm

# Security
SECRET_KEY=change-me-to-a-long-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
PASSWORD_RESET_EXPIRE_MINUTES=15

# Email (password reset)
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=noreply@apexcrm.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_STARTTLS=True
MAIL_SSL_TLS=False

# App
APP_ENV=development
DEBUG=True
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Seed admin
ADMIN_EMAIL=admin@apexcrm.com
ADMIN_PASSWORD=changeme!123
```

---

## Implementation Order Summary

```
Phase 0: Foundation & Auth       ← Everything depends on this
Phase 1: Contacts & Companies    ← Core data entities
Phase 2: Lead Management         ← Funnel intake + CSV import
Phase 3: Deal Pipeline           ← Revenue tracking
Phase 4: Tasks & Reminders       ← Productivity layer
Phase 5: Activity Timeline       ← Wired during phases 2-4, API added here
Phase 6: Dashboard & Reports     ← Read-only aggregation
Phase 7: Tests, Hardening, Docs  ← Finish & ship
```

> [!TIP]
> Use `uv add <package>` for all new dependencies so `pyproject.toml` and `uv.lock` stay in sync. Never install packages globally.
