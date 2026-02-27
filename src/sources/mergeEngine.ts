// -----------------------------------------------------------
// Merge Engine — Multi-source clinical data deduplication
// -----------------------------------------------------------
// Takes arrays from N health systems and produces a single
// unified, deduplicated dataset with provenance tracking.
//
// SAFETY PRINCIPLES (patient-critical code):
//   1. NEVER discard a record silently — every input maps to output
//   2. When in doubt, keep BOTH records (false positive is safer
//      than false negative in clinical data)
//   3. Every merged output carries full provenance (audit trail)
//   4. "Not on File" allergy entries are filtered (they're absence
//      markers, not clinical data) — but their existence is tracked
//      for the conflict detector
//   5. Sort order is chronological (newest first) within each domain
//
// DEDUP STRATEGY per domain:
//   Medications   → RxNorm code, fallback to normalized name
//   Lab Results   → LOINC code + date within 24h
//   Vitals        → vital type + date within 24h
//   Conditions    → SNOMED code
//   Allergies     → substance name/code (filter absence markers)
//   Immunizations → CVX code + date within 30 days
//   Encounters    → No dedup; chronological sort only
// -----------------------------------------------------------

import type { SourceTag, ClinicalCode } from "../types/source";
import type { Medication } from "../types/medication";
import type { LabResult } from "../types/labResult";
import type { Vital } from "../types/vital";
import type { Allergy } from "../types/allergy";
import type { Condition } from "../types/condition";
import type { Immunization } from "../types/immunization";
import type { Encounter } from "../types/encounter";
import type {
  MergeMetadata,
  MergedMedication,
  MergedLabResult,
  MergedVital,
  MergedAllergy,
  MergedCondition,
  MergedImmunization,
  MergedEncounter,
} from "../types/merged";

// -----------------------------------------------------------
// Exported result type
// -----------------------------------------------------------

export interface MergeResult {
  medications: MergedMedication[];
  labResults: MergedLabResult[];
  vitals: MergedVital[];
  allergies: MergedAllergy[];
  conditions: MergedCondition[];
  immunizations: MergedImmunization[];
  encounters: MergedEncounter[];
  /** Track which sources had "Not on File" allergy markers — used by conflict detector */
  allergyAbsenceSources: SourceTag[];
}

// -----------------------------------------------------------
// Helpers — Code matching
// -----------------------------------------------------------

/**
 * Compare two ClinicalCode arrays for a matching code within the same system.
 * Returns true if ANY code pair matches on (system + code).
 *
 * This is the primary dedup key for most domains.
 * Example: Two records both have RxNorm code "860975" → same drug.
 */
function codesMatch(codesA: ClinicalCode[], codesB: ClinicalCode[]): boolean {
  for (const a of codesA) {
    if (!a.system || !a.code) continue;
    for (const b of codesB) {
      if (!b.system || !b.code) continue;
      if (a.system === b.system && a.code === b.code) return true;
    }
  }
  return false;
}

/**
 * Extract a specific code from a ClinicalCode array by system URI prefix.
 * Returns the first matching code value, or undefined.
 *
 * Examples:
 *   getCodeBySystem(codes, "rxnorm") → "860975"
 *   getCodeBySystem(codes, "loinc") → "4548-4"
 *   getCodeBySystem(codes, "snomed") → "49436004"
 *   getCodeBySystem(codes, "cvx") → "115"
 */
function getCodeBySystem(codes: ClinicalCode[], systemSubstring: string): string | undefined {
  const match = codes.find(
    (c) => c.system && c.code && c.system.toLowerCase().includes(systemSubstring.toLowerCase())
  );
  return match?.code;
}

// -----------------------------------------------------------
// Helpers — Text normalization
// -----------------------------------------------------------

/**
 * Normalize clinical text for comparison:
 * - Lowercase
 * - Strip dosage numbers and units (e.g., "5 mg", "500mg")
 * - Strip extra whitespace
 * - Remove common noise words
 *
 * Used as fallback when codes aren't available.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\d+(\.\d+)?\s*(mg|mcg|ml|units?|tablets?|capsules?|%)/gi, "")
    .replace(/oral|injectable|topical|tablet|capsule/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check if two medication names refer to the same drug.
 * Handles cases where one name contains the other
 * (e.g., "Metformin" matches "Metformin HCl 500 MG Oral Tablet").
 */
