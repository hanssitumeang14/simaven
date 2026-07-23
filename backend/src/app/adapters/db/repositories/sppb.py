from sqlalchemy import func, select

from app.adapters.db.models.sppb import Sppb
from app.adapters.db.repositories.base import BaseRepository


class SppbRepository(BaseRepository[Sppb]):
    model = Sppb

    async def next_sequence_no(self, year: int) -> int:
        """Nomor urut berikutnya untuk tahun berjalan.

        Dipakai bersama UniqueConstraint(sequence_no, year) supaya dua request
        yang bersamaan tidak menghasilkan nomor kembar — yang kalah akan kena
        IntegrityError dan bisa di-retry.
        """
        stmt = select(func.coalesce(func.max(Sppb.sequence_no), 0)).where(Sppb.year == year)
        current = (await self.session.execute(stmt)).scalar_one()
        return int(current) + 1

    def build_query(self, *, project_id=None, vendor_id=None):
        stmt = select(Sppb)
        if project_id:
            stmt = stmt.where(Sppb.project_id == project_id)
        if vendor_id:
            stmt = stmt.where(Sppb.vendor_id == vendor_id)
        return stmt.order_by(Sppb.year.desc(), Sppb.sequence_no.desc())
