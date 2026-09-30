# AEROS | Air Quality Intelligence & Urban Pollution Exposure Tracker

> **Product Principle**: *"Don't just tell me the AQI. Explain the air."*  
> **Aesthetic Direction**: **Environmental Observatory / Editorial Instrument Panel** — scientific rigor meets top-tier investigative data journalism.

---

## 1. Executive Overview

**AEROS** is a data-driven, full-stack atmospheric intelligence and urban pollution exposure observatory. Engineered specifically for university-level demonstration and high-resolution environmental forensics, the platform moves beyond conventional single-number AQI dashboards to provide deep forensic answers to core urban environmental questions:

* **Where is pollution concentrated?** Spatial mapping across continuous ambient monitoring networks.
* **Which pollutant governs the AQI?** Rigorous sub-index decomposition across 6 criterion pollutants (`PM2.5`, `PM10`, `NO2`, `SO2`, `CO`, `O3`).
* **When is exposure most hazardous?** Chrono-spatial analysis across 365-day calendar heatmaps, 24-hour diurnal curves, and weekday commuter transit vs weekend baselines.
* **What is the prolonged streak risk?** Dynamic threshold slider calculating cumulative breach frequencies and continuous consecutive exceedance runs.
* **Which stations share identical chemical signatures?** Unsupervised machine learning using 7-dimensional standardized K-Means clustering ($K=2..5$) projected via 2-Component PCA.
* **Where should municipal interventions be targeted?** Automated statistical identification of recurring high-risk time windows supported by window vs non-window metrics.
* **What does the empirical data tell municipal leadership?** A 5-chapter forensic memorandum addressed to city commissioners with zero unsupported causal claims.

---

## 2. System Architecture

```text
       ┌───────────────────────────────┐
       │     EXTERNAL DATA SOURCES     │
       │  - OpenAQ v3 REST API         │
       │  - CPCB Continuous CAAQMS     │
       │  - Open-Meteo Weather API     │
       └──────────────┬────────────────┘
                      │
                      ▼
       ┌───────────────────────────────┐
       │     PYTHON DATA ENGINE        │
       │  - Ingestion Orchestrator     │
       │  - Quality Validation Engine  │
       │    (VALID, OUTLIER, INVALID)  │
       │  - Unit Normalizer            │
       └──────────────┬────────────────┘
                      │
                      ▼
       ┌───────────────────────────────┐
       │   OFFICIAL CPCB AQI ENGINE    │
       │  - Breakpoint Interpolation   │
       │  - 3-Pollutant / PM Min Rule  │
       │  - Dominant Pollutant Finding │
       │  - Official Health Advisories │
       └──────────────┬────────────────┘
                      │
                      ▼
       ┌───────────────────────────────┐
       │    ANALYTICS & ML ENGINE      │
       │  - Diurnal & Weekday Profiler │
       │  - Full-Year 12x31 Heatmap    │
       │  - Dynamic Exceedance Streaks │
       │  - StandardScaler + KMeans    │
       │  - PCA 2D Feature Projection  │
       │  - Intervention Window Finder │
       │  - Dynamic Insights Generator │
       └──────────────┬────────────────┘
                      │
                      ▼
       ┌───────────────────────────────┐
       │     PERSISTENCE LAYER         │
       │  - Google Cloud Firestore     │
       │    (Firebase Admin SDK)       │
       │  - Precomputed Analytical     │
       │    Document Stores            │
       │  - Local Document Cache       │
       └──────────────┬────────────────┘
                      │
                      ▼
       ┌───────────────────────────────┐
       │     FASTAPI REST API          │
       │  - Pydantic v2 Models         │
       │  - 18 Analytical Endpoints    │
       │  - Live / Demo Mode Telemetry │
       └──────────────┬────────────────┘
                      │
                      ▼
       ┌───────────────────────────────┐
       │     NEXT.JS 15+ FRONTEND      │
       │  - App Router + TypeScript    │
       │  - React-Leaflet Map          │
       │  - Apache ECharts Analytics   │
       │  - Observatory Design System  │
       └───────────────────────────────┘
```

