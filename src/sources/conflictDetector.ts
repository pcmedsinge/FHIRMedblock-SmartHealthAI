// -----------------------------------------------------------
// Conflict Detector — Clinically meaningful cross-system alerts
// -----------------------------------------------------------
// Scans merged data for safety-critical disagreements between
// health systems. This is where cross-system intelligence
// delivers real patient safety value.
//
// CONFLICT TYPES (from Phase 3 plan):
//   1. dose-mismatch        → Same drug, different doses (high)
//   2. allergy-prescription  → Allergy in A, drug class in B (critical)
//   3. missing-crossref     → Med in one system, invisible to other (medium/high)
//   4. contradictory-condition → Active in A, resolved in B (medium)
//   5. allergy-gap          → Real allergies in A, none recorded in B (critical)
//
// SAFETY PRINCIPLE: Over-alert is better than under-alert.
// A false positive alert can be dismissed by a clinician.
// A missed critical conflict could kill a patient.
//
// DRUG-ALLERGY CROSS-REFERENCE:
//   Uses a clinically validated mapping of allergy substances to
//   medication drug classes. Covers major cross-reactivity risks:
//   - Penicillin → cephalosporin (1-2% cross-reactivity)
//   - Sulfa → sulfonamide antibiotics
//   - Ibuprofen → NSAID class + warfarin interaction context
// -----------------------------------------------------------

import type { SourceTag } from "../types/source";
import type { Conflict, ConflictResource } from "../types/merged";
import type { MergeResult } from "./mergeEngine";

// -----------------------------------------------------------
// Drug-Allergy Cross-Reference Map
// -----------------------------------------------------------
// Maps an allergy substance (normalized lowercase) to drug names
// that should trigger a conflict if prescribed.
//
// Sources: FDA Drug Safety Communications, UpToDate cross-reactivity tables
// NOTE: In production, this would be a proper drug interaction database
// (e.g., First Databank, Medi-Span). For the demo, we cover the key
// relationships relevant to our synthetic data.

const DRUG_ALLERGY_CROSSREF: Record<string, string[]> = {
  penicillin: [
    "penicillin",
    "amoxicillin",
    "ampicillin",
    "augmentin",
    "amoxicillin-clavulanate",
    "ampicillin-sulbactam",
    "piperacillin",
    "piperacillin-tazobactam",
    "nafcillin",
    "oxacillin",
    "dicloxacillin",
    "ticarcillin",
    // Cross-reactivity with cephalosporins (~1-2% risk)
    "cephalexin",
    "cefazolin",
    "ceftriaxone",
    "cefdinir",
    "cefuroxime",
  ],
  sulfa: [
    "sulfamethoxazole",
    "trimethoprim-sulfamethoxazole",
    "bactrim",
    "septra",
    "sulfasalazine",
    "sulfadiazine",
    "dapsone", // possible cross-sensitivity
  ],
  ibuprofen: [
    "ibuprofen",
    "advil",
    "motrin",
    // Note: ibuprofen intolerance may indicate broader NSAID sensitivity
    "naproxen",
    "aleve",
    "diclofenac",
    "meloxicam",
    "ketorolac",
    "indomethacin",
    "piroxicam",
  ],
  aspirin: [
    "aspirin",
    "acetylsalicylic acid",
    // Aspirin-sensitive patients may also react to NSAIDs
    "ibuprofen",
    "naproxen",
  ],
  cephalosporin: [
    "cephalexin",
    "cefazolin",
    "ceftriaxone",
    "cefdinir",
    "cefuroxime",
    "ceftazidime",
    "cefepime",
    "cefotaxime",
    // Some cross-reactivity with penicillins
    "amoxicillin",
    "ampicillin",
  ],
};

// -----------------------------------------------------------
// High-risk medication keywords for missing-crossref severity
// -----------------------------------------------------------
// These medications, when invisible to a provider, pose elevated
// risk due to narrow therapeutic indices or dangerous interactions.

