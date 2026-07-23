from decimal import Decimal
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML

from app.adapters.db.models.enums import ProjectType
from app.adapters.db.models.project import Project
from app.adapters.db.models.spk import Spk
from app.adapters.db.models.sppb import Sppb
from app.config import settings

TEMPLATE_DIR = Path(__file__).parent / "templates"

_UNITS = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"]


def _spell(n: int) -> str:
    """Rekursi internal. Mengembalikan string kosong untuk 0 supaya sisa
    pembagian tidak menghasilkan '... nol' di ujung kalimat."""
    if n == 0:
        return ""
    if n < 10:
        return _UNITS[n]
    if n == 10:
        return "sepuluh"
    if n == 11:
        return "sebelas"
    if n < 20:
        return f"{_UNITS[n - 10]} belas"
    if n < 100:
        return f"{_UNITS[n // 10]} puluh {_spell(n % 10)}".strip()
    if n < 200:
        return f"seratus {_spell(n - 100)}".strip()
    if n < 1_000:
        return f"{_UNITS[n // 100]} ratus {_spell(n % 100)}".strip()
    if n < 2_000:
        return f"seribu {_spell(n - 1000)}".strip()
    if n < 1_000_000:
        return f"{_spell(n // 1_000)} ribu {_spell(n % 1_000)}".strip()
    if n < 1_000_000_000:
        return f"{_spell(n // 1_000_000)} juta {_spell(n % 1_000_000)}".strip()
    if n < 1_000_000_000_000:
        return f"{_spell(n // 1_000_000_000)} miliar {_spell(n % 1_000_000_000)}".strip()
    return f"{_spell(n // 1_000_000_000_000)} triliun {_spell(n % 1_000_000_000_000)}".strip()


def terbilang(value: Decimal | int | float) -> str:
    """Angka ke kata-kata bahasa Indonesia. Wajib ada di dokumen SPK."""
    n = int(value)
    if n < 0:
        return f"minus {terbilang(-n)}"
    if n == 0:
        return "nol"
    return " ".join(_spell(n).split())


def rupiah(value: Decimal | int | float | None) -> str:
    if value is None:
        return "-"
    return f"Rp {Decimal(value):,.2f}".replace(",", "_").replace(".", ",").replace("_", ".")


def tanggal_id(value) -> str:
    bulan = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ]
    return f"{value.day} {bulan[value.month - 1]} {value.year}"


class PdfRenderer:
    """HTML + CSS -> PDF. Template ada di adapters/pdf/templates."""

    def __init__(self) -> None:
        self.env = Environment(
            loader=FileSystemLoader(TEMPLATE_DIR),
            autoescape=select_autoescape(["html"]),
        )
        self.env.filters["rupiah"] = rupiah
        self.env.filters["terbilang"] = terbilang
        self.env.filters["tanggal_id"] = tanggal_id

    def render_html(self, spk: Spk) -> str:
        template = self.env.get_template("spk.html")
        return template.render(
            spk=spk,
            project=spk.project,
            vendor=spk.vendor,
            items=spk.items,
            org_name=settings.ORG_NAME,
            org_address=settings.ORG_ADDRESS,
            org_city=settings.ORG_CITY,
            org_logo=settings.ORG_LOGO_PATH,
        )

    def render_spk(self, spk: Spk) -> bytes:
        html = self.render_html(spk)
        return HTML(string=html, base_url=str(TEMPLATE_DIR)).write_pdf()

    def render_sppb_html(self, sppb: Sppb) -> str:
        template = self.env.get_template("sppb.html")
        is_barang = sppb.project.type == ProjectType.BARANG
        return template.render(
            sppb=sppb,
            project=sppb.project,
            vendor=sppb.vendor,
            items=sppb.items,
            doc_label="SPPB" if is_barang else "SPMK",
            doc_title="Surat Pesanan Pembelian Barang" if is_barang else "Surat Perintah Mulai Kerja",
            is_barang=is_barang,
            org_name=settings.ORG_NAME,
            org_address=settings.ORG_ADDRESS,
            org_city=settings.ORG_CITY,
            org_logo=settings.ORG_LOGO_PATH,
        )

    def render_sppb(self, sppb: Sppb) -> bytes:
        html = self.render_sppb_html(sppb)
        return HTML(string=html, base_url=str(TEMPLATE_DIR)).write_pdf()

    def render_invoice_html(self, project: Project, spk: Spk) -> str:
        template = self.env.get_template("invoice.html")
        return template.render(
            project=project,
            spk=spk,
            vendor=spk.vendor,
            items=spk.items,
            org_name=settings.ORG_NAME,
            org_address=settings.ORG_ADDRESS,
            org_city=settings.ORG_CITY,
            org_logo=settings.ORG_LOGO_PATH,
        )

    def render_invoice(self, project: Project, spk: Spk) -> bytes:
        html = self.render_invoice_html(project, spk)
        return HTML(string=html, base_url=str(TEMPLATE_DIR)).write_pdf()
