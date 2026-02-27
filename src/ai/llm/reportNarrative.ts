// -----------------------------------------------------------
// Tier 3 On-Demand LLM: Pre-Visit Report Narrative
// -----------------------------------------------------------
// Generates a comprehensive pre-visit report with:
//   1. Overall health narrative (2-3 paragraphs)
//   2. Contextual doctor questions (4-5 specific)
//
// Uses gpt-4o (premium model) — this is the one feature where
// quality matters enough to justify the cost.
//
// TRIGGERED: Only when user clicks "Generate Report" button.
// CACHED: Same data = same report (SHA-256 keyed localStorage).
// COST: ~$0.01 first call, $0 thereafter.
// -----------------------------------------------------------

import type { PatientDemographics } from "../../types/patient";
import type {
  MergedMedication,
  MergedLabResult,
  MergedCondition,
  MergedAllergy,
  MergedImmunization,
  Conflict,
} from "../../types/merged";
import type { Tier1Results } from "../types";
import { callLLMSafe } from "../aiService";
import { LLM_SYSTEM_GUARDRAIL, formatSourcesForPrompt } from "../guardrails";
import type { SourceTag } from "../../types/source";

// -----------------------------------------------------------
// Report output type
// -----------------------------------------------------------

export interface PreVisitNarrative {
  /** AI-generated 2-3 paragraph health narrative */
  narrative: string;
  /** 4-5 specific, contextual doctor questions */
  questions: string[];
  /** Which model generated this */
  model: string;
  /** When it was generated */
  generatedAt: string;
}

// -----------------------------------------------------------
// Data input for the LLM
// -----------------------------------------------------------

export interface ReportInputData {
  patient: PatientDemographics;
  medications: MergedMedication[];
  labResults: MergedLabResult[];
  conditions: MergedCondition[];
  allergies: MergedAllergy[];
  immunizations: MergedImmunization[];
  conflicts: Conflict[];
  tier1: Tier1Results;
}

// -----------------------------------------------------------
// Prompt builder
// -----------------------------------------------------------

