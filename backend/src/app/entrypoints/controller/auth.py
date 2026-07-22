from fastapi import APIRouter, status

from app.entrypoints.deps import AuthSvc, CurrentUser
from app.service_layer.schemas.auth import (
    TokenResponse,
    UserLogin,
    UserRead,
    UserRegister,
    VendorRegister,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, service: AuthSvc):
    """Registrasi akun internal RS."""
    return await service.register(payload)


@router.post(
    "/register-vendor", response_model=TokenResponse, status_code=status.HTTP_201_CREATED
)
async def register_vendor(payload: VendorRegister, service: AuthSvc):
    """Registrasi mandiri vendor: bikin profil perusahaan + akun login sekaligus."""
    return await service.register_vendor(payload)


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, service: AuthSvc):
    return await service.login(payload)


@router.get("/me", response_model=UserRead)
async def me(user: CurrentUser):
    return user
