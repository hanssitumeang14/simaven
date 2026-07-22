import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.db.models.enums import SpkStatus
from app.adapters.db.models.spk import Spk, SpkItem
from app.adapters.db.repositories.project import ProjectRepository
from app.adapters.db.repositories.spk import SpkRepository
from app.adapters.db.repositories.vendor import VendorRepository
from app.adapters.pdf.renderer import PdfRenderer
from app.lib.exceptions import ConflictError, NotFoundError
from app.lib.logging import get_logger
from app.service_layer.schemas.common import Page, PageParams
from app.service_layer.schemas.spk import SpkCreate, SpkRead, SpkUpdate

_LOGGER = get_logger(__name__)

ROMAN_MONTHS = [
    "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII",
]


class SpkService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = SpkRepository(session)
        self.project_repo = ProjectRepository(session)
        self.vendor_repo = VendorRepository(session)
        self.renderer = PdfRenderer()

    async def get(self, spk_id: uuid.UUID) -> Spk:
        spk = await self.repo.get(spk_id)
        if not spk:
            raise NotFoundError(f"SPK {spk_id} tidak ditemukan")
        return spk

    async def list(
        self, params: PageParams, *, status: SpkStatus | None = None, project_id=None
    ) -> Page[SpkRead]:
        stmt = self.repo.build_query(status=status, project_id=project_id)
        rows, total = await self.repo.list(offset=params.offset, limit=params.size, stmt=stmt)
        return Page[SpkRead](
            items=[SpkRead.model_validate(r) for r in rows],
            total=total,
            page=params.page,
            size=params.size,
        )

    async def create(self, payload: SpkCreate) -> Spk:
        project = await self.project_repo.get(payload.project_id)
        if not project:
            raise NotFoundError(f"Pengadaan {payload.project_id} tidak ditemukan")

        vendor = await self.vendor_repo.get(payload.vendor_id)
        if not vendor:
            raise NotFoundError(f"Vendor {payload.vendor_id} tidak ditemukan")

        if project.winning_vendor_id and project.winning_vendor_id != vendor.id:
            raise ConflictError("Vendor pada SPK bukan pemenang pengadaan ini")

        year = payload.issued_date.year
        sequence_no = await self.repo.next_sequence_no(year)
        number = self.format_number(sequence_no, payload.issued_date)

        spk = Spk(
            number=number,
            sequence_no=sequence_no,
            year=year,
            project_id=project.id,
            vendor_id=vendor.id,
            issued_date=payload.issued_date,
            start_date=payload.start_date,
            end_date=payload.end_date,
            work_description=payload.work_description,
            payment_terms=payload.payment_terms,
            penalty_clause=payload.penalty_clause,
            signatory_name=payload.signatory_name,
            signatory_position=payload.signatory_position,
            status=SpkStatus.DRAFT,
            total_amount=Decimal("0"),
        )
        spk.items = [
            SpkItem(
                line_no=i,
                description=item.description,
                unit=item.unit,
                quantity=item.quantity,
                unit_price=item.unit_price,
                subtotal=item.subtotal,
            )
            for i, item in enumerate(payload.items, start=1)
        ]
        spk.total_amount = sum((i.subtotal for i in spk.items), Decimal("0"))

        self.session.add(spk)
        try:
            await self.session.flush()
        except IntegrityError as exc:
            # Nomor urut bentrok karena ada request lain yang menang balapan.
            await self.session.rollback()
            raise ConflictError(
                "Nomor SPK bentrok, silakan kirim ulang permintaan"
            ) from exc

        await self.session.refresh(spk)
        _LOGGER.info("spk_created", spk_id=str(spk.id), number=spk.number)
        return spk

    async def update(self, spk_id: uuid.UUID, payload: SpkUpdate) -> Spk:
        spk = await self.get(spk_id)
        if spk.status != SpkStatus.DRAFT:
            raise ConflictError("SPK yang sudah diterbitkan tidak bisa diubah")

        values = payload.model_dump(exclude_unset=True, exclude={"items"})
        for key, value in values.items():
            setattr(spk, key, value)

        if payload.items is not None:
            spk.items = [
                SpkItem(
                    line_no=i,
                    description=item.description,
                    unit=item.unit,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    subtotal=item.subtotal,
                )
                for i, item in enumerate(payload.items, start=1)
            ]
            spk.total_amount = sum((i.subtotal for i in spk.items), Decimal("0"))

        await self.session.flush()
        await self.session.refresh(spk)
        return spk

    async def issue(self, spk_id: uuid.UUID) -> Spk:
        """Kunci SPK. Setelah ini isinya tidak bisa diubah lagi."""
        spk = await self.get(spk_id)
        if spk.status != SpkStatus.DRAFT:
            raise ConflictError(f"SPK sudah berstatus {spk.status}")
        spk.status = SpkStatus.ISSUED
        await self.session.flush()
        await self.session.refresh(spk)
        _LOGGER.info("spk_issued", spk_id=str(spk.id), number=spk.number)
        return spk

    async def render_pdf(self, spk_id: uuid.UUID) -> bytes:
        spk = await self.get(spk_id)
        return self.renderer.render_spk(spk)

    @staticmethod
    def format_number(sequence_no: int, issued_date: date) -> str:
        """001/SPK/VII/2026"""
        roman = ROMAN_MONTHS[issued_date.month - 1]
        return f"{sequence_no:03d}/SPK/{roman}/{issued_date.year}"
