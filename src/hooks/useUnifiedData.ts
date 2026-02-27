// -----------------------------------------------------------
// useUnifiedData — Orchestrates multi-source merge pipeline
// -----------------------------------------------------------
// This is the single hook that all Phase 4+ UI components use.
// It wires together:
//   1. useEpicData()     → live FHIR data from Epic sandbox
//   2. usePatient()      → patient demographics for matching
//   3. syntheticSource   → Community MC synthetic data
//   4. patientMatcher    → confirms same patient across systems
//   5. mergeEngine       → deduplicates and unifies
//   6. conflictDetector  → finds cross-system safety issues
//
// RESILIENCE:
//   - Either source can fail without breaking the other
//   - If patient match fails, synthetic data is excluded (safety)
//   - All errors are captured, never thrown to UI
//
// PERFORMANCE:
//   - Module-level cache for the merge result
//   - Only re-merges when source data changes
//   - Synthetic data loads in parallel with Epic fetch
// -----------------------------------------------------------

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useEpicData } from "./useEpicData";
import { usePatient } from "./usePatient";
import { fetchSyntheticData, clearSyntheticCache } from "../sources/syntheticSource";
import { matchPatients } from "../sources/patientMatcher";
import { mergeAllDomains } from "../sources/mergeEngine";
import { detectAllConflicts } from "../sources/conflictDetector";
import { parsePatient } from "../utils/patientParser";
import { communityMCPatient } from "../data/synthetic/communityMC/patient";
import type {
  MergedMedication,
  MergedLabResult,
  MergedVital,
  MergedAllergy,
  MergedCondition,
  MergedImmunization,
  MergedEncounter,
  Conflict,
  SourceSummary,
} from "../types/merged";
import type { MergeInput } from "../sources/mergeEngine";
import type { SyntheticDataResult } from "../sources/syntheticSource";
import type { SourceTag } from "../types/source";

// -----------------------------------------------------------
// Hook return type
// -----------------------------------------------------------

export interface UnifiedDataResult {
  /** Merged + deduplicated medications from all sources */
  medications: MergedMedication[];
  /** Merged + deduplicated lab results from all sources */
  labResults: MergedLabResult[];
  /** Merged + deduplicated vitals from all sources */
  vitals: MergedVital[];
  /** Merged + deduplicated allergies (absence markers filtered) */
  allergies: MergedAllergy[];
  /** Merged + deduplicated conditions from all sources */
  conditions: MergedCondition[];
  /** Merged + deduplicated immunizations from all sources */
  immunizations: MergedImmunization[];
  /** All encounters chronologically sorted (no dedup) */
  encounters: MergedEncounter[];
  /** Clinically meaningful conflicts between sources */
  conflicts: Conflict[];
  /** Per-source record counts for UI display */
  sourceSummary: SourceSummary[];
  /** Whether the patient was confirmed across systems */
  patientMatchConfidence: number;
  /** Loading state */
  isLoading: boolean;
  /** Global error (only if everything failed) */
  error: string | null;
  /** Per-stage status for debugging */
  stageStatus: StageStatus;
  /** Force full refetch from all sources */
  refetch: () => void;
}

export interface StageStatus {
  epic: "loading" | "success" | "error" | "skipped";
  synthetic: "loading" | "success" | "error" | "skipped";
  patientMatch: "pending" | "confirmed" | "rejected" | "skipped";
  merge: "pending" | "complete" | "error";
  conflicts: "pending" | "complete" | "error";
}

// -----------------------------------------------------------
// Module-level cache
// -----------------------------------------------------------

