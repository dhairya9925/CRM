import uuid
import pytest
from httpx import AsyncClient
from app.config import settings


@pytest.mark.asyncio
async def test_admin_list_and_manage_users(client: AsyncClient):
    # 1. Login as admin
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.FIRST_ADMIN_EMAIL, "password": settings.FIRST_ADMIN_PASSWORD},
    )
    admin_token = login_resp.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. List users
    list_resp = await client.get("/api/v1/users/", headers=admin_headers)
    assert list_resp.status_code == 200
    users = list_resp.json()
    assert isinstance(users, list)
    assert len(users) >= 1

    # 3. Create a unique sales manager
    unique_id = uuid.uuid4().hex[:8]
    manager_email = f"manager_{unique_id}@crm.com"
    create_resp = await client.post(
        "/api/v1/auth/register",
        headers=admin_headers,
        json={
            "email": manager_email,
            "password": "Password123!",
            "full_name": "Sales Manager",
            "role": "sales_manager",
        },
    )
    assert create_resp.status_code == 201
    manager_id = create_resp.json()["id"]

    # 4. Fetch the manager from list
    list_again = await client.get("/api/v1/users/", headers=admin_headers)
    manager = next((u for u in list_again.json() if u["email"] == manager_email), None)
    assert manager is not None

    # 5. Get user detail
    detail_resp = await client.get(f"/api/v1/users/{manager_id}", headers=admin_headers)
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == manager_id

    # 6. Update user
    update_resp = await client.patch(
        f"/api/v1/users/{manager_id}",
        headers=admin_headers,
        json={"full_name": "Senior Sales Manager"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["full_name"] == "Senior Sales Manager"

    # 7. Non-admin cannot list users
    mgr_login = await client.post(
        "/api/v1/auth/login",
        json={"email": manager_email, "password": "Password123!"},
    )
    assert mgr_login.status_code == 200
    mgr_token = mgr_login.json()["access_token"]
    mgr_headers = {"Authorization": f"Bearer {mgr_token}"}

    forbidden_list = await client.get("/api/v1/users/", headers=mgr_headers)
    assert forbidden_list.status_code == 403

    # 8. Admin deactivates user
    deactivate_resp = await client.delete(
        f"/api/v1/users/{manager_id}", headers=admin_headers
    )
    assert deactivate_resp.status_code == 200

    # 9. Deactivated user cannot log in
    deactivated_login = await client.post(
        "/api/v1/auth/login",
        json={"email": manager_email, "password": "Password123!"},
    )
    assert deactivated_login.status_code == 403
