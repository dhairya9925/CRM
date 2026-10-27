# Apex CRM — API Documentation (`API_docs.md`)

> **Base URL (Local):** `http://localhost:8000`  
> **API Version Prefix:** `/api/v1`  
> **Interactive Swagger UI:** `http://localhost:8000/docs`  
> **ReDoc Alternative:** `http://localhost:8000/redoc`

---

## 1. Authentication & Security Architecture

### Token Standards
- **Access Token:** Short-lived JWT (`HS256`, 15-minute expiry). Returned in JSON response and set as `HttpOnly` cookie `access_token`. Can also be sent in requests via header:
  ```http
  Authorization: Bearer <access_token>
  ```
- **Refresh Token:** Long-lived JWT (7-day expiry). Set automatically as an `HttpOnly` cookie `refresh_token` on login/refresh, and also returned in the JSON payload for clients requiring programmatic storage.
- **Dual Authentication Support:** Endpoints accept tokens either from the `Authorization: Bearer <token>` header OR automatically from the `access_token` cookie sent by the browser.
- **Password Hashes:** Hashed using `bcrypt` (12 rounds).
- **Roles:**
  - `admin`: Full system access, user provisioning, role assignments, audit logs.
  - `sales_manager`: Manages team records, reassigns leads/deals.
  - `sales_rep`: Manages owned records, pipeline execution.

---

## 2. System Endpoints

