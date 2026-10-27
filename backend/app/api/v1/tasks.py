from typing import Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.services.task_service import TaskService
from app.utils.pagination import Page

router = APIRouter(prefix="/tasks", tags=["Tasks & Reminders"])


@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task / reminder",
)
async def create_task(
    task_in: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await TaskService.create_task(
        db=db, task_in=task_in, current_user=current_user
    )


@router.get(
    "/",
    response_model=Page[TaskResponse],
    summary="List tasks with filters (due today, overdue, status, entity)",
)
async def list_tasks(
    assigned_to: Optional[uuid.UUID] = Query(None, description="Filter by assigned user"),
    status: Optional[str] = Query(None, description="Filter by status (pending, in_progress, done, cancelled)"),
    lead_id: Optional[uuid.UUID] = Query(None, description="Filter by lead"),
    contact_id: Optional[uuid.UUID] = Query(None, description="Filter by contact"),
    deal_id: Optional[uuid.UUID] = Query(None, description="Filter by deal"),
    due_today: Optional[bool] = Query(None, description="Filter tasks due today"),
    overdue: Optional[bool] = Query(None, description="Filter overdue tasks"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await TaskService.list_tasks(
        db=db,
        assigned_to=assigned_to,
        status=status,
        lead_id=lead_id,
        contact_id=contact_id,
        deal_id=deal_id,
        due_today=due_today,
        overdue=overdue,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get task details by ID",
)
async def get_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await TaskService.get_task(db=db, task_id=task_id)


@router.patch(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update task attributes",
)
async def update_task(
    task_id: uuid.UUID,
    task_in: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await TaskService.update_task(
        db=db, task_id=task_id, task_in=task_in, current_user=current_user
    )


@router.patch(
    "/{task_id}/complete",
    response_model=TaskResponse,
    summary="Mark task as completed",
)
async def complete_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await TaskService.complete_task(
        db=db, task_id=task_id, current_user=current_user
    )


@router.delete(
    "/{task_id}",
    response_model=MessageResponse,
    summary="Soft delete task",
)
async def delete_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await TaskService.delete_task(db=db, task_id=task_id)
    return MessageResponse(message="Task deleted successfully")
