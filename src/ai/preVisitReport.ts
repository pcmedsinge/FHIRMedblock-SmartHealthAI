// -----------------------------------------------------------
// Pre-Visit Report Assembly — Pure Data Function
// -----------------------------------------------------------
// Assembles all unified data + AI analysis into a structured
// PreVisitReport object. This is a PURE function — no hooks,
// no side effects, no state. Called once when the user wants
// to view or export their report.
//
// The report object is the contract between data and UI.
// PreVisitPage.tsx renders it; PDF export serializes it.
// -----------------------------------------------------------

import type { PatientDemographics } from "../types/patient";
import type {
  MergedMedication,
  MergedLabResult,
  MergedCondition,
  MergedAllergy,
  MergedImmunization,
  Conflict,
  SourceSummary,
} from "../types/merged";
import type {
  Tier1Results,
  DrugInteraction,
  CareGap,
  SourceConflictAlert,
  VitalCorrelation,
} from "./types";
import type { SourceTag } from "../types/source";

// -----------------------------------------------------------
// Report types
// -----------------------------------------------------------

export interface PreVisitReport {
  /** When report was assembled */
  generatedAt: string;
  /** Patient demographics */
  patient: PatientDemographics;

  /** Section 1: Medications */
  medications: {
    active: MergedMedication[];
    other: MergedMedication[];
    interactions: DrugInteraction[];
    sourceNote: string;
  };

  /** Section 2: Safety concerns (conflicts) */
  safety: {
    critical: SourceConflictAlert[];
    high: SourceConflictAlert[];
    medium: SourceConflictAlert[];
    conflicts: Conflict[];
    totalAlerts: number;
  };

  /** Section 3: Lab results */
  labs: {
    abnormal: MergedLabResult[];
    all: MergedLabResult[];
    trendSummaries: string[];
  };

  /** Section 4: Active conditions */
  conditions: MergedCondition[];

  /** Section 5: Allergies */
  allergies: MergedAllergy[];

  /** Section 6: Immunizations */
  immunizations: MergedImmunization[];

  /** Section 7: Care gaps */
  careGaps: {
    overdue: CareGap[];
    upcoming: CareGap[];
  };

  /** Section 8: Vital correlations */
  vitalCorrelations: VitalCorrelation[];

  /** Data source summary */
  dataSources: SourceSummary[];

  /** Whether AI narrative is available */
  hasAINarrative: boolean;

  /** AI-generated narrative (populated after generation) */
  aiNarrative?: string;

  /** AI-generated questions (populated after generation) */
  aiQuestions?: string[];

  /** Disclaimer text */
  disclaimer: string;
}

// -----------------------------------------------------------
// Assembly function
// -----------------------------------------------------------

interface AssembleInput {
  patient: PatientDemographics;
  medications: MergedMedication[];
  labResults: MergedLabResult[];
  conditions: MergedCondition[];
  allergies: MergedAllergy[];
  immunizations: MergedImmunization[];
  conflicts: Conflict[];
  sourceSummary: SourceSummary[];
  tier1: Tier1Results;
}

/**
 * Assemble a structured pre-visit report from unified data and AI results.
 * Pure function — no side effects, no hooks, no API calls.
 */
export function assemblePreVisitReport(input: AssembleInput): PreVisitReport {
  const { patient, medications, labResults, conditions, allergies, immunizations, conflicts, sourceSummary, tier1 } = input;

  // Separate active vs other medications
  const activeMeds = medications.filter((m) => m.status === "active");
  const otherMeds = medications.filter((m) => m.status !== "active");

  // Build source note
  const sourceNames = [...new Set(medications.flatMap((m) => m.allSources.map((s) => s.systemName)))];
  const sourceNote = sourceNames.length > 1
    ? `Medications combined from ${sourceNames.join(" and ")}`
    : sourceNames.length === 1
      ? `Medications from ${sourceNames[0]}`
      : "No medication sources available";

  // Categorize conflicts
  const critical = tier1.sourceConflictAlerts.filter((a) => a.severity === "critical");
  const high = tier1.sourceConflictAlerts.filter((a) => a.severity === "high");
  const medium = tier1.sourceConflictAlerts.filter((a) => a.severity === "medium");

  // Abnormal labs
  const abnormalLabs = labResults.filter(
    (l) => l.interpretation === "abnormal" || l.interpretation === "high" || l.interpretation === "low"
  );

  // Lab trend summaries (plain text from Tier 1)
  const trendSummaries = tier1.labTrends
    .filter((t) => t.direction !== "stable")
    .map((t) => t.message);

  // Active conditions
  const activeConditions = conditions.filter((c) => c.clinicalStatus === "active");

  // Care gaps
  const overdueGaps = tier1.careGaps.filter((g) => g.isOverdue);
  const upcomingGaps = tier1.careGaps.filter((g) => !g.isOverdue);

  // High-significance vital correlations
  const significantCorrelations = tier1.vitalCorrelations.filter(
    (v) => v.significance === "high" || v.significance === "medium"
  );

  return {
    generatedAt: new Date().toISOString(),
    patient,
    medications: {
      active: activeMeds,
      other: otherMeds,
      interactions: tier1.drugInteractions,
      sourceNote,
    },
    safety: {
      critical,
      high,
      medium,
      conflicts,
      totalAlerts: critical.length + high.length + medium.length,
    },
    labs: {
      abnormal: abnormalLabs,
      all: labResults,
      trendSummaries,
    },
    conditions: activeConditions,
    allergies,
    immunizations,
    careGaps: {
      overdue: overdueGaps,
      upcoming: upcomingGaps,
    },
    vitalCorrelations: significantCorrelations,
    dataSources: sourceSummary,
    hasAINarrative: false,
    disclaimer:
      "This report is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. " +
      "Always seek the advice of your physician or other qualified health provider. " +
      "Data sourced from connected health systems may be incomplete or delayed.",
  };
}
