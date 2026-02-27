# SmartHealthAI

A cross-system AI health companion built with SMART on FHIR. Connects to multiple FHIR-enabled health systems, aggregates a patient's complete health picture, and uses AI to translate medical data into plain-language insights.

## What It Does

- **Aggregates** health records from multiple providers (Epic + synthetic Community MC)
- **Interprets** data with a tiered AI engine — rule-based alerts (free) + LLM-powered narratives (cached)
- **Acts** on findings — drug interaction alerts, care gap detection, pre-visit report generation

## Quick Start

### Prerequisites

- Node.js 18+
- An OpenAI API key (optional — app works without it using rule-based analysis only)

### Setup

```bash
# Clone
git clone https://github.com/pcmedsinge/FHIRMedblock-SmartHealthAI.git
cd FHIRMedblock-SmartHealthAI

# Install dependencies
npm install

# Configure environment (optional)
cp .env.example .env.local
# Edit .env.local and add your OpenAI API key:
#   VITE_AI_API_KEY=sk-...

# Start dev server
npm run dev
```

The app runs at **http://localhost:3000**.

### Running a Demo

1. Open http://localhost:3000
2. Click **Connect to Epic** → authenticates via OAuth2 PKCE with Epic's sandbox
3. Select a test patient (e.g., **Camila Lopez**)
4. You're in! Explore the Dashboard, Medications, Labs, and Pre-Visit pages

> **Note:** Epic's sandbox uses test data. The synthetic "Community Medical Center" source is bundled in the app to demonstrate multi-system merging.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_AI_API_KEY` | No | — | OpenAI API key for Tier 2/3 AI features |
| `VITE_FHIR_CLIENT_ID` | No | Epic sandbox ID | SMART on FHIR client ID |
| `VITE_FHIR_ISS` | No | Epic sandbox URL | FHIR server base URL |
| `VITE_FHIR_REDIRECT_URI` | No | `http://localhost:3000` | OAuth redirect URI |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    SmartHealthAI                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐    ┌────────────────────────┐    │
│  │ Epic FHIR    │    │ Synthetic Source        │    │
│  │ (Live OAuth) │    │ (Community MC Bundles)  │    │
│  └──────┬───────┘    └──────────┬─────────────┘    │
│         │                       │                   │
│         ▼                       ▼                   │
│  ┌──────────────────────────────────────────────┐  │
│  │          Multi-Source Merge Engine            │  │
│  │   (Normalize → Dedup → Tag → Conflicts)      │  │
│  └──────────────────┬───────────────────────────┘  │
│                     │                               │
│         ┌───────────┼───────────┐                   │
│         ▼           ▼           ▼                   │
│  ┌───────────┐ ┌─────────┐ ┌─────────────┐        │
│  │ Unified   │ │ Conflict│ │ Source       │        │
│  │ Data      │ │ Alerts  │ │ Metadata    │        │
│  └─────┬─────┘ └────┬────┘ └──────┬──────┘        │
│        │             │             │                │
│        ▼             ▼             ▼                │
│  ┌──────────────────────────────────────────────┐  │
│  │        Tiered AI Analysis Engine              │  │
│  │  Tier 1: Rules (free) │ Tier 2: Cached LLM  │  │
│  │  Tier 3: On-Demand LLM                       │  │
│  └──────────────────┬───────────────────────────┘  │
│                     │                               │
│                     ▼                               │
│  ┌──────────────────────────────────────────────┐  │
│  │              React UI Layer (4 Views)         │  │
│  │  Dashboard │ Medications │ Labs & Trends     │  │
│  │  Pre-Visit Report │ "Ask AI" on any item     │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript 5.9 + Vite 7 |
| Styling | Tailwind CSS v4 |
| Routing | react-router-dom v7 |
| Charts | Recharts v3 |
| FHIR | fhirclient v2.6 (SMART on FHIR) |
| AI | OpenAI API (gpt-4o-mini + gpt-4o) |
| PDF | jsPDF (dynamic import) |
| Auth | OAuth2 PKCE (Epic sandbox) |

## AI Tiers

| Tier | Trigger | Cost | Examples |
|------|---------|------|----------|
| **Tier 1** | Every page load | Free | Drug interactions, lab flags, care gaps, vital correlations |
| **Tier 2** | First load, cached 7 days | ~$0.02 | Health snapshot, lab trend narrative, medication summary |
| **Tier 3** | User clicks "Ask AI" | ~$0.01/click | Explain any lab/med/condition, generate doctor questions |

**Cost:** ~$0.05 first demo, ~$0.00 on repeat visits (localStorage cache).

## Project Structure

```
src/
├── ai/              # AI engine (tiered analysis, prompts, guardrails)
├── components/      # Reusable UI (layout, badges, skeletons, error boundary)
├── config/          # SMART config, design system tokens
├── context/         # React contexts (FHIR client, toast notifications)
├── hooks/           # Data hooks (unified data, AI analysis, patient)
├── pages/           # 4 main views + auth pages
├── sources/         # Data sources (Epic fetch, synthetic bundles)
├── types/           # TypeScript types (merged records, patient)
└── utils/           # Error handling, patient parsing, token management
```

## Key Design Decisions

1. **Think, don't list** — AI interprets data, doesn't just display it
2. **4 views, not 10** — Dashboard, Medications, Labs & Trends, Pre-Visit Report
3. **Vitals = AI fuel** — Cross-referenced with meds/conditions for correlation insights
4. **Tiered AI cost control** — Rule-based → Cached LLM → On-demand LLM
5. **Source tagging** — Every record carries provenance metadata
6. **Guardrails** — Every AI insight has a disclaimer, source citation, and provider routing

## Working Without AI

The app is fully functional without an OpenAI API key:
- All rule-based alerts (Tier 1) work — drug interactions, lab flags, care gaps
- A banner indicates "AI insights unavailable — showing rule-based analysis only"
- Tier 2/3 features (narratives, explanations) are gracefully hidden

## Known Limitations

- **Sandbox data only** — Epic sandbox returns test patients, not real data
- **Single Epic connection** — Connects to one FHIR server at a time
- **Synthetic second source** — Community MC data is bundled, not fetched from a real server
- **No persistent storage** — All data is session-scoped (cleared on disconnect)
- **Browser-only** — No backend server; API key is in the browser (not suitable for production)

## License

This project is for educational and demonstration purposes.
