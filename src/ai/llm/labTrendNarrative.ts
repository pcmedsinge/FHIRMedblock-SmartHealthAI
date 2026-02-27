// -----------------------------------------------------------
// Tier 2 Cached LLM: Lab Trend Narrative
// -----------------------------------------------------------
// Generates a plain-language narrative summarizing lab trends.
// Uses gpt-4o-mini to produce a empathetic, 6th-grade reading
// level summary of how the patient's labs have changed over time.
//
// COST: ~$0.001 first call, $0 thereafter (cached)
// -----------------------------------------------------------

import type { MergedLabResult } from "../../types/merged";
import type { PatientDemographics } from "../../types/patient";
import type { LabTrend, LabAbnormalFlag, CachedNarrative } from "../types";
import { callLLMSafe } from "../aiService";
import { LLM_SYSTEM_GUARDRAIL, formatSourcesForPrompt } from "../guardrails";
import type { SourceTag } from "../../types/source";

// -----------------------------------------------------------
// Prompt builder
// -----------------------------------------------------------

function buildLabTrendPrompt(
  patient: PatientDemographics,
  trends: LabTrend[],
  flags: LabAbnormalFlag[],
  labs: MergedLabResult[]
): string {
  const abnormalFlags = flags.filter((f) => f.status !== "normal");
  const significantTrends = trends.filter((t) => t.direction !== "stable");

  // Collect unique sources
  const sources = [...new Set(labs.map((l) => l.source.systemName))];

  let prompt = `Summarize the following lab results for a ${patient.age}-year-old ${patient.gender} patient named ${patient.firstName}.\n\n`;

  if (significantTrends.length > 0) {
    prompt += "LAB TRENDS:\n";
    for (const trend of significantTrends) {
      prompt += `- ${trend.labName}: ${trend.direction} ${Math.abs(trend.changePercent)}% (${trend.firstReading.value} → ${trend.lastReading.value}) over ${trend.readingCount} readings spanning ${trend.spanDays} days\n`;
    }
    prompt += "\n";
  }

  if (abnormalFlags.length > 0) {
    prompt += "ABNORMAL VALUES:\n";
    for (const flag of abnormalFlags) {
      const range = flag.referenceRange;
      prompt += `- ${flag.labName}: ${flag.value} ${flag.unit} (${flag.status}, normal range: ${range.low ?? "?"}-${range.high ?? "?"} ${flag.unit})\n`;
    }
    prompt += "\n";
  }

  prompt += `Data sources: ${sources.join(", ")}\n\n`;
  prompt += `Write a 2-4 paragraph narrative summary of these lab trends and results. Focus on:\n`;
  prompt += `1. The most clinically significant trends (rising/falling values)\n`;
  prompt += `2. Any values that are outside normal ranges\n`;
  prompt += `3. What these results might mean in plain language\n`;
  prompt += `4. End with a gentle recommendation to discuss with their provider\n\n`;
  prompt += `Use the patient's first name. Be empathetic, clear, and concise. Write at a 6th-grade reading level.`;

  return prompt;
}

// -----------------------------------------------------------
// Main function
// -----------------------------------------------------------

/**
 * Generate a cached plain-language lab trend narrative.
 * Returns null if LLM is unavailable (graceful degradation).
 */
export async function generateLabTrendNarrative(
  patient: PatientDemographics,
  labs: MergedLabResult[],
  trends: LabTrend[],
  flags: LabAbnormalFlag[]
): Promise<CachedNarrative | null> {
  // Don't call LLM if there's nothing to summarize
  if (trends.length === 0 && flags.length === 0) return null;

  const allSources: SourceTag[] = [...new Set(labs.map((l) => l.source))];
  const userPrompt = buildLabTrendPrompt(patient, trends, flags, labs);

  const response = await callLLMSafe({
    system: `${LLM_SYSTEM_GUARDRAIL}\n\n${formatSourcesForPrompt(allSources)}\n\nYou are summarizing lab test results and trends. Be specific about values and ranges.`,
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
    inputHash: `lab-trend-${patient.id}-${trends.length}-${flags.length}`,
    sources: allSources,
  };
}
