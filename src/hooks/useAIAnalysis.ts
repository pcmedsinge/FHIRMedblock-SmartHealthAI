// -----------------------------------------------------------
// useAIAnalysis — Orchestrates AI analysis for all pages
// -----------------------------------------------------------
// Manages the three AI tiers:
//   Tier 1: Runs synchronously on every render (free, instant)
//   Tier 2: Runs async on first load, cached thereafter
//   Tier 3: Triggered on-demand by user clicks
//
// PATTERN:
//   const ai = useAIAnalysis(patient, unifiedData);
//   ai.tier1.drugInteractions   // always available
//   ai.tier2.healthSnapshot     // loading → available
//   ai.askAI(resource)          // on-demand Tier 3
// -----------------------------------------------------------

import { useEffect, useState, useCallback, useRef } from "react";
import type { PatientDemographics } from "../types/patient";
import type { UnifiedDataResult } from "./useUnifiedData";
import type {
  Tier1Results,
  HealthInsight,
  CachedNarrative,
  HealthExplanation,
  DoctorQuestions,
} from "../ai/types";
import {
  runTier1Analysis,
  generateHealthSnapshot,
  generateLabTrendNarrative,
  generateMedicationSummary,
  explainHealthResource,
  generateDoctorQuestions,
  medicationQuestionContext,
  isAIAvailable,
  getDisclaimer,
} from "../ai";
import type { MergedLabResult, MergedCondition, MergedMedication } from "../types/merged";

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

export interface AIAnalysisResult {
  /** Tier 1: Always available (synchronous, free) */
  tier1: Tier1Results | null;

  /** Tier 2: Async LLM results (cached) */
  tier2: {
    healthSnapshot: HealthInsight[];
    labTrendNarrative: CachedNarrative | null;
    medicationSummary: CachedNarrative | null;
    isLoading: boolean;
    error: string | null;
  };

  /** Tier 3: On-demand results keyed by resource ID */
  explanations: Map<string, HealthExplanation>;
  doctorQuestions: DoctorQuestions | null;

  /** Actions */
  askAI: (resource: MergedLabResult | MergedCondition | MergedMedication) => Promise<void>;
  askDoctorAboutMeds: () => Promise<void>;

  /** Loading states for Tier 3 */
  explainLoading: string | null;
  doctorQuestionsLoading: boolean;

  /** Whether AI (LLM) is available */
  aiAvailable: boolean;

  /** Disclaimer text */
  disclaimer: string;
}

// -----------------------------------------------------------
// Default Tier 1 (empty)
// -----------------------------------------------------------

const EMPTY_TIER1: Tier1Results = {
  labFlags: [],
  labTrends: [],
  careGaps: [],
  drugInteractions: [],
  sourceConflictAlerts: [],
  vitalCorrelations: [],
  analyzedAt: "",
};

// -----------------------------------------------------------
// Hook
// -----------------------------------------------------------

