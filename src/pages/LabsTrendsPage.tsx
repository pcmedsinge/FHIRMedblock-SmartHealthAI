// -----------------------------------------------------------
// LabsTrendsPage — AI-Powered Lab Intelligence (Phase 6)
// -----------------------------------------------------------
// Viewport-fit two-column layout. NO scrolling on the outer shell.
// Left: compact grouped test list. Right: detail panel with
// sparkline, results history, trend info, AI explanation.
// All AI features preserved: trend narrative, sparklines,
// abnormal flags, trend direction, Ask AI, vital correlations.
// -----------------------------------------------------------

import { useUnifiedData } from "../hooks/useUnifiedData";
import { usePatient } from "../hooks/usePatient";
import { useAIAnalysis } from "../hooks/useAIAnalysis";
import SparklineChart from "../components/data/SparklineChart";
import SourceBadge from "../components/ui/SourceBadge";
import { SkeletonCardList, EmptyState } from "../components/ui/Skeleton";
import {
  TrendingUp,
  TestTube,
  BrainCircuit,
  Loader2,
  Zap,
  X,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  MessageCircle,
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
    arr.sort((a, b) => (a.effectiveDate ?? "").localeCompare(b.effectiveDate ?? ""));
  }
  return groups;
}

const LabsTrendsPage = () => {
  const unified = useUnifiedData();
  const { patient } = usePatient();
  const ai = useAIAnalysis(patient, unified);

  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [showNarrative, setShowNarrative] = useState(false);
  const [showCorrelations, setShowCorrelations] = useState(false);

  const grouped = useMemo(() => groupByTest(unified.labResults), [unified.labResults]);

  const abnormalCount = useMemo(() => {
    if (!ai.tier1) return 0;
    return ai.tier1.labFlags.filter((f) => f.status !== "normal").length;
  }, [ai.tier1]);

  const trendsByName = useMemo(() => {
    if (!ai.tier1) return new Map<string, (typeof ai.tier1.labTrends)[0]>();
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
    return (<div className="h-full flex flex-col items-center justify-center"><SkeletonCardList count={6} /></div>);
  }
  if (unified.labResults.length === 0) {
    return (<div className="h-full flex items-center justify-center"><EmptyState icon={TestTube} title="No lab results found" description="No laboratory results were found across connected health systems." /></div>);
  }

  // Selected test data
  const selResults = selectedTest ? grouped.get(selectedTest) ?? [] : [];
  const selTrend = selectedTest ? trendsByName.get(selectedTest) : undefined;
  const selFlags = getFlagsForGroup(selResults);
  const selLatest = selResults.length > 0 ? selResults[selResults.length - 1] : null;
  const selExplanation = selLatest ? ai.explanations.get(selLatest.id) : undefined;
  const selIsExplaining = selLatest ? ai.explainLoading === selLatest.id : false;
  const selSparkData = selResults
    .filter((r) => typeof r.value === "number" && r.effectiveDate)
    .map((r) => ({ date: r.effectiveDate!, value: r.value as number, label: r.unit ?? "" }));
  const correlationCount = ai.tier1?.vitalCorrelations.length ?? 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ===== HEADER ROW ===== */}
      <div className="flex items-center justify-between shrink-0 pb-2">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h1 className="text-xl font-bold text-slate-900">Labs & Trends</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
            {unified.labResults.length} results · {grouped.size} tests
          </span>
          {abnormalCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
              {abnormalCount} abnormal
            </span>
          )}
        </div>
      </div>

      {/* ===== MAIN TWO-COLUMN ===== */}
      <div className="flex-1 min-h-0 grid grid-cols-[1fr_1fr] gap-3">

        {/* LEFT — Test list */}
        <div className="flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Test rows */}
          <div className="flex-1 overflow-y-auto">
            {[...grouped.entries()].map(([testName, results]) => {
              const trend = trendsByName.get(testName);
              const flags = getFlagsForGroup(results);
              const latest = results[results.length - 1];
              const hasAbnormal = flags.some((f) => f.status !== "normal" && results.some((r) => r.id === f.labId));
              const isSelected = selectedTest === testName;
              const sparkData = results
                .filter((r) => typeof r.value === "number" && r.effectiveDate)
                .map((r) => ({ date: r.effectiveDate!, value: r.value as number, label: r.unit ?? "" }));

              return (
                <button key={testName} onClick={() => { setSelectedTest(isSelected ? null : testName); setShowNarrative(false); setShowCorrelations(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left border-b border-slate-100 last:border-0 transition-all ${
                    isSelected ? "bg-emerald-50 border-l-2 border-l-emerald-500" : "hover:bg-slate-50 border-l-2 border-l-transparent"
                  }`}>
                  <TestTube className={`w-4 h-4 shrink-0 ${hasAbnormal ? "text-amber-500" : "text-emerald-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 capitalize truncate">{testName}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {results.length} result{results.length > 1 ? "s" : ""} · Latest: <span className="font-medium text-slate-700">{latest.value} {latest.unit ?? ""}</span>
                    </div>
                  </div>
                  {/* Mini sparkline */}
                  {sparkData.length >= 2 && (
                    <div className="w-16 shrink-0">
                      <SparklineChart data={sparkData} referenceRange={latest.referenceRange} height={24} trendDirection={trend?.direction} />
                    </div>
                  )}
                  {/* Trend arrow */}
                  {trend && (
                    <div className={`flex items-center gap-0.5 text-[11px] font-bold shrink-0 ${
                      trend.direction === "rising" ? "text-red-600" : trend.direction === "falling" ? "text-emerald-600" : "text-slate-400"
                    }`}>
                      {trend.direction === "rising" && <ArrowUpRight className="w-3.5 h-3.5" />}
                      {trend.direction === "falling" && <ArrowDownRight className="w-3.5 h-3.5" />}
                      {trend.direction === "stable" && <Minus className="w-3.5 h-3.5" />}
                      {Math.abs(trend.changePercent).toFixed(0)}%
                    </div>
                  )}
                  {/* Abnormal badge */}
                  {hasAbnormal && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold shrink-0">!</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom bar — AI tools */}
          <div className="shrink-0 border-t border-slate-200 bg-slate-50 p-2 flex gap-1.5">
            {ai.tier2.labTrendNarrative && (
              <button onClick={() => { setShowNarrative(!showNarrative); setShowCorrelations(false); setSelectedTest(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium rounded-lg transition-all ${
                  showNarrative ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50"
                }`}>
                <BrainCircuit className="w-3.5 h-3.5" /> AI Summary
              </button>
            )}
            {ai.tier2.isLoading && !ai.tier2.labTrendNarrative && (
              <div className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing…
              </div>
            )}
            {correlationCount > 0 && (
              <button onClick={() => { setShowCorrelations(!showCorrelations); setShowNarrative(false); setSelectedTest(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium rounded-lg transition-all ${
                  showCorrelations ? "bg-violet-100 text-violet-700" : "bg-white text-slate-600 border border-slate-200 hover:bg-violet-50"
                }`}>
                <Zap className="w-3.5 h-3.5" /> Correlations ({correlationCount})
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — Detail panel */}
        <div className="flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* --- AI Narrative overlay --- */}
          {showNarrative && ai.tier2.labTrendNarrative ? (
            <>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 shrink-0 bg-emerald-50">
                <BrainCircuit className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-bold text-emerald-900">AI Lab Trend Summary</h2>
                <button onClick={() => setShowNarrative(false)} className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-emerald-100 transition-colors">
                  <X className="w-4 h-4 text-emerald-600" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{ai.tier2.labTrendNarrative.text}</p>
                <p className="text-xs text-slate-400 mt-4">{ai.disclaimer}</p>
              </div>
            </>
          ) : showCorrelations && ai.tier1 && ai.tier1.vitalCorrelations.length > 0 ? (
            /* --- Vital correlations overlay --- */
            <>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 shrink-0 bg-violet-50">
                <Zap className="w-5 h-5 text-violet-600" />
                <h2 className="text-sm font-bold text-violet-900">Vital & Medication Correlations</h2>
                <button onClick={() => setShowCorrelations(false)} className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-violet-100 transition-colors">
                  <X className="w-4 h-4 text-violet-600" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {ai.tier1.vitalCorrelations.map((corr) => (
                  <div key={corr.id} className={`p-3 rounded-xl border ${
                    corr.significance === "high" ? "bg-red-50 border-red-200" : corr.significance === "medium" ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="text-sm font-bold text-slate-900">{corr.vitalName} + {corr.medicationName}</div>
                    <p className="text-sm text-slate-700 mt-0.5">{corr.message}</p>
                    {corr.detail && <p className="text-xs text-slate-500 mt-1">{corr.detail}</p>}
                  </div>
                ))}
              </div>
            </>
          ) : selectedTest && selLatest ? (
            /* --- Test detail --- */
            <>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 shrink-0 bg-slate-50">
                <TestTube className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900 capitalize truncate">{selectedTest}</h2>
                <span className="text-xs text-slate-500">{selResults.length} result{selResults.length > 1 ? "s" : ""}</span>
                <button onClick={() => setSelectedTest(null)} className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {/* Large sparkline */}
                {selSparkData.length >= 2 && (
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <SparklineChart data={selSparkData} referenceRange={selLatest.referenceRange} height={80} trendDirection={selTrend?.direction} />
                    {selTrend && <p className="text-xs text-slate-600 mt-1.5 text-center">{selTrend.message}</p>}
                  </div>
                )}

                {/* Results list */}
                <div className="divide-y divide-slate-100">
                  {selResults.map((r) => {
                    const flag = selFlags.find((f) => f.labId === r.id);
                    const isAbnormal = flag && flag.status !== "normal";
                    return (
                      <div key={r.id} className={`flex items-center gap-3 px-4 py-2 text-sm ${isAbnormal ? "bg-amber-50/50" : ""}`}>
                        <div className="w-20 text-slate-600 shrink-0 text-xs">{r.effectiveDate ?? "N/A"}</div>
                        <div className="flex-1 font-medium text-slate-900">
                          {r.value} {r.unit ?? ""}
                          {isAbnormal && (
                            <span className={`ml-2 text-[10px] font-bold ${flag!.status.includes("critical") ? "text-red-600" : "text-amber-600"}`}>
                              {flag!.status.toUpperCase()}
                            </span>
                          )}
                        </div>
                        {r.referenceRange?.text ? (
                          <div className="text-xs text-slate-500">{r.referenceRange.text}</div>
                        ) : r.referenceRange?.low != null ? (
                          <div className="text-xs text-slate-500">{r.referenceRange.low}–{r.referenceRange.high ?? "?"}</div>
                        ) : null}
                        {isAbnormal && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        <SourceBadge source={r.allSources[0]} compact />
                      </div>
                    );
                  })}
                </div>

                {/* AI explanation */}
                {selExplanation && (
                  <div className="p-4 border-t border-slate-100">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <BrainCircuit className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold uppercase text-emerald-700">AI Explanation</span>
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed">{selExplanation.explanation}</p>
                      <p className="text-xs text-slate-500 mt-2">Not medical advice</p>
                    </div>
                  </div>
                )}

                {/* Ask AI button */}
                {!selExplanation && ai.aiAvailable && (
                  <div className="p-4 border-t border-slate-100">
                    <button onClick={() => ai.askAI(selLatest)} disabled={selIsExplaining}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                        selIsExplaining ? "bg-slate-100 text-slate-400 cursor-wait" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                      }`}>
                      {selIsExplaining ? <><Loader2 className="w-4 h-4 animate-spin" /> Asking AI…</> : <><MessageCircle className="w-4 h-4" /> Ask AI about this test</>}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* --- Empty state --- */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mb-3">
                <TestTube className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Lab Details</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[220px] mb-4">
                Select a test to see results history, trends, sparklines, and AI insights.
              </p>
              <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                <div className="text-center p-2 bg-emerald-50 rounded-lg">
                  <div className="text-lg font-extrabold text-emerald-700">{grouped.size}</div>
                  <div className="text-[10px] text-emerald-600 font-medium">Tests</div>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded-lg">
                  <div className="text-lg font-extrabold text-amber-700">{abnormalCount}</div>
                  <div className="text-[10px] text-amber-600 font-medium">Abnormal</div>
                </div>
                <div className="text-center p-2 bg-violet-50 rounded-lg">
                  <div className="text-lg font-extrabold text-violet-700">{correlationCount}</div>
                  <div className="text-[10px] text-violet-600 font-medium">Correlations</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabsTrendsPage;
