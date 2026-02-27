// -----------------------------------------------------------
// SourceTag — Provenance metadata for every clinical record
// -----------------------------------------------------------
// Every parsed record carries this tag so the UI and AI engine
// know which health system the data came from.

export interface SourceTag {
  /** Display name: "Epic MyHealth" or "Community Medical Center" */
  systemName: string;
  /** Machine ID: "epic-sandbox" or "community-mc" */
  systemId: string;
  /** ISO timestamp when the data was fetched */
  fetchedAt: string;
}

/** Coding from a FHIR CodeableConcept — used for dedup and matching */
export interface ClinicalCode {
  /** Code system URI (e.g., "http://www.nlm.nih.gov/research/umls/rxnorm") */
  system?: string;
  /** The code value (e.g., "860975") */
  code?: string;
  /** Human-readable display (e.g., "Metformin 500mg") */
  display?: string;
}
