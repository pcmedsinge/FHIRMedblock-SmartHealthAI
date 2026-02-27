// -----------------------------------------------------------
// Tier 3 On-Demand LLM: Health Explainer
// -----------------------------------------------------------
// "What does this mean?" — explains any clinical concept in
// plain language at a 6th-grade reading level.
//
// Triggered ONLY when the user clicks "Explain this" on a
// specific lab result, medication, or condition.
//
// COST: ~$0.001/click (cached per resource after first call)
// -----------------------------------------------------------

import type { MergedLabResult, MergedCondition, MergedMedication } from "../../types/merged";
import type { HealthExplanation } from "../types";
import { callLLMSafe, hashData } from "../aiService";
import { LLM_SYSTEM_GUARDRAIL } from "../guardrails";

// -----------------------------------------------------------
// Resource type → prompt builder
// -----------------------------------------------------------

type ExplainableResource = MergedLabResult | MergedCondition | MergedMedication;

function getResourceType(resource: ExplainableResource): string {
  if ("value" in resource && "referenceRange" in resource) return "lab";
  if ("clinicalStatus" in resource && "verificationStatus" in resource && "onsetDate" in resource) return "condition";
  if ("dosageInstruction" in resource || "dosage" in resource) return "medication";
  return "unknown";
}

function buildLabPrompt(lab: MergedLabResult): string {
  let prompt = `Explain this lab result in plain language:\n\n`;
  prompt += `Test: ${lab.name}\n`;
  prompt += `Value: ${lab.value ?? "unknown"} ${lab.unit ?? ""}\n`;

  if (lab.referenceRange) {
    const range = lab.referenceRange;
    prompt += `Normal range: ${range.low ?? "?"} - ${range.high ?? "?"} ${lab.unit ?? ""}\n`;
  }

  if (lab.interpretation) {
    prompt += `Interpretation: ${lab.interpretation}\n`;
  }

  prompt += `\nExplain:\n`;
  prompt += `1. What this test measures and why it matters\n`;
  prompt += `2. Whether this result appears normal or abnormal\n`;
  prompt += `3. What common conditions are associated with abnormal values\n`;
  prompt += `4. One thing the patient can do about it\n`;
  prompt += `\nKeep it to 3-4 sentences. Use simple, everyday language.`;

  return prompt;
}

function buildConditionPrompt(condition: MergedCondition): string {
  let prompt = `Explain this health condition in plain language:\n\n`;
  prompt += `Condition: ${condition.name}\n`;
  prompt += `Status: ${condition.clinicalStatus ?? "unknown"}\n`;

  if (condition.severity) {
    prompt += `Severity: ${condition.severity}\n`;
  }

  if (condition.onsetDate) {
    prompt += `First noted: ${new Date(condition.onsetDate).toLocaleDateString()}\n`;
  }

  prompt += `\nExplain:\n`;
  prompt += `1. What this condition is in simple terms\n`;
  prompt += `2. How it might affect daily life\n`;
  prompt += `3. What treatments or management options typically exist\n`;
  prompt += `4. One encouraging fact or next step\n`;
  prompt += `\nKeep it to 3-4 sentences. Be empathetic and reassuring where appropriate.`;

  return prompt;
}

function buildMedicationPrompt(med: MergedMedication): string {
  let prompt = `Explain this medication in plain language:\n\n`;
  prompt += `Medication: ${med.name}\n`;
  prompt += `Status: ${med.status}\n`;

  if (med.dosageInstruction) {
    prompt += `Dosage: ${med.dosageInstruction}\n`;
  }

  prompt += `\nExplain:\n`;
  prompt += `1. What this medication is typically used for\n`;
  prompt += `2. How it works in simple terms\n`;
  prompt += `3. Common side effects to be aware of\n`;
  prompt += `4. Important things to know (timing, food interactions, etc.)\n`;
  prompt += `\nKeep it to 3-4 sentences. Use everyday language.`;

  return prompt;
}

// -----------------------------------------------------------
// Main function
// -----------------------------------------------------------

/**
 * Generate a plain-language explanation of a clinical resource.
 * Cached per resource after first generation.
 * Returns null if LLM is unavailable.
 */
export async function explainHealthResource(
  resource: ExplainableResource
): Promise<HealthExplanation | null> {
  const resourceType = getResourceType(resource);
  const subject = "name" in resource ? (resource as { name: string }).name : "Health item";

  let userPrompt: string;
  switch (resourceType) {
    case "lab":
      userPrompt = buildLabPrompt(resource as MergedLabResult);
      break;
    case "condition":
      userPrompt = buildConditionPrompt(resource as MergedCondition);
      break;
    case "medication":
      userPrompt = buildMedicationPrompt(resource as MergedMedication);
      break;
    default:
      userPrompt = `Explain "${subject}" in plain language in 3-4 sentences at a 6th-grade reading level.`;
  }

  const response = await callLLMSafe({
    system: `${LLM_SYSTEM_GUARDRAIL}\n\nYou are explaining a single health concept to a patient. Be concise — exactly 3-4 sentences. No bullet points or lists.`,
    user: userPrompt,
    model: "gpt-4o-mini",
    maxTokens: 300,
    temperature: 0.3,
  });

  if (!response) return null;

  const inputHash = await hashData({ type: resourceType, id: resource.id, name: subject });

  return {
    subject,
    explanation: response.content,
    model: response.model,
    generatedAt: response.timestamp,
    inputHash,
  };
}
