import uuid

from sqlalchemy import ForeignKey, String, Text, Uuid
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.adapters.db.models.base import Base, TimestampMixin, UUIDMixin
from app.adapters.db.models.enums import NotificationStatus


class VendorNotification(Base, UUIDMixin, TimestampMixin):
    """Pesan WhatsApp yang seharusnya dikirim ke vendor (mis. pengumuman
    pemenang tender). Belum ada integrasi provider WA — baris di sini adalah
    draft pesan siap kirim, bukan bukti terkirim."""

    __tablename__ = "vendor_notifications"

    vendor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    recipient_phone: Mapped[str] = mapped_column(String(30), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[NotificationStatus] = mapped_column(
        SAEnum(NotificationStatus, name="notification_status", native_enum=False, length=20),
        nullable=False,
        default=NotificationStatus.PENDING,
    )

    vendor = relationship("Vendor", lazy="noload")
    project = relationship("Project", lazy="noload")
