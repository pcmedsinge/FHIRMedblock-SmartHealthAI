// -----------------------------------------------------------
// encounterParser — Converts raw FHIR Encounter → Encounter
// -----------------------------------------------------------

import type { Encounter } from "../types/encounter";
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
function extractEncounterClass(resource: any): string | undefined {
  // R4: class is a Coding, not a CodeableConcept
  const cls = resource.class;
  if (!cls) return undefined;
  return cls.display || cls.code;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractType(resource: any): { type?: string; codes: ClinicalCode[] } {
  const typeEntry = resource.type?.[0];
  if (!typeEntry) return { codes: [] };
  return {
    type: typeEntry.text || typeEntry.coding?.[0]?.display,
    codes: extractCodes(typeEntry),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractReason(resource: any): string | undefined {
  // reasonCode is an array of CodeableConcepts
  const reason = resource.reasonCode?.[0];
  if (!reason) return undefined;
  return reason.text || reason.coding?.[0]?.display;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractLocation(resource: any): string | undefined {
  return resource.location?.[0]?.location?.display;
}

/**
 * Parse a raw FHIR Encounter resource into an Encounter type.
 * Returns null if the resource is unparseable.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseEncounter(resource: any, source: SourceTag): Encounter | null {
  if (!resource || resource.resourceType !== "Encounter") {
    return null;
  }

  try {
    const typeInfo = extractType(resource);

    return {
      id: resource.id ?? `enc-${Date.now()}`,
      status: resource.status ?? "unknown",
      encounterClass: extractEncounterClass(resource),
      type: typeInfo.type,
      codes: typeInfo.codes,
      reason: extractReason(resource),
      periodStart: resource.period?.start,
      periodEnd: resource.period?.end,
      location: extractLocation(resource),
      provider: resource.participant?.[0]?.individual?.display,
      source,
    };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("Failed to parse Encounter:", resource.id, err);
    }
    return null;
  }
}

/**
 * Parse a FHIR Bundle of Encounter resources.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseEncounterBundle(bundle: any, source: SourceTag): Encounter[] {
  if (!bundle?.entry) return [];
  return bundle.entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((entry: any) => parseEncounter(entry.resource, source))
    .filter((e: Encounter | null): e is Encounter => e !== null);
}
