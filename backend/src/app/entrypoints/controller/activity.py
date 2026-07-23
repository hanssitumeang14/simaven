from fastapi import APIRouter, status

from app.entrypoints.deps import ActivitySvc, CurrentUser
from app.service_layer.schemas.activity import ActivityFeed

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/feed", response_model=ActivityFeed)
async def get_feed(user: CurrentUser, service: ActivitySvc):
    """Aktivitas terbaru dari lawan peran (RS <-> vendor), buat badge notifikasi."""
    return await service.get_feed(user)


@router.post("/mark-seen", status_code=status.HTTP_204_NO_CONTENT)
async def mark_seen(user: CurrentUser, service: ActivitySvc) -> None:
    await service.mark_seen(user)
