// -----------------------------------------------------------
// InsightsList — Sorted list of AI insight cards
// -----------------------------------------------------------
// Renders a prioritized list of HealthInsight items using
// the existing InsightCard component. Insights are pre-sorted
// by severity (critical → high → medium → low → info).
// -----------------------------------------------------------

import InsightCard from "../ui/InsightCard";
import type { HealthInsight } from "../../ai/types";
import type { SeverityLevel } from "../../config/designSystem";
import { BrainCircuit, Loader2 } from "lucide-react";
import { TRANSITIONS } from "../../config/designSystem";

interface InsightsListProps {
  /** Insight items to display */
  insights: HealthInsight[];
  /** Whether insights are still loading */
  isLoading?: boolean;
  /** Max number of insights to show (default: all) */
  maxItems?: number;
  /** Title for the section */
  title?: string;
  /** Compact mode — smaller cards */
  compact?: boolean;
}

/** Map category to patient-friendly label */
const CATEGORY_LABELS: Record<string, string> = {
  "drug-interaction": "Medication Safety",
  "allergy-conflict": "Allergy Alert",
  "care-gap": "Preventive Care",
  "lab-trend": "Lab Trends",
  "vital-correlation": "Vitals & Meds",
  medication: "Medications",
  general: "Health Info",
};

/** Map AI severity to design system severity */
function mapSeverity(s: HealthInsight["severity"]): SeverityLevel {
  switch (s) {
    case "critical":
      return "critical";
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
    case "info":
      return "info";
    default:
      return "info";
  }
}

const InsightsList = ({
  insights,
  isLoading = false,
  maxItems,
  title = "AI Health Insights",
  compact = false,
}: InsightsListProps) => {
  // Sort by severity
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };

  const sorted = [...insights].sort(
    (a, b) =>
      (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5)
  );

  const displayed = maxItems ? sorted.slice(0, maxItems) : sorted;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <BrainCircuit className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        </div>
        <div className="flex items-center gap-3 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-200/50">
          <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
          <span className="text-[15px] text-slate-600">
            SmartHealth AI is analyzing your records...
          </span>
        </div>
      </div>
    );
  }

  if (displayed.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BrainCircuit className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
            {insights.length} finding{insights.length !== 1 ? "s" : ""}
          </span>
        </div>
        {maxItems && insights.length > maxItems && (
          <span className="text-sm text-slate-500">
            Showing top {maxItems} of {insights.length}
          </span>
        )}
      </div>

      {/* Insight cards */}
      <div className={compact ? "space-y-2" : "space-y-3"}>
        {displayed.map((insight) => (
          <InsightCard
            key={insight.id}
            severity={mapSeverity(insight.severity)}
            title={insight.title}
            summary={insight.body}
            category={CATEGORY_LABELS[insight.category] ?? insight.category}
            sourceA={insight.sources[0]}
            sourceB={insight.sources[1]}
          />
        ))}
      </div>
    </div>
  );
};

export default InsightsList;
