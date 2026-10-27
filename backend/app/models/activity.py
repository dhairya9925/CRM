from datetime import datetime
import enum
from typing import TYPE_CHECKING, Any, Dict, Optional
import uuid
from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.database import Base
from app.models.user import GUID

if TYPE_CHECKING:
    from app.models.contact import Contact
    from app.models.deal import Deal
    from app.models.lead import Lead
    from app.models.user import User


class ActivityType(str, enum.Enum):
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    NOTE = "note"
    STATUS_CHANGE = "status_change"
    STAGE_CHANGE = "stage_change"
    CONVERSION = "conversion"


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        primary_key=True,
        default=uuid.uuid4,
    )
    type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    outcome: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    performed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    lead_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("contacts.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    deal_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("deals.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    extra_data: Mapped[Dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB(), "postgresql"),
        default=dict,
        nullable=False,
    )
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", lazy="selectin")
    lead: Mapped[Optional["Lead"]] = relationship(
        "Lead", back_populates="activities", lazy="selectin"
    )
    contact: Mapped[Optional["Contact"]] = relationship(
        "Contact", back_populates="activities", lazy="selectin"
    )
    deal: Mapped[Optional["Deal"]] = relationship(
        "Deal", back_populates="activities", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Activity {self.type} by={self.performed_by}>"
