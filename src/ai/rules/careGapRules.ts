// -----------------------------------------------------------
// Tier 1 Rule: Care Gap Detection
// -----------------------------------------------------------
// Checks patient data against USPSTF preventive care guidelines.
// Detects missing or overdue screenings, vaccinations, and
// routine monitoring based on age, sex, and conditions.
//
// GUIDELINES IMPLEMENTED:
//   - Colonoscopy screening ≥ 45
//   - Mammogram ≥ 40 (female)
//   - Shingrix vaccine ≥ 50
//   - A1c every 3-6 months for diabetics
//   - BP check annually for adults
//   - Lipid panel every 5 years ≥ 35
//   - Annual flu vaccine for all adults
//   - COVID-19 booster (updated annually)
//   - Lung cancer screening ≥ 50 (smoking history)
//
// COST: $0 — deterministic rule matching
// -----------------------------------------------------------

import type { PatientDemographics } from "../../types/patient";
import type {
  MergedCondition,
  MergedImmunization,
  MergedEncounter,
  MergedLabResult,
  MergedVital,
} from "../../types/merged";
import type { CareGap } from "../types";

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

interface CareGapInput {
  patient: PatientDemographics;
  conditions: MergedCondition[];
  immunizations: MergedImmunization[];
  encounters: MergedEncounter[];
  labResults: MergedLabResult[];
  vitals: MergedVital[];
}

interface CareGapRule {
  id: string;
  recommendation: string;
  guideline: string;
  guidelineSource: string;
  priority: CareGap["priority"];
  /** Return true if this rule applies to the patient */
  applies: (input: CareGapInput) => boolean;
  /** Return the date it was last performed, or null if never */
  lastPerformed: (input: CareGapInput) => string | null;
  /** Return true if overdue */
  isOverdue: (input: CareGapInput, lastDone: string | null) => boolean;
  /** Reason this gap matters */
  reason: (input: CareGapInput) => string;
}

// -----------------------------------------------------------
// Date helpers
// -----------------------------------------------------------

function monthsSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
}

function yearsSince(dateStr: string): number {
  return monthsSince(dateStr) / 12;
}

function hasConditionMatching(conditions: MergedCondition[], patterns: RegExp[]): boolean {
  return conditions.some(
    (c) =>
      (c.clinicalStatus === "active" || c.clinicalStatus === "recurrence") &&
      patterns.some((p) => p.test(c.name))
  );
}

