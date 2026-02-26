# SmartHealthAI — Implementation Plan

## Vision
A cross-system AI health companion that connects to multiple FHIR-enabled health systems, aggregates the patient's complete health picture, and uses AI to translate medical data into plain-language insights, detect care gaps, flag medication risks across prescribers, and prepare patients for doctor visits.

## Three Pillars
1. **Aggregate** — Connect multiple FHIR servers, build one unified record
2. **Interpret** — AI translates, trends, correlates, and flags
3. **Act** — Generate pre-visit summaries, care gap reminders, shareable reports

---

## Phase 0 — Foundation (DONE)
**Status: Complete**

Ported from EpicSmartPatientApp-2:
- Vite + React 19 + TypeScript 5.9 + Tailwind CSS v4
- SMART on FHIR OAuth2 PKCE flow (launch, callback, fhirClient)
- Patient demographics hook with module-level cache
- Token monitor with session expiry warnings
- Toast notification system
- Error handling (fhirErrorHandler)
- UI primitives (LoadingSpinner, ErrorDisplay, ToastContainer)

**Files:**
```
src/config/smart.ts           — SMART on FHIR configuration
src/context/FhirContext.tsx    — Authenticated FHIR client context
src/context/ToastContext.tsx   — Toast notification system
src/hooks/useFhirClient.ts    — FHIR client access hook
src/hooks/usePatient.ts       — Patient demographics with cache
src/hooks/useTokenMonitor.ts  — Token expiry monitor
src/utils/tokenManager.ts     — Token lifecycle management
src/utils/fhirErrorHandler.ts — Error classification & friendly messages
src/utils/patientParser.ts    — FHIR Patient → PatientDemographics
src/types/patient.ts          — Patient type definitions
src/components/ui/*            — LoadingSpinner, ErrorDisplay, Toast
src/pages/LaunchPage.tsx       — Epic OAuth login screen
src/pages/CallbackPage.tsx     — OAuth callback handler
```

---

## Phase 1 — Epic Live Data Fetch
**Goal:** Fetch all patient data from the live Epic FHIR connection (primary source).

### 1.1 — Domain Data Types
Create TypeScript interfaces for each clinical domain:
- `src/types/medication.ts` — MedicationRequest parsed type
- `src/types/labResult.ts` — Observation (lab) parsed type
- `src/types/vital.ts` — Observation (vital signs) parsed type
- `src/types/allergy.ts` — AllergyIntolerance parsed type
- `src/types/condition.ts` — Condition parsed type
- `src/types/immunization.ts` — Immunization parsed type
- `src/types/encounter.ts` — Encounter parsed type

### 1.2 — FHIR Parsers
Create parsers for each domain (raw FHIR → clean typed objects):
- `src/utils/medicationParser.ts`
- `src/utils/labResultParser.ts`
- `src/utils/vitalParser.ts`
- `src/utils/allergyParser.ts`
- `src/utils/conditionParser.ts`
- `src/utils/immunizationParser.ts`
- `src/utils/encounterParser.ts`

### 1.3 — Unified Data Fetch Hook
Create `src/hooks/useEpicData.ts`:
- Single hook that fetches all clinical domains via `Promise.allSettled`
- Module-level cache with 5-min TTL
- Returns all domain data arrays + loading + error + refetch

### 1.4 — Source Tagging
Every parsed record carries a `source` field:
```typescript
interface SourceTag {
  systemName: string;    // "Epic MyHealth"
  systemId: string;      // "epic-sandbox"
  fetchedAt: string;     // ISO timestamp
}
```

**Deliverable:** All patient data fetched from Epic, parsed, typed,  and source-tagged.

---

## Phase 2 — Synthetic Second Source
**Goal:** Create realistic synthetic FHIR bundles representing a second health system ("Community Medical Center") to demonstrate multi-source aggregation.

