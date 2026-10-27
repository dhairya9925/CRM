from datetime import date, datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field

from app.models.deal import DealStage


class DealBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    value: float = Field(0.00, ge=0.0)
    stage: DealStage = DealStage.QUALIFICATION
    expected_close_date: Optional[date] = None
    contact_id: Optional[uuid.UUID] = None
    company_id: Optional[uuid.UUID] = None


class DealCreate(DealBase):
    owner_id: Optional[uuid.UUID] = None


class DealUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    value: Optional[float] = Field(None, ge=0.0)
    stage: Optional[DealStage] = None
    expected_close_date: Optional[date] = None
    contact_id: Optional[uuid.UUID] = None
    company_id: Optional[uuid.UUID] = None
    owner_id: Optional[uuid.UUID] = None


class DealStageUpdate(BaseModel):
    stage: DealStage


class DealResponse(DealBase):
    id: uuid.UUID
    owner_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DealKanbanStage(BaseModel):
    stage: DealStage
    deal_count: int
    total_value: float
    deals: List[DealResponse]


class DealKanbanResponse(BaseModel):
    stages: List[DealKanbanStage]
    total_pipeline_value: float
