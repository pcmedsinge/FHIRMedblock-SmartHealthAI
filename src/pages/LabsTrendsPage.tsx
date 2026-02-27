// -----------------------------------------------------------
// LabsTrendsPage — AI-Powered Lab Intelligence (Phase 6)
// -----------------------------------------------------------
// Single-column layout following Phase 4 design philosophy:
//   - Breathing room, generous spacing
//   - AI narrative → lab cards → vital correlations
// All Phase 5/6 features preserved: trend narrative, sparklines,
// abnormal flags, trend direction, Ask AI, vital correlations.
// -----------------------------------------------------------

import { useUnifiedData } from "../hooks/useUnifiedData";
import { usePatient } from "../hooks/usePatient";
import { useAIAnalysis } from "../hooks/useAIAnalysis";
import LabResultCard from "../components/data/LabResultCard";
import InsightCard from "../components/ui/InsightCard";
import SourceBadge from "../components/ui/SourceBadge";
import { SkeletonCardList, EmptyState } from "../components/ui/Skeleton";
import {
  TrendingUp,
  TestTube,
  BrainCircuit,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { MergedLabResult } from "../types/merged";

/** Group labs by test name for trend view */
function groupByTest(labs: MergedLabResult[]) {
  const groups = new Map<string, MergedLabResult[]>();
  for (const lab of labs) {
    const key = lab.name.toLowerCase().trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(lab);
  }
  for (const [, arr] of groups) {
    arr.sort(
      (a, b) =>
        (a.effectiveDate ?? "").localeCompare(b.effectiveDate ?? "")
    );
  }
  return groups;
}

type ViewMode = "grouped" | "timeline";

const LabsTrendsPage = () => {
  const unified = useUnifiedData();
  const { patient } = usePatient();
  const ai = useAIAnalysis(patient, unified);

  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [showNarrative, setShowNarrative] = useState(false);

  const grouped = useMemo(
    () => groupByTest(unified.labResults),
    [unified.labResults]
  );

  const abnormalCount = useMemo(() => {
    if (!ai.tier1) return 0;
    return ai.tier1.labFlags.filter((f) => f.status !== "normal").length;
  }, [ai.tier1]);

  const timeline = useMemo(
    () =>
      [...unified.labResults].sort(
        (a, b) =>
          (b.effectiveDate ?? "").localeCompare(a.effectiveDate ?? "")
      ),
    [unified.labResults]
  );

  const trendsByName = useMemo(() => {
    if (!ai.tier1) return new Map();
    const map = new Map<string, (typeof ai.tier1.labTrends)[0]>();
    for (const trend of ai.tier1.labTrends) {
      map.set(trend.labName.toLowerCase().trim(), trend);
    }
    return map;
  }, [ai.tier1]);

  const getFlagsForGroup = (results: MergedLabResult[]) => {
    if (!ai.tier1) return [];
    const ids = new Set(results.map((r) => r.id));
    return ai.tier1.labFlags.filter((f) => ids.has(f.labId));
  };

  if (unified.isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <SkeletonCardList count={6} />
      </div>
    );
  }

  if (unified.labResults.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={TestTube}
          title="No lab results found"
          description="No laboratory results were found across connected health systems."
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Labs & Trends</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
              {unified.labResults.length} results
            </span>
          </div>
          <p className="text-[15px] text-slate-500">
            {grouped.size} unique tests
            {abnormalCount > 0 && (
              <span className="text-amber-600">
                {" "}· {abnormalCount} abnormal
              </span>
            )}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("grouped")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              viewMode === "grouped"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Grouped
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              viewMode === "timeline"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* ── Scrollable content area ── */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
      <div className="space-y-3">
      {/* ── AI Lab Trend Narrative (collapsible) ── */}
      {ai.tier2.labTrendNarrative && (
        <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200 overflow-hidden">
          <button
            onClick={() => setShowNarrative(!showNarrative)}
            className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-emerald-50 transition-colors"
          >
            <BrainCircuit className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-[15px] font-bold text-emerald-900 flex-1">
              AI Lab Trend Summary
            </span>
            {showNarrative ? (
              <ChevronUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-emerald-600" />
            )}
          </button>
          {showNarrative && (
            <div className="px-5 pb-4">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {ai.tier2.labTrendNarrative.text}
              </p>
              <p className="text-xs text-slate-400 mt-3">
                {ai.disclaimer}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tier 2 loading */}
      {ai.tier2.isLoading && !ai.tier2.labTrendNarrative && (
        <div className="flex items-center gap-3 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-200/50">
          <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
          <span className="text-[15px] text-slate-600">
            Analyzing lab trends...
          </span>
        </div>
      )}

      {/* ── Lab Results ── */}
      {viewMode === "grouped" && (
        <div className="space-y-3">
          {[...grouped.entries()].map(([testName, results]) => {
            const trend = trendsByName.get(testName);
            const flags = getFlagsForGroup(results);
            const latestResult = results[results.length - 1];

            return (
              <LabResultCard
                key={testName}
                testName={testName}
                results={results}
                flags={flags}
                trend={trend}
                explanation={ai.explanations.get(latestResult.id)}
                isExplaining={ai.explainLoading === latestResult.id}
                onAskAI={ai.askAI}
                aiAvailable={ai.aiAvailable}
              />
            );
          })}
        </div>
      )}

      {/* Timeline view */}
      {viewMode === "timeline" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-[100px_1fr_80px_auto] gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wide">
            <div>Date</div>
            <div>Test / Value</div>
            <div>Range</div>
            <div className="text-right">Source</div>
          </div>
          <div className="divide-y divide-slate-100">
            {timeline.slice(0, 50).map((lab) => {
              const flag = ai.tier1?.labFlags.find(
                (f) => f.labId === lab.id
              );
              const isAbnormal = flag && flag.status !== "normal";

              return (
                <div
                  key={lab.id}
                  className={`grid grid-cols-[100px_1fr_80px_auto] gap-3 px-5 py-3 items-center ${
                    isAbnormal ? "bg-amber-50/50" : "hover:bg-slate-50"
                  } transition-colors`}
                >
                  <div className="text-sm text-slate-600">
                    {lab.effectiveDate ?? "N/A"}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[15px] font-medium text-slate-900">
                      {lab.name}
                    </span>
                    <span className="text-[15px] text-slate-600 ml-2">
                      {lab.value} {lab.unit ?? ""}
                    </span>
                    {isAbnormal && (
                      <span
                        className={`ml-2 text-xs font-bold ${
                          flag!.status.includes("critical")
                            ? "text-red-600"
                            : "text-amber-600"
                        }`}
                      >
                        {flag!.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500">
                    {lab.referenceRange?.text ??
                      (lab.referenceRange?.low != null
                        ? `${lab.referenceRange.low}–${lab.referenceRange.high ?? "?"}`
                        : "—")}
                  </div>
                  <div className="flex justify-end">
                    {lab.allSources.map((s) => (
                      <SourceBadge key={s.systemId} source={s} compact />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Vital Correlation Insights ── */}
      {ai.tier1 && ai.tier1.vitalCorrelations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-violet-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Vital & Medication Correlations
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-bold">
              {ai.tier1.vitalCorrelations.length}
            </span>
          </div>
          <div className="space-y-3">
            {ai.tier1.vitalCorrelations.map((corr) => (
              <InsightCard
                key={corr.id}
                severity={
                  corr.significance === "high"
                    ? "high"
                    : corr.significance === "medium"
                      ? "medium"
                      : "info"
                }
                title={`${corr.vitalName} + ${corr.medicationName}`}
                summary={corr.message}
                clinicalDetails={corr.detail}
                category="Vitals & Meds"
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Disclaimer ── */}
      <p className="text-xs text-slate-400 leading-relaxed text-center pt-2">
        {ai.disclaimer}
      </p>
      </div>
      </div>
    </div>
  );
};

export default LabsTrendsPage;
