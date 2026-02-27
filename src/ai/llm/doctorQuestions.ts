// -----------------------------------------------------------
// Tier 3 On-Demand LLM: "What Should I Ask My Doctor?"
// -----------------------------------------------------------
// Generates 3-5 specific, personalized questions a patient can
// ask their doctor about a particular health finding. Triggered
// only when the user clicks "Ask my doctor about this."
//
// The questions are contextualized to the specific data item
// and its related insights (e.g., a rising A1c + diabetes care gap).
//
// COST: ~$0.001/click (cached per context after first call)
// -----------------------------------------------------------

import type { DoctorQuestions, HealthInsight } from "../types";
import type { MergedLabResult, MergedCondition, MergedMedication } from "../../types/merged";
import { callLLMSafe, hashData } from "../aiService";
import { LLM_SYSTEM_GUARDRAIL } from "../guardrails";

// -----------------------------------------------------------
// Context builders
// -----------------------------------------------------------

interface QuestionContext {
  /** What the patient is asking about */
  subject: string;
  /** Additional detail for the prompt */
  detail: string;
  /** Related insights to incorporate */
  relatedInsights: HealthInsight[];
}

/**
 * Build context for a lab result.
 */
export function labQuestionContext(
  lab: MergedLabResult,
  relatedInsights: HealthInsight[] = []
): QuestionContext {
  let detail = `Lab: ${lab.name}, Value: ${lab.value ?? "unknown"} ${lab.unit ?? ""}`;
  if (lab.referenceRange) {
    detail += `, Normal range: ${lab.referenceRange.low ?? "?"}-${lab.referenceRange.high ?? "?"} ${lab.unit ?? ""}`;
  }
  if (lab.interpretation) {
    detail += `, Interpretation: ${lab.interpretation}`;
  }
  detail += `, Source: ${lab.source.systemName}`;

  return { subject: lab.name, detail, relatedInsights };
}

/**
 * Build context for a condition.
 */
export function conditionQuestionContext(
  condition: MergedCondition,
  relatedInsights: HealthInsight[] = []
): QuestionContext {
  let detail = `Condition: ${condition.name}, Status: ${condition.clinicalStatus ?? "unknown"}`;
  if (condition.severity) detail += `, Severity: ${condition.severity}`;
  if (condition.onsetDate) detail += `, Since: ${condition.onsetDate}`;
  detail += `, Source: ${condition.source.systemName}`;

  return { subject: condition.name, detail, relatedInsights };
}

/**
 * Build context for a medication.
 */
export function medicationQuestionContext(
  med: MergedMedication,
  relatedInsights: HealthInsight[] = []
): QuestionContext {
  let detail = `Medication: ${med.name}, Status: ${med.status}`;
  if (med.dosageInstruction) detail += `, Dosage: ${med.dosageInstruction}`;
  detail += `, Source: ${med.source.systemName}`;
  if (med.allSources.length > 1) {
    detail += ` (also in: ${med.allSources.map((s) => s.systemName).join(", ")})`;
  }

  return { subject: med.name, detail, relatedInsights };
}

/**
 * Build context from a health insight.
 */
export function insightQuestionContext(
  insight: HealthInsight,
  relatedInsights: HealthInsight[] = []
): QuestionContext {
  return {
    subject: insight.title,
    detail: insight.body,
    relatedInsights: [insight, ...relatedInsights],
  };
}

// -----------------------------------------------------------
// Prompt builder
// -----------------------------------------------------------

function buildDoctorQuestionsPrompt(context: QuestionContext): string {
  let prompt = `A patient wants to ask their doctor about: ${context.subject}\n\n`;
  prompt += `Context: ${context.detail}\n\n`;

  if (context.relatedInsights.length > 0) {
    prompt += `Related health insights:\n`;
    for (const insight of context.relatedInsights.slice(0, 5)) {
      prompt += `- [${insight.severity}] ${insight.title}: ${insight.body}\n`;
    }
    prompt += `\n`;
  }

  prompt += `Generate exactly 4 specific, personalized questions this patient should ask their doctor about this topic.\n\n`;
  prompt += `Requirements:\n`;
  prompt += `1. Questions should be specific to THIS patient's data, not generic\n`;
  prompt += `2. Include at least one question about how different records/systems might affect their care\n`;
  prompt += `3. Questions should empower the patient to have an informed conversation\n`;
  prompt += `4. Use plain language — the patient will read these aloud to their doctor\n`;
  prompt += `5. Include practical questions (timing, side effects, alternatives, monitoring)\n\n`;
  prompt += `Return ONLY a JSON array of 4 question strings. No markdown, no code fences, no numbering.`;

  return prompt;
}

// -----------------------------------------------------------
// Main function
// -----------------------------------------------------------

/**
 * Generate personalized doctor questions based on a specific context.
 * Cached per context after first generation.
 * Returns null if LLM is unavailable.
 */
export async function generateDoctorQuestions(
  context: QuestionContext
): Promise<DoctorQuestions | null> {
  const userPrompt = buildDoctorQuestionsPrompt(context);

  const response = await callLLMSafe({
    system: `${LLM_SYSTEM_GUARDRAIL}\n\nYou are helping a patient prepare questions for their doctor visit. Generate specific, personalized questions based on their health data. Return ONLY a JSON array of strings.`,
    user: userPrompt,
    model: "gpt-4o-mini",
    maxTokens: 400,
    temperature: 0.4,
  });

  if (!response) return null;

  // Parse the response
  let questions: string[];
  try {
    let jsonStr = response.content.trim();
    // Handle potential markdown code fences
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    questions = JSON.parse(jsonStr);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid response format");
    }

    // Ensure all items are strings
    questions = questions.filter((q): q is string => typeof q === "string").slice(0, 5);
  } catch {
    // Fallback: try to extract questions from text
    questions = response.content
      .split("\n")
      .filter((line) => line.trim().length > 10)
      .map((line) => line.replace(/^\d+\.\s*/, "").replace(/^[-•]\s*/, "").replace(/^["']|["']$/g, "").trim())
      .filter((q) => q.endsWith("?"))
      .slice(0, 5);

    if (questions.length === 0) {
      console.warn("[Doctor Questions] Failed to parse LLM response");
      return null;
    }
  }

  const inputHash = await hashData({ subject: context.subject, detail: context.detail });

  return {
    context: context.subject,
    questions,
    model: response.model,
    generatedAt: response.timestamp,
    inputHash,
  };
}