function buildReportPrompt(data: ReportInputData): string {
  const { patient, medications, labResults, conditions, allergies, immunizations, conflicts, tier1 } = data;

  const activeMeds = medications.filter((m) => m.status === "active");
  const activeConditions = conditions.filter((c) => c.clinicalStatus === "active");
  const abnormalLabs = labResults.filter(
    (l) => l.interpretation === "abnormal" || l.interpretation === "high" || l.interpretation === "low"
  );
  const criticalConflicts = conflicts.filter((c) => c.severity === "critical");
  const highConflicts = conflicts.filter((c) => c.severity === "high");

  // Collect unique sources
  const allSources = new Set<string>();
  medications.forEach((m) => m.allSources.forEach((s) => allSources.add(s.systemName)));
  labResults.forEach((l) => allSources.add(l.source.systemName));

  let prompt = `Generate a pre-visit health summary for ${patient.firstName} ${patient.lastName}, `;
  prompt += `a ${patient.age}-year-old ${patient.gender} patient.\n`;
  prompt += `Data aggregated from: ${[...allSources].join(", ")}.\n\n`;

  // Medications
  if (activeMeds.length > 0) {
    prompt += `ACTIVE MEDICATIONS (${activeMeds.length}):\n`;
    for (const med of activeMeds.slice(0, 15)) {
      const sources = med.allSources.map((s) => s.systemName).join(", ");
      prompt += `- ${med.name}${med.dosageInstruction ? ` (${med.dosageInstruction})` : ""} [${sources}]`;
      if (med.mergeStatus === "conflict") prompt += " ⚠ CONFLICT between sources";
      if (med.mergeStatus === "single-source") prompt += " (only at one provider)";
      prompt += "\n";
    }
    prompt += "\n";
  }

  // Drug interactions
  if (tier1.drugInteractions.length > 0) {
    prompt += `DRUG INTERACTIONS DETECTED:\n`;
    for (const di of tier1.drugInteractions) {
      prompt += `- [${di.severity.toUpperCase()}] ${di.drugA} + ${di.drugB}: ${di.effect}\n`;
    }
    prompt += "\n";
  }

  // Conditions
  if (activeConditions.length > 0) {
    prompt += `ACTIVE CONDITIONS:\n`;
    for (const cond of activeConditions.slice(0, 10)) {
      prompt += `- ${cond.name} (since ${cond.onsetDate ?? "unknown"})\n`;
    }
    prompt += "\n";
  }

  // Abnormal labs
  if (abnormalLabs.length > 0) {
    prompt += `ABNORMAL LAB RESULTS:\n`;
    for (const lab of abnormalLabs.slice(0, 10)) {
      prompt += `- ${lab.name}: ${lab.value} ${lab.unit ?? ""} (${lab.interpretation})`;
      if (lab.referenceRange) {
        prompt += ` [range: ${lab.referenceRange.low ?? "?"}-${lab.referenceRange.high ?? "?"} ${lab.unit ?? ""}]`;
      }
      prompt += "\n";
    }
    prompt += "\n";
  }

  // Lab trends
  const significantTrends = tier1.labTrends.filter((t) => t.direction !== "stable");
  if (significantTrends.length > 0) {
    prompt += `LAB TRENDS:\n`;
    for (const trend of significantTrends.slice(0, 8)) {
      prompt += `- ${trend.labName}: ${trend.direction} ${Math.abs(trend.changePercent)}% over ${trend.spanDays} days\n`;
    }
    prompt += "\n";
  }

  // Conflicts
  if (criticalConflicts.length > 0 || highConflicts.length > 0) {
    prompt += `CROSS-SYSTEM CONFLICTS:\n`;
    for (const c of [...criticalConflicts, ...highConflicts].slice(0, 8)) {
      prompt += `- [${c.severity.toUpperCase()}] ${c.description} (${c.sourceA.systemName} vs ${c.sourceB.systemName})\n`;
    }
    prompt += "\n";
  }

  // Allergies
  if (allergies.length > 0) {
    prompt += `ALLERGIES:\n`;
    for (const a of allergies.slice(0, 8)) {
      prompt += `- ${a.substanceName}${a.reaction ? ` (reaction: ${a.reaction})` : ""}${a.severity ? ` [${a.severity}]` : ""}\n`;
    }
    prompt += "\n";
  }

  // Care gaps
  const overdueGaps = tier1.careGaps.filter((g) => g.isOverdue);
  if (overdueGaps.length > 0) {
    prompt += `OVERDUE PREVENTIVE CARE:\n`;
    for (const gap of overdueGaps.slice(0, 5)) {
      prompt += `- ${gap.recommendation}: ${gap.reason}\n`;
    }
    prompt += "\n";
  }

  // Immunizations
  if (immunizations.length > 0) {
    prompt += `VACCINATION RECORD: ${immunizations.length} on file\n\n`;
  }

  // Vital correlations
  const highCorrelations = tier1.vitalCorrelations.filter((v) => v.significance === "high");
  if (highCorrelations.length > 0) {
    prompt += `VITAL-MEDICATION CORRELATIONS:\n`;
    for (const vc of highCorrelations.slice(0, 5)) {
      prompt += `- ${vc.message}\n`;
    }
    prompt += "\n";
  }

  prompt += `---\n\n`;
  prompt += `Please generate a JSON response with this exact structure:\n`;
  prompt += `{\n`;
  prompt += `  "narrative": "A 2-3 paragraph health summary...",\n`;
  prompt += `  "questions": ["Question 1?", "Question 2?", "Question 3?", "Question 4?"]\n`;
  prompt += `}\n\n`;
  prompt += `NARRATIVE requirements:\n`;
  prompt += `1. Write 2-3 paragraphs that summarize the patient's current health picture\n`;
  prompt += `2. Lead with the most important safety items (drug interactions, conflicts)\n`;
  prompt += `3. Cover medication picture, lab trends, and any care gaps\n`;
  prompt += `4. Note which information comes from which health system\n`;
  prompt += `5. End with encouragement and a note about discussing with the provider\n`;
  prompt += `6. Use ${patient.firstName}'s name naturally. Write at a 6th-grade reading level.\n\n`;
  prompt += `QUESTIONS requirements:\n`;
  prompt += `1. Generate exactly 4-5 specific questions based on THIS patient's data\n`;
  prompt += `2. At least one question about cross-system medication awareness\n`;
  prompt += `3. At least one question about any abnormal lab results or trends\n`;
  prompt += `4. Questions should be practical and ready to read aloud to a doctor\n`;
  prompt += `5. If there are conflicts, include a question about reconciling records\n\n`;
  prompt += `Return ONLY valid JSON. No markdown, no code fences, no extra text.`;

  return prompt;
}

