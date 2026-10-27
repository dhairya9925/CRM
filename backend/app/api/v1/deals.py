from typing import List, Optional, Union
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.schemas.activity import ActivityResponse
from app.schemas.auth import MessageResponse
from app.schemas.deal import (
    DealCreate,
    DealKanbanResponse,
    DealResponse,
    DealStageUpdate,
    DealUpdate,
)
from app.services.deal_service import DealService
from app.utils.pagination import Page

router = APIRouter(prefix="/deals", tags=["Deals & Sales Pipeline"])


@router.post(
    "/",
    response_model=DealResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new deal opportunity",
)
async def create_deal(
    deal_in: DealCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await DealService.create_deal(
        db=db, deal_in=deal_in, current_user=current_user
    )


@router.get(
    "/",
    response_model=Union[DealKanbanResponse, Page[DealResponse]],
    summary="List deals (table pagination or Kanban grouping)",
)
async def list_deals(
    kanban: bool = Query(False, description="Set true to group deals by stage for Kanban boards"),
    search: Optional[str] = Query(None, description="Search deal by name"),
    stage: Optional[str] = Query(None, description="Filter by stage"),
    owner_id: Optional[uuid.UUID] = Query(None, description="Filter by owner"),
    company_id: Optional[uuid.UUID] = Query(None, description="Filter by company"),
    contact_id: Optional[uuid.UUID] = Query(None, description="Filter by contact"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if kanban:
        return await DealService.list_kanban(db=db, owner_id=owner_id)

    return await DealService.list_deals(
        db=db,
        search=search,
        stage=stage,
        owner_id=owner_id,
        company_id=company_id,
        contact_id=contact_id,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{deal_id}",
    response_model=DealResponse,
    summary="Get deal details by ID",
)
async def get_deal(
    deal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await DealService.get_deal(db=db, deal_id=deal_id)


@router.patch(
    "/{deal_id}",
    response_model=DealResponse,
    summary="Update deal attributes",
)
async def update_deal(
    deal_id: uuid.UUID,
    deal_in: DealUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await DealService.update_deal(
        db=db, deal_id=deal_id, deal_in=deal_in, current_user=current_user
    )


@router.patch(
    "/{deal_id}/stage",
    response_model=DealResponse,
    summary="Move deal to a new stage in pipeline",
)
async def update_deal_stage(
    deal_id: uuid.UUID,
    stage_in: DealStageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await DealService.update_stage(
        db=db,
        deal_id=deal_id,
        new_stage=stage_in.stage,
        current_user=current_user,
    )


@router.delete(
    "/{deal_id}",
    response_model=MessageResponse,
    summary="Soft delete deal",
)
async def delete_deal(
    deal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await DealService.delete_deal(db=db, deal_id=deal_id)
    return MessageResponse(message="Deal deleted successfully")


@router.get(
    "/{deal_id}/activities",
    response_model=List[ActivityResponse],
    summary="Get timeline activities linked to deal",
)
async def get_deal_activities(
    deal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await DealService.get_deal_activities(db=db, deal_id=deal_id)
