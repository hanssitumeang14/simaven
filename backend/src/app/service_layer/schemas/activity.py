import uuid
from datetime import datetime

from pydantic import BaseModel

from app.adapters.db.models.enums import ProjectStage, UserRole


class ActivityItem(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    project_code: str
    project_name: str
    stage: ProjectStage
    actor_role: UserRole | None
    note: str | None
    created_at: datetime
    is_cross_sell_opportunity: bool = False


class ActivityFeed(BaseModel):
    unread_count: int
    items: list[ActivityItem]
