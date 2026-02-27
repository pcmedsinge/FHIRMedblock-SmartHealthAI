// -----------------------------------------------------------
// Immunization — Parsed from FHIR Immunization
// -----------------------------------------------------------
// Immunizations are AI fuel — powers care gap detection:
//   "You're 52, no Shingrix on record"
//   "COVID booster overdue"

import type { SourceTag, ClinicalCode } from "./source";

export interface Immunization {
  /** FHIR resource ID */
  id: string;
  /** Status: completed | entered-in-error | not-done */
  status: string;
  /** Vaccine name */
  vaccineName: string;
  /** CVX or other coding for dedup */
  codes: ClinicalCode[];
  /** Date the immunization was administered */
  occurrenceDate?: string;
  /** Whether this is a primary series or booster */
  primarySource?: boolean;
  /** Lot number (if available) */
  lotNumber?: string;
  /** Site of administration */
  site?: string;
  /** Source system provenance */
  source: SourceTag;
}