export function useAIAnalysis(
  patient: PatientDemographics | null,
  unified: UnifiedDataResult | null
): AIAnalysisResult {
  // Tier 1 — synchronous
  const [tier1, setTier1] = useState<Tier1Results | null>(null);

  // Tier 2 — async
  const [healthSnapshot, setHealthSnapshot] = useState<HealthInsight[]>([]);
  const [labTrendNarrative, setLabTrendNarrative] = useState<CachedNarrative | null>(null);
  const [medicationSummary, setMedicationSummary] = useState<CachedNarrative | null>(null);
  const [tier2Loading, setTier2Loading] = useState(false);
  const [tier2Error, setTier2Error] = useState<string | null>(null);

  // Tier 3 — on-demand
  const [explanations, setExplanations] = useState<Map<string, HealthExplanation>>(new Map());
  const [doctorQuestions, setDoctorQuestions] = useState<DoctorQuestions | null>(null);
  const [explainLoading, setExplainLoading] = useState<string | null>(null);
  const [doctorQuestionsLoading, setDoctorQuestionsLoading] = useState(false);

  // Prevent double-runs in strict mode
  const tier2RanRef = useRef(false);

  // -----------------------------------------------------------
  // Tier 1: Run on every data change (free)
  // -----------------------------------------------------------
  // Use individual array refs as deps — the unified object itself
  // may be a new reference even when the data hasn't changed.
  const uMeds      = unified?.medications;
  const uLabs      = unified?.labResults;
  const uVitals    = unified?.vitals;
  const uAllergies = unified?.allergies;
  const uConditions = unified?.conditions;
  const uImmunizations = unified?.immunizations;
  const uEncounters = unified?.encounters;
  const uConflicts = unified?.conflicts;
  const uLoading   = unified?.isLoading ?? true;

  useEffect(() => {
    if (!patient || !unified || uLoading) {
      setTier1(null);
      return;
    }

    const result = runTier1Analysis(patient, {
      medications: unified.medications,
      labResults: unified.labResults,
      vitals: unified.vitals,
      allergies: unified.allergies,
      conditions: unified.conditions,
      immunizations: unified.immunizations,
      encounters: unified.encounters,
      conflicts: unified.conflicts,
    });

    setTier1(result);
  }, [patient, uMeds, uLabs, uVitals, uAllergies, uConditions, uImmunizations, uEncounters, uConflicts, uLoading]);

  // -----------------------------------------------------------
  // Tier 2: Run async once when Tier 1 is ready
  // -----------------------------------------------------------
  useEffect(() => {
    if (!patient || !unified || uLoading || !tier1 || tier2RanRef.current) return;
    if (!isAIAvailable()) {
      // No API key — skip Tier 2 silently
      return;
    }

    tier2RanRef.current = true;
    setTier2Loading(true);
    setTier2Error(null);

    const runTier2 = async () => {
      try {
        // Run all Tier 2 calls in parallel
        const [snapshot, labNarr, medSummary] = await Promise.all([
          generateHealthSnapshot(patient, tier1, unified.conflicts),
          generateLabTrendNarrative(
            patient,
            unified.labResults,
            tier1.labTrends,
            tier1.labFlags
          ),
          generateMedicationSummary(
            patient,
            unified.medications,
            tier1.drugInteractions
          ),
        ]);

        setHealthSnapshot(snapshot);
        setLabTrendNarrative(labNarr);
        setMedicationSummary(medSummary);
      } catch (err) {
        console.error("[AI Tier 2] Error:", err);
        setTier2Error(err instanceof Error ? err.message : "AI analysis failed");
      } finally {
        setTier2Loading(false);
      }
    };

    runTier2();
  }, [patient, uLoading, tier1]);

  // -----------------------------------------------------------
  // Tier 3: Ask AI about a specific resource
  // -----------------------------------------------------------
  const askAI = useCallback(
    async (resource: MergedLabResult | MergedCondition | MergedMedication) => {
      // If already explained, don't re-fetch
      if (explanations.has(resource.id)) return;

      setExplainLoading(resource.id);
      try {
        const result = await explainHealthResource(resource);
        if (result) {
          setExplanations((prev) => {
            const next = new Map(prev);
            next.set(resource.id, result);
            return next;
          });
        }
      } catch (err) {
        console.error("[AI Tier 3] Explain error:", err);
      } finally {
        setExplainLoading(null);
      }
    },
    [explanations]
  );

  // -----------------------------------------------------------
  // Tier 3: Ask doctor questions about medications
  // -----------------------------------------------------------
  const askDoctorAboutMeds = useCallback(async () => {
    if (doctorQuestions || !unified) return;

    setDoctorQuestionsLoading(true);
    try {
      // Build context from all active medications
      const activeMeds = unified.medications.filter((m) => m.status === "active");
      if (activeMeds.length === 0) return;

      // Use the first active med as primary context, include all insights
      const context = medicationQuestionContext(activeMeds[0], healthSnapshot);
      // Enrich detail with all meds
      context.detail = `Active medications: ${activeMeds.map((m) => `${m.name} (${m.dosageInstruction ?? "no dosage info"})`).join("; ")}. ${context.detail}`;

      const result = await generateDoctorQuestions(context);
      if (result) {
        setDoctorQuestions(result);
      }
    } catch (err) {
      console.error("[AI Tier 3] Doctor questions error:", err);
    } finally {
      setDoctorQuestionsLoading(false);
    }
  }, [doctorQuestions, unified, healthSnapshot]);

  return {
    tier1,
    tier2: {
      healthSnapshot,
      labTrendNarrative,
      medicationSummary,
      isLoading: tier2Loading,
      error: tier2Error,
    },
    explanations,
    doctorQuestions,
    askAI,
    askDoctorAboutMeds,
    explainLoading,
    doctorQuestionsLoading,
    aiAvailable: isAIAvailable(),
    disclaimer: getDisclaimer(),
  };
}
