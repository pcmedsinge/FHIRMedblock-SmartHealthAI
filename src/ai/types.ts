// -----------------------------------------------------------
// AI Engine Types — Shared across all tiers
// -----------------------------------------------------------
// These types define the output contracts for every AI analysis.
// All domain types (Medication, LabResult, etc.) are imported
// from src/types/ — the AI engine never redefines clinical data.
// -----------------------------------------------------------

import type { SourceTag, ClinicalCode } from "../types/source";

// -----------------------------------------------------------
// Tier 1 — Rule-Based Output Types
// -----------------------------------------------------------

/** Lab abnormal flag for a single result */
export interface LabAbnormalFlag {
  /** FHIR resource ID of the lab result */
  labId: string;
  /** Lab test name */
  labName: string;
  /** Numeric value that was evaluated */
  value: number;
  /** Unit of measurement */
  unit: string;
  /** Reference range used for comparison */
  referenceRange: { low?: number; high?: number; text?: string };
  /** Determined flag status */
  status: "normal" | "high" | "low" | "critical-high" | "critical-low";
  /** Patient-friendly message */
  message: string;
  /** Source system */
  source: SourceTag;
}

/** Trend analysis for a lab with 2+ readings */
export interface LabTrend {
  /** Lab test name (grouped by code) */
  labName: string;
  /** LOINC or primary code used for grouping */
  code: ClinicalCode;
  /** Direction of the trend */
  direction: "rising" | "falling" | "stable";
  /** Percentage change from first to last reading */
  changePercent: number;
  /** Number of readings in the series */
  readingCount: number;
  /** Oldest reading */
  firstReading: { value: number; date: string };
  /** Most recent reading */
  lastReading: { value: number; date: string };
  /** Time span in days */
  spanDays: number;
  /** Patient-friendly message */
  message: string;
}

/** A care gap — something overdue or missing */
export interface CareGap {
  /** Unique ID for keying */
  id: string;
  /** Preventive care recommendation name */
  recommendation: string;
  /** Why this is recommended */
  reason: string;
  /** When it was last performed (null if never) */
  lastPerformed?: string;
  /** Whether it is overdue */
  isOverdue: boolean;
  /** Recommended frequency or age threshold */
  guideline: string;
  /** Severity/urgency */
  priority: "high" | "medium" | "low";
  /** USPSTF or guideline source */
  guidelineSource: string;
}

/** Drug interaction between two medications */
export interface DrugInteraction {
  /** Unique ID */
  id: string;
  /** First medication name */
  drugA: string;
  /** Second medication name */
  drugB: string;
  /** Interaction severity */
  severity: "critical" | "high" | "moderate" | "low";
  /** Description of the interaction */
  description: string;
  /** Clinical effect */
  effect: string;
  /** Source of the interaction data */
  dataSource: string;
  /** Source systems the drugs come from */
  drugASources: SourceTag[];
  drugBSources: SourceTag[];
}

/** Patient-friendly conflict alert from merged data */
export interface SourceConflictAlert {
  /** Original conflict ID */
  conflictId: string;
  /** Severity from the merge engine conflict */
  severity: "critical" | "high" | "medium";
  /** Patient-friendly title */
  title: string;
  /** Patient-friendly explanation */
  explanation: string;
  /** Action the patient should take */
  actionItem: string;
  /** Source systems involved */
  sources: SourceTag[];
}

/** Vital-medication correlation insight */
export interface VitalCorrelation {
  /** Unique ID */
  id: string;
  /** The vital being analyzed */
  vitalName: string;
  /** The correlated medication */
  medicationName: string;
  /** Type of correlation */
  correlationType: "effectiveness" | "side-effect" | "risk-factor" | "expected-effect";
  /** Insight message */
  message: string;
  /** Supporting detail */
  detail: string;
  /** Severity/clinical significance */
  significance: "high" | "medium" | "low";
}

// -----------------------------------------------------------
// Aggregate Tier 1 Results
// -----------------------------------------------------------

export interface Tier1Results {
  labFlags: LabAbnormalFlag[];
  labTrends: LabTrend[];
  careGaps: CareGap[];
  drugInteractions: DrugInteraction[];
  sourceConflictAlerts: SourceConflictAlert[];
  vitalCorrelations: VitalCorrelation[];
  /** Timestamp when Tier 1 analysis was run */
  analyzedAt: string;
}

