# Phase 6 — AI-Powered Dashboard & Data Views
**Status: Not Started**

## Goal
Build the 3 content views (Dashboard, Medications, Labs & Trends) that surface AI insights alongside cross-system data. Every view tells a story — data supports insights, not the other way around.

## Tasks

### 6.1 — AI Dashboard (Home)
`src/pages/DashboardPage.tsx` — The first thing the user sees.

**Layout:**
```
┌──────────────────────────────────────────────────┐
│  🔴 Critical Alerts Banner (if any)              │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─── AI Insights ──────────────────────────┐   │
│  │ 1. Drug interaction alert (critical)      │   │
│  │ 2. Care gap: overdue screening (high)     │   │
│  │ 3. Lab trend: A1c rising (medium)         │   │
│  │ 4. Vital correlation: BP + meds (medium)  │   │
│  │ 5. Missing data: allergy conflict (info)  │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌─── Health Snapshot ──────────────────────┐   │
│  │  AI-generated plain-language summary of    │   │
│  │  your overall health picture (Tier 2)      │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌─── Source Overview ──────────────────────┐   │
│  │  Epic MyHealth: 1 med, 1 lab, 5 vitals.. │   │
│  │  Community MC:  2 meds, 3 labs, 2 vitals. │   │
│  │  Conflicts detected: 2                     │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Components:**
- **Critical Alerts Banner** — red/amber bar at top for drug interactions, allergy-prescription conflicts
- **AI Insights Panel** — Top 3-5 prioritized findings from Tier 1 + Tier 2 results. Each insight is an `InsightCard` (Phase 4) that expands for details.
- **Health Snapshot** — Tier 2 LLM narrative summarizing the big picture
- **Source Overview** — Per-source record counts + conflict count. Not a radar chart — a clean, simple summary.

### 6.2 — Medications View
`src/pages/MedicationsPage.tsx` — The cross-system story.

**Layout:**
```
┌──────────────────────────────────────────────────┐
│  ⚠️ Interaction Alerts (inline, above the list)  │
├──────────────────────────────────────────────────┤
│                                                  │
│  AI Medication Summary (Tier 2, collapsible)     │
│  "You have 3 active medications from 2 systems.  │
│   Your doctors may not be aware of each other's  │
│   prescriptions..."                              │
│                                                  │
├──────────────────────────────────────────────────┤
│  Active Medications                              │
│  ┌───────────────────────────────────────────┐  │
│  │ 💊 Lisinopril 10mg — daily          Epic │  │
│  │    [Ask AI: "What does this do?"]          │  │
│  ├───────────────────────────────────────────┤  │
│  │ 💊 Spironolactone 25mg — daily   Comm MC │  │
│  │    ⚠️ Interaction with Lisinopril          │  │
│  │    [Ask AI: "What does this do?"]          │  │
│  ├───────────────────────────────────────────┤  │
│  │ 💊 Metformin 500mg — twice daily     Epic │  │
│  │    [Ask AI: "What does this do?"]          │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  "Ask my doctor about medications" button        │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Features:**
- Source badge on every medication
- Inline interaction alerts with severity coloring
- "Ask AI" button on each medication (Tier 3 — on-demand explainer)
- AI medication summary at top (Tier 2 — cached)
- "Only in Epic" / "Only in Community MC" / "In both" grouping option
- "Ask my doctor about medications" generates Tier 3 questions

### 6.3 — Labs & Trends View
`src/pages/LabsTrendsPage.tsx` — AI trend narratives + vital correlations.

**Layout:**
```
┌──────────────────────────────────────────────────┐
│  Lab Trend Narrative (Tier 2, AI-generated)      │
│  "Your A1c has risen from 6.1 to 7.2 over 14    │
│   months. This crosses into the diabetic range..." │
├──────────────────────────────────────────────────┤
│                                                  │
│  Lab Results (sorted by date, newest first)      │
│  ┌───────────────────────────────────────────┐  │
│  │ 📊 Hemoglobin A1c — 7.2% (HIGH ↑)    Epic │  │
│  │    Trend: ▲ rising (was 6.1 → 6.8 → 7.2)  │  │
│  │    Sparkline: ──╱──╱──                      │  │
│  │    [Ask AI: "What does this mean?"]         │  │
│  ├───────────────────────────────────────────┤  │
│  │ 📊 Glucose — 126 mg/dL (HIGH)     Comm MC │  │
│  │    [Ask AI: "What does this mean?"]         │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
├──────────────────────────────────────────────────┤
│  Vital Correlation Insights (Tier 1, rule-based) │
│  ┌───────────────────────────────────────────┐  │
│  │ 💡 "Your BP has been above 140/90 for 3    │  │
│  │    visits while on Lisinopril — discuss     │  │
│  │    with your doctor."                       │  │
│  ├───────────────────────────────────────────┤  │
│  │ 💡 "Weight gain of 12 lbs correlates with  │  │
│  │    starting Prednisone 6 months ago."       │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Features:**
- AI trend narrative at top (Tier 2 — cached)
- Lab results with Tier 1 abnormal flags and trend indicators
- Sparkline charts for labs with 2+ readings (Recharts — used sparingly and purposefully)
- Source badge on each result
- "Ask AI" button on each lab (Tier 3 — on-demand)
- **Vital Correlation Insights** section at bottom — Tier 1 rule-based insights from vital-medication cross-reference
- Vitals are NOT shown as raw data tables or standalone charts — they appear as AI-generated insight statements

## Shared Components Needed

```
src/components/data/MedicationCard.tsx      — Single medication with source badge + actions
src/components/data/LabResultCard.tsx        — Single lab result with trend + flags + actions
src/components/data/InsightsList.tsx         — Sorted list of AI insight cards
src/components/data/SourceOverview.tsx       — Per-source record counts
src/components/data/AlertBanner.tsx          — Critical alerts bar
src/components/data/SparklineChart.tsx       — Small inline trend chart
```

## Deliverable
Three content-rich views where:
- Dashboard shows AI insights first, data summary second
- Medications tells the cross-system prescriber story
- Labs & Trends shows AI interpretation with vital correlations
- Every data item has "Ask AI" capability
- Source badges everywhere
- No standalone pages for conditions, allergies, immunizations, vitals

## Verification
- Dashboard shows prioritized insights on load
- Medication interactions are highlighted visually
- Lab trends show sparklines with direction indicators
- Vital correlations appear as insight statements, not raw charts
- "Ask AI" buttons trigger Tier 3 calls and show explanations
- Source badges are correct on every item
- Views load gracefully with loading states
