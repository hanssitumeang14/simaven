import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Uuid
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.adapters.db.models.base import Base, TimestampMixin, UUIDMixin
from app.adapters.db.models.enums import UserRole


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role", native_enum=False, length=20),
        nullable=False,
        default=UserRole.RS,
    )
    # Terisi hanya untuk role=vendor: perusahaan yang diwakili akun ini.
    vendor_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("vendors.id", ondelete="CASCADE"), unique=True
    )
    # Dipakai untuk hitung badge notifikasi belum dibaca (aktivitas timeline lawan peran).
    last_seen_notifications_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    vendor = relationship("Vendor", lazy="noload")
