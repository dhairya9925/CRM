import uuid
import pytest
from httpx import AsyncClient
from app.config import settings


@pytest.mark.asyncio
async def test_company_crud_and_relations(client: AsyncClient):
    # 1. Login
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.FIRST_ADMIN_EMAIL, "password": settings.FIRST_ADMIN_PASSWORD},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create company
    comp_name = f"Acme Global {uuid.uuid4().hex[:6]}"
    create_resp = await client.post(
        "/api/v1/companies/",
        headers=headers,
        json={
            "name": comp_name,
            "website": "https://acme.com",
            "industry": "Enterprise Software",
            "phone": "+1 555-0199",
            "address": "100 Market St, San Francisco, CA",
        },
    )
    assert create_resp.status_code == 201
    comp = create_resp.json()
    comp_id = comp["id"]
    assert comp["name"] == comp_name

    # 3. List companies with search
    list_resp = await client.get(
        f"/api/v1/companies/?search={comp_name}",
        headers=headers,
    )
    assert list_resp.status_code == 200
    page_data = list_resp.json()
    assert page_data["total"] >= 1
    assert any(c["id"] == comp_id for c in page_data["items"])

    # 4. Get company detail
    detail_resp = await client.get(f"/api/v1/companies/{comp_id}", headers=headers)
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == comp_id

    # 5. Update company
    update_resp = await client.patch(
        f"/api/v1/companies/{comp_id}",
        headers=headers,
        json={"industry": "Cloud SaaS"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["industry"] == "Cloud SaaS"

    # 6. Check empty sub-resources
    contacts_resp = await client.get(f"/api/v1/companies/{comp_id}/contacts", headers=headers)
    assert contacts_resp.status_code == 200
    assert isinstance(contacts_resp.json(), list)

    deals_resp = await client.get(f"/api/v1/companies/{comp_id}/deals", headers=headers)
    assert deals_resp.status_code == 200
    assert isinstance(deals_resp.json(), list)

    # 7. Delete company
    del_resp = await client.delete(f"/api/v1/companies/{comp_id}", headers=headers)
    assert del_resp.status_code == 200

    # 8. Should not be found after deletion
    after_del = await client.get(f"/api/v1/companies/{comp_id}", headers=headers)
    assert after_del.status_code == 404
