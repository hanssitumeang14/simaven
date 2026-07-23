from httpx import AsyncClient


async def _seed_verified_vendor_with_login(
    client: AsyncClient, vendor_payload: dict
) -> tuple[dict, str]:
    reg = await client.post(
        "/api/v1/auth/register-vendor",
        json={"vendor": vendor_payload, "password": "vendorpass123"},
    )
    body = reg.json()
    vendor_id = body["user"]["vendor_id"]
    token = body["access_token"]
    await client.post(
        f"/api/v1/vendors/{vendor_id}/verification",
        json={"verification_step": 8, "status": "verified"},
    )
    return body["user"], token


async def _seed_project(client: AsyncClient) -> dict:
    return (
        await client.post(
            "/api/v1/projects",
            json={
                "name": "Pengadaan ATK Kantor Semester 2",
                "type": "Barang",
                "budget": "50000000",
                "hps": "48000000",
                "vendor_category": "Vendor Pengadaan",
            },
        )
    ).json()


def _spk_payload(project_id: str, vendor_id: str) -> dict:
    return {
        "project_id": project_id,
        "vendor_id": vendor_id,
        "issued_date": "2026-07-22",
        "start_date": "2026-08-01",
        "end_date": "2026-10-30",
        "work_description": "Pengadaan alat tulis kantor.",
        "signatory_name": "dr. Test",
        "signatory_position": "Direktur Utama",
        "items": [
            {"description": "Kertas HVS", "unit": "Rim", "quantity": "10", "unit_price": "50000"}
        ],
    }


def _sppb_payload(project_id: str) -> dict:
    return {
        "project_id": project_id,
        "issued_date": "2026-08-01",
        "items": [{"description": "Kertas HVS", "unit": "Rim", "quantity_ordered": "10"}],
    }


async def test_project_starts_at_bidding_stage(client: AsyncClient) -> None:
    project = await _seed_project(client)
    assert project["stage"] == "Bidding"


async def test_full_timeline_happy_path(client: AsyncClient, vendor_payload: dict) -> None:
    vendor, token = await _seed_verified_vendor_with_login(client, vendor_payload)
    auth_header = {"Authorization": f"Bearer {token}"}
    project = await _seed_project(client)
    pid = project["id"]

    # Pengumuman Menang
    resp = await client.post(f"/api/v1/projects/{pid}/award", json={"vendor_id": vendor["vendor_id"]})
    assert resp.json()["stage"] == "Pengumuman Menang"

    # SPK diterbitkan -> stage otomatis maju ke SPK
    spk = (await client.post("/api/v1/spk", json=_spk_payload(pid, vendor["vendor_id"]))).json()
    await client.post(f"/api/v1/spk/{spk['id']}/issue")
    project = (await client.get(f"/api/v1/projects/{pid}")).json()
    assert project["stage"] == "Surat Perintah Kerja (SPK)"

    # SPPB tanpa BG harus ditolak
    resp = await client.post("/api/v1/sppb", json=_sppb_payload(pid))
    assert resp.status_code == 409

    # Lengkapi Bank Garansi
    resp = await client.post(
        f"/api/v1/projects/{pid}/bank-garansi",
        json={"amount": "5000000", "valid_until": "2027-01-01"},
    )
    assert resp.status_code == 200
    assert resp.json()["bg_amount"] is not None

    # SPPB sekarang bisa diterbitkan
    resp = await client.post("/api/v1/sppb", json=_sppb_payload(pid))
    assert resp.status_code == 201
    sppb = resp.json()
    project = (await client.get(f"/api/v1/projects/{pid}")).json()
    assert project["stage"] == "Surat Pesanan Pembelian Barang (SPPB)"

    # Vendor mulai pengerjaan
    resp = await client.post(f"/api/v1/projects/{pid}/work/start", headers=auth_header)
    assert resp.status_code == 200
    assert resp.json()["stage"] == "Pengerjaan Vendor"

    # Vendor melapor progres pengiriman per baris barang
    item_id = sppb["items"][0]["id"]
    resp = await client.post(
        f"/api/v1/sppb/{sppb['id']}/progress",
        json={"items": [{"id": item_id, "quantity_delivered": "10"}]},
        headers=auth_header,
    )
    assert resp.status_code == 200
    assert resp.json()["items"][0]["quantity_delivered"] == "10.00"

    # RS coba konfirmasi sebelum vendor lapor -> ditolak
    resp = await client.post(f"/api/v1/projects/{pid}/work/confirm-complete")
    assert resp.status_code == 409

    # Vendor lapor selesai
    resp = await client.post(f"/api/v1/projects/{pid}/work/report-complete", headers=auth_header)
    assert resp.status_code == 200
    assert resp.json()["stage"] == "Pengerjaan Vendor"  # belum maju, nunggu konfirmasi RS

    # RS konfirmasi
    resp = await client.post(f"/api/v1/projects/{pid}/work/confirm-complete")
    assert resp.status_code == 200
    assert resp.json()["stage"] == "Barang Lengkap"

    # RS selesaikan dengan invoice
    resp = await client.post(
        f"/api/v1/projects/{pid}/finish",
        json={"invoice_number": "INV-001", "invoice_date": "2026-11-01"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["stage"] == "Selesai"
    assert body["status"] == "completed"

    # Timeline mencatat semua tahap secara berurutan
    timeline = (await client.get(f"/api/v1/projects/{pid}/timeline")).json()
    stages = [e["stage"] for e in timeline]
    assert stages == [
        "Bidding",
        "Pengumuman Menang",
        "Surat Perintah Kerja (SPK)",
        "Surat Perintah Kerja (SPK)",
        "Surat Pesanan Pembelian Barang (SPPB)",
        "Pengerjaan Vendor",
        "Pengerjaan Vendor",
        "Pengerjaan Vendor",
        "Barang Lengkap",
        "Selesai",
    ]


async def test_other_vendor_cannot_report_work(client: AsyncClient, vendor_payload: dict) -> None:
    winner, _ = await _seed_verified_vendor_with_login(client, vendor_payload)
    other_payload = {**vendor_payload, "npwp": "99.999.999.9-999.000", "email": "other@example.co.id"}
    _, other_token = await _seed_verified_vendor_with_login(client, other_payload)

    project = await _seed_project(client)
    pid = project["id"]
    await client.post(f"/api/v1/projects/{pid}/award", json={"vendor_id": winner["vendor_id"]})
    spk = (await client.post("/api/v1/spk", json=_spk_payload(pid, winner["vendor_id"]))).json()
    await client.post(f"/api/v1/spk/{spk['id']}/issue")
    await client.post(
        f"/api/v1/projects/{pid}/bank-garansi",
        json={"amount": "5000000", "valid_until": "2027-01-01"},
    )
    await client.post("/api/v1/sppb", json=_sppb_payload(pid))

    resp = await client.post(
        f"/api/v1/projects/{pid}/work/start",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert resp.status_code == 403


async def test_award_rejected_after_bidding_stage(client: AsyncClient, vendor_payload: dict) -> None:
    vendor, _ = await _seed_verified_vendor_with_login(client, vendor_payload)
    project = await _seed_project(client)
    pid = project["id"]
    await client.post(f"/api/v1/projects/{pid}/award", json={"vendor_id": vendor["vendor_id"]})

    resp = await client.post(f"/api/v1/projects/{pid}/award", json={"vendor_id": vendor["vendor_id"]})
    assert resp.status_code == 409
