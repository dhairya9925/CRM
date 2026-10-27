from datetime import datetime, time, timezone
from typing import Any, List, Optional
import uuid
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.activity import ActivityType
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate
from app.services.activity_service import ActivityService
from app.utils.pagination import Page, paginate


class TaskService:
    @staticmethod
    async def create_task(
        db: AsyncSession, task_in: TaskCreate, current_user: User
    ) -> Task:
        assigned_to = task_in.assigned_to or current_user.id
        task = Task(
            title=task_in.title.strip(),
            description=task_in.description.strip() if task_in.description else None,
            type=task_in.type.value if hasattr(task_in.type, "value") else str(task_in.type),
            priority=task_in.priority.value if hasattr(task_in.priority, "value") else str(task_in.priority),
            status=task_in.status.value if hasattr(task_in.status, "value") else str(task_in.status),
            due_date=task_in.due_date,
            assigned_to=assigned_to,
            lead_id=task_in.lead_id,
            contact_id=task_in.contact_id,
            deal_id=task_in.deal_id,
        )
        db.add(task)
        await db.commit()
        await db.refresh(task)

        # Log creation activity if linked to an entity
        if task.contact_id or task.deal_id or task.lead_id:
            await ActivityService.log_activity(
                db=db,
                type=ActivityType.NOTE.value,
                notes=f"Task created: '{task.title}'",
                performed_by=current_user.id,
                lead_id=task.lead_id,
                contact_id=task.contact_id,
                deal_id=task.deal_id,
            )

        return task

    @staticmethod
    async def get_task(db: AsyncSession, task_id: uuid.UUID) -> Task:
        query = select(Task).where(Task.id == task_id, Task.is_deleted == False)
        result = await db.execute(query)
        task = result.scalar_one_or_none()
        if not task:
            raise NotFoundError("Task not found")
        return task

    @staticmethod
    async def list_tasks(
        db: AsyncSession,
        assigned_to: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        lead_id: Optional[uuid.UUID] = None,
        contact_id: Optional[uuid.UUID] = None,
        deal_id: Optional[uuid.UUID] = None,
        due_today: Optional[bool] = None,
        overdue: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Page[Any]:
        query = select(Task).where(Task.is_deleted == False)

        if assigned_to:
            query = query.where(Task.assigned_to == assigned_to)
        if status:
            query = query.where(Task.status == status)
        if lead_id:
            query = query.where(Task.lead_id == lead_id)
        if contact_id:
            query = query.where(Task.contact_id == contact_id)
        if deal_id:
            query = query.where(Task.deal_id == deal_id)

        now = datetime.now(timezone.utc)
        if due_today:
            start_of_day = datetime.combine(now.date(), time.min).replace(tzinfo=timezone.utc)
            end_of_day = datetime.combine(now.date(), time.max).replace(tzinfo=timezone.utc)
            query = query.where(
                Task.due_date >= start_of_day,
                Task.due_date <= end_of_day,
            )
        if overdue:
            query = query.where(
                Task.due_date < now,
                Task.status.in_([TaskStatus.PENDING.value, TaskStatus.IN_PROGRESS.value]),
            )

        query = query.order_by(Task.due_date.asc().nulls_last(), Task.created_at.desc())
        items, total = await paginate(db, query, page, page_size)
        return Page.create(items, total, page, page_size)

    @staticmethod
    async def update_task(
        db: AsyncSession, task_id: uuid.UUID, task_in: TaskUpdate, current_user: User
    ) -> Task:
        task = await TaskService.get_task(db, task_id)

        update_data = task_in.model_dump(exclude_unset=True)
        for field in ["type", "priority", "status"]:
            if field in update_data and update_data[field] is not None:
                val = update_data[field]
                update_data[field] = val.value if hasattr(val, "value") else str(val)

        for key, value in update_data.items():
            setattr(task, key, value)

        await db.commit()
        await db.refresh(task)
        return task

    @staticmethod
    async def complete_task(
        db: AsyncSession, task_id: uuid.UUID, current_user: User
    ) -> Task:
        task = await TaskService.get_task(db, task_id)
        task.status = TaskStatus.DONE.value
        await db.commit()
        await db.refresh(task)

        if task.contact_id or task.deal_id or task.lead_id:
            await ActivityService.log_activity(
                db=db,
                type=ActivityType.NOTE.value,
                notes=f"Task completed: '{task.title}'",
                performed_by=current_user.id,
                lead_id=task.lead_id,
                contact_id=task.contact_id,
                deal_id=task.deal_id,
            )

        return task

    @staticmethod
    async def delete_task(db: AsyncSession, task_id: uuid.UUID) -> bool:
        task = await TaskService.get_task(db, task_id)
        task.is_deleted = True
        await db.commit()
        return True
