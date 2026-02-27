// -----------------------------------------------------------
// Encounter — Parsed from FHIR Encounter
// -----------------------------------------------------------
// Encounters are AI fuel — timeline context for AI insights:
//   "prescribed after ER visit on Jan 15"
//   "specialist visit that PCP doesn't know about"

import type { SourceTag, ClinicalCode } from "./source";

export interface Encounter {
  /** FHIR resource ID */
  id: string;
  /** Status: planned | arrived | in-progress | finished | cancelled */
  status: string;
  /** Class: inpatient | outpatient | emergency | ambulatory | ... */
  encounterClass?: string;
  /** Encounter type display (e.g., "Office Visit", "Emergency") */
  type?: string;
  /** Type coding */
  codes: ClinicalCode[];
  /** Reason for visit */
  reason?: string;
  /** Period start (admission or visit start) */
  periodStart?: string;
  /** Period end (discharge or visit end) */
  periodEnd?: string;
  /** Location/facility name */
  location?: string;
  /** Provider name */
  provider?: string;
  /** Source system provenance */
  source: SourceTag;
}
