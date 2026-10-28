import logging
import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("crm.access")


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # 1. Resolve or generate Request ID
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = str(uuid.uuid4())
        
        request.state.request_id = request_id
        start_time = time.perf_counter()

        # 2. Process request
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                f"[{request_id}] {request.method} {request.url.path} - Exception raised ({duration_ms:.2f}ms)"
            )
            raise

        # 3. Attach header & log summary
        duration_ms = (time.perf_counter() - start_time) * 1000
        response.headers["X-Request-ID"] = request_id

        # Skip health check noise in access logs
        if request.url.path != "/api/health":
            logger.info(
                f"[{request_id}] {request.method} {request.url.path} {response.status_code} ({duration_ms:.2f}ms)"
            )

        return response
