import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.adapters.db.models.enums import (
    BankGroup,
    ProjectStage,
    ProjectStatus,
    ProjectType,
    UserRole,
    VendorCategory,
)
from app.service_layer.schemas.vendor import VendorRead


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=5, max_length=500)
    type: ProjectType
    budget: Decimal = Field(..., ge=0)
    hps: Decimal = Field(..., ge=0)
    bank: BankGroup | None = None
    # Nullable supaya project lama (sebelum fitur ini ada) tetap valid saat dibaca.
    vendor_category: VendorCategory | None = None


class ProjectCreate(ProjectBase):
    code: str | None = Field(None, max_length=30, description="Kosongkan untuk auto-generate")
    # Wajib diisi saat bikin project baru, walau nullable di ProjectBase/ProjectRead.
    vendor_category: VendorCategory


class ProjectUpdate(BaseModel):
    name: str | None = None
    type: ProjectType | None = None
    budget: Decimal | None = None
    hps: Decimal | None = None
    bank: BankGroup | None = None
    vendor_category: VendorCategory | None = None
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
    stage: ProjectStage
    bg_amount: Decimal | None = None
    bg_valid_until: date | None = None
    bg_submitted_at: datetime | None = None
    bg_document_path: str | None = None
    sppb_number: str | None = None
    sppb_date: date | None = None
    work_started_at: datetime | None = None
    goods_reported_at: datetime | None = None
    goods_confirmed_at: datetime | None = None
    invoice_number: str | None = None
    invoice_date: date | None = None
    finished_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class BankGaransiInput(BaseModel):
    amount: Decimal = Field(..., gt=0)
    valid_until: date


class SppbInput(BaseModel):
    number: str = Field(..., min_length=1, max_length=50)
    date: date


class FinishProjectInput(BaseModel):
    invoice_number: str = Field(..., min_length=1, max_length=50)
    invoice_date: date


class ProjectTimelineEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    stage: ProjectStage
    actor_role: UserRole | None
    note: str | None
    created_at: datetime


class ProjectParticipantCreate(BaseModel):
    """Mendaftarkan vendor sebagai peserta tender beserta harga penawarannya."""

    vendor_id: uuid.UUID
    bid_price: Decimal = Field(..., ge=0)


class ProjectParticipantSelfCreate(BaseModel):
    """Dipakai vendor yang login untuk mendaftar sebagai peserta tender sendiri."""

    bid_price: Decimal = Field(..., ge=0)


class ProjectParticipantUpdate(BaseModel):
    """Dipakai saat proses evaluasi/negosiasi berjalan."""

    corrected_price: Decimal | None = Field(None, ge=0)
    negotiated_price: Decimal | None = Field(None, ge=0)


class ProjectParticipantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    vendor_id: uuid.UUID
    bid_price: Decimal
    corrected_price: Decimal | None
    negotiated_price: Decimal | None
    vendor: VendorRead
