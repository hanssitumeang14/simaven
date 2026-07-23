import uuid
from typing import Literal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.db.models.enums import BankGroup, ProjectStage, UserRole, VendorStatus
from app.adapters.db.models.project import Project
from app.adapters.db.models.user import User
from app.adapters.db.models.vendor import Vendor
from app.adapters.db.repositories.vendor import VendorRepository
from app.lib.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.lib.logging import get_logger

DocumentKey = Literal["sptTahunan", "neraca", "anggaranDasar", "izinPerusahaan", "rekening"]
from app.service_layer.schemas.common import Page, PageParams
from app.service_layer.schemas.vendor import (
    FinancialScore,
    VendorCreate,
    VendorRead,
    VendorUpdate,
    VendorVerificationUpdate,
)

_LOGGER = get_logger(__name__)

MAX_VERIFICATION_STEP = 8
DOCUMENT_KEYS: tuple[DocumentKey, ...] = (
    "sptTahunan", "neraca", "anggaranDasar", "izinPerusahaan", "rekening",
)
FIVE_C_KEYS = ("character", "capacity", "capital", "collateral", "condition")


class VendorService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
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
        if payload.status == VendorStatus.VERIFIED:
            if payload.verification_step < MAX_VERIFICATION_STEP:
                raise ConflictError(
                    f"Vendor baru bisa berstatus verified setelah langkah {MAX_VERIFICATION_STEP}"
                )
            if not self._has_complete_5c(vendor):
                raise ConflictError(
                    "Lengkapi Analisis 5C (Character, Capacity, Capital, Collateral, Condition) "
                    "sebelum vendor bisa diverifikasi"
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

    async def suggest_5c(self, vendor_id: uuid.UUID) -> FinancialScore:
        """Saran awal skor 5C dari data yang sudah tercatat di sistem — RS tetap bisa
        koreksi sebelum simpan. Condition (kondisi ekonomi/sektor) tidak bisa diturunkan
        dari data internal, jadi dibiarkan kosong untuk diisi manual oleh RS."""
        vendor = await self.get(vendor_id)
        docs = vendor.documents or {}
        docs_uploaded = sum(1 for key in DOCUMENT_KEYS if docs.get(key))

        completed_count = (
            await self.session.execute(
                select(func.count()).where(
                    Project.winning_vendor_id == vendor_id,
                    Project.stage == ProjectStage.FINISHED,
                )
            )
        ).scalar_one()
        bg_count = (
            await self.session.execute(
                select(func.count()).where(
                    Project.winning_vendor_id == vendor_id,
                    Project.bg_submitted_at.isnot(None),
                )
            )
        ).scalar_one()

        # Character: kelengkapan dokumen administrasi + progres verifikasi KYC.
        character = round(
            (docs_uploaded / len(DOCUMENT_KEYS)) * 50
            + (vendor.verification_step / MAX_VERIFICATION_STEP) * 50
        )

        # Capacity: rekam jejak proyek selesai, dipadukan dengan rating performa kalau ada.
        capacity_from_projects = min(100, completed_count * 20)
        if vendor.performance_rating is not None:
            capacity = round((capacity_from_projects + float(vendor.performance_rating) / 5 * 100) / 2)
        else:
            capacity = capacity_from_projects

        # Capital: dokumen keuangan yang jadi bukti kekuatan modal.
        capital = (50 if docs.get("neraca") else 0) + (50 if docs.get("sptTahunan") else 0)

        # Collateral: rekam jejak Bank Garansi yang pernah diserahkan.
        collateral = min(100, bg_count * 25)

        return FinancialScore(
            character=character,
            capacity=capacity,
            capital=capital,
            collateral=collateral,
            condition=None,
        )

    @staticmethod
    def _has_complete_5c(vendor: Vendor) -> bool:
        score = vendor.financial_score or {}
        return all(score.get(key) is not None for key in FIVE_C_KEYS)

    async def delete(self, vendor_id: uuid.UUID) -> None:
        await self.repo.delete(await self.get(vendor_id))