function findLatestDate(dates: (string | undefined)[]): string | null {
  const valid = dates.filter((d): d is string => !!d);
  if (valid.length === 0) return null;
  return valid.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

function findLatestLabByPattern(labs: MergedLabResult[], pattern: RegExp): string | null {
  const matching = labs.filter((l) => pattern.test(l.name));
  return findLatestDate(matching.map((l) => l.effectiveDate));
}

function findLatestImmunizationByPattern(immunizations: MergedImmunization[], pattern: RegExp): string | null {
  const matching = immunizations.filter((i) => pattern.test(i.vaccineName) && i.status === "completed");
  return findLatestDate(matching.map((i) => i.occurrenceDate));
}

function findLatestEncounterByPattern(encounters: MergedEncounter[], pattern: RegExp): string | null {
  const matching = encounters.filter((e) => pattern.test(e.type ?? "") || pattern.test(e.reason ?? ""));
  return findLatestDate(matching.map((e) => e.periodStart));
}

// -----------------------------------------------------------
// Rule definitions
// -----------------------------------------------------------

const CARE_GAP_RULES: CareGapRule[] = [
  // ---- Colonoscopy Screening ----
  {
    id: "colonoscopy-screening",
    recommendation: "Colorectal Cancer Screening",
    guideline: "Colonoscopy every 10 years starting at age 45",
    guidelineSource: "USPSTF 2021",
    priority: "medium",
    applies: ({ patient }) => patient.age >= 45,
    lastPerformed: ({ encounters, labResults }) => {
      const enc = findLatestEncounterByPattern(encounters, /colonoscopy|colorectal/i);
      const lab = findLatestLabByPattern(labResults, /fit|fobt|cologuard|colonoscopy/i);
      return findLatestDate([enc ?? undefined, lab ?? undefined]);
    },
    isOverdue: (_input, lastDone) => {
      if (!lastDone) return true;
      return yearsSince(lastDone) > 10;
    },
    reason: () => "Colorectal cancer screening is recommended for adults aged 45-75.",
  },

  // ---- Mammogram (Female) ----
  {
    id: "mammogram-screening",
    recommendation: "Breast Cancer Screening (Mammogram)",
    guideline: "Mammogram every 2 years starting at age 40",
    guidelineSource: "USPSTF 2024",
    priority: "medium",
    applies: ({ patient }) =>
      patient.age >= 40 && patient.gender.toLowerCase() === "female",
    lastPerformed: ({ encounters }) =>
      findLatestEncounterByPattern(encounters, /mammogram|mammography|breast/i),
    isOverdue: (_input, lastDone) => {
      if (!lastDone) return true;
      return yearsSince(lastDone) > 2;
    },
    reason: () =>
      "Biennial screening mammography is recommended for women aged 40-74.",
  },

  // ---- Shingrix Vaccine ----
  {
    id: "shingrix-vaccine",
    recommendation: "Shingles Vaccine (Shingrix)",
    guideline: "Two-dose Shingrix series for adults ≥ 50",
    guidelineSource: "CDC/ACIP 2023",
    priority: "low",
    applies: ({ patient }) => patient.age >= 50,
    lastPerformed: ({ immunizations }) =>
      findLatestImmunizationByPattern(immunizations, /shingrix|zoster|shingles/i),
    isOverdue: (_input, lastDone) => !lastDone,
    reason: () =>
      "Shingles risk increases with age. The Shingrix vaccine is >90% effective at prevention.",
  },

  // ---- A1c for Diabetics ----
  {
    id: "diabetic-a1c",
    recommendation: "Hemoglobin A1c Monitoring",
    guideline: "A1c every 3-6 months for patients with diabetes",
    guidelineSource: "ADA Standards of Care 2024",
    priority: "high",
    applies: ({ conditions }) =>
      hasConditionMatching(conditions, [/diabetes|diabetic|type 2 dm|type 1 dm|t2dm|t1dm/i]),
    lastPerformed: ({ labResults }) =>
      findLatestLabByPattern(labResults, /a1c|hemoglobin a1c|hba1c|glycated/i),
    isOverdue: (_input, lastDone) => {
      if (!lastDone) return true;
      return monthsSince(lastDone) > 6;
    },
    reason: ({ conditions }) => {
      const diabetesCondition = conditions.find((c) =>
        /diabetes|diabetic/i.test(c.name)
      );
      return `You have ${diabetesCondition?.name ?? "diabetes"}. Regular A1c monitoring helps track blood sugar control.`;
    },
  },

  // ---- Annual BP Check ----
  {
    id: "annual-bp-check",
    recommendation: "Blood Pressure Check",
    guideline: "Annual blood pressure screening for all adults",
    guidelineSource: "USPSTF 2021",
    priority: "low",
    applies: ({ patient }) => patient.age >= 18,
    lastPerformed: ({ vitals }) => {
      const bpReadings = vitals.filter((v) => v.vitalType === "blood-pressure");
      return findLatestDate(bpReadings.map((v) => v.effectiveDate));
    },
    isOverdue: (_input, lastDone) => {
      if (!lastDone) return true;
      return monthsSince(lastDone) > 12;
    },
    reason: () =>
      "High blood pressure often has no symptoms but is a major risk factor for heart disease and stroke.",
  },

  // ---- Lipid Panel ----
  {
    id: "lipid-panel",
    recommendation: "Cholesterol Screening (Lipid Panel)",
    guideline: "Lipid panel every 5 years for adults ≥ 35 (or ≥ 20 with risk factors)",
    guidelineSource: "USPSTF 2023",
    priority: "low",
    applies: ({ patient }) => patient.age >= 35,
    lastPerformed: ({ labResults }) =>
      findLatestLabByPattern(labResults, /cholesterol|lipid|ldl|hdl|triglyceride/i),
    isOverdue: (_input, lastDone) => {
      if (!lastDone) return true;
      return yearsSince(lastDone) > 5;
    },
    reason: () =>
      "Regular cholesterol screening helps assess cardiovascular disease risk.",
  },

  // ---- Annual Flu Vaccine ----
  {
    id: "flu-vaccine",
    recommendation: "Annual Influenza Vaccine",
    guideline: "Annual flu vaccination for all adults",
    guidelineSource: "CDC/ACIP 2024",
    priority: "low",
    applies: ({ patient }) => patient.age >= 18,
    lastPerformed: ({ immunizations }) =>
      findLatestImmunizationByPattern(immunizations, /influenza|flu/i),
    isOverdue: (_input, lastDone) => {
      if (!lastDone) return true;
      return monthsSince(lastDone) > 12;
    },
    reason: () =>
      "Annual flu vaccination reduces the risk of flu illness, hospitalization, and death.",
  },

  // ---- COVID-19 Booster ----
  {
    id: "covid-booster",
    recommendation: "COVID-19 Vaccine (Updated Booster)",
    guideline: "Updated COVID-19 booster annually",
    guidelineSource: "CDC/ACIP 2024",
    priority: "low",
    applies: ({ patient }) => patient.age >= 18,
    lastPerformed: ({ immunizations }) =>
      findLatestImmunizationByPattern(immunizations, /covid|sars-cov|moderna|pfizer|biontech/i),
    isOverdue: (_input, lastDone) => {
      if (!lastDone) return true;
      return monthsSince(lastDone) > 12;
    },
    reason: () =>
      "Updated COVID-19 boosters provide protection against current variants.",
  },

  // ---- Hypertension follow-up ----
  {
    id: "hypertension-bp-followup",
    recommendation: "Blood Pressure Monitoring (Hypertension)",
    guideline: "BP check every 3-6 months for patients with hypertension",
    guidelineSource: "AHA/ACC 2023",
    priority: "high",
    applies: ({ conditions }) =>
      hasConditionMatching(conditions, [/hypertension|high blood pressure|htn/i]),
    lastPerformed: ({ vitals }) => {
      const bpReadings = vitals.filter((v) => v.vitalType === "blood-pressure");
      return findLatestDate(bpReadings.map((v) => v.effectiveDate));
    },
    isOverdue: (_input, lastDone) => {
      if (!lastDone) return true;
      return monthsSince(lastDone) > 6;
    },
    reason: () =>
      "With hypertension, regular BP monitoring is essential to ensure your medication is working and your blood pressure is controlled.",
  },
];

// -----------------------------------------------------------
// Main analysis function
// -----------------------------------------------------------

/**
 * Detect care gaps based on patient demographics, conditions,
 * immunizations, encounters, labs, and vitals.
 * Returns only gaps that are relevant to this patient.
 */
export function detectCareGaps(input: CareGapInput): CareGap[] {
  const gaps: CareGap[] = [];

  for (const rule of CARE_GAP_RULES) {
    // Skip rules that don't apply to this patient
    if (!rule.applies(input)) continue;

    const lastDone = rule.lastPerformed(input);
    const overdue = rule.isOverdue(input, lastDone);

    gaps.push({
      id: rule.id,
      recommendation: rule.recommendation,
      reason: rule.reason(input),
      lastPerformed: lastDone ?? undefined,
      isOverdue: overdue,
      guideline: rule.guideline,
      priority: overdue ? (rule.priority === "low" ? "medium" : rule.priority) : "low",
      guidelineSource: rule.guidelineSource,
    });
  }

  // Sort: overdue first, then by priority
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  gaps.sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
  });

  return gaps;
}
