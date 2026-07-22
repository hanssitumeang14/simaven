from httpx import AsyncClient


async def _seed_verified_vendor(client: AsyncClient, vendor_payload: dict) -> dict:
    vendor = (await client.post("/api/v1/vendors", json=vendor_payload)).json()
    await client.post(
        f"/api/v1/vendors/{vendor['id']}/verification",
        json={"verification_step": 8, "status": "verified"},
    )
    return vendor


async def _seed_project(client: AsyncClient, vendor_id: str) -> dict:
    project = (
        await client.post(
            "/api/v1/projects",
            json={
                "name": "Perbaikan Cerobong Genset Dan Boiler RSAB Harapan Kita Tahun 2026",
                "type": "Jasa",
                "budget": "173531000",
                "hps": "173531000",
                "bank": "Mandiri",
                "vendor_category": "Vendor Pengadaan",
            },
        )
    ).json()
    await client.post(
        f"/api/v1/projects/{project['id']}/award", json={"vendor_id": vendor_id}
    )
    return project


def _spk_payload(project_id: str, vendor_id: str) -> dict:
    return {
        "project_id": project_id,
        "vendor_id": vendor_id,
        "issued_date": "2026-07-22",
        "start_date": "2026-08-01",
        "end_date": "2026-10-30",
        "work_description": "Perbaikan cerobong genset dan boiler termasuk pengadaan material.",
        "payment_terms": "Pembayaran 100% setelah serah terima pekerjaan.",
        "penalty_clause": "Denda keterlambatan 1/1000 per hari dari nilai SPK.",
        "signatory_name": "dr. Ockti Palupi Rahayu, MARS",
        "signatory_position": "Direktur Utama",
        "items": [
            {
                "description": "Pembongkaran cerobong lama",
                "unit": "ls",
                "quantity": "1",
                "unit_price": "23531000",
            },
            {
                "description": "Pemasangan cerobong stainless 304",
                "unit": "m",
                "quantity": "50",
                "unit_price": "3000000",
            },
        ],
    }


async def test_create_spk_generates_number_and_total(
    client: AsyncClient, vendor_payload: dict
) -> None:
    vendor = await _seed_verified_vendor(client, vendor_payload)
    project = await _seed_project(client, vendor["id"])

    resp = await client.post("/api/v1/spk", json=_spk_payload(project["id"], vendor["id"]))
    assert resp.status_code == 201

    spk = resp.json()
    assert spk["number"] == "001/SPK/VII/2026"
    assert spk["status"] == "draft"
    assert float(spk["total_amount"]) == 173_531_000
    assert len(spk["items"]) == 2
    assert [i["line_no"] for i in spk["items"]] == [1, 2]


async def test_sequence_increments_within_year(
    client: AsyncClient, vendor_payload: dict
) -> None:
    vendor = await _seed_verified_vendor(client, vendor_payload)
    project = await _seed_project(client, vendor["id"])
    payload = _spk_payload(project["id"], vendor["id"])

    first = (await client.post("/api/v1/spk", json=payload)).json()
    second = (await client.post("/api/v1/spk", json=payload)).json()

    assert first["number"] == "001/SPK/VII/2026"
    assert second["number"] == "002/SPK/VII/2026"


async def test_issued_spk_is_immutable(client: AsyncClient, vendor_payload: dict) -> None:
    vendor = await _seed_verified_vendor(client, vendor_payload)
    project = await _seed_project(client, vendor["id"])
    spk = (await client.post("/api/v1/spk", json=_spk_payload(project["id"], vendor["id"]))).json()

    await client.post(f"/api/v1/spk/{spk['id']}/issue")
    resp = await client.patch(
        f"/api/v1/spk/{spk['id']}", json={"work_description": "diubah setelah terbit"}
    )
    assert resp.status_code == 409


async def test_download_pdf(client: AsyncClient, vendor_payload: dict) -> None:
    vendor = await _seed_verified_vendor(client, vendor_payload)
    project = await _seed_project(client, vendor["id"])
    spk = (await client.post("/api/v1/spk", json=_spk_payload(project["id"], vendor["id"]))).json()

    rs = await client.post(
        "/api/v1/auth/register",
        json={"email": "staff-pdf@simaven.id", "full_name": "Staff RS", "password": "supersecret123"},
    )
    token = rs.json()["access_token"]

    resp = await client.get(
        f"/api/v1/spk/{spk['id']}/pdf", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content.startswith(b"%PDF")
    assert "001-SPK-VII-2026" in resp.headers["content-disposition"]


async def test_download_pdf_rejected_without_auth(client: AsyncClient, vendor_payload: dict) -> None:
    vendor = await _seed_verified_vendor(client, vendor_payload)
    project = await _seed_project(client, vendor["id"])
    spk = (await client.post("/api/v1/spk", json=_spk_payload(project["id"], vendor["id"]))).json()

    resp = await client.get(f"/api/v1/spk/{spk['id']}/pdf")
    assert resp.status_code == 401


async def test_download_pdf_rejected_for_other_vendor(
    client: AsyncClient, vendor_payload: dict
) -> None:
    vendor = await _seed_verified_vendor(client, vendor_payload)
    project = await _seed_project(client, vendor["id"])
    spk = (await client.post("/api/v1/spk", json=_spk_payload(project["id"], vendor["id"]))).json()

    other_payload = {**vendor_payload, "npwp": "77.777.777.7-777.000", "email": "other-spk@example.co.id"}
    other_reg = await client.post(
        "/api/v1/auth/register-vendor",
        json={"vendor": other_payload, "password": "otherpass123"},
    )
    other_token = other_reg.json()["access_token"]

    resp = await client.get(
        f"/api/v1/spk/{spk['id']}/pdf", headers={"Authorization": f"Bearer {other_token}"}
    )
    assert resp.status_code == 403
