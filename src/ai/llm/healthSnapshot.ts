// -----------------------------------------------------------
// Tier 2 Cached LLM: Dashboard Health Snapshot
// -----------------------------------------------------------
// Generates top 3-5 prioritized health insights for the dashboard.
// This is the "think, don't list" output that makes the app
// feel like an intelligent health companion rather than a data dump.
//
// PRIORITY ORDER:
//   1. Drug interactions (safety-critical)
//   2. Allergy-prescription conflicts (safety-critical)
//   3. Care gaps (preventive health)
//   4. Lab trends (monitoring)
//   5. Vital correlations (medication effectiveness)
//   6. General information
//
// COST: ~$0.002 first call, $0 thereafter (cached)
// -----------------------------------------------------------

import type {
  Tier1Results,
  HealthInsight,
  LabAbnormalFlag,
} from "../types";
import type { PatientDemographics } from "../../types/patient";
import type { Conflict } from "../../types/merged";
import { callLLMSafe } from "../aiService";
import { LLM_SYSTEM_GUARDRAIL } from "../guardrails";
import type { SourceTag } from "../../types/source";

// -----------------------------------------------------------
// Build Tier 1 insight cards (no LLM needed)
// -----------------------------------------------------------

function buildTier1Insights(tier1: Tier1Results, conflicts: Conflict[]): HealthInsight[] {
  const insights: HealthInsight[] = [];
  let id = 0;

  // Drug interactions → critical/high insights
  for (const interaction of tier1.drugInteractions) {
    id++;
    const crossSystem =
      JSON.stringify(interaction.drugASources) !== JSON.stringify(interaction.drugBSources);

    insights.push({
      id: `insight-ddi-${id}`,
      title: `Drug Interaction: ${interaction.drugA} + ${interaction.drugB}`,
      body: `${interaction.description}${crossSystem ? " These medications come from different providers — neither may be aware of the other prescription." : ""}`,
      severity: interaction.severity === "critical" ? "critical" : interaction.severity === "high" ? "high" : "medium",
      category: "drug-interaction",
      sources: [...interaction.drugASources, ...interaction.drugBSources],
      tier: 1,
    });
  }

  // Allergy-related conflicts
  for (const conflict of conflicts.filter((c) => c.type === "allergy-prescription" || c.type === "allergy-gap")) {
    id++;
    insights.push({
      id: `insight-conflict-${id}`,
      title: conflict.type === "allergy-prescription"
        ? `⚠️ Allergy Safety Alert`
        : `⚠️ Missing Allergy Records`,
      body: conflict.description,
      severity: "critical",
      category: "allergy-conflict",
      sources: [conflict.sourceA, conflict.sourceB],
      tier: 1,
    });
  }

  // Care gaps (overdue only)
  for (const gap of tier1.careGaps.filter((g) => g.isOverdue)) {
    id++;
    insights.push({
      id: `insight-gap-${id}`,
      title: `Overdue: ${gap.recommendation}`,
      body: `${gap.reason} ${gap.guideline}. ${gap.lastPerformed ? `Last performed: ${new Date(gap.lastPerformed).toLocaleDateString()}.` : "No record found."}`,
      severity: gap.priority === "high" ? "high" : "medium",
      category: "care-gap",
      sources: [],
      tier: 1,
    });
  }

  // Significant lab trends
  for (const trend of tier1.labTrends.filter((t) => t.direction !== "stable" && Math.abs(t.changePercent) > 10)) {
    id++;
    insights.push({
      id: `insight-trend-${id}`,
      title: `${trend.labName}: ${trend.direction === "rising" ? "↑" : "↓"} ${Math.abs(trend.changePercent)}%`,
      body: trend.message,
      severity: Math.abs(trend.changePercent) > 25 ? "high" : "medium",
      category: "lab-trend",
      sources: [],
      tier: 1,
    });
  }

  // Vital-med correlations (high significance only)
  for (const corr of tier1.vitalCorrelations.filter((c) => c.significance === "high")) {
    id++;
    insights.push({
      id: `insight-vc-${id}`,
      title: `${corr.vitalName} + ${corr.medicationName}`,
      body: corr.message,
      severity: "medium",
      category: "vital-correlation",
      sources: [],
      tier: 1,
    });
  }

  return insights;
}

