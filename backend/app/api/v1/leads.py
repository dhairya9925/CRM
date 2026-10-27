from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db, require_manager_or_admin
from app.models.user import User
from app.schemas.activity import ActivityResponse
from app.schemas.auth import MessageResponse
from app.schemas.lead import (
    LeadAssign,
    LeadConvertRequest,
    LeadConvertResponse,
    LeadCreate,
    LeadImportResponse,
    LeadResponse,
    LeadUpdate,
)
from app.services.csv_import_service import CsvImportService
from app.services.lead_service import LeadService
from app.utils.pagination import Page

router = APIRouter(prefix="/leads", tags=["Leads"])


@router.post(
    "/",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lead",
)
async def create_lead(
    lead_in: LeadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await LeadService.create_lead(
        db=db, lead_in=lead_in, current_user=current_user
    )


@router.get(
    "/",
    response_model=Page[LeadResponse],
    summary="List leads with filtering and pagination",
)
async def list_leads(
    search: Optional[str] = Query(None, description="Search by name, email, or company"),
    status: Optional[str] = Query(None, description="Filter by status (new, contacted, qualified, lost)"),
    source: Optional[str] = Query(None, description="Filter by source"),
    assigned_to: Optional[uuid.UUID] = Query(None, description="Filter by assigned user"),
    is_converted: Optional[bool] = Query(None, description="Filter by conversion status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await LeadService.list_leads(
        db=db,
        search=search,
        status=status,
        source=source,
        assigned_to=assigned_to,
        is_converted=is_converted,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/import",
    response_model=LeadImportResponse,
    summary="Bulk import leads via CSV file upload (Manager/Admin only)",
)
async def import_leads(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    return await CsvImportService.import_leads_from_csv(
        db=db, file=file, current_user=current_user
    )


@router.get(
    "/{lead_id}",
    response_model=LeadResponse,
    summary="Get lead details by ID",
)
async def get_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await LeadService.get_lead(db=db, lead_id=lead_id)


@router.patch(
    "/{lead_id}",
    response_model=LeadResponse,
    summary="Update lead details",
)
async def update_lead(
    lead_id: uuid.UUID,
    lead_in: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await LeadService.update_lead(
        db=db, lead_id=lead_id, lead_in=lead_in, current_user=current_user
    )


@router.patch(
    "/{lead_id}/assign",
    response_model=LeadResponse,
    summary="Reassign lead to team member (Manager/Admin only)",
)
async def assign_lead(
    lead_id: uuid.UUID,
    assign_in: LeadAssign,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    return await LeadService.assign_lead(
        db=db,
        lead_id=lead_id,
        new_assignee_id=assign_in.assigned_to,
        current_user=current_user,
    )


@router.post(
    "/{lead_id}/convert",
    response_model=LeadConvertResponse,
    summary="Convert lead into Contact and Deal",
)
async def convert_lead(
    lead_id: uuid.UUID,
    req: LeadConvertRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await LeadService.convert_lead(
        db=db, lead_id=lead_id, req=req, current_user=current_user
    )


@router.delete(
    "/{lead_id}",
    response_model=MessageResponse,
    summary="Soft delete lead",
)
async def delete_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await LeadService.delete_lead(db=db, lead_id=lead_id)
    return MessageResponse(message="Lead deleted successfully")


@router.get(
    "/{lead_id}/activities",
    response_model=List[ActivityResponse],
    summary="Get activities linked to lead",
)
async def get_lead_activities(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await LeadService.get_lead_activities(db=db, lead_id=lead_id)
