// -----------------------------------------------------------
// Vital — Parsed from FHIR Observation (vital-signs)
// -----------------------------------------------------------
// Vitals are AI fuel — not displayed as standalone charts.
// Cross-referenced with medications for correlation insights:
//   BP + antihypertensives → "Is your med working?"
//   Weight + corticosteroids → "Known side effect"
//   HR + beta blockers → "Dose effectiveness"

import type { SourceTag, ClinicalCode } from "./source";

export interface Vital {
  /** FHIR resource ID */
  id: string;
  /** Observation.status */
  status: string;
  /** Vital type display name (e.g., "Blood Pressure", "Heart Rate") */
  name: string;
  /** Vital type category for grouping */
  vitalType: "blood-pressure" | "heart-rate" | "body-weight" | "bmi" | "body-temperature" | "respiratory-rate" | "oxygen-saturation" | "body-height" | "other";
  /** LOINC coding */
  codes: ClinicalCode[];
  /** Primary value (for simple vitals like HR, weight) */
  value?: number;
  /** Unit of measurement */
  unit?: string;
  /** Components for compound vitals (e.g., systolic/diastolic for BP) */
  components?: VitalComponent[];
  /** Effective date of the observation */
  effectiveDate?: string;
  /** Source system provenance */
  source: SourceTag;
}

export interface VitalComponent {
  /** Component name (e.g., "Systolic", "Diastolic") */
  name: string;
  /** Component coding */
  codes: ClinicalCode[];
  /** Numeric value */
  value?: number;
  /** Unit */
  unit?: string;
}
