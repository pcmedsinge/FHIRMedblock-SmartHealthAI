// -----------------------------------------------------------
// Tier 1 Rule: Lab Abnormal Flags
// -----------------------------------------------------------
// Compares each lab result's value against its FHIR referenceRange.
// Flags values as normal, high, low, critical-high, or critical-low.
//
// Critical thresholds: values outside 2x the normal range boundary
// are flagged as critical (e.g., glucose > 2x upper bound).
//
// COST: $0 — pure deterministic logic
// -----------------------------------------------------------

import type { MergedLabResult } from "../../types/merged";
import type { LabAbnormalFlag } from "../types";

// -----------------------------------------------------------
// Critical multiplier — how far beyond range = critical
// -----------------------------------------------------------
// If value exceeds the range boundary by this factor, it's critical.
// Example: reference high = 100, critical threshold = 100 * 1.5 = 150

const CRITICAL_FACTOR = 1.5;

// -----------------------------------------------------------
// Well-known lab reference ranges (fallback when FHIR is missing)
// -----------------------------------------------------------
// These are standard adult reference ranges. In production, you'd
// use age/sex-adjusted ranges from a lab reference database.

const FALLBACK_RANGES: Record<string, { low: number; high: number; unit: string }> = {
  // Metabolic
  "hemoglobin a1c": { low: 4.0, high: 5.6, unit: "%" },
  "glucose": { low: 70, high: 100, unit: "mg/dL" },
  "fasting glucose": { low: 70, high: 100, unit: "mg/dL" },
  "bun": { low: 7, high: 20, unit: "mg/dL" },
  "creatinine": { low: 0.6, high: 1.2, unit: "mg/dL" },
  "egfr": { low: 60, high: 120, unit: "mL/min/1.73m2" },
  "sodium": { low: 136, high: 145, unit: "mmol/L" },
  "potassium": { low: 3.5, high: 5.0, unit: "mmol/L" },
  "chloride": { low: 96, high: 106, unit: "mmol/L" },
  "co2": { low: 23, high: 29, unit: "mmol/L" },
  "calcium": { low: 8.5, high: 10.5, unit: "mg/dL" },

  // Lipids
  "total cholesterol": { low: 0, high: 200, unit: "mg/dL" },
  "ldl cholesterol": { low: 0, high: 100, unit: "mg/dL" },
  "hdl cholesterol": { low: 40, high: 200, unit: "mg/dL" },
  "triglycerides": { low: 0, high: 150, unit: "mg/dL" },

  // CBC
  "hemoglobin": { low: 12.0, high: 17.5, unit: "g/dL" },
  "hematocrit": { low: 36, high: 50, unit: "%" },
  "wbc": { low: 4.5, high: 11.0, unit: "x10^3/uL" },
  "white blood cell count": { low: 4.5, high: 11.0, unit: "x10^3/uL" },
  "platelets": { low: 150, high: 400, unit: "x10^3/uL" },
  "rbc": { low: 4.0, high: 5.5, unit: "x10^6/uL" },

  // Liver
  "alt": { low: 7, high: 56, unit: "U/L" },
  "ast": { low: 10, high: 40, unit: "U/L" },
  "alkaline phosphatase": { low: 44, high: 147, unit: "U/L" },
  "bilirubin": { low: 0.1, high: 1.2, unit: "mg/dL" },
  "total bilirubin": { low: 0.1, high: 1.2, unit: "mg/dL" },
  "albumin": { low: 3.5, high: 5.5, unit: "g/dL" },

  // Thyroid
  "tsh": { low: 0.4, high: 4.0, unit: "mIU/L" },
  "free t4": { low: 0.8, high: 1.8, unit: "ng/dL" },

  // Other
  "vitamin d": { low: 30, high: 100, unit: "ng/mL" },
  "ferritin": { low: 12, high: 300, unit: "ng/mL" },
  "iron": { low: 60, high: 170, unit: "mcg/dL" },
  "uric acid": { low: 3.0, high: 7.0, unit: "mg/dL" },
};

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

function getRange(lab: MergedLabResult): { low?: number; high?: number } | null {
  // Prefer FHIR reference range
  if (lab.referenceRange && (lab.referenceRange.low != null || lab.referenceRange.high != null)) {
    return lab.referenceRange;
  }

  // Fallback to known ranges
  const key = lab.name.toLowerCase().trim();
  if (FALLBACK_RANGES[key]) {
    return FALLBACK_RANGES[key];
  }

  // No range available
  return null;
}

function buildMessage(
  labName: string,
  value: number,
  unit: string,
  status: LabAbnormalFlag["status"],
  low?: number,
  high?: number
): string {
  const rangeText = low != null && high != null
    ? `(normal range: ${low}–${high} ${unit})`
    : low != null
    ? `(normal: ≥${low} ${unit})`
    : high != null
    ? `(normal: ≤${high} ${unit})`
    : "";

  switch (status) {
    case "critical-high":
      return `⚠️ ${labName} is critically high at ${value} ${unit} ${rangeText}. Discuss with your provider urgently.`;
    case "critical-low":
      return `⚠️ ${labName} is critically low at ${value} ${unit} ${rangeText}. Discuss with your provider urgently.`;
    case "high":
      return `${labName} is above normal at ${value} ${unit} ${rangeText}.`;
    case "low":
      return `${labName} is below normal at ${value} ${unit} ${rangeText}.`;
    case "normal":
      return `${labName} is within normal range at ${value} ${unit} ${rangeText}.`;
  }
}

// -----------------------------------------------------------
// Main analysis function
// -----------------------------------------------------------

/**
 * Analyze all lab results for abnormal values.
 * Returns a flag for every lab that has a numeric value and a reference range.
 * Labs without numeric values or reference ranges are skipped.
 */
export function analyzeLabAbnormalFlags(labs: MergedLabResult[]): LabAbnormalFlag[] {
  const flags: LabAbnormalFlag[] = [];

  for (const lab of labs) {
    // Skip non-numeric values
    if (typeof lab.value !== "number") continue;

    const range = getRange(lab);
    if (!range) continue; // No reference range available

    const { low, high } = range;
    const value = lab.value;
    const unit = lab.unit ?? "";

    let status: LabAbnormalFlag["status"] = "normal";

    if (high != null && value > high) {
      // Check for critical-high
      const criticalThreshold = high * CRITICAL_FACTOR;
      status = value >= criticalThreshold ? "critical-high" : "high";
    } else if (low != null && value < low) {
      // Check for critical-low
      const criticalThreshold = low / CRITICAL_FACTOR;
      status = value <= criticalThreshold ? "critical-low" : "low";
    }

    flags.push({
      labId: lab.id,
      labName: lab.name,
      value,
      unit,
      referenceRange: {
        low: low ?? range.low,
        high: high ?? range.high,
        text: lab.referenceRange?.text,
      },
      status,
      message: buildMessage(lab.name, value, unit, status, low, high),
      source: lab.source,
    });
  }

  return flags;
}
