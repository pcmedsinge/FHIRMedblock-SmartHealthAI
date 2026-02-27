// -----------------------------------------------------------
// conditionParser — Converts raw FHIR Condition → Condition
// -----------------------------------------------------------

import type { Condition } from "../types/condition";
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
function extractClinicalStatus(resource: any): string | undefined {
  return resource.clinicalStatus?.coding?.[0]?.code;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractVerificationStatus(resource: any): string | undefined {
  return resource.verificationStatus?.coding?.[0]?.code;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractCategory(resource: any): string | undefined {
  return resource.category?.[0]?.coding?.[0]?.code;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractOnsetDate(resource: any): string | undefined {
  if (resource.onsetDateTime) return resource.onsetDateTime;
  if (resource.onsetPeriod?.start) return resource.onsetPeriod.start;
  if (resource.onsetString) return resource.onsetString;
  return undefined;
}

/**
 * Parse a raw FHIR Condition resource into a Condition type.
 * Returns null if the resource is unparseable.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseCondition(resource: any, source: SourceTag): Condition | null {
  if (!resource || resource.resourceType !== "Condition") {
    return null;
  }

  try {
    return {
      id: resource.id ?? `cond-${Date.now()}`,
      clinicalStatus: extractClinicalStatus(resource),
      verificationStatus: extractVerificationStatus(resource),
      category: extractCategory(resource),
      name: resource.code?.text || resource.code?.coding?.[0]?.display || "Unknown Condition",
      codes: extractCodes(resource.code),
      severity: resource.severity?.coding?.[0]?.code,
      onsetDate: extractOnsetDate(resource),
      abatementDate: resource.abatementDateTime || resource.abatementPeriod?.start,
      recordedDate: resource.recordedDate,
      source,
    };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("Failed to parse Condition:", resource.id, err);
    }
    return null;
  }
}

/**
 * Parse a FHIR Bundle of Condition resources.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseConditionBundle(bundle: any, source: SourceTag): Condition[] {
  if (!bundle?.entry) return [];
  return bundle.entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((entry: any) => parseCondition(entry.resource, source))
    .filter((c: Condition | null): c is Condition => c !== null);
}
