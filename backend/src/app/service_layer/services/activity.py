from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.db.models.enums import BankGroup, ProjectStage, UserRole
from app.adapters.db.models.project import Project, ProjectTimelineEvent
from app.adapters.db.models.user import User
from app.service_layer.schemas.activity import ActivityFeed, ActivityItem

FEED_LIMIT = 20


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _is_cross_sell_opportunity(stage: ProjectStage, note: str | None) -> bool:
    """SPK baru terbit = momen vendor butuh Bank Garansi — peluang Bank Mandiri
    menawarkan Kopra Bank Garansi/produk lain sebelum vendor pakai bank lain."""
    return stage == ProjectStage.SPK and bool(note) and note.startswith("SPK ") and "diterbitkan" in note


class ActivityService:
    """Aktivitas timeline lawan peran — dipakai untuk badge notifikasi di pojok kanan atas.

    RS lihat aktivitas vendor, vendor lihat aktivitas RS, Bank Mandiri lihat aktivitas
    keduanya tapi cuma untuk pengadaan yang bank-nya Mandiri (peluang cross-selling)."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_feed(self, user: User) -> ActivityFeed:
        stmt = select(ProjectTimelineEvent, Project.code, Project.name).join(
            Project, Project.id == ProjectTimelineEvent.project_id
        )

        if user.role == UserRole.RS:
            stmt = stmt.where(ProjectTimelineEvent.actor_role == UserRole.VENDOR)
        elif user.role == UserRole.VENDOR:
            stmt = stmt.where(
                ProjectTimelineEvent.actor_role == UserRole.RS,
                Project.winning_vendor_id == user.vendor_id,
            )
        elif user.role == UserRole.BANK_MANDIRI:
            stmt = stmt.where(Project.bank == BankGroup.MANDIRI)
        else:
            return ActivityFeed(unread_count=0, items=[])

        stmt = stmt.order_by(ProjectTimelineEvent.created_at.desc()).limit(FEED_LIMIT)

        rows = (await self.session.execute(stmt)).all()
        items = [
            ActivityItem(
                id=event.id,
                project_id=event.project_id,
                project_code=code,
                project_name=name,
                stage=event.stage,
                actor_role=event.actor_role,
                note=event.note,
                created_at=event.created_at,
                is_cross_sell_opportunity=_is_cross_sell_opportunity(event.stage, event.note),
            )
            for event, code, name in rows
        ]

        last_seen = user.last_seen_notifications_at
        unread_count = sum(1 for item in items if not last_seen or item.created_at > last_seen)
        return ActivityFeed(unread_count=unread_count, items=items)

    async def mark_seen(self, user: User) -> None:
        user.last_seen_notifications_at = _now()
        await self.session.flush()
