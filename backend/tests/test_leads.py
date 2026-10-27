import io
import uuid
import pytest
from httpx import AsyncClient
from app.config import settings


@pytest.mark.asyncio
async def test_lead_lifecycle_convert_and_csv_import(client: AsyncClient):
    # 1. Login
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.FIRST_ADMIN_EMAIL, "password": settings.FIRST_ADMIN_PASSWORD},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create lead manually
    unique_email = f"lead_{uuid.uuid4().hex[:6]}@prospect.com"
    create_resp = await client.post(
        "/api/v1/leads/",
        headers=headers,
        json={
            "first_name": "Sarah",
            "last_name": "Connor",
            "email": unique_email,
            "phone": "+1 555-8888",
            "company_name": "Cyberdyne Systems",
            "source": "website",
            "status": "new",
        },
    )
    assert create_resp.status_code == 201
    lead = create_resp.json()
    lead_id = lead["id"]
    assert lead["status"] == "new"
    assert lead["is_converted"] is False

    # 3. List leads with filters
    list_resp = await client.get("/api/v1/leads/?status=new", headers=headers)
    assert list_resp.status_code == 200
    page_data = list_resp.json()
    assert any(l["id"] == lead_id for l in page_data["items"])

    # 4. Convert lead to Contact and Deal
    convert_resp = await client.post(
        f"/api/v1/leads/{lead_id}/convert",
        headers=headers,
        json={
            "deal_name": "Cyberdyne AI Security Suite",
            "deal_value": 75000.0,
            "create_deal": True,
        },
    )
    assert convert_resp.status_code == 200
    conv_data = convert_resp.json()
    assert conv_data["lead_id"] == lead_id
    assert conv_data["contact_id"] is not None
    assert conv_data["deal_id"] is not None

    # 5. Check converted lead status
    converted_lead = await client.get(f"/api/v1/leads/{lead_id}", headers=headers)
    assert converted_lead.status_code == 200
    lead_data = converted_lead.json()
    assert lead_data["is_converted"] is True
    assert lead_data["status"] == "qualified"
    assert lead_data["converted_contact_id"] == conv_data["contact_id"]
    assert lead_data["converted_deal_id"] == conv_data["deal_id"]

    # 6. Check activities recorded for lead
    activities_resp = await client.get(f"/api/v1/leads/{lead_id}/activities", headers=headers)
    assert activities_resp.status_code == 200
    activities = activities_resp.json()
    assert len(activities) >= 1
    assert any(a["type"] == "conversion" for a in activities)

    # 7. CSV Bulk Import test
    csv_data = (
        "first_name,last_name,email,phone,company,source,status\n"
        "Alice,Walker,alice@innovate.org,+1 555-1111,Innovate Org,referral,new\n"
        "Bob,Builder,bob@construct.com,+1 555-2222,Bob Builders,ads,contacted\n"
        ",MissingLastName,bad@row.com,,Bad Co,website,new\n"
    )
    files = {"file": ("leads.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    import_resp = await client.post("/api/v1/leads/import", headers=headers, files=files)
    assert import_resp.status_code == 200
    import_res = import_resp.json()
    assert import_res["imported"] == 2
    assert import_res["failed"] == 1
    assert len(import_res["errors"]) == 1