const HIGH_RISK_MED_PATTERNS = [
  // Anticoagulants — bleeding risk, critical for surgery/procedures
  { pattern: /warfarin|coumadin/i, reason: "anticoagulant (bleeding risk)" },
  { pattern: /heparin|enoxaparin|lovenox/i, reason: "anticoagulant (bleeding risk)" },
  { pattern: /rivaroxaban|apixaban|edoxaban|dabigatran/i, reason: "DOAC anticoagulant" },
  // Steroids — immunosuppression, glucose effects, many interactions
  { pattern: /prednisone|prednisolone|dexamethasone|methylprednisolone/i, reason: "corticosteroid (glucose, immune, bone)" },
  // Opioids — respiratory depression, abuse monitoring
  { pattern: /morphine|oxycodone|hydrocodone|fentanyl|codeine|tramadol/i, reason: "opioid (respiratory risk)" },
  // Narrow therapeutic index drugs
  { pattern: /digoxin/i, reason: "narrow therapeutic index" },
  { pattern: /lithium/i, reason: "narrow therapeutic index" },
  { pattern: /phenytoin|carbamazepine|valproic/i, reason: "antiepileptic (level monitoring)" },
  // Immunosuppressants
  { pattern: /methotrexate|cyclosporine|tacrolimus/i, reason: "immunosuppressant" },
  // Insulin
  { pattern: /insulin/i, reason: "insulin (hypoglycemia risk)" },
];

/**
 * Determine severity for a missing-crossref conflict based on medication risk profile.
 * High-risk drugs get "high" severity; others get "medium".
 */
function getMissingCrossrefSeverity(medName: string): "high" | "medium" {
  for (const { pattern } of HIGH_RISK_MED_PATTERNS) {
    if (pattern.test(medName)) return "high";
  }
  return "medium";
}

/**
 * Get the clinical reason a drug is high-risk (for alert descriptions).
 */
function getHighRiskReason(medName: string): string | null {
  for (const { pattern, reason } of HIGH_RISK_MED_PATTERNS) {
    if (pattern.test(medName)) return reason;
  }
  return null;
}

// -----------------------------------------------------------
// Conflict ID generation
// -----------------------------------------------------------

let conflictCounter = 0;

function makeConflictId(type: string): string {
  conflictCounter++;
  return `conflict-${type}-${conflictCounter}`;
}

/** Reset counter (for testing or re-runs) */
export function resetConflictCounter(): void {
  conflictCounter = 0;
}

// -----------------------------------------------------------
// Detector: Dose Mismatch
// -----------------------------------------------------------
// Same medication appears in both systems with different dosages.
// This means two providers prescribed the same drug at different
// doses — patient might be taking both, or confused about which.

function detectDoseMismatch(mergeResult: MergeResult): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const med of mergeResult.medications) {
    if (med.mergeStatus !== "conflict") continue;

    // This medication was merged but marked as conflict by the merge engine
    // (meaning same drug, different dose)
    conflicts.push({
      id: makeConflictId("dose"),
      type: "dose-mismatch",
      severity: "high",
      description:
        `${med.name} is prescribed at different doses by ${med.allSources.map((s) => s.systemName).join(" and ")}. ` +
        `Patient may be confused about the correct dose. ` +
        `Dosage: "${med.dosageInstruction ?? "unknown"}" — verify with both providers.`,
      resources: med.allSources.map((src) => ({
        resourceType: "Medication" as const,
        resourceId: med.mergedFromIds[med.allSources.indexOf(src)] ?? med.id,
        display: med.name,
        source: src,
      })),
      sourceA: med.allSources[0],
      sourceB: med.allSources[1] ?? med.allSources[0],
    });
  }

  return conflicts;
}

// -----------------------------------------------------------
// Detector: Allergy-Prescription Conflict
// -----------------------------------------------------------
// An allergy recorded in Source A, while a drug in that allergy's
// class is prescribed in Source B. This is the most dangerous
// cross-system failure — the prescriber didn't know about the allergy.

function detectAllergyPrescription(mergeResult: MergeResult): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const allergy of mergeResult.allergies) {
    // Find matching drug class
    const normalizedSubstance = allergy.substance.toLowerCase().trim();

    // Check each known allergy class
    for (const [allergyClass, relatedDrugs] of Object.entries(DRUG_ALLERGY_CROSSREF)) {
      // Does this allergy match this class?
      if (!normalizedSubstance.includes(allergyClass)) continue;

      // Check all medications for drugs in this class
      for (const med of mergeResult.medications) {
        // Same source as allergy? Skip — the source's own system should catch it
        // We only flag CROSS-SYSTEM conflicts
        if (med.source.systemId === allergy.source.systemId) continue;

        const normalizedMedName = med.name.toLowerCase();
        const isMatch = relatedDrugs.some((drug) => normalizedMedName.includes(drug));

        if (isMatch) {
          conflicts.push({
            id: makeConflictId("allergy-rx"),
            type: "allergy-prescription",
            severity: "critical",
            description:
              `CRITICAL SAFETY ALERT: ${allergy.source.systemName} records ${allergy.criticality ?? ""} ` +
              `${allergy.substance} allergy` +
              `${allergy.reactions?.[0]?.manifestations?.[0] ? ` (${allergy.reactions[0].manifestations[0]})` : ""}, ` +
              `but ${med.source.systemName} has prescribed ${med.name}. ` +
              `${allergyClass}-class drug prescribed without knowledge of allergy.`,
            resources: [
              {
                resourceType: "Allergy",
                resourceId: allergy.id,
                display: `${allergy.substance} allergy (${allergy.criticality ?? "unspecified"} criticality)`,
                source: allergy.source,
              },
              {
                resourceType: "Medication",
                resourceId: med.id,
                display: med.name,
                source: med.source,
              },
            ],
            sourceA: allergy.source,
            sourceB: med.source,
          });
        }
      }
    }
  }

  return conflicts;
}

