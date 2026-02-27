// -----------------------------------------------------------
// DashboardPage — AI-Powered Health Overview (Phase 6)
// -----------------------------------------------------------
// Viewport-fit single-page layout matching Phase 4 design:
//   - Everything visible without scrolling
//   - Alert banner with overlay expansion (rich details)
//   - Stat cards 3×2 (clickable), providers + nav split at bottom
//   - AI insights merged into alert items (critical/high)
// -----------------------------------------------------------

import { useState, useMemo } from "react";
import { useUnifiedData } from "../hooks/useUnifiedData";
import { usePatient } from "../hooks/usePatient";
import { useAIAnalysis } from "../hooks/useAIAnalysis";
import { SkeletonCardList, EmptyState } from "../components/ui/Skeleton";
import SourceBadge from "../components/ui/SourceBadge";
import type { SourceConflictAlert, DrugInteraction } from "../ai/types";
import type { Conflict, ConflictResource } from "../types/merged";
import {
  Pill,
  TestTube,
  Activity,
  Heart,
  AlertTriangle,
  Syringe,
  ArrowRight,
  RefreshCw,
  FileText,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Database,
  Loader2,
  CheckCircle2,
  FileDown,
  ClipboardList,
  ChevronRight,
  Zap,
  Info,
} from "lucide-react";
import { Link } from "react-router-dom";

// -----------------------------------------------------------
// Stat card config (with optional link targets)
// -----------------------------------------------------------

const DOMAIN_STATS = [
  { key: "medications", label: "Medications", icon: Pill, iconBg: "bg-blue-500", bg: "bg-blue-50", to: "/medications" },
  { key: "labResults", label: "Labs & Vitals", icon: TestTube, iconBg: "bg-emerald-500", bg: "bg-emerald-50", to: "/labs" },
  { key: "vitals", label: "Vitals", icon: Activity, iconBg: "bg-violet-500", bg: "bg-violet-50", to: null },
  { key: "conditions", label: "Conditions", icon: Heart, iconBg: "bg-rose-500", bg: "bg-rose-50", to: null },
  { key: "allergies", label: "Allergies", icon: AlertTriangle, iconBg: "bg-amber-500", bg: "bg-amber-50", to: null },
  { key: "immunizations", label: "Immunizations", icon: Syringe, iconBg: "bg-teal-500", bg: "bg-teal-50", to: null },
] as const;

// -----------------------------------------------------------
// Quick nav links
// -----------------------------------------------------------

const QUICK_NAV = [
  { to: "/medications", label: "Medications", desc: "Full list & safety checks", icon: Pill, bg: "bg-blue-50", color: "text-blue-600" },
  { to: "/labs", label: "Labs & Vitals", desc: "Trends & out-of-range", icon: TestTube, bg: "bg-emerald-50", color: "text-emerald-600" },
  { to: "/pre-visit", label: "Visit Prep", desc: "Report for your doctor", icon: FileText, bg: "bg-violet-50", color: "text-violet-600" },
] as const;

// -----------------------------------------------------------
// Rich alert item type — carries full detail for expansion
// -----------------------------------------------------------

interface RichAlertItem {
  id: string;
  type: "conflict" | "interaction";
  category: "allergy" | "medication" | "record-gap" | "condition";
  severity: "urgent" | "important" | "note";
  title: string;
  explanation: string;
  actionItem: string;
  clinicalDetails?: string;
  relatedResources: ConflictResource[];
}

