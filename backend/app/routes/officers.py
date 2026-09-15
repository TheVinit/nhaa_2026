"""
app/routes/officers.py
───────────────────────
SysAdmin-only Officer management CRUD endpoints.

Endpoints:
    GET     /api/officers              – list all officers
    POST    /api/officers              – create officer (unique username, hashed password)
    PATCH   /api/officers/{id}         – update officer
    PATCH   /api/officers/{id}/deactivate – deactivate officer
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.hashing import hash_password, verify_password
from app.auth.middleware import get_current_officer, require_role
from app.auth.tokens import TokenPayload
from app.database import AsyncSessionLocal
from app.models import Officers, OfficerRole
from app.routes.audit import log_action
from app.schemas import OfficerCreate, OfficerOut, OfficerUpdate

router = APIRouter(prefix="/officers", tags=["officer-management"])


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


# ── GET /api/officers ──────────────────────────────────────────────

@router.get("/", response_model=list[OfficerOut])
async def list_officers(
    db: AsyncSession = Depends(get_db),
    officer: TokenPayload = Depends(require_role("sysadmin", "super_admin")),
):
    """List all officers. SysAdmin/super_admin only."""
    result = await db.execute(select(Officers).order_by(Officers.id))
    officers = result.scalars().all()
    return officers


# ── POST /api/officers ─────────────────────────────────────────────

@router.post("/", response_model=OfficerOut, status_code=status.HTTP_201_CREATED)
async def create_officer(
    payload: OfficerCreate,
    db: AsyncSession = Depends(get_db),
    officer: TokenPayload = Depends(require_role("sysadmin", "super_admin")),
):
    """Create a new officer with hashed password. SysAdmin/super_admin only.

    Username must be unique.
    """
    # Check username uniqueness
    existing = await db.execute(
        select(Officers).where(Officers.username == payload.username)
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{payload.username}' is already taken",
        )

    hashed_pw = hash_password(payload.password)
    new_officer = Officers(
        name=payload.name,
        role=payload.role,
        district=payload.district,
        state=payload.state,
        badge_id=payload.badge_id,
        username=payload.username,
        password_hash=hashed_pw,
        is_active=True,
    )
    db.add(new_officer)
    await db.commit()
    await db.refresh(new_officer)

    await log_action(
        db,
        actor=officer.sub,
        action="officer_created",
        case_id=None,
        details={
            "officer_id": new_officer.id,
            "username": new_officer.username,
            "role": new_officer.role.value,
        },
    )

    return new_officer


# ── PATCH /api/officers/{id} ───────────────────────────────────────

@router.patch("/{officer_id}", response_model=OfficerOut)
async def update_officer(
    officer_id: int,
    payload: OfficerUpdate,
    db: AsyncSession = Depends(get_db),
    officer: TokenPayload = Depends(require_role("sysadmin", "super_admin")),
):
    """Update an officer's details. SysAdmin/super_admin only."""
    result = await db.execute(select(Officers).where(Officers.id == officer_id))
    db_officer = result.scalar_one_or_none()
    if not db_officer:
        raise HTTPException(status_code=404, detail="Officer not found")

    update_data = payload.model_dump(exclude_unset=True)

    if "username" in update_data and update_data["username"] != db_officer.username:
        existing = await db.execute(
            select(Officers).where(Officers.username == update_data["username"])
        )
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Username '{update_data['username']}' is already taken",
            )

    if "password" in update_data and update_data["password"]:
        update_data["password_hash"] = hash_password(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(db_officer, field, value)

    await db.commit()
    await db.refresh(db_officer)

    await log_action(
        db,
        actor=officer.sub,
        action="officer_updated",
        case_id=None,
        details={
            "officer_id": officer_id,
            "updated_fields": list(update_data.keys()),
        },
    )

    return db_officer


# ── PATCH /api/officers/{id}/deactivate ────────────────────────────

@router.patch("/{officer_id}/deactivate", response_model=OfficerOut)
async def deactivate_officer(
    officer_id: int,
    db: AsyncSession = Depends(get_db),
    officer: TokenPayload = Depends(require_role("sysadmin", "super_admin")),
):
    """Deactivate an officer account. SysAdmin/super_admin only."""
    result = await db.execute(select(Officers).where(Officers.id == officer_id))
    db_officer = result.scalar_one_or_none()
    if not db_officer:
        raise HTTPException(status_code=404, detail="Officer not found")

    db_officer.is_active = False
    await db.commit()
    await db.refresh(db_officer)

    await log_action(
        db,
        actor=officer.sub,
        action="officer_deactivated",
        case_id=None,
        details={
            "officer_id": officer_id,
            "username": db_officer.username,
        },
    )

    return db_officer
