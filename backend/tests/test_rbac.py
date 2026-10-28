import pytest
from httpx import AsyncClient
from app.config import settings


@pytest.mark.asyncio
async def test_role_based_access_control(client: AsyncClient):
    # 1. Admin login
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.FIRST_ADMIN_EMAIL, "password": settings.FIRST_ADMIN_PASSWORD},
    )
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Provision a sales_manager and a sales_rep via Admin
    mgr_email = "test_manager@crm.com"
    rep_email = "test_rep@crm.com"

    # Create manager
    mgr_res = await client.post(
        "/api/v1/auth/register",
        headers=admin_headers,
        json={
            "email": mgr_email,
            "password": "ManagerPassword123!",
            "full_name": "Sales Manager Test",
            "role": "sales_manager",
        },
    )
    assert mgr_res.status_code in [201, 409]
    mgr_id = mgr_res.json().get("id") if mgr_res.status_code == 201 else None

    # Create rep
    rep_res = await client.post(
        "/api/v1/auth/register",
        headers=admin_headers,
        json={
            "email": rep_email,
            "password": "RepPassword123!",
            "full_name": "Sales Rep Test",
            "role": "sales_rep",
        },
    )
    assert rep_res.status_code in [201, 409]

    # 3. Login as Sales Rep
    rep_login = await client.post(
        "/api/v1/auth/login",
        json={"email": rep_email, "password": "RepPassword123!"},
    )
    assert rep_login.status_code == 200
    rep_token = rep_login.json()["access_token"]
    rep_headers = {"Authorization": f"Bearer {rep_token}"}

    # 3a. Rep cannot list users (Admin only)
    users_resp = await client.get("/api/v1/users/", headers=rep_headers)
    assert users_resp.status_code == 403
    assert users_resp.json()["error"] == "PermissionDeniedError"

    # 3b. Rep cannot register users
    reg_resp = await client.post(
        "/api/v1/auth/register",
        headers=rep_headers,
        json={
            "email": "unauthorized@crm.com",
            "password": "Password123!",
            "full_name": "Unauthorized User",
            "role": "sales_rep",
        },
    )
    assert reg_resp.status_code == 403

    # 3c. Rep creates a lead
    create_lead_resp = await client.post(
        "/api/v1/leads/",
        headers=rep_headers,
        json={
            "first_name": "Test",
            "last_name": "Lead",
            "email": "testlead_rbac@example.com",
        },
    )
    assert create_lead_resp.status_code == 201
    lead_id = create_lead_resp.json()["id"]

    # 3d. Rep cannot reassign lead (Manager/Admin only)
    assign_resp = await client.patch(
        f"/api/v1/leads/{lead_id}/assign",
        headers=rep_headers,
        json={"assigned_to": lead_id},  # dummy uuid
    )
    assert assign_resp.status_code == 403

    # 4. Login as Sales Manager
    mgr_login = await client.post(
        "/api/v1/auth/login",
        json={"email": mgr_email, "password": "ManagerPassword123!"},
    )
    assert mgr_login.status_code == 200
    mgr_token = mgr_login.json()["access_token"]
    mgr_headers = {"Authorization": f"Bearer {mgr_token}"}

    # 4a. Manager cannot list users (Admin only)
    mgr_users = await client.get("/api/v1/users/", headers=mgr_headers)
    assert mgr_users.status_code == 403

    # 4b. Manager CAN reassign lead
    mgr_profile = await client.get("/api/v1/auth/me", headers=mgr_headers)
    assert mgr_profile.status_code == 200
    my_mgr_id = mgr_profile.json()["id"]

    mgr_assign = await client.patch(
        f"/api/v1/leads/{lead_id}/assign",
        headers=mgr_headers,
        json={"assigned_to": my_mgr_id},
    )
    assert mgr_assign.status_code == 200
    assert mgr_assign.json()["assigned_to"] == my_mgr_id

    # 5. Admin can list users
    admin_users = await client.get("/api/v1/users/", headers=admin_headers)
    assert admin_users.status_code == 200
    assert len(admin_users.json()) >= 3
