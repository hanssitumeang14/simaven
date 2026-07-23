from fastapi import APIRouter

from app.config import settings
from app.entrypoints.controller import auth, health, project, spk, sppb, vendor

root_router = APIRouter()
root_router.include_router(health.router)

api_router = APIRouter(prefix=settings.API_PREFIX)
api_router.include_router(auth.router)
api_router.include_router(vendor.router)
api_router.include_router(project.router)
api_router.include_router(spk.router)
api_router.include_router(sppb.router)
