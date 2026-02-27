// -----------------------------------------------------------
// Synthetic Source Provider — Community Medical Center
// -----------------------------------------------------------
// Loads all synthetic FHIR bundles and parses them through the
// SAME parsers used for Epic data. This proves the parser pipeline
// is source-agnostic — real or synthetic data flows identically.
//
// Features:
//   - Uses Phase 1 parsers (same as Epic)
//   - Applies "Community Medical Center" source tag
//   - Simulates 500ms network delay for realistic UX
//   - Returns same typed arrays as useEpicData
// -----------------------------------------------------------

import type { Medication } from "../types/medication";
import type { LabResult } from "../types/labResult";
import type { Vital } from "../types/vital";
import type { Allergy } from "../types/allergy";
import type { Condition } from "../types/condition";
import type { Immunization } from "../types/immunization";
import type { Encounter } from "../types/encounter";
import type { SourceTag } from "../types/source";

import { parseMedicationBundle } from "../utils/medicationParser";
import { parseLabResultBundle } from "../utils/labResultParser";
import { parseVitalBundle } from "../utils/vitalParser";
import { parseAllergyBundle } from "../utils/allergyParser";
import { parseConditionBundle } from "../utils/conditionParser";
import { parseImmunizationBundle } from "../utils/immunizationParser";
import { parseEncounterBundle } from "../utils/encounterParser";

import { medicationBundle } from "../data/synthetic/communityMC/medications";
import { labResultBundle } from "../data/synthetic/communityMC/labResults";
import { vitalBundle } from "../data/synthetic/communityMC/vitals";
import { allergyBundle } from "../data/synthetic/communityMC/allergies";
import { conditionBundle } from "../data/synthetic/communityMC/conditions";
import { immunizationBundle } from "../data/synthetic/communityMC/immunizations";
import { encounterBundle } from "../data/synthetic/communityMC/encounters";

// -----------------------------------------------------------
// Source Tag
// -----------------------------------------------------------

const COMMUNITY_MC_SOURCE: SourceTag = {
  systemName: "Community Medical Center",
  systemId: "community-mc",
  fetchedAt: new Date().toISOString(),
};

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

export interface SyntheticDataResult {
  medications: Medication[];
  labResults: LabResult[];
  vitals: Vital[];
  allergies: Allergy[];
  conditions: Condition[];
  immunizations: Immunization[];
  encounters: Encounter[];
}

// -----------------------------------------------------------
// Module-level cache (same pattern as useEpicData)
// -----------------------------------------------------------

let cachedResult: SyntheticDataResult | null = null;

// -----------------------------------------------------------
// Simulated network delay (realistic UX)
// -----------------------------------------------------------

function simulateNetworkDelay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// -----------------------------------------------------------
// Main fetch function
// -----------------------------------------------------------

/**
 * Load and parse all synthetic Community Medical Center data.
 * Uses the same parsers as Epic data — proving source-agnostic pipeline.
 * Simulates 500ms network delay for realistic loading UX.
 *
 * Returns cached result on subsequent calls (instant).
 */
export async function fetchSyntheticData(): Promise<SyntheticDataResult> {
  // Return cache if available
  if (cachedResult) {
    if (import.meta.env.DEV) {
      console.log("[SyntheticSource] Returning cached Community MC data");
    }
    return cachedResult;
  }

  // Simulate network delay
  await simulateNetworkDelay(500);

  // Refresh the source tag timestamp
  const source: SourceTag = {
    ...COMMUNITY_MC_SOURCE,
    fetchedAt: new Date().toISOString(),
  };

  // Parse through the SAME parsers as Epic data
  const result: SyntheticDataResult = {
    medications: parseMedicationBundle(medicationBundle, source),
    labResults: parseLabResultBundle(labResultBundle, source),
    vitals: parseVitalBundle(vitalBundle, source),
    allergies: parseAllergyBundle(allergyBundle, source),
    conditions: parseConditionBundle(conditionBundle, source),
    immunizations: parseImmunizationBundle(immunizationBundle, source),
    encounters: parseEncounterBundle(encounterBundle, source),
  };

  // Cache the result
  cachedResult = result;

  // DEV logging — same pattern as useEpicData
  if (import.meta.env.DEV) {
    console.log("[SyntheticSource] Community Medical Center data loaded:");
    console.log(`  Medications:    ${result.medications.length}`);
    console.log(`  Lab Results:    ${result.labResults.length}`);
    console.log(`  Vitals:         ${result.vitals.length}`);
    console.log(`  Allergies:      ${result.allergies.length}`);
    console.log(`  Conditions:     ${result.conditions.length}`);
    console.log(`  Immunizations:  ${result.immunizations.length}`);
    console.log(`  Encounters:     ${result.encounters.length}`);
    console.log(
      `  TOTAL records:  ${
        result.medications.length +
        result.labResults.length +
        result.vitals.length +
        result.allergies.length +
        result.conditions.length +
        result.immunizations.length +
        result.encounters.length
      }`
    );
  }

  return result;
}