### 2.1 — Synthetic Data Design
Design data that creates interesting cross-system scenarios:
- Medications that **interact** with Epic-prescribed meds
- Lab results that Epic doesn't have (outside lab)
- A specialist visit with notes the PCP never saw
- An allergy not recorded in Epic
- Different/additional conditions

### 2.2 — Synthetic FHIR Bundles
Create hand-crafted FHIR R4 bundles:
- `src/data/synthetic/communityMC/medications.ts`
- `src/data/synthetic/communityMC/labResults.ts`
- `src/data/synthetic/communityMC/conditions.ts`
- `src/data/synthetic/communityMC/allergies.ts`
- `src/data/synthetic/communityMC/encounters.ts`
- `src/data/synthetic/communityMC/immunizations.ts`

### 2.3 — Synthetic Source Provider
Create `src/sources/syntheticSource.ts`:
- Loads bundles, parses through same parsers as Epic data
- Applies `source: "Community Medical Center"` tag
- Returns same typed arrays as Epic source
- Simulates 500ms network delay for realistic UX

### 2.4 — Patient Identity Match
Create `src/sources/patientMatcher.ts`:
- Match synthetic patient to Epic patient by name + DOB
- For demo: exact match (we control the synthetic data)
- Design interface for future probabilistic matching

**Deliverable:** Synthetic second-source data that parses through the same pipeline and carries its own source tag.

---

## Phase 3 — Multi-Source Merge Engine
**Goal:** Combine data from both sources into a unified, deduplicated view.

### 3.1 — Merge Engine
Create `src/sources/mergeEngine.ts`:
- Takes arrays from N sources → produces unified sorted arrays
- Deduplication logic per domain:
  - **Medications:** Match by drug name/RxNorm code → merge, flag conflicts
  - **Labs:** Match by LOINC code + date → merge if same, keep if different
  - **Conditions:** Match by SNOMED code → merge, note which systems report it
  - **Allergies:** Match by substance → merge
  - **Immunizations:** Match by CVX code + date range
  - **Encounters:** No dedup needed — each visit is unique

### 3.2 — Conflict Detection
Create `src/sources/conflictDetector.ts`:
- Flag when same medication appears with different doses across sources
- Flag when one source says "allergy to X" and another prescribes X
- Flag contradictory conditions
- Return structured `Conflict[]` array

### 3.3 — Unified Data Hook
Create `src/hooks/useUnifiedData.ts`:
- Orchestrates: useEpicData + syntheticSource + mergeEngine
- Returns merged data arrays + conflicts + per-source metadata
- Single loading state, unified error handling

**Deliverable:** One unified data model combining both sources with dedup and conflict detection.

---

## Phase 4 — Core UI Shell
**Goal:** Build the persistent app layout with source-aware components.

### 4.1 — Layout Components
- `src/components/layout/AppShell.tsx` — Persistent layout (Outlet pattern)
- `src/components/layout/Sidebar.tsx` — Navigation sidebar
- `src/components/layout/Header.tsx` — Top header with patient info
- `src/components/patient/PatientBanner.tsx` — Compact patient demographics

### 4.2 — Source Badge Component
- `src/components/ui/SourceBadge.tsx` — Shows "Epic" or "Community MC" on data items
- Color-coded per source system
- Consistent across all data views

### 4.3 — Page Scaffold
Create minimal page components (content filled in later phases):
- Dashboard (AI Insights home)
- Unified Timeline
- Medications (cross-system view)
- Lab Results (cross-system trending)
- Conditions
- Allergies
- AI Insights detail page

### 4.4 — App.tsx Routing
Wire all pages into the layout route with persistent shell.

**Deliverable:** Working app shell with navigation, patient banner, source badges, and page routing.

---

## Phase 5 — Cross-System Data Views
**Goal:** Build rich UI for viewing unified health data with source attribution.

### 5.1 — Unified Timeline Page
- Chronological view of ALL encounters from ALL sources
- Source badge on each entry
- Filter by source, date range, encounter type
- Click to expand encounter details

