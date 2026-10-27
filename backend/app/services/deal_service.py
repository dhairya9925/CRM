from typing import Any, List, Optional
import uuid
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.activity import Activity, ActivityType
from app.models.deal import Deal, DealStage
from app.models.user import User
from app.schemas.deal import (
    DealCreate,
    DealKanbanResponse,
    DealKanbanStage,
    DealResponse,
    DealUpdate,
)
from app.services.activity_service import ActivityService
from app.utils.pagination import Page, paginate


class DealService:
    @staticmethod
    async def create_deal(
        db: AsyncSession, deal_in: DealCreate, current_user: User
    ) -> Deal:
        owner_id = deal_in.owner_id or current_user.id
        deal = Deal(
            name=deal_in.name.strip(),
            value=deal_in.value,
            stage=deal_in.stage.value if hasattr(deal_in.stage, "value") else str(deal_in.stage),
            expected_close_date=deal_in.expected_close_date,
            contact_id=deal_in.contact_id,
            company_id=deal_in.company_id,
            owner_id=owner_id,
        )
        db.add(deal)
        await db.commit()
        await db.refresh(deal)

        # Log creation activity
        await ActivityService.log_activity(
            db=db,
            type=ActivityType.STAGE_CHANGE.value,
            notes=f"Deal '{deal.name}' created in stage '{deal.stage}' with value ${deal.value:,.2f}",
            performed_by=current_user.id,
            deal_id=deal.id,
            contact_id=deal.contact_id,
        )

        return deal

    @staticmethod
    async def get_deal(db: AsyncSession, deal_id: uuid.UUID) -> Deal:
        query = select(Deal).where(Deal.id == deal_id, Deal.is_deleted == False)
        result = await db.execute(query)
        deal = result.scalar_one_or_none()
        if not deal:
            raise NotFoundError("Deal not found")
        return deal

    @staticmethod
    async def list_deals(
        db: AsyncSession,
        search: Optional[str] = None,
        stage: Optional[str] = None,
        owner_id: Optional[uuid.UUID] = None,
        company_id: Optional[uuid.UUID] = None,
        contact_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Page[Any]:
        query = select(Deal).where(Deal.is_deleted == False)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.where(Deal.name.ilike(search_term))
        if stage:
            query = query.where(Deal.stage == stage)
        if owner_id:
            query = query.where(Deal.owner_id == owner_id)
        if company_id:
            query = query.where(Deal.company_id == company_id)
        if contact_id:
            query = query.where(Deal.contact_id == contact_id)

        query = query.order_by(Deal.created_at.desc())
        items, total = await paginate(db, query, page, page_size)
        return Page.create(items, total, page, page_size)

    @staticmethod
    async def list_kanban(
        db: AsyncSession,
        owner_id: Optional[uuid.UUID] = None,
    ) -> DealKanbanResponse:
        query = select(Deal).where(Deal.is_deleted == False)
        if owner_id:
            query = query.where(Deal.owner_id == owner_id)
        query = query.order_by(Deal.created_at.desc())

        result = await db.execute(query)
        deals = list(result.scalars().all())

        stages_map = {stage: [] for stage in DealStage}
        total_pipeline_value = 0.0

        for deal in deals:
            try:
                stage_enum = DealStage(deal.stage)
            except ValueError:
                stage_enum = DealStage.QUALIFICATION
            stages_map[stage_enum].append(DealResponse.model_validate(deal))
            if stage_enum not in (DealStage.WON, DealStage.LOST):
                total_pipeline_value += float(deal.value or 0.0)

        kanban_stages = []
        for stage_enum in DealStage:
            stage_deals = stages_map[stage_enum]
            stage_val = sum(float(d.value) for d in stage_deals)
            kanban_stages.append(
                DealKanbanStage(
                    stage=stage_enum,
                    deal_count=len(stage_deals),
                    total_value=stage_val,
                    deals=stage_deals,
                )
            )

        return DealKanbanResponse(
            stages=kanban_stages,
            total_pipeline_value=total_pipeline_value,
        )

    @staticmethod
    async def update_deal(
        db: AsyncSession, deal_id: uuid.UUID, deal_in: DealUpdate, current_user: User
    ) -> Deal:
        deal = await DealService.get_deal(db, deal_id)
        old_stage = deal.stage

        update_data = deal_in.model_dump(exclude_unset=True)
        if "stage" in update_data and update_data["stage"]:
            update_data["stage"] = (
                update_data["stage"].value
                if hasattr(update_data["stage"], "value")
                else str(update_data["stage"])
            )

        for key, value in update_data.items():
            setattr(deal, key, value)

        await db.commit()
        await db.refresh(deal)

        if "stage" in update_data and old_stage != deal.stage:
            await ActivityService.log_activity(
                db=db,
                type=ActivityType.STAGE_CHANGE.value,
                notes=f"Deal stage changed from '{old_stage}' to '{deal.stage}'",
                performed_by=current_user.id,
                deal_id=deal.id,
                contact_id=deal.contact_id,
            )

        return deal

    @staticmethod
    async def update_stage(
        db: AsyncSession, deal_id: uuid.UUID, new_stage: DealStage, current_user: User
    ) -> Deal:
        deal = await DealService.get_deal(db, deal_id)
        old_stage = deal.stage
        deal.stage = new_stage.value
        await db.commit()
        await db.refresh(deal)

        await ActivityService.log_activity(
            db=db,
            type=ActivityType.STAGE_CHANGE.value,
            notes=f"Deal stage progressed from '{old_stage}' to '{deal.stage}'",
            performed_by=current_user.id,
            deal_id=deal.id,
            contact_id=deal.contact_id,
        )
        return deal

    @staticmethod
    async def delete_deal(db: AsyncSession, deal_id: uuid.UUID) -> bool:
        deal = await DealService.get_deal(db, deal_id)
        deal.is_deleted = True
        await db.commit()
        return True

    @staticmethod
    async def get_deal_activities(
        db: AsyncSession, deal_id: uuid.UUID
    ) -> list[Activity]:
        await DealService.get_deal(db, deal_id)
        query = (
            select(Activity)
            .where(Activity.deal_id == deal_id)
            .order_by(Activity.occurred_at.desc())
        )
        result = await db.execute(query)
        return list(result.scalars().all())
