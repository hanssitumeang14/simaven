import uuid
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, File, Form, Query, UploadFile, status

from app.adapters.db.models.enums import ProjectStatus, ProjectType, UserRole
from app.adapters.storage.local import save_upload
from app.entrypoints.deps import CurrentUser, Pagination, ProjectSvc
from app.lib.exceptions import ForbiddenError
from app.service_layer.schemas.common import Page
from app.service_layer.schemas.notification import VendorNotificationRead
from app.service_layer.schemas.project import (
    BankGaransiInput,
    FinishProjectInput,
    ProjectAwardVendor,
    ProjectCreate,
    ProjectParticipantCreate,
    ProjectParticipantRead,
    ProjectParticipantSelfCreate,
    ProjectParticipantUpdate,
    ProjectRead,
    ProjectTimelineEventRead,
    ProjectUpdate,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=Page[ProjectRead])
async def list_projects(
    service: ProjectSvc,
    pagination: Pagination,
    search: str | None = None,
    project_status: ProjectStatus | None = Query(None, alias="status"),
    project_type: ProjectType | None = Query(None, alias="type"),
):
    return await service.list(
        pagination, search=search, status=project_status, type_=project_type
    )


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(payload: ProjectCreate, service: ProjectSvc):
    return await service.create(payload)


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(project_id: uuid.UUID, service: ProjectSvc):
    return await service.get(project_id)


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(project_id: uuid.UUID, payload: ProjectUpdate, service: ProjectSvc):
    return await service.update(project_id, payload)


@router.post("/{project_id}/award", response_model=ProjectRead)
async def award_vendor(
    project_id: uuid.UUID, payload: ProjectAwardVendor, service: ProjectSvc
):
    """Tetapkan vendor pemenang pengadaan."""
    return await service.award_vendor(project_id, payload.vendor_id)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: uuid.UUID, service: ProjectSvc) -> None:
    await service.delete(project_id)


@router.get("/{project_id}/participants", response_model=list[ProjectParticipantRead])
async def list_participants(project_id: uuid.UUID, service: ProjectSvc):
    """Daftar peserta tender beserta harga penawarannya."""
    return await service.list_participants(project_id)


@router.post(
    "/{project_id}/participants",
    response_model=ProjectParticipantRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_participant(
    project_id: uuid.UUID, payload: ProjectParticipantCreate, service: ProjectSvc
):
    """Daftarkan vendor sebagai peserta tender dengan harga penawarannya."""
    return await service.add_participant(project_id, payload)


@router.post(
    "/{project_id}/participants/me",
    response_model=ProjectParticipantRead,
    status_code=status.HTTP_201_CREATED,
)
async def register_self_as_participant(
    project_id: uuid.UUID,
    payload: ProjectParticipantSelfCreate,
    user: CurrentUser,
    service: ProjectSvc,
):
    """Vendor yang login mendaftarkan dirinya sendiri sebagai peserta tender."""
    if user.role != UserRole.VENDOR or not user.vendor_id:
        raise ForbiddenError("Hanya akun vendor yang bisa mendaftar tender")
    return await service.add_participant(
        project_id,
        ProjectParticipantCreate(vendor_id=user.vendor_id, bid_price=payload.bid_price),
    )


@router.patch("/{project_id}/participants/{vendor_id}", response_model=ProjectParticipantRead)
async def update_participant(
    project_id: uuid.UUID,
    vendor_id: uuid.UUID,
    payload: ProjectParticipantUpdate,
    service: ProjectSvc,
):
    """Perbarui harga terkoreksi/hasil negosiasi peserta tender."""
    return await service.update_participant(project_id, vendor_id, payload)


@router.delete("/{project_id}/participants/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_participant(project_id: uuid.UUID, vendor_id: uuid.UUID, service: ProjectSvc) -> None:
    await service.remove_participant(project_id, vendor_id)


@router.get("/{project_id}/timeline", response_model=list[ProjectTimelineEventRead])
async def get_timeline(project_id: uuid.UUID, service: ProjectSvc):
    """Riwayat tahapan pengadaan: Bidding → Pengumuman Menang → SPK → SPPB →
    Pengerjaan → Barang Lengkap → Selesai."""
    return await service.get_timeline(project_id)


@router.get("/{project_id}/notifications", response_model=list[VendorNotificationRead])
async def list_notifications(project_id: uuid.UUID, service: ProjectSvc):
    """Draft pesan WA pengumuman pemenang untuk tiap peserta tender.

    Belum ada integrasi provider WA — status selalu 'pending', pesan ini
    siap dikirim manual atau disambungkan ke provider WA nanti.
    """
    return await service.list_notifications(project_id)


@router.post("/{project_id}/bank-garansi", response_model=ProjectRead)
async def record_bank_garansi(project_id: uuid.UUID, payload: BankGaransiInput, service: ProjectSvc):
    """RS mencatat Bank Garansi yang diserahkan vendor. Wajib sebelum SPPB bisa diterbitkan."""
    return await service.record_bank_garansi(project_id, payload)


@router.post("/{project_id}/bank-garansi/upload", response_model=ProjectRead)
async def upload_bank_garansi(
    project_id: uuid.UUID,
    user: CurrentUser,
    service: ProjectSvc,
    file: UploadFile = File(...),
    amount: Decimal = Form(...),
    valid_until: date = Form(...),
):
    """Vendor yang sudah punya Bank Garansi dari bank lain unggah dokumennya sendiri."""
    document_path = await save_upload(file, subdir=f"bank-garansi/{project_id}")
    return await service.upload_bank_garansi(project_id, user, amount, valid_until, document_path)


@router.post("/{project_id}/bank-garansi/kopra", response_model=ProjectRead)
async def purchase_bank_garansi_kopra(
    project_id: uuid.UUID, user: CurrentUser, payload: BankGaransiInput, service: ProjectSvc
):
    """Penerbitan Bank Garansi digital via Kopra by Mandiri (simulasi, belum terintegrasi)."""
    return await service.purchase_bank_garansi_kopra(
        project_id, user, payload.amount, payload.valid_until
    )


@router.post("/{project_id}/work/start", response_model=ProjectRead)
async def report_work_started(project_id: uuid.UUID, user: CurrentUser, service: ProjectSvc):
    """Vendor pemenang melaporkan mulai pengerjaan."""
    return await service.report_work_started(project_id, user)


@router.post("/{project_id}/work/report-complete", response_model=ProjectRead)
async def report_goods_complete(project_id: uuid.UUID, user: CurrentUser, service: ProjectSvc):
    """Vendor pemenang melaporkan barang/pekerjaan selesai, menunggu konfirmasi RS."""
    return await service.report_goods_complete(project_id, user)


@router.post("/{project_id}/work/confirm-complete", response_model=ProjectRead)
async def confirm_goods_complete(project_id: uuid.UUID, service: ProjectSvc):
    """RS mengkonfirmasi barang/pekerjaan lengkap."""
    return await service.confirm_goods_complete(project_id)


@router.post("/{project_id}/finish", response_model=ProjectRead)
async def finish_project(project_id: uuid.UUID, payload: FinishProjectInput, service: ProjectSvc):
    """RS menerbitkan invoice dan menutup pengadaan."""
    return await service.finish_project(project_id, payload)
