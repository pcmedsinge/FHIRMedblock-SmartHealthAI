// -----------------------------------------------------------
// allergyParser — Converts raw FHIR AllergyIntolerance → Allergy
// -----------------------------------------------------------

import type { Allergy, AllergyReaction } from "../types/allergy";
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
function extractReactions(resource: any): AllergyReaction[] {
  if (!resource.reaction) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return resource.reaction.map((r: any) => ({
    description: r.description,
    manifestations: (r.manifestation ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((m: any) => m.text || m.coding?.[0]?.display || "Unknown")
      .filter(Boolean),
    severity: r.severity,
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

/**
 * Parse a raw FHIR AllergyIntolerance resource into an Allergy type.
 * Returns null if the resource is unparseable.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseAllergy(resource: any, source: SourceTag): Allergy | null {
  if (!resource || resource.resourceType !== "AllergyIntolerance") {
    return null;
  }

  try {
    return {
      id: resource.id ?? `allergy-${Date.now()}`,
      clinicalStatus: extractClinicalStatus(resource),
      verificationStatus: extractVerificationStatus(resource),
      type: resource.type,
      category: resource.category,
      criticality: resource.criticality,
      substance: resource.code?.text || resource.code?.coding?.[0]?.display || "Unknown Substance",
      codes: extractCodes(resource.code),
      reactions: extractReactions(resource),
      recordedDate: resource.recordedDate,
      source,
    };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("Failed to parse AllergyIntolerance:", resource.id, err);
    }
    return null;
  }
}

/**
 * Parse a FHIR Bundle of AllergyIntolerance resources.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseAllergyBundle(bundle: any, source: SourceTag): Allergy[] {
  if (!bundle?.entry) return [];
  return bundle.entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((entry: any) => parseAllergy(entry.resource, source))
    .filter((a: Allergy | null): a is Allergy => a !== null);
}
