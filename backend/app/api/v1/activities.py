from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db
from app.core.exceptions import NotFoundError
from app.models.activity import Activity
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityResponse, ActivityUpdate
from app.schemas.auth import MessageResponse
from app.services.activity_service import ActivityService

router = APIRouter(prefix="/activities", tags=["Activity Timeline"])


@router.post(
    "/",
    response_model=ActivityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log an activity (call, email, meeting, note)",
)
async def create_activity(
    activity_in: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    activity_type = (
        activity_in.type.value
        if hasattr(activity_in.type, "value")
        else str(activity_in.type)
    )
    return await ActivityService.log_activity(
        db=db,
        type=activity_type,
        notes=activity_in.notes,
        outcome=activity_in.outcome,
        performed_by=current_user.id,
        lead_id=activity_in.lead_id,
        contact_id=activity_in.contact_id,
        deal_id=activity_in.deal_id,
        extra_data=activity_in.extra_data,
    )


@router.get(
    "/",
    response_model=List[ActivityResponse],
    summary="List interaction history / activity timeline",
)
async def list_activities(
    lead_id: Optional[uuid.UUID] = Query(None, description="Filter by lead"),
    contact_id: Optional[uuid.UUID] = Query(None, description="Filter by contact"),
    deal_id: Optional[uuid.UUID] = Query(None, description="Filter by deal"),
    type: Optional[str] = Query(None, description="Filter by activity type (call, email, meeting, note)"),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await ActivityService.list_activities(
        db=db,
        lead_id=lead_id,
        contact_id=contact_id,
        deal_id=deal_id,
        activity_type=type,
        limit=limit,
    )


@router.get(
    "/{activity_id}",
    response_model=ActivityResponse,
    summary="Get single activity detail",
)
async def get_activity(
    activity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    activity = await db.get(Activity, activity_id)
    if not activity:
        raise NotFoundError("Activity not found")
    return activity


@router.patch(
    "/{activity_id}",
    response_model=ActivityResponse,
    summary="Update activity notes or outcome",
)
async def update_activity(
    activity_id: uuid.UUID,
    activity_in: ActivityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    activity = await db.get(Activity, activity_id)
    if not activity:
        raise NotFoundError("Activity not found")
    
    update_data = activity_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(activity, field, value)
    
    await db.commit()
    await db.refresh(activity)
    return activity


@router.delete(
    "/{activity_id}",
    response_model=MessageResponse,
    summary="Delete an activity entry",
)
async def delete_activity(
    activity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    activity = await db.get(Activity, activity_id)
    if not activity:
        raise NotFoundError("Activity not found")
    await db.delete(activity)
    await db.commit()
    return MessageResponse(message="Activity deleted successfully")
