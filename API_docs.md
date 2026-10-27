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

## 5. Seed Credentials (Development)

| Email | Password | Role |
|---|---|---|
| `admin@crm.com` | `Admin@123456` | `admin` |
