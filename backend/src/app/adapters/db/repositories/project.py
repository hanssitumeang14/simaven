from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.adapters.db.models.enums import ProjectStatus, ProjectType
from app.adapters.db.models.project import Project, ProjectVendor
from app.adapters.db.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    model = Project

    async def get_by_code(self, code: str) -> Project | None:
        stmt = select(Project).where(Project.code == code)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_with_relations(self, project_id):
        stmt = (
            select(Project)
            .where(Project.id == project_id)
            .options(
                selectinload(Project.participants).selectinload(ProjectVendor.vendor),
                selectinload(Project.winning_vendor),
            )
        )
        return (await self.session.execute(stmt)).unique().scalar_one_or_none()

    def build_query(
        self,
        *,
        search: str | None = None,
        status: ProjectStatus | None = None,
        type_: ProjectType | None = None,
    ):
        stmt = select(Project)
        if search:
            pattern = f"%{search}%"
            stmt = stmt.where(Project.name.ilike(pattern) | Project.code.ilike(pattern))
        if status:
            stmt = stmt.where(Project.status == status)
        if type_:
            stmt = stmt.where(Project.type == type_)
        return stmt.order_by(Project.code.desc())
