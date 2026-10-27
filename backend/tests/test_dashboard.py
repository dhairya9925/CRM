import pytest
from httpx import AsyncClient
from app.config import settings


@pytest.mark.asyncio
async def test_dashboard_kpis_and_reports(client: AsyncClient):
    # 1. Login
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.FIRST_ADMIN_EMAIL, "password": settings.FIRST_ADMIN_PASSWORD},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test summary KPIs
    summary_resp = await client.get("/api/v1/dashboard/summary", headers=headers)
    assert summary_resp.status_code == 200
    summary = summary_resp.json()
    assert "total_leads" in summary
    assert "open_deals" in summary
    assert "pipeline_value" in summary
    assert "won_deals" in summary
    assert "won_value" in summary
    assert "tasks_due_today" in summary
    assert "overdue_tasks" in summary

    # 3. Test leads by status
    status_resp = await client.get("/api/v1/dashboard/leads-by-status", headers=headers)
    assert status_resp.status_code == 200
    statuses = status_resp.json()
    assert isinstance(statuses, list)

    # 4. Test leads by source
    source_resp = await client.get("/api/v1/dashboard/leads-by-source", headers=headers)
    assert source_resp.status_code == 200
    sources = source_resp.json()
    assert isinstance(sources, list)

    # 5. Test pipeline distribution by stage
    pipe_resp = await client.get("/api/v1/dashboard/pipeline", headers=headers)
    assert pipe_resp.status_code == 200
    pipeline = pipe_resp.json()
    assert len(pipeline) == 5  # 5 stages: qualification, proposal, negotiation, won, lost

    # 6. Test tasks due today and overdue endpoints
    due_resp = await client.get("/api/v1/dashboard/tasks-due-today", headers=headers)
    assert due_resp.status_code == 200
    assert isinstance(due_resp.json(), list)

    overdue_resp = await client.get("/api/v1/dashboard/tasks-overdue", headers=headers)
    assert overdue_resp.status_code == 200
    assert isinstance(overdue_resp.json(), list)
