"""
tests/test_officers.py
───────────────────────
Tests for SysAdmin officer management CRUD.

Tests:
  1. GET /api/officers – list (SysAdmin/super_admin only, 403 for others)
  2. POST /api/officers – create with hashed password & unique username
  3. POST /api/officers – duplicate username → 409
  4. PATCH /api/officers/{id} – update officer details
  5. PATCH /api/officers/{id}/deactivate – deactivate officer
  6. Non-SysAdmin roles cannot access officer endpoints (403)
  7. Password is properly hashed (bcrypt verify works)
  8. Audit log entries created for create/update/deactivate
"""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.auth.hashing import hash_password, verify_password
from app.database import AsyncSessionLocal, Base, engine
from app.main import app
from app.models import AuditLogs, Officers, OfficerRole
from app.routes.auth import create_access_token


HASHED_PW = hash_password("Test@1234")


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        sysadmin = Officers(
            id=1,
            name="System Admin",
            username="sysadmin",
            password_hash=HASHED_PW,
            role=OfficerRole.sysadmin,
            district=None,
            state=None,
            badge_id="SYS-001",
            is_active=True,
        )
        officer = Officers(
            id=2,
            name="Regular Officer",
            username="officer_01",
            password_hash=HASHED_PW,
            role=OfficerRole.operator,
            district="Central Delhi",
            state="Delhi",
            badge_id="OPR-002",
            is_active=True,
        )
        db.add_all([sysadmin, officer])
        await db.commit()

    yield

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def _login(token_client, username, password):
    res = await token_client.post(
        "/auth/login",
        data={"username": username, "password": password},
    )
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_list_officers_sysadmin():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await _login(client, "sysadmin", "Test@1234")
        res = await client.get(
            "/api/officers/",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        officers = res.json()
        assert len(officers) == 2
        usernames = {o["username"] for o in officers}
        assert "sysadmin" in usernames
        assert "officer_01" in usernames


@pytest.mark.asyncio
async def test_list_officers_forbidden_for_regular():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await _login(client, "officer_01", "Test@1234")
        res = await client.get(
            "/api/officers/",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403


@pytest.mark.asyncio
async def test_create_officer_sysadmin():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await _login(client, "sysadmin", "Test@1234")
        payload = {
            "name": "New Officer",
            "role": "dsp",
            "district": "Mumbai City",
            "state": "Maharashtra",
            "badge_id": "DSP-MUM-01",
            "username": "new_officer",
            "password": "New@Pass123",
        }
        res = await client.post(
            "/api/officers/",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 201, f"Create failed: {res.text}"
        data = res.json()
        assert data["name"] == "New Officer"
        assert data["role"] == "dsp"
        assert data["district"] == "Mumbai City"
        assert data["username"] == "new_officer"
        assert data["is_active"] is True
        assert data["id"] is not None


@pytest.mark.asyncio
async def test_create_officer_duplicate_username():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await _login(client, "sysadmin", "Test@1234")
        payload = {
            "name": "Dup Officer",
            "role": "sp",
            "username": "officer_01",
            "password": "Any@Pass123",
        }
        res = await client.post(
            "/api/officers/",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 409
        assert "already taken" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_officer_verify_password_hashed():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await _login(client, "sysadmin", "Test@1234")
        payload = {
            "name": "Hash Test Officer",
            "role": "io",
            "username": "hash_test",
            "password": "Secret@456",
        }
        res = await client.post(
            "/api/officers/",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 201
        officer_id = res.json()["id"]

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Officers).where(Officers.id == officer_id))
            db_officer = result.scalar_one_or_none()
            assert db_officer is not None
            assert db_officer.password_hash is not None
            assert verify_password("Secret@456", db_officer.password_hash) is True
            assert verify_password("wrong", db_officer.password_hash) is False


@pytest.mark.asyncio
async def test_update_officer_sysadmin():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await _login(client, "sysadmin", "Test@1234")
        update_payload = {
            "name": "Updated Officer",
            "district": "Bangalore",
            "badge_id": "OPR-UPDATED",
        }
        res = await client.patch(
            "/api/officers/2",
            json=update_payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200, f"Update failed: {res.text}"
        data = res.json()
        assert data["name"] == "Updated Officer"
        assert data["district"] == "Bangalore"
        assert data["badge_id"] == "OPR-UPDATED"


@pytest.mark.asyncio
async def test_update_officer_duplicate_username():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await _login(client, "sysadmin", "Test@1234")
        update_payload = {"username": "sysadmin"}
        res = await client.patch(
            "/api/officers/2",
            json=update_payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 409


@pytest.mark.asyncio
async def test_update_officer_not_found():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await _login(client, "sysadmin", "Test@1234")
        res = await client.patch(
            "/api/officers/9999",
            json={"name": "No One"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 404


@pytest.mark.asyncio
async def test_deactivate_officer_sysadmin():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await _login(client, "sysadmin", "Test@1234")
        res = await client.patch(
            "/api/officers/2/deactivate",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200, f"Deactivate failed: {res.text}"
        data = res.json()
        assert data["is_active"] is False

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Officers).where(Officers.id == 2))
            db_officer = result.scalar_one_or_none()
            assert db_officer.is_active is False


@pytest.mark.asyncio
async def test_deactivate_officer_not_found():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await _login(client, "sysadmin", "Test@1234")
        res = await client.patch(
            "/api/officers/9999/deactivate",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 404


@pytest.mark.asyncio
async def test_update_and_deactivate_forbidden_for_regular():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await _login(client, "officer_01", "Test@1234")

        res = await client.patch(
            "/api/officers/1",
            json={"name": "Hacked"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403

        res = await client.patch(
            "/api/officers/1/deactivate",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403


@pytest.mark.asyncio
async def test_super_admin_can_access_officers():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        sysadmin_pw = hash_password("Test@1234")
        async with AsyncSessionLocal() as db:
            sa = Officers(
                id=10,
                name="Super Admin",
                username="super_admin",
                password_hash=sysadmin_pw,
                role=OfficerRole.super_admin,
                district=None,
                state=None,
                badge_id="SA-001",
                is_active=True,
            )
            db.add(sa)
            await db.commit()

        token = create_access_token(
            officer_id=10,
            role=OfficerRole.super_admin.value,
            name="Super Admin",
        )
        res = await client.get(
            "/api/officers/",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200


@pytest.mark.asyncio
async def test_create_officer_audit_log():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await _login(client, "sysadmin", "Test@1234")
        payload = {
            "name": "Audit Test Officer",
            "role": "sp",
            "username": "audit_test",
            "password": "Audit@123",
        }
        await client.post(
            "/api/officers/",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(AuditLogs).where(AuditLogs.action == "officer_created")
            )
            entry = result.scalar_one_or_none()
            assert entry is not None
            assert "audit_test" in str(entry.details)


@pytest.mark.asyncio
async def test_update_officer_audit_log():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await _login(client, "sysadmin", "Test@1234")
        res = await client.patch(
            "/api/officers/2",
            json={"name": "Updated Name"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(AuditLogs).where(AuditLogs.action == "officer_updated")
            )
            entry = result.scalar_one_or_none()
            assert entry is not None


@pytest.mark.asyncio
async def test_deactivate_officer_audit_log():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await _login(client, "sysadmin", "Test@1234")
        res = await client.patch(
            "/api/officers/2/deactivate",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(AuditLogs).where(AuditLogs.action == "officer_deactivated")
            )
            entry = result.scalar_one_or_none()
            assert entry is not None
