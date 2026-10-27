from datetime import date, datetime
import enum
from typing import TYPE_CHECKING, List, Optional
import uuid
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.user import GUID

if TYPE_CHECKING:
    from app.models.activity import Activity
    from app.models.company import Company
    from app.models.contact import Contact
    from app.models.user import User


class DealStage(str, enum.Enum):
    QUALIFICATION = "qualification"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"


class Deal(Base):
    __tablename__ = "deals"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    value: Mapped[float] = mapped_column(
        Numeric(12, 2), default=0.00, nullable=False
    )
    stage: Mapped[str] = mapped_column(
        String(50),
        default=DealStage.QUALIFICATION.value,
        nullable=False,
        index=True,
    )
    expected_close_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("contacts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    company_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("companies.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

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
    owner: Mapped[Optional["User"]] = relationship("User", lazy="selectin")
    contact: Mapped[Optional["Contact"]] = relationship(
        "Contact", back_populates="deals", lazy="selectin"
    )
    company: Mapped[Optional["Company"]] = relationship(
        "Company", back_populates="deals", lazy="selectin"
    )
    activities: Mapped[List["Activity"]] = relationship(
        "Activity", back_populates="deal", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Deal {self.name} stage={self.stage} value={self.value}>"
