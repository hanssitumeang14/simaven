import uuid
from pathlib import Path

from fastapi import UploadFile

UPLOAD_ROOT = Path(__file__).resolve().parents[3] / "uploads"


async def save_upload(file: UploadFile, subdir: str) -> str:
    """Simpan file di disk lokal. Mengembalikan path relatif terhadap UPLOAD_ROOT.

    Placeholder sampai dipindah ke object storage sungguhan (S3/Supabase Storage)
    untuk deployment produksi — disk lokal tidak persisten di banyak platform hosting.
    """
    target_dir = UPLOAD_ROOT / subdir
    target_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(file.filename or "").suffix
    stored_name = f"{uuid.uuid4()}{suffix}"
    target_path = target_dir / stored_name

    content = await file.read()
    target_path.write_bytes(content)

    return f"{subdir}/{stored_name}"
