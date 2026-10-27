from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.schemas.activity import ActivityResponse
from app.schemas.auth import MessageResponse
from app.schemas.contact import ContactCreate, ContactResponse, ContactUpdate
from app.schemas.deal import DealResponse
from app.services.contact_service import ContactService
from app.utils.pagination import Page

router = APIRouter(prefix="/contacts", tags=["Contacts"])


@router.post(
    "/",
    response_model=ContactResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new contact",
)
async def create_contact(
    contact_in: ContactCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await ContactService.create_contact(
        db=db, contact_in=contact_in, current_user=current_user
    )


@router.get(
    "/",
    response_model=Page[ContactResponse],
    summary="List contacts with search, filter, sorting, and pagination",
)
async def list_contacts(
    search: Optional[str] = Query(None, description="Search by name, email, or phone"),
    company_id: Optional[uuid.UUID] = Query(None, description="Filter by company"),
    owner_id: Optional[uuid.UUID] = Query(None, description="Filter by owner"),
    sort_by: str = Query("created_at", description="Sort field (created_at, first_name, last_name)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await ContactService.list_contacts(
        db=db,
        search=search,
        company_id=company_id,
        owner_id=owner_id,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{contact_id}",
    response_model=ContactResponse,
    summary="Get contact details by ID",
)
async def get_contact(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await ContactService.get_contact(db=db, contact_id=contact_id)


@router.patch(
    "/{contact_id}",
    response_model=ContactResponse,
    summary="Update contact details or custom fields",
)
async def update_contact(
    contact_id: uuid.UUID,
    contact_in: ContactUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await ContactService.update_contact(
        db=db, contact_id=contact_id, contact_in=contact_in
    )


@router.delete(
    "/{contact_id}",
    response_model=MessageResponse,
    summary="Soft delete contact",
)
async def delete_contact(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await ContactService.delete_contact(db=db, contact_id=contact_id)
    return MessageResponse(message="Contact deleted successfully")


@router.get(
    "/{contact_id}/deals",
    response_model=List[DealResponse],
    summary="Get deals linked to contact",
)
async def get_contact_deals(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await ContactService.get_contact_deals(db=db, contact_id=contact_id)


@router.get(
    "/{contact_id}/activities",
    response_model=List[ActivityResponse],
    summary="Get activities and interaction history for contact",
)
async def get_contact_activities(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await ContactService.get_contact_activities(db=db, contact_id=contact_id)
