# 🇮🇳 NHAA 14566 — AI-Powered Stress & Trauma Assessment Portal
### Problem Statement 14566: AI-Based Real-Time Stress and Trauma Assessment Module for Victims/Complainants Accessing NHAA (14566) and Integrated Portal
**Ministry of Social Justice & Empowerment (DOSJE) — SIH 2026**

---

## 🌟 Executive Summary
An end-to-end mission-critical digital ecosystem replicating the **Department of Social Justice & Empowerment (DOSJE)** citizen portal and elevating the **National Helpline Against Atrocities (NHAA - 14566)** with an **AI-driven Real-Time Stress & Trauma Assessment Engine**.

The system replaces legacy, flat chronological complaint lists with dynamic, clinical AI triage:
- Detects **acoustic voice tremors, pitch variability, hesitation markers, and silent distress signals**.
- Computes an objective **Stress & Vulnerability Index (SVI)** on a scale of 0 to 100.
- Triggers instant **multi-tier police emergency escalation** (Rule 7 PoA Act compliance) and **inter-agency victim compensation workflows (SWO/DBT)**.

---

## 🏛️ Core Features

### 1. Citizen & Victim Ingestion Layer (`/nhaa`)
- **Toll-Free 24x7 Helpline 14566**: Integration for PCR Act 1955 & SC/ST (PoA) Act 1989.
- **Multimodal Ingestion**: Supports Web Portal, IVRS Phone Call (Twilio), and WhatsApp.
- **Silent Distress Signal Detection**: Enables victims in immediate danger to trigger silent alerts without speaking.
- **Multilingual Support**: Real-time localized interfaces (English, Hindi, Marathi).

### 2. AI Real-Time Stress & Trauma Assessment Module
- **Acoustic & Linguistic Diagnostics**: 
  - Voice tremor & pitch analysis (Trauma detection).
  - Pauses, cadence, and whisper detection (Fear & panic detection).
  - Coercion, threats, and armed extortion markers (Intimidation detection).
- **Explainable SVI Score (0 - 100)** with 4 Clinical Risk Tiers:
  - 🔴 **Critical** (SVI ≥ 85) — Immediate emergency police dispatch.
  - 🟠 **High** (SVI 65–84) — Priority legal aid & district review.
  - 🟡 **Moderate** (SVI 40–64) — Standard inquiry & officer assignment.
  - 🟢 **Low** (SVI < 40) — Information / advisory.
- **PoA Act Statutory Mapping**: Automatically recommends relevant legal sections under SC/ST (PoA) Act & Bharatiya Nyaya Sanhita (BNS).

### 3. Multi-Tier Administrative Command Hierarchy
- **Operator Command Center (`/admin/operator`)**: Real-time triage inbox sorted dynamically by SVI score.
- **Investigating Officer (`/admin/io`)**: Case diary, spot inspection reports, and evidence locker.
- **District DSP (`/admin/dsp` / `/admin/district`)**: Fast-track FIR generation, Rule 7 60-day investigation timer.
- **ACP / SP (`/admin/acp` / `/admin/sp`)**: Inter-district supervisory controls and resource allocation.
- **State & Ministry (`/admin/state` / `/admin/ministry`)**: Macro analytics, district comparison, and heatmaps.
- **Social Welfare Officer (`/admin/swo`)**: Statutory victim relief and DBT compensation tracking.
- **Special Judiciary (`/admin/judiciary`)**: Special Court fast-track trial oversight.

---

## 🏗️ Cloud & Deployment Architecture

```
[ Citizen Ingestion ] ──────> [ Frontend on Vercel ]
(Web / IVRS / WhatsApp)       (React 19 + Vite + HashRouter)
                                      │
                                      ▼ HTTPS / WSS
[ Backend on Render ] ──────> [ PostgreSQL on Supabase ]
(FastAPI + JWT Auth + Async)   (9 Relational Tables + Alembic)
        │
        ▼ AI Pipeline
[ Groq Cloud / OpenRouter ] (Llama-3-70B / Whisper / NER / Trauma Analysis)
```

- **Frontend:** Hosted on **Vercel** (with GitHub Pages fallback).
- **Backend API:** Hosted on **Render** (FastAPI with Uvicorn).
- **Database:** Managed **PostgreSQL on Supabase** with Alembic migrations.
- **Real-Time Push:** WebSockets for live zero-delay case updates across officer dashboards.

---

## 🚀 Deployment & CI/CD Setup

### Frontend Deployment (Vercel)
1. Import repository into **Vercel**.
2. **Framework Preset:** `Vite`.
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Environment Variable:**
   ```env
   VITE_API_URL=https://<your-backend-app>.onrender.com
   ```
   *(Note: No trailing slash)*

### Backend Deployment (Render)
1. Create a **Web Service** on **Render** connected to this repository (`backend/` directory as Root).
2. **Environment:** `Python 3`
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. **Environment Variables:**
   ```env
   DATABASE_URL=postgresql+asyncpg://<user>:<password>@<supabase-host>:5432/<database>
   SECRET_KEY=<your-jwt-secret>
   GROQ_API_KEY=<your-groq-api-key>
   OPENROUTER_API_KEY=<your-openrouter-api-key>
   ```

---

## 🔑 Demo & Testing Credentials

The application supports both live database authentication and offline fallback:

| Role | Username | Default Password | Jurisdictional Scope |
|:---|:---|:---|:---|
| **Operator** | `operator` | `Test@1234` | Pune District / NHAA Central |
| **Investigating Officer** | `io` | `Test@1234` | Chatuhshrungi Police Station |
| **DSP (District Police)** | `dsp` | `Test@1234` | Pune District Rural/City |
| **SP (Superintendent)** | `sp` | `Test@1234` | Pune Rural / Maharashtra |
| **IG (Inspector General)** | `ig` | `Test@1234` | Maharashtra State |
| **Social Welfare Officer** | `swo` | `Test@1234` | Pune Social Welfare Dept |
| **Special Court Judge** | `judiciary` | `Test@1234` | District & Sessions Court |
| **System Admin** | `sysadmin` | `Admin@1234` | System Configuration |

*(Alternate accepted passwords for testing: `demo123`)*

---

## 📹 Presentation & Video Recording
For the official video presentation guidelines and word-for-word screen narration:
👉 **[See DEMO_VIDEO_SCRIPT.md](./DEMO_VIDEO_SCRIPT.md)**

---

## 🧪 Local Development

### 1. Frontend
```bash
npm install
npm run dev
```
Runs at `http://localhost:5173/`

### 2. Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API Swagger: `http://localhost:8000/docs`

---

## ⚖️ Statutory Compliance & Acts
- **Protection of Civil Rights (PCR) Act, 1955**
- **Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act, 1989 & Rules, 1995**
- **PoA Amendment Act, 2015 & Amendment Rules, 2016**
- **Bharatiya Nyaya Sanhita (BNS), 2023**

---
*Built with dedication for Smart India Hackathon (SIH 2026).*
