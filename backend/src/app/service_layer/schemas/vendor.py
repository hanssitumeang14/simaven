import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.adapters.db.models.enums import BankGroup, VendorCategory, VendorStatus


class FinancialScore(BaseModel):
    """5C profiling. Skala 0-100."""

    character: int | None = Field(None, ge=0, le=100)
    capacity: int | None = Field(None, ge=0, le=100)
    capital: int | None = Field(None, ge=0, le=100)
    collateral: int | None = Field(None, ge=0, le=100)
    condition: int | None = Field(None, ge=0, le=100)


class VendorDocuments(BaseModel):
    sptTahunan: str | None = None
    neraca: str | None = None
    anggaranDasar: str | None = None
    izinPerusahaan: str | None = None
    rekening: str | None = None


class VendorBase(BaseModel):
    npwp: str = Field(..., min_length=15, max_length=25)
    company_name: str = Field(..., min_length=3, max_length=255)
    company_type: str = Field(..., max_length=20)
    director_name: str = Field(..., min_length=3, max_length=255)
    # Nullable supaya vendor lama (sebelum fitur ini ada) tetap valid saat dibaca.
    category: VendorCategory | None = None
    city: str = Field(..., max_length=100)
    address: str = Field(..., max_length=500)
    email: EmailStr
    phone: str = Field(..., min_length=8, max_length=30)
    bank: BankGroup
    bank_name: str = Field(..., max_length=100)
    bank_account_no: str | None = Field(None, max_length=50)

    @field_validator("npwp")
    @classmethod
    def normalize_npwp(cls, v: str) -> str:
        return v.strip()


class VendorCreate(VendorBase):
    # Wajib diisi saat registrasi baru, walau nullable di VendorBase/VendorRead.
    category: VendorCategory


class VendorUpdate(BaseModel):
    company_name: str | None = None
    company_type: str | None = None
    director_name: str | None = None
    category: VendorCategory | None = None
    city: str | None = None
    address: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    bank: BankGroup | None = None
    bank_name: str | None = None
    bank_account_no: str | None = None
    documents: VendorDocuments | None = None
    financial_score: FinancialScore | None = None


class VendorVerificationUpdate(BaseModel):
    """Menggerakkan vendor di alur verifikasi 8 langkah."""

    verification_step: int = Field(..., ge=0, le=8)
    status: VendorStatus
    note: str | None = None


class VendorRead(VendorBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: VendorStatus
    verification_step: int
    documents: dict = {}
    financial_score: dict | None = None
    performance_rating: float | None = None
    created_at: datetime
    updated_at: datetime