### 5.2 — Medications View
- Combined medication list with source badges
- Highlight medications unique to one source (cross-prescriber blind spots)
- Drug interaction warnings (from conflict detector)
- Group by active/inactive

### 5.3 — Lab Results View
- Cross-source lab results with trending
- Sparkline charts showing values over time from all sources
- Abnormal flags with reference ranges
- Source badge on each result

### 5.4 — Conditions, Allergies, Immunizations
- Unified list views with source attribution
- Highlight items found in only one source (potential data gaps)

**Deliverable:** Full data browsing experience across all domains with source attribution.

---

## Phase 6 — AI Analysis Engine
**Goal:** Feed unified FHIR data to an LLM to generate actionable health insights.

### 6.1 — AI Service Layer
Create `src/ai/aiService.ts`:
- Configurable LLM backend (OpenAI / Claude / Azure OpenAI)
- API key management via `.env.local` (`VITE_AI_API_KEY`)
- Structured prompt templates per analysis type
- Response parsing + error handling
- Rate limiting

### 6.2 — Lab Trend Narrative
Create `src/ai/labTrendAnalysis.ts`:
- Input: All Observations sorted by date + patient demographics
- Output: Plain-language narrative ("Your A1c has risen from 6.1 to 7.2 over 14 months...")
- Source attribution: which lab from which system

### 6.3 — Drug Interaction Analysis
Create `src/ai/drugInteractionAnalysis.ts`:
- Input: All active MedicationRequests from all sources
- Cross-reference with NLM RxNorm API (optional) + LLM analysis
- Output: Interaction alerts with severity + what to discuss with doctor

### 6.4 — Care Gap Detection
Create `src/ai/careGapDetection.ts`:
- Input: Conditions + Immunizations + Demographics + Encounters
- Cross-reference against USPSTF preventive care guidelines
- Output: Overdue screenings, missing immunizations, missed follow-ups

### 6.5 — Plain-Language Explainer
Create `src/ai/healthExplainer.ts`:
- "What does this mean?" for any FHIR resource
- Input: A lab result, medication, or condition
- Output: Patient-friendly explanation (6th-grade reading level)

### 6.6 — AI Guardrails
Every AI response includes:
- "Not medical advice" disclaimer
- Source attribution back to actual FHIR resources
- Confidence framing ("commonly associated with..." not "you have...")
- "Discuss with your provider" action routing
- Model transparency (which AI generated this)

**Deliverable:** AI analysis engine with lab trends, drug interactions, care gaps, and explainers — all with trust guardrails.

---

## Phase 7 — AI-Powered Dashboard
**Goal:** Dashboard that surfaces the top AI insights front-and-center.

### 7.1 — AI Insights Panel
- Top 3-5 AI findings displayed on the dashboard
- Priority-ranked: drug interactions > care gaps > trends > info
- Each insight is expandable with full explanation
- "Discuss with your doctor" action on each

### 7.2 — "Ask About This" Button
- Available on any data item across the app
- Sends the FHIR resource to the AI explainer
- Returns a patient-friendly explanation in a slide-out panel

### 7.3 — Cross-Source Summary Cards
- Per-domain summary showing record counts from each source
- "Found in Epic only" / "Found in both systems" indicators
- Quick visual of where data lives

### 7.4 — Alert Banner
- Critical AI findings (drug interactions, expired screenings) shown as persistent alert at the top
- Color-coded severity (red/amber/yellow)

**Deliverable:** AI-powered home screen that proactively surfaces health insights.

---

## Phase 8 — Pre-Visit Report Generator
**Goal:** Generate a shareable summary patients can bring to their doctor appointment.

### 8.1 — Report Content
AI-generated one-pager including:
- Patient demographics
- Recent health changes since last visit
- Current medications (from all sources)
- Abnormal lab trends with charts
- Active conditions
- AI-flagged concerns (interactions, gaps)
- Suggested questions to ask the doctor

