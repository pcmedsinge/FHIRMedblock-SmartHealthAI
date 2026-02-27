// -----------------------------------------------------------
// Merged Types — Cross-system unified records + conflict model
// -----------------------------------------------------------
// Every record that exits the merge engine carries MergeMetadata:
//   - allSources: which health systems reported this data
//   - mergeStatus: was it from one system, confirmed by two, or in conflict?
//   - mergedFromIds: audit trail of original record IDs
//
// The original `source` field (SourceTag) remains as the
// "primary" source for backward compatibility.
//
// DESIGN PRINCIPLE: Patient safety depends on accurate provenance.
// Every merged record MUST trace back to its original source(s).
// -----------------------------------------------------------

import type { SourceTag } from "./source";
import type { Medication } from "./medication";
import type { LabResult } from "./labResult";
import type { Vital } from "./vital";
import type { Allergy } from "./allergy";
import type { Condition } from "./condition";
import type { Immunization } from "./immunization";
import type { Encounter } from "./encounter";

// -----------------------------------------------------------
// Merge Metadata — attached to every merged record
// -----------------------------------------------------------

export interface MergeMetadata {
  /** Every source system that contributed to this record */
  allSources: SourceTag[];
  /** How this record was produced by the merge engine */
  mergeStatus: "single-source" | "confirmed" | "conflict";
  /**
   * Original FHIR resource IDs that were merged into this record.
   * Critical for audit trail — patient safety requires knowing
   * exactly which records contributed to a merged view.
   */
  mergedFromIds: string[];
}

// -----------------------------------------------------------
// Merged domain types — original type + merge metadata
// -----------------------------------------------------------
// Using intersection types so ALL existing properties remain
// accessible (backward compatible with Phase 0-2 code).

export type MergedMedication = Medication & MergeMetadata;
export type MergedLabResult = LabResult & MergeMetadata;
export type MergedVital = Vital & MergeMetadata;
export type MergedAllergy = Allergy & MergeMetadata;
export type MergedCondition = Condition & MergeMetadata;
export type MergedImmunization = Immunization & MergeMetadata;
export type MergedEncounter = Encounter & MergeMetadata;

// -----------------------------------------------------------
// Conflict Model — clinically meaningful disagreements
// -----------------------------------------------------------

/** A specific resource involved in a conflict */
export interface ConflictResource {
  /** Domain type of the resource */
  resourceType: "Medication" | "LabResult" | "Vital" | "Allergy" | "Condition" | "Immunization" | "Encounter";
  /** FHIR resource ID */
  resourceId: string;
  /** Human-readable label (drug name, test name, etc.) */
  display: string;
  /** Source system this resource came from */
  source: SourceTag;
}

export interface Conflict {
  /** Unique conflict ID for UI keying and dedup */
  id: string;
  /** Category of conflict */
  type:
    | "dose-mismatch"
    | "allergy-prescription"
    | "missing-crossref"
    | "contradictory-condition"
    | "allergy-gap";
  /**
   * Clinical severity — determines UI urgency:
   *   critical = red banner, blocks prescribing in production
   *   high     = orange alert, requires acknowledgment
   *   medium   = yellow notice, informational
   */
  severity: "critical" | "high" | "medium";
  /** Human-readable explanation for clinicians and patients */
  description: string;
  /** The records involved in this conflict */
  resources: ConflictResource[];
  /** First source in the conflict */
  sourceA: SourceTag;
  /** Second source in the conflict (may be same for internal conflicts) */
  sourceB: SourceTag;
}

// -----------------------------------------------------------
// Source Summary — per-system record counts for UI display
// -----------------------------------------------------------

export interface SourceSummary {
  /** Source system tag */
  source: SourceTag;
  /** Record counts per domain */
  counts: {
    medications: number;
    labResults: number;
    vitals: number;
    allergies: number;
    conditions: number;
    immunizations: number;
    encounters: number;
    total: number;
  };
}
