from typing import Annotated

from fastapi import Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.db.session import get_db_session
from app.service_layer.schemas.common import PageParams
from app.service_layer.services.project import ProjectService
from app.service_layer.services.spk import SpkService
from app.service_layer.services.vendor import VendorService

DbSession = Annotated[AsyncSession, Depends(get_db_session)]


def get_page_params(
    page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100)
) -> PageParams:
    return PageParams(page=page, size=size)


Pagination = Annotated[PageParams, Depends(get_page_params)]


def get_vendor_service(session: DbSession) -> VendorService:
    return VendorService(session)


def get_project_service(session: DbSession) -> ProjectService:
    return ProjectService(session)


def get_spk_service(session: DbSession) -> SpkService:
    return SpkService(session)


VendorSvc = Annotated[VendorService, Depends(get_vendor_service)]
ProjectSvc = Annotated[ProjectService, Depends(get_project_service)]
SpkSvc = Annotated[SpkService, Depends(get_spk_service)]
