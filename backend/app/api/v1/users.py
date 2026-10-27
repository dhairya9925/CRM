from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_admin
from app.core.exceptions import NotFoundError
from app.core.security import hash_password
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(
    prefix="/users",
    tags=["User Management"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "/",
    response_model=List[UserResponse],
    summary="List all users (Admin only)",
)
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve list of registered users with optional filtering and pagination."""
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)

    query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user by ID (Admin only)",
)
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve specific user details by UUID."""
    user = await db.get(User, user_id)
    if not user:
        raise NotFoundError("User not found")
    return user


@router.patch(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update user role, status or attributes (Admin only)",
)
async def update_user(
    user_id: uuid.UUID,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update role, active status, or attributes of any user."""
    user = await db.get(User, user_id)
    if not user:
        raise NotFoundError("User not found")

    if user_in.email is not None:
        user.email = user_in.email.lower().strip()
    if user_in.full_name is not None:
        user.full_name = user_in.full_name.strip()
    if user_in.role is not None:
        user.role = user_in.role.value if hasattr(user_in.role, "value") else str(user_in.role)
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.password is not None:
        user.hashed_password = hash_password(user_in.password)

    await db.commit()
    await db.refresh(user)
    return user


@router.delete(
    "/{user_id}",
    response_model=MessageResponse,
    summary="Deactivate user account (Admin only)",
)
async def deactivate_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Soft delete / deactivate user account by setting is_active=False."""
    user = await db.get(User, user_id)
    if not user:
        raise NotFoundError("User not found")

    user.is_active = False
    await db.commit()
    return MessageResponse(message=f"User {user.email} has been deactivated")
