import uuid

from fastapi import APIRouter, File, Query, UploadFile, status

from app.adapters.db.models.enums import BankGroup, UserRole, VendorStatus
from app.adapters.storage.local import save_upload
from app.entrypoints.deps import CurrentUser, Pagination, VendorSvc
from app.lib.exceptions import ForbiddenError
from app.service_layer.schemas.common import Page
from app.service_layer.schemas.vendor import (
    FinancialScore,
    VendorCreate,
    VendorRead,
    VendorUpdate,
    VendorVerificationUpdate,
)
from app.service_layer.services.vendor import DocumentKey

router = APIRouter(prefix="/vendors", tags=["vendors"])


@router.get("", response_model=Page[VendorRead])
async def list_vendors(
    service: VendorSvc,
    pagination: Pagination,
    search: str | None = Query(None, description="Cari nama perusahaan atau NPWP"),
    vendor_status: VendorStatus | None = Query(None, alias="status"),
    bank: BankGroup | None = None,
):
    return await service.list(pagination, search=search, status=vendor_status, bank=bank)


@router.post("", response_model=VendorRead, status_code=status.HTTP_201_CREATED)
async def create_vendor(payload: VendorCreate, service: VendorSvc):
    return await service.create(payload)


@router.get("/me", response_model=VendorRead)
async def get_my_vendor(user: CurrentUser, service: VendorSvc):
    """Profil perusahaan milik akun vendor yang sedang login."""
    if user.role != UserRole.VENDOR or not user.vendor_id:
        raise ForbiddenError("Akun ini bukan akun vendor")
    return await service.get(user.vendor_id)


@router.get("/{vendor_id}", response_model=VendorRead)
async def get_vendor(vendor_id: uuid.UUID, service: VendorSvc):
    return await service.get(vendor_id)


@router.get("/{vendor_id}/5c-suggestion", response_model=FinancialScore)
async def get_5c_suggestion(vendor_id: uuid.UUID, service: VendorSvc):
    """Saran awal skor 5C dari data yang sudah ada (dokumen, riwayat proyek, Bank Garansi).
    RS tetap bisa koreksi sebelum menyimpan penilaian akhir."""
    return await service.suggest_5c(vendor_id)


@router.patch("/{vendor_id}", response_model=VendorRead)
async def update_vendor(vendor_id: uuid.UUID, payload: VendorUpdate, service: VendorSvc):
    return await service.update(vendor_id, payload)


@router.post("/{vendor_id}/documents/{doc_key}/upload", response_model=VendorRead)
async def upload_document(
    vendor_id: uuid.UUID,
    doc_key: DocumentKey,
    user: CurrentUser,
    service: VendorSvc,
    file: UploadFile = File(...),
):
    """Vendor mengunggah salah satu dokumen administrasi miliknya sendiri."""
    document_path = await save_upload(file, subdir=f"vendor-documents/{vendor_id}")
    return await service.upload_document(vendor_id, user, doc_key, document_path)


@router.post("/{vendor_id}/verification", response_model=VendorRead)
async def update_verification(
    vendor_id: uuid.UUID, payload: VendorVerificationUpdate, service: VendorSvc
):
    """Menggerakkan vendor di alur verifikasi 8 langkah."""
    return await service.advance_verification(vendor_id, payload)


@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vendor(vendor_id: uuid.UUID, service: VendorSvc) -> None:
    await service.delete(vendor_id)