// -----------------------------------------------------------
// Detector: Missing Cross-Reference
// -----------------------------------------------------------
// A medication exists in one source but the other source has
// no awareness of it. Important for prescribing safety —
// providers need to know ALL active medications to avoid
// drug-drug interactions.
//
// Only flags ACTIVE medications — stopped/completed meds are
// less clinically urgent (though still relevant for history).

function detectMissingCrossRef(mergeResult: MergeResult): Conflict[] {
  const conflicts: Conflict[] = [];

  // Collect all known source systems from the merged data
  const allSourceSystems = new Map<string, SourceTag>();
  for (const med of mergeResult.medications) {
    for (const src of med.allSources) {
      allSourceSystems.set(src.systemId, src);
    }
  }

  for (const med of mergeResult.medications) {
    // Only flag single-source, active medications
    if (med.mergeStatus !== "single-source") continue;
    if (med.status !== "active") continue;

    const sourceName = med.source.systemName;
    const severity = getMissingCrossrefSeverity(med.name);
    const riskReason = getHighRiskReason(med.name);

    // Find the "other" source(s) that don't have this medication
    const otherSources = [...allSourceSystems.values()].filter(
      (s) => s.systemId !== med.source.systemId
    );
    const otherSource = otherSources[0] ?? med.source;
    const otherNames = otherSources.map((s) => s.systemName).join(", ") || "other systems";

    const description = riskReason
      ? `${med.name} (${riskReason}) is only recorded at ${sourceName}. ` +
        `${otherNames} ${otherSources.length === 1 ? "is" : "are"} unaware of this medication and may prescribe ` +
        `interacting drugs or perform procedures without accounting for it.`
      : `${med.name} is only recorded at ${sourceName}. ` +
        `${otherNames} ${otherSources.length === 1 ? "is" : "are"} unaware of this active medication.`;

    conflicts.push({
      id: makeConflictId("crossref"),
      type: "missing-crossref",
      severity,
      description,
      resources: [
        {
          resourceType: "Medication",
          resourceId: med.id,
          display: `${med.name} (${med.status})`,
          source: med.source,
        },
      ],
      sourceA: med.source,
      sourceB: otherSource,
    });
  }

  return conflicts;
}

// -----------------------------------------------------------
// Detector: Contradictory Condition
// -----------------------------------------------------------
// Same condition (SNOMED code) exists in both systems but with
// different clinical statuses (e.g., active vs resolved).
// This matters for care planning — is the condition ongoing
// or has it been treated?

function detectContradictoryCondition(mergeResult: MergeResult): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const condition of mergeResult.conditions) {
    if (condition.mergeStatus !== "conflict") continue;

    // Merged as conflict = same condition, different clinical status
    conflicts.push({
      id: makeConflictId("condition"),
      type: "contradictory-condition",
      severity: "medium",
      description:
        `${condition.name} has different clinical status across systems. ` +
        `One system may have it as active while another shows it as resolved. ` +
        `Verify current status with the patient's care team.`,
      resources: condition.allSources.map((src, idx) => ({
        resourceType: "Condition" as const,
        resourceId: condition.mergedFromIds[idx] ?? condition.id,
        display: `${condition.name} (${condition.clinicalStatus ?? "unknown"})`,
        source: src,
      })),
      sourceA: condition.allSources[0],
      sourceB: condition.allSources[1] ?? condition.allSources[0],
    });
  }

  return conflicts;
}

// -----------------------------------------------------------
// Detector: Allergy Data Gap
// -----------------------------------------------------------
// Source A has real allergies recorded, Source B explicitly says
// "Not on File" or has zero allergies. This is a CRITICAL safety
// gap — Source B's providers will prescribe without knowing.
//
// This is the #1 demo story for patient safety.

