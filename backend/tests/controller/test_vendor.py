import pytest
from httpx import AsyncClient


async def test_create_vendor(client: AsyncClient, vendor_payload: dict) -> None:
    resp = await client.post("/api/v1/vendors", json=vendor_payload)
    assert resp.status_code == 201

    body = resp.json()
    assert body["npwp"] == vendor_payload["npwp"]
    assert body["status"] == "pending"
    assert body["verification_step"] == 0


async def test_duplicate_npwp_rejected(client: AsyncClient, vendor_payload: dict) -> None:
    await client.post("/api/v1/vendors", json=vendor_payload)
    resp = await client.post("/api/v1/vendors", json=vendor_payload)
    assert resp.status_code == 409
    assert resp.json()["code"] == "conflict"


async def test_cannot_mark_verified_before_step_eight(
    client: AsyncClient, vendor_payload: dict
) -> None:
    created = (await client.post("/api/v1/vendors", json=vendor_payload)).json()
    resp = await client.post(
        f"/api/v1/vendors/{created['id']}/verification",
        json={"verification_step": 3, "status": "verified"},
    )
    assert resp.status_code == 409


@pytest.mark.parametrize("step", [1, 4, 8])
async def test_verification_advances(client: AsyncClient, vendor_payload: dict, step: int) -> None:
    created = (await client.post("/api/v1/vendors", json=vendor_payload)).json()
    resp = await client.post(
        f"/api/v1/vendors/{created['id']}/verification",
        json={"verification_step": step, "status": "need-verification"},
    )
    assert resp.status_code == 200
    assert resp.json()["verification_step"] == step
