// -----------------------------------------------------------
// Tier 1 Rule: Vital-Medication Correlation
// -----------------------------------------------------------
// Cross-references vitals with medication timelines to surface
// clinically meaningful correlations:
//
//   BP + antihypertensives → "Is your med working?"
//   Weight + weight-gain meds → "Possible side effect"
//   HR + beta-blockers/stimulants → "Expected/unexpected effect"
//   BMI + glucose/A1c → "Combined risk factor"
//
// This is where cross-system data shines: a medication from
// one system is correlated with vitals from another system
// to surface insights neither system could generate alone.
//
// COST: $0 — deterministic logic
// -----------------------------------------------------------

import type { MergedVital, MergedMedication, MergedCondition } from "../../types/merged";
import type { VitalCorrelation } from "../types";

// -----------------------------------------------------------
// Correlation rules
// -----------------------------------------------------------

interface CorrelationRule {
  id: string;
  /** Which vital type(s) to check */
  vitalTypes: MergedVital["vitalType"][];
  /** Medication patterns to match */
  medPatterns: RegExp[];
  /** What type of correlation this is */
  correlationType: VitalCorrelation["correlationType"];
  /** Clinical significance */
  significance: VitalCorrelation["significance"];
  /** Generate the insight message */
  buildMessage: (vital: MergedVital, med: MergedMedication) => string;
  /** Generate detail text */
  buildDetail: (vital: MergedVital, med: MergedMedication) => string;
}

// -----------------------------------------------------------
// Helper to extract BP values
// -----------------------------------------------------------

function getSystolic(vital: MergedVital): number | null {
  const comp = vital.components?.find(
    (c) => c.name.toLowerCase().includes("systolic") || c.codes.some((cd) => cd.code === "8480-6")
  );
  return comp?.value ?? null;
}

function getDiastolic(vital: MergedVital): number | null {
  const comp = vital.components?.find(
    (c) => c.name.toLowerCase().includes("diastolic") || c.codes.some((cd) => cd.code === "8462-4")
  );
  return comp?.value ?? null;
}

// -----------------------------------------------------------
// Correlation rules table
// -----------------------------------------------------------

const CORRELATION_RULES: CorrelationRule[] = [
  // ---- BP + Antihypertensives ----
  {
    id: "bp-antihypertensive",
    vitalTypes: ["blood-pressure"],
    medPatterns: [
      /lisinopril|enalapril|ramipril|benazepril/i, // ACE inhibitors
      /losartan|valsartan|irbesartan|olmesartan/i, // ARBs
      /amlodipine|nifedipine|diltiazem|verapamil/i, // Calcium channel blockers
      /hydrochlorothiazide|chlorthalidone|furosemide/i, // Diuretics
      /metoprolol|atenolol|carvedilol|propranolol/i, // Beta-blockers
    ],
    correlationType: "effectiveness",
    significance: "high",
    buildMessage: (vital, med) => {
      const systolic = getSystolic(vital);
      const diastolic = getDiastolic(vital);
      if (systolic && diastolic) {
        const controlled = systolic < 140 && diastolic < 90;
        return controlled
          ? `Your blood pressure (${systolic}/${diastolic}) appears well-controlled while taking ${med.name}.`
          : `Your blood pressure (${systolic}/${diastolic}) may still be elevated despite taking ${med.name}. Discuss this with your provider.`;
      }
      return `You are taking ${med.name} for blood pressure management. Regular BP monitoring is important.`;
    },
    buildDetail: (vital, med) => {
      const systolic = getSystolic(vital);
      const controlled = systolic ? systolic < 140 : true;
      return controlled
        ? `BP reading from ${vital.source.systemName}, ${med.name} from ${med.source.systemName}. Target: <140/90 mmHg.`
        : `BP reading from ${vital.source.systemName}, ${med.name} from ${med.source.systemName}. Target: <140/90 mmHg. Current reading exceeds target.`;
    },
  },

  // ---- Weight + Weight-Gain Medications ----
  {
    id: "weight-gain-med",
    vitalTypes: ["body-weight", "bmi"],
    medPatterns: [
      /prednisone|prednisolone|dexamethasone|methylprednisolone/i, // Corticosteroids
      /sertraline|paroxetine|mirtazapine|amitriptyline|olanzapine|quetiapine|risperidone/i, // SSRIs, antipsychotics
      /insulin|glipizide|glyburide|pioglitazone/i, // Diabetes meds associated with weight gain
      /gabapentin|pregabalin/i, // Anticonvulsants
      /propranolol|metoprolol|atenolol/i, // Beta-blockers
    ],
    correlationType: "side-effect",
    significance: "medium",
    buildMessage: (_vital, med) =>
      `${med.name} is commonly associated with weight changes. If you've noticed weight gain, this may be a contributing factor worth discussing with your provider.`,
    buildDetail: (vital, med) =>
      `Weight data from ${vital.source.systemName}, ${med.name} from ${med.source.systemName}. Weight changes are a known side effect of this medication class.`,
  },

  // ---- Heart Rate + Beta-Blockers ----
  {
    id: "hr-beta-blocker",
    vitalTypes: ["heart-rate"],
    medPatterns: [
      /metoprolol|atenolol|propranolol|carvedilol|bisoprolol|nadolol/i,
    ],
    correlationType: "expected-effect",
    significance: "medium",
    buildMessage: (vital, med) => {
      const hr = vital.value;
      if (hr && hr < 60) {
        return `Your heart rate (${hr} bpm) is on the lower side, which is expected with ${med.name} (a beta-blocker). If you feel dizzy or faint, contact your provider.`;
      }
      if (hr && hr > 100) {
        return `Your heart rate (${hr} bpm) is elevated despite taking ${med.name}. This may need attention.`;
      }
      return `${med.name} (beta-blocker) is expected to lower your heart rate. Your current rate is ${hr ?? "unknown"} bpm.`;
    },
    buildDetail: (vital, med) =>
      `HR from ${vital.source.systemName}, ${med.name} from ${med.source.systemName}. Beta-blockers typically reduce resting heart rate by 10-20%.`,
  },

  // ---- Heart Rate + Stimulants ----
  {
    id: "hr-stimulant",
    vitalTypes: ["heart-rate"],
    medPatterns: [
      /methylphenidate|ritalin|adderall|amphetamine|dextroamphetamine|lisdexamfetamine|vyvanse/i,
      /pseudoephedrine|phenylephrine/i,
      /albuterol|levalbuterol/i,
    ],
    correlationType: "side-effect",
    significance: "medium",
    buildMessage: (vital, med) => {
      const hr = vital.value;
      if (hr && hr > 100) {
        return `Your heart rate (${hr} bpm) is elevated. ${med.name} can increase heart rate. Discuss with your provider if this persists.`;
      }
      return `${med.name} can affect heart rate. Your current rate is ${hr ?? "unknown"} bpm, which appears normal.`;
    },
    buildDetail: (vital, med) =>
      `HR from ${vital.source.systemName}, ${med.name} from ${med.source.systemName}. Stimulant medications may increase heart rate.`,
  },
];

