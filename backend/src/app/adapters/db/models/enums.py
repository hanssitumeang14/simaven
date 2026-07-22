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


class UserRole(StrEnum):
    RS = "rs"
    VENDOR = "vendor"
    BANK_MANDIRI = "bank_mandiri"


class VendorCategory(StrEnum):
    OPERASIONAL = "Vendor Operasional"
    PENGADAAN = "Vendor Pengadaan"
    CLEANING_SERVICE = "Cleaning Service"


class ProjectStage(StrEnum):
    """Timeline pengadaan, dari lelang sampai selesai."""

    BIDDING = "Bidding"
    PENGUMUMAN_MENANG = "Pengumuman Menang"
    SPK = "Surat Perintah Kerja (SPK)"
    SPPB = "Surat Pesanan Pembelian Barang (SPPB)"
    PENGERJAAN = "Pengerjaan Vendor"
    BARANG_LENGKAP = "Barang Lengkap"
    FINISHED = "Selesai"


class NotificationStatus(StrEnum):
    """Belum ada integrasi provider WA sungguhan — status selalu 'pending'
    sampai ada yang menyambungkan endpoint pengiriman."""

    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
