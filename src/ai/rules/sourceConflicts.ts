// -----------------------------------------------------------
// Tier 1 Rule: Source Conflict Alerts
// -----------------------------------------------------------
// Wraps the Phase 3 Conflict[] model into patient-friendly
// alert messages. The merge engine detects raw conflicts;
// this module translates them into actionable, empathetic
// messages that a patient can understand and discuss with
// their provider.
//
// COST: $0 — transforms existing data
// -----------------------------------------------------------

import type { Conflict } from "../../types/merged";
import type { SourceConflictAlert } from "../types";

// -----------------------------------------------------------
// Conflict type → patient-friendly templates
// -----------------------------------------------------------

interface ConflictTemplate {
  titleTemplate: (c: Conflict) => string;
  explanationTemplate: (c: Conflict) => string;
  actionTemplate: (c: Conflict) => string;
}

const CONFLICT_TEMPLATES: Record<Conflict["type"], ConflictTemplate> = {
  "dose-mismatch": {
    titleTemplate: (c) => {
      const drugName = c.resources[0]?.display ?? "A medication";
      return `Different Doses: ${drugName}`;
    },
    explanationTemplate: (c) => {
      const sources = [c.sourceA.systemName, c.sourceB.systemName].join(" and ");
      return `${c.resources[0]?.display ?? "A medication"} appears with different dosage instructions in ${sources}. This could mean your doctors prescribed different amounts, or one record may be outdated.`;
    },
    actionTemplate: () =>
      "Bring this to your next appointment and ask your provider to confirm the correct dose.",
  },

  "allergy-prescription": {
    titleTemplate: (c) => {
      const allergy = c.resources.find((r) => r.resourceType === "Allergy");
      const med = c.resources.find((r) => r.resourceType === "Medication");
      return `⚠️ Allergy Alert: ${allergy?.display ?? "Allergy"} vs ${med?.display ?? "Medication"}`;
    },
    explanationTemplate: (c) => {
      const allergyRes = c.resources.find((r) => r.resourceType === "Allergy");
      const medRes = c.resources.find((r) => r.resourceType === "Medication");
      return `${allergyRes?.source.systemName ?? "One provider"} has an allergy to ${allergyRes?.display ?? "a substance"} on file, but ${medRes?.source.systemName ?? "another provider"} prescribed ${medRes?.display ?? "a medication"} which may be related. This could be a safety concern that needs immediate attention.`;
    },
    actionTemplate: () =>
      "Contact your provider or pharmacist as soon as possible to verify this is safe for you.",
  },

  "missing-crossref": {
    titleTemplate: (c) => {
      const item = c.resources[0]?.display ?? "A record";
      return `Missing From Other System: ${item}`;
    },
    explanationTemplate: (c) => {
      const item = c.resources[0];
      const sourceName = item?.source.systemName ?? "one provider";
      const otherSource = item?.source.systemName === c.sourceA.systemName
        ? c.sourceB.systemName
        : c.sourceA.systemName;
      return `${item?.display ?? "This record"} appears in ${sourceName} but is not in ${otherSource}. This means ${otherSource} may not know about it when making treatment decisions.`;
    },
    actionTemplate: () =>
      "Mention this to your provider so it can be added to all your records.",
  },

  "contradictory-condition": {
    titleTemplate: (c) => {
      const condition = c.resources[0]?.display ?? "A condition";
      return `Condition Status Conflict: ${condition}`;
    },
    explanationTemplate: (c) => {
      return `${c.resources[0]?.display ?? "A condition"} is recorded as active by ${c.sourceA.systemName} but may have a different status in ${c.sourceB.systemName}. Your providers may have different assessments of this condition.`;
    },
    actionTemplate: () =>
      "Ask your provider to review and update the status of this condition.",
  },

  "allergy-gap": {
    titleTemplate: (_c) => "⚠️ Missing Allergy Records",
    explanationTemplate: (c) => {
      return `${c.sourceA.systemName} has allergy information on file, but ${c.sourceB.systemName} has no allergy records. This is a significant safety gap — providers using ${c.sourceB.systemName} may not know about your allergies.`;
    },
    actionTemplate: () =>
      "At your next visit, ask the provider to update your allergy list. This is important for your safety.",
  },
};

// -----------------------------------------------------------
// Main analysis function
// -----------------------------------------------------------

/**
 * Transform Phase 3 Conflict[] into patient-friendly alerts.
 * Labels each alert as "Based on standard clinical guidelines."
 */
export function generateSourceConflictAlerts(conflicts: Conflict[]): SourceConflictAlert[] {
  return conflicts.map((conflict) => {
    const template = CONFLICT_TEMPLATES[conflict.type];

    return {
      conflictId: conflict.id,
      severity: conflict.severity,
      title: template.titleTemplate(conflict),
      explanation: template.explanationTemplate(conflict),
      actionItem: template.actionTemplate(conflict),
      sources: [conflict.sourceA, conflict.sourceB],
    };
  });
}
