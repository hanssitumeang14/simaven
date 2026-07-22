from httpx import AsyncClient

REGISTER_PAYLOAD = {
    "email": "admin@simaven.id",
    "full_name": "Admin Simaven",
    "password": "supersecret123",
}


async def test_register_returns_token(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/auth/register", json=REGISTER_PAYLOAD)
    assert resp.status_code == 201

    body = resp.json()
    assert body["access_token"]
    assert body["user"]["email"] == REGISTER_PAYLOAD["email"]


async def test_duplicate_email_rejected(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/register", json=REGISTER_PAYLOAD)
    resp = await client.post("/api/v1/auth/register", json=REGISTER_PAYLOAD)
    assert resp.status_code == 409


async def test_login_with_correct_password(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/register", json=REGISTER_PAYLOAD)
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": REGISTER_PAYLOAD["email"], "password": REGISTER_PAYLOAD["password"]},
    )
    assert resp.status_code == 200
    assert resp.json()["access_token"]


async def test_login_with_wrong_password_rejected(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/register", json=REGISTER_PAYLOAD)
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": REGISTER_PAYLOAD["email"], "password": "wrong-password"},
    )
    assert resp.status_code == 401


async def test_me_requires_token(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


async def test_me_returns_current_user(client: AsyncClient) -> None:
    register_resp = await client.post("/api/v1/auth/register", json=REGISTER_PAYLOAD)
    token = register_resp.json()["access_token"]

    resp = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == REGISTER_PAYLOAD["email"]
    assert body["role"] == "rs"
    assert body["vendor_id"] is None


async def test_register_vendor_creates_vendor_and_linked_user(
    client: AsyncClient, vendor_payload: dict
) -> None:
    resp = await client.post(
        "/api/v1/auth/register-vendor",
        json={"vendor": vendor_payload, "password": "vendorpass123"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["user"]["role"] == "vendor"
    assert body["user"]["vendor_id"]
    assert body["user"]["email"] == vendor_payload["email"]

    vendor_resp = await client.get(f"/api/v1/vendors/{body['user']['vendor_id']}")
    assert vendor_resp.status_code == 200
    assert vendor_resp.json()["status"] == "pending"


async def test_register_vendor_duplicate_npwp_rejected(
    client: AsyncClient, vendor_payload: dict
) -> None:
    body = {"vendor": vendor_payload, "password": "vendorpass123"}
    await client.post("/api/v1/auth/register-vendor", json=body)
    body["vendor"] = {**vendor_payload, "email": "lain@example.co.id"}
    resp = await client.post("/api/v1/auth/register-vendor", json=body)
    assert resp.status_code == 409


async def test_vendor_me_returns_own_profile(client: AsyncClient, vendor_payload: dict) -> None:
    reg = await client.post(
        "/api/v1/auth/register-vendor",
        json={"vendor": vendor_payload, "password": "vendorpass123"},
    )
    token = reg.json()["access_token"]

    resp = await client.get("/api/v1/vendors/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["company_name"] == vendor_payload["company_name"]


async def test_vendor_me_rejected_for_rs_account(client: AsyncClient) -> None:
    reg = await client.post("/api/v1/auth/register", json=REGISTER_PAYLOAD)
    token = reg.json()["access_token"]

    resp = await client.get("/api/v1/vendors/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403
