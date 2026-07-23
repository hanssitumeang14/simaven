import uuid
from datetime import date

from sqlalchemy import Date
from sqlalchemy import ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.adapters.db.models.base import Base, TimestampMixin, UUIDMixin


class Sppb(Base, UUIDMixin, TimestampMixin):
    """Surat Pesanan Pembelian Barang. Diterbitkan RS setelah Bank Garansi lengkap,
    berisi daftar barang yang dipesan — vendor melapor progres pengiriman per baris."""

    __tablename__ = "sppb"
    __table_args__ = (
        UniqueConstraint("sequence_no", "year", name="uq_sppb_sequence_per_year"),
    )

    # Nomor final, contoh: 001/SPPB/VII/2026
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
    notes: Mapped[str | None] = mapped_column(Text)

    project = relationship("Project", back_populates="sppbs", lazy="joined")
    vendor = relationship("Vendor", back_populates="sppbs", lazy="joined")
    items = relationship(
        "SppbItem",
        back_populates="sppb",
        lazy="selectin",
        cascade="all, delete-orphan",
        order_by="SppbItem.line_no",
    )


class SppbItem(Base, UUIDMixin, TimestampMixin):
    """Baris barang pesanan di dalam SPPB, dengan jumlah yang sudah dikirim vendor."""

    __tablename__ = "sppb_items"

    sppb_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("sppb.id", ondelete="CASCADE"), nullable=False, index=True
    )
    line_no: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    unit: Mapped[str] = mapped_column(String(30), nullable=False)
    quantity_ordered: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    quantity_delivered: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=0)

    sppb = relationship("Sppb", back_populates="items")
