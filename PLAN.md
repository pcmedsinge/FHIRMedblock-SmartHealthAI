# SmartHealthAI — Implementation Plan

## Vision
A cross-system AI health companion that connects to multiple FHIR-enabled health systems, aggregates the patient's complete health picture, and uses AI to translate medical data into plain-language insights, detect care gaps, flag medication risks across prescribers, and prepare patients for doctor visits.

## Goals
1. **Think, not just read** — Demonstrate that a SMART on FHIR app should interpret and reason about health data, not merely display it
2. **AI-augmented insight** — Show how AI can carry forward the "thinking" concept — turning raw FHIR resources into actionable, patient-friendly intelligence
3. **Deep personal understanding** — Build this to deeply understand the concepts, architecture, and purpose behind SMART on FHIR and healthcare AI
4. **Beyond MyChart demo** — Create a compelling demo for peers that clearly shows capabilities no patient portal offers today

> **Operating constraint:** The app will be run many times for demos and learning. AI features must be cost-optimized so repeated runs stay near-zero cost.

## Three Pillars
1. **Aggregate** — Connect multiple FHIR servers, build one unified record
2. **Interpret** — AI translates, trends, correlates, and flags
3. **Act** — Generate pre-visit summaries, care gap reminders, shareable reports

## Domain Strategy — "Think, Don't List"

Not every FHIR domain deserves its own page. Domains are categorized as **Views** (user-facing pages) or **AI Fuel** (fetched and parsed, but consumed by the AI engine — never shown as standalone lists).

| Domain | Role | Why |
|--------|------|-----|
| **Medications** | **View** | Cross-system drug interactions is THE demo story |
| **Lab Results** | **View** (merged with vitals) | AI trend narrative is the most visually compelling feature |
| **Vitals** | **AI Fuel** (merged into Labs & Trends) | BP + meds → "Is your medication working?", Weight + meds → "Known side effect", HR + cardiac meds → "Dose effectiveness". Vitals drive AI correlation insights, not standalone charts. |
| **Conditions** | **AI Fuel** | Powers care gap detection ("You have diabetes but no A1c in 8 months") |
| **Allergies** | **AI Fuel** | Powers conflict alerts ("Epic says allergy to Penicillin, Community MC prescribed Amoxicillin") |
| **Immunizations** | **AI Fuel** | Powers care gap alerts ("You're 52, no Shingrix on record") |
| **Encounters** | **AI Fuel** | Timeline context within AI insights ("prescribed after ER visit on Jan 15") |
| ~~Insurance~~ | **Dropped** | Was synthetic in old app, doesn't serve the "think" story |
| ~~Claims/EOB~~ | **Dropped** | Different product category, cost transparency ≠ health intelligence |
| ~~Documents~~ | **Dropped** | Read-only unstructured text, pure MyChart pattern |

### How Vitals Become "Thinking" Data

| Vital | Raw Display (MyChart) | AI Cross-Reference (SmartHealthAI) |
|-------|----------------------|-----------------------------------|
| Blood Pressure | Line chart | "Your BP has been above 140/90 for 3 consecutive visits while on Lisinopril — your medication may not be controlling it." |
| Weight | A number | "You've gained 12 lbs since starting Prednisone 6 months ago — weight gain is a known side effect." |
| Heart Rate | A graph | "You're on a beta blocker but resting HR is still 95 — discuss dose optimization." |
| BMI | A label | "BMI moved from 24.8 to 27.1 over 12 months — combined with fasting glucose of 118, pre-diabetes risk increases." |
| O2 Sat / Temp / Resp Rate | Skip | Acute care vitals — no outpatient companion value |

**The 4 user-facing views:**
1. **AI Dashboard** — Home screen. Top insights, alerts, health snapshot.
2. **Medications** — Cross-system med list with interaction alerts and source badges.
3. **Labs & Trends** — Cross-source labs + vitals with AI trend narrative and correlation insights.
4. **Pre-Visit Report** — Generated PDF summary for doctor appointments.

---

## Phase Overview

| Phase | Name | Status |
|-------|------|--------|
| 0 | Foundation | **DONE** |
| 1 | Epic Live Data Fetch | **DONE** |
| 2 | Synthetic Second Source | **DONE** |
| 3 | Multi-Source Merge Engine | **DONE** |
| 4 | Core UI Shell | **DONE** |
| 5 | AI Analysis Engine (Tiered) | **DONE** |
| 6 | AI-Powered Dashboard & Views | **DONE** |
| 7 | Pre-Visit Report Generator | **DONE** |
| 8 | Polish & Production Readiness | Not started |

> Detailed plans for each phase are in `plans/phase-N/README.md`

---

## Architecture Diagram

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
│  │  ─────────────────────────────────────────   │  │
│  │  Lab Trends │ Drug Interactions │ Care Gaps  │  │
│  │  Vital Correlations │ Explainer │ Pre-Visit  │  │
│  └──────────────────┬───────────────────────────┘  │
│                     │                               │
│                     ▼                               │
│  ┌──────────────────────────────────────────────┐  │
│  │              React UI Layer (4 Views)         │  │
│  │  AI Dashboard │ Medications │ Labs & Trends  │  │
│  │  Pre-Visit Report │ "Ask AI" on any item     │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript 5.9 + Vite 7 |
| Styling | Tailwind CSS v4 |
| Routing | react-router-dom v7 |
| Charts | Recharts v3 (sparingly — lab trends + vital correlations only) |
| FHIR | fhirclient v2.6 (SMART on FHIR) |
| AI | OpenAI API (gpt-4o-mini primary, gpt-4o for reports) |
| PDF | html2canvas + jsPDF (or react-pdf) |
| Auth | OAuth2 PKCE (Epic sandbox) |

---

## Key Design Decisions

1. **Think, don't list** — No standalone pages for conditions, allergies, immunizations, vitals, insurance, claims, documents. They feed the AI, not the sidebar.
2. **4 views, not 10** — AI Dashboard, Medications, Labs & Trends, Pre-Visit Report. Every view tells an AI story.
3. **Vitals = AI fuel** — BP/weight/HR cross-referenced with meds and conditions to generate correlation insights. No standalone vitals charts.
4. **Tiered AI cost control** — Rule-based ($0) → Cached LLM (pay once) → On-demand LLM (pay per click). ~$0.05 first demo, ~$0.00 repeats.
5. **Same parsers for all sources** — Real Epic data and synthetic data flow through identical parsing pipeline.
6. **Source tagging from the start** — Every record carries provenance metadata.
7. **AI as enhancement, not requirement** — App works without AI (shows data); AI adds interpretation layer.
8. **Guardrails are non-negotiable** — Every AI insight has disclaimer, source citation, and provider routing.
9. **Sandbox-friendly architecture** — One live FHIR connection + synthetic bundles = full demo without needing multiple live EHR connections.
