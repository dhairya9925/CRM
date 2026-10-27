from datetime import datetime
import enum
from typing import TYPE_CHECKING, List, Optional
import uuid
from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.user import GUID

if TYPE_CHECKING:
    from app.models.activity import Activity
    from app.models.contact import Contact
    from app.models.deal import Deal
    from app.models.user import User


class LeadSource(str, enum.Enum):
    WEBSITE = "website"
    REFERRAL = "referral"
    ADS = "ads"
    COLD_OUTREACH = "cold_outreach"
    EVENT = "event"
    OTHER = "other"


class LeadStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    LOST = "lost"


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        primary_key=True,
        default=uuid.uuid4,
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), index=True, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    company_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    source: Mapped[str] = mapped_column(
        String(50),
        default=LeadSource.WEBSITE.value,
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default=LeadStatus.NEW.value,
        nullable=False,
        index=True,
    )

    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    converted_contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("contacts.id", ondelete="SET NULL"),
        nullable=True,
    )
    converted_deal_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("deals.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_converted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    assignee: Mapped[Optional["User"]] = relationship("User", lazy="selectin")
    converted_contact: Mapped[Optional["Contact"]] = relationship(
        "Contact", foreign_keys=[converted_contact_id], lazy="selectin"
    )
    converted_deal: Mapped[Optional["Deal"]] = relationship(
        "Deal", foreign_keys=[converted_deal_id], lazy="selectin"
    )
    activities: Mapped[List["Activity"]] = relationship(
        "Activity", back_populates="lead", lazy="selectin"
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def __repr__(self) -> str:
        return f"<Lead {self.first_name} {self.last_name} status={self.status}>"
