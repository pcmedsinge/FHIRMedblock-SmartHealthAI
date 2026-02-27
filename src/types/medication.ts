// -----------------------------------------------------------
// Medication — Parsed from FHIR MedicationRequest
// -----------------------------------------------------------

import type { SourceTag, ClinicalCode } from "./source";

export interface Medication {
  /** FHIR resource ID */
  id: string;
  /** MedicationRequest.status: active | completed | stopped | cancelled | ... */
  status: string;
  /** MedicationRequest.intent: order | plan | proposal | ... */
  intent: string;
  /** Display name of the medication */
  name: string;
  /** RxNorm or other coding for dedup and interaction lookup */
  codes: ClinicalCode[];
  /** Dosage instruction text (e.g., "Take 1 tablet daily") */
  dosageInstruction?: string;
  /** Dosage details */
  dosage?: {
    value?: number;
    unit?: string;
    frequency?: string;
  };
  /** Prescriber name */
  prescriber?: string;
  /** Date the medication was prescribed (authoredOn) */
  dateWritten?: string;
  /** Source system provenance */
  source: SourceTag;
}
