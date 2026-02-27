# Phase 2 — Synthetic Second Source
**Status: Not Started**

## Goal
Create realistic synthetic FHIR bundles representing a second health system ("Community Medical Center") to demonstrate multi-source aggregation. The synthetic data is **intentionally designed** to create cross-system scenarios that trigger AI insights.

## Design Principle
Every piece of synthetic data exists to tell a story. No filler data. Each bundle should trigger at least one AI insight when combined with Epic data.

## Domains & Scenario Design

### Synthetic Medications
Designed to create **drug interaction stories**:
- A medication prescribed by the specialist that **interacts** with an Epic-prescribed med
- A medication that the PCP (Epic) doesn't know about
- Same medication as Epic but at a **different dose** (conflict scenario)

### Synthetic Lab Results
Designed to create **trend stories**:
- Lab results that Epic doesn't have (done at an outside lab)
- Lab results that **extend a trend** visible in Epic data (e.g., additional A1c readings showing progression)
- A result with a different reference range (different lab standards)

### Synthetic Vitals
Designed to create **medication correlation stories**:
- BP readings over time that correlate with when medications were started
- Weight readings that show gain after a specific medication
- HR readings while on cardiac medications

### Synthetic Conditions
Designed to create **cross-system awareness stories**:
- A condition diagnosed by the specialist that the PCP doesn't know about
- A condition that, combined with Epic's conditions, triggers a care gap

### Synthetic Allergies
Designed to create **conflict stories**:
- An allergy recorded at Community MC that **contradicts** an Epic prescription
- An allergy not in Epic at all

### Synthetic Immunizations
Designed to create **care gap stories**:
- Immunizations from a different provider, partially overlapping with Epic

### Synthetic Encounters
Designed to create **timeline stories**:
- A specialist visit that provides context for the synthetic meds/labs
- An ER visit that the PCP never knew about

## Tasks

### 2.1 — Synthetic Data Files
Create hand-crafted FHIR R4 bundles matched to Camila Lopez (Epic sandbox patient):

```
src/data/synthetic/communityMC/patient.ts        — Patient identity (same person, different MRN)
src/data/synthetic/communityMC/medications.ts     — MedicationRequest bundles
src/data/synthetic/communityMC/labResults.ts      — Observation (lab) bundles
src/data/synthetic/communityMC/vitals.ts          — Observation (vital-signs) bundles
src/data/synthetic/communityMC/conditions.ts      — Condition bundles
src/data/synthetic/communityMC/allergies.ts       — AllergyIntolerance bundles
src/data/synthetic/communityMC/immunizations.ts   — Immunization bundles
src/data/synthetic/communityMC/encounters.ts      — Encounter bundles
```

### 2.2 — Synthetic Source Provider
Create `src/sources/syntheticSource.ts`:
- Loads all synthetic bundles
- Parses through the **same parsers** as Epic data (Phase 1 parsers)
- Applies `source: { systemName: "Community Medical Center", systemId: "community-mc" }` tag
- Returns same typed arrays as Epic source
- Simulates 500ms network delay for realistic UX

### 2.3 — Patient Identity Match
Create `src/sources/patientMatcher.ts`:
- Match synthetic patient to Epic patient by name + DOB
- For demo: exact match (we control the synthetic data)
- Interface designed for future probabilistic matching:

```typescript
interface PatientMatcher {
  match(epicPatient: PatientDemographics, candidatePatient: PatientDemographics): MatchResult;
}

interface MatchResult {
  isMatch: boolean;
  confidence: number;    // 0-1
  matchedOn: string[];   // ["name", "dob", "gender"]
}
```

## Deliverable
Synthetic second-source data that:
- Parses through the same pipeline as Epic data
- Carries its own source tag ("Community Medical Center")
- Creates at least one compelling scenario per AI feature (interaction, trend, gap, conflict)

## Verification
- Synthetic data parses without errors through Phase 1 parsers
- Source tag shows "Community Medical Center" on every synthetic record
- Patient matcher correctly links synthetic patient to Camila Lopez
- Each synthetic bundle is documented with what AI story it enables
