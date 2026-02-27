# Phase 1 — Epic Live Data Fetch
**Status: Not Started**

## Goal
Fetch all patient clinical data from the live Epic FHIR connection (primary source). Parse raw FHIR resources into clean TypeScript types. Source-tag everything.

## Domains to Fetch

All domains are fetched and parsed, but only some become user-facing views. The rest are **AI fuel**.

| Domain | FHIR Resource | Role | Purpose in App |
|--------|--------------|------|---------------|
| Medications | MedicationRequest | **View** | Cross-system med list + interaction alerts |
| Lab Results | Observation (laboratory) | **View** | AI trend narratives + cross-source trending |
| Vitals | Observation (vital-signs) | **AI Fuel** | Cross-referenced with meds for correlation insights (BP + Lisinopril, Weight + Prednisone) |
| Conditions | Condition | **AI Fuel** | Powers care gap detection, risk assessment |
| Allergies | AllergyIntolerance | **AI Fuel** | Powers conflict alerts (allergy vs. prescription) |
| Immunizations | Immunization | **AI Fuel** | Powers care gap alerts (missing vaccines) |
| Encounters | Encounter | **AI Fuel** | Timeline context for AI insights |

**NOT fetched** (dropped from plan): Insurance, Claims/EOB, Documents.

## Tasks

### 1.1 — Domain Data Types
Create TypeScript interfaces for each clinical domain:

```
src/types/medication.ts     — MedicationRequest parsed type
src/types/labResult.ts      — Observation (lab) parsed type
src/types/vital.ts          — Observation (vital signs) parsed type
src/types/allergy.ts        — AllergyIntolerance parsed type
src/types/condition.ts      — Condition parsed type
src/types/immunization.ts   — Immunization parsed type
src/types/encounter.ts      — Encounter parsed type
src/types/source.ts         — SourceTag interface (shared across all domains)
```

Every domain type must include a `source: SourceTag` field.

### 1.2 — FHIR Parsers
Create parsers that transform raw FHIR resources into clean typed objects:

```
src/utils/medicationParser.ts
src/utils/labResultParser.ts
src/utils/vitalParser.ts
src/utils/allergyParser.ts
src/utils/conditionParser.ts
src/utils/immunizationParser.ts
src/utils/encounterParser.ts
```

Each parser:
- Accepts a raw FHIR Bundle entry
- Returns a clean typed object or `null` (if unparseable)
- Extracts coding (RxNorm, LOINC, SNOMED, CVX) for downstream matching
- Handles missing/optional fields gracefully (Epic doesn't always send everything)

### 1.3 — Unified Data Fetch Hook
Create `src/hooks/useEpicData.ts`:
- Single hook that fetches all 7 clinical domains via `Promise.allSettled`
- Module-level cache with 5-min TTL
- Returns: `{ medications, labResults, vitals, conditions, allergies, immunizations, encounters, loading, error, refetch }`
- Each failed domain doesn't break the others (partial data is fine)

### 1.4 — Source Tagging
Every parsed record carries a `source` field:

```typescript
interface SourceTag {
  systemName: string;    // "Epic MyHealth"
  systemId: string;      // "epic-sandbox"
  fetchedAt: string;     // ISO timestamp
}
```

Applied by each parser during the parsing step.

## Deliverable
All patient data fetched from Epic, parsed into clean TypeScript types, and source-tagged. Ready to be consumed by the merge engine (Phase 3) and AI engine (Phase 5).

## Verification
- Each domain returns typed arrays (even if empty)
- Source tag shows "Epic MyHealth" on every record
- Failed domains don't crash the app (graceful partial loading)
- Cache prevents re-fetching within 5-min TTL
- Console log shows raw FHIR vs. parsed output for debugging
