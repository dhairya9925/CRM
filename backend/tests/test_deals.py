import uuid
import pytest
from httpx import AsyncClient
from app.config import settings


@pytest.mark.asyncio
async def test_deals_pipeline_and_kanban(client: AsyncClient):
    # 1. Login
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.FIRST_ADMIN_EMAIL, "password": settings.FIRST_ADMIN_PASSWORD},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create deal
    deal_title = f"Enterprise Cloud Expansion {uuid.uuid4().hex[:6]}"
    create_resp = await client.post(
        "/api/v1/deals/",
        headers=headers,
        json={
            "name": deal_title,
            "value": 125000.0,
            "stage": "qualification",
        },
    )
    assert create_resp.status_code == 201
    deal = create_resp.json()
    deal_id = deal["id"]
    assert deal["value"] == 125000.0
    assert deal["stage"] == "qualification"

    # 3. List deals table view
    table_resp = await client.get("/api/v1/deals/?kanban=false", headers=headers)
    assert table_resp.status_code == 200
    table_data = table_resp.json()
    assert table_data["total"] >= 1
    assert any(d["id"] == deal_id for d in table_data["items"])

    # 4. List deals Kanban view
    kanban_resp = await client.get("/api/v1/deals/?kanban=true", headers=headers)
    assert kanban_resp.status_code == 200
    kanban_data = kanban_resp.json()
    assert "stages" in kanban_data
    assert "total_pipeline_value" in kanban_data
    assert kanban_data["total_pipeline_value"] >= 125000.0

    qual_stage = next(s for s in kanban_data["stages"] if s["stage"] == "qualification")
    assert any(d["id"] == deal_id for d in qual_stage["deals"])

    # 5. Move deal stage to negotiation
    stage_resp = await client.patch(
        f"/api/v1/deals/{deal_id}/stage",
        headers=headers,
        json={"stage": "negotiation"},
    )
    assert stage_resp.status_code == 200
    assert stage_resp.json()["stage"] == "negotiation"

    # 6. Verify activity timeline has stage change recorded
    activities_resp = await client.get(f"/api/v1/deals/{deal_id}/activities", headers=headers)
    assert activities_resp.status_code == 200
    activities = activities_resp.json()
    assert len(activities) >= 1
    assert any("negotiation" in (a["notes"] or "") for a in activities)

    # 7. Delete deal
    del_resp = await client.delete(f"/api/v1/deals/{deal_id}", headers=headers)
    assert del_resp.status_code == 200

    # 8. Should not be found after deletion
    after_del = await client.get(f"/api/v1/deals/{deal_id}", headers=headers)
    assert after_del.status_code == 404
