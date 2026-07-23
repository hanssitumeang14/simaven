from typing import Annotated

from fastapi import Depends, Query, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.db.models.user import User
from app.adapters.db.session import get_db_session
from app.lib.exceptions import AuthenticationError
from app.lib.security import decode_access_token
from app.service_layer.schemas.common import PageParams
from app.service_layer.services.auth import AuthService
from app.service_layer.services.project import ProjectService
from app.service_layer.services.spk import SpkService
from app.service_layer.services.sppb import SppbService
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


def get_sppb_service(session: DbSession) -> SppbService:
    return SppbService(session)


def get_auth_service(session: DbSession) -> AuthService:
    return AuthService(session)


VendorSvc = Annotated[VendorService, Depends(get_vendor_service)]
ProjectSvc = Annotated[ProjectService, Depends(get_project_service)]
SpkSvc = Annotated[SpkService, Depends(get_spk_service)]
SppbSvc = Annotated[SppbService, Depends(get_sppb_service)]
AuthSvc = Annotated[AuthService, Depends(get_auth_service)]

_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    service: AuthSvc,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
) -> User:
    if credentials is None:
        raise AuthenticationError("Token tidak ditemukan")
    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise AuthenticationError("Token tidak valid atau kedaluwarsa")
    return await service.get_user(user_id)


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_current_user_flexible(
    request: Request,
    service: AuthSvc,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
) -> User:
    """Sama seperti get_current_user, tapi juga terima token lewat query string.

    Dipakai khusus untuk endpoint yang diakses browser lewat navigasi langsung
    (mis. buka PDF di tab baru), yang tidak bisa menyertakan header Authorization.
    """
    token = credentials.credentials if credentials else request.query_params.get("token")
    if not token:
        raise AuthenticationError("Token tidak ditemukan")
    user_id = decode_access_token(token)
    if user_id is None:
        raise AuthenticationError("Token tidak valid atau kedaluwarsa")
    return await service.get_user(user_id)


CurrentUserFlexible = Annotated[User, Depends(get_current_user_flexible)]
