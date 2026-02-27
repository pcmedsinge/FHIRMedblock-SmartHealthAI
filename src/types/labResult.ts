// -----------------------------------------------------------
// LabResult — Parsed from FHIR Observation (laboratory)
// -----------------------------------------------------------

import type { SourceTag, ClinicalCode } from "./source";

export interface LabResult {
  /** FHIR resource ID */
  id: string;
  /** Observation.status: final | preliminary | amended | ... */
  status: string;
  /** Display name of the test (e.g., "Hemoglobin A1c") */
  name: string;
  /** LOINC or other coding for dedup and trending */
  codes: ClinicalCode[];
  /** Numeric or string value */
  value?: number | string;
  /** Unit of measurement (e.g., "%", "mg/dL") */
  unit?: string;
  /** Reference range for interpretation */
  referenceRange?: {
    low?: number;
    high?: number;
    text?: string;
  };
  /** Interpretation flag from FHIR */
  interpretation?: "normal" | "high" | "low" | "critical-high" | "critical-low" | "abnormal";
  /** Category codes (e.g., "laboratory") */
  category?: string;
  /** Effective date of the observation */
  effectiveDate?: string;
  /** Source system provenance */
  source: SourceTag;
}
