from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.router import api_router
from app.config import settings
from app.core.security import hash_password
from app.database import AsyncSessionLocal, Base, engine
from app.models.user import User, UserRole

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("crm.main")


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
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # CORS configuration
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
