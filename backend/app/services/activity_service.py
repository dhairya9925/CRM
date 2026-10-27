from typing import Any, Dict, List, Optional
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity, ActivityType
from app.schemas.activity import ActivityCreate


class ActivityService:
    @staticmethod
    async def log_activity(
        db: AsyncSession,
        type: str,
        notes: Optional[str] = None,
        outcome: Optional[str] = None,
        performed_by: Optional[uuid.UUID] = None,
        lead_id: Optional[uuid.UUID] = None,
        contact_id: Optional[uuid.UUID] = None,
        deal_id: Optional[uuid.UUID] = None,
        extra_data: Optional[Dict[str, Any]] = None,
    ) -> Activity:
        """Internal helper to record an activity event into the timeline."""
        activity = Activity(
            type=type,
            notes=notes,
            outcome=outcome,
            performed_by=performed_by,
            lead_id=lead_id,
            contact_id=contact_id,
            deal_id=deal_id,
            extra_data=extra_data or {},
        )
        db.add(activity)
        await db.commit()
        await db.refresh(activity)
        return activity

    @staticmethod
    async def list_activities(
        db: AsyncSession,
        lead_id: Optional[uuid.UUID] = None,
        contact_id: Optional[uuid.UUID] = None,
        deal_id: Optional[uuid.UUID] = None,
        activity_type: Optional[str] = None,
        limit: int = 50,
    ) -> List[Activity]:
        query = select(Activity)
        if lead_id:
            query = query.where(Activity.lead_id == lead_id)
        if contact_id:
            query = query.where(Activity.contact_id == contact_id)
        if deal_id:
            query = query.where(Activity.deal_id == deal_id)
        if activity_type:
            query = query.where(Activity.type == activity_type)

        query = query.order_by(Activity.occurred_at.desc()).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())
