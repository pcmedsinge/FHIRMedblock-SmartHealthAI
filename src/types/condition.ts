// -----------------------------------------------------------
// Condition — Parsed from FHIR Condition
// -----------------------------------------------------------
// Conditions are AI fuel — powers care gap detection:
//   "You have diabetes but no A1c in 8 months"
//   "Hypertension + no BP check in 12 months"

import type { SourceTag, ClinicalCode } from "./source";

export interface Condition {
  /** FHIR resource ID */
  id: string;
  /** Clinical status: active | recurrence | relapse | inactive | remission | resolved */
  clinicalStatus?: string;
  /** Verification status: confirmed | unconfirmed | provisional | differential | refuted */
  verificationStatus?: string;
  /** Category: encounter-diagnosis | problem-list-item | health-concern */
  category?: string;
  /** Condition name */
  name: string;
  /** SNOMED or ICD-10 coding for dedup and matching */
  codes: ClinicalCode[];
  /** Severity: mild | moderate | severe */
  severity?: string;
  /** Onset date (when the condition started) */
  onsetDate?: string;
  /** Abatement date (when the condition resolved, if applicable) */
  abatementDate?: string;
  /** Date recorded in the system */
  recordedDate?: string;
  /** Source system provenance */
  source: SourceTag;
}
