// -----------------------------------------------------------
// vitalParser — Converts raw FHIR Observation (vital-signs) → Vital
// -----------------------------------------------------------
// Vitals are AI fuel, not displayed as standalone charts.
// They're cross-referenced with medications for correlation insights.

import type { Vital, VitalComponent } from "../types/vital";
import type { SourceTag, ClinicalCode } from "../types/source";

// LOINC codes for vital sign types
const VITAL_TYPE_MAP: Record<string, Vital["vitalType"]> = {
  "85354-9": "blood-pressure",
  "8480-6": "blood-pressure",   // systolic (component)
  "8462-4": "blood-pressure",   // diastolic (component)
  "8867-4": "heart-rate",
  "29463-7": "body-weight",
  "39156-5": "bmi",
  "8310-5": "body-temperature",
  "9279-1": "respiratory-rate",
  "2708-6": "oxygen-saturation",
  "59408-5": "oxygen-saturation",
  "8302-2": "body-height",
};

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
function detectVitalType(resource: any): Vital["vitalType"] {
  const codings = resource.code?.coding ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const coding of codings) {
    if (coding.code && VITAL_TYPE_MAP[coding.code]) {
      return VITAL_TYPE_MAP[coding.code];
    }
  }
  return "other";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractComponents(resource: any): VitalComponent[] {
  if (!resource.component) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return resource.component.map((comp: any) => ({
    name: comp.code?.text || comp.code?.coding?.[0]?.display || "Unknown",
    codes: extractCodes(comp.code),
    value: comp.valueQuantity?.value,
    unit: comp.valueQuantity?.unit || comp.valueQuantity?.code,
  }));
}

/** Check if an Observation is a vital sign (not laboratory) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isVitalObservation(resource: any): boolean {
  if (resource.resourceType !== "Observation") return false;
  const categories = resource.category ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return categories.some((cat: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cat.coding?.some((c: any) => c.code === "vital-signs")
  );
}

/**
 * Parse a raw FHIR Observation (vital-signs) resource into a Vital type.
 * Returns null if the resource is unparseable or not a vital sign.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseVital(resource: any, source: SourceTag): Vital | null {
  if (!resource || resource.resourceType !== "Observation") {
    return null;
  }

  if (!isVitalObservation(resource)) {
    return null;
  }

  try {
    const vitalType = detectVitalType(resource);
    const components = extractComponents(resource);

    return {
      id: resource.id ?? `vital-${Date.now()}`,
      status: resource.status ?? "unknown",
      name: resource.code?.text || resource.code?.coding?.[0]?.display || "Unknown Vital",
      vitalType,
      codes: extractCodes(resource.code),
      value: resource.valueQuantity?.value,
      unit: resource.valueQuantity?.unit || resource.valueQuantity?.code,
      components: components.length > 0 ? components : undefined,
      effectiveDate: resource.effectiveDateTime || resource.effectivePeriod?.start,
      source,
    };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("Failed to parse vital Observation:", resource.id, err);
    }
    return null;
  }
}

/**
 * Parse a FHIR Bundle of Observation resources, filtering for vitals only.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseVitalBundle(bundle: any, source: SourceTag): Vital[] {
  if (!bundle?.entry) return [];
  return bundle.entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((entry: any) => parseVital(entry.resource, source))
    .filter((v: Vital | null): v is Vital => v !== null);
}
