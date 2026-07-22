import uuid
from datetime import date

from sqlalchemy import Date
from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.adapters.db.models.base import Base, TimestampMixin, UUIDMixin
from app.adapters.db.models.enums import SpkStatus


class Spk(Base, UUIDMixin, TimestampMixin):
    """Surat Perintah Kerja. Sumber data untuk generate PDF."""

    __tablename__ = "spk"
    __table_args__ = (
        UniqueConstraint("sequence_no", "year", name="uq_spk_sequence_per_year"),
    )

    # Nomor final, contoh: 001/SPK/VII/2026
    number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    sequence_no: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("projects.id", ondelete="RESTRICT"), nullable=False
    )
    vendor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("vendors.id", ondelete="RESTRICT"), nullable=False
    )

    issued_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)

    work_description: Mapped[str] = mapped_column(Text, nullable=False)
    payment_terms: Mapped[str | None] = mapped_column(Text)
    penalty_clause: Mapped[str | None] = mapped_column(Text)

    total_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)

    signatory_name: Mapped[str] = mapped_column(String(255), nullable=False)
    signatory_position: Mapped[str] = mapped_column(String(255), nullable=False)

    status: Mapped[SpkStatus] = mapped_column(
        SAEnum(SpkStatus, name="spk_status", native_enum=False, length=20),
        nullable=False,
        default=SpkStatus.DRAFT,
        index=True,
    )

    project = relationship("Project", back_populates="spks", lazy="joined")
    vendor = relationship("Vendor", back_populates="spks", lazy="joined")
    items = relationship(
        "SpkItem",
        back_populates="spk",
        lazy="selectin",
        cascade="all, delete-orphan",
        order_by="SpkItem.line_no",
    )


class SpkItem(Base, UUIDMixin, TimestampMixin):
    """Baris rincian pekerjaan/barang di dalam SPK."""

    __tablename__ = "spk_items"

    spk_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("spk.id", ondelete="CASCADE"), nullable=False, index=True
    )
    line_no: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    unit: Mapped[str] = mapped_column(String(30), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)

    spk = relationship("Spk", back_populates="items")