### 2.1 Service & Database Health Check
- **Endpoint:** `GET /api/health`
- **Auth:** Public
- **Description:** Verifies service uptime and active PostgreSQL database connectivity.
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "db": "connected",
    "version": "1.0.0",
    "environment": "development"
  }
  ```

---

## 3. Auth Endpoints (`/api/v1/auth`)

### 3.0 User Public Signup / Registration
- **Endpoint:** `POST /api/v1/auth/signup`
- **Auth:** Public
- **Description:** Allows a new user to self-register. Creates account with `sales_rep` role and returns access & refresh tokens, while setting HttpOnly auth cookies.
- **Request Body:**
  ```json
  {
    "full_name": "Alex Mercer",
    "email": "alex@crm.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer",
    "expires_in": 900
  }
  ```
- **Cookies Set:** `access_token`, `refresh_token`
- **Error Responses:**
  - `409 Conflict`: Email already registered.
  - `422 Unprocessable Entity`: Validation failure (short password, invalid email).

### 3.1 User Login
- **Endpoint:** `POST /api/v1/auth/login`
- **Auth:** Public
- **Description:** Authenticates user via email and password. Supports both JSON body and OAuth2 form data (for Swagger UI). Sets `refresh_token` as an `HttpOnly` cookie.
- **Request Body:**
  ```json
  {
    "email": "admin@crm.com",
    "password": "Admin@123456"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer",
    "expires_in": 900
  }
  ```
- **Cookies Set:**
  - `access_token`: `<jwt>` (`HttpOnly`, `Path=/`, `Max-Age=900`, `SameSite=Lax`)
  - `refresh_token`: `<jwt>` (`HttpOnly`, `Path=/`, `Max-Age=604800`, `SameSite=Lax`)
- **Error Responses:**
  - `401 Unauthorized`: Invalid email or password.
  - `403 Forbidden`: Account deactivated.

---

### 3.2 Token Refresh
- **Endpoint:** `POST /api/v1/auth/refresh`
- **Auth:** Public (requires valid refresh token)
- **Description:** Issues a new access token and rotated refresh token. Accepts the refresh token from either the JSON body or the `HttpOnly` cookie.
- **Request Body (Optional if sent in cookie):**
  ```json
  {
    "refresh_token": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer",
    "expires_in": 900
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Token expired or malformed.

---

### 3.3 User Logout
- **Endpoint:** `POST /api/v1/auth/logout`
- **Auth:** `Bearer <access_token>`
- **Description:** Clears the `refresh_token` session cookie.
- **Response (200 OK):**
  ```json
  {
    "message": "Successfully logged out"
  }
  ```

---

### 3.4 Get Current User Profile
- **Endpoint:** `GET /api/v1/auth/me`
- **Auth:** `Bearer <access_token>`
- **Description:** Returns profile and role of the currently logged-in user.
- **Response (200 OK):**
  ```json
  {
    "id": "c1f7a8b4-0231-482a-9214-41d3bb127810",
    "email": "admin@crm.com",
    "full_name": "Apex Administrator",
    "role": "admin",
    "is_active": true,
    "created_at": "2026-10-27T11:20:50.123456Z",
    "updated_at": "2026-10-27T11:20:50.123456Z"
  }
  ```

---

### 3.5 Update Current User Profile
- **Endpoint:** `PATCH /api/v1/auth/me`
- **Auth:** `Bearer <access_token>`
- **Description:** Allows user to update their name or change their password.
- **Request Body:**
  ```json
  {
    "full_name": "Jane Doe",
    "password": "NewSecurePassword123!"
  }
  ```
- **Response (200 OK):** Updated user profile object.

---

### 3.6 Register User (Admin Only)
- **Endpoint:** `POST /api/v1/auth/register`
- **Auth:** `Bearer <access_token>` (`admin` role required)
- **Description:** Provisions a new user account with specified role.
- **Request Body:**
  ```json
  {
    "email": "rep1@crm.com",
    "password": "InitialPassword123!",
    "full_name": "Alex Rep",
    "role": "sales_rep",
    "is_active": true
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "e2f1a8b4-1122-482a-9214-55d3bb127811",
    "email": "rep1@crm.com",
    "full_name": "Alex Rep",
    "role": "sales_rep",
    "is_active": true,
    "created_at": "2026-10-27T11:25:00.000000Z",
    "updated_at": "2026-10-27T11:25:00.000000Z"
  }
  ```
- **Error Responses:**
  - `403 Forbidden`: Caller is not an admin.
  - `409 Conflict`: Email already registered.

---

### 3.7 Password Reset Request
- **Endpoint:** `POST /api/v1/auth/password-reset/request`
- **Auth:** Public
- **Description:** Requests a 15-minute single-use password reset token. In development mode, the generated token is returned in the message for testing.
- **Request Body:**
  ```json
  {
    "email": "user@crm.com"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "If the email is registered, password reset instructions have been generated. [Dev Token: <token>]"
  }
  ```

---

### 3.8 Password Reset Confirm
- **Endpoint:** `POST /api/v1/auth/password-reset/confirm`
- **Auth:** Public
- **Description:** Resets user password using the token issued in step 3.7.
- **Request Body:**
  ```json
  {
    "token": "4e7K1_x8l_DevTokenString...",
    "new_password": "NewSecretPassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Password has been reset successfully"
  }
  ```

---

## 4. User Management Endpoints (`/api/v1/users`) — Admin Only

### 4.1 List Users
- **Endpoint:** `GET /api/v1/users/`
- **Auth:** `Bearer <access_token>` (`admin` role required)
- **Query Parameters:**
  - `skip` (int, default: 0)
  - `limit` (int, default: 50, max: 100)
  - `role` (string, optional: `admin`, `sales_manager`, `sales_rep`)
  - `is_active` (boolean, optional: `true`, `false`)
- **Response (200 OK):** Array of `UserResponse` objects.

---

### 4.2 Get User by ID
- **Endpoint:** `GET /api/v1/users/{user_id}`
- **Auth:** `Bearer <access_token>` (`admin` role required)
- **Response (200 OK):** Single `UserResponse` object.
- **Error Responses:** `404 Not Found`.

---

### 4.3 Update User
- **Endpoint:** `PATCH /api/v1/users/{user_id}`
- **Auth:** `Bearer <access_token>` (`admin` role required)
- **Request Body:**
  ```json
  {
    "full_name": "Updated Name",
    "role": "sales_manager",
    "is_active": true
  }
  ```
- **Response (200 OK):** Updated `UserResponse` object.

---

### 4.4 Deactivate User
- **Endpoint:** `DELETE /api/v1/users/{user_id}`
- **Auth:** `Bearer <access_token>` (`admin` role required)
- **Description:** Sets `is_active=False` (soft-deactivation). Prevents user from logging in.
- **Response (200 OK):**
  ```json
  {
    "message": "User rep1@crm.com has been deactivated"
  }
  ```

---

## 5. Company Management Endpoints (`/api/v1/companies`)

### 5.1 Create Company
- **Endpoint:** `POST /api/v1/companies/`
- **Auth:** `Bearer <access_token>` or cookie
- **Request Body:**
  ```json
  {
    "name": "Acme Innovations Ltd",
    "website": "https://acme.com",
    "industry": "Software",
    "phone": "+1 555-0199",
    "address": "100 Market St, San Francisco, CA"
  }
  ```
- **Response (201 Created):** `CompanyResponse`

### 5.2 List Companies
- **Endpoint:** `GET /api/v1/companies/`
- **Auth:** `Bearer <access_token>` or cookie
- **Query Parameters:** `search`, `industry`, `owner_id`, `page` (default: 1), `page_size` (default: 20)
- **Response (200 OK):** `Page[CompanyResponse]`

### 5.3 Get Company by ID
- **Endpoint:** `GET /api/v1/companies/{company_id}`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):** `CompanyResponse`