// -----------------------------------------------------------
// LLM-enhanced health snapshot
// -----------------------------------------------------------

function buildSnapshotPrompt(
  patient: PatientDemographics,
  tier1Insights: HealthInsight[],
  abnormalFlags: LabAbnormalFlag[]
): string {
  let prompt = `Patient: ${patient.firstName} ${patient.lastName}, ${patient.age}yo ${patient.gender}\n\n`;
  prompt += `I have identified the following health insights from cross-system data analysis. `;
  prompt += `Please review them and generate a concise health snapshot with the TOP 3-5 most important items.\n\n`;
  prompt += `IDENTIFIED INSIGHTS:\n`;

  for (const insight of tier1Insights.slice(0, 15)) {
    prompt += `- [${insight.severity.toUpperCase()}] ${insight.title}: ${insight.body}\n`;
  }

  if (abnormalFlags.length > 0) {
    prompt += `\nABNORMAL LAB VALUES:\n`;
    for (const flag of abnormalFlags.filter((f) => f.status !== "normal").slice(0, 10)) {
      prompt += `- ${flag.labName}: ${flag.value} ${flag.unit} (${flag.status})\n`;
    }
  }

  prompt += `\nFor each insight in your response, use this exact JSON format:
[
  {
    "title": "Short title (5-8 words)",
    "body": "2-3 sentence plain-language explanation",
    "severity": "critical|high|medium|low|info",
    "category": "drug-interaction|allergy-conflict|care-gap|lab-trend|vital-correlation|medication|general"
  }
]

Prioritize safety-critical items first. Use empathetic, patient-friendly language at a 6th-grade reading level. Use ${patient.firstName}'s name naturally.`;

  return prompt;
}

/**
 * Generate the dashboard health snapshot.
 * Combines Tier 1 rule-based insights with optional LLM prioritization.
 * Falls back to Tier 1 insights only if LLM is unavailable.
 */
export async function generateHealthSnapshot(
  patient: PatientDemographics,
  tier1: Tier1Results,
  conflicts: Conflict[]
): Promise<HealthInsight[]> {
  // Always build Tier 1 insights (free)
  const tier1Insights = buildTier1Insights(tier1, conflicts);

  // Sort by severity
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };
  tier1Insights.sort(
    (a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5)
  );

  // If few insights, return Tier 1 directly (no need to pay for LLM)
  if (tier1Insights.length <= 5) {
    return tier1Insights;
  }

  // Try LLM to prioritize and refine
  const abnormalFlags = tier1.labFlags.filter((f) => f.status !== "normal");
  const userPrompt = buildSnapshotPrompt(patient, tier1Insights, abnormalFlags);

  const response = await callLLMSafe({
    system: `${LLM_SYSTEM_GUARDRAIL}\n\nYou are creating a prioritized health dashboard snapshot. Return ONLY a JSON array. No markdown formatting, no code fences.`,
    user: userPrompt,
    model: "gpt-4o-mini",
    maxTokens: 800,
    temperature: 0.2,
  });

  if (!response) {
    // Fallback: return top 5 Tier 1 insights
    return tier1Insights.slice(0, 5);
  }

  // Parse LLM response
  try {
    // Handle potential markdown code fences in response
    let jsonStr = response.content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr) as Array<{
      title: string;
      body: string;
      severity: string;
      category: string;
    }>;

    // Collect all sources from Tier 1 insights
    const allSources: SourceTag[] = tier1Insights.flatMap((i) => i.sources);
    const uniqueSources = allSources.filter(
      (s, idx) => allSources.findIndex((x) => x.systemId === s.systemId) === idx
    );

    return parsed.slice(0, 5).map((item, idx) => ({
      id: `insight-llm-${idx + 1}`,
      title: item.title,
      body: item.body,
      severity: (["critical", "high", "medium", "low", "info"].includes(item.severity)
        ? item.severity
        : "medium") as HealthInsight["severity"],
      category: (item.category ?? "general") as HealthInsight["category"],
      sources: uniqueSources,
      tier: 2 as const,
    }));
  } catch {
    // JSON parse failed — fallback to Tier 1
    console.warn("[Health Snapshot] Failed to parse LLM response, using Tier 1 fallback");
    return tier1Insights.slice(0, 5);
  }
}
