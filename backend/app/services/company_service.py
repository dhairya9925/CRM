from typing import Any, Optional
import uuid
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.company import Company
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyUpdate
from app.utils.pagination import Page, paginate


class CompanyService:
    @staticmethod
    async def create_company(
        db: AsyncSession, company_in: CompanyCreate, current_user: User
    ) -> Company:
        owner_id = company_in.owner_id or current_user.id
        company = Company(
            name=company_in.name.strip(),
            website=company_in.website.strip() if company_in.website else None,
            industry=company_in.industry.strip() if company_in.industry else None,
            phone=company_in.phone.strip() if company_in.phone else None,
            address=company_in.address.strip() if company_in.address else None,
            owner_id=owner_id,
        )
        db.add(company)
        await db.commit()
        await db.refresh(company)
        return company

    @staticmethod
    async def get_company(db: AsyncSession, company_id: uuid.UUID) -> Company:
        query = select(Company).where(
            Company.id == company_id, Company.is_deleted == False
        )
        result = await db.execute(query)
        company = result.scalar_one_or_none()
        if not company:
            raise NotFoundError("Company not found")
        return company

    @staticmethod
    async def list_companies(
        db: AsyncSession,
        search: Optional[str] = None,
        industry: Optional[str] = None,
        owner_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Page[Any]:
        query = select(Company).where(Company.is_deleted == False)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Company.name.ilike(search_term),
                    Company.industry.ilike(search_term),
                    Company.website.ilike(search_term),
                )
            )
        if industry:
            query = query.where(Company.industry == industry)
        if owner_id:
            query = query.where(Company.owner_id == owner_id)

        query = query.order_by(Company.created_at.desc())
        items, total = await paginate(db, query, page, page_size)
        return Page.create(items, total, page, page_size)

    @staticmethod
    async def update_company(
        db: AsyncSession, company_id: uuid.UUID, company_in: CompanyUpdate
    ) -> Company:
        company = await CompanyService.get_company(db, company_id)

        update_data = company_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(company, key, value)

        await db.commit()
        await db.refresh(company)
        return company

    @staticmethod
    async def delete_company(db: AsyncSession, company_id: uuid.UUID) -> bool:
        company = await CompanyService.get_company(db, company_id)
        company.is_deleted = True
        await db.commit()
        return True

    @staticmethod
    async def get_company_contacts(
        db: AsyncSession, company_id: uuid.UUID
    ) -> list[Contact]:
        await CompanyService.get_company(db, company_id)
        query = select(Contact).where(
            Contact.company_id == company_id, Contact.is_deleted == False
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_company_deals(db: AsyncSession, company_id: uuid.UUID) -> list[Deal]:
        await CompanyService.get_company(db, company_id)
        query = select(Deal).where(
            Deal.company_id == company_id, Deal.is_deleted == False
        )
        result = await db.execute(query)
        return list(result.scalars().all())
