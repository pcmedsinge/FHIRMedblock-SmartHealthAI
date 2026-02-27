# Phase 5 — AI Analysis Engine (Tiered Intelligence)
**Status: Not Started**

## Goal
Build the AI analysis engine with a tiered cost strategy. Maximize AI impact while keeping API costs near-zero for repeated demos.

## Tiered Intelligence Strategy

| Tier | What | Cost | When it runs |
|------|------|------|--------------|
| **Tier 1 — Rule-Based** | Deterministic logic that feels smart | **$0** | Always, automatically |
| **Tier 2 — Cached LLM** | LLM analysis run once, cached for reuse | **Pay once** | On first load, cached thereafter |
| **Tier 3 — On-Demand LLM** | LLM called only when user explicitly asks | **Pay per click** | User-triggered only |

## Tasks

### 5.1 — AI Service Layer (Foundation)
Create `src/ai/aiService.ts`:
- Configurable LLM backend (OpenAI API)
- API key management via `.env.local` (`VITE_AI_API_KEY`)
- Structured prompt templates per analysis type
- Response parsing + error handling
- Rate limiting (max 5 concurrent requests)
- **Response cache** — `localStorage`-backed, keyed by SHA-256 hash of input data
- **Model routing** — gpt-4o-mini for most calls, gpt-4o only for pre-visit report
- Graceful fallback when API is unavailable (show Tier 1 results only)

### 5.2 — Tier 1: Rule-Based Intelligence (Zero Cost)

#### 5.2a — Lab Abnormal Flags
Create `src/ai/rules/labAbnormalFlags.ts`:
- Compare each lab value against its FHIR `referenceRange`
- Flag: high, low, critical high, critical low
- Output: `{ status: 'normal' | 'high' | 'low' | 'critical', message: string }`

#### 5.2b — Lab Trend Direction
Create `src/ai/rules/labTrendDirection.ts`:
- For labs with 2+ readings, calculate trend: rising / falling / stable
- Percentage change and rate of change
- Output: `{ direction: 'rising' | 'falling' | 'stable', changePercent: number }`

#### 5.2c — Care Gap Detection
Create `src/ai/rules/careGapRules.ts`:
- Hardcoded USPSTF preventive care rules table:
  - Colonoscopy screening ≥ 45
  - Mammogram ≥ 40 (female)
  - Lung cancer screening ≥ 50 with smoking history
  - Shingrix vaccine ≥ 50
  - A1c every 3-6 months for diabetics
  - BP check annually for adults
  - Lipid panel every 5 years ≥ 35
- Input: patient demographics + conditions + immunizations + encounters
- Output: `CareGap[]` with recommendation, last done date, overdue flag

#### 5.2d — Drug Interaction Lookup
Create `src/ai/rules/drugInteractions.ts`:
- Small hardcoded lookup table of ~20 common interactions
- Optional: NLM RxNorm Interaction API call (free, public)
- Input: all active medications from all sources
- Output: `DrugInteraction[]` with severity, description, involved meds

#### 5.2e — Source Conflict Detection
Create `src/ai/rules/sourceConflicts.ts`:
- Consumes `Conflict[]` from merge engine (Phase 3)
- Generates patient-friendly alert messages
- Labels each as "Based on standard clinical guidelines"

#### 5.2f — Vital-Medication Correlation
Create `src/ai/rules/vitalMedCorrelation.ts`:
- Cross-reference vitals with medication timeline:
  - BP readings + antihypertensive meds → "Is your med working?"
  - Weight trend + known weight-gain meds (prednisone, SSRIs) → "Possible side effect"
  - HR + beta blockers / stimulants → "Expected effect" or "Unexpected"
  - BMI + glucose/A1c → "Combined risk factor"
- Input: vitals array + medications array + conditions array
- Output: `VitalCorrelation[]` with insight message, related vital, related med

### 5.3 — Tier 2: Cached LLM Analysis (Pay Once)

