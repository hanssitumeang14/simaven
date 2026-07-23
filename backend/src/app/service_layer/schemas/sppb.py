import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SppbItemCreate(BaseModel):
    description: str = Field(..., min_length=1)
    unit: str = Field(..., max_length=30)
    quantity_ordered: Decimal = Field(..., gt=0)


class SppbItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    line_no: int
    description: str
    unit: str
    quantity_ordered: Decimal
    quantity_delivered: Decimal


class SppbCreate(BaseModel):
    project_id: uuid.UUID
    issued_date: date
    notes: str | None = None
    items: list[SppbItemCreate] = Field(..., min_length=1)


class SppbItemProgress(BaseModel):
    id: uuid.UUID
    quantity_delivered: Decimal = Field(..., ge=0)


class SppbProgressUpdate(BaseModel):
    items: list[SppbItemProgress] = Field(..., min_length=1)


class SppbRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    number: str
    sequence_no: int
    year: int
    project_id: uuid.UUID
    project_code: str
    project_name: str
    vendor_id: uuid.UUID
    vendor_name: str
    issued_date: date
    notes: str | None
    items: list[SppbItemRead] = []
    created_at: datetime
    updated_at: datetime
