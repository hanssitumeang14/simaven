import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.db.models.enums import ProjectStatus, ProjectType, VendorStatus
from app.adapters.db.models.project import Project
from app.adapters.db.repositories.project import ProjectRepository
from app.adapters.db.repositories.vendor import VendorRepository
from app.lib.exceptions import ConflictError, NotFoundError
from app.lib.logging import get_logger
from app.service_layer.schemas.common import Page, PageParams
from app.service_layer.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate

_LOGGER = get_logger(__name__)


class ProjectService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = ProjectRepository(session)
        self.vendor_repo = VendorRepository(session)

    async def get(self, project_id: uuid.UUID) -> Project:
        project = await self.repo.get(project_id)
        if not project:
            raise NotFoundError(f"Pengadaan {project_id} tidak ditemukan")
        return project

    async def list(
        self,
        params: PageParams,
        *,
        search: str | None = None,
        status: ProjectStatus | None = None,
        type_: ProjectType | None = None,
    ) -> Page[ProjectRead]:
        stmt = self.repo.build_query(search=search, status=status, type_=type_)
        rows, total = await self.repo.list(offset=params.offset, limit=params.size, stmt=stmt)
        return Page[ProjectRead](
            items=[ProjectRead.model_validate(r) for r in rows],
            total=total,
            page=params.page,
            size=params.size,
        )

    async def create(self, payload: ProjectCreate) -> Project:
        code = payload.code or await self._generate_code()
        if await self.repo.get_by_code(code):
            raise ConflictError(f"Kode pengadaan {code} sudah dipakai")
        data = payload.model_dump(exclude={"code"})
        return await self.repo.create(code=code, status=ProjectStatus.ONGOING, **data)

    async def update(self, project_id: uuid.UUID, payload: ProjectUpdate) -> Project:
        project = await self.get(project_id)
        return await self.repo.update(project, **payload.model_dump(exclude_unset=True))

    async def award_vendor(self, project_id: uuid.UUID, vendor_id: uuid.UUID) -> Project:
        """Tetapkan pemenang. Hanya vendor terverifikasi yang boleh menang."""
        project = await self.get(project_id)
        vendor = await self.vendor_repo.get(vendor_id)
        if not vendor:
            raise NotFoundError(f"Vendor {vendor_id} tidak ditemukan")
        if vendor.status != VendorStatus.VERIFIED:
            raise ConflictError("Vendor belum terverifikasi, tidak bisa ditetapkan sebagai pemenang")

        project = await self.repo.update(project, winning_vendor_id=vendor.id)
        _LOGGER.info("project_awarded", project_id=str(project.id), vendor_id=str(vendor.id))
        return project

    async def delete(self, project_id: uuid.UUID) -> None:
        await self.repo.delete(await self.get(project_id))

    async def _generate_code(self) -> str:
        """Format mengikuti sistem lama: VMS + MMYY + urutan 4 digit."""
        now = datetime.now()
        prefix = f"VMS{now.month:02d}{now.year % 100:02d}"
        stmt = self.repo.build_query(search=prefix)
        rows, _ = await self.repo.list(limit=1, stmt=stmt)
        last_seq = int(rows[0].code[-4:]) if rows else 0
        return f"{prefix}{last_seq + 1:04d}"
