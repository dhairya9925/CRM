import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import bcrypt
import jwt
from app.config import settings


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the hashed password."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def create_token(
    subject: Union[str, Any],
    token_type: str,
    expires_delta: timedelta,
    additional_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Generate a JWT token with claims."""
    now = datetime.now(timezone.utc)
    expire = now + expires_delta

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    if additional_claims:
        payload.update(additional_claims)

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(
    user_id: Union[str, Any],
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create short-lived access token containing user ID and role."""
    delta = expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_token(
        subject=user_id,
        token_type="access",
        expires_delta=delta,
        additional_claims={"role": role},
    )


def create_refresh_token(
    user_id: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create long-lived refresh token."""
    delta = expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return create_token(
        subject=user_id,
        token_type="refresh",
        expires_delta=delta,
    )


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT token."""
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
    )


def generate_password_reset_token() -> str:
    """Generate a secure, cryptographically random token for password resets."""
    return secrets.token_urlsafe(32)
