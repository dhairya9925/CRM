from datetime import date, datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.lead import LeadSource, LeadStatus


class LeadBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    company_name: Optional[str] = Field(None, max_length=200)
    source: LeadSource = LeadSource.WEBSITE
    status: LeadStatus = LeadStatus.NEW


class LeadCreate(LeadBase):
    assigned_to: Optional[uuid.UUID] = None


class LeadUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    company_name: Optional[str] = Field(None, max_length=200)
    source: Optional[LeadSource] = None
    status: Optional[LeadStatus] = None
    assigned_to: Optional[uuid.UUID] = None


class LeadAssign(BaseModel):
    assigned_to: uuid.UUID


class LeadConvertRequest(BaseModel):
    deal_name: Optional[str] = None
    deal_value: float = Field(0.00, ge=0.0)
    expected_close_date: Optional[date] = None
    create_deal: bool = True


class LeadConvertResponse(BaseModel):
    lead_id: uuid.UUID
    contact_id: uuid.UUID
    deal_id: Optional[uuid.UUID] = None
    message: str


class LeadResponse(LeadBase):
    id: uuid.UUID
    assigned_to: Optional[uuid.UUID] = None
    converted_contact_id: Optional[uuid.UUID] = None
    converted_deal_id: Optional[uuid.UUID] = None
    is_converted: bool
    full_name: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadImportRow(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    source: Optional[str] = "other"
    status: Optional[str] = "new"


class LeadImportResponse(BaseModel):
    imported: int
    failed: int
    errors: List[Dict[str, Any]]
