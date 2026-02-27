// -----------------------------------------------------------
// medicationParser — Converts raw FHIR MedicationRequest → Medication
// -----------------------------------------------------------

import type { Medication } from "../types/medication";
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
function extractMedicationName(resource: any): string {
  // Try medicationCodeableConcept first (inline)
  if (resource.medicationCodeableConcept) {
    const concept = resource.medicationCodeableConcept;
    return concept.text || concept.coding?.[0]?.display || "Unknown Medication";
  }
  // Try medicationReference (reference to Medication resource)
  if (resource.medicationReference?.display) {
    return resource.medicationReference.display;
  }
  return "Unknown Medication";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractDosageInfo(resource: any): { instruction?: string; value?: number; unit?: string; frequency?: string } {
  const dosage = resource.dosageInstruction?.[0];
  if (!dosage) return {};

  const instruction = dosage.text;
  const doseQuantity = dosage.doseAndRate?.[0]?.doseQuantity;
  const timing = dosage.timing?.code?.text || dosage.timing?.repeat?.frequency
    ? `${dosage.timing.repeat.frequency}x per ${dosage.timing.repeat.period} ${dosage.timing.repeat.periodUnit}`
    : undefined;

  return {
    instruction,
    value: doseQuantity?.value,
    unit: doseQuantity?.unit,
    frequency: timing,
  };
}

/**
 * Parse a raw FHIR MedicationRequest resource into a Medication type.
 * Returns null if the resource is unparseable.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseMedication(resource: any, source: SourceTag): Medication | null {
  if (!resource || resource.resourceType !== "MedicationRequest") {
    return null;
  }

  try {
    const codes = resource.medicationCodeableConcept
      ? extractCodes(resource.medicationCodeableConcept)
      : [];

    const dosageInfo = extractDosageInfo(resource);

    return {
      id: resource.id ?? `med-${Date.now()}`,
      status: resource.status ?? "unknown",
      intent: resource.intent ?? "order",
      name: extractMedicationName(resource),
      codes,
      dosageInstruction: dosageInfo.instruction,
      dosage: dosageInfo.value ? {
        value: dosageInfo.value,
        unit: dosageInfo.unit,
        frequency: dosageInfo.frequency,
      } : undefined,
      prescriber: resource.requester?.display,
      dateWritten: resource.authoredOn,
      source,
    };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("Failed to parse MedicationRequest:", resource.id, err);
    }
    return null;
  }
}

/**
 * Parse a FHIR Bundle of MedicationRequest resources.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseMedicationBundle(bundle: any, source: SourceTag): Medication[] {
  if (!bundle?.entry) return [];
  return bundle.entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((entry: any) => parseMedication(entry.resource, source))
    .filter((m: Medication | null): m is Medication => m !== null);
}
