from collections.abc import AsyncGenerator
from functools import lru_cache

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings


@lru_cache
def get_engine() -> AsyncEngine:
    """Engine dibuat lazy supaya import modul ini tidak menuntut driver DB tersedia
    (berguna saat unit test yang pakai SQLite)."""
    kwargs: dict = {"echo": settings.DB_ECHO, "pool_pre_ping": True}
    if not settings.DATABASE_URL.startswith("sqlite"):
        kwargs["pool_size"] = settings.DB_POOL_SIZE
        kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW
    return create_async_engine(settings.DATABASE_URL, **kwargs)


@lru_cache
def get_session_factory() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(
        bind=get_engine(), class_=AsyncSession, expire_on_commit=False, autoflush=False
    )


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency. Commit kalau sukses, rollback kalau ada exception."""
    async with get_session_factory()() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
