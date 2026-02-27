// -----------------------------------------------------------
// Tier 2 Cached LLM: Medication Cross-System Summary
// -----------------------------------------------------------
// Generates a narrative summary of the patient's medication picture
// across all health systems. Highlights:
//   - Total medication count and sources
//   - Cross-system gaps (meds visible to one provider but not another)
//   - Drug interactions detected
//   - Dosage discrepancies
//
// COST: ~$0.001 first call, $0 thereafter (cached)
// -----------------------------------------------------------

import type { MergedMedication } from "../../types/merged";
import type { PatientDemographics } from "../../types/patient";
import type { DrugInteraction, CachedNarrative } from "../types";
import { callLLMSafe } from "../aiService";
import { LLM_SYSTEM_GUARDRAIL, formatSourcesForPrompt } from "../guardrails";
import type { SourceTag } from "../../types/source";

// -----------------------------------------------------------
// Prompt builder
// -----------------------------------------------------------

function buildMedicationPrompt(
  patient: PatientDemographics,
  medications: MergedMedication[],
  interactions: DrugInteraction[]
): string {
  const activeMeds = medications.filter(
    (m) => ["active", "completed", "on-hold"].includes(m.status.toLowerCase())
  );

  // Group by source
  const bySource = new Map<string, MergedMedication[]>();
  for (const med of activeMeds) {
    for (const src of med.allSources) {
      const group = bySource.get(src.systemName) ?? [];
      group.push(med);
      bySource.set(src.systemName, group);
    }
  }

  // Find cross-system meds (confirmed by multiple sources)
  const confirmedMeds = activeMeds.filter((m) => m.mergeStatus === "confirmed");
  const singleSourceMeds = activeMeds.filter(
    (m) => m.mergeStatus === "single-source"
  );
  const conflictMeds = activeMeds.filter(
    (m) => m.mergeStatus === "conflict"
  );

  let prompt = `Summarize the medication picture for ${patient.firstName} ${patient.lastName}, a ${patient.age}-year-old ${patient.gender} patient.\n\n`;

  prompt += `MEDICATION OVERVIEW:\n`;
  prompt += `- Total active medications: ${activeMeds.length}\n`;
  prompt += `- Confirmed across systems: ${confirmedMeds.length}\n`;
  prompt += `- Only in one system: ${singleSourceMeds.length}\n`;
  prompt += `- Conflicting records: ${conflictMeds.length}\n\n`;

  prompt += `MEDICATIONS BY SOURCE:\n`;
  for (const [source, meds] of bySource) {
    prompt += `\n${source}:\n`;
    for (const med of meds) {
      prompt += `  - ${med.name}${med.dosageInstruction ? ` (${med.dosageInstruction})` : ""} [${med.status}]\n`;
    }
  }

  if (singleSourceMeds.length > 0) {
    prompt += `\nMEDICATIONS ONLY IN ONE SYSTEM (potential gaps):\n`;
    for (const med of singleSourceMeds) {
      prompt += `  - ${med.name} → only in ${med.source.systemName}\n`;
    }
  }

  if (conflictMeds.length > 0) {
    prompt += `\nMEDICATIONS WITH CONFLICTS:\n`;
    for (const med of conflictMeds) {
      prompt += `  - ${med.name}: ${med.allSources.map((s) => s.systemName).join(" vs ")}\n`;
    }
  }

  if (interactions.length > 0) {
    prompt += `\nDRUG INTERACTIONS DETECTED:\n`;
    for (const interaction of interactions) {
      prompt += `  - [${interaction.severity.toUpperCase()}] ${interaction.drugA} + ${interaction.drugB}: ${interaction.effect}\n`;
    }
  }

  prompt += `\nWrite a 2-3 paragraph summary that:\n`;
  prompt += `1. Describes the overall medication picture in plain language\n`;
  prompt += `2. Highlights any safety concerns (interactions, single-source gaps)\n`;
  prompt += `3. Notes medications that providers may not know about (cross-system gaps)\n`;
  prompt += `4. Ends with a recommendation to bring this summary to their next appointment\n\n`;
  prompt += `Use ${patient.firstName}'s name. Be empathetic, clear, and concise. Write at a 6th-grade reading level.`;

  return prompt;
}

// -----------------------------------------------------------
// Main function
// -----------------------------------------------------------

/**
 * Generate a cached medication cross-system summary narrative.
 * Returns null if LLM is unavailable or no medications exist.
 */
export async function generateMedicationSummary(
  patient: PatientDemographics,
  medications: MergedMedication[],
  interactions: DrugInteraction[]
): Promise<CachedNarrative | null> {
  if (medications.length === 0) return null;

  const allSources: SourceTag[] = medications
    .flatMap((m) => m.allSources)
    .filter(
      (s, idx, arr) => arr.findIndex((x) => x.systemId === s.systemId) === idx
    );

  const userPrompt = buildMedicationPrompt(patient, medications, interactions);

  const response = await callLLMSafe({
    system: `${LLM_SYSTEM_GUARDRAIL}\n\n${formatSourcesForPrompt(allSources)}\n\nYou are summarizing a patient's medication list from multiple health systems. Focus on cross-system safety insights.`,
    user: userPrompt,
    model: "gpt-4o-mini",
    maxTokens: 600,
    temperature: 0.3,
  });

  if (!response) return null;

  return {
    text: response.content,
    model: response.model,
    tier: 2,
    generatedAt: response.timestamp,
    inputHash: `med-summary-${patient.id}-${medications.length}-${interactions.length}`,
    sources: allSources,
  };
}
