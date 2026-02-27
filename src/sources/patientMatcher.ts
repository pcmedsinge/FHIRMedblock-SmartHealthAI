// -----------------------------------------------------------
// Patient Matcher — Links patients across health systems
// -----------------------------------------------------------
// For the demo, we control both sides so matching is exact.
// But the interface is designed for future probabilistic matching
// (e.g., Levenshtein distance on names, fuzzy DOB matching).
//
// The matcher confirms that the synthetic Community MC patient
// is the SAME person as the Epic patient before merging data.
// -----------------------------------------------------------

import type { PatientDemographics } from "../types/patient";

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

export interface MatchResult {
  /** Whether the patients are the same person */
  isMatch: boolean;
  /** Confidence score: 0 (no match) to 1 (certain match) */
  confidence: number;
  /** Which fields matched */
  matchedOn: string[];
  /** Which fields did NOT match (for conflict resolution) */
  conflicts: string[];
}

export interface PatientMatcher {
  match(
    epicPatient: PatientDemographics,
    candidatePatient: PatientDemographics
  ): MatchResult;
}

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

/** Normalize a name for comparison: lowercase, trim, remove accents */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z\s]/g, ""); // strip non-alpha except spaces
}

/** Compare two date strings (YYYY-MM-DD format) */
function datesMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return a === b;
}

/** Compare genders */
function gendersMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

// -----------------------------------------------------------
// Default Matcher Implementation
// -----------------------------------------------------------

/**
 * Deterministic patient matcher.
 * Matching rules:
 *   - Last name match = +0.3
 *   - First name match = +0.3
 *   - DOB match = +0.3
 *   - Gender match = +0.1
 *
 * Threshold: confidence >= 0.8 = match
 *
 * Future: Could be replaced with probabilistic matching
 * (cosine similarity, edit distance, ML model)
 */
export const defaultMatcher: PatientMatcher = {
  match(
    epicPatient: PatientDemographics,
    candidatePatient: PatientDemographics
  ): MatchResult {
    let confidence = 0;
    const matchedOn: string[] = [];
    const conflicts: string[] = [];

    // Last name comparison
    const epicLast = normalizeName(epicPatient.lastName);
    const candidateLast = normalizeName(candidatePatient.lastName);
    if (epicLast && candidateLast && epicLast === candidateLast) {
      confidence += 0.3;
      matchedOn.push("lastName");
    } else if (epicLast && candidateLast) {
      conflicts.push(`lastName: "${epicPatient.lastName}" vs "${candidatePatient.lastName}"`);
    }

    // First name comparison
    const epicFirst = normalizeName(epicPatient.firstName);
    const candidateFirst = normalizeName(candidatePatient.firstName);
    if (epicFirst && candidateFirst && epicFirst === candidateFirst) {
      confidence += 0.3;
      matchedOn.push("firstName");
    } else if (epicFirst && candidateFirst) {
      conflicts.push(`firstName: "${epicPatient.firstName}" vs "${candidatePatient.firstName}"`);
    }

    // DOB comparison
    if (datesMatch(epicPatient.birthDate, candidatePatient.birthDate)) {
      confidence += 0.3;
      matchedOn.push("birthDate");
    } else if (epicPatient.birthDate && candidatePatient.birthDate) {
      conflicts.push(`birthDate: "${epicPatient.birthDate}" vs "${candidatePatient.birthDate}"`);
    }

    // Gender comparison
    if (gendersMatch(epicPatient.gender, candidatePatient.gender)) {
      confidence += 0.1;
      matchedOn.push("gender");
    } else if (epicPatient.gender && candidatePatient.gender) {
      conflicts.push(`gender: "${epicPatient.gender}" vs "${candidatePatient.gender}"`);
    }

    // Note: MRNs will ALWAYS differ across systems — that's expected
    // We don't penalize for different MRNs

    const isMatch = confidence >= 0.8;

    if (import.meta.env.DEV) {
      console.log(
        `[PatientMatcher] ${epicPatient.fullName} ↔ ${candidatePatient.fullName}: ` +
          `confidence=${confidence.toFixed(2)}, match=${isMatch}, ` +
          `on=[${matchedOn.join(", ")}], conflicts=[${conflicts.join(", ")}]`
      );
    }

    return {
      isMatch,
      confidence: Math.min(confidence, 1), // cap at 1.0
      matchedOn,
      conflicts,
    };
  },
};

/**
 * Convenience function: match and return result for the typical case.
 */
export function matchPatients(
  epicPatient: PatientDemographics,
  candidatePatient: PatientDemographics
): MatchResult {
  return defaultMatcher.match(epicPatient, candidatePatient);
}