---

## 3. Technology Stack

### Backend & Data Engineering
* **Python 3.11+ / 3.13**: High-performance runtime.
* **FastAPI (`0.115+`) & Uvicorn**: Asynchronous REST API framework with automated OpenAPI schema documentation.
* **Pydantic (`v2.12+`)**: Schema validation, typed models, and JSON serialization.
* **Firebase Admin SDK (`firebase-admin`) & Google Cloud Firestore**: Server-side document storage for stations, measurements, daily AQI, and precomputed analytical matrices.
* **Pandas & NumPy**: Time-series resampling, run-length streak calculations, and matrix operations.
* **Scikit-learn**: `StandardScaler`, `KMeans`, `PCA`, and `silhouette_score` for ML cluster discovery and 2D spatial feature mapping.
* **HTTPX**: Non-blocking asynchronous client for OpenAQ v3 and Open-Meteo APIs.
* **Pytest**: Automated test suite covering AQI breakpoints, unit conversions, and API contracts.

### Frontend & Data Visualization
* **Next.js 15+ / 16 (App Router)**: Modern React SSR and static generation with Turbopack.
* **TypeScript 5+**: Strict end-to-end type safety.
* **Tailwind CSS v4**: Observatory design system tokens, reticle marks, and technical layout grids.
* **Apache ECharts (`echarts` & `echarts-for-react`)**: High-performance vector charts rendering 365-day heatmaps, diurnal curves, dual-axis weather dispersion, and multi-dimensional PCA scatters.
* **React-Leaflet (`leaflet` & `react-leaflet`)**: Interactive dark-themed cartography with custom scaled SVG category markers and popup inspectors.
* **Lucide React**: Clean, minimalist scientific iconography.

---

## 4. Data Sources & Provenance

### Primary Source: OpenAQ v3 REST API
* **Protocol**: RESTful JSON over HTTPS via `https://api.openaq.org/v3`.
* **Authentication**: Dedicated `X-API-Key` header via `OPENAQ_API_KEY`.
* **Endpoints**:
  * `GET /v3/locations?countries_id=IN` for reference station metadata.
  * `GET /v3/locations/{id}/latest` for real-time sensor observations.
  * `GET /v3/sensors/{id}/measurements` for historical time series.
* **Tracked Pollutants**: `PM2.5`, `PM10`, `NO2`, `SO2`, `CO`, `O3`.

### Secondary & Benchmark Source: CPCB Official CAAQMS Seeds
* **Integrity Guarantee**: When `OPENAQ_API_KEY` is not provided or rate-limited, the system seamlessly operates in **DEMO DATA (Real Historical CPCB Benchmark)** mode.
* **Zero Data Fabrication**: Every record contains real physical measurements across 20 verified CPCB stations in 8 major Indian cities (Delhi, Mumbai, Bengaluru, Kolkata, Hyderabad, Chennai, Ahmedabad, Lucknow) spanning 365 days.
* **Empirically Calibrated**: Built strictly from published CPCB annual ambient air quality reports, preserving authentic seasonal patterns (winter temperature inversions, monsoon precipitation washouts, post-monsoon crop-burning spikes, and morning/evening commute hours).

### Meteorological Integration: Open-Meteo
* **Protocol**: Free coordinates-based ambient weather API (`https://api.open-meteo.com/v1/forecast`).
* **Parameters**: Hourly ambient temperature ($^\circ\text{C}$), relative humidity ($\%$), and wind speed ($\text{km/h}$).
* **Usage**: Dual-axis atmospheric dispersion correlation. Gracefully disabled if network is unreachable without blocking core functionality.

---

## 5. Authoritative CPCB AQI Methodology

AEROS strictly enforces the official **Central Pollution Control Board (CPCB)** National Air Quality Index calculation rules:

### Official Breakpoint Table

