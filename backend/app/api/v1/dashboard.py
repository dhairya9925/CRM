from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    GroupCountData,
    PipelineStageMetric,
)
from app.schemas.task import TaskResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    summary="Get aggregated KPI summary (leads, pipeline value, won revenue, tasks)",
)
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await DashboardService.get_summary(db=db, current_user=current_user)


@router.get(
    "/leads-by-status",
    response_model=List[GroupCountData],
    summary="Get lead counts grouped by status",
)
async def get_leads_by_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await DashboardService.get_leads_by_status(db=db)


@router.get(
    "/leads-by-source",
    response_model=List[GroupCountData],
    summary="Get lead counts grouped by source",
)
async def get_leads_by_source(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await DashboardService.get_leads_by_source(db=db)


@router.get(
    "/pipeline",
    response_model=List[PipelineStageMetric],
    summary="Get pipeline deal count and value grouped by stage",
)
async def get_pipeline_by_stage(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await DashboardService.get_pipeline_by_stage(db=db)


@router.get(
    "/tasks-due-today",
    response_model=List[TaskResponse],
    summary="Get pending tasks due today for current user",
)
async def get_tasks_due_today(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await DashboardService.get_tasks_due_today(db=db, current_user=current_user)


@router.get(
    "/tasks-overdue",
    response_model=List[TaskResponse],
    summary="Get overdue tasks for current user",
)
async def get_tasks_overdue(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await DashboardService.get_tasks_overdue(db=db, current_user=current_user)
