// -----------------------------------------------------------
// AI Engine — Barrel Export & Tier 1 Orchestrator
// -----------------------------------------------------------
// Single entry point for the AI analysis engine.
// Phase 6 UI components import from here.
//
// USAGE:
//   import { runTier1Analysis, isAIAvailable } from "../ai";
//   const tier1 = runTier1Analysis(patient, unifiedData);
// -----------------------------------------------------------

// --- Service ---
export { isAIAvailable, getAIConfig, clearAICache, callLLM, callLLMSafe } from "./aiService";

// --- Guardrails ---
export { applyGuardrails, getDisclaimer, getProviderCTA, LLM_SYSTEM_GUARDRAIL } from "./guardrails";

// --- Types (re-export for convenience) ---
export type {
  LabAbnormalFlag,
  LabTrend,
  CareGap,
  DrugInteraction,
  SourceConflictAlert,
  VitalCorrelation,
  Tier1Results,
  HealthInsight,
  CachedNarrative,
  Tier2Results,
  HealthExplanation,
  DoctorQuestions,
  GuardedAIOutput,
} from "./types";

// --- Tier 1 Rules ---
export { analyzeLabAbnormalFlags } from "./rules/labAbnormalFlags";
export { analyzeLabTrends } from "./rules/labTrendDirection";
export { detectCareGaps } from "./rules/careGapRules";
export { detectDrugInteractions } from "./rules/drugInteractions";
export { generateSourceConflictAlerts } from "./rules/sourceConflicts";
export { detectVitalMedCorrelations } from "./rules/vitalMedCorrelation";

// --- Tier 2 Cached LLM ---
export { generateLabTrendNarrative } from "./llm/labTrendNarrative";
export { generateHealthSnapshot } from "./llm/healthSnapshot";
export { generateMedicationSummary } from "./llm/medicationSummary";

// --- Tier 3 On-Demand LLM ---
export { explainHealthResource } from "./llm/healthExplainer";
export {
  generateDoctorQuestions,
  labQuestionContext,
  conditionQuestionContext,
  medicationQuestionContext,
  insightQuestionContext,
} from "./llm/doctorQuestions";

// --- Tier 3 On-Demand LLM: Pre-Visit Report ---
export { generatePreVisitNarrative } from "./llm/reportNarrative";
export type { PreVisitNarrative, ReportInputData } from "./llm/reportNarrative";

// --- Report Assembly (pure function) ---
export { assemblePreVisitReport } from "./preVisitReport";
export type { PreVisitReport } from "./preVisitReport";

// -----------------------------------------------------------
// Tier 1 Orchestrator — runs all rule-based analysis
// -----------------------------------------------------------

import type { PatientDemographics } from "../types/patient";
import type {
  MergedMedication,
  MergedLabResult,
  MergedVital,
  MergedAllergy,
  MergedCondition,
  MergedImmunization,
  MergedEncounter,
  Conflict,
} from "../types/merged";
import type { Tier1Results } from "./types";
import { analyzeLabAbnormalFlags } from "./rules/labAbnormalFlags";
import { analyzeLabTrends } from "./rules/labTrendDirection";
import { detectCareGaps } from "./rules/careGapRules";
import { detectDrugInteractions } from "./rules/drugInteractions";
import { generateSourceConflictAlerts } from "./rules/sourceConflicts";
import { detectVitalMedCorrelations } from "./rules/vitalMedCorrelation";

export interface UnifiedDataForAI {
  medications: MergedMedication[];
  labResults: MergedLabResult[];
  vitals: MergedVital[];
  allergies: MergedAllergy[];
  conditions: MergedCondition[];
  immunizations: MergedImmunization[];
  encounters: MergedEncounter[];
  conflicts: Conflict[];
}

/**
 * Run all Tier 1 (rule-based) analysis.
 * This is synchronous, instant, and costs $0.
 * Call this on every page load — it's free.
 */
export function runTier1Analysis(
  patient: PatientDemographics,
  data: UnifiedDataForAI
): Tier1Results {
  const labFlags = analyzeLabAbnormalFlags(data.labResults);
  const labTrends = analyzeLabTrends(data.labResults);
  const careGaps = detectCareGaps({
    patient,
    conditions: data.conditions,
    immunizations: data.immunizations,
    encounters: data.encounters,
    labResults: data.labResults,
    vitals: data.vitals,
  });
  const drugInteractions = detectDrugInteractions(data.medications);
  const sourceConflictAlerts = generateSourceConflictAlerts(data.conflicts);
  const vitalCorrelations = detectVitalMedCorrelations(
    data.vitals,
    data.medications,
    data.conditions
  );

  return {
    labFlags,
    labTrends,
    careGaps,
    drugInteractions,
    sourceConflictAlerts,
    vitalCorrelations,
    analyzedAt: new Date().toISOString(),
  };
}
