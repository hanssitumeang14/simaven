import uuid

from fastapi import APIRouter, File, Query, Response, UploadFile, status

from app.adapters.db.models.enums import SpkStatus, UserRole
from app.adapters.storage.local import save_upload
from app.entrypoints.deps import CurrentUser, CurrentUserFlexible, Pagination, SpkSvc
from app.lib.exceptions import ForbiddenError
from app.service_layer.schemas.common import Page
from app.service_layer.schemas.spk import SpkCreate, SpkRead, SpkUpdate

router = APIRouter(prefix="/spk", tags=["spk"])


@router.get("", response_model=Page[SpkRead])
async def list_spk(
    service: SpkSvc,
    pagination: Pagination,
    spk_status: SpkStatus | None = Query(None, alias="status"),
    project_id: uuid.UUID | None = None,
    vendor_id: uuid.UUID | None = None,
):
    return await service.list(
        pagination, status=spk_status, project_id=project_id, vendor_id=vendor_id
    )


@router.post("", response_model=SpkRead, status_code=status.HTTP_201_CREATED)
async def create_spk(payload: SpkCreate, service: SpkSvc):
    """Nomor SPK di-generate di server, bukan dikirim dari frontend."""
    return await service.create(payload)


@router.get("/{spk_id}", response_model=SpkRead)
async def get_spk(spk_id: uuid.UUID, service: SpkSvc):
    return await service.get(spk_id)


@router.patch("/{spk_id}", response_model=SpkRead)
async def update_spk(spk_id: uuid.UUID, payload: SpkUpdate, service: SpkSvc):
    return await service.update(spk_id, payload)


@router.post("/{spk_id}/issue", response_model=SpkRead)
async def issue_spk(spk_id: uuid.UUID, service: SpkSvc):
    """Kunci SPK. Setelah diterbitkan, isinya tidak bisa diubah."""
    return await service.issue(spk_id)


@router.delete("/{spk_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_spk(spk_id: uuid.UUID, service: SpkSvc) -> None:
    """Hanya SPK draft yang bisa dihapus."""
    await service.delete(spk_id)


@router.post("/{spk_id}/signed-document", response_model=SpkRead)
async def upload_signed_document(
    spk_id: uuid.UUID,
    user: CurrentUser,
    service: SpkSvc,
    file: UploadFile = File(...),
):
    """Vendor mengunggah ulang scan/foto SPK yang sudah ditandatangani & distempel."""
    document_path = await save_upload(file, subdir=f"spk-signed/{spk_id}")
    return await service.upload_signed_document(spk_id, user, document_path)


@router.get(
    "/{spk_id}/pdf",
    response_class=Response,
    responses={200: {"content": {"application/pdf": {}}}},
)
async def download_spk_pdf(
    spk_id: uuid.UUID,
    service: SpkSvc,
    user: CurrentUserFlexible,
    download: bool = Query(False, description="true = attachment, false = tampil di browser"),
):
    spk = await service.get(spk_id)
    if user.role == UserRole.VENDOR and spk.vendor_id != user.vendor_id:
        raise ForbiddenError("Anda hanya bisa mengunduh SPK milik perusahaan Anda")
    pdf_bytes = await service.render_pdf(spk_id)
    disposition = "attachment" if download else "inline"
    filename = f"SPK-{spk.number.replace('/', '-')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'{disposition}; filename="{filename}"'},
    )
