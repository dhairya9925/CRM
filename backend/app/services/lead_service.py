from typing import Any, Optional
import uuid
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.activity import Activity, ActivityType
from app.models.company import Company
from app.models.contact import Contact
from app.models.deal import Deal, DealStage
from app.models.lead import Lead, LeadStatus
from app.models.user import User
from app.schemas.lead import (
    LeadConvertRequest,
    LeadConvertResponse,
    LeadCreate,
    LeadUpdate,
)
from app.services.activity_service import ActivityService
from app.utils.pagination import Page, paginate


class LeadService:
    @staticmethod
    async def create_lead(
        db: AsyncSession, lead_in: LeadCreate, current_user: User
    ) -> Lead:
        assigned_to = lead_in.assigned_to or current_user.id
        lead = Lead(
            first_name=lead_in.first_name.strip(),
            last_name=lead_in.last_name.strip(),
            email=str(lead_in.email).lower().strip() if lead_in.email else None,
            phone=lead_in.phone.strip() if lead_in.phone else None,
            company_name=lead_in.company_name.strip() if lead_in.company_name else None,
            source=lead_in.source.value if hasattr(lead_in.source, "value") else str(lead_in.source),
            status=lead_in.status.value if hasattr(lead_in.status, "value") else str(lead_in.status),
            assigned_to=assigned_to,
        )
        db.add(lead)
        await db.commit()
        await db.refresh(lead)

        await ActivityService.log_activity(
            db=db,
            type=ActivityType.STATUS_CHANGE.value,
            notes=f"Lead created with status '{lead.status}'",
            performed_by=current_user.id,
            lead_id=lead.id,
        )

        return lead

    @staticmethod
    async def get_lead(db: AsyncSession, lead_id: uuid.UUID) -> Lead:
        query = select(Lead).where(Lead.id == lead_id, Lead.is_deleted == False)
        result = await db.execute(query)
        lead = result.scalar_one_or_none()
        if not lead:
            raise NotFoundError("Lead not found")
        return lead

    @staticmethod
    async def list_leads(
        db: AsyncSession,
        search: Optional[str] = None,
        status: Optional[str] = None,
        source: Optional[str] = None,
        assigned_to: Optional[uuid.UUID] = None,
        is_converted: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Page[Any]:
        query = select(Lead).where(Lead.is_deleted == False)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Lead.first_name.ilike(search_term),
                    Lead.last_name.ilike(search_term),
                    Lead.email.ilike(search_term),
                    Lead.company_name.ilike(search_term),
                )
            )
        if status:
            query = query.where(Lead.status == status)
        if source:
            query = query.where(Lead.source == source)
        if assigned_to:
            query = query.where(Lead.assigned_to == assigned_to)
        if is_converted is not None:
            query = query.where(Lead.is_converted == is_converted)

        query = query.order_by(Lead.created_at.desc())
        items, total = await paginate(db, query, page, page_size)
        return Page.create(items, total, page, page_size)

    @staticmethod
    async def update_lead(
        db: AsyncSession, lead_id: uuid.UUID, lead_in: LeadUpdate, current_user: User
    ) -> Lead:
        lead = await LeadService.get_lead(db, lead_id)
        old_status = lead.status

        update_data = lead_in.model_dump(exclude_unset=True)
        if "source" in update_data and update_data["source"]:
            update_data["source"] = (
                update_data["source"].value
                if hasattr(update_data["source"], "value")
                else str(update_data["source"])
            )
        if "status" in update_data and update_data["status"]:
            update_data["status"] = (
                update_data["status"].value
                if hasattr(update_data["status"], "value")
                else str(update_data["status"])
            )

        for key, value in update_data.items():
            setattr(lead, key, value)

        await db.commit()
        await db.refresh(lead)

        if "status" in update_data and old_status != lead.status:
            await ActivityService.log_activity(
                db=db,
                type=ActivityType.STATUS_CHANGE.value,
                notes=f"Lead status updated from '{old_status}' to '{lead.status}'",
                performed_by=current_user.id,
                lead_id=lead.id,
            )

        return lead

    @staticmethod
    async def assign_lead(
        db: AsyncSession,
        lead_id: uuid.UUID,
        new_assignee_id: uuid.UUID,
        current_user: User,
    ) -> Lead:
        lead = await LeadService.get_lead(db, lead_id)
        lead.assigned_to = new_assignee_id
        await db.commit()
        await db.refresh(lead)

        await ActivityService.log_activity(
            db=db,
            type=ActivityType.NOTE.value,
            notes=f"Lead re-assigned to user {new_assignee_id}",
            performed_by=current_user.id,
            lead_id=lead.id,
        )
        return lead

    @staticmethod
    async def convert_lead(
        db: AsyncSession,
        lead_id: uuid.UUID,
        req: LeadConvertRequest,
        current_user: User,
    ) -> LeadConvertResponse:
        lead = await LeadService.get_lead(db, lead_id)
        if lead.is_converted:
            raise ConflictError("Lead has already been converted")

        # 1. Company check or create if provided
        company_id = None
        if lead.company_name:
            comp_res = await db.execute(
                select(Company).where(
                    Company.name.ilike(lead.company_name.strip()),
                    Company.is_deleted == False,
                )
            )
            company = comp_res.scalar_one_or_none()
            if not company:
                company = Company(
                    name=lead.company_name.strip(),
                    owner_id=current_user.id,
                )
                db.add(company)
                await db.flush()
            company_id = company.id

        # 2. Create Contact from lead details
        contact = Contact(
            first_name=lead.first_name,
            last_name=lead.last_name,
            email=lead.email,
            phone=lead.phone,
            company_id=company_id,
            owner_id=current_user.id,
            notes=f"Converted from lead on {lead.created_at.strftime('%Y-%m-%d')}",
        )
        db.add(contact)
        await db.flush()

        # 3. Create Deal if requested
        deal_id = None
        if req.create_deal:
            deal_name = req.deal_name or f"{lead.company_name or contact.full_name} Deal"
            deal = Deal(
                name=deal_name,
                value=req.deal_value,
                stage=DealStage.QUALIFICATION.value,
                expected_close_date=req.expected_close_date,
                contact_id=contact.id,
                company_id=company_id,
                owner_id=current_user.id,
            )
            db.add(deal)
            await db.flush()
            deal_id = deal.id

        # 4. Update Lead conversion status
        lead.is_converted = True
        lead.status = LeadStatus.QUALIFIED.value
        lead.converted_contact_id = contact.id
        lead.converted_deal_id = deal_id

        await db.commit()

        # 5. Emit conversion activity
        await ActivityService.log_activity(
            db=db,
            type=ActivityType.CONVERSION.value,
            notes=f"Lead converted into Contact '{contact.full_name}'"
            + (f" and Deal '{deal.name}'" if deal_id else ""),
            performed_by=current_user.id,
            lead_id=lead.id,
            contact_id=contact.id,
            deal_id=deal_id,
        )

        return LeadConvertResponse(
            lead_id=lead.id,
            contact_id=contact.id,
            deal_id=deal_id,
            message="Lead successfully converted to Contact and Deal",
        )

    @staticmethod
    async def delete_lead(db: AsyncSession, lead_id: uuid.UUID) -> bool:
        lead = await LeadService.get_lead(db, lead_id)
        lead.is_deleted = True
        await db.commit()
        return True

    @staticmethod
    async def get_lead_activities(
        db: AsyncSession, lead_id: uuid.UUID
    ) -> list[Activity]:
        await LeadService.get_lead(db, lead_id)
        query = (
            select(Activity)
            .where(Activity.lead_id == lead_id)
            .order_by(Activity.occurred_at.desc())
        )
        result = await db.execute(query)
        return list(result.scalars().all())
