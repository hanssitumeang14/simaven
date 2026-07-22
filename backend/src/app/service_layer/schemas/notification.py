import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.adapters.db.models.enums import NotificationStatus


class VendorNotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    vendor_id: uuid.UUID
    project_id: uuid.UUID | None
    recipient_phone: str
    message: str
    status: NotificationStatus
    created_at: datetime
