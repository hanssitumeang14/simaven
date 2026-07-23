import uuid
from typing import Literal

from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.db.models.enums import BankGroup, UserRole, VendorStatus
from app.adapters.db.models.user import User
from app.adapters.db.models.vendor import Vendor
from app.adapters.db.repositories.vendor import VendorRepository
from app.lib.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.lib.logging import get_logger

DocumentKey = Literal["sptTahunan", "neraca", "anggaranDasar", "izinPerusahaan", "rekening"]
from app.service_layer.schemas.common import Page, PageParams
from app.service_layer.schemas.vendor import (
    VendorCreate,
    VendorRead,
    VendorUpdate,
    VendorVerificationUpdate,
)

_LOGGER = get_logger(__name__)

MAX_VERIFICATION_STEP = 8


class VendorService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = VendorRepository(session)

    async def get(self, vendor_id: uuid.UUID) -> Vendor:
        vendor = await self.repo.get(vendor_id)
        if not vendor:
            raise NotFoundError(f"Vendor {vendor_id} tidak ditemukan")
        return vendor

    async def list(
        self,
        params: PageParams,
        *,
        search: str | None = None,
        status: VendorStatus | None = None,
        bank: BankGroup | None = None,
    ) -> Page[VendorRead]:
        stmt = self.repo.build_query(search=search, status=status, bank=bank)
        rows, total = await self.repo.list(offset=params.offset, limit=params.size, stmt=stmt)
        return Page[VendorRead](
            items=[VendorRead.model_validate(r) for r in rows],
            total=total,
            page=params.page,
            size=params.size,
        )

    async def create(self, payload: VendorCreate) -> Vendor:
        if await self.repo.get_by_npwp(payload.npwp):
            raise ConflictError(f"NPWP {payload.npwp} sudah terdaftar")
        vendor = await self.repo.create(
            **payload.model_dump(), status=VendorStatus.PENDING, verification_step=0, documents={}
        )
        _LOGGER.info("vendor_created", vendor_id=str(vendor.id), npwp=vendor.npwp)
        return vendor

    async def update(self, vendor_id: uuid.UUID, payload: VendorUpdate) -> Vendor:
        vendor = await self.get(vendor_id)
        values = payload.model_dump(exclude_unset=True, exclude_none=True)
        if "documents" in values:
            values["documents"] = {**(vendor.documents or {}), **values["documents"]}
        return await self.repo.update(vendor, **values)

    async def advance_verification(
        self, vendor_id: uuid.UUID, payload: VendorVerificationUpdate
    ) -> Vendor:
        vendor = await self.get(vendor_id)

        if payload.verification_step < vendor.verification_step:
            raise ConflictError("Langkah verifikasi tidak boleh mundur")
        if payload.status == VendorStatus.VERIFIED and payload.verification_step < MAX_VERIFICATION_STEP:
            raise ConflictError(
                f"Vendor baru bisa berstatus verified setelah langkah {MAX_VERIFICATION_STEP}"
            )

        vendor = await self.repo.update(
            vendor, verification_step=payload.verification_step, status=payload.status
        )
        _LOGGER.info(
            "vendor_verification_updated",
            vendor_id=str(vendor.id),
            step=vendor.verification_step,
            status=vendor.status,
        )
        return vendor

    async def upload_document(
        self, vendor_id: uuid.UUID, user: User, doc_key: DocumentKey, document_path: str
    ) -> Vendor:
        """Vendor mengunggah salah satu dokumen administrasi miliknya sendiri."""
        vendor = await self.get(vendor_id)
        if user.role != UserRole.VENDOR or user.vendor_id != vendor_id:
            raise ForbiddenError("Hanya pemilik akun vendor ini yang bisa mengunggah dokumen")
        documents = {**(vendor.documents or {}), doc_key: document_path}
        vendor = await self.repo.update(vendor, documents=documents)
        _LOGGER.info("vendor_document_uploaded", vendor_id=str(vendor.id), doc_key=doc_key)
        return vendor

    async def delete(self, vendor_id: uuid.UUID) -> None:
        await self.repo.delete(await self.get(vendor_id))
