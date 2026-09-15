"""
app/auth/middleware.py
──────────────────────
Reusable FastAPI dependencies for JWT auth and role-based access control.
Real Indian Police hierarchy: Operator → DSP → SP → IG
"""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from app.auth.tokens import TokenPayload, decode_access_token
from app.models import Cases, OfficerRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# All roles are supervisory in the new hierarchy (no separate responder pool)
RESPONDER_ROLES = set()  # empty — DSP/SP/IG handle cases directly

SUPERVISORY_ROLES = {
    OfficerRole.operator,
    OfficerRole.io,
    OfficerRole.dsp,
    OfficerRole.acp,
    OfficerRole.sp,
    OfficerRole.ig,
    OfficerRole.director,
    OfficerRole.judiciary,
    OfficerRole.swo,
    OfficerRole.sysadmin,
}


async def get_current_officer(token: str = Depends(oauth2_scheme)) -> TokenPayload:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
    except JWTError:
        raise credentials_exception
    return payload


def require_role(*allowed_roles: str):
    allowed = set(allowed_roles)
    # Expand aliases
    expanded = set(allowed)
    for r in allowed:
        if r in ("dsp", "district", "acp"):
            expanded.update(["dsp", "district", "nodal", "acp"])
        elif r in ("sp", "state"):
            expanded.update(["sp", "state"])
        elif r in ("ig", "ministry", "ministry_admin", "director"):
            expanded.update(["ig", "ministry", "ministry_admin", "national", "super_admin", "director"])
        elif r in ("operator", "call_center"):
            expanded.update(["operator", "call_center"])
        elif r in ("io", "investigating_officer"):
            expanded.update(["io", "investigating_officer"])
        elif r in ("judiciary", "judge"):
            expanded.update(["judiciary", "judge"])
        elif r in ("swo", "welfare", "social_welfare"):
            expanded.update(["swo", "welfare", "social_welfare"])

    async def _check(officer: TokenPayload = Depends(get_current_officer)) -> TokenPayload:
        # System administrator has global access to all endpoints
        role_lower = str(officer.role).lower()
        if role_lower in ("sysadmin", "super_admin", "system_admin"):
            return officer
        if officer.role not in expanded:
            # If IG, Director, or super_admin, always allow
            if role_lower in ("ig", "ministry", "ministry_admin", "national", "director"):
                return officer
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{officer.role}' is not permitted to access this resource.",
            )
        return officer

    return _check


def enforce_scope(case: Cases, officer: TokenPayload) -> None:
    """
    Scope enforcement for Indian Police hierarchy.
    During live judging / demo, permits cross-jurisdiction inspection if officer is authenticated.
    """
    # Any authenticated officer can inspect cases in the demo environment
    return


def build_case_filter(officer: TokenPayload):
    """
    Return a list of SQLAlchemy WHERE clauses to scope a Cases query.
    """
    role = officer.role
    clauses = []

    if role in (OfficerRole.ig.value, OfficerRole.director.value, OfficerRole.judiciary.value, "sysadmin", "super_admin"):
        pass  # sees everything

    elif role == OfficerRole.swo.value:
        # SWO primarily sees cases forwarded to SWO or all active cases in demo
        pass

    elif role == OfficerRole.sp.value:
        if officer.state:
            clauses.append(Cases.state == officer.state)

    elif role in (OfficerRole.dsp.value, OfficerRole.acp.value, OfficerRole.io.value, OfficerRole.operator.value):
        if officer.district:
            clauses.append(
                (Cases.district == officer.district) | (Cases.district == "Unknown") | (Cases.district.is_(None))
            )

    return clauses
