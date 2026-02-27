// -----------------------------------------------------------
// Allergy — Parsed from FHIR AllergyIntolerance
// -----------------------------------------------------------
// Allergies are AI fuel — powers conflict alerts:
//   "Epic says allergy to Penicillin, Community MC prescribed Amoxicillin"

import type { SourceTag, ClinicalCode } from "./source";

export interface Allergy {
  /** FHIR resource ID */
  id: string;
  /** Clinical status: active | inactive | resolved */
  clinicalStatus?: string;
  /** Verification status: confirmed | unconfirmed | refuted | entered-in-error */
  verificationStatus?: string;
  /** Type: allergy | intolerance */
  type?: string;
  /** Category: food | medication | environment | biologic */
  category?: string[];
  /** Criticality: low | high | unable-to-assess */
  criticality?: string;
  /** Substance name */
  substance: string;
  /** Substance coding for matching */
  codes: ClinicalCode[];
  /** Reactions */
  reactions?: AllergyReaction[];
  /** Date recorded */
  recordedDate?: string;
  /** Source system provenance */
  source: SourceTag;
}

export interface AllergyReaction {
  /** Reaction description */
  description?: string;
  /** Manifestation (e.g., "Hives", "Anaphylaxis") */
  manifestations: string[];
  /** Severity: mild | moderate | severe */
  severity?: string;
}
