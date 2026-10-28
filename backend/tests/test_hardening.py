import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_request_id_middleware(client: AsyncClient):
    # 1. Custom Request ID is echoed back
    custom_id = "test-custom-trace-id-12345"
    resp = await client.get("/api/health", headers={"X-Request-ID": custom_id})
    assert resp.status_code == 200
    assert resp.headers.get("X-Request-ID") == custom_id

    # 2. Generated Request ID if none provided
    resp_auto = await client.get("/api/health")
    assert resp_auto.status_code == 200
    generated_id = resp_auto.headers.get("X-Request-ID")
    assert generated_id is not None
    assert len(generated_id) > 10


@pytest.mark.asyncio
async def test_error_handling_structure(client: AsyncClient):
    # Test 404 format
    resp_404 = await client.get("/api/v1/companies/00000000-0000-0000-0000-000000000000")
    # Wait: unauthenticated might return 401 first
    assert resp_404.status_code in [401, 404]
    data = resp_404.json()
    assert "detail" in data
    assert "request_id" in data
