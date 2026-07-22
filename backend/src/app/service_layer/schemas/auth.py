import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.adapters.db.models.enums import UserRole
from app.service_layer.schemas.vendor import VendorCreate


class UserRegister(BaseModel):
    """Registrasi akun internal RS."""

    email: EmailStr
    full_name: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=8, max_length=100)


class VendorRegister(BaseModel):
    """Registrasi akun vendor: bikin profil perusahaan sekaligus akun login.

    Email login dan nama penanggung jawab dipakai dari data vendor
    (vendor.email, vendor.director_name) supaya tidak ada field ganda.
    """

    vendor: VendorCreate
    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    role: UserRole
    vendor_id: uuid.UUID | None
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
