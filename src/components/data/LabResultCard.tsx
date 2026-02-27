// -----------------------------------------------------------
// LabResultCard — Single lab result with trend/flags/AI
// -----------------------------------------------------------
// Shows a single lab result or a group of results for the same
// test. Includes sparkline chart, abnormal flags, trend direction,
// and "Ask AI" on-demand explanation button.
// -----------------------------------------------------------

import { useState } from "react";
import {
  TestTube,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  BrainCircuit,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import SourceBadge from "../ui/SourceBadge";
import SparklineChart from "./SparklineChart";
import { TRANSITIONS } from "../../config/designSystem";
import type { MergedLabResult } from "../../types/merged";
import type { LabAbnormalFlag, LabTrend, HealthExplanation } from "../../ai/types";

interface LabResultCardProps {
  /** Test name */
  testName: string;
  /** All results for this test (sorted by date ascending) */
  results: MergedLabResult[];
  /** Abnormal flags for these results */
  flags?: LabAbnormalFlag[];
  /** Trend analysis (if 2+ results) */
  trend?: LabTrend;
  /** AI explanation for the latest result (if fetched) */
  explanation?: HealthExplanation;
  /** Whether AI explanation is loading */
  isExplaining?: boolean;
  /** Callback to request AI explanation */
  onAskAI?: (lab: MergedLabResult) => void;
  /** Whether AI is available */
  aiAvailable?: boolean;
}

const LabResultCard = ({
  testName,
  results,
  flags = [],
  trend,
  explanation,
  isExplaining = false,
  onAskAI,
  aiAvailable = false,
}: LabResultCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const latest = results[results.length - 1];
  const hasAbnormal = flags.some(
    (f) => f.status !== "normal" && results.some((r) => r.id === f.labId)
  );
  const latestFlag = flags.find((f) => f.labId === latest.id);
  const hasTrend = results.length >= 2 && trend;

  // Build sparkline data
  const sparkData = results
    .filter((r) => typeof r.value === "number" && r.effectiveDate)
    .map((r) => ({
      date: r.effectiveDate!,
      value: r.value as number,
      label: r.unit ?? "",
    }));

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden ${TRANSITIONS.normal} hover:shadow-md ${
        hasAbnormal ? "border-amber-300 shadow-sm" : "border-slate-200"
      }`}
    >
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-slate-50/50 transition-colors"
      >
        {/* Icon */}
        <TestTube
          className={`w-5 h-5 shrink-0 ${
            hasAbnormal ? "text-amber-500" : "text-emerald-500"
          }`}
        />

        {/* Name + latest value */}
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-slate-900 capitalize">
            {testName}
          </div>
          <div className="text-sm text-slate-600">
            {results.length} result{results.length > 1 ? "s" : ""} · Latest:{" "}
            <span className="font-medium text-slate-800">
              {latest.value} {latest.unit ?? ""}
            </span>
            {latest.referenceRange?.text && (
              <span className="text-slate-500 ml-1">
                (ref: {latest.referenceRange.text})
              </span>
            )}
            {!latest.referenceRange?.text && latest.referenceRange?.low != null && (
              <span className="text-slate-500 ml-1">
                (ref: {latest.referenceRange.low}–{latest.referenceRange.high ?? "?"} {latest.unit ?? ""})
              </span>
            )}
          </div>
        </div>

        {/* Sparkline (compact) */}
        {sparkData.length >= 2 && (
          <div className="w-24 shrink-0">
            <SparklineChart
              data={sparkData}
              referenceRange={latest.referenceRange}
              height={36}
              trendDirection={trend?.direction}
            />
          </div>
        )}

        {/* Trend indicator */}
        {hasTrend && (
          <div
            className={`flex items-center gap-1 text-sm font-medium shrink-0 ${
              trend.direction === "rising"
                ? "text-red-600"
                : trend.direction === "falling"
                  ? "text-emerald-600"
                  : "text-slate-400"
            }`}
          >
            {trend.direction === "rising" && (
              <ArrowUpRight className="w-4 h-4" />
            )}
            {trend.direction === "falling" && (
              <ArrowDownRight className="w-4 h-4" />
            )}
            {trend.direction === "stable" && <Minus className="w-4 h-4" />}
            {Math.abs(trend.changePercent).toFixed(0)}%
          </div>
        )}

        {/* Abnormal badge */}
        {hasAbnormal && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-bold shrink-0">
            {latestFlag?.status === "critical-high" || latestFlag?.status === "critical-low"
              ? "CRITICAL"
              : "OUT OF RANGE"}
          </span>
        )}

        {/* Expand toggle */}
        <div className="p-1 text-slate-400">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-slate-100">
          {/* Sparkline (large) */}
          {sparkData.length >= 2 && (
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
              <SparklineChart
                data={sparkData}
                referenceRange={latest.referenceRange}
                height={80}
                trendDirection={trend?.direction}
              />
              {hasTrend && (
                <div className="text-sm text-slate-600 mt-1.5 text-center">
                  {trend.message}
                </div>
              )}
            </div>
          )}

          {/* Individual results */}
          <div className="divide-y divide-slate-100">
            {results.map((r) => {
              const flag = flags.find((f) => f.labId === r.id);
              const isAbnormalResult = flag && flag.status !== "normal";

              return (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                    isAbnormalResult ? "bg-amber-50/50" : ""
                  }`}
                >
                  <div className="w-24 text-slate-600 shrink-0">
                    {r.effectiveDate ?? "N/A"}
                  </div>
                  <div className="flex-1 font-medium text-slate-900 text-[15px]">
                    {r.value} {r.unit ?? ""}
                    {flag && flag.status !== "normal" && (
                      <span
                        className={`ml-2 text-xs font-bold ${
                          flag.status.includes("critical")
                            ? "text-red-600"
                            : flag.status === "high"
                              ? "text-amber-600"
                              : "text-blue-600"
                        }`}
                      >
                        {flag.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {r.referenceRange?.text ? (
                    <div className="text-sm text-slate-500">{r.referenceRange.text}</div>
                  ) : r.referenceRange?.low != null ? (
                    <div className="text-sm text-slate-500">
                      {r.referenceRange.low}–{r.referenceRange.high ?? "?"} {r.unit ?? ""}
                    </div>
                  ) : null}
                  {isAbnormalResult && (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <SourceBadge source={r.allSources[0]} compact />
                </div>
              );
            })}
          </div>

          {/* AI explanation */}
          {explanation && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <BrainCircuit className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    AI Explanation
                  </span>
                </div>
                <p className="text-[15px] text-slate-800 leading-relaxed">
                  {explanation.explanation}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Not medical advice — discuss with your provider
                </p>
              </div>
            </div>
          )}

          {/* Ask AI button */}
          {!explanation && aiAvailable && onAskAI && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAskAI(latest);
                }}
                disabled={isExplaining}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl
                  ${TRANSITIONS.fast} ${
                    isExplaining
                      ? "bg-slate-100 text-slate-400 cursor-wait"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
              >
                {isExplaining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Asking AI...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    Ask AI: "What does this mean?"
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LabResultCard;
