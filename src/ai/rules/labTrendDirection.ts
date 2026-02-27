// -----------------------------------------------------------
// Tier 1 Rule: Lab Trend Direction
// -----------------------------------------------------------
// For labs with 2+ readings, calculates trend direction and
// rate of change. Groups labs by LOINC code (or name fallback),
// sorts chronologically, then computes rise/fall/stable.
//
// STABLE threshold: < 5% change is considered stable.
//
// COST: $0 — pure deterministic logic
// -----------------------------------------------------------

import type { MergedLabResult } from "../../types/merged";
import type { LabTrend } from "../types";
import type { ClinicalCode } from "../../types/source";

// -----------------------------------------------------------
// Configuration
// -----------------------------------------------------------

/** Percentage change below this is considered "stable" */
const STABLE_THRESHOLD_PERCENT = 5;

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

/**
 * Get a grouping key for a lab result.
 * Prefers LOINC code, falls back to normalized name.
 */
function getLabGroupKey(lab: MergedLabResult): string {
  // Prefer LOINC code
  const loinc = lab.codes.find(
    (c) => c.system?.includes("loinc") || c.system?.includes("LOINC")
  );
  if (loinc?.code) return `loinc:${loinc.code}`;

  // Fall back to normalized name
  return `name:${lab.name.toLowerCase().trim()}`;
}

/**
 * Get the primary code for display purposes.
 */
function getPrimaryCode(lab: MergedLabResult): ClinicalCode {
  return (
    lab.codes.find((c) => c.system?.includes("loinc") || c.system?.includes("LOINC")) ??
    lab.codes[0] ?? { display: lab.name }
  );
}

/**
 * Parse a date string to timestamp for sorting.
 */
function toTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  return new Date(dateStr).getTime();
}

/**
 * Calculate the number of days between two dates.
 */
function daysBetween(dateA: string, dateB: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.abs(toTimestamp(dateA) - toTimestamp(dateB)) / msPerDay;
}

/**
 * Build a patient-friendly trend message.
 */
function buildTrendMessage(
  labName: string,
  direction: LabTrend["direction"],
  changePercent: number,
  firstValue: number,
  lastValue: number,
  unit: string,
  spanDays: number
): string {
  const span =
    spanDays >= 365
      ? `${Math.round(spanDays / 30)} months`
      : spanDays >= 30
      ? `${Math.round(spanDays / 30)} months`
      : `${Math.round(spanDays)} days`;

  const pct = Math.abs(changePercent).toFixed(1);

  switch (direction) {
    case "rising":
      return `${labName} has risen ${pct}% (from ${firstValue} to ${lastValue} ${unit}) over the past ${span}.`;
    case "falling":
      return `${labName} has decreased ${pct}% (from ${firstValue} to ${lastValue} ${unit}) over the past ${span}.`;
    case "stable":
      return `${labName} has been stable around ${lastValue} ${unit} over the past ${span}.`;
  }
}

// -----------------------------------------------------------
// Main analysis function
// -----------------------------------------------------------

/**
 * Analyze lab results for trends.
 * Groups labs by code, requires 2+ numeric readings with dates.
 * Returns one LabTrend per group that qualifies.
 */
export function analyzeLabTrends(labs: MergedLabResult[]): LabTrend[] {
  const trends: LabTrend[] = [];

  // Group labs by code/name
  const groups = new Map<string, MergedLabResult[]>();
  for (const lab of labs) {
    if (typeof lab.value !== "number" || !lab.effectiveDate) continue;

    const key = getLabGroupKey(lab);
    const group = groups.get(key) ?? [];
    group.push(lab);
    groups.set(key, group);
  }

  // Analyze each group with 2+ readings
  for (const [, group] of groups) {
    if (group.length < 2) continue;

    // Sort chronologically
    const sorted = [...group].sort(
      (a, b) => toTimestamp(a.effectiveDate) - toTimestamp(b.effectiveDate)
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const firstValue = first.value as number;
    const lastValue = last.value as number;
    const unit = last.unit ?? first.unit ?? "";

    // Calculate percentage change
    const changePercent =
      firstValue !== 0 ? ((lastValue - firstValue) / Math.abs(firstValue)) * 100 : 0;

    // Determine direction
    let direction: LabTrend["direction"];
    if (Math.abs(changePercent) < STABLE_THRESHOLD_PERCENT) {
      direction = "stable";
    } else if (changePercent > 0) {
      direction = "rising";
    } else {
      direction = "falling";
    }

    const spanDays = daysBetween(first.effectiveDate!, last.effectiveDate!);

    trends.push({
      labName: last.name,
      code: getPrimaryCode(last),
      direction,
      changePercent: Math.round(changePercent * 10) / 10,
      readingCount: sorted.length,
      firstReading: { value: firstValue, date: first.effectiveDate! },
      lastReading: { value: lastValue, date: last.effectiveDate! },
      spanDays: Math.round(spanDays),
      message: buildTrendMessage(
        last.name,
        direction,
        changePercent,
        firstValue,
        lastValue,
        unit,
        spanDays
      ),
    });
  }

  // Sort by absolute change percent (most significant first)
  trends.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  return trends;
}
