from sqlalchemy import or_, select

from app.adapters.db.models.enums import BankGroup, VendorStatus
from app.adapters.db.models.vendor import Vendor
from app.adapters.db.repositories.base import BaseRepository


class VendorRepository(BaseRepository[Vendor]):
    model = Vendor

    async def get_by_npwp(self, npwp: str) -> Vendor | None:
        stmt = select(Vendor).where(Vendor.npwp == npwp)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    def build_query(
        self,
        *,
        search: str | None = None,
        status: VendorStatus | None = None,
        bank: BankGroup | None = None,
    ):
        stmt = select(Vendor)
        if search:
            pattern = f"%{search}%"
            stmt = stmt.where(
                or_(Vendor.company_name.ilike(pattern), Vendor.npwp.ilike(pattern))
            )
        if status:
            stmt = stmt.where(Vendor.status == status)
        if bank:
            stmt = stmt.where(Vendor.bank == bank)
        return stmt.order_by(Vendor.company_name)