interface UnifiedCache {
  medications: MergedMedication[];
  labResults: MergedLabResult[];
  vitals: MergedVital[];
  allergies: MergedAllergy[];
  conditions: MergedCondition[];
  immunizations: MergedImmunization[];
  encounters: MergedEncounter[];
  conflicts: Conflict[];
  sourceSummary: SourceSummary[];
  patientMatchConfidence: number;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cache: UnifiedCache | null = null;

function isCacheValid(): boolean {
  return cache !== null && (Date.now() - cache.timestamp) < CACHE_TTL_MS;
}

// Stable empty default — module-level so the same reference is reused
const EMPTY_UNIFIED: UnifiedCache = {
  medications: [],
  labResults: [],
  vitals: [],
  allergies: [],
  conditions: [],
  immunizations: [],
  encounters: [],
  conflicts: [],
  sourceSummary: [],
  patientMatchConfidence: 0,
  timestamp: 0,
};

// -----------------------------------------------------------
// Helper: Build source summary
// -----------------------------------------------------------

function buildSourceSummary(sources: Array<{ tag: SourceTag; data: MergeInput }>): SourceSummary[] {
  return sources.map(({ tag, data }) => ({
    source: tag,
    counts: {
      medications: data.medications.length,
      labResults: data.labResults.length,
      vitals: data.vitals.length,
      allergies: data.allergies.length,
      conditions: data.conditions.length,
      immunizations: data.immunizations.length,
      encounters: data.encounters.length,
      total:
        data.medications.length +
        data.labResults.length +
        data.vitals.length +
        data.allergies.length +
        data.conditions.length +
        data.immunizations.length +
        data.encounters.length,
    },
  }));
}

// -----------------------------------------------------------
// Hook
// -----------------------------------------------------------

export function useUnifiedData(): UnifiedDataResult {
  const epicData = useEpicData();
  const { patient: epicPatient, isLoading: patientLoading } = usePatient();

  // State
  const [result, setResult] = useState<UnifiedCache | null>(cache);
  const [isLoading, setIsLoading] = useState(!isCacheValid());
  const [error, setError] = useState<string | null>(null);
  const [stageStatus, setStageStatus] = useState<StageStatus>({
    epic: "loading",
    synthetic: "loading",
    patientMatch: "pending",
    merge: "pending",
    conflicts: "pending",
  });
  const [fetchKey, setFetchKey] = useState(0);

  // Prevent double-execution in React strict mode
  const mergeInProgress = useRef(false);

  useEffect(() => {
    // Wait for Epic data + patient demographics to finish loading
    if (epicData.isLoading || patientLoading) return;
    if (mergeInProgress.current) return;

    // Use cache if valid (and not a forced refetch)
    if (isCacheValid() && fetchKey === 0) {
      setIsLoading(false);
      return;
    }

    mergeInProgress.current = true;
    setIsLoading(true);
    setError(null);

    const runMergePipeline = async () => {
      const stages: StageStatus = {
        epic: "loading",
        synthetic: "loading",
        patientMatch: "pending",
        merge: "pending",
        conflicts: "pending",
      };

      try {
        // --- Stage 1: Collect source data ---
        const sourcesForMerge: Array<{ tag: SourceTag; data: MergeInput }> = [];

        // Epic data (already fetched by useEpicData)
        const epicSource: SourceTag = {
          systemName: "Epic MyHealth",
          systemId: "epic-sandbox",
          fetchedAt: new Date().toISOString(),
        };

        if (epicData.error && epicData.medications.length === 0) {
          stages.epic = "error";
          if (import.meta.env.DEV) {
            console.warn("[UnifiedData] Epic data fetch failed:", epicData.error);
          }
        } else {
          stages.epic = "success";
          sourcesForMerge.push({
            tag: epicSource,
            data: {
              medications: epicData.medications,
              labResults: epicData.labResults,
              vitals: epicData.vitals,
              allergies: epicData.allergies,
              conditions: epicData.conditions,
              immunizations: epicData.immunizations,
              encounters: epicData.encounters,
            },
          });
        }

        // --- Stage 2: Synthetic data + patient matching ---
        let syntheticData: SyntheticDataResult | null = null;

        try {
          syntheticData = await fetchSyntheticData();
          stages.synthetic = "success";
        } catch (synthErr) {
          stages.synthetic = "error";
          if (import.meta.env.DEV) {
            console.warn("[UnifiedData] Synthetic data fetch failed:", synthErr);
          }
        }

        // Patient matching — only include synthetic if patient matches
        let matchConfidence = 0;

        if (syntheticData && epicPatient) {
          const cmcPatient = parsePatient(communityMCPatient);

          const matchResult = matchPatients(epicPatient, cmcPatient);
          matchConfidence = matchResult.confidence;

          if (matchResult.isMatch) {
            stages.patientMatch = "confirmed";

            const cmcSource: SourceTag = {
              systemName: "Community Medical Center",
              systemId: "community-mc",
              fetchedAt: new Date().toISOString(),
            };

            sourcesForMerge.push({
              tag: cmcSource,
              data: syntheticData,
            });

            if (import.meta.env.DEV) {
              console.log(
                `[UnifiedData] Patient match CONFIRMED: ` +
                  `${epicPatient.fullName} ↔ ${cmcPatient.fullName} ` +
                  `(confidence: ${matchResult.confidence.toFixed(2)}, ` +
                  `matched on: ${matchResult.matchedOn.join(", ")})`
              );
            }
          } else {
            stages.patientMatch = "rejected";
            if (import.meta.env.DEV) {
              console.warn(
                `[UnifiedData] Patient match REJECTED: ` +
                  `confidence ${matchResult.confidence.toFixed(2)} < 0.8 threshold. ` +
                  `Synthetic data will NOT be included.`
              );
            }
          }
        } else {
          stages.patientMatch = epicPatient ? "skipped" : "pending";
          if (!epicPatient && import.meta.env.DEV) {
            console.warn("[UnifiedData] No Epic patient loaded — skipping patient match");
          }
        }

        // --- Stage 3: Merge ---
        if (sourcesForMerge.length === 0) {
          // No data from any source
          stages.merge = "error";
          stages.conflicts = "error";
          setError("No health data available from any source.");
          setStageStatus(stages);
          setIsLoading(false);
          mergeInProgress.current = false;
          return;
        }

        const mergeResult = mergeAllDomains(sourcesForMerge.map((s) => s.data));
        stages.merge = "complete";

        // --- Stage 4: Conflict detection ---
        const detectedConflicts = detectAllConflicts(mergeResult);
        stages.conflicts = "complete";

        // --- Stage 5: Build source summary ---
        const sourceSummary = buildSourceSummary(sourcesForMerge);

        // --- Cache and set result ---
        const unified: UnifiedCache = {
          medications: mergeResult.medications,
          labResults: mergeResult.labResults,
          vitals: mergeResult.vitals,
          allergies: mergeResult.allergies,
          conditions: mergeResult.conditions,
          immunizations: mergeResult.immunizations,
          encounters: mergeResult.encounters,
          conflicts: detectedConflicts,
          sourceSummary,
          patientMatchConfidence: matchConfidence,
          timestamp: Date.now(),
        };

        cache = unified;
        setResult(unified);
        setStageStatus(stages);

        if (import.meta.env.DEV) {
          console.log("[UnifiedData] Pipeline complete:");
          console.log(`  Sources: ${sourcesForMerge.map((s) => s.tag.systemName).join(", ")}`);
          console.log(`  Patient match: ${stages.patientMatch} (${matchConfidence.toFixed(2)})`);
          console.log(`  Medications: ${mergeResult.medications.length}`);
          console.log(`  Lab Results: ${mergeResult.labResults.length}`);
          console.log(`  Vitals:      ${mergeResult.vitals.length}`);
          console.log(`  Allergies:   ${mergeResult.allergies.length}`);
          console.log(`  Conditions:  ${mergeResult.conditions.length}`);
          console.log(`  Immunizations: ${mergeResult.immunizations.length}`);
          console.log(`  Encounters:  ${mergeResult.encounters.length}`);
          console.log(`  Conflicts:   ${detectedConflicts.length}`);
          console.log(`  Source summary:`, sourceSummary);
        }
      } catch (err) {
        console.error("[UnifiedData] Unexpected pipeline error:", err);
        setError("An unexpected error occurred while processing health data.");
        setStageStatus((prev) => ({ ...prev, merge: "error", conflicts: "error" }));
      } finally {
        setIsLoading(false);
        mergeInProgress.current = false;
      }
    };

    runMergePipeline();
  }, [
    epicData.isLoading,
    patientLoading,
    epicData.medications,
    epicData.labResults,
    epicData.vitals,
    epicData.allergies,
    epicData.conditions,
    epicData.immunizations,
    epicData.encounters,
    epicData.error,
    epicPatient,
    fetchKey,
  ]);

  const refetch = useCallback(() => {
    cache = null;
    clearSyntheticCache();
    epicData.refetch();
    mergeInProgress.current = false;
    setFetchKey((prev) => prev + 1);
  }, [epicData.refetch]);

  const data = result ?? EMPTY_UNIFIED;

  const combinedLoading = isLoading || epicData.isLoading || patientLoading;

  // Memoize return value so consumers get a stable reference
  // (prevents infinite re-render loops in dependent hooks)
  return useMemo<UnifiedDataResult>(() => ({
    medications: data.medications,
    labResults: data.labResults,
    vitals: data.vitals,
    allergies: data.allergies,
    conditions: data.conditions,
    immunizations: data.immunizations,
    encounters: data.encounters,
    conflicts: data.conflicts,
    sourceSummary: data.sourceSummary,
    patientMatchConfidence: data.patientMatchConfidence,
    isLoading: combinedLoading,
    error,
    stageStatus,
    refetch,
  }), [data, combinedLoading, error, stageStatus, refetch]);
}
