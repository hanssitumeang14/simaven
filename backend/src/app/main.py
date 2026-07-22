from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.adapters.db.session import get_engine
from app.adapters.storage.local import UPLOAD_ROOT
from app.config import settings
from app.entrypoints.router import api_router, root_router
from app.lib.exceptions import DomainError
from app.lib.logging import configure_logging, get_logger

_LOGGER = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    configure_logging()
    _LOGGER.info("startup", app=settings.APP_NAME, env=settings.ENVIRONMENT)
    yield
    await get_engine().dispose()
    _LOGGER.info("shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title="SIMAVEN API",
        description="Vendor Management System - RSJPD Harapan Kita",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"],
    )

    @app.exception_handler(DomainError)
    async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
        _LOGGER.warning("domain_error", code=exc.code, message=exc.message, path=request.url.path)
        return JSONResponse(
            status_code=exc.status_code,
            content={"code": exc.code, "message": exc.message},
        )

    UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")

    app.include_router(root_router)
    app.include_router(api_router)
    return app


app = create_app()