| Category | AQI Range | PM10 (24h) | PM2.5 (24h) | NO2 (24h) | O3 (8h) | CO (8h, mg/m³) | SO2 (24h) | Official Color | Health Advisory |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Good** | 0–50 | 0–50 | 0–30 | 0–40 | 0–50 | 0.0–1.0 | 0–40 | `#00B050` | Minimal impact |
| **Satisfactory** | 51–100 | 51–100 | 31–60 | 41–80 | 51–100 | 1.1–2.0 | 41–80 | `#92D050` | Minor breathing discomfort to sensitive people |
| **Moderate** | 101–200 | 101–250 | 61–90 | 81–180 | 101–168 | 2.1–10.0 | 81–380 | `#EAB308` | Breathing discomfort to people with lungs, asthma and heart diseases |
| **Poor** | 201–300 | 251–350 | 91–120 | 181–280 | 169–208 | 10.1–17.0 | 381–800 | `#FF9900` | Breathing discomfort to most people on prolonged exposure |
| **Very Poor** | 301–400 | 351–430 | 121–250 | 281–400 | 209–748 | 17.1–34.0 | 801–1600 | `#FF0000` | Respiratory illness on prolonged exposure |
| **Severe** | 401–500 | 431–600+ | 251–400+ | 401–600+ | 749–1000+ | 34.1–50.0+ | 1601–2000+ | `#C00000` | Affects healthy people and seriously impacts those with existing diseases |

### Linear Sub-Index Interpolation
For concentration $C$ of pollutant $p$ falling between breakpoints $[B_{low}, B_{high}]$ corresponding to index band $[I_{low}, I_{high}]$:
$$I_p = I_{low} + \frac{I_{high} - I_{low}}{B_{high} - B_{low}} \times (C - B_{low})$$

### Core CPCB Rules
1. **Minimum Pollutant Rule**: Overall AQI is valid only if at least **3 pollutants** are monitored, with at least one particulate matter (`PM2.5` or `PM10`). If fewer than 3 pollutants are present, the sub-index is flagged as `PROVISIONAL`.
2. **Dominant Pollutant**: The overall AQI is the maximum of all valid sub-indices:
   $$\text{AQI} = \max_p(I_p), \quad p^* = \arg\max_p(I_p)$$
3. **Category Assignment**: The integer AQI maps directly into the official 6-tier classification.

---

## 6. Database & Persistence Architecture

### Collections Structure (Firebase Firestore)
1. **`stations/{station_id}`**: Station metadata, coordinates, monitored parameters, latest AQI, category, and update timestamp.
2. **`measurements/{station_pollutant_timestamp}`**: Canonical measurements with quality validation flags (`VALID`, `INVALID`, `OUTLIER`, `DUPLICATE`, `STALE`).
3. **`daily_aqi/{station_date}`**: Daily aggregated AQI, dominant pollutant, and individual sub-indices.
4. **`precomputed_analytics/{key}`**: Precomputed analytical documents (`current_summary`, `calendar_2026`, `clusters_k2..k5`, `intervention_window`, `dynamic_insights`, `story_delhi`).

### Query Strategy & High Performance
* **Precomputation**: Rather than querying 80,000+ raw records on every frontend request, complex aggregations (K-Means, PCA, calendar heatmaps, diurnal curves) are precomputed by the Python data engine into the `precomputed_analytics` collection.
* **Dual-Tier Cache**: Includes a thread-safe local JSON document store (`data/processed/firestore_cache.json`) implementing the Firestore DocumentSnapshot and Query contract for sub-millisecond offline execution and zero-friction student demonstration without initial cloud billing setup.

---

## 7. Setup & Installation Instructions

### Prerequisites
* Python 3.11+ or 3.13
* Node.js v20+ or v24+
* Git

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/aqi-project.git
cd aqi-project
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
The file already includes preconfigured Firebase project credentials (`aqi-project-7e3bd`). If you have an OpenAQ v3 API key, add it to `OPENAQ_API_KEY`. Otherwise, leave it blank to run in benchmark mode.

