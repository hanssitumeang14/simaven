import uuid
from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.db.models.enums import ProjectStage, UserRole
from app.adapters.db.models.sppb import Sppb, SppbItem
from app.adapters.db.models.user import User
from app.adapters.db.repositories.project import ProjectRepository
from app.adapters.db.repositories.sppb import SppbRepository
from app.adapters.pdf.renderer import PdfRenderer
from app.lib.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.lib.logging import get_logger
from app.service_layer.schemas.common import Page, PageParams
from app.service_layer.schemas.sppb import SppbCreate, SppbProgressUpdate, SppbRead
from app.service_layer.services.project import ProjectService

_LOGGER = get_logger(__name__)

ROMAN_MONTHS = [
    "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII",
]


class SppbService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = SppbRepository(session)
        self.project_repo = ProjectRepository(session)
        self.renderer = PdfRenderer()

    async def get(self, sppb_id: uuid.UUID) -> Sppb:
        sppb = await self.repo.get(sppb_id)
        if not sppb:
            raise NotFoundError(f"SPPB {sppb_id} tidak ditemukan")
        return sppb

    async def list(
        self, params: PageParams, *, project_id=None, vendor_id=None
    ) -> Page[SppbRead]:
        stmt = self.repo.build_query(project_id=project_id, vendor_id=vendor_id)
        rows, total = await self.repo.list(offset=params.offset, limit=params.size, stmt=stmt)
        return Page[SppbRead](
            items=[SppbRead.model_validate(r) for r in rows],
            total=total,
            page=params.page,
            size=params.size,
        )

    async def create(self, payload: SppbCreate) -> Sppb:
        project = await self.project_repo.get(payload.project_id)
        if not project:
            raise NotFoundError(f"Pengadaan {payload.project_id} tidak ditemukan")
        if project.stage != ProjectStage.SPK:
            raise ConflictError("SPPB hanya bisa diterbitkan pada tahap SPK")
        if not project.bg_submitted_at:
            raise ConflictError("Bank Garansi belum dilengkapi")
        if not project.winning_vendor_id:
            raise ConflictError("Pengadaan belum punya vendor pemenang")

        year = payload.issued_date.year
        sequence_no = await self.repo.next_sequence_no(year)
        number = self.format_number(sequence_no, payload.issued_date)

        sppb = Sppb(
            number=number,
            sequence_no=sequence_no,
            year=year,
            project_id=project.id,
            vendor_id=project.winning_vendor_id,
            issued_date=payload.issued_date,
            notes=payload.notes,
        )
        sppb.items = [
            SppbItem(
                line_no=i,
                description=item.description,
                unit=item.unit,
                quantity_ordered=item.quantity_ordered,
                quantity_delivered=Decimal("0"),
            )
            for i, item in enumerate(payload.items, start=1)
        ]

        self.session.add(sppb)
        try:
            await self.session.flush()
        except IntegrityError as exc:
            # Nomor urut bentrok karena ada request lain yang menang balapan.
            await self.session.rollback()
            raise ConflictError(
                "Nomor SPPB bentrok, silakan kirim ulang permintaan"
            ) from exc

        await self.session.refresh(sppb)
        await ProjectService(self.session).mark_sppb_issued(project.id, sppb.number)
        _LOGGER.info("sppb_created", sppb_id=str(sppb.id), number=sppb.number)
        return sppb

    async def update_progress(
        self, sppb_id: uuid.UUID, user: User, payload: SppbProgressUpdate
    ) -> Sppb:
        """Vendor melaporkan jumlah barang yang sudah dikirim, per baris item."""
        sppb = await self.get(sppb_id)
        if user.role != UserRole.VENDOR or sppb.vendor_id != user.vendor_id:
            raise ForbiddenError("Hanya vendor pemilik SPPB ini yang bisa melapor progres")

        items_by_id = {item.id: item for item in sppb.items}
        summary_parts: list[str] = []
        for update in payload.items:
            item = items_by_id.get(update.id)
            if not item:
                raise NotFoundError(f"Baris barang {update.id} tidak ditemukan di SPPB ini")
            if update.quantity_delivered > item.quantity_ordered:
                raise ConflictError(
                    f"Jumlah dikirim untuk '{item.description}' melebihi jumlah dipesan"
                )
            item.quantity_delivered = update.quantity_delivered
            summary_parts.append(
                f"{item.description}: {item.quantity_delivered}/{item.quantity_ordered} {item.unit}"
            )

        await self.session.flush()
        await self.session.refresh(sppb)
        await ProjectService(self.session).log_sppb_progress(
            sppb.project_id,
            "Vendor melaporkan progres pengiriman barang: " + "; ".join(summary_parts),
        )
        _LOGGER.info("sppb_progress_updated", sppb_id=str(sppb.id))
        return sppb

    async def render_pdf(self, sppb_id: uuid.UUID) -> bytes:
        sppb = await self.get(sppb_id)
        return self.renderer.render_sppb(sppb)

    @staticmethod
    def format_number(sequence_no: int, issued_date) -> str:
        """001/SPPB/VII/2026"""
        roman = ROMAN_MONTHS[issued_date.month - 1]
        return f"{sequence_no:03d}/SPPB/{roman}/{issued_date.year}"
