from httpx import AsyncClient


async def _seed_vendor(client: AsyncClient, vendor_payload: dict, npwp: str, name: str) -> dict:
    payload = {**vendor_payload, "npwp": npwp, "company_name": name}
    return (await client.post("/api/v1/vendors", json=payload)).json()


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


async def test_delete_project_without_spk(client: AsyncClient) -> None:
    project = await _seed_project(client)
    resp = await client.delete(f"/api/v1/projects/{project['id']}")
    assert resp.status_code == 204

    resp = await client.get(f"/api/v1/projects/{project['id']}")
    assert resp.status_code == 404


async def test_delete_project_with_spk_rejected(client: AsyncClient, vendor_payload: dict) -> None:
    vendor = await _seed_vendor(client, vendor_payload, "08.888.888.8-888.000", "PT Sudah SPK")
    await client.post(
        f"/api/v1/vendors/{vendor['id']}/verification",
        json={"verification_step": 8, "status": "verified"},
    )
    project = await _seed_project(client)
    await client.post(f"/api/v1/projects/{project['id']}/award", json={"vendor_id": vendor["id"]})
    await client.post(
        "/api/v1/spk",
        json={
            "project_id": project["id"],
            "vendor_id": vendor["id"],
            "issued_date": "2026-07-22",
            "start_date": "2026-08-01",
            "end_date": "2026-09-01",
            "work_description": "Pekerjaan test hapus project.",
            "signatory_name": "dr. Test",
            "signatory_position": "Direktur Utama",
            "items": [{"description": "Item", "unit": "pcs", "quantity": "1", "unit_price": "1000"}],
        },
    )

    resp = await client.delete(f"/api/v1/projects/{project['id']}")
    assert resp.status_code == 409


async def test_add_participant(client: AsyncClient, vendor_payload: dict) -> None:
    vendor = await _seed_vendor(client, vendor_payload, "01.111.111.1-111.000", "PT Peserta Satu")
    project = await _seed_project(client)

    resp = await client.post(
        f"/api/v1/projects/{project['id']}/participants",
        json={"vendor_id": vendor["id"], "bid_price": "47000000"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["vendor_id"] == vendor["id"]
    assert float(body["bid_price"]) == 47_000_000
    assert body["vendor"]["company_name"] == "PT Peserta Satu"


async def test_duplicate_participant_rejected(client: AsyncClient, vendor_payload: dict) -> None:
    vendor = await _seed_vendor(client, vendor_payload, "02.222.222.2-222.000", "PT Peserta Dua")
    project = await _seed_project(client)

    body = {"vendor_id": vendor["id"], "bid_price": "47000000"}
    await client.post(f"/api/v1/projects/{project['id']}/participants", json=body)
    resp = await client.post(f"/api/v1/projects/{project['id']}/participants", json=body)
    assert resp.status_code == 409


async def test_list_participants_sorted_by_bid_price(
    client: AsyncClient, vendor_payload: dict
) -> None:
    vendor_a = await _seed_vendor(client, vendor_payload, "03.333.333.3-333.000", "PT Tinggi")
    vendor_b = await _seed_vendor(client, vendor_payload, "04.444.444.4-444.000", "PT Rendah")
    project = await _seed_project(client)

    await client.post(
        f"/api/v1/projects/{project['id']}/participants",
        json={"vendor_id": vendor_a["id"], "bid_price": "49000000"},
    )
    await client.post(
        f"/api/v1/projects/{project['id']}/participants",
        json={"vendor_id": vendor_b["id"], "bid_price": "45000000"},
    )

    resp = await client.get(f"/api/v1/projects/{project['id']}/participants")
    assert resp.status_code == 200
    items = resp.json()
    assert [i["vendor"]["company_name"] for i in items] == ["PT Rendah", "PT Tinggi"]


async def test_update_participant_negotiation_price(
    client: AsyncClient, vendor_payload: dict
) -> None:
    vendor = await _seed_vendor(client, vendor_payload, "05.555.555.5-555.000", "PT Nego")
    project = await _seed_project(client)
    await client.post(
        f"/api/v1/projects/{project['id']}/participants",
        json={"vendor_id": vendor["id"], "bid_price": "47000000"},
    )

    resp = await client.patch(
        f"/api/v1/projects/{project['id']}/participants/{vendor['id']}",
        json={"corrected_price": "46500000", "negotiated_price": "46000000"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert float(body["corrected_price"]) == 46_500_000
    assert float(body["negotiated_price"]) == 46_000_000


async def test_vendor_can_register_self_as_participant(
    client: AsyncClient, vendor_payload: dict
) -> None:
    reg = await client.post(
        "/api/v1/auth/register-vendor",
        json={"vendor": vendor_payload, "password": "vendorpass123"},
    )
    token = reg.json()["access_token"]
    vendor_id = reg.json()["user"]["vendor_id"]
    project = await _seed_project(client)

    resp = await client.post(
        f"/api/v1/projects/{project['id']}/participants/me",
        json={"bid_price": "47000000"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["vendor_id"] == vendor_id
    assert float(body["bid_price"]) == 47_000_000


async def test_participants_me_rejected_without_vendor_account(
    client: AsyncClient
) -> None:
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "staff@simaven.id", "full_name": "Staff RS", "password": "supersecret123"},
    )
    token = reg.json()["access_token"]
    project = await _seed_project(client)

    resp = await client.post(
        f"/api/v1/projects/{project['id']}/participants/me",
        json={"bid_price": "47000000"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403


async def test_remove_participant(client: AsyncClient, vendor_payload: dict) -> None:
    vendor = await _seed_vendor(client, vendor_payload, "06.666.666.6-666.000", "PT Mundur")
    project = await _seed_project(client)
    await client.post(
        f"/api/v1/projects/{project['id']}/participants",
        json={"vendor_id": vendor["id"], "bid_price": "47000000"},
    )

    resp = await client.delete(f"/api/v1/projects/{project['id']}/participants/{vendor['id']}")
    assert resp.status_code == 204

    resp = await client.get(f"/api/v1/projects/{project['id']}/participants")
    assert resp.json() == []
