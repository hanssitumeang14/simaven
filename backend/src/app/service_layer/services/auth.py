import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.db.models.enums import UserRole, VendorStatus
from app.adapters.db.models.user import User
from app.adapters.db.repositories.user import UserRepository
from app.adapters.db.repositories.vendor import VendorRepository
from app.lib.exceptions import AuthenticationError, ConflictError, NotFoundError
from app.lib.logging import get_logger
from app.lib.security import create_access_token, hash_password, verify_password
from app.service_layer.schemas.auth import (
    TokenResponse,
    UserLogin,
    UserRead,
    UserRegister,
    VendorRegister,
)

_LOGGER = get_logger(__name__)


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = UserRepository(session)
        self.vendor_repo = VendorRepository(session)

    async def register(self, payload: UserRegister) -> TokenResponse:
        if await self.repo.get_by_email(payload.email):
            raise ConflictError(f"Email {payload.email} sudah terdaftar")

        user = await self.repo.create(
            email=payload.email.lower(),
            full_name=payload.full_name,
            password_hash=hash_password(payload.password),
            role=UserRole.RS,
        )
        _LOGGER.info("user_registered", user_id=str(user.id), email=user.email, role=user.role)
        return self._issue_token(user)

    async def register_vendor(self, payload: VendorRegister) -> TokenResponse:
        vendor_data = payload.vendor
        if await self.vendor_repo.get_by_npwp(vendor_data.npwp):
            raise ConflictError(f"NPWP {vendor_data.npwp} sudah terdaftar")
        if await self.repo.get_by_email(vendor_data.email):
            raise ConflictError(f"Email {vendor_data.email} sudah terdaftar")

        vendor = await self.vendor_repo.create(
            **vendor_data.model_dump(),
            status=VendorStatus.PENDING,
            verification_step=0,
            documents={},
        )
        user = await self.repo.create(
            email=vendor_data.email.lower(),
            full_name=vendor_data.director_name,
            password_hash=hash_password(payload.password),
            role=UserRole.VENDOR,
            vendor_id=vendor.id,
        )
        _LOGGER.info(
            "vendor_registered", user_id=str(user.id), vendor_id=str(vendor.id), email=user.email
        )
        return self._issue_token(user)

    async def login(self, payload: UserLogin) -> TokenResponse:
        user = await self.repo.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.password_hash):
            raise AuthenticationError("Email atau password salah")

        _LOGGER.info("user_logged_in", user_id=str(user.id))
        return self._issue_token(user)

    async def get_user(self, user_id: uuid.UUID) -> User:
        user = await self.repo.get(user_id)
        if not user:
            raise NotFoundError("User tidak ditemukan")
        return user

    def _issue_token(self, user: User) -> TokenResponse:
        return TokenResponse(
            access_token=create_access_token(user.id),
            user=UserRead.model_validate(user),
        )
