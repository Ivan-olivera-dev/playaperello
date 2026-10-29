<div align="center">
  <h1>🌊 Playa del Perelló — Maritime Telemetry & Flag Predictor</h1>
  <p><strong>Real-time sea state telemetry, physical surf-hazard modeling, and crowdsourced flag corroboration for El Perelló (Valencia, Spain)</strong></p>
  <p>
    <a href="https://github.com/Ivan-olivera-dev/playaperello/actions/workflows/ci.yml"><img src="https://github.com/Ivan-olivera-dev/playaperello/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
    <a href="https://playaperello.es"><img src="https://img.shields.io/badge/live-playaperello.es-0ea5e9.svg" alt="Live Site: playaperello.es" /></a>
    <img src="https://img.shields.io/badge/Next.js-16-black.svg?logo=next.js" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/SQLite-Persistent-003B57.svg?logo=sqlite&logoColor=white" alt="SQLite" />
  </p>
</div>

---

## 📖 Overview

**Playa del Perelló** (<a href="https://playaperello.es">playaperello.es</a>) is a lightweight maritime dashboard built for swimmers and locals in El Perelló (Sueca, Valencia).

Following the coastal regeneration works on the beach, the shoreline developed a steep near-shore drop-off (*escalón de orilla*) that amplifies shorebreak hazards even under moderate wave heights. Generic weather apps fail to capture this local bathymetry. This project combines **marine swell telemetry**, **local weather station scraping**, and a **custom physical model** to estimate the beach safety flag (Green, Yellow, or Red) alongside real-time citizen corroboration.

---

## ✨ Key Engineering Highlights

- 🌐 **Dual-Source Telemetry Pipeline (ISR 60s):** Merges offshore swell metrics (`wave_height`, `wave_period`, `wave_direction`) from the **Open-Meteo Marine API** with real-time coastal wind, gust, temperature, and UV data scraped from the local **Inforatge El Perelló** ground station.
- 🧮 **Physical Shorebreak & Wind Model (`src/lib/beach-logic.js`):**
  - Weighs wave incidence against El Perelló's East-facing coastline (~75°–90°).
  - Applies an energy multiplier for long-period swell (`wavePeriod >= 6.0s–7.5s`) impacting the steep post-regeneration shore step.
  - Distinguishes between pure onshore winds (*Levante / Gregal*), afternoon thermal sea breezes (*Garbí / Xaloc*), and offshore winds (*Poniente*).
- ☀️ **Seasonal Awareness + Live Demo Mode:** Automatically detects the official bathing season (**June 1 – September 30** in `Europe/Madrid`). Outside summer, displays a minimalist seasonal countdown screen while offering a one-click **Live Telemetry Preview** for portfolio visitors and year-round sea monitoring.
- 🗳️ **Time-Windowed Citizen Corroboration (SQLite):** Persists local flag reports per shift (`07:00–15:00` morning and `16:00–21:00` afternoon) in an embedded SQLite database without external DB overhead.
- 🌍 **Bilingual & Theme-Adaptive UI:** Full support for **Spanish (ES)** and **Valencian (VA)** with light/dark mode.

---

## 🏗️ Architecture

```text
┌────────────────────────────┐   ┌────────────────────────────┐
│   Open-Meteo Marine API    │   │  Inforatge Local Station   │
│ (Swell Height/Period/Dir)  │   │ (Wind, Gusts, Temp, UV)    │
└─────────────┬──────────────┘   └─────────────┬──────────────┘
              └──────────────┬─────────────────┘
                             ▼ (Next.js Server Component · ISR 60s)
              ┌──────────────────────────────┐
              │     Physical Flag Model      │
              │    src/lib/beach-logic.js    │
              └──────────────┬───────────────┘
                             ▼
              ┌──────────────────────────────┐
              │   DashboardClient (ES / VA)  │◄───► /api/votes (SQLite)
              └──────────────────────────────┘
```

---

## 🚀 Getting Started

### 1. Clone and install dependencies
```bash
git clone https://github.com/Ivan-olivera-dev/playaperello.git
cd playaperello
npm ci
```

### 2. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run unit tests
```bash
npm test
```

---

## 🐳 Docker & Self-Hosted Deployment (Coolify / VPS)

The repository includes a multi-stage `Dockerfile` using Next.js `standalone` output and a `docker-compose.yml` with persistent volume mapping for SQLite (`/app/data`):

```bash
docker compose up -d --build
```

---

## 📝 License

Created by [Iván Olivera González](https://ivanolivera.dev).
