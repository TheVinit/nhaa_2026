# 🇮🇳 NHAA 14566 — Complete Project Explainer & PPT Blueprint
### Problem Statement: AI-Based Real-Time Stress and Trauma Assessment Module for Victims/Complainants Accessing NHAA (14566) and Integrated Portal
**Ministry of Social Justice & Empowerment (DOSJE) — Smart India Hackathon (SIH 2026)**

---

## 📌 Executive Summary (Slide 1: Project Overview)
The **National Helpline Against Atrocities (NHAA - 14566)** project by the Department of Social Justice & Empowerment (DOSJE) transforms conventional grievance reporting into an **intelligent, real-time clinical triage & multi-tier statutory enforcement platform**.

### Core Value Proposition:
1. **From Chronological Queue to AI-Driven Priority Triage**:
   - Legacy systems list complaints by submission time (FIFO), causing critical emergencies (violence, life threat, caste atrocities) to get buried behind minor queries.
   - Our system calculates an objective **Stress & Vulnerability Index (SVI: 0 to 100)** in real-time using acoustic voice biomarkers and semantic trauma NLP.
2. **End-to-End Multi-Tier Law Enforcement & Welfare Pipeline**:
   - Directly connects citizens/victims, 14566 call dispatchers, field police (IO/DSP/SP), Apex Directors, Special Judiciary, and Social Welfare Officers (SWO).
3. **Statutory & Legal Enforcement**:
   - Full compliance with **SC/ST (Prevention of Atrocities) Act 1989 & Rules 1995**, **PoA Amendment Rules 2016 (Rule 7 60-day investigation timer & Rule 12(4) DBT relief disbursal)**, and **Bharatiya Nyaya Sanhita (BNS 2023)**.
4. **Tamper-Proof Digital Evidence**:
   - SHA-256 cryptographic hashing and digital locks for pre-judiciary evidence freezing.

---

## 👥 Total Login Roles & Hierarchy Count (For Flowchart & Slides)

| Hierarchy Level | Role Name | System Username | Route / Screen | Key Responsibility & Scope |
|:---|:---|:---|:---|:---|
| **Level 0** | **Operator / Dispatcher** | `operator` | `/admin/operator` | Real-time intake, acoustic voice triage, silent signal detection, PCR dispatch |
| **Level 0.5** | **IO (Investigating Officer)** | `io` | `/admin/io` | PS Bhosari / Station level, spot panchnama, evidence locker, witness video statements |
| **Level 1** | **DSP / ACP (Sub-Divisional Officer)** | `dsp` / `acp` | `/admin/dsp` / `/admin/acp` / `/admin/district` | Rule 7 60-day statutory timer tracking, FIR fast-tracking, Section 4 compliance |
| **Level 2** | **SP (Superintendent of Police)** | `sp` | `/admin/sp` / `/admin/state` | District oversight (Pune Rural), pre-judiciary case lock & SHA-256 evidence seal |
| **Level 3** | **IG (Inspector General of Police)** | `ig` | `/admin/ig` / `/admin/ministry` | State-level command (Maharashtra), atrocity hotspot heatmaps & inter-district oversight |
| **Level 3+** | **Director / Apex Command (IAS/IPS)** | `director` | `/admin/director` | Apex policy review, monthly KPI audits, multi-agency statutory escalations |
| **Level 4** | **Special Judiciary (SC/ST Court Judge)** | `judiciary` | `/admin/judiciary` | Shivajinagar Pune Sessions Court, sealed evidence review, binding SWO relief orders |
| **Level 5** | **SWO (Social Welfare Officer)** | `swo` | `/admin/swo` | 3-Stage DBT compensation disbursal (Rule 12(4)), rehabilitation & scheme linkage |
| **Super Tier** | **System Administrator (SysAdmin)** | `sysadmin` | `/admin/sysadmin` | Full-tier cross-desk telemetry, live alert audit logs, automated email system reports |

> **🔢 Exact Number Count for Flowchart**:
> - **Total Administrative & Law Enforcement Roles**: **9 Distinct Roles** (spanning **10 Operational Desks**).
> - **Total User Login Types in System**: **9 Roles + 1 Citizen/Victim Ingestion Interface = 10 Portals**.
> - **Default Officer Credentials**: Password: `Test@1234` or `demo123`
> - **SysAdmin Credentials**: Username: `sysadmin` | Password: `Admin@1234` (or navigate with `?admin=1` in URL).

---

## 🛡️ Yes, System Admin Portal is Fully Built! (`/admin/sysadmin`)

### SysAdmin Portal Features & Capabilities:
1. **All-Desk Live Monitoring Grid**:
   - Real-time status cards for Operator, IO, DSP, SP, IG, Director, Judiciary, and SWO desks.
   - Shows **Total Cases**, **Active Now**, and **Active Emergency Alerts** per desk.
2. **Tamper-Proof Audit Logging Engine**:
   - Real-time chronologically sequenced action logs categorized into `CRITICAL`, `WARN`, `INFO`, and `SUCCESS`.
   - Tracks case escalations, SHA-256 locks, DBT transfers, panchnama uploads, and silent distress signals.
3. **Automated Authority Reporting (Email System Report)**:
   - One-click export modal that generates structured telemetry reports formatted for state/ministry monitoring emails.
4. **Security & Role-Based Access Isolation**:
   - Protected by `RequireRole` guard and separated with dedicated `Admin@1234` administrative key.

---

