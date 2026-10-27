from datetime import datetime
from typing import Any, Dict, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field

from app.models.activity import ActivityType


class ActivityBase(BaseModel):
    type: ActivityType = ActivityType.NOTE
    notes: Optional[str] = None
    outcome: Optional[str] = Field(None, max_length=200)
    lead_id: Optional[uuid.UUID] = None
    contact_id: Optional[uuid.UUID] = None
    deal_id: Optional[uuid.UUID] = None
    extra_data: Dict[str, Any] = Field(default_factory=dict)


class ActivityCreate(ActivityBase):
    pass


class ActivityResponse(ActivityBase):
    id: uuid.UUID
    performed_by: Optional[uuid.UUID] = None
    occurred_at: datetime

    model_config = ConfigDict(from_attributes=True)
