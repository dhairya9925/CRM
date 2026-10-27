from typing import Any, Optional
import uuid
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.activity import Activity
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactUpdate
from app.utils.pagination import Page, paginate


class ContactService:
    @staticmethod
    async def create_contact(
        db: AsyncSession, contact_in: ContactCreate, current_user: User
    ) -> Contact:
        if contact_in.email:
            existing = await db.execute(
                select(Contact).where(
                    Contact.email == str(contact_in.email).lower().strip(),
                    Contact.is_deleted == False,
                )
            )
            if existing.scalar_one_or_none():
                raise ConflictError(
                    f"Contact with email '{contact_in.email}' already exists"
                )

        owner_id = contact_in.owner_id or current_user.id
        contact = Contact(
            first_name=contact_in.first_name.strip(),
            last_name=contact_in.last_name.strip(),
            email=str(contact_in.email).lower().strip() if contact_in.email else None,
            phone=contact_in.phone.strip() if contact_in.phone else None,
            company_id=contact_in.company_id,
            owner_id=owner_id,
            notes=contact_in.notes,
            custom_fields=contact_in.custom_fields or {},
        )
        db.add(contact)
        await db.commit()
        await db.refresh(contact)
        return contact

    @staticmethod
    async def get_contact(db: AsyncSession, contact_id: uuid.UUID) -> Contact:
        query = select(Contact).where(
            Contact.id == contact_id, Contact.is_deleted == False
        )
        result = await db.execute(query)
        contact = result.scalar_one_or_none()
        if not contact:
            raise NotFoundError("Contact not found")
        return contact

    @staticmethod
    async def list_contacts(
        db: AsyncSession,
        search: Optional[str] = None,
        company_id: Optional[uuid.UUID] = None,
        owner_id: Optional[uuid.UUID] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> Page[Any]:
        query = select(Contact).where(Contact.is_deleted == False)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Contact.first_name.ilike(search_term),
                    Contact.last_name.ilike(search_term),
                    Contact.email.ilike(search_term),
                    Contact.phone.ilike(search_term),
                )
            )
        if company_id:
            query = query.where(Contact.company_id == company_id)
        if owner_id:
            query = query.where(Contact.owner_id == owner_id)

        # Dynamic sort safely
        sort_column = getattr(Contact, sort_by, Contact.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        items, total = await paginate(db, query, page, page_size)
        return Page.create(items, total, page, page_size)

    @staticmethod
    async def update_contact(
        db: AsyncSession, contact_id: uuid.UUID, contact_in: ContactUpdate
    ) -> Contact:
        contact = await ContactService.get_contact(db, contact_id)

        update_data = contact_in.model_dump(exclude_unset=True)

        # Handle custom_fields merge patch
        if "custom_fields" in update_data and update_data["custom_fields"] is not None:
            merged_fields = dict(contact.custom_fields or {})
            merged_fields.update(update_data["custom_fields"])
            contact.custom_fields = merged_fields
            del update_data["custom_fields"]

        for key, value in update_data.items():
            if key == "email" and value:
                value = str(value).lower().strip()
            setattr(contact, key, value)

        await db.commit()
        await db.refresh(contact)
        return contact

    @staticmethod
    async def delete_contact(db: AsyncSession, contact_id: uuid.UUID) -> bool:
        contact = await ContactService.get_contact(db, contact_id)
        contact.is_deleted = True
        await db.commit()
        return True

    @staticmethod
    async def get_contact_deals(db: AsyncSession, contact_id: uuid.UUID) -> list[Deal]:
        await ContactService.get_contact(db, contact_id)
        query = select(Deal).where(
            Deal.contact_id == contact_id, Deal.is_deleted == False
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_contact_activities(
        db: AsyncSession, contact_id: uuid.UUID
    ) -> list[Activity]:
        await ContactService.get_contact(db, contact_id)
        query = (
            select(Activity)
            .where(Activity.contact_id == contact_id)
            .order_by(Activity.occurred_at.desc())
        )
        result = await db.execute(query)
        return list(result.scalars().all())
