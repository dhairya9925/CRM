import uuid
import pytest
from httpx import AsyncClient
from app.config import settings


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["db"] == "connected"


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.FIRST_ADMIN_EMAIL, "password": settings.FIRST_ADMIN_PASSWORD},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.FIRST_ADMIN_EMAIL, "password": "WrongPassword!"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_profile(client: AsyncClient):
    # 1. Login
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.FIRST_ADMIN_EMAIL, "password": settings.FIRST_ADMIN_PASSWORD},
    )
    token = login_resp.json()["access_token"]

    # 2. Get /me
    me_resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 200
    profile = me_resp.json()
    assert profile["email"] == settings.FIRST_ADMIN_EMAIL
    assert profile["role"] == "admin"
    assert profile["is_active"] is True


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_flow(client: AsyncClient):
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.FIRST_ADMIN_EMAIL, "password": settings.FIRST_ADMIN_PASSWORD},
    )
    refresh_token = login_resp.json()["refresh_token"]

    refresh_resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_resp.status_code == 200
    data = refresh_resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_admin_register_new_user_flow(client: AsyncClient):
    # Login as admin
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.FIRST_ADMIN_EMAIL, "password": settings.FIRST_ADMIN_PASSWORD},
    )
    admin_token = login_resp.json()["access_token"]

    test_email = f"salesrep_{uuid.uuid4().hex[:8]}@crm.com"
    reg_resp = await client.post(
        "/api/v1/auth/register",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "email": test_email,
            "password": "Password123!",
            "full_name": "Sales Rep User",
            "role": "sales_rep",
        },
    )
    assert reg_resp.status_code == 201

    # Test login with sales rep
    rep_login = await client.post(
        "/api/v1/auth/login",
        json={"email": test_email, "password": "Password123!"},
    )
    assert rep_login.status_code == 200
    rep_token = rep_login.json()["access_token"]

    # Sales rep cannot register users
    forbidden_reg = await client.post(
        "/api/v1/auth/register",
        headers={"Authorization": f"Bearer {rep_token}"},
        json={
            "email": "hacker@crm.com",
            "password": "Password123!",
            "full_name": "Hacker User",
            "role": "admin",
        },
    )
    assert forbidden_reg.status_code == 403


@pytest.mark.asyncio
async def test_password_reset_flow(client: AsyncClient):
    # 1. Login as admin to provision a test user for password reset
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.FIRST_ADMIN_EMAIL, "password": settings.FIRST_ADMIN_PASSWORD},
    )
    admin_token = admin_login.json()["access_token"]

    reset_user_email = f"reset_test_{uuid.uuid4().hex[:8]}@crm.com"
    await client.post(
        "/api/v1/auth/register",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "email": reset_user_email,
            "password": "OldPassword123!",
            "full_name": "Reset Test User",
            "role": "sales_rep",
        },
    )

    # 2. Request reset
    req_resp = await client.post(
        "/api/v1/auth/password-reset/request",
        json={"email": reset_user_email},
    )
    assert req_resp.status_code == 200
    message = req_resp.json()["message"]
    assert "[Dev Token:" in message
    token = message.split("[Dev Token: ")[1].split("]")[0].strip()

    # 3. Confirm reset
    confirm_resp = await client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"token": token, "new_password": "NewSecretPassword123!"},
    )
    assert confirm_resp.status_code == 200

    # 4. Verify login with new password
    new_login = await client.post(
        "/api/v1/auth/login",
        json={"email": reset_user_email, "password": "NewSecretPassword123!"},
    )
    assert new_login.status_code == 200


@pytest.mark.asyncio
async def test_public_signup_flow(client: AsyncClient):
    signup_email = f"signup_{uuid.uuid4().hex[:8]}@crm.com"
    resp = await client.post(
        "/api/v1/auth/signup",
        json={
            "full_name": "New Registered Rep",
            "email": signup_email,
            "password": "Password123!",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data

    # Verify profile can be fetched with the token
    me_resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {data['access_token']}"},
    )
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == signup_email
    assert me_data["full_name"] == "New Registered Rep"
    assert me_data["role"] == "sales_rep"
