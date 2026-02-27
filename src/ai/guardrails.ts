// -----------------------------------------------------------
// AI Guardrails — Safety wrapping for all AI outputs
// -----------------------------------------------------------
// Every AI-generated insight passes through guardrails before
// reaching the UI. This ensures:
//   - "Not medical advice" disclaimer on all outputs
//   - Source attribution (which data from which system)
//   - Confidence framing (hedged language, not diagnostics)
//   - "Discuss with your provider" call to action
//   - Model transparency (which model, which tier)
//   - Cache timestamp for data freshness awareness
//
// REGULATORY NOTE: While SmartHealthAI is a demo, these guardrails
// model production-grade patient safety practices. In a real app
// you'd also need: audit logging, clinician review flags, and
// HIPAA-compliant data handling.
// -----------------------------------------------------------

import type { GuardedAIOutput } from "./types";
import type { SourceTag } from "../types/source";

// -----------------------------------------------------------
// Disclaimer text by tier
// -----------------------------------------------------------

const DISCLAIMER_TIER_1 =
  "This information is based on standard clinical guidelines and your health records. It is not a diagnosis or medical advice. Always consult your healthcare provider for personalized medical guidance.";

const DISCLAIMER_TIER_2_3 =
  "This AI-generated insight is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider.";

// -----------------------------------------------------------
// Model labels by tier
// -----------------------------------------------------------

function getModelLabel(tier: 1 | 2 | 3, model?: string): string {
  if (tier === 1) return "Rule-based analysis (no AI model)";
  return `AI-generated insight (${model ?? "gpt-4o-mini"})`;
}

// -----------------------------------------------------------
// Source attribution builder
// -----------------------------------------------------------

function buildSourceAttribution(sources: SourceTag[]): string {
  if (sources.length === 0) return "Based on available health records.";

  const uniqueSystems = [...new Set(sources.map((s) => s.systemName))];
  if (uniqueSystems.length === 1) {
    return `Based on data from ${uniqueSystems[0]}.`;
  }
  return `Based on cross-system data from ${uniqueSystems.join(" and ")}.`;
}

// -----------------------------------------------------------
// Confidence framing
// -----------------------------------------------------------

const CONFIDENCE_FRAMES: Record<1 | 2 | 3, string> = {
  1: "Based on standard clinical guidelines",
  2: "Commonly associated patterns identified by AI analysis",
  3: "AI-generated perspective for discussion with your provider",
};

// -----------------------------------------------------------
// Main guardrail wrapper
// -----------------------------------------------------------

/**
 * Wrap any AI analysis result in safety guardrails.
 * Call this before ANY AI output reaches the UI.
 */
export function applyGuardrails<T>(
  result: T,
  tier: 1 | 2 | 3,
  sources: SourceTag[],
  model?: string
): GuardedAIOutput<T> {
  return {
    result,
    disclaimer: tier === 1 ? DISCLAIMER_TIER_1 : DISCLAIMER_TIER_2_3,
    sourceAttribution: buildSourceAttribution(sources),
    confidenceFrame: CONFIDENCE_FRAMES[tier],
    tier,
    modelLabel: getModelLabel(tier, model),
    generatedAt: new Date().toISOString(),
  };
}

// -----------------------------------------------------------
// Prompt-level guardrails (injected into LLM system prompts)
// -----------------------------------------------------------

/**
 * System prompt prefix injected into every LLM call.
 * Instructs the model to:
 *   - Never diagnose or prescribe
 *   - Use hedged/probabilistic language
 *   - Always recommend consulting a provider
 *   - Cite sources when possible
 */
export const LLM_SYSTEM_GUARDRAIL = `You are a helpful health information assistant embedded in a patient-facing app called SmartHealthAI. 

CRITICAL RULES — You MUST follow these in every response:
1. NEVER diagnose conditions or prescribe treatments.
2. Use hedged language: "may be associated with", "commonly linked to", "could indicate" — NEVER "you have" or "this means".
3. ALWAYS end with a recommendation to discuss findings with a healthcare provider.
4. When referencing lab values, include the reference range for context.
5. Be empathetic and clear — write at a 6th-grade reading level.
6. Focus on empowering the patient with knowledge, not creating anxiety.
7. If data seems contradictory between sources, note it as something to verify with a provider.
8. Attribute observations to specific data sources when possible.`;

/**
 * Format source data for inclusion in LLM prompts.
 * Strips unnecessary fields to minimize token usage.
 */
export function formatSourcesForPrompt(sources: SourceTag[]): string {
  const unique = [...new Set(sources.map((s) => s.systemName))];
  return `Data sources: ${unique.join(", ")}`;
}

/**
 * Build the standard "discuss with provider" CTA.
 */
export function getProviderCTA(): string {
  return "Discuss these findings with your healthcare provider at your next visit.";
}

/**
 * Get the standard disclaimer for a given tier.
 */
export function getDisclaimer(tier: 1 | 2 | 3): string {
  return tier === 1 ? DISCLAIMER_TIER_1 : DISCLAIMER_TIER_2_3;
}
