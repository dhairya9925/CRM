import uuid
import pytest
from httpx import AsyncClient
from app.config import settings


@pytest.mark.asyncio
async def test_contact_crud_and_custom_fields(client: AsyncClient):
    # 1. Login
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.FIRST_ADMIN_EMAIL, "password": settings.FIRST_ADMIN_PASSWORD},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create company for linking
    comp_resp = await client.post(
        "/api/v1/companies/",
        headers=headers,
        json={"name": f"Contact Corp {uuid.uuid4().hex[:6]}"},
    )
    company_id = comp_resp.json()["id"]

    # 3. Create contact with custom fields
    unique_email = f"john_{uuid.uuid4().hex[:6]}@example.com"
    create_resp = await client.post(
        "/api/v1/contacts/",
        headers=headers,
        json={
            "first_name": "John",
            "last_name": "Doe",
            "email": unique_email,
            "phone": "+1 415-555-0123",
            "company_id": company_id,
            "notes": "Met at SaaS Expo 2026",
            "custom_fields": {"lead_score": 88, "tier": "gold"},
        },
    )
    assert create_resp.status_code == 201
    contact = create_resp.json()
    contact_id = contact["id"]
    assert contact["first_name"] == "John"
    assert contact["custom_fields"]["lead_score"] == 88

    # 4. List contacts with search
    list_resp = await client.get(f"/api/v1/contacts/?search=John", headers=headers)
    assert list_resp.status_code == 200
    page_data = list_resp.json()
    assert page_data["total"] >= 1
    assert any(c["id"] == contact_id for c in page_data["items"])

    # 5. Update contact with custom_fields merge patch
    update_resp = await client.patch(
        f"/api/v1/contacts/{contact_id}",
        headers=headers,
        json={
            "last_name": "Smith",
            "custom_fields": {"linkedin": "https://linkedin.com/in/johndoe", "tier": "platinum"},
        },
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["last_name"] == "Smith"
    # Preserves lead_score and updates tier
    assert updated["custom_fields"]["lead_score"] == 88
    assert updated["custom_fields"]["tier"] == "platinum"
    assert updated["custom_fields"]["linkedin"] == "https://linkedin.com/in/johndoe"

    # 6. Activities sub-resource
    activities_resp = await client.get(f"/api/v1/contacts/{contact_id}/activities", headers=headers)
    assert activities_resp.status_code == 200
    assert isinstance(activities_resp.json(), list)

    # 7. Delete contact
    del_resp = await client.delete(f"/api/v1/contacts/{contact_id}", headers=headers)
    assert del_resp.status_code == 200

    # 8. Should not be found after deletion
    after_del = await client.get(f"/api/v1/contacts/{contact_id}", headers=headers)
    assert after_del.status_code == 404
