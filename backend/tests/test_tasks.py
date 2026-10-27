from datetime import datetime, timedelta, timezone
import uuid
import pytest
from httpx import AsyncClient
from app.config import settings


@pytest.mark.asyncio
async def test_tasks_lifecycle_and_due_date_filtering(client: AsyncClient):
    # 1. Login
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.FIRST_ADMIN_EMAIL, "password": settings.FIRST_ADMIN_PASSWORD},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create task due today
    now = datetime.now(timezone.utc)
    task_title = f"Follow-up with client {uuid.uuid4().hex[:6]}"
    create_resp = await client.post(
        "/api/v1/tasks/",
        headers=headers,
        json={
            "title": task_title,
            "description": "Send enterprise pricing deck",
            "type": "follow_up",
            "priority": "high",
            "status": "pending",
            "due_date": now.isoformat(),
        },
    )
    assert create_resp.status_code == 201
    task = create_resp.json()
    task_id = task["id"]
    assert task["title"] == task_title
    assert task["priority"] == "high"

    # 3. Create overdue task
    overdue_date = now - timedelta(days=2)
    overdue_resp = await client.post(
        "/api/v1/tasks/",
        headers=headers,
        json={
            "title": "Overdue contract review",
            "type": "call",
            "priority": "medium",
            "status": "pending",
            "due_date": overdue_date.isoformat(),
        },
    )
    assert overdue_resp.status_code == 201
    overdue_id = overdue_resp.json()["id"]

    # 4. Filter due_today
    today_resp = await client.get("/api/v1/tasks/?due_today=true", headers=headers)
    assert today_resp.status_code == 200
    today_items = today_resp.json()["items"]
    assert any(t["id"] == task_id for t in today_items)

    # 5. Filter overdue
    overdue_list_resp = await client.get("/api/v1/tasks/?overdue=true", headers=headers)
    assert overdue_list_resp.status_code == 200
    overdue_items = overdue_list_resp.json()["items"]
    assert any(t["id"] == overdue_id for t in overdue_items)

    # 6. Complete task
    complete_resp = await client.patch(f"/api/v1/tasks/{task_id}/complete", headers=headers)
    assert complete_resp.status_code == 200
    assert complete_resp.json()["status"] == "done"

    # 7. Delete task
    del_resp = await client.delete(f"/api/v1/tasks/{task_id}", headers=headers)
    assert del_resp.status_code == 200

    # 8. Verify deleted task returns 404
    after_del = await client.get(f"/api/v1/tasks/{task_id}", headers=headers)
    assert after_del.status_code == 404
