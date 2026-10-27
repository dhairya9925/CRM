import pytest
from httpx import AsyncClient
from app.config import settings


@pytest.mark.asyncio
async def test_manual_activity_logging_and_retrieval(client: AsyncClient):
    # 1. Login
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.FIRST_ADMIN_EMAIL, "password": settings.FIRST_ADMIN_PASSWORD},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create activity
    create_resp = await client.post(
        "/api/v1/activities/",
        headers=headers,
        json={
            "type": "call",
            "notes": "Discussed Q4 roadmap and onboarding requirements",
            "outcome": "Follow-up meeting scheduled",
            "extra_data": {"call_duration_minutes": 25},
        },
    )
    assert create_resp.status_code == 201
    act = create_resp.json()
    act_id = act["id"]
    assert act["type"] == "call"
    assert act["outcome"] == "Follow-up meeting scheduled"
    assert act["extra_data"]["call_duration_minutes"] == 25

    # 3. List activities
    list_resp = await client.get("/api/v1/activities/?type=call", headers=headers)
    assert list_resp.status_code == 200
    activities = list_resp.json()
    assert any(a["id"] == act_id for a in activities)

    # 4. Get single activity
    detail_resp = await client.get(f"/api/v1/activities/{act_id}", headers=headers)
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == act_id

    # 5. Patch activity
    patch_resp = await client.patch(
        f"/api/v1/activities/{act_id}",
        headers=headers,
        json={"outcome": "Demo completed successfully", "notes": "Updated notes"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["outcome"] == "Demo completed successfully"

    # 6. Delete activity
    del_resp = await client.delete(f"/api/v1/activities/{act_id}", headers=headers)
    assert del_resp.status_code == 200

    # 7. Verify 404
    after_del = await client.get(f"/api/v1/activities/{act_id}", headers=headers)
    assert after_del.status_code == 404