### 5.4 Update Company
- **Endpoint:** `PATCH /api/v1/companies/{company_id}`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):** `CompanyResponse`

### 5.5 Delete Company
- **Endpoint:** `DELETE /api/v1/companies/{company_id}`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):** `{"message": "Company deleted successfully"}`

### 5.6 Get Company Contacts
- **Endpoint:** `GET /api/v1/companies/{company_id}/contacts`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):** `List[ContactResponse]`

### 5.7 Get Company Deals
- **Endpoint:** `GET /api/v1/companies/{company_id}/deals`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):** `List[DealResponse]`

---

## 6. Contact Management Endpoints (`/api/v1/contacts`)

### 6.1 Create Contact
- **Endpoint:** `POST /api/v1/contacts/`
- **Auth:** `Bearer <access_token>` or cookie
- **Request Body:**
  ```json
  {
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@example.com",
    "phone": "+1 415-555-0123",
    "company_id": "90d1f3f2-1234-4a5b-bce9-1f48651c6b24",
    "notes": "Decision maker for CRM rollout",
    "custom_fields": {
      "tier": "gold",
      "lead_score": 92
    }
  }
  ```
- **Response (201 Created):** `ContactResponse`

### 6.2 List Contacts
- **Endpoint:** `GET /api/v1/contacts/`
- **Auth:** `Bearer <access_token>` or cookie
- **Query Parameters:**
  - `search` (name, email, phone)
  - `company_id` (UUID)
  - `owner_id` (UUID)
  - `sort_by` (`created_at`, `first_name`, `last_name`)
  - `sort_order` (`asc`, `desc`)
  - `page` (int, default: 1)
  - `page_size` (int, default: 20)
- **Response (200 OK):** `Page[ContactResponse]`

### 6.3 Get Contact by ID
- **Endpoint:** `GET /api/v1/contacts/{contact_id}`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):** `ContactResponse`

### 6.4 Update Contact (with JSONB Merge-Patch)
- **Endpoint:** `PATCH /api/v1/contacts/{contact_id}`
- **Auth:** `Bearer <access_token>` or cookie
- **Description:** Supports partial updating of attributes and automatic shallow merge of `custom_fields`.
- **Response (200 OK):** `ContactResponse`

### 6.5 Delete Contact
- **Endpoint:** `DELETE /api/v1/contacts/{contact_id}`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):** `{"message": "Contact deleted successfully"}`

### 6.6 Contact Deals & Activities
- `GET /api/v1/contacts/{contact_id}/deals`: Returns linked deals.
- `GET /api/v1/contacts/{contact_id}/activities`: Returns interaction timeline.

---

## 7. Lead Management Endpoints (`/api/v1/leads`)

