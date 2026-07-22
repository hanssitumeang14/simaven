import uuid

from sqlalchemy import Column, ForeignKey, Numeric, String, Table, Uuid
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.adapters.db.models.base import Base, TimestampMixin, UUIDMixin
from app.adapters.db.models.enums import BankGroup, ProjectStatus, ProjectType

project_vendors = Table(
    "project_vendors",
    Base.metadata,
    Column("project_id", Uuid, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("vendor_id", Uuid, ForeignKey("vendors.id", ondelete="CASCADE"), primary_key=True),
)


class Project(Base, UUIDMixin, TimestampMixin):
    """Paket pengadaan."""

    __tablename__ = "projects"

    code: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    type: Mapped[ProjectType] = mapped_column(
        SAEnum(ProjectType, name="project_type", native_enum=False, length=20), nullable=False
    )
    budget: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    hps: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    status: Mapped[ProjectStatus] = mapped_column(
        SAEnum(ProjectStatus, name="project_status", native_enum=False, length=20),
        nullable=False,
        default=ProjectStatus.ONGOING,
        index=True,
    )
    bank: Mapped[BankGroup | None] = mapped_column(
        SAEnum(BankGroup, name="bank_group", native_enum=False, length=20)
    )

    winning_vendor_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("vendors.id", ondelete="SET NULL")
    )

    vendors = relationship("Vendor", secondary=project_vendors, lazy="noload")
    winning_vendor = relationship("Vendor", foreign_keys=[winning_vendor_id], lazy="noload")
    spks = relationship("Spk", back_populates="project", lazy="noload")
