from fastapi import APIRouter
from sqlalchemy import text

from app.config import settings
from app.entrypoints.deps import DbSession

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.ENVIRONMENT}


@router.get("/health/ready")
async def readiness(session: DbSession) -> dict:
    await session.execute(text("SELECT 1"))
    return {"status": "ready"}
