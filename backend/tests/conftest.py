import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.core.dependencies import get_db
from app.core.rate_limit import limiter
from app.main import app

# Disable rate limiter for generic test suite
limiter.enabled = False

connect_args = {}
if "supabase" in settings.DATABASE_URL.lower() or "pooler" in settings.DATABASE_URL.lower():
    connect_args = {
        "statement_cache_size": 0,
        "ssl": "require",
    }


@pytest_asyncio.fixture(scope="function")
async def client():
    # Fresh engine per test function to prevent cross-loop connection sharing
    engine = create_async_engine(
        settings.DATABASE_URL,
        future=True,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_size=3,
        max_overflow=0,
    )
    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
    )

    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session():
    engine = create_async_engine(
        settings.DATABASE_URL,
        future=True,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_size=3,
        max_overflow=0,
    )
    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
    )
    async with session_factory() as session:
        yield session
    await engine.dispose()