### 7.1 Create Lead
- **Endpoint:** `POST /api/v1/leads/`
- **Auth:** `Bearer <access_token>` or cookie
- **Request Body:**
  ```json
  {
    "first_name": "Sarah",
    "last_name": "Connor",
    "email": "sarah@cyberdyne.com",
    "phone": "+1 555-8888",
    "company_name": "Cyberdyne Systems",
    "source": "website",
    "status": "new"
  }
  ```
- **Response (201 Created):** `LeadResponse`

### 7.2 List Leads
- **Endpoint:** `GET /api/v1/leads/`
- **Auth:** `Bearer <access_token>` or cookie
- **Query Parameters:** `search`, `status` (`new`, `contacted`, `qualified`, `lost`), `source`, `assigned_to`, `is_converted`, `page`, `page_size`
- **Response (200 OK):** `Page[LeadResponse]`

### 7.3 Get / Update / Delete Lead
- `GET /api/v1/leads/{lead_id}`: Returns lead details.
- `PATCH /api/v1/leads/{lead_id}`: Updates status, source, or lead contact details. Emits status change Activity.
- `DELETE /api/v1/leads/{lead_id}`: Soft delete lead.

### 7.4 Reassign Lead (Manager/Admin Only)
- **Endpoint:** `PATCH /api/v1/leads/{lead_id}/assign`
- **Auth:** `Bearer <access_token>` (`sales_manager` or `admin` role required)
- **Request Body:**
  ```json
  {
    "assigned_to": "d577f111-9923-4f59-90c6-e34c5727468f"
  }
  ```
- **Response (200 OK):** Updated `LeadResponse`

### 7.5 Convert Lead to Contact + Deal
- **Endpoint:** `POST /api/v1/leads/{lead_id}/convert`
- **Auth:** `Bearer <access_token>` or cookie
- **Description:** Automatically provisions a `Contact` (and `Company` if named) and creates a new `Deal` in the pipeline. Flags lead as `is_converted=True` and records conversion `Activity`.
- **Request Body:**
  ```json
  {
    "deal_name": "Cyberdyne Security Suite",
    "deal_value": 75000.0,
    "expected_close_date": "2026-12-15",
    "create_deal": true
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "lead_id": "...",
    "contact_id": "...",
    "deal_id": "...",
    "message": "Lead successfully converted to Contact and Deal"
  }
  ```

### 7.6 Bulk Import Leads (CSV)
- **Endpoint:** `POST /api/v1/leads/import`
- **Auth:** `Bearer <access_token>` (`sales_manager` or `admin` role required)
- **Payload:** `multipart/form-data` with `file: <leads.csv>`
- **Response (200 OK):**
  ```json
  {
    "imported": 45,
    "failed": 2,
    "errors": [
      { "row": 12, "error": "Missing required first_name or last_name", "data": {...} }
    ]
  }
  ```

---

## 8. Deals & Sales Pipeline Endpoints (`/api/v1/deals`)

### 8.1 Create Deal
- **Endpoint:** `POST /api/v1/deals/`
- **Auth:** `Bearer <access_token>` or cookie
- **Request Body:**
  ```json
  {
    "name": "Global Enterprise Expansion",
    "value": 150000.0,
    "stage": "qualification",
    "expected_close_date": "2026-11-30",
    "contact_id": "...",
    "company_id": "..."
  }
  ```
- **Response (201 Created):** `DealResponse`

### 8.2 List Deals (Table vs. Kanban Mode)
- **Endpoint:** `GET /api/v1/deals/`
- **Auth:** `Bearer <access_token>` or cookie
- **Query Parameters:**
  - `kanban`: `true` or `false`
  - `search`, `stage`, `owner_id`, `company_id`, `contact_id`, `page`, `page_size`
