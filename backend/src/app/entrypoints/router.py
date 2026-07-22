from fastapi import APIRouter

from app.config import settings
from app.entrypoints.controller import health, project, spk, vendor

root_router = APIRouter()
root_router.include_router(health.router)

api_router = APIRouter(prefix=settings.API_PREFIX)
api_router.include_router(vendor.router)
api_router.include_router(project.router)
api_router.include_router(spk.router)
