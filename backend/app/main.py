from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.router import api_router
from app.config import settings
from app.core.exceptions import (
    AppError,
    app_error_handler,
    rate_limit_handler,
    unhandled_exception_handler,
    validation_error_handler,
)
from app.core.middleware import RequestIdMiddleware
from app.core.rate_limit import limiter
from app.core.security import hash_password
from app.database import AsyncSessionLocal, Base, engine
from app.models.user import User, UserRole

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("crm.main")

openapi_tags = [
    {"name": "System", "description": "Core system status, connectivity, and health monitoring."},
    {"name": "Authentication", "description": "User registration, session tokens, password recovery, and profile management."},
    {"name": "User Management", "description": "Administrative control, provisioning, and team RBAC assignments."},
    {"name": "Company Management", "description": "Organizational accounts, industry classification, and contact directories."},
    {"name": "Contact Management", "description": "Customer contact records, customized JSONB metadata, and activity linkage."},
    {"name": "Lead Management", "description": "Lead intake funnel, status lifecycles, CSV batch ingestion, and conversion."},
    {"name": "Deals & Sales Pipeline", "description": "Opportunity lifecycle tracking, revenue projections, and Kanban workflow stages."},
    {"name": "Tasks & Reminders", "description": "To-do items, reminders, priority scheduling, and overdue tracking."},
    {"name": "Activity Timeline", "description": "Multi-channel interaction history, call notes, emails, and audit log tracking."},
    {"name": "Dashboard & Reports", "description": "Real-time metrics, conversion analytics, pipeline totals, and KPI cards."},
]


async def init_admin_user():
    """Seed initial superadmin user if database has no admin."""
    try:
        async with AsyncSessionLocal() as session:
            from sqlalchemy import select
            stmt = select(User).where(User.email == settings.FIRST_ADMIN_EMAIL.lower().strip())
            result = await session.execute(stmt)
            admin = result.scalar_one_or_none()
            if not admin:
                logger.info(f"Seeding initial admin account: {settings.FIRST_ADMIN_EMAIL}")
                new_admin = User(
                    email=settings.FIRST_ADMIN_EMAIL.lower().strip(),
                    hashed_password=hash_password(settings.FIRST_ADMIN_PASSWORD),
                    full_name=settings.FIRST_ADMIN_NAME,
                    role=UserRole.ADMIN.value,
                    is_active=True,
                )
                session.add(new_admin)
                await session.commit()
                logger.info("Initial admin account created successfully.")
            elif settings.ENVIRONMENT == "development":
                # Keep dev password synchronized with .env
                admin.hashed_password = hash_password(settings.FIRST_ADMIN_PASSWORD)
                admin.full_name = settings.FIRST_ADMIN_NAME
                await session.commit()
                logger.info("Synchronized admin password with .env settings.")
    except Exception as e:
        logger.warning(f"Could not seed admin user on startup: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed initial data
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema initialized.")
        await init_admin_user()
    except Exception as e:
        logger.error(f"Error during database startup initialization: {e}")

    yield

    # Shutdown
    await engine.dispose()
    logger.info("Database connection closed.")


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="High-performance, async CRM API built with FastAPI, SQLAlchemy 2.0, asyncpg, and PostgreSQL.",
        version=settings.VERSION,
        openapi_tags=openapi_tags,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # Attach rate limiter instance
    app.state.limiter = limiter

    # Exception Handlers
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # Middlewares
    app.add_middleware(SlowAPIMiddleware)
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API v1 router
    app.include_router(api_router, prefix=settings.API_V1_STR)

    @app.get(
        "/api/health",
        tags=["System"],
        summary="Service and Database health check",
    )
    async def health_check():
        db_status = "disconnected"
        try:
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))
                db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"

        return {
            "status": "ok" if db_status == "connected" else "degraded",
            "db": db_status,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
        }

    @app.get("/", tags=["System"])
    async def root():
        return {
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "docs": "/docs",
            "health": "/api/health",
        }

    return app


app = create_application()