- **Response when `kanban=true` (200 OK):**
  ```json
  {
    "stages": [
      {
        "stage": "qualification",
        "deal_count": 8,
        "total_value": 340000.0,
        "deals": [...]
      },
      {
        "stage": "proposal",
        "deal_count": 5,
        "total_value": 210000.0,
        "deals": [...]
      },
      {
        "stage": "negotiation",
        "deal_count": 3,
        "total_value": 175000.0,
        "deals": [...]
      },
      {
        "stage": "won",
        "deal_count": 12,
        "total_value": 580000.0,
        "deals": [...]
      },
      {
        "stage": "lost",
        "deal_count": 4,
        "total_value": 120000.0,
        "deals": [...]
      }
    ],
    "total_pipeline_value": 725000.0
  }
  ```
- **Response when `kanban=false` (200 OK):** `Page[DealResponse]`

### 8.3 Update Deal Stage (Kanban Move)
- **Endpoint:** `PATCH /api/v1/deals/{deal_id}/stage`
- **Auth:** `Bearer <access_token>` or cookie
- **Description:** Progresses a deal to a new stage and automatically logs a `stage_change` activity in the timeline.
- **Request Body:**
  ```json
  {
    "stage": "proposal"
  }
  ```
- **Response (200 OK):** `DealResponse`

### 8.4 Delete Deal
- **Endpoint:** `DELETE /api/v1/deals/{deal_id}`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):** `{"message": "Deal deleted successfully"}`

### 8.5 Deal Activities Timeline
- **Endpoint:** `GET /api/v1/deals/{deal_id}/activities`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):** `List[ActivityResponse]`

---

## 9. Tasks & Reminders Endpoints (`/api/v1/tasks`)

### 9.1 Create Task
- **Endpoint:** `POST /api/v1/tasks/`
- **Auth:** `Bearer <access_token>` or cookie
- **Request Body:**
  ```json
  {
    "title": "Prepare Q4 contract renewal",
    "description": "Include multi-year discount options",
    "type": "follow_up",
    "priority": "high",
    "status": "pending",
    "due_date": "2026-11-05T14:00:00Z",
    "lead_id": null,
    "contact_id": "c1f7a8b4-0231-482a-9214-41d3bb127810",
    "deal_id": "d577f111-9923-4f59-90c6-e34c5727468f"
  }
  ```
- **Response (201 Created):** `TaskResponse`

### 9.2 List Tasks
- **Endpoint:** `GET /api/v1/tasks/`
- **Auth:** `Bearer <access_token>` or cookie
- **Query Parameters:**
  - `assigned_to` (UUID)
  - `status` (`pending`, `in_progress`, `done`, `cancelled`)
  - `lead_id` (UUID)
  - `contact_id` (UUID)
  - `deal_id` (UUID)
  - `due_today` (`true` or `false`)
  - `overdue` (`true` or `false`)
  - `page` (int, default: 1)
  - `page_size` (int, default: 20)
- **Response (200 OK):** `Page[TaskResponse]`

### 9.3 Get Task by ID
- **Endpoint:** `GET /api/v1/tasks/{task_id}`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):** `TaskResponse`

### 9.4 Update Task
- **Endpoint:** `PATCH /api/v1/tasks/{task_id}`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):** `TaskResponse`

### 9.5 Complete Task
- **Endpoint:** `PATCH /api/v1/tasks/{task_id}/complete`
- **Auth:** `Bearer <access_token>` or cookie
- **Description:** Sets task status to `done` and automatically logs a completion note in the activity timeline.
- **Response (200 OK):** `TaskResponse`

### 9.6 Delete Task
- **Endpoint:** `DELETE /api/v1/tasks/{task_id}`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):** `{"message": "Task deleted successfully"}`

---

## 10. Activity Timeline Endpoints (`/api/v1/activities`)

### 10.1 Log Activity
- **Endpoint:** `POST /api/v1/activities/`
- **Auth:** `Bearer <access_token>` or cookie
- **Request Body:**
  ```json
  {
    "type": "call",
    "notes": "Discovery call with VP of Sales regarding enterprise tier",
    "outcome": "Follow-up proposal requested",
    "lead_id": null,
    "contact_id": "c1f7a8b4-0231-482a-9214-41d3bb127810",
    "deal_id": null,
    "extra_data": {
      "duration_minutes": 30
    }
  }
  ```