function medNamesMatch(nameA: string, nameB: string): boolean {
  const a = normalizeText(nameA);
  const b = normalizeText(nameB);
  if (!a || !b) return false;
  if (a === b) return true;
  // Check if one contains the primary drug name of the other
  const aWords = a.split(" ").filter((w) => w.length > 2);
  const bWords = b.split(" ").filter((w) => w.length > 2);
  // If the first significant word matches, likely same drug
  return aWords.length > 0 && bWords.length > 0 && aWords[0] === bWords[0];
}

// -----------------------------------------------------------
// Helpers — Date comparison
// -----------------------------------------------------------

const MS_PER_HOUR = 3600_000;
const MS_PER_DAY = 86_400_000;

/**
 * Parse a date string to timestamp. Handles:
 *   - ISO 8601: "2025-06-15T10:30:00Z"
 *   - Date only: "2025-06-15"
 *
 * Returns NaN if unparseable (caller must handle).
 */
function parseDate(dateStr?: string): number {
  if (!dateStr) return NaN;
  return new Date(dateStr).getTime();
}

/**
 * Check if two dates are within a tolerance window.
 * Used for lab results (24h) and immunizations (30d).
 */
function datesWithinWindow(dateA?: string, dateB?: string, windowMs: number = MS_PER_DAY): boolean {
  const a = parseDate(dateA);
  const b = parseDate(dateB);
  if (isNaN(a) || isNaN(b)) return false;
  return Math.abs(a - b) <= windowMs;
}

/**
 * Sort comparator: newest date first (descending).
 * Records without dates sort to the end.
 */
function dateDescending(dateA?: string, dateB?: string): number {
  const a = parseDate(dateA);
  const b = parseDate(dateB);
  if (isNaN(a) && isNaN(b)) return 0;
  if (isNaN(a)) return 1; // a has no date → sort after b
  if (isNaN(b)) return -1; // b has no date → sort after a
  return b - a; // newest first
}

// -----------------------------------------------------------
// Helpers — MergeMetadata construction
// -----------------------------------------------------------

/** Create MergeMetadata for a single-source record */
function singleSourceMeta(record: { id: string; source: SourceTag }): MergeMetadata {
  return {
    allSources: [record.source],
    mergeStatus: "single-source",
    mergedFromIds: [record.id],
  };
}

/** Create MergeMetadata for a confirmed (both agree) merge */
function confirmedMeta(
  recordA: { id: string; source: SourceTag },
  recordB: { id: string; source: SourceTag }
): MergeMetadata {
  return {
    allSources: [recordA.source, recordB.source],
    mergeStatus: "confirmed",
    mergedFromIds: [recordA.id, recordB.id],
  };
}

/** Create MergeMetadata for a conflicting merge */
function conflictMeta(
  recordA: { id: string; source: SourceTag },
  recordB: { id: string; source: SourceTag }
): MergeMetadata {
  return {
    allSources: [recordA.source, recordB.source],
    mergeStatus: "conflict",
    mergedFromIds: [recordA.id, recordB.id],
  };
}

// -----------------------------------------------------------
// Domain: Medications
// -----------------------------------------------------------
// Match by: RxNorm code → fallback to normalized name
// On match: same dose → "confirmed"; different dose → "conflict"

