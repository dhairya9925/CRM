from datetime import datetime, time, timedelta, timezone
from typing import List
import uuid
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.deal import Deal, DealStage
from app.models.lead import Lead
from app.models.task import Task, TaskStatus
from app.models.user import User, UserRole
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    GroupCountData,
    PipelineStageMetric,
)
from app.schemas.task import TaskResponse


class DashboardService:
    @staticmethod
    async def get_summary(
        db: AsyncSession, current_user: User
    ) -> DashboardSummaryResponse:
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)
        start_of_day = datetime.combine(now.date(), time.min).replace(tzinfo=timezone.utc)
        end_of_day = datetime.combine(now.date(), time.max).replace(tzinfo=timezone.utc)

        # Base filters based on role
        is_rep = current_user.role == UserRole.SALES_REP.value

        # 1. Total leads
        lead_query = select(func.count(Lead.id)).where(Lead.is_deleted == False)
        if is_rep:
            lead_query = lead_query.where(Lead.assigned_to == current_user.id)
        total_leads = (await db.execute(lead_query)).scalar_one() or 0

        # 2. New leads this week
        new_lead_query = lead_query.where(Lead.created_at >= week_ago)
        new_leads_this_week = (await db.execute(new_lead_query)).scalar_one() or 0

        # 3. Open deals and pipeline value (stages not won or lost)
        deal_query = select(
            func.count(Deal.id),
            func.coalesce(func.sum(Deal.value), 0.0),
        ).where(
            Deal.is_deleted == False,
            Deal.stage.notin_([DealStage.WON.value, DealStage.LOST.value]),
        )
        if is_rep:
            deal_query = deal_query.where(Deal.owner_id == current_user.id)
        open_res = (await db.execute(deal_query)).first()
        open_deals = open_res[0] or 0
        pipeline_value = float(open_res[1] or 0.0)

        # 4. Won deals and value
        won_query = select(
            func.count(Deal.id),
            func.coalesce(func.sum(Deal.value), 0.0),
        ).where(
            Deal.is_deleted == False,
            Deal.stage == DealStage.WON.value,
        )
        if is_rep:
            won_query = won_query.where(Deal.owner_id == current_user.id)
        won_res = (await db.execute(won_query)).first()
        won_deals = won_res[0] or 0
        won_value = float(won_res[1] or 0.0)

        # 5. Tasks due today
        task_today_query = select(func.count(Task.id)).where(
            Task.is_deleted == False,
            Task.due_date >= start_of_day,
            Task.due_date <= end_of_day,
            Task.status.in_([TaskStatus.PENDING.value, TaskStatus.IN_PROGRESS.value]),
        )
        if is_rep:
            task_today_query = task_today_query.where(Task.assigned_to == current_user.id)
        tasks_due_today = (await db.execute(task_today_query)).scalar_one() or 0

        # 6. Overdue tasks
        task_overdue_query = select(func.count(Task.id)).where(
            Task.is_deleted == False,
            Task.due_date < now,
            Task.status.in_([TaskStatus.PENDING.value, TaskStatus.IN_PROGRESS.value]),
        )
        if is_rep:
            task_overdue_query = task_overdue_query.where(Task.assigned_to == current_user.id)
        overdue_tasks = (await db.execute(task_overdue_query)).scalar_one() or 0

        return DashboardSummaryResponse(
            total_leads=total_leads,
            new_leads_this_week=new_leads_this_week,
            open_deals=open_deals,
            pipeline_value=pipeline_value,
            won_deals=won_deals,
            won_value=won_value,
            tasks_due_today=tasks_due_today,
            overdue_tasks=overdue_tasks,
        )

    @staticmethod
    async def get_leads_by_status(db: AsyncSession) -> List[GroupCountData]:
        query = (
            select(Lead.status, func.count(Lead.id))
            .where(Lead.is_deleted == False)
            .group_by(Lead.status)
        )
        result = await db.execute(query)
        return [GroupCountData(label=row[0], count=row[1]) for row in result.all()]

    @staticmethod
    async def get_leads_by_source(db: AsyncSession) -> List[GroupCountData]:
        query = (
            select(Lead.source, func.count(Lead.id))
            .where(Lead.is_deleted == False)
            .group_by(Lead.source)
        )
        result = await db.execute(query)
        return [GroupCountData(label=row[0], count=row[1]) for row in result.all()]

    @staticmethod
    async def get_pipeline_by_stage(db: AsyncSession) -> List[PipelineStageMetric]:
        query = (
            select(
                Deal.stage,
                func.count(Deal.id),
                func.coalesce(func.sum(Deal.value), 0.0),
            )
            .where(Deal.is_deleted == False)
            .group_by(Deal.stage)
        )
        result = await db.execute(query)
        stage_dict = {row[0]: (row[1], float(row[2])) for row in result.all()}

        output = []
        for stage in DealStage:
            count, val = stage_dict.get(stage.value, (0, 0.0))
            output.append(
                PipelineStageMetric(
                    stage=stage.value,
                    deal_count=count,
                    total_value=val,
                )
            )
        return output

    @staticmethod
    async def get_tasks_due_today(
        db: AsyncSession, current_user: User
    ) -> List[TaskResponse]:
        now = datetime.now(timezone.utc)
        start_of_day = datetime.combine(now.date(), time.min).replace(tzinfo=timezone.utc)
        end_of_day = datetime.combine(now.date(), time.max).replace(tzinfo=timezone.utc)

        query = (
            select(Task)
            .where(
                Task.is_deleted == False,
                Task.assigned_to == current_user.id,
                Task.due_date >= start_of_day,
                Task.due_date <= end_of_day,
            )
            .order_by(Task.due_date.asc())
        )
        result = await db.execute(query)
        return [TaskResponse.model_validate(t) for t in result.scalars().all()]

    @staticmethod
    async def get_tasks_overdue(
        db: AsyncSession, current_user: User
    ) -> List[TaskResponse]:
        now = datetime.now(timezone.utc)
        query = (
            select(Task)
            .where(
                Task.is_deleted == False,
                Task.assigned_to == current_user.id,
                Task.due_date < now,
                Task.status.in_([TaskStatus.PENDING.value, TaskStatus.IN_PROGRESS.value]),
            )
            .order_by(Task.due_date.asc())
        )
        result = await db.execute(query)
        return [TaskResponse.model_validate(t) for t in result.scalars().all()]
