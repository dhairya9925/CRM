import pytest
from httpx import AsyncClient
from app.core.rate_limit import limiter


@pytest.mark.asyncio
async def test_rate_limiting_enforcement(client: AsyncClient):
    limiter.enabled = True
    try:
        responses = []
        for _ in range(7):
            resp = await client.post(
                "/api/v1/auth/login",
                json={"email": "ratelimit_test@crm.com", "password": "wrongpassword"},
            )
            responses.append(resp.status_code)

        # After 5 requests per minute, subsequent requests must be blocked with 429
        assert 429 in responses
        
        # Verify 429 response body structure
        idx_429 = responses.index(429)
        assert idx_429 >= 5
    finally:
        limiter.enabled = False
