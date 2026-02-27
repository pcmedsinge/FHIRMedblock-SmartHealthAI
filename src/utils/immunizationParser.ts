// -----------------------------------------------------------
// immunizationParser — Converts raw FHIR Immunization → Immunization
// -----------------------------------------------------------

import type { Immunization } from "../types/immunization";
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

/**
 * Parse a raw FHIR Immunization resource into an Immunization type.
 * Returns null if the resource is unparseable.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseImmunization(resource: any, source: SourceTag): Immunization | null {
  if (!resource || resource.resourceType !== "Immunization") {
    return null;
  }

  try {
    return {
      id: resource.id ?? `imm-${Date.now()}`,
      status: resource.status ?? "unknown",
      vaccineName: resource.vaccineCode?.text || resource.vaccineCode?.coding?.[0]?.display || "Unknown Vaccine",
      codes: extractCodes(resource.vaccineCode),
      occurrenceDate: resource.occurrenceDateTime || resource.occurrenceString,
      primarySource: resource.primarySource,
      lotNumber: resource.lotNumber,
      site: resource.site?.text || resource.site?.coding?.[0]?.display,
      source,
    };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("Failed to parse Immunization:", resource.id, err);
    }
    return null;
  }
}

/**
 * Parse a FHIR Bundle of Immunization resources.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseImmunizationBundle(bundle: any, source: SourceTag): Immunization[] {
  if (!bundle?.entry) return [];
  return bundle.entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((entry: any) => parseImmunization(entry.resource, source))
    .filter((i: Immunization | null): i is Immunization => i !== null);
}
