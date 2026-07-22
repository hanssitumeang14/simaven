import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.adapters.db.models.enums import SpkStatus


class SpkItemCreate(BaseModel):
    description: str = Field(..., min_length=1)
    unit: str = Field(..., max_length=30)
    quantity: Decimal = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)

    @property
    def subtotal(self) -> Decimal:
        return self.quantity * self.unit_price


class SpkItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    line_no: int
    description: str
    unit: str
    quantity: Decimal
    unit_price: Decimal
    subtotal: Decimal


class SpkCreate(BaseModel):
    project_id: uuid.UUID
    vendor_id: uuid.UUID
    issued_date: date
    start_date: date
    end_date: date
    work_description: str = Field(..., min_length=10)
    payment_terms: str | None = None
    penalty_clause: str | None = None
    signatory_name: str = Field(..., max_length=255)
    signatory_position: str = Field(..., max_length=255)
    items: list[SpkItemCreate] = Field(..., min_length=1)

    @model_validator(mode="after")
    def check_period(self) -> "SpkCreate":
        if self.end_date < self.start_date:
            raise ValueError("end_date tidak boleh lebih awal dari start_date")
        return self


class SpkUpdate(BaseModel):
    """SPK yang sudah issued tidak boleh diubah — service layer yang menegakkan."""

    issued_date: date | None = None
    start_date: date | None = None
    end_date: date | None = None
    work_description: str | None = None
    payment_terms: str | None = None
    penalty_clause: str | None = None
    signatory_name: str | None = None
    signatory_position: str | None = None
    items: list[SpkItemCreate] | None = None


class SpkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    number: str
    sequence_no: int
    year: int
    project_id: uuid.UUID
    vendor_id: uuid.UUID
    issued_date: date
    start_date: date
    end_date: date
    work_description: str
    payment_terms: str | None
    penalty_clause: str | None
    total_amount: Decimal
    signatory_name: str
    signatory_position: str
    status: SpkStatus
    items: list[SpkItemRead] = []
    created_at: datetime
    updated_at: datetime
