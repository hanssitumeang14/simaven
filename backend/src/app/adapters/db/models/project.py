import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, Uuid
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.adapters.db.models.base import Base, TimestampMixin, UUIDMixin
from app.adapters.db.models.enums import (
    BankGroup,
    ProjectStage,
    ProjectStatus,
    ProjectType,
    UserRole,
    VendorCategory,
)


class ProjectVendor(Base, TimestampMixin):
    """Peserta tender: vendor yang ikut menawar di sebuah paket pengadaan."""

    __tablename__ = "project_vendors"

    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True
    )
    vendor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("vendors.id", ondelete="CASCADE"), primary_key=True
    )
    bid_price: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    corrected_price: Mapped[float | None] = mapped_column(Numeric(18, 2))
    negotiated_price: Mapped[float | None] = mapped_column(Numeric(18, 2))

    project = relationship("Project", back_populates="participants", lazy="noload")
    vendor = relationship("Vendor", lazy="noload")


class ProjectTimelineEvent(Base, UUIDMixin, TimestampMixin):
    """Riwayat perpindahan tahap pengadaan. Append-only, dipakai buat tampilan timeline."""

    __tablename__ = "project_timeline_events"

    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    stage: Mapped[ProjectStage] = mapped_column(
        SAEnum(ProjectStage, name="project_stage", native_enum=False, length=40), nullable=False
    )
    actor_role: Mapped[UserRole | None] = mapped_column(
        SAEnum(UserRole, name="user_role", native_enum=False, length=20)
    )
    note: Mapped[str | None] = mapped_column(Text)

    project = relationship("Project", back_populates="timeline_events", lazy="noload")


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
    # Kategori vendor yang dibutuhkan (Operasional/Pengadaan/Cleaning Service).
    # Kosong untuk project lama sebelum fitur klasifikasi ada.
    vendor_category: Mapped[VendorCategory | None] = mapped_column(
        SAEnum(VendorCategory, name="vendor_category", native_enum=False, length=30)
    )

    winning_vendor_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("vendors.id", ondelete="SET NULL")
    )

    # --- Timeline: tahap saat ini + data pendukung tiap tahap ---
    stage: Mapped[ProjectStage] = mapped_column(
        SAEnum(ProjectStage, name="project_stage", native_enum=False, length=40),
        nullable=False,
        default=ProjectStage.BIDDING,
        index=True,
    )

    # Bank Garansi — wajib dilengkapi sebelum SPPB bisa diterbitkan.
    bg_amount: Mapped[float | None] = mapped_column(Numeric(18, 2))
    bg_valid_until: Mapped[date | None] = mapped_column(Date)
    bg_submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Terisi kalau BG-nya diunggah vendor sendiri (sudah punya dari bank lain).
    # Kosong kalau dicatat manual oleh RS (mis. lewat Kopra Bank Garansi Mandiri).
    bg_document_path: Mapped[str | None] = mapped_column(String(255))

    work_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Vendor lapor duluan, RS yang konfirmasi jadi resmi "Barang Lengkap".
    goods_reported_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    goods_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    invoice_number: Mapped[str | None] = mapped_column(String(50))
    invoice_date: Mapped[date | None] = mapped_column(Date)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    participants = relationship(
        "ProjectVendor",
        back_populates="project",
        lazy="noload",
        cascade="all, delete-orphan",
    )
    timeline_events = relationship(
        "ProjectTimelineEvent",
        back_populates="project",
        lazy="noload",
        cascade="all, delete-orphan",
        order_by="ProjectTimelineEvent.created_at",
    )
    winning_vendor = relationship("Vendor", foreign_keys=[winning_vendor_id], lazy="noload")
    spks = relationship("Spk", back_populates="project", lazy="noload")
    sppbs = relationship("Sppb", back_populates="project", lazy="noload")
    sppbs = relationship("Sppb", back_populates="project", lazy="noload")
