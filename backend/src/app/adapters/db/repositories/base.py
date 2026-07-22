import uuid
from collections.abc import Sequence
from typing import Any, Generic, TypeVar

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.db.models.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """CRUD generik. Subclass cukup set `model` dan tambah query khusus."""

    model: type[ModelT]

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, entity_id: uuid.UUID) -> ModelT | None:
        return await self.session.get(self.model, entity_id)

    async def list(
        self, *, offset: int = 0, limit: int = 20, stmt: Select | None = None
    ) -> tuple[Sequence[ModelT], int]:
        base_stmt = stmt if stmt is not None else select(self.model)

        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = (await self.session.execute(count_stmt)).scalar_one()

        result = await self.session.execute(base_stmt.offset(offset).limit(limit))
        return result.scalars().unique().all(), total

    async def create(self, **values: Any) -> ModelT:
        entity = self.model(**values)
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def update(self, entity: ModelT, **values: Any) -> ModelT:
        for key, value in values.items():
            if value is not None:
                setattr(entity, key, value)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def delete(self, entity: ModelT) -> None:
        await self.session.delete(entity)
        await self.session.flush()
