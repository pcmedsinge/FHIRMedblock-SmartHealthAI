# Phase 3 — Multi-Source Merge Engine
**Status: Complete**

## Goal
Combine data from Epic (live) and Community Medical Center (synthetic) into a unified, deduplicated dataset with conflict detection. This is the core of the "Aggregate" pillar.

## Tasks

### 3.1 — Merge Engine
Create `src/sources/mergeEngine.ts`:

Takes arrays from N sources → produces unified sorted arrays with deduplication.

**Dedup logic per domain:**

| Domain | Match Strategy | On Match |
|--------|---------------|----------|
| **Medications** | Drug name or RxNorm code | Merge if same dose; flag conflict if different dose |
| **Lab Results** | LOINC code + date (within 24h window) | Merge if same result; keep both if different values |
| **Vitals** | Vital type + date (within 24h window) | Merge if same; keep both if different |
| **Conditions** | SNOMED code | Merge; note which systems report it |
| **Allergies** | Substance name/code | Merge; note source |
| **Immunizations** | CVX code + date (within 30-day window) | Merge if same vaccine; keep if different |
| **Encounters** | No dedup | Each visit is unique — just sort chronologically |

**Output:** Each merged record carries:
- All original source tags (which systems reported it)
- A `mergeStatus`: `"single-source"` | `"confirmed"` (both systems agree) | `"conflict"` (systems disagree)

### 3.2 — Conflict Detection
Create `src/sources/conflictDetector.ts`:

Actively scan merged data for clinically meaningful conflicts:

| Conflict Type | Detection Logic | Severity |
|---------------|----------------|----------|
| **Dose mismatch** | Same medication, different doses across sources | High |
| **Allergy-prescription** | Allergy in Source A, that drug prescribed in Source B | Critical |
| **Missing cross-reference** | Medication in one source with no awareness in the other | Medium |
| **Contradictory condition** | Condition in one source marked resolved, still active in another | Medium |

Returns a structured `Conflict[]` array:

```typescript
interface Conflict {
  id: string;
  type: 'dose-mismatch' | 'allergy-prescription' | 'missing-crossref' | 'contradictory-condition';
  severity: 'critical' | 'high' | 'medium';
  description: string;           // Human-readable summary
  resources: ConflictResource[]; // The actual records involved
  sourceA: SourceTag;
  sourceB: SourceTag;
}
```

### 3.3 — Unified Data Hook
Create `src/hooks/useUnifiedData.ts`:
- Orchestrates: `useEpicData()` + `syntheticSource` + `mergeEngine`
- Returns:
  ```typescript
  {
    medications: MergedMedication[];
    labResults: MergedLabResult[];
    vitals: MergedVital[];
    conditions: MergedCondition[];
    allergies: MergedAllergy[];
    immunizations: MergedImmunization[];
    encounters: MergedEncounter[];
    conflicts: Conflict[];
    sourceSummary: SourceSummary[];  // per-source record counts
    loading: boolean;
    error: Error | null;
    refetch: () => void;
  }
  ```
- Single loading state, unified error handling
- Any single source failure doesn't break the others

## Deliverable
One unified data model that:
- Combines both sources with intelligent deduplication
- Detects clinically meaningful conflicts
- Carries source provenance on every record
- Provides per-source metadata for UI display

## Verification
- Medications from both sources appear in a single sorted list
- Duplicate medications are merged, not shown twice
- Conflicts are detected and returned with correct severity
- Source counts are accurate per system
- App doesn't break if synthetic source has no data for a domain