/**
 * Clear the cache to force re-parsing on next fetch.
 * Useful for dev/testing.
 */
export function clearSyntheticCache(): void {
  cachedResult = null;
}

/**
 * Get a summary of what AI stories the synthetic data enables.
 * Useful for dev console and verification.
 */
export function getSyntheticDataStories(): string[] {
  return [
    // === CRITICAL SAFETY (verified against real Epic) ===
    "🔴 ALLERGY SAFETY GAP: Epic says 'Not on File'. CMC has Penicillin ANAPHYLAXIS + Sulfa + Ibuprofen intolerance",
    "🔴 DRUG RISK: Warfarin (CMC) invisible to Epic. If Epic prescribes NSAIDs → bleeding danger",
    "🔴 PREDNISONE + DIABETES: Steroid raising blood sugar in newly diabetic patient",
    "🔴 PREDNISONE + DROSPIRENONE: Prednisone (CMC) may reduce efficacy of Epic's birth control",

    // === CROSS-SYSTEM INSIGHTS (verified against real Epic) ===
    "📈 A1c DIVERGENCE: Epic 5.1 (normal, 2019) → CMC 6.5→7.5 (diabetic, 2025-2026). Diabetes developed between systems",
    "📊 BP GAP: Epic has 90 high BP readings (avg ~142/79) with ZERO treatment. CMC started Amlodipine",
    "🏥 CARDIAC JOURNEY: Epic chest pain x3 + surgery → CMC A-fib diagnosis + Warfarin. Full story only visible merged",
    "💊 HIDDEN MEDS: 6 CMC medications invisible to Epic (Warfarin, Metformin, Amlodipine, Atorvastatin, Sumatriptan, Prednisone)",
    "🆕 HIDDEN CONDITIONS: A-fib, T2DM, Hyperlipidemia, Hypothyroidism, Migraine at CMC. Epic only knows PCOS",
    "🔵 PCOS UNKNOWN TO CMC: Epic has PCOS + drospirenone that CMC doesn't know about",

    // === TRENDS & MONITORING ===
    "📈 A1c TREND: 6.5 → 6.8 → 7.2 → 7.5 over 7 months (rising 15%)",
    "📉 CHOLESTEROL IMPROVING: Total 245→210, LDL 165→130 (atorvastatin working)",
    "🔴 INR HIGH: 2.8 → 3.5 (warfarin + prednisone interaction)",
    "📊 BP + AMLODIPINE: 158/95 → 132/80 (improving, ER spike Oct 3)",
    "⚖️ WEIGHT + PREDNISONE: 165 → 180 lbs (15lb gain post-steroid, started Nov 2025)",

    // === CARE GAPS & DEDUP ===
    "🏥 SECRET ER VISIT: Oct 3 — migraine + BP 172/102, Epic PCP doesn't know",
    "💉 TDAP REDUNDANT: CMC Oct 2024 vs Epic May 2023 — only 17 months apart (10-year schedule)",
    "💉 CARE GAP: Shingrix dose 2 overdue, Vitamin D deficiency untreated",
    "🔬 CMC-ONLY FINDINGS: TSH 4.8 (hypothyroid), Creatinine 1.2 (kidney watch)",
  ];
}