// -----------------------------------------------------------
// Tier 2 — Cached LLM Output Types
// -----------------------------------------------------------

/** A single prioritized health insight for the dashboard */
export interface HealthInsight {
  /** Unique ID */
  id: string;
  /** Short title (e.g., "A1c Trending Up") */
  title: string;
  /** Detailed body text (2-4 sentences) */
  body: string;
  /** Severity for UI ordering/coloring */
  severity: "critical" | "high" | "medium" | "low" | "info";
  /** Category for grouping */
  category: "drug-interaction" | "allergy-conflict" | "care-gap" | "lab-trend" | "vital-correlation" | "medication" | "general";
  /** Source systems that contributed to this insight */
  sources: SourceTag[];
  /** Which AI tier generated this */
  tier: 1 | 2 | 3;
}

/** Cached LLM narrative text with metadata */
export interface CachedNarrative {
  /** The generated narrative text */
  text: string;
  /** Model that generated it */
  model: string;
  /** Tier that produced it */
  tier: 2 | 3;
  /** When the narrative was generated */
  generatedAt: string;
  /** SHA-256 hash of input data (for cache key) */
  inputHash: string;
  /** Source systems referenced */
  sources: SourceTag[];
}

/** Tier 2 results container */
export interface Tier2Results {
  /** Plain-language lab trend narrative */
  labTrendNarrative: CachedNarrative | null;
  /** Top 3-5 prioritized health insights */
  healthSnapshot: HealthInsight[];
  /** Medication cross-system summary */
  medicationSummary: CachedNarrative | null;
  /** Whether Tier 2 is still loading */
  isLoading: boolean;
  /** Error if Tier 2 failed */
  error: string | null;
}

// -----------------------------------------------------------
// Tier 3 — On-Demand LLM Output Types
// -----------------------------------------------------------

/** Plain-language explanation of a health concept */
export interface HealthExplanation {
  /** What was explained */
  subject: string;
  /** The plain-language explanation */
  explanation: string;
  /** Model used */
  model: string;
  /** Generated timestamp */
  generatedAt: string;
  /** Cache key */
  inputHash: string;
}

/** Questions to ask a doctor */
export interface DoctorQuestions {
  /** Context item that triggered the questions */
  context: string;
  /** 3-5 specific questions */
  questions: string[];
  /** Model used */
  model: string;
  /** Generated timestamp */
  generatedAt: string;
  /** Cache key */
  inputHash: string;
}

// -----------------------------------------------------------
// AI Service Types
// -----------------------------------------------------------

/** Configuration for the AI service */
export interface AIServiceConfig {
  /** OpenAI API key */
  apiKey: string;
  /** Default model for most calls */
  defaultModel: "gpt-4o-mini";
  /** Premium model for complex analysis */
  premiumModel: "gpt-4o";
  /** Max concurrent API requests */
  maxConcurrent: number;
  /** Cache TTL in milliseconds */
  cacheTTLMs: number;
}

/** A structured prompt for the LLM */
export interface LLMPrompt {
  /** System message defining the AI's role */
  system: string;
  /** User message with the actual query/data */
  user: string;
  /** Which model to use */
  model: "gpt-4o-mini" | "gpt-4o";
  /** Max tokens for the response */
  maxTokens: number;
  /** Temperature (0 = deterministic, 1 = creative) */
  temperature: number;
}

/** Raw response from the LLM */
export interface LLMResponse {
  /** The generated text */
  content: string;
  /** Model used */
  model: string;
  /** Tokens consumed */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Response timestamp */
  timestamp: string;
}

/** Guardrail-wrapped AI output */
export interface GuardedAIOutput<T> {
  /** The actual AI result */
  result: T;
  /** Disclaimer text */
  disclaimer: string;
  /** Source attribution */
  sourceAttribution: string;
  /** Confidence framing */
  confidenceFrame: string;
  /** Which tier produced this */
  tier: 1 | 2 | 3;
  /** Model transparency label */
  modelLabel: string;
  /** When the analysis was generated */
  generatedAt: string;
}
