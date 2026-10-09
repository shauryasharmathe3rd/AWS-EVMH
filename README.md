# Tript-Dhara: Municipal Heat & Water Resilience Platform
**AWS Environmental Hacks (Bharat Builds Tour) — Track 02: Heat and Water**

Tript-Dhara is an open, real-data municipal decision platform that solves two critical problems during heatwaves in Indian cities:
1. **Heat & Water Vulnerability Mapping:** Visualizes real-time heatwave severity, municipal ward boundaries, and critical infrastructure (hospitals, schools, care homes, water towers) using open telemetry.
2. **Dynamic Leak Prioritization:** Decides *which water leak to fix first* using a transparent, multi-factor priority algorithm rather than legacy complaint order.

---

## 🏗️ AWS Open-Source Tool Integration

In accordance with hackathon requirements, Tript-Dhara integrates the official **AWS Open-Source Strands Agents SDK**:
- **Tool:** `strands-agents` (AWS Open Source Multi-Agent Framework)
- **Implementation File:** [`backend/app/strands_service.py`](backend/app/strands_service.py)
- **Role:** Transforms priority-ranked leak data, population vulnerabilities, and regional heatwave risk into an actionable **Operator Dispatch Briefing** in English and Hindi for water utility field crews.
- **Resilience:** Includes an automated, zero-downtime template fallback when offline or when model API keys are not supplied.

---

## 📊 Transparent Data Provenance

Every single metric in Tript-Dhara carries one of four provenance labels:
- **REAL:** Open-Meteo Weather Forecast API, Open-Meteo Flood/GloFAS API, OpenStreetMap (via Overpass API), Anonymous Citizen Reports.
- **DERIVED:** IMD-aligned Heat Risk Scores, Ward Vulnerability Index, Priority Scoring Formulas, Before/After Water Savings.
- **BENCHMARK:** BattLeDIM research dataset references.
- **SIMULATED:** Fixed-seed (Seed 42) repeatable baseline scenarios used *only* where no real citizen reports exist. Real citizen reports immediately outrank simulated leaks.

---

## 🎨 UI Design System & Accessibility

- **Color Palette (Strict 4 Colors):** Cream (`#F5ECDC`), Latte (`#D9C3A0`), Mocha (`#8B5E3C`), Espresso (`#2E1F14`).
- **Typography:** Classic Serif ("Times New Roman", Times, serif) across all UI elements.
- **Accessibility:** 100% compliant with WCAG AA (>= 4.5:1 contrast ratio). Verified by `frontend/scripts/check-contrast.js`.
- **Multilingual:** Instant English / Hindi toggle for all operational views.

---

## 🐳 Architecture & Microservices

Orchestrated with **Docker Compose**:
1. **Gateway (`gateway/`):** Nginx edge reverse proxy with rate limiting on public reports.
2. **Frontend (`frontend/`):** Multi-stage React + Vite + Leaflet build.
3. **Backend (`backend/`):** FastAPI + GeoAlchemy2 + Pydantic (Mobile-Ready API with RFC 7807 problem+json, ETag revalidation, and Idempotency keys).
4. **Worker (`worker/`):** GeoPandas, OSMnx, Scikit-Learn (Isolation Forest leak anomaly detection) & live Open-Meteo ingestion.
5. **Database (`db/`):** PostGIS PostgreSQL 16 spatial database with indexed geometries.

---

## 🚀 Quickstart

### 1. Configure Environment
```bash
cp .env.example .env
```

### 2. Start Application Stack
```bash
docker compose up -d --build
```
Access the application at **`http://localhost:8080`**.

### 3. Reset Demo State (For Jury Evaluation)
```bash
make reset-demo
# or curl -X POST http://localhost:8080/api/v1/demo/reset
```

### 4. Run Verification Suite
```bash
# Verify backend unit tests & hand-calculated priority formulas:
docker compose exec backend pytest -v

# Verify UI color contrast:
node frontend/scripts/check-contrast.js
```