/** Category display config */
const CATEGORY_CONFIG: Record<RichAlertItem["category"], { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  allergy:     { label: "Allergy Alerts",     icon: AlertTriangle, color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200" },
  medication:  { label: "Medication Alerts",   icon: Pill,          color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200" },
  "record-gap": { label: "Record Gaps",       icon: ShieldAlert,   color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200" },
  condition:   { label: "Condition Alerts",    icon: Heart,         color: "text-rose-700",   bg: "bg-rose-50",   border: "border-rose-200" },
};

// -----------------------------------------------------------
// Component
// -----------------------------------------------------------

const DashboardPage = () => {
  const unified = useUnifiedData();
  const { patient } = usePatient();
  const ai = useAIAnalysis(patient, unified);
  const [alertsExpanded, setAlertsExpanded] = useState(false);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [showClinicalFor, setShowClinicalFor] = useState<string | null>(null);

  // Map conflict IDs to their full Conflict data for clinical details
  const conflictMap = useMemo(() => {
    const map = new Map<string, Conflict>();
    for (const c of unified.conflicts) map.set(c.id, c);
    return map;
  }, [unified.conflicts]);

  // Build rich alert items from Tier 1 data
  const alertItems = useMemo<RichAlertItem[]>(() => {
    const items: RichAlertItem[] = [];

    // Map conflict types to UI categories
    const conflictTypeToCategory = (type: string): RichAlertItem["category"] => {
      switch (type) {
        case "allergy-prescription":
        case "allergy-gap":
          return "allergy";
        case "dose-mismatch":
          return "medication";
        case "contradictory-condition":
          return "condition";
        default:
          return "record-gap";
      }
    };

    if (ai.tier1) {
      for (const alert of ai.tier1.sourceConflictAlerts) {
        const fullConflict = conflictMap.get(alert.conflictId);
        items.push({
          id: alert.conflictId,
          type: "conflict",
          category: conflictTypeToCategory(fullConflict?.type ?? "missing-crossref"),
          severity:
            alert.severity === "critical"
              ? "urgent"
              : alert.severity === "high"
                ? "important"
                : "note",
          title: alert.title,
          explanation: alert.explanation,
          actionItem: alert.actionItem,
          clinicalDetails: fullConflict?.description,
          relatedResources: fullConflict?.resources ?? [],
        });
      }
      for (const d of ai.tier1.drugInteractions) {
        items.push({
          id: d.id,
          type: "interaction",
          category: "medication",
          severity: d.severity === "critical" ? "urgent" : "important",
          title: `${d.drugA} + ${d.drugB}: ${d.effect}`,
          explanation: d.description,
          actionItem:
            d.severity === "critical"
              ? "Talk to your doctor or pharmacist immediately about this combination."
              : "Mention this combination at your next appointment.",
          clinicalDetails: `Interaction between ${d.drugA} (from ${d.drugASources.map((s) => s.systemName).join(", ")}) and ${d.drugB} (from ${d.drugBSources.map((s) => s.systemName).join(", ")}). ${d.description}`,
          relatedResources: [],
        });
      }
    }

    return items;
  }, [ai.tier1, conflictMap]);

  // Sort alerts: urgent first, then important, then note
  const SEVERITY_ORDER: Record<string, number> = { urgent: 0, important: 1, note: 2 };
  const sortedAlertItems = useMemo(
    () => [...alertItems].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)),
    [alertItems]
  );

  // Group sorted alerts by category (preserving severity order within each group)
  const CATEGORY_ORDER: RichAlertItem["category"][] = ["allergy", "medication", "condition", "record-gap"];
  const groupedAlerts = useMemo(() => {
    const groups: Array<{ category: RichAlertItem["category"]; items: RichAlertItem[] }> = [];
    for (const cat of CATEGORY_ORDER) {
      const items = sortedAlertItems.filter((a) => a.category === cat);
      if (items.length > 0) groups.push({ category: cat, items });
    }
    return groups;
  }, [sortedAlertItems]);

  const attentionCount = sortedAlertItems.length;

  // Record counts
  const counts: Record<string, number> = {
    medications: unified.medications.length,
    labResults: unified.labResults.length,
    vitals: unified.vitals.length,
    conditions: unified.conditions.length,
    allergies: unified.allergies.length,
    immunizations: unified.immunizations.length,
  };

  const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);

  // Loading
  if (unified.isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <SkeletonCardList count={6} />
      </div>
    );
  }

  if (unified.error) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load health data"
          description={unified.error}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden animate-content-reveal">
      {/* ── Row 1: Header ── */}
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Health Overview</h1>
          <p className="text-[15px] text-slate-500">
            {unified.sourceSummary.length} connected provider
            {unified.sourceSummary.length !== 1 ? "s" : ""} · {totalRecords}{" "}
            total records
          </p>
        </div>
        <button
          onClick={unified.refetch}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Status banners — AI unavailable / Epic down */}
      {!ai.aiAvailable && (
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-amber-50/80 rounded-xl border border-amber-200/60" role="status">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-sm text-amber-800">
            AI insights unavailable — showing rule-based analysis only
          </span>
        </div>
      )}
      {unified.stageStatus.epic === "error" && (
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-blue-50/80 rounded-xl border border-blue-200/60" role="status">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-sm text-blue-800">
            Live data unavailable — showing synthetic records only
          </span>
        </div>
      )}

      {/* ── Row 2: Alert banner with rich overlay expansion ── */}
      {sortedAlertItems.length > 0 && (
        <div className="shrink-0 relative z-10">
          <button
            onClick={() => setAlertsExpanded(!alertsExpanded)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-50 to-amber-50 border-2 border-red-200 rounded-2xl hover:from-red-100 hover:to-amber-100 transition-all"
          >
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-[15px] font-bold text-red-900">
                {attentionCount} item
                {attentionCount !== 1 ? "s" : ""} need
                your attention
              </span>
              <span className="text-sm text-slate-600 ml-2">
                Records differ between your providers
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-red-700">
              {alertsExpanded ? "Close" : "Review"}
              {alertsExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>

          {/* Rich overlay dropdown — doesn't push content */}
          {alertsExpanded && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl z-20 flex flex-col" style={{ maxHeight: "calc(100vh - 240px)" }}>
              <div className="flex-1 min-h-0 overflow-y-auto">
                {groupedAlerts.map(({ category, items }) => {
                  const catConfig = CATEGORY_CONFIG[category];
                  const CatIcon = catConfig.icon;

                  return (
                    <div key={category}>
                      {/* Category header */}
                      <div className={`sticky top-0 z-10 flex items-center gap-2 px-5 py-2.5 ${catConfig.bg} border-b ${catConfig.border}`}>
                        <CatIcon className={`w-4 h-4 ${catConfig.color}`} />
                        <span className={`text-sm font-bold uppercase tracking-wide ${catConfig.color}`}>
                          {catConfig.label}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${catConfig.bg} ${catConfig.color} border ${catConfig.border}`}>
                          {items.length}
                        </span>
                      </div>

                      {/* Alert items within this category */}
                      <div className="divide-y divide-slate-100">
                        {items.map((item) => {
                          const isItemExpanded = expandedAlertId === item.id;
                          const isClinicalVisible = showClinicalFor === item.id;

                          return (
                            <div key={item.id}>
                              {/* Collapsed row — click to expand */}
                              <button
                                onClick={() =>
                                  setExpandedAlertId(isItemExpanded ? null : item.id)
                                }
                                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group"
                              >
                                {/* Severity dot */}
                                <div
                                  className={`w-3 h-3 rounded-full shrink-0 ring-2 ring-offset-1 ${
                                    item.severity === "urgent"
                                      ? "bg-red-500 ring-red-200"
                                      : item.severity === "important"
                                        ? "bg-amber-500 ring-amber-200"
                                        : "bg-slate-400 ring-slate-200"
                                  }`}
                                />

                                {/* Title */}
                                <span className="flex-1 text-[15px] font-semibold text-slate-900 text-left leading-snug">
                                  {item.title}
                                </span>

                                {/* Severity badge */}
                                <span
                                  className={`text-xs font-extrabold px-3 py-1.5 rounded-lg shrink-0 ${
                                    item.severity === "urgent"
                                      ? "bg-red-100 text-red-800 border border-red-300"
                                      : item.severity === "important"
                                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                                        : "bg-slate-100 text-slate-700 border border-slate-300"
                                  }`}
                                >
                                  {item.severity === "urgent" ? "URGENT" : item.severity === "important" ? "IMPORTANT" : "INFO"}
                                </span>

                                {/* Expand/collapse — prominent styled button */}
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                    isItemExpanded
                                      ? "bg-slate-200 text-slate-700"
                                      : "bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700"
                                  }`}
                                >
                                  {isItemExpanded ? (
                                    <ChevronUp className="w-5 h-5" strokeWidth={2.5} />
                                  ) : (
                                    <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
                                  )}
                                </div>
                              </button>

                              {/* Expanded detail panel */}
                              {isItemExpanded && (
                                <div className="px-5 pb-5 space-y-4 ml-6 border-l-2 border-slate-200">
                                  {/* WHAT THIS MEANS */}
                                  <div className="bg-red-50/80 rounded-xl px-4 py-3 border border-red-100">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                      <Zap className="w-4 h-4 text-red-600" />
                                      <span className="text-xs font-extrabold text-red-700 uppercase tracking-wider">
                                        What This Means
                                      </span>
                                    </div>
                                    <p className="text-[14px] font-medium text-slate-800 leading-relaxed">
                                      {item.explanation}
                                    </p>
                                  </div>

                                  {/* RECOMMENDED ACTION */}
                                  <div className="bg-emerald-50 rounded-xl px-4 py-3 flex items-start gap-2.5 border border-emerald-200">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                      <div className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider mb-1">
                                        Recommended Action
                                      </div>
                                      <p className="text-[14px] font-medium text-emerald-900 leading-relaxed">
                                        {item.actionItem}
                                      </p>
                                    </div>
                                  </div>

                                  {/* CLINICAL DETAILS toggle — prominent button */}
                                  {item.clinicalDetails && (
                                    <div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowClinicalFor(isClinicalVisible ? null : item.id);
                                        }}
                                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                          isClinicalVisible
                                            ? "bg-slate-700 text-white border-slate-700 shadow-md"
                                            : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 hover:border-slate-400"
                                        }`}
                                      >
                                        <ClipboardList className="w-4 h-4" />
                                        {isClinicalVisible ? "Hide Clinical Details" : "Show Clinical Details"}
                                        <ChevronRight
                                          className={`w-4 h-4 transition-transform ${isClinicalVisible ? "rotate-90" : ""}`}
                                        />
                                      </button>

                                      {isClinicalVisible && (
                                        <div className="mt-3 bg-slate-50 rounded-xl border-2 border-slate-300 p-4 space-y-4">
                                          <div>
                                            <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2">
                                              Clinical Details
                                            </div>
                                            <p className="text-[14px] font-medium text-slate-800 leading-relaxed">
                                              {item.clinicalDetails}
                                            </p>
                                          </div>

                                          {/* RELATED RECORDS */}
                                          {item.relatedResources.length > 0 && (
                                            <div>
                                              <div className="text-xs font-extrabold text-red-600 uppercase tracking-wider mb-2">
                                                Related Records
                                              </div>
                                              <div className="space-y-2">
                                                {item.relatedResources.map((r) => (
                                                  <div
                                                    key={r.resourceId}
                                                    className="flex items-center gap-2.5 text-sm bg-white rounded-lg px-3 py-2 border border-slate-200"
                                                  >
                                                    <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                                                    <span className="font-semibold text-slate-900">
                                                      {r.display}
                                                    </span>
                                                    <span className="text-slate-300">|</span>
                                                    <SourceBadge source={r.source} compact />
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="shrink-0 flex items-center justify-between px-5 py-3 border-t border-slate-100">
                <span className="text-sm text-slate-500">
                  {sortedAlertItems.length} total item
                  {sortedAlertItems.length !== 1 ? "s" : ""}
                </span>
                <Link
                  to="/pre-visit"
                  className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  Include in visit report
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI loading indicator (slim, only during Tier 2 load) */}
      {ai.tier2.isLoading && ai.tier2.healthSnapshot.length === 0 && (
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-emerald-50/60 rounded-xl border border-emerald-200/50" role="status" aria-live="polite">
          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" aria-hidden="true" />
          <span className="text-sm text-slate-600">
            Analyzing your health records...
          </span>
        </div>
      )}

      {/* ── Row 3: Stat cards 3×2 grid (clickable where applicable) ── */}
      <div className="shrink-0 grid grid-cols-3 gap-3">
        {DOMAIN_STATS.map(({ key, label, icon: Icon, iconBg, bg, to }) => {
          const inner = (
            <>
              <div
                className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-[15px] font-semibold text-slate-700">
                {label}
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {counts[key] ?? 0}
              </div>
            </>
          );

          return to ? (
            <Link
              key={key}
              to={to}
              className={`flex items-center gap-3 p-4 ${bg} rounded-2xl border border-slate-200/60 hover:shadow-md hover:scale-[1.02] transition-all`}
            >
              {inner}
            </Link>
          ) : (
            <div
              key={key}
              className={`flex items-center gap-3 p-4 ${bg} rounded-2xl border border-slate-200/60`}
            >
              {inner}
            </div>
          );
        })}
      </div>

      {/* ── Row 4: Bottom split — Providers + Quick Nav ── */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-6">
        {/* Left: Connected Providers */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Connected Providers
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 content-start">
            {unified.sourceSummary.map((src) => (
              <div
                key={src.source.systemId}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <SourceBadge source={src.source} />
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold text-slate-900">
                      {src.counts.total}
                    </span>
                    <span className="text-sm text-slate-500">records</span>
                  </div>
                </div>
                <div className="text-sm text-slate-600 leading-relaxed">
                  {[
                    src.counts.medications > 0 &&
                      `${src.counts.medications} meds`,
                    src.counts.labResults > 0 &&
                      `${src.counts.labResults} labs`,
                    src.counts.conditions > 0 &&
                      `${src.counts.conditions} conditions`,
                    src.counts.encounters > 0 &&
                      `${src.counts.encounters} visits`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Go To */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Go To</h2>
          </div>
          <div className="flex flex-col gap-2">
            {QUICK_NAV.map(({ to, label, desc, icon: NavIcon, bg, color }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all group"
              >
                <div
                  className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}
                >
                  <NavIcon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-slate-900">
                    {label}
                  </div>
                  <div className="text-sm text-slate-500">{desc}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 5: Disclaimer ── */}
      <div className="shrink-0 text-center">
        <p className="text-xs text-slate-400">
          {ai.disclaimer ||
            "SmartHealth AI aggregates data for informational purposes only · Not medical advice · Always consult your healthcare provider"}
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
