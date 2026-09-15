from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path

from app.routes.cases import router as cases_router
from app.routes.risk_assessments import router as ra_router
from app.routes.websocket import router as ws_router
from app.routes.stats import router as stats_router
from app.routes.notifications import router as notifications_router
from app.routes.agent import router as agent_router
from app.routes.twilio_webhook import router as twilio_router
# ── Aditya's auth & admin panel layer ────────────────────────────────
from app.routes.auth import router as auth_router
from app.routes.admin_panel import router as admin_panel_router
from app.routes.evidence import router as evidence_router
from app.routes.handoffs import router as handoffs_router
from app.routes.officers import router as officers_router
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.database import AsyncSessionLocal, engine, Base
    import app.models  # noqa: F401 — ensure all models are registered

    # Ensure uploads directory exists
    Path("uploads/evidence").mkdir(parents=True, exist_ok=True)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield
    await engine.dispose()


app = FastAPI(
    title="NHAA Central Case API",
    description=(
        "Single shared PostgreSQL-backed API for the NHAA (14566) Helpline AI Triage System.\n\n"
        "**Channels:** Portal, Chatbot, IVRS, Mobile App\n\n"
        "Every complaint lands in the SAME central case database and goes through the SAME AI pipeline.\n"
        "This is the foundation of the project -- do not bypass these endpoints.\n\n"
        "---\n"
        "**Auth**: Use `POST /auth/login` to obtain a Bearer JWT, then click the 🔒 Authorize "
        "button above and paste the token to test protected endpoints."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ── CORS (allow Pawan's frontend dev server) ──────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Aditya's auth & admin panel routes (FIRST — JWT /api/cases must win) ─────
app.include_router(auth_router)                       # /auth/login, /auth/logout, /auth/me
app.include_router(admin_panel_router, prefix="/api") # /api/cases (JWT-scoped), /api/sla-status, etc.
app.include_router(evidence_router, prefix="/api")    # /api/cases/{id}/evidence, /api/evidence/...
app.include_router(handoffs_router, prefix="/api")    # /api/cases/{id}/handoff, /api/cases/{id}/lock, etc.
app.include_router(officers_router, prefix="/api")    # /api/officers (SysAdmin/super_admin)

# Mount static uploads directory
Path("uploads").mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Vinit's internal routes (raw — for AI module / channel ingestion only) ───
# NOTE: /api/cases here is shadowed by admin_panel's JWT version above.
# Pawan's UI must use the JWT endpoints. Aatmman uses /api/risk-assessments directly.
app.include_router(cases_router, prefix="/api")
app.include_router(ra_router, prefix="/api")
app.include_router(stats_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(agent_router, prefix="/api")
app.include_router(twilio_router)
app.include_router(ws_router)

# Register Vedika's AI Perception Layer Routers
try:
    from api.routes.perception_routes import router as perception_router
    from api.routes.analytics_routes import router as perception_analytics_router
    app.include_router(perception_router)
    app.include_router(perception_analytics_router)
except Exception as p_err:
    print(f"[NHAA App WARNING] Perception routers optional registration notice: {p_err}")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "nhaa-case-api"}


@app.get("/")
async def root():
    return {"service": "NHAA Central Case API", "docs": "/docs"}
