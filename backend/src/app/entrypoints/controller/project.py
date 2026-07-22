import uuid

from fastapi import APIRouter, Query, status

from app.adapters.db.models.enums import ProjectStatus, ProjectType
from app.entrypoints.deps import Pagination, ProjectSvc
from app.service_layer.schemas.common import Page
from app.service_layer.schemas.project import (
    ProjectAwardVendor,
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=Page[ProjectRead])
async def list_projects(
    service: ProjectSvc,
    pagination: Pagination,
    search: str | None = None,
    project_status: ProjectStatus | None = Query(None, alias="status"),
    project_type: ProjectType | None = Query(None, alias="type"),
):
    return await service.list(
        pagination, search=search, status=project_status, type_=project_type
    )


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(payload: ProjectCreate, service: ProjectSvc):
    return await service.create(payload)


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(project_id: uuid.UUID, service: ProjectSvc):
    return await service.get(project_id)


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(project_id: uuid.UUID, payload: ProjectUpdate, service: ProjectSvc):
    return await service.update(project_id, payload)


@router.post("/{project_id}/award", response_model=ProjectRead)
async def award_vendor(
    project_id: uuid.UUID, payload: ProjectAwardVendor, service: ProjectSvc
):
    """Tetapkan vendor pemenang pengadaan."""
    return await service.award_vendor(project_id, payload.vendor_id)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: uuid.UUID, service: ProjectSvc) -> None:
    await service.delete(project_id)
