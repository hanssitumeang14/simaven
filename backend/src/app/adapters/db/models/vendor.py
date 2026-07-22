from sqlalchemy import JSON, Integer, Numeric, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.adapters.db.models.base import Base, TimestampMixin, UUIDMixin
from app.adapters.db.models.enums import BankGroup, VendorStatus

# JSONB di Postgres, JSON biasa di SQLite (dipakai saat test)
JsonType = JSON().with_variant(JSONB, "postgresql")


class Vendor(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "vendors"

    npwp: Mapped[str] = mapped_column(String(25), unique=True, index=True, nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    company_type: Mapped[str] = mapped_column(String(20), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)

    bank: Mapped[BankGroup] = mapped_column(
        SAEnum(BankGroup, name="bank_group", native_enum=False, length=20), nullable=False
    )
    bank_name: Mapped[str] = mapped_column(String(100), nullable=False)
    bank_account_no: Mapped[str | None] = mapped_column(String(50))

    status: Mapped[VendorStatus] = mapped_column(
        SAEnum(VendorStatus, name="vendor_status", native_enum=False, length=20),
        nullable=False,
        default=VendorStatus.PENDING,
        index=True,
    )
    # 0-8, mengikuti 8-step verification workflow di UI
    verification_step: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # {"sptTahunan": "...", "neraca": "...", ...}
    documents: Mapped[dict] = mapped_column(JsonType, nullable=False, default=dict)
    # 5C profiling: character, capacity, capital, collateral, condition
    financial_score: Mapped[dict | None] = mapped_column(JsonType)

    performance_rating: Mapped[float | None] = mapped_column(Numeric(3, 2))

    spks = relationship("Spk", back_populates="vendor", lazy="noload")
