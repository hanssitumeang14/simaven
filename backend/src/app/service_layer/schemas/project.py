import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.adapters.db.models.enums import BankGroup, ProjectStatus, ProjectType


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=5, max_length=500)
    type: ProjectType
    budget: Decimal = Field(..., ge=0)
    hps: Decimal = Field(..., ge=0)
    bank: BankGroup | None = None


class ProjectCreate(ProjectBase):
    code: str | None = Field(None, max_length=30, description="Kosongkan untuk auto-generate")


class ProjectUpdate(BaseModel):
    name: str | None = None
    type: ProjectType | None = None
    budget: Decimal | None = None
    hps: Decimal | None = None
    bank: BankGroup | None = None
    status: ProjectStatus | None = None


class ProjectAwardVendor(BaseModel):
    """Menetapkan vendor pemenang."""

    vendor_id: uuid.UUID


class ProjectRead(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    status: ProjectStatus
    winning_vendor_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime
