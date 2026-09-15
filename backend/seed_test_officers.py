"""
seed_test_officers.py — Real Indian Police Hierarchy
─────────────────────
Creates 4 test officer accounts (Operator, DSP, SP, IG) for demo/testing.

Run: cd backend && python seed_test_officers.py

Test credentials (all passwords: Test@1234):
┌──────────────────┬──────────────────────────────────────┬──────────────┬──────────┐
│ Username         │ Role                                 │ District     │ State    │
├──────────────────┼──────────────────────────────────────┼──────────────┼──────────┤
│ operator         │ Call Centre Operator (Level 0)       │ Central Delhi│ Delhi    │
│ dsp              │ Dy. Superintendent of Police (Lv 1)  │ Central Delhi│ Delhi    │
│ sp               │ Superintendent of Police (Lv 2)      │ —            │ Delhi    │
│ ig               │ Inspector General of Police (Lv 3)   │ —            │ —        │
└──────────────────┴──────────────────────────────────────┴──────────────┴──────────┘
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from app.database import AsyncSessionLocal, engine, Base
from app.models import Officers, OfficerRole
from app.auth.hashing import hash_password

DEFAULT_PASSWORD = "Test@1234"

TEST_OFFICERS = [
    {
        "name": "Priya Sharma (Operator)",
        "username": "operator",
        "role": OfficerRole.operator,
        "district": "Central Delhi",
        "state": "Delhi",
        "badge_id": "OPR-001",
    },
    {
        "name": "DSP Rajesh Kumar",
        "username": "dsp",
        "role": OfficerRole.dsp,
        "district": "Central Delhi",
        "state": "Delhi",
        "badge_id": "DSP-001",
    },
    {
        "name": "SP Anand Singh",
        "username": "sp",
        "role": OfficerRole.sp,
        "district": None,
        "state": "Delhi",
        "badge_id": "SP-001",
    },
    {
        "name": "IG Priya Mehta",
        "username": "ig",
        "role": OfficerRole.ig,
        "district": None,
        "state": None,
        "badge_id": "IG-001",
    },
    {
        "name": "System Administrator",
        "username": "sysadmin",
        "role": OfficerRole.sysadmin,
        "district": None,
        "state": None,
        "badge_id": "SYS-001",
    },
]


async def seed():
    import app.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    hashed_pw = hash_password(DEFAULT_PASSWORD)
    created = 0
    skipped = 0

    async with AsyncSessionLocal() as db:
        for data in TEST_OFFICERS:
            result = await db.execute(
                select(Officers).where(Officers.username == data["username"])
            )
            existing = result.scalar_one_or_none()
            if existing:
                print(f"  [SKIP]  {data['username']} (already exists, id={existing.id})")
                skipped += 1
                continue

            officer = Officers(
                name=data["name"],
                username=data["username"],
                password_hash=hashed_pw,
                role=data["role"],
                district=data["district"],
                state=data["state"],
                badge_id=data["badge_id"],
                is_active=True,
            )
            db.add(officer)
            await db.flush()
            print(f"  [OK]  CREATE {data['username']}  role={data['role'].value}  id={officer.id}")
            created += 1

        await db.commit()

    print(f"\nDone — {created} created, {skipped} skipped.")
    print(f"All accounts use password: {DEFAULT_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