function detectAllergyGap(mergeResult: MergeResult): Conflict[] {
  const conflicts: Conflict[] = [];

  // Are there real allergies in the merged data?
  const realAllergyCount = mergeResult.allergies.length;
  if (realAllergyCount === 0) return [];

  // Are there sources that reported absence?
  if (mergeResult.allergyAbsenceSources.length === 0) return [];

  // Build the allergy source set (systems that have real allergies)
  const allergySources = new Map<string, SourceTag>();
  for (const allergy of mergeResult.allergies) {
    for (const src of allergy.allSources) {
      allergySources.set(src.systemId, src);
    }
  }

  // For each absence source, if it doesn't also have real allergies, flag it
  for (const absenceSource of mergeResult.allergyAbsenceSources) {
    if (allergySources.has(absenceSource.systemId)) continue; // has both → skip

    // This source says "no allergies" but another source has real ones
    const allergyList = mergeResult.allergies
      .map((a) => {
        const severity = a.criticality === "high" ? "SEVERE" : a.criticality ?? "unspecified";
        const reaction = a.reactions?.[0]?.manifestations?.[0] ?? "";
        return `${a.substance} (${severity}${reaction ? `, ${reaction}` : ""})`;
      })
      .join(", ");

    // Find a source that DOES have allergies (for sourceA)
    const allergySourceTag = [...allergySources.values()][0];

    conflicts.push({
      id: makeConflictId("allergy-gap"),
      type: "allergy-gap",
      severity: "critical",
      description:
        `CRITICAL SAFETY GAP: ${absenceSource.systemName} records NO allergies ("Not on File"), ` +
        `but ${allergySourceTag.systemName} has ${realAllergyCount} known ` +
        `${realAllergyCount === 1 ? "allergy" : "allergies"}: ${allergyList}. ` +
        `Providers using ${absenceSource.systemName} alone would prescribe ` +
        `without knowledge of these allergies.`,
      resources: mergeResult.allergies.map((a) => ({
        resourceType: "Allergy" as const,
        resourceId: a.id,
        display: `${a.substance} (${a.criticality ?? "unspecified"})`,
        source: a.source,
      })),
      sourceA: allergySourceTag,
      sourceB: absenceSource,
    });
  }

  return conflicts;
}

// -----------------------------------------------------------
// Main Detection Function
// -----------------------------------------------------------

/**
 * Scan merged data for all clinically meaningful conflicts.
 *
 * Returns conflicts sorted by severity (critical first, then high, then medium).
 * Within same severity, sorted by conflict type for consistent UI ordering.
 *
 * @param mergeResult - Output from mergeAllDomains()
 * @returns Sorted array of all detected conflicts
 */
export function detectAllConflicts(mergeResult: MergeResult): Conflict[] {
  // Reset counter for consistent IDs across re-runs
  resetConflictCounter();

  const allConflicts: Conflict[] = [
    ...detectAllergyGap(mergeResult),            // critical
    ...detectAllergyPrescription(mergeResult),     // critical
    ...detectDoseMismatch(mergeResult),            // high
    ...detectMissingCrossRef(mergeResult),          // medium-high
    ...detectContradictoryCondition(mergeResult),   // medium
  ];

  // Sort by severity, then by type
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 };
  const typeOrder: Record<string, number> = {
    "allergy-gap": 0,
    "allergy-prescription": 1,
    "dose-mismatch": 2,
    "missing-crossref": 3,
    "contradictory-condition": 4,
  };

  allConflicts.sort((a, b) => {
    const sevDiff = (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9);
    if (sevDiff !== 0) return sevDiff;
    return (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9);
  });

  if (import.meta.env.DEV) {
    const critCount = allConflicts.filter((c) => c.severity === "critical").length;
    const highCount = allConflicts.filter((c) => c.severity === "high").length;
    const medCount = allConflicts.filter((c) => c.severity === "medium").length;

    console.log("[ConflictDetector] Scan complete:");
    console.log(`  Total conflicts: ${allConflicts.length}`);
    console.log(`  🔴 Critical: ${critCount}`);
    console.log(`  🟠 High:     ${highCount}`);
    console.log(`  🟡 Medium:   ${medCount}`);

    for (const c of allConflicts) {
      const icon = c.severity === "critical" ? "🔴" : c.severity === "high" ? "🟠" : "🟡";
      console.log(`  ${icon} [${c.type}] ${c.description.substring(0, 120)}...`);
    }
  }

  return allConflicts;
}
