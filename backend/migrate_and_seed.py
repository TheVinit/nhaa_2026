"""
migrate_and_seed.py
Adds missing enum values then seeds/updates all 10 officers.
Run: cd backend && python migrate_and_seed.py
"""
import asyncio, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text, select
from app.database import AsyncSessionLocal, engine, Base
from app.auth.hashing import hash_password
from app.models import Officers, OfficerRole

DEFAULT_PASSWORD = "Test@1234"

MISSING_ENUM_VALUES = ['io', 'acp', 'director', 'judiciary', 'swo', 'sysadmin', 'super_admin']

OFFICERS = [
    ('operator',  'Priya Kadam (Operator)',           OfficerRole.operator,  'Pune District', 'Maharashtra', 'OPR-001'),
    ('io',        'Inspector Vikram Shinde (IO)',      OfficerRole.io,        'Pune District', 'Maharashtra', 'IO-001'),
    ('dsp',       'DSP Rajesh Shinde',                OfficerRole.dsp,       'Pune District', 'Maharashtra', 'DSP-001'),
    ('acp',       'ACP Sanjay More',                  OfficerRole.acp,       'Pune District', 'Maharashtra', 'ACP-001'),
    ('sp',        'SP Anand Patil (IPS)',              OfficerRole.sp,        'Pune Rural',    'Maharashtra', 'SP-001'),
    ('ig',        'IG Priya Kulkarni (IPS)',           OfficerRole.ig,        None,            'Maharashtra', 'IG-001'),
    ('director',  'Director K. S. Deshmukh (IAS)',    OfficerRole.director,  None,            'Maharashtra', 'DIR-001'),
    ('judiciary', 'Hon. Special Judge M. L. Gaikwad', OfficerRole.judiciary, None,            'Maharashtra', 'JUD-001'),
    ('swo',       'SWO Anita Pawar',                  OfficerRole.swo,       'Pune District', 'Maharashtra', 'SWO-001'),
    ('sysadmin',  'System Administrator',             OfficerRole.sysadmin,  None,            None,          'SYS-001'),
]


async def migrate_and_seed():
    pw = hash_password(DEFAULT_PASSWORD)

    # Step 1: Add missing enum values via raw connection (no ORM)
    print("Step 1: Adding missing enum values...")
    async with engine.connect() as conn:
        for val in MISSING_ENUM_VALUES:
            try:
                await conn.execute(
                    text(f"ALTER TYPE officer_role ADD VALUE IF NOT EXISTS '{val}'")
                )
                print(f"  [OK] {val}")
            except Exception as e:
                print(f"  [SKIP] {val}: {e}")
        await conn.commit()
    print("  Enum migration done.\n")

    # Step 2: Upsert officers using ORM (handles asyncpg parameter types correctly)
    print("Step 2: Seeding officers...")
    import app.models  # noqa: ensure models registered
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        for uname, name, role, district, state, badge in OFFICERS:
            result = await db.execute(select(Officers).where(Officers.username == uname))
            existing = result.scalar_one_or_none()
            if existing:
                existing.password_hash = pw
                existing.is_active = True
                existing.name = name
                print(f"  [UPDATE] {uname}")
            else:
                officer = Officers(
                    name=name,
                    username=uname,
                    password_hash=pw,
                    role=role,
                    district=district,
                    state=state,
                    badge_id=badge,
                    is_active=True,
                )
                db.add(officer)
                print(f"  [CREATE] {uname}  role={role.value}")
        await db.commit()

    print(f"\nDone. All officers: password = {DEFAULT_PASSWORD}")
    print("Login at: http://localhost:5173/#/admin/login")


if __name__ == "__main__":
    asyncio.run(migrate_and_seed())
