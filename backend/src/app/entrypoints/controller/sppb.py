import uuid

from fastapi import APIRouter, Response, status

from app.adapters.db.models.enums import UserRole
from app.entrypoints.deps import CurrentUser, CurrentUserFlexible, Pagination, SppbSvc
from app.lib.exceptions import ForbiddenError
from app.service_layer.schemas.common import Page
from app.service_layer.schemas.sppb import SppbCreate, SppbProgressUpdate, SppbRead

router = APIRouter(prefix="/sppb", tags=["sppb"])


@router.get("", response_model=Page[SppbRead])
async def list_sppb(
    service: SppbSvc,
    pagination: Pagination,
    project_id: uuid.UUID | None = None,
    vendor_id: uuid.UUID | None = None,
):
    return await service.list(pagination, project_id=project_id, vendor_id=vendor_id)


@router.post("", response_model=SppbRead, status_code=status.HTTP_201_CREATED)
async def create_sppb(payload: SppbCreate, service: SppbSvc):
    """RS menerbitkan SPPB. Nomor dibuat di server, vendor pemenang diambil dari pengadaan."""
    return await service.create(payload)


@router.get("/{sppb_id}", response_model=SppbRead)
async def get_sppb(sppb_id: uuid.UUID, service: SppbSvc):
    return await service.get(sppb_id)


@router.post("/{sppb_id}/progress", response_model=SppbRead)
async def update_progress(
    sppb_id: uuid.UUID, payload: SppbProgressUpdate, user: CurrentUser, service: SppbSvc
):
    """Vendor melapor jumlah barang yang sudah dikirim, per baris item."""
    return await service.update_progress(sppb_id, user, payload)


@router.get(
    "/{sppb_id}/pdf",
    response_class=Response,
    responses={200: {"content": {"application/pdf": {}}}},
)
async def download_sppb_pdf(
    sppb_id: uuid.UUID,
    service: SppbSvc,
    user: CurrentUserFlexible,
    download: bool = False,
):
    sppb = await service.get(sppb_id)
    if user.role == UserRole.VENDOR and sppb.vendor_id != user.vendor_id:
        raise ForbiddenError("Anda hanya bisa mengunduh SPPB milik perusahaan Anda")
    pdf_bytes = await service.render_pdf(sppb_id)
    disposition = "attachment" if download else "inline"
    filename = f"SPPB-{sppb.number.replace('/', '-')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'{disposition}; filename="{filename}"'},
    )
