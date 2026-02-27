// -----------------------------------------------------------
// labResultParser — Converts raw FHIR Observation (lab) → LabResult
// -----------------------------------------------------------

import type { LabResult } from "../types/labResult";
import type { SourceTag, ClinicalCode } from "../types/source";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractCodes(codeableConcept: any): ClinicalCode[] {
  if (!codeableConcept?.coding) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return codeableConcept.coding.map((c: any) => ({
    system: c.system,
    code: c.code,
    display: c.display,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractValue(resource: any): { value?: number | string; unit?: string } {
  // Quantity value (most common for labs)
  if (resource.valueQuantity) {
    return {
      value: resource.valueQuantity.value,
      unit: resource.valueQuantity.unit || resource.valueQuantity.code,
    };
  }
  // String value
  if (resource.valueString) {
    return { value: resource.valueString };
  }
  // CodeableConcept value (e.g., "Positive", "Negative")
  if (resource.valueCodeableConcept) {
    return { value: resource.valueCodeableConcept.text || resource.valueCodeableConcept.coding?.[0]?.display };
  }
  return {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractReferenceRange(resource: any): LabResult["referenceRange"] {
  const range = resource.referenceRange?.[0];
  if (!range) return undefined;

  return {
    low: range.low?.value,
    high: range.high?.value,
    text: range.text,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractInterpretation(resource: any): LabResult["interpretation"] {
  const code = resource.interpretation?.[0]?.coding?.[0]?.code;
  if (!code) return undefined;

  const map: Record<string, LabResult["interpretation"]> = {
    N: "normal",
    H: "high",
    L: "low",
    HH: "critical-high",
    LL: "critical-low",
    A: "abnormal",
    AA: "abnormal",
  };
  return map[code] ?? undefined;
}

/** Check if an Observation is a laboratory result (not vital signs) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isLabObservation(resource: any): boolean {
  if (resource.resourceType !== "Observation") return false;
  const categories = resource.category ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return categories.some((cat: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cat.coding?.some((c: any) => c.code === "laboratory")
  );
}

/**
 * Parse a raw FHIR Observation (lab) resource into a LabResult type.
 * Returns null if the resource is unparseable or not a lab observation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseLabResult(resource: any, source: SourceTag): LabResult | null {
  if (!resource || resource.resourceType !== "Observation") {
    return null;
  }

  // Skip if not a laboratory observation
  if (!isLabObservation(resource)) {
    return null;
  }

  try {
    const { value, unit } = extractValue(resource);

    return {
      id: resource.id ?? `lab-${Date.now()}`,
      status: resource.status ?? "unknown",
      name: resource.code?.text || resource.code?.coding?.[0]?.display || "Unknown Lab",
      codes: extractCodes(resource.code),
      value,
      unit,
      referenceRange: extractReferenceRange(resource),
      interpretation: extractInterpretation(resource),
      category: "laboratory",
      effectiveDate: resource.effectiveDateTime || resource.effectivePeriod?.start,
      source,
    };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("Failed to parse lab Observation:", resource.id, err);
    }
    return null;
  }
}

/**
 * Parse a FHIR Bundle of Observation resources, filtering for labs only.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseLabResultBundle(bundle: any, source: SourceTag): LabResult[] {
  if (!bundle?.entry) return [];
  return bundle.entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((entry: any) => parseLabResult(entry.resource, source))
    .filter((l: LabResult | null): l is LabResult => l !== null);
}
