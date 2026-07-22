import uuid

from fastapi import APIRouter, Query, status

from app.adapters.db.models.enums import BankGroup, VendorStatus
from app.entrypoints.deps import Pagination, VendorSvc
from app.service_layer.schemas.common import Page
from app.service_layer.schemas.vendor import (
    VendorCreate,
    VendorRead,
    VendorUpdate,
    VendorVerificationUpdate,
)

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


@router.get("/{vendor_id}", response_model=VendorRead)
async def get_vendor(vendor_id: uuid.UUID, service: VendorSvc):
    return await service.get(vendor_id)


@router.patch("/{vendor_id}", response_model=VendorRead)
async def update_vendor(vendor_id: uuid.UUID, payload: VendorUpdate, service: VendorSvc):
    return await service.update(vendor_id, payload)


@router.post("/{vendor_id}/verification", response_model=VendorRead)
async def update_verification(
    vendor_id: uuid.UUID, payload: VendorVerificationUpdate, service: VendorSvc
):
    """Menggerakkan vendor di alur verifikasi 8 langkah."""
    return await service.advance_verification(vendor_id, payload)


@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vendor(vendor_id: uuid.UUID, service: VendorSvc) -> None:
    await service.delete(vendor_id)