// -----------------------------------------------------------
// Main function
// -----------------------------------------------------------

/**
 * Generate a pre-visit health narrative and doctor questions.
 * Uses gpt-4o for highest quality output.
 * Triggered ONLY by user clicking "Generate Report".
 * Cached after first generation — same data = same report = $0.
 * Returns null if LLM is unavailable.
 */
export async function generatePreVisitNarrative(
  data: ReportInputData
): Promise<PreVisitNarrative | null> {
  // Collect all sources for the system prompt
  const allSources: SourceTag[] = [];
  const seenSystems = new Set<string>();
  for (const med of data.medications) {
    for (const s of med.allSources) {
      if (!seenSystems.has(s.systemId)) {
        seenSystems.add(s.systemId);
        allSources.push(s);
      }
    }
  }
  for (const lab of data.labResults) {
    if (!seenSystems.has(lab.source.systemId)) {
      seenSystems.add(lab.source.systemId);
      allSources.push(lab.source);
    }
  }

  const userPrompt = buildReportPrompt(data);

  const response = await callLLMSafe({
    system:
      `${LLM_SYSTEM_GUARDRAIL}\n\n` +
      `${formatSourcesForPrompt(allSources)}\n\n` +
      `You are generating a comprehensive pre-visit health summary. ` +
      `This report will be printed and taken to a doctor's appointment. ` +
      `Be thorough, specific, and empathetic. Prioritize safety-critical items. ` +
      `Return ONLY valid JSON with "narrative" (string) and "questions" (string array).`,
    user: userPrompt,
    model: "gpt-4o",
    maxTokens: 1200,
    temperature: 0.3,
  });

  if (!response) return null;

  // Parse JSON response
  try {
    let jsonStr = response.content.trim();
    // Handle potential markdown code fences
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr) as {
      narrative?: string;
      questions?: string[];
    };

    const narrative = parsed.narrative ?? "";
    let questions = parsed.questions ?? [];

    // Validate questions are strings
    questions = questions.filter((q): q is string => typeof q === "string" && q.length > 5);
    if (questions.length === 0) {
      questions = [
        "Are all my current doctors aware of every medication I'm taking?",
        "Are there any lab trends I should be concerned about?",
        "Is my current medication plan still the best approach?",
        "Are there any preventive screenings I should schedule?",
      ];
    }

    return {
      narrative,
      questions: questions.slice(0, 5),
      model: response.model,
      generatedAt: response.timestamp,
    };
  } catch {
    console.warn("[Report Narrative] Failed to parse LLM JSON, extracting manually");

    // Fallback: use raw text as narrative
    return {
      narrative: response.content.trim(),
      questions: [
        "Are all my current doctors aware of every medication I'm taking?",
        "Are there any lab trends I should be concerned about?",
        "Is my current medication plan still the best approach?",
        "Are there any preventive screenings I should schedule?",
      ],
      model: response.model,
      generatedAt: response.timestamp,
    };
  }
}
