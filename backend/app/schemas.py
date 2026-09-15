from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models import (
    CaseStatus, ChannelOrigin, NotificationStatus,
    OfficerRole, RiskTier,
)


def _serialize(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, datetime):
        return value.isoformat()
    return value


class RiskFlagDetail(BaseModel):
    """Nested flag shape from Aatmman's AI engine.
    Each detected flag has a `present` boolean, `confidence` float, and `signals` list.
    """
    present: bool
    confidence: float = Field(..., ge=0, le=1)
    signals: list[str] = []


class RiskAssessmentBase(BaseModel):
    svi_score: float = Field(..., ge=0, le=100)
    risk_tier: RiskTier
    flags: Optional[dict[str, RiskFlagDetail]] = None
    explanation_text: str
    model_version: Optional[str] = None


class RiskAssessmentCreate(RiskAssessmentBase):
    case_id: int
    # Aatmman's AI engine also passes back these case-level fields in the same payload
    recommended_action: Optional[str] = None
    current_level: Optional[int] = Field(default=None, ge=0, le=3)


class RiskAssessmentOut(RiskAssessmentBase):
    model_config = ConfigDict(from_attributes=True, serialize_whatever=True)

    id: int
    case_id: int
    created_at: datetime


class CaseBase(BaseModel):
    channel_of_origin: ChannelOrigin
    district: Optional[str] = None
    state: Optional[str] = None
    incident_description: Optional[str] = None
    incident_date: Optional[datetime] = None
    language: str = "en"
    is_silent_signal: bool = False
    victim_id: Optional[int] = None
    assigned_officer_id: Optional[int] = None
    # ── New case examine fields ────────────────────────────────────────────
    person_name: Optional[str] = None
    incident_location: Optional[str] = None
    person_assaulted_date: Optional[datetime] = None
    date_of_report: Optional[datetime] = None
    exit_report: Optional[str] = None
    case_summary: Optional[str] = None


class CaseCreate(CaseBase):
    pass


class CaseUpdate(BaseModel):
    status: Optional[CaseStatus] = None
    district: Optional[str] = None
    state: Optional[str] = None
    incident_description: Optional[str] = None
    assigned_officer_id: Optional[int] = None
    svi_score: Optional[float] = None
    risk_tier: Optional[RiskTier] = None
    recommended_action: Optional[str] = None
    # ── New updatable fields ───────────────────────────────────────────────
    person_name: Optional[str] = None
    incident_location: Optional[str] = None
    person_assaulted_date: Optional[datetime] = None
    date_of_report: Optional[datetime] = None
    exit_report: Optional[str] = None
    case_summary: Optional[str] = None


class RiskAssessmentMini(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    svi_score: float
    risk_tier: RiskTier
    explanation_text: str
    created_at: datetime


class CaseOut(CaseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: CaseStatus
    created_at: datetime
    updated_at: datetime
    svi_score: Optional[float] = None
    risk_tier: Optional[RiskTier] = None
    recommended_action: Optional[str] = None
    current_level: Optional[int] = None
    is_locked: bool = False
    forwarded_to_swo: bool = False
    judiciary_directive: Optional[str] = None
    risk_assessments: list[RiskAssessmentMini] = []


class CaseDetail(CaseOut):
    risk_assessments: list[RiskAssessmentOut] = []


class SlaDeadlineOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: int
    deadline_type: str
    due_date: datetime
    met: bool
    resolved_at: Optional[datetime] = None


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor: str
    action: str
    case_id: Optional[int]
    timestamp: datetime
    details: Optional[dict[str, Any]] = None


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: int
    recipient_role: OfficerRole
    channel: str
    sent_at: Optional[datetime]
    status: NotificationStatus


# ── Evidence Schemas ──────────────────────────────────────────────────────────

class EvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: int
    uploaded_by: Optional[int] = None
    file_name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    description: Optional[str] = None
    tier_level: Optional[str] = None
    uploaded_at: datetime


# ── Handoff Schemas ───────────────────────────────────────────────────────────

class HandoffCreate(BaseModel):
    to_tier: str
    to_officer_id: Optional[int] = None
    handoff_notes: Optional[str] = None


class HandoffOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: int
    from_officer_id: Optional[int] = None
    to_officer_id: Optional[int] = None
    from_tier: Optional[str] = None
    to_tier: Optional[str] = None
    handoff_notes: Optional[str] = None
    created_at: datetime


# ── Case Lock / Judiciary Forward Schemas ─────────────────────────────────────

class CaseLockIn(BaseModel):
    notes: Optional[str] = None


class JudiciaryForwardIn(BaseModel):
    directive: str
    notes: Optional[str] = None


class CaseExamineUpdate(BaseModel):
    """PATCH payload for updating case examination fields."""
    person_name: Optional[str] = None
    incident_location: Optional[str] = None
    person_assaulted_date: Optional[datetime] = None
    date_of_report: Optional[datetime] = None
    exit_report: Optional[str] = None
    case_summary: Optional[str] = None
    incident_description: Optional[str] = None


# ── Officer Management Schemas ──────────────────────────────────────────────

class OfficerCreate(BaseModel):
    name: str
    role: OfficerRole
    district: Optional[str] = None
    state: Optional[str] = None
    badge_id: Optional[str] = None
    username: str
    password: str


class OfficerUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[OfficerRole] = None
    district: Optional[str] = None
    state: Optional[str] = None
    badge_id: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None


class OfficerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    role: OfficerRole
    district: Optional[str] = None
    state: Optional[str] = None
    badge_id: Optional[str] = None
    is_active: bool
    username: Optional[str] = None
    created_at: datetime


class OfficerLoginIn(BaseModel):
    username: str
    password: str