#### 5.3a — Lab Trend Narrative
Create `src/ai/llm/labTrendNarrative.ts`:
- Input: lab results sorted by date + patient demographics + Tier 1 flags
- Prompt: Generate a plain-language narrative summarizing lab trends
- Output: paragraph of text ("Your A1c has risen from 6.1 to 7.2 over 14 months...")
- Source attribution: which lab from which system
- **Cached in localStorage** after first generation

#### 5.3b — Dashboard Health Snapshot
Create `src/ai/llm/healthSnapshot.ts`:
- Input: all unified data + all Tier 1 results
- Prompt: Generate top 3-5 prioritized health insights
- Priority order: drug interactions > allergy-prescription conflicts > care gaps > lab trends > vital correlations > info
- Output: `HealthInsight[]` with title, body, severity, sources
- **Cached in localStorage** after first generation

#### 5.3c — Medication Cross-System Summary
Create `src/ai/llm/medicationSummary.ts`:
- Input: all medications from all sources + interactions
- Prompt: Summarize the medication picture, flag risks, note gaps
- Output: narrative text with embedded alerts
- **Cached in localStorage** after first generation

### 5.4 — Tier 3: On-Demand LLM (Pay Per Click)

#### 5.4a — Plain-Language Explainer
Create `src/ai/llm/healthExplainer.ts`:
- "What does this mean?" for any FHIR resource
- Input: a single lab result, medication, or condition
- Prompt: Explain this in plain language at a 6th-grade reading level
- Output: 2-3 sentence explanation
- **Triggered only on user click** — cached per resource after first call

#### 5.4b — "What Should I Ask My Doctor?"
Create `src/ai/llm/doctorQuestions.ts`:
- Input: specific data item context + related insights
- Prompt: Generate 3-5 specific questions to ask a doctor about this
- Output: `string[]` of questions
- **Triggered only on user click** — cached

### 5.5 — AI Guardrails (All Tiers)
Create `src/ai/guardrails.ts`:
- Wraps every AI response with:
  - "This is not medical advice" disclaimer text
  - Source attribution (links to the FHIR resources that generated the insight)
  - Confidence framing ("commonly associated with..." not "you have...")
  - "Discuss with your provider" call to action
  - Model transparency label (which model, which tier)
  - Cache timestamp ("Analysis generated on Feb 26, 2026")
- Tier 1 outputs labeled: "Based on standard clinical guidelines"
- Tier 2/3 outputs labeled: "AI-generated insight (gpt-4o-mini)"

### 5.6 — Cost Control

| Use Case | Tier | Model | Approx Cost/Call |
|----------|------|-------|------------------|
| Lab abnormal flags | 1 | None (rule-based) | $0 |
| Trend direction | 1 | None (rule-based) | $0 |
| Care gap rules | 1 | None (rule-based) | $0 |
| Drug interaction lookup | 1 | NLM API (free) | $0 |
| Vital-med correlation | 1 | None (rule-based) | $0 |
| Source conflict alerts | 1 | None (rule-based) | $0 |
| Lab trend narrative | 2 | gpt-4o-mini | ~$0.001 |
| Dashboard insights | 2 | gpt-4o-mini | ~$0.002 |
| Medication summary | 2 | gpt-4o-mini | ~$0.001 |
| "Ask about this" | 3 | gpt-4o-mini | ~$0.001/click |
| "Ask my doctor" | 3 | gpt-4o-mini | ~$0.001/click |
| Pre-visit report | 3 | gpt-4o | ~$0.02-0.03 |

**First demo: ~$0.05 | Repeat demos: ~$0.00**

## Deliverable
Complete tiered AI engine:
- Tier 1 rule-based intelligence runs every time for free
- Tier 2 cached LLM insights pay once and reuse forever
- Tier 3 on-demand explainers only cost when user asks
- All outputs carry appropriate guardrails and source attribution

## Verification
- Tier 1 results appear instantly on page load (no API delay)
- Tier 2 results show loading state on first run, then instant on second run
- Tier 3 "Ask about this" only fires when clicked
- localStorage shows cached AI responses with content-hash keys
- App works correctly when AI API key is missing (Tier 1 only, graceful degradation)
- All AI outputs include disclaimer, source attribution, and provider routing