- **Response (201 Created):** `ActivityResponse`

### 10.2 List Activities
- **Endpoint:** `GET /api/v1/activities/`
- **Auth:** `Bearer <access_token>` or cookie
- **Query Parameters:**
  - `lead_id` (UUID)
  - `contact_id` (UUID)
  - `deal_id` (UUID)
  - `type` (`call`, `email`, `meeting`, `note`, `status_change`, `stage_change`, `conversion`)
  - `limit` (int, default: 50)
- **Response (200 OK):** `List[ActivityResponse]`

### 10.3 Get Activity by ID
- **Endpoint:** `GET /api/v1/activities/{activity_id}`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):** `ActivityResponse`

### 10.4 Update Activity
- **Endpoint:** `PATCH /api/v1/activities/{activity_id}`
- **Auth:** `Bearer <access_token>` or cookie
- **Request Body:**
  ```json
  {
    "notes": "Follow-up completed and pricing confirmed",
    "outcome": "Meeting scheduled",
    "extra_data": { "duration_minutes": 45 }
  }
  ```
- **Response (200 OK):** `ActivityResponse`

### 10.5 Delete Activity
- **Endpoint:** `DELETE /api/v1/activities/{activity_id}`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):** `{"message": "Activity deleted successfully"}`

---

## 11. Dashboard & Reports Endpoints (`/api/v1/dashboard`)

### 11.1 Executive Summary KPIs
- **Endpoint:** `GET /api/v1/dashboard/summary`
- **Auth:** `Bearer <access_token>` or cookie
- **Description:** Aggregates real-time performance indicators scoped to the user role (reps see owned records, managers/admins see organization-wide).
- **Response (200 OK):**
  ```json
  {
    "total_leads": 42,
    "new_leads_this_week": 8,
    "open_deals": 14,
    "pipeline_value": 725000.0,
    "won_deals": 12,
    "won_value": 580000.0,
    "tasks_due_today": 3,
    "overdue_tasks": 1
  }
  ```

### 11.2 Leads by Status Distribution
- **Endpoint:** `GET /api/v1/dashboard/leads-by-status`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):**
  ```json
  [
    { "label": "new", "count": 18 },
    { "label": "contacted", "count": 12 },
    { "label": "qualified", "count": 8 },
    { "label": "lost", "count": 4 }
  ]
  ```

### 11.3 Leads by Source Distribution
- **Endpoint:** `GET /api/v1/dashboard/leads-by-source`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):**
  ```json
  [
    { "label": "website", "count": 22 },
    { "label": "referral", "count": 10 },
    { "label": "ads", "count": 6 },
    { "label": "cold_outreach", "count": 4 }
  ]
  ```

### 11.4 Pipeline Distribution by Stage
- **Endpoint:** `GET /api/v1/dashboard/pipeline`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):**
  ```json
  [
    { "stage": "qualification", "deal_count": 8, "total_value": 340000.0 },
    { "stage": "proposal", "deal_count": 5, "total_value": 210000.0 },
    { "stage": "negotiation", "deal_count": 3, "total_value": 175000.0 },
    { "stage": "won", "deal_count": 12, "total_value": 580000.0 },
    { "stage": "lost", "deal_count": 4, "total_value": 120000.0 }
  ]
  ```

### 11.5 Tasks Due Today (Current User)
- **Endpoint:** `GET /api/v1/dashboard/tasks-due-today`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):** `List[TaskResponse]`

### 11.6 Overdue Tasks (Current User)
- **Endpoint:** `GET /api/v1/dashboard/tasks-overdue`
- **Auth:** `Bearer <access_token>` or cookie
- **Response (200 OK):** `List[TaskResponse]`

---

## 12. Seed Credentials (Development)

| Email | Password | Role |
|---|---|---|
| `admin@crm.com` | Configured in `.env` (`FIRST_ADMIN_PASSWORD`) | `admin` |