### 8.2 — Report Generation
Create `src/ai/preVisitReport.ts`:
- Assembles all data + AI insights into a structured report
- LLM generates the narrative summary sections
- Charts rendered as images for the PDF

### 8.3 — Export Options
- **PDF download** (via html2canvas + jsPDF or react-pdf)
- **Print-friendly page** (CSS print styles)
- **Share link** (optional — generates a temporary shareable URL)

**Deliverable:** One-click pre-visit report with AI narrative, data summary, and suggested questions.

---

## Phase 9 — Polish & Production Readiness
**Goal:** Final polish, accessibility, performance, and documentation.

### 9.1 — Accessibility Audit
- WCAG 2.1 AA compliance verification
- Screen reader testing
- Keyboard navigation for all interactive elements
- Color contrast verification

### 9.2 — Performance Optimization
- Lazy loading for non-critical pages
- AI response caching (avoid re-analyzing same data)
- Skeleton loading states for all async operations

### 9.3 — Error Resilience
- Graceful fallback when AI API is unavailable (show data without AI insights)
- Offline indicator
- Retry logic with exponential backoff

### 9.4 — Documentation
- README with setup instructions
- Architecture diagram
- AI prompt templates documentation
- HIPAA considerations for production deployment

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                   SmartHealthAI                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐    ┌──────────────────────┐  │
│  │ Epic FHIR    │    │ Synthetic Source      │  │
│  │ (Live OAuth) │    │ (Community MC Bundles)│  │
│  └──────┬───────┘    └──────────┬───────────┘  │
│         │                       │               │
│         ▼                       ▼               │
│  ┌──────────────────────────────────────────┐  │
│  │         Multi-Source Merge Engine         │  │
│  │  (Normalize → Dedup → Tag → Conflicts)   │  │
│  └──────────────────┬───────────────────────┘  │
│                     │                           │
│         ┌───────────┼───────────┐               │
│         ▼           ▼           ▼               │
│  ┌───────────┐ ┌─────────┐ ┌─────────────┐    │
│  │ Unified   │ │ Conflict│ │ Source       │    │
│  │ Data      │ │ Alerts  │ │ Metadata    │    │
│  └─────┬─────┘ └────┬────┘ └──────┬──────┘    │
│        │             │             │            │
│        ▼             ▼             ▼            │
│  ┌──────────────────────────────────────────┐  │
│  │           AI Analysis Engine              │  │
│  │  Lab Trends │ Drug Interactions │ Gaps   │  │
│  │  Explainer  │ Pre-Visit Report           │  │
│  └──────────────────┬───────────────────────┘  │
│                     │                           │
│                     ▼                           │
│  ┌──────────────────────────────────────────┐  │
│  │              React UI Layer               │  │
│  │  Dashboard │ Timeline │ Source-Tagged     │  │
│  │  AI Insights │ Pre-Visit PDF │ "Ask AI"  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript 5.9 + Vite 7 |
| Styling | Tailwind CSS v4 |
| Routing | react-router-dom v7 |
| Charts | Recharts v3 |
| FHIR | fhirclient v2.6 (SMART on FHIR) |
| AI | OpenAI API / Claude API / Azure OpenAI (configurable) |
| PDF | html2canvas + jsPDF (or react-pdf) |
| Auth | OAuth2 PKCE (Epic sandbox) |

---

## Key Design Decisions

1. **Fresh workspace, not forked** — Only 5 auth/FHIR files ported; everything else purpose-built for multi-source
2. **Same parsers for all sources** — Real Epic data and synthetic data flow through identical parsing pipeline
3. **Source tagging from the start** — Every record carries provenance metadata
4. **AI as enhancement, not requirement** — App works without AI (shows data); AI adds interpretation layer
5. **Guardrails are non-negotiable** — Every AI insight has disclaimer, source citation, and provider routing
6. **Sandbox-friendly architecture** — One live FHIR connection + synthetic bundles = full demo without needing multiple live EHR connections