// -----------------------------------------------------------
// BMI + Glucose combined risk factor (special logic)
// -----------------------------------------------------------

function detectBMIGlucoseRisk(
  vitals: MergedVital[],
  conditions: MergedCondition[]
): VitalCorrelation | null {
  const bmiVitals = vitals.filter((v) => v.vitalType === "bmi" && typeof v.value === "number");
  if (bmiVitals.length === 0) return null;

  // Get the most recent BMI
  const latestBMI = [...bmiVitals].sort(
    (a, b) => new Date(b.effectiveDate ?? "").getTime() - new Date(a.effectiveDate ?? "").getTime()
  )[0];

  if (!latestBMI?.value || latestBMI.value < 25) return null; // Normal BMI

  const hasDiabetes = conditions.some(
    (c) => /diabetes|diabetic|prediabetes/i.test(c.name) && c.clinicalStatus === "active"
  );

  const bmiCategory = latestBMI.value >= 30 ? "obese" : "overweight";

  if (hasDiabetes || latestBMI.value >= 30) {
    return {
      id: "bmi-glucose-risk",
      vitalName: `BMI (${latestBMI.value})`,
      medicationName: hasDiabetes ? "Diabetes diagnosis" : "Elevated BMI",
      correlationType: "risk-factor",
      significance: "high",
      message: hasDiabetes
        ? `Your BMI of ${latestBMI.value} (${bmiCategory} range) combined with your diabetes diagnosis increases cardiovascular risk. Weight management is especially important.`
        : `Your BMI of ${latestBMI.value} is in the ${bmiCategory} range, which is associated with increased risk for diabetes, heart disease, and other conditions.`,
      detail: `BMI from ${latestBMI.source.systemName}. ${hasDiabetes ? "Active diabetes diagnosis found in conditions." : "Consider glucose screening if not recently done."}`,
    };
  }

  return null;
}

// -----------------------------------------------------------
// Main analysis function
// -----------------------------------------------------------

let correlationCounter = 0;

/**
 * Cross-reference vitals with medications to find clinically
 * meaningful correlations. Uses the most recent vital of each type.
 */
export function detectVitalMedCorrelations(
  vitals: MergedVital[],
  medications: MergedMedication[],
  conditions: MergedCondition[]
): VitalCorrelation[] {
  correlationCounter = 0;
  const correlations: VitalCorrelation[] = [];
  const seen = new Set<string>();

  // Get most recent vital per type
  const latestVitals = new Map<string, MergedVital>();
  for (const vital of vitals) {
    const existing = latestVitals.get(vital.vitalType);
    if (
      !existing ||
      new Date(vital.effectiveDate ?? "").getTime() >
        new Date(existing.effectiveDate ?? "").getTime()
    ) {
      latestVitals.set(vital.vitalType, vital);
    }
  }

  // Filter to active medications
  const activeMeds = medications.filter(
    (m) => ["active", "completed", "on-hold"].includes(m.status.toLowerCase())
  );

  // Check each rule against vitals and medications
  for (const rule of CORRELATION_RULES) {
    for (const vitalType of rule.vitalTypes) {
      const vital = latestVitals.get(vitalType);
      if (!vital) continue;

      for (const med of activeMeds) {
        const nameNorm = med.name.toLowerCase();
        if (!rule.medPatterns.some((p) => p.test(nameNorm))) continue;

        const key = `${rule.id}:${vital.id}:${med.id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        correlationCounter++;
        correlations.push({
          id: `vc-${correlationCounter}`,
          vitalName: vital.name,
          medicationName: med.name,
          correlationType: rule.correlationType,
          message: rule.buildMessage(vital, med),
          detail: rule.buildDetail(vital, med),
          significance: rule.significance,
        });
      }
    }
  }

  // Check BMI + glucose/diabetes risk
  const bmiRisk = detectBMIGlucoseRisk(vitals, conditions);
  if (bmiRisk) {
    correlations.push(bmiRisk);
  }

  // Sort by significance
  const sigOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  correlations.sort((a, b) => (sigOrder[a.significance] ?? 3) - (sigOrder[b.significance] ?? 3));

  return correlations;
}