## 🧠 Core System Architecture & AI Pipeline (Slide 2–4: Architecture)

```
[ Citizen Ingestion ] (Web Portal / IVRS Toll-Free 14566 / WhatsApp / Silent Signal)
         │
         ▼
[ AI Perception & Triage Engine ]
 ├── 1. Acoustic Tremor & Pitch Analyzer (Voice Tremor, Cadence, Whisper Detection)
 ├── 2. Multilingual Whisper STT (Hindi, Marathi, English, Regional Dialects)
 ├── 3. LLM Clinical Trauma & Threat Extraction (Llama-3-70B via Groq/OpenRouter)
 ├── 4. SVI Calculator (0-100 Score with 4 Tiers: Critical, High, Moderate, Low)
 └── 5. Statutory Act Mapper (SC/ST PoA Act 1989 & BNS 2023 Legal Sections)
         │
         ▼
[ Real-Time Dispatch & WebSocket Broker ]
 ├── Level 0   : Operator (Instant Triage & PCR Dispatch)
 ├── Level 0.5 : IO Police (Spot Panchnama & Evidence Collection)
 ├── Level 1   : DSP/ACP (FIR Fast-Track & 60-Day Investigation Timer)
 ├── Level 2   : SP (Superintendent Pre-Trial Lock & SHA-256 Seal)
 ├── Level 3   : Director & IG (Atrocity Heatmaps & State Analytics)
 ├── Level 4   : Special Judiciary (Sealed Evidence & Court Directives)
 └── Level 5   : Social Welfare Officer (3-Stage DBT Relief Disbursal)
```

---

## 📊 Presentation (PPT) Slide-by-Slide Content Guide

### Slide 1: Title & Problem Context
- **Title**: NHAA 14566 — AI-Powered Stress & Trauma Assessment Platform
- **Ministry**: Ministry of Social Justice & Empowerment (DOSJE)
- **Problem Statement ID**: 14566
- **Problem**: Victims of atrocities under fear/trauma cannot express themselves clearly; helplines treat all calls equally, leading to fatal response delays.

### Slide 2: The Innovation — Dual-Engine AI Assessment
- **Engine 1: Acoustic Emotion & Biomarker Processing**
  - Analyzes audio pitch variance, micro-tremors, breathless hesitation, and background acoustic anomalies.
  - Detects silent distress signals (victim is in danger and cannot speak).
- **Engine 2: Clinical Trauma & Legal NLP**
  - Detects physical violence threats, social boycott, land grabbing, humiliation.
  - Automatically recommends SC/ST (PoA) Act Sections (e.g., Sec 3(1)(r), 3(1)(s), 3(2)(v)) and BNS sections.
- **Output**: **SVI (Stress & Vulnerability Index: 0–100)**.

### Slide 3: 4-Tier Dynamic Triage Protocol
- 🔴 **Critical (SVI ≥ 85)**: Immediate auto-dispatch to Emergency PCR & DSP within < 2 minutes.
- 🟠 **High (SVI 65–84)**: Priority investigation assignment & legal aid notification within 12 hours.
- 🟡 **Moderate (SVI 40–64)**: Standard verification & case officer allocation within 24 hours.
- 🟢 **Low (SVI < 40)**: Advisory, query resolution, and non-emergency support.

### Slide 4: Multi-Tier Hierarchy Flowchart (Key Slide)
- Citizen Ingestion (Web/Call) ➔ Operator (L0) ➔ IO (L0.5) ➔ DSP (L1) ➔ SP (L2) ➔ IG/Director (L3) ➔ Judiciary (L4) ➔ SWO (L5).
- Cross-cutting: **System Admin Console** monitoring health, security audits, and desk uptime.

### Slide 5: Statutory Compliance & Legal Integrity
- **Rule 7 Compliance**: Live 60-day investigation countdown clock on DSP/IO dashboards to prevent case delays.
- **Rule 12(4) DBT Relief Workflow**: 3-stage victim financial compensation tracker (FIR Stage 25%, Chargesheet Stage 50%, Conviction Stage 25%).
- **Digital Chain of Custody**: SHA-256 evidence hashing prevents tampering before presenting in Special Court.

### Slide 6: Technology Stack & Production Readiness
- **Frontend**: React 19, Vite, Tailwind/Vanilla CSS, Lucide Icons, Bilingual UI (EN/HI/MR).
- **Backend API**: FastAPI (Python 3), AsyncPG, WebSockets, JWT Authentication.
- **Database**: PostgreSQL on Supabase with 9 relational tables & Alembic migrations.
- **AI/ML Layer**: Groq Cloud (Llama 3 70B), Whisper STT, PyTorch/Librosa Acoustic Feature Extraction.
- **Deployment**: Vercel (Frontend) + Render (Backend API).

---

## 🚀 Key Differentiators for Judges (Why This Project Wins)
1. **Clinical & Acoustic Depth**: Not just a text sentiment classifier; uses real voice acoustic physics (pitch jitter, shimmer, silence detection).
2. **Complete Government Ecosystem**: Faithful replica of DOSJE official portal with associated organisations (NCSC, NCSK, NCBC, NSFDC, DAF, SAMBAL).
3. **True Inter-Departmental Linkage**: Connects Police Department (Home Affairs) with Social Welfare Department (DOSJE) and Judiciary in one synchronized workflow.
4. **Production-Ready & Highly Resilient**: Works online with live FastAPI/PostgreSQL database and gracefully falls back to instant offline mock mode if servers are disconnected.