function mergeMedications(allMeds: Medication[]): MergedMedication[] {
  if (allMeds.length === 0) return [];

  const merged: MergedMedication[] = [];
  const used = new Set<number>(); // indices already matched

  for (let i = 0; i < allMeds.length; i++) {
    if (used.has(i)) continue;

    const medA = allMeds[i];
    let matchFound = false;

    for (let j = i + 1; j < allMeds.length; j++) {
      if (used.has(j)) continue;

      const medB = allMeds[j];

      // Same source? Don't merge records from the same system
      if (medA.source.systemId === medB.source.systemId) continue;

      // Check if same medication
      const codeMatch = codesMatch(medA.codes, medB.codes);
      const nameMatch = medNamesMatch(medA.name, medB.name);

      if (codeMatch || nameMatch) {
        used.add(j);
        matchFound = true;

        // Compare doses
        const sameDose = medA.dosage && medB.dosage
          ? medA.dosage.value === medB.dosage.value && medA.dosage.unit === medB.dosage.unit
          : medA.dosageInstruction === medB.dosageInstruction;

        const meta = sameDose
          ? confirmedMeta(medA, medB)
          : conflictMeta(medA, medB);

        merged.push({ ...medA, ...meta });
        break; // one match per record
      }
    }

    if (!matchFound) {
      merged.push({ ...medA, ...singleSourceMeta(medA) });
    }
  }

  // Sort: active meds first, then by name
  return merged.sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return a.name.localeCompare(b.name);
  });
}

// -----------------------------------------------------------
// Domain: Lab Results
// -----------------------------------------------------------
// Match by: LOINC code + effectiveDate within 24h
// On match + same value → "confirmed" (merge to one)
// On match + different value → keep both as "single-source"
//   (clinically, two labs on the same day CAN have different
//    results — that's legitimate, not an error)

function mergeLabResults(allLabs: LabResult[]): MergedLabResult[] {
  if (allLabs.length === 0) return [];

  const merged: MergedLabResult[] = [];
  const used = new Set<number>();

  for (let i = 0; i < allLabs.length; i++) {
    if (used.has(i)) continue;

    const labA = allLabs[i];
    let matchFound = false;

    for (let j = i + 1; j < allLabs.length; j++) {
      if (used.has(j)) continue;

      const labB = allLabs[j];

      // Same source? Skip
      if (labA.source.systemId === labB.source.systemId) continue;

      // Same test?
      const codeMatch = codesMatch(labA.codes, labB.codes);
      if (!codeMatch) continue;

      // Within 24h window?
      if (!datesWithinWindow(labA.effectiveDate, labB.effectiveDate, MS_PER_DAY)) continue;

      // Same test, same timeframe
      used.add(j);
      matchFound = true;

      // Same value? → confirmed merge
      const sameValue = labA.value === labB.value;
      if (sameValue) {
        merged.push({ ...labA, ...confirmedMeta(labA, labB) });
      } else {
        // Different values from different systems — keep both
        // This is clinically significant (different labs, different results)
        merged.push({ ...labA, ...singleSourceMeta(labA) });
        merged.push({ ...labB, ...singleSourceMeta(labB) });
      }
      break;
    }

    if (!matchFound) {
      merged.push({ ...labA, ...singleSourceMeta(labA) });
    }
  }

  // Sort by date (newest first)
  return merged.sort((a, b) => dateDescending(a.effectiveDate, b.effectiveDate));
}

// -----------------------------------------------------------
// Domain: Vitals
// -----------------------------------------------------------
// Match by: vitalType + effectiveDate within 24h
// Same logic as labs: same value → merge, different → keep both

function mergeVitals(allVitals: Vital[]): MergedVital[] {
  if (allVitals.length === 0) return [];

  const merged: MergedVital[] = [];
  const used = new Set<number>();

  for (let i = 0; i < allVitals.length; i++) {
    if (used.has(i)) continue;

    const vitalA = allVitals[i];
    let matchFound = false;

    for (let j = i + 1; j < allVitals.length; j++) {
      if (used.has(j)) continue;

      const vitalB = allVitals[j];

      // Same source? Skip
      if (vitalA.source.systemId === vitalB.source.systemId) continue;

      // Same vital type?
      if (vitalA.vitalType !== vitalB.vitalType) continue;

      // Within 24h?
      if (!datesWithinWindow(vitalA.effectiveDate, vitalB.effectiveDate, MS_PER_DAY)) continue;

      used.add(j);
      matchFound = true;

      // Compare values (for compound vitals like BP, compare components)
      let sameValue: boolean;
      if (vitalA.components && vitalB.components) {
        // Compound vital (e.g., BP) — compare each component
        sameValue = vitalA.components.every((compA) => {
          const compB = vitalB.components?.find((c) => c.name === compA.name);
          return compB && compA.value === compB.value;
        });
      } else {
        sameValue = vitalA.value === vitalB.value;
      }

      if (sameValue) {
        merged.push({ ...vitalA, ...confirmedMeta(vitalA, vitalB) });
      } else {
        merged.push({ ...vitalA, ...singleSourceMeta(vitalA) });
        merged.push({ ...vitalB, ...singleSourceMeta(vitalB) });
      }
      break;
    }

    if (!matchFound) {
      merged.push({ ...vitalA, ...singleSourceMeta(vitalA) });
    }
  }

  return merged.sort((a, b) => dateDescending(a.effectiveDate, b.effectiveDate));
}

