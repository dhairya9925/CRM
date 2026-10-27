from typing import Callable, List, Optional
import uuid
import jwt
from fastapi import Depends, Header, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import (
    CredentialsError,
    InactiveUserError,
    PermissionDeniedError,
)
from app.core.security import decode_token
from app.database import get_db
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)


async def get_token_from_header_or_cookie(
    request: Request,
    auth_header_token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[str]:
    """Retrieve token from either Authorization header or HttpOnly access_token cookie."""
    if auth_header_token:
        return auth_header_token
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        if cookie_token.startswith("Bearer "):
            return cookie_token[7:]
        return cookie_token
    return None


async def get_current_user(
    token: Optional[str] = Depends(get_token_from_header_or_cookie),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate access token and return the current authenticated user."""
    if not token:
        raise CredentialsError("Missing authentication token")

    try:
        payload = decode_token(token)
        token_type = payload.get("type")
        if token_type != "access":
            raise CredentialsError("Invalid token type: access token required")

        user_id_str: str = payload.get("sub")
        if not user_id_str:
            raise CredentialsError("Token payload missing subject identifier")
        user_id = uuid.UUID(user_id_str)
    except (jwt.PyJWTError, ValueError):
        raise CredentialsError("Invalid or expired token")

    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise CredentialsError("User associated with token no longer exists")

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure the authenticated user is currently active."""
    if not current_user.is_active:
        raise InactiveUserError("User account has been deactivated")
    return current_user


def require_role(*roles: str) -> Callable:
    """Enforce role-based access control. Allows any of the specified roles."""
    async def role_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if current_user.role not in roles:
            raise PermissionDeniedError(
                f"Action requires one of the following roles: {', '.join(roles)}"
            )
        return current_user

    return role_checker


# Convenient role-specific dependencies
require_admin = require_role(UserRole.ADMIN.value)
require_manager_or_admin = require_role(
    UserRole.ADMIN.value,
    UserRole.SALES_MANAGER.value,
)
