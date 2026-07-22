from sqlalchemy import func, select

from app.adapters.db.models.enums import SpkStatus
from app.adapters.db.models.spk import Spk
from app.adapters.db.repositories.base import BaseRepository


class SpkRepository(BaseRepository[Spk]):
    model = Spk

    async def next_sequence_no(self, year: int) -> int:
        """Nomor urut berikutnya untuk tahun berjalan.

        Dipakai bersama UniqueConstraint(sequence_no, year) supaya dua request
        yang bersamaan tidak menghasilkan nomor kembar — yang kalah akan kena
        IntegrityError dan bisa di-retry.
        """
        stmt = select(func.coalesce(func.max(Spk.sequence_no), 0)).where(Spk.year == year)
        current = (await self.session.execute(stmt)).scalar_one()
        return int(current) + 1

    def build_query(self, *, status: SpkStatus | None = None, project_id=None, vendor_id=None):
        stmt = select(Spk)
        if status:
            stmt = stmt.where(Spk.status == status)
        if project_id:
            stmt = stmt.where(Spk.project_id == project_id)
        if vendor_id:
            stmt = stmt.where(Spk.vendor_id == vendor_id)
        return stmt.order_by(Spk.year.desc(), Spk.sequence_no.desc())
