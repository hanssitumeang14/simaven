from enum import StrEnum


class VendorStatus(StrEnum):
    PENDING = "pending"
    NEED_VERIFICATION = "need-verification"
    VERIFIED = "verified"
    REJECTED = "rejected"


class BankGroup(StrEnum):
    MANDIRI = "Mandiri"
    LAINNYA = "Bank Lainnya"


class ProjectStatus(StrEnum):
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ProjectType(StrEnum):
    BARANG = "Barang"
    JASA = "Jasa"
    KONSTRUKSI = "Konstruksi"
    KONSULTANSI = "Konsultansi"


class SpkStatus(StrEnum):
    DRAFT = "draft"
    ISSUED = "issued"
    CANCELLED = "cancelled"
