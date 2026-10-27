from datetime import datetime
from typing import Any, Dict, Optional
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ContactBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    company_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)


class ContactCreate(ContactBase):
    owner_id: Optional[uuid.UUID] = None


class ContactUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    company_id: Optional[uuid.UUID] = None
    owner_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None


class ContactResponse(ContactBase):
    id: uuid.UUID
    owner_id: Optional[uuid.UUID] = None
    full_name: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
