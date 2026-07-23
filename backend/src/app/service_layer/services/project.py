from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.adapters.db.models.enums import (
    ProjectStage,
    ProjectStatus,
    ProjectType,
    UserRole,
    VendorStatus,
)
from app.adapters.db.models.notification import VendorNotification
from app.adapters.db.models.project import Project, ProjectTimelineEvent, ProjectVendor
from app.adapters.db.models.user import User
from app.adapters.db.models.vendor import Vendor
from app.adapters.db.repositories.project import ProjectRepository
from app.adapters.db.repositories.vendor import VendorRepository
from app.lib.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.lib.logging import get_logger
from app.service_layer.schemas.common import Page, PageParams
from app.service_layer.schemas.project import (
    BankGaransiInput,
    FinishProjectInput,
    ProjectCreate,
    ProjectParticipantCreate,
    ProjectParticipantUpdate,
    ProjectRead,
    ProjectUpdate,
)

_LOGGER = get_logger(__name__)


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ProjectService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ProjectRepository(session)
        self.vendor_repo = VendorRepository(session)

    async def get(self, project_id: uuid.UUID) -> Project:
        project = await self.repo.get(project_id)
        if not project:
            raise NotFoundError(f"Pengadaan {project_id} tidak ditemukan")
        return project

    async def list(
        self,
        params: PageParams,
        *,
        search: str | None = None,
        status: ProjectStatus | None = None,
        type_: ProjectType | None = None,
    ) -> Page[ProjectRead]:
        stmt = self.repo.build_query(search=search, status=status, type_=type_)
        rows, total = await self.repo.list(offset=params.offset, limit=params.size, stmt=stmt)
        return Page[ProjectRead](
            items=[ProjectRead.model_validate(r) for r in rows],
            total=total,
            page=params.page,
            size=params.size,
        )

    async def create(self, payload: ProjectCreate) -> Project:
        code = payload.code or await self._generate_code()
        if await self.repo.get_by_code(code):
            raise ConflictError(f"Kode pengadaan {code} sudah dipakai")
        data = payload.model_dump(exclude={"code"})
        project = await self.repo.create(
            code=code, status=ProjectStatus.ONGOING, stage=ProjectStage.BIDDING, **data
        )
        await self._log_event(project.id, ProjectStage.BIDDING, UserRole.RS, "Pengadaan dibuka")
        await self._queue_new_tender_notifications(project)
        return project

    async def _queue_new_tender_notifications(self, project: Project) -> None:
        """Beri tahu semua vendor yang sudah punya akun SIMAVEN tentang tender baru ini.

        Belum terkirim sungguhan — belum ada provider WA yang tersambung.
        """
        stmt = select(Vendor).join(User, User.vendor_id == Vendor.id).where(
            User.role == UserRole.VENDOR
        )
        result = await self.session.execute(stmt)
        vendors = result.scalars().all()

        category_note = f", kategori vendor: {project.vendor_category}" if project.vendor_category else ""
        message = (
            f"Tender baru dibuka: {project.name} ({project.code}). "
            f"Jenis pengadaan: {project.type}{category_note}. HPS Rp{project.hps:,.0f}. "
            "Silakan login ke SIMAVEN untuk mendaftar sebagai peserta tender."
        )
        for vendor in vendors:
            self.session.add(
                VendorNotification(
                    vendor_id=vendor.id,
                    project_id=project.id,
                    recipient_phone=vendor.phone,
                    message=message,
                )
            )
        await self.session.flush()

    async def update(self, project_id: uuid.UUID, payload: ProjectUpdate) -> Project:
        project = await self.get(project_id)
        return await self.repo.update(project, **payload.model_dump(exclude_unset=True))

    async def award_vendor(self, project_id: uuid.UUID, vendor_id: uuid.UUID) -> Project:
        """Tetapkan pemenang. Hanya vendor terverifikasi yang boleh menang."""
        project = await self.get(project_id)
        if project.stage != ProjectStage.BIDDING:
            raise ConflictError("Pengadaan sudah melewati tahap Bidding")
        vendor = await self.vendor_repo.get(vendor_id)
        if not vendor:
            raise NotFoundError(f"Vendor {vendor_id} tidak ditemukan")
        if vendor.status != VendorStatus.VERIFIED:
            raise ConflictError("Vendor belum terverifikasi, tidak bisa ditetapkan sebagai pemenang")

        project = await self.repo.update(
            project, winning_vendor_id=vendor.id, stage=ProjectStage.PENGUMUMAN_MENANG
        )
        await self._log_event(
            project.id,
            ProjectStage.PENGUMUMAN_MENANG,
            UserRole.RS,
            f"{vendor.company_name} ditetapkan sebagai pemenang",
        )
        await self._queue_award_notifications(project, vendor)
        _LOGGER.info("project_awarded", project_id=str(project.id), vendor_id=str(vendor.id))
        return project

    async def _queue_award_notifications(self, project: Project, winner: Vendor) -> None:
        """Siapkan draft pesan WA pengumuman pemenang untuk semua peserta tender.

        Belum terkirim sungguhan — belum ada provider WA yang tersambung.
        """
        participants = await self.list_participants(project.id)
        candidates = {p.vendor_id: p.vendor for p in participants}
        # Pemenang selalu diberi tahu meski belum sempat terdaftar sebagai peserta.
        candidates[winner.id] = winner

        for candidate in candidates.values():
            if candidate.id == winner.id:
                message = (
                    f"Selamat! Perusahaan Anda, {candidate.company_name}, ditetapkan sebagai "
                    f"pemenang tender {project.name} ({project.code}). SPK akan segera diterbitkan."
                )
            else:
                message = (
                    f"Pengumuman tender {project.name} ({project.code}): pemenang tender ini "
                    f"adalah {winner.company_name}. Terima kasih atas partisipasi Anda."
                )
            self.session.add(
                VendorNotification(
                    vendor_id=candidate.id,
                    project_id=project.id,
                    recipient_phone=candidate.phone,
                    message=message,
                )
            )
        await self.session.flush()

    async def list_notifications(self, project_id: uuid.UUID) -> list[VendorNotification]:
        await self.get(project_id)
        stmt = (
            select(VendorNotification)
            .where(VendorNotification.project_id == project_id)
            .order_by(VendorNotification.created_at)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def delete(self, project_id: uuid.UUID) -> None:
        project = await self.get(project_id)
        try:
            await self.repo.delete(project)
        except IntegrityError as exc:
            await self.session.rollback()
            raise ConflictError(
                "Pengadaan tidak bisa dihapus karena sudah punya SPK"
            ) from exc

    async def list_participants(self, project_id: uuid.UUID) -> list[ProjectVendor]:
        await self.get(project_id)
        stmt = (
            select(ProjectVendor)
            .where(ProjectVendor.project_id == project_id)
            .options(selectinload(ProjectVendor.vendor))
            .order_by(ProjectVendor.bid_price.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def add_participant(
        self, project_id: uuid.UUID, payload: ProjectParticipantCreate
    ) -> ProjectVendor:
        await self.get(project_id)
        vendor = await self.vendor_repo.get(payload.vendor_id)
        if not vendor:
            raise NotFoundError(f"Vendor {payload.vendor_id} tidak ditemukan")

        existing = await self.session.get(ProjectVendor, (project_id, payload.vendor_id))
        if existing:
            raise ConflictError("Vendor sudah terdaftar sebagai peserta tender ini")

        participant = ProjectVendor(
            project_id=project_id, vendor_id=payload.vendor_id, bid_price=payload.bid_price
        )
        self.session.add(participant)
        await self.session.flush()
        _LOGGER.info(
            "project_participant_added",
            project_id=str(project_id),
            vendor_id=str(payload.vendor_id),
        )
        return await self._get_participant_with_vendor(project_id, payload.vendor_id)

    async def update_participant(
        self, project_id: uuid.UUID, vendor_id: uuid.UUID, payload: ProjectParticipantUpdate
    ) -> ProjectVendor:
        participant = await self.session.get(ProjectVendor, (project_id, vendor_id))
        if not participant:
            raise NotFoundError("Peserta tender tidak ditemukan")

        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(participant, key, value)

        await self.session.flush()
        return await self._get_participant_with_vendor(project_id, vendor_id)

    async def _get_participant_with_vendor(
        self, project_id: uuid.UUID, vendor_id: uuid.UUID
    ) -> ProjectVendor:
        stmt = (
            select(ProjectVendor)
            .where(ProjectVendor.project_id == project_id, ProjectVendor.vendor_id == vendor_id)
            .options(selectinload(ProjectVendor.vendor))
            .execution_options(populate_existing=True)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def remove_participant(self, project_id: uuid.UUID, vendor_id: uuid.UUID) -> None:
        participant = await self.session.get(ProjectVendor, (project_id, vendor_id))
        if not participant:
            raise NotFoundError("Peserta tender tidak ditemukan")
        await self.session.delete(participant)
        await self.session.flush()

    # --- Timeline pengadaan ---

    async def get_timeline(self, project_id: uuid.UUID) -> list[ProjectTimelineEvent]:
        await self.get(project_id)
        stmt = (
            select(ProjectTimelineEvent)
            .where(ProjectTimelineEvent.project_id == project_id)
            .order_by(ProjectTimelineEvent.created_at)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def mark_spk_issued(self, project_id: uuid.UUID, spk_number: str) -> None:
        """Dipanggil dari SpkService saat SPK diterbitkan. Memajukan tahap ke SPK."""
        project = await self.get(project_id)
        if project.stage == ProjectStage.PENGUMUMAN_MENANG:
            await self.repo.update(project, stage=ProjectStage.SPK)
        await self._log_event(
            project_id, ProjectStage.SPK, UserRole.RS, f"SPK {spk_number} diterbitkan"
        )

    async def record_bank_garansi(
        self, project_id: uuid.UUID, payload: BankGaransiInput
    ) -> Project:
        project = await self.get(project_id)
        if project.stage != ProjectStage.SPK:
            raise ConflictError("Bank Garansi hanya bisa dilengkapi setelah SPK terbit")

        project = await self.repo.update(
            project,
            bg_amount=payload.amount,
            bg_valid_until=payload.valid_until,
            bg_submitted_at=_now(),
        )
        await self._log_event(
            project_id,
            ProjectStage.SPK,
            UserRole.RS,
            f"Bank Garansi senilai {payload.amount} dicatat, berlaku sampai {payload.valid_until}",
        )
        return project

    async def upload_bank_garansi(
        self,
        project_id: uuid.UUID,
        user: User,
        amount: Decimal,
        valid_until: date,
        document_path: str,
    ) -> Project:
        """Vendor yang sudah punya Bank Garansi dari bank lain unggah dokumennya sendiri."""
        project = await self._get_as_winning_vendor(project_id, user)
        if project.stage != ProjectStage.SPK:
            raise ConflictError("Bank Garansi hanya bisa dilengkapi setelah SPK terbit")

        project = await self.repo.update(
            project,
            bg_amount=amount,
            bg_valid_until=valid_until,
            bg_submitted_at=_now(),
            bg_document_path=document_path,
        )
        await self._log_event(
            project_id,
            ProjectStage.SPK,
            UserRole.VENDOR,
            f"Vendor mengunggah Bank Garansi senilai {amount}, berlaku sampai {valid_until}",
        )
        return project

    async def purchase_bank_garansi_kopra(
        self,
        project_id: uuid.UUID,
        user: User,
        amount: Decimal,
        valid_until: date,
    ) -> Project:
        """Penerbitan Bank Garansi digital lewat Kopra by Mandiri.

        Belum ada integrasi API Kopra sungguhan — ini simulasi hasil penerbitan
        instan (tanpa dokumen unggahan) sebagai placeholder sampai integrasi tersedia.
        """
        project = await self._get_as_winning_vendor(project_id, user)
        if project.stage != ProjectStage.SPK:
            raise ConflictError("Bank Garansi hanya bisa dilengkapi setelah SPK terbit")

        project = await self.repo.update(
            project,
            bg_amount=amount,
            bg_valid_until=valid_until,
            bg_submitted_at=_now(),
            bg_document_path=None,
        )
        await self._log_event(
            project_id,
            ProjectStage.SPK,
            UserRole.VENDOR,
            f"Vendor menerbitkan Bank Garansi senilai {amount} via Kopra by Mandiri "
            f"(simulasi — integrasi API Kopra belum tersedia), berlaku sampai {valid_until}",
        )
        return project

    async def mark_sppb_issued(self, project_id: uuid.UUID, sppb_number: str) -> None:
        """Dipanggil dari SppbService saat SPPB/SPMK diterbitkan. Memajukan tahap ke SPPB.

        Nomor dokumen sendiri sudah memuat label SPPB atau SPMK (lihat
        SppbService.document_label), jadi catatan di sini tidak perlu menambah prefix lagi.
        """
        project = await self.get(project_id)
        if project.stage == ProjectStage.SPK:
            await self.repo.update(project, stage=ProjectStage.SPPB)
        await self._log_event(
            project_id, ProjectStage.SPPB, UserRole.RS, f"{sppb_number} diterbitkan"
        )

    async def log_sppb_progress(self, project_id: uuid.UUID, note: str) -> None:
        """Dipanggil dari SppbService saat vendor melapor progres pengiriman barang."""
        project = await self.get(project_id)
        await self._log_event(project_id, project.stage, UserRole.VENDOR, note)

    async def report_work_started(self, project_id: uuid.UUID, user: User) -> Project:
        project = await self._get_as_winning_vendor(project_id, user)
        if project.stage != ProjectStage.SPPB:
            raise ConflictError("Pengerjaan hanya bisa dimulai pada tahap SPPB")

        project = await self.repo.update(
            project, work_started_at=_now(), stage=ProjectStage.PENGERJAAN
        )
        await self._log_event(
            project_id, ProjectStage.PENGERJAAN, UserRole.VENDOR, "Vendor memulai pengerjaan"
        )
        return project

    async def report_goods_complete(self, project_id: uuid.UUID, user: User) -> Project:
        project = await self._get_as_winning_vendor(project_id, user)
        if project.stage != ProjectStage.PENGERJAAN:
            raise ConflictError("Belum pada tahap pengerjaan")

        project = await self.repo.update(project, goods_reported_at=_now())
        await self._log_event(
            project_id,
            ProjectStage.PENGERJAAN,
            UserRole.VENDOR,
            "Vendor melaporkan barang/pekerjaan selesai, menunggu konfirmasi RS",
        )
        return project

    async def confirm_goods_complete(self, project_id: uuid.UUID) -> Project:
        project = await self.get(project_id)
        if project.stage != ProjectStage.PENGERJAAN:
            raise ConflictError("Belum pada tahap pengerjaan")
        if not project.goods_reported_at:
            raise ConflictError("Vendor belum melaporkan penyelesaian pekerjaan")

        project = await self.repo.update(
            project, goods_confirmed_at=_now(), stage=ProjectStage.BARANG_LENGKAP
        )
        await self._log_event(
            project_id,
            ProjectStage.BARANG_LENGKAP,
            UserRole.RS,
            "RS mengkonfirmasi barang/pekerjaan lengkap",
        )
        return project

    async def finish_project(self, project_id: uuid.UUID, payload: FinishProjectInput) -> Project:
        project = await self.get(project_id)
        if project.stage != ProjectStage.BARANG_LENGKAP:
            raise ConflictError("Pengadaan belum sampai tahap Barang Lengkap")

        project = await self.repo.update(
            project,
            invoice_number=payload.invoice_number,
            invoice_date=payload.invoice_date,
            finished_at=_now(),
            stage=ProjectStage.FINISHED,
            status=ProjectStatus.COMPLETED,
        )
        await self._log_event(
            project_id,
            ProjectStage.FINISHED,
            UserRole.RS,
            f"Invoice {payload.invoice_number} diterbitkan, pengadaan selesai",
        )
        return project

    async def _get_as_winning_vendor(self, project_id: uuid.UUID, user: User) -> Project:
        project = await self.get(project_id)
        if user.role != UserRole.VENDOR or not user.vendor_id:
            raise ForbiddenError("Hanya akun vendor yang bisa melakukan aksi ini")
        if project.winning_vendor_id != user.vendor_id:
            raise ForbiddenError("Perusahaan Anda bukan pemenang pengadaan ini")
        return project

    async def _log_event(
        self, project_id: uuid.UUID, stage: ProjectStage, actor_role: UserRole, note: str
    ) -> None:
        self.session.add(
            ProjectTimelineEvent(
                project_id=project_id, stage=stage, actor_role=actor_role, note=note
            )
        )
        await self.session.flush()

    async def _generate_code(self) -> str:
        """Format mengikuti sistem lama: VMS + MMYY + urutan 4 digit."""
        now = datetime.now()
        prefix = f"VMS{now.month:02d}{now.year % 100:02d}"
        stmt = self.repo.build_query(search=prefix)
        rows, _ = await self.repo.list(limit=1, stmt=stmt)
        last_seq = int(rows[0].code[-4:]) if rows else 0
        return f"{prefix}{last_seq + 1:04d}"