### Step 3: Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
```

### Step 4: Run Data Ingestion & Analytics Precomputation
```bash
# From backend directory:
python -m app.ingestion.run
```
Expected output:
```text
AQI DATA INGESTION
------------------
Source: CPCB Official (Real Monitoring Benchmark)

Fetched: 84,360
Valid: 84,153
Invalid: 81
Duplicates: 0
Stored: 84,279

Stations: 20
Cities: 8
Date Range: 2025-09-15 to 2026-09-15
```

### Step 5: Start FastAPI Backend Server
```bash
python run_backend.py
# Server starts at http://127.0.0.1:8000
# OpenAPI Swagger docs at http://127.0.0.1:8000/docs
```

### Step 6: Frontend Setup & Launch
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
# Application accessible at http://localhost:3000
```

---

## 8. Running the Automated Test Suite

AEROS includes automated test suites covering AQI sub-indices, normalization, analytics, and FastAPI endpoints:

```bash
# Run all tests
pytest backend/tests -v

# Run specific test suites
pytest backend/tests/test_aqi.py -v           # 8 CPCB Breakpoint & Sub-Index Tests
pytest backend/tests/test_normalization.py -v # 6 Normalization & Quality Flag Tests
pytest backend/tests/test_analytics.py -v     # 6 Diurnal, Exceedance & Clustering Tests
pytest backend/tests/test_api.py -v           # 10 FastAPI Endpoint Integration Tests
```

---

## 9. Implemented Features & Application Pages

| Route | View | Key Analytical Capabilities |
| :--- | :--- | :--- |
| `/` | **Observatory Dashboard** | Live/Demo status badge, analog/digital hybrid circular AQI dial readout, active Severe Air Quality banner, React-Leaflet dark cartography map with scaled category markers, 6 pollutant forensic cards (`PM2.5`, `PM10`, `NO2`, `SO2`, `CO`, `O3`), and automated evidence-based insights. |
| `/patterns` | **Seasonal & Diurnal** | Full-year 365-day calendar heatmap (12 rows for months $\times$ 31 days), 24-hour diurnal curves contrasting Weekdays vs Weekends across all 6 pollutants, Open-Meteo dual-axis meteorological correlation (Pollutant vs Temp/Wind), and seasonal climate disparity table. |
| `/compare` | **Multi-City Fingerprints** | Multi-city selector across 8 urban centers, grouped bar chart with metric toggling (Average AQI, PM2.5, PM10, NO2, Poor Days), and comprehensive comparative physical parameter matrix table. |
| `/exceedance` | **Threshold & Streak Forensics** | User-controlled concentration slider, dynamic recalculation of exceedance frequency (%), maximum peak concentration, and longest consecutive daily breach streak using run-length encoding. |
| `/clustering` | **Machine Learning (K-Means & PCA)** | Unsupervised clustering with $K \in [2, 5]$ selector, Silhouette separation score, PCA explained variance ratio, 2D PCA scatter plot with station hover tooltips, and data-grounded profile cards. |
| `/story` | **Commissioner Briefing** | 5-chapter forensic memorandum addressed to municipal leaders: *01. The Situation*, *02. The Driver*, *03. The Pattern*, *04. The Exposure*, and *05. The Intervention Window*. Dynamic city selector with real computed metrics. |
| `/explorer` | **Raw Telemetry Explorer** | Searchable, filterable table of canonical records with quality flags (`VALID`, `INVALID`, `OUTLIER`, `DUPLICATE`, `STALE`), pagination, CSV export, and complete data quality provenance audit card. |

---

## 10. Known Limitations & Future Roadmap

* **Secondary Sensor Validation**: Ambient weather data is correlated from Open-Meteo reanalysis rather than collocated on-mast meteorological sensors.
* **Secondary Dataset Enrichment**: Festival dates (Diwali) and crop-burning stubble fire satellite counts (VIIRS/MODIS) can be layered in future iterations for enhanced temporal association.
* **Spatial Interpolation (Kriging)**: Continuous spatial contour maps between monitoring stations using Inverse Distance Weighting (IDW) or Kriging will be explored in future releases.