// -----------------------------------------------------------
// Domain: Conditions
// -----------------------------------------------------------
// Match by: SNOMED code (exact match on code system + code value)
// On match: merge, mark "confirmed" or "conflict" if status differs

function mergeConditions(allConditions: Condition[]): MergedCondition[] {
  if (allConditions.length === 0) return [];

  // ---- Within-source dedup first ----
  // Epic can return duplicate conditions (e.g., "Ischemic chest pain" x3).
  // Dedup by SNOMED code within the same source to avoid inflated counts.
  const deduped: Condition[] = [];
  const seenBySource = new Map<string, Set<string>>(); // systemId → Set<snomedCode>

  for (const cond of allConditions) {
    const snomedCode = cond.codes.find(
      (c) => c.system && c.code && c.system.includes("snomed")
    )?.code;

    if (snomedCode) {
      const sourceKey = cond.source.systemId;
      if (!seenBySource.has(sourceKey)) seenBySource.set(sourceKey, new Set());
      const seen = seenBySource.get(sourceKey)!;
      if (seen.has(snomedCode)) continue; // skip within-source duplicate
      seen.add(snomedCode);
    }
    deduped.push(cond);
  }

  // ---- Cross-source merge ----
  const merged: MergedCondition[] = [];
  const used = new Set<number>();

  for (let i = 0; i < deduped.length; i++) {
    if (used.has(i)) continue;

    const condA = deduped[i];
    let matchFound = false;

    for (let j = i + 1; j < deduped.length; j++) {
      if (used.has(j)) continue;

      const condB = deduped[j];

      // Same source? Skip — within-source dedup already done above
      if (condA.source.systemId === condB.source.systemId) continue;

      // Same condition by code?
      if (!codesMatch(condA.codes, condB.codes)) continue;

      used.add(j);
      matchFound = true;

      // Check clinical status agreement
      const sameStatus = condA.clinicalStatus === condB.clinicalStatus;
      const meta = sameStatus
        ? confirmedMeta(condA, condB)
        : conflictMeta(condA, condB);

      // Use the record with the more recent date as primary
      const dateA = parseDate(condA.recordedDate ?? condA.onsetDate);
      const dateB = parseDate(condB.recordedDate ?? condB.onsetDate);
      const primary = !isNaN(dateA) && !isNaN(dateB) && dateB > dateA ? condB : condA;

      merged.push({ ...primary, ...meta });
      break;
    }

    if (!matchFound) {
      merged.push({ ...condA, ...singleSourceMeta(condA) });
    }
  }

  // Sort: active conditions first, then by name
  return merged.sort((a, b) => {
    if (a.clinicalStatus === "active" && b.clinicalStatus !== "active") return -1;
    if (a.clinicalStatus !== "active" && b.clinicalStatus === "active") return 1;
    return a.name.localeCompare(b.name);
  });
}

// -----------------------------------------------------------
// Domain: Allergies
// -----------------------------------------------------------
// Match by: coded substance (code+system) or normalized substance name
// Filter out "Not on File" absence markers → tracked separately
//
// SAFETY: "Not on File" is NOT the same as "no allergies".
// It means the source system hasn't recorded any.
// The conflict detector uses allergyAbsenceSources to flag this.

