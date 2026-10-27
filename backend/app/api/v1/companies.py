from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.company import CompanyCreate, CompanyResponse, CompanyUpdate
from app.schemas.contact import ContactResponse
from app.schemas.deal import DealResponse
from app.services.company_service import CompanyService
from app.utils.pagination import Page

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.post(
    "/",
    response_model=CompanyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new company",
)
async def create_company(
    company_in: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await CompanyService.create_company(
        db=db, company_in=company_in, current_user=current_user
    )


@router.get(
    "/",
    response_model=Page[CompanyResponse],
    summary="List companies with search, filter, and pagination",
)
async def list_companies(
    search: Optional[str] = Query(None, description="Search by name, industry, or website"),
    industry: Optional[str] = Query(None, description="Filter by industry"),
    owner_id: Optional[uuid.UUID] = Query(None, description="Filter by owner"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await CompanyService.list_companies(
        db=db,
        search=search,
        industry=industry,
        owner_id=owner_id,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{company_id}",
    response_model=CompanyResponse,
    summary="Get company details by ID",
)
async def get_company(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await CompanyService.get_company(db=db, company_id=company_id)


@router.patch(
    "/{company_id}",
    response_model=CompanyResponse,
    summary="Update company details",
)
async def update_company(
    company_id: uuid.UUID,
    company_in: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await CompanyService.update_company(
        db=db, company_id=company_id, company_in=company_in
    )


@router.delete(
    "/{company_id}",
    response_model=MessageResponse,
    summary="Soft delete company",
)
async def delete_company(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await CompanyService.delete_company(db=db, company_id=company_id)
    return MessageResponse(message="Company deleted successfully")


@router.get(
    "/{company_id}/contacts",
    response_model=List[ContactResponse],
    summary="Get contacts belonging to company",
)
async def get_company_contacts(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await CompanyService.get_company_contacts(db=db, company_id=company_id)


@router.get(
    "/{company_id}/deals",
    response_model=List[DealResponse],
    summary="Get deals linked to company",
)
async def get_company_deals(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await CompanyService.get_company_deals(db=db, company_id=company_id)
