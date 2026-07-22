from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.adapters.db.models import Base
from app.adapters.db.session import get_db_session
from app.main import create_app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session

    await engine.dispose()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    app = create_app()

    async def override_get_db_session() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = override_get_db_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def vendor_payload() -> dict:
    return {
        "npwp": "81.154.367.7-503.000",
        "company_name": "PT Fitrah Ekamulia",
        "company_type": "PT",
        "city": "SEMARANG",
        "address": "Jl. Pusponjolo Timur I XII No.26, Semarang",
        "email": "fitrah.ekamulia@yahoo.com",
        "phone": "02476435442",
        "bank": "Mandiri",
        "bank_name": "BANK MANDIRI",
    }
