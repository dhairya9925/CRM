from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import (
    ConflictError,
    CredentialsError,
    InactiveUserError,
    NotFoundError,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_password_reset_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import TokenResponse
from app.schemas.user import UserCreate, UserProfileUpdate


class AuthService:
    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        query = select(User).where(User.email == email.lower().strip())
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        query = select(User).where(User.id == user_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @classmethod
    async def authenticate_user(
        cls, db: AsyncSession, email: str, password: str
    ) -> User:
        user = await cls.get_by_email(db, email)
        if not user:
            raise CredentialsError("Incorrect email or password")
        if not verify_password(password, user.hashed_password):
            raise CredentialsError("Incorrect email or password")
        if not user.is_active:
            raise InactiveUserError("User account is deactivated")
        return user

    @classmethod
    def generate_token_response(cls, user: User) -> TokenResponse:
        access_token = create_access_token(
            user_id=user.id,
            role=user.role,
        )
        refresh_token = create_refresh_token(
            user_id=user.id,
        )
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    @classmethod
    async def refresh_tokens(
        cls, db: AsyncSession, refresh_token: str
    ) -> TokenResponse:
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise CredentialsError("Invalid token type: refresh token expected")
            user_id_str = payload.get("sub")
            if not user_id_str:
                raise CredentialsError("Invalid token payload")
            user_id = uuid.UUID(user_id_str)
        except (jwt.PyJWTError, ValueError):
            raise CredentialsError("Invalid or expired refresh token")

        user = await cls.get_by_id(db, user_id)
        if not user:
            raise CredentialsError("User not found")
        if not user.is_active:
            raise InactiveUserError("User is inactive")

        return cls.generate_token_response(user)

    @classmethod
    async def register_user(
        cls, db: AsyncSession, user_in: UserCreate
    ) -> User:
        existing = await cls.get_by_email(db, user_in.email)
        if existing:
            raise ConflictError(f"User with email '{user_in.email}' already exists")

        new_user = User(
            email=user_in.email.lower().strip(),
            hashed_password=hash_password(user_in.password),
            full_name=user_in.full_name.strip(),
            role=user_in.role.value if hasattr(user_in.role, "value") else str(user_in.role),
            is_active=user_in.is_active,
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user

    @classmethod
    async def update_profile(
        cls, db: AsyncSession, user: User, update_data: UserProfileUpdate
    ) -> User:
        if update_data.full_name is not None:
            user.full_name = update_data.full_name.strip()
        if update_data.password is not None:
            user.hashed_password = hash_password(update_data.password)

        await db.commit()
        await db.refresh(user)
        return user

    @classmethod
    async def request_password_reset(
        cls, db: AsyncSession, email: str
    ) -> Optional[str]:
        user = await cls.get_by_email(db, email)
        if not user:
            # We silently return None for security (don't leak registered emails)
            return None

        reset_token = generate_password_reset_token()
        user.reset_token = reset_token
        user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.RESET_TOKEN_EXPIRE_MINUTES
        )
        await db.commit()
        return reset_token

    @classmethod
    async def confirm_password_reset(
        cls, db: AsyncSession, token: str, new_password: str
    ) -> bool:
        query = select(User).where(User.reset_token == token)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user or not user.reset_token_expires_at:
            raise CredentialsError("Invalid or expired password reset token")

        now = datetime.now(timezone.utc)
        if user.reset_token_expires_at < now:
            raise CredentialsError("Password reset token has expired")

        user.hashed_password = hash_password(new_password)
        user.reset_token = None
        user.reset_token_expires_at = None
        await db.commit()
        return True