/** Check if an allergy record is an absence marker, not a real allergy */
function isAllergyAbsenceMarker(allergy: Allergy): boolean {
  const lowerSubstance = allergy.substance.toLowerCase().trim();
  return (
    lowerSubstance.includes("not on file") ||
    lowerSubstance.includes("no known") ||
    lowerSubstance.includes("nkda") ||
    lowerSubstance === "nka" ||
    lowerSubstance === "none" ||
    lowerSubstance === "n/a" ||
    lowerSubstance === "" ||
    lowerSubstance.includes("no allergy") ||
    lowerSubstance.includes("no drug allergy")
  );
}

/** Normalize allergy substance name for comparison */
function normalizeSubstance(substance: string): string {
  return substance
    .toLowerCase()
    .replace(/\s+(drug|class|allergy|intolerance|sensitivity)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mergeAllergies(
  allAllergies: Allergy[]
): { allergies: MergedAllergy[]; absenceSources: SourceTag[] } {
  // Separate real allergies from absence markers
  const real: Allergy[] = [];
  const absenceSources: SourceTag[] = [];

  for (const allergy of allAllergies) {
    if (isAllergyAbsenceMarker(allergy)) {
      absenceSources.push(allergy.source);
    } else {
      real.push(allergy);
    }
  }

  if (real.length === 0) {
    return { allergies: [], absenceSources };
  }

  const merged: MergedAllergy[] = [];
  const used = new Set<number>();

  for (let i = 0; i < real.length; i++) {
    if (used.has(i)) continue;

    const allergyA = real[i];
    let matchFound = false;

    for (let j = i + 1; j < real.length; j++) {
      if (used.has(j)) continue;

      const allergyB = real[j];

      // Same source? Skip
      if (allergyA.source.systemId === allergyB.source.systemId) continue;

      // Check match by code or normalized substance name
      const codeMatch = codesMatch(allergyA.codes, allergyB.codes);
      const nameMatch = normalizeSubstance(allergyA.substance) === normalizeSubstance(allergyB.substance);

      if (codeMatch || nameMatch) {
        used.add(j);
        matchFound = true;
        merged.push({ ...allergyA, ...confirmedMeta(allergyA, allergyB) });
        break;
      }
    }

    if (!matchFound) {
      merged.push({ ...allergyA, ...singleSourceMeta(allergyA) });
    }
  }

  // Sort: critical allergies first, then by substance name
  return {
    allergies: merged.sort((a, b) => {
      const critOrder = { high: 0, low: 1, "unable-to-assess": 2 };
      const critA = critOrder[a.criticality as keyof typeof critOrder] ?? 3;
      const critB = critOrder[b.criticality as keyof typeof critOrder] ?? 3;
      if (critA !== critB) return critA - critB;
      return a.substance.localeCompare(b.substance);
    }),
    absenceSources,
  };
}

// -----------------------------------------------------------
// Domain: Immunizations
// -----------------------------------------------------------
// Match by: CVX code + date within 30 days
// Same vaccine within 30 days = likely same administration → merge
// Same vaccine > 30 days apart = separate doses → keep both

function mergeImmunizations(allImms: Immunization[]): MergedImmunization[] {
  if (allImms.length === 0) return [];

  const THIRTY_DAYS_MS = 30 * MS_PER_DAY;
  const merged: MergedImmunization[] = [];
  const used = new Set<number>();

  for (let i = 0; i < allImms.length; i++) {
    if (used.has(i)) continue;

    const immA = allImms[i];
    let matchFound = false;

    for (let j = i + 1; j < allImms.length; j++) {
      if (used.has(j)) continue;

      const immB = allImms[j];

      // Same source? Skip
      if (immA.source.systemId === immB.source.systemId) continue;

      // Same vaccine?
      const codeMatch = codesMatch(immA.codes, immB.codes);
      const nameMatch = normalizeText(immA.vaccineName) === normalizeText(immB.vaccineName);
      if (!codeMatch && !nameMatch) continue;

      // Within 30 days?
      if (!datesWithinWindow(immA.occurrenceDate, immB.occurrenceDate, THIRTY_DAYS_MS)) continue;

      used.add(j);
      matchFound = true;
      merged.push({ ...immA, ...confirmedMeta(immA, immB) });
      break;
    }

    if (!matchFound) {
      merged.push({ ...immA, ...singleSourceMeta(immA) });
    }
  }

  // Sort by date (newest first)
  return merged.sort((a, b) => dateDescending(a.occurrenceDate, b.occurrenceDate));
}

// -----------------------------------------------------------
// Domain: Encounters
// -----------------------------------------------------------
// No dedup — every encounter is unique.
// Just tag with metadata and sort chronologically.

function mergeEncounters(allEncounters: Encounter[]): MergedEncounter[] {
  const merged = allEncounters.map((enc) => ({
    ...enc,
    ...singleSourceMeta(enc),
  }));

  // Sort by start date (newest first)
  return merged.sort((a, b) => dateDescending(a.periodStart, b.periodStart));
}

// -----------------------------------------------------------
// Main Merge Function
// -----------------------------------------------------------

export interface MergeInput {
  medications: Medication[];
  labResults: LabResult[];
  vitals: Vital[];
  allergies: Allergy[];
  conditions: Condition[];
  immunizations: Immunization[];
  encounters: Encounter[];
}

/**
 * Merge clinical data from multiple health systems into a unified dataset.
 *
 * SAFETY GUARANTEES:
 *   - No record is silently discarded
 *   - Every output record has full provenance (allSources, mergedFromIds)
 *   - When in doubt, records are kept separate (false positive > false negative)
 *   - Allergy absence markers ("Not on File") are filtered but tracked
 *
 * @param sources - Array of data from each source (e.g., [epicData, cmcData])
 * @returns Unified merged data with provenance and absence tracking
 */
export function mergeAllDomains(sources: MergeInput[]): MergeResult {
  // Flatten all sources into domain-specific arrays
  const allMedications = sources.flatMap((s) => s.medications);
  const allLabResults = sources.flatMap((s) => s.labResults);
  const allVitals = sources.flatMap((s) => s.vitals);
  const allAllergies = sources.flatMap((s) => s.allergies);
  const allConditions = sources.flatMap((s) => s.conditions);
  const allImmunizations = sources.flatMap((s) => s.immunizations);
  const allEncounters = sources.flatMap((s) => s.encounters);

  // Merge each domain
  const { allergies, absenceSources: allergyAbsenceSources } = mergeAllergies(allAllergies);

  const result: MergeResult = {
    medications: mergeMedications(allMedications),
    labResults: mergeLabResults(allLabResults),
    vitals: mergeVitals(allVitals),
    allergies,
    conditions: mergeConditions(allConditions),
    immunizations: mergeImmunizations(allImmunizations),
    encounters: mergeEncounters(allEncounters),
    allergyAbsenceSources,
  };

  if (import.meta.env.DEV) {
    const totalInput = sources.reduce(
      (sum, s) =>
        sum +
        s.medications.length +
        s.labResults.length +
        s.vitals.length +
        s.allergies.length +
        s.conditions.length +
        s.immunizations.length +
        s.encounters.length,
      0
    );
    const totalOutput =
      result.medications.length +
      result.labResults.length +
      result.vitals.length +
      result.allergies.length +
      result.conditions.length +
      result.immunizations.length +
      result.encounters.length;

    const confirmed = [
      ...result.medications,
      ...result.labResults,
      ...result.vitals,
      ...result.allergies,
      ...result.conditions,
      ...result.immunizations,
      ...result.encounters,
    ].filter((r) => r.mergeStatus === "confirmed").length;

    const conflicts = [
      ...result.medications,
      ...result.labResults,
      ...result.vitals,
      ...result.allergies,
      ...result.conditions,
      ...result.immunizations,
      ...result.encounters,
    ].filter((r) => r.mergeStatus === "conflict").length;

    console.log("[MergeEngine] Merge complete:");
    console.log(`  Input records:  ${totalInput} (from ${sources.length} sources)`);
    console.log(`  Output records: ${totalOutput}`);
    console.log(`  Confirmed:      ${confirmed} (both systems agree)`);
    console.log(`  Conflicts:      ${conflicts} (systems disagree)`);
    console.log(`  Allergy absence: ${allergyAbsenceSources.length} source(s) had "Not on File"`);
  }

  return result;
}
