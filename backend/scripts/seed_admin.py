import asyncio
import logging
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select
from app.config import settings
from app.core.security import hash_password
from app.database import AsyncSessionLocal, Base, engine
from app.models.user import User, UserRole

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_admin")


async def seed():
    logger.info("Initializing database tables if not present...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        stmt = select(User).where(User.email == settings.FIRST_ADMIN_EMAIL.lower().strip())
        res = await session.execute(stmt)
        user = res.scalar_one_or_none()

        if user:
            logger.info(f"Admin user {settings.FIRST_ADMIN_EMAIL} exists, updating password from settings...")
            user.hashed_password = hash_password(settings.FIRST_ADMIN_PASSWORD)
            user.full_name = settings.FIRST_ADMIN_NAME
            user.is_active = True
            await session.commit()
            logger.info("Admin password synchronized.")
            return

        new_admin = User(
            email=settings.FIRST_ADMIN_EMAIL.lower().strip(),
            hashed_password=hash_password(settings.FIRST_ADMIN_PASSWORD),
            full_name=settings.FIRST_ADMIN_NAME,
            role=UserRole.ADMIN.value,
            is_active=True,
        )
        session.add(new_admin)
        await session.commit()
        logger.info(f"Successfully seeded admin account: {settings.FIRST_ADMIN_EMAIL}")


if __name__ == "__main__":
    asyncio.run(seed())
