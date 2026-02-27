// -----------------------------------------------------------
// SourceOverview — Per-source record counts summary
// -----------------------------------------------------------
// Clean, compact summary of what data came from each provider.
// Shows record counts by domain + conflict count.
// -----------------------------------------------------------

import SourceBadge from "../ui/SourceBadge";
import { AlertTriangle, Database, Shield } from "lucide-react";
import { TRANSITIONS } from "../../config/designSystem";
import type { SourceSummary, Conflict } from "../../types/merged";

interface SourceOverviewProps {
  /** Per-source record summaries */
  sources: SourceSummary[];
  /** Detected conflicts */
  conflicts: Conflict[];
}

const SourceOverview = ({ sources, conflicts }: SourceOverviewProps) => {
  if (sources.length === 0) return null;

  const criticalConflicts = conflicts.filter((c) => c.severity === "critical").length;
  const totalConflicts = conflicts.length;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <Database className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-bold text-slate-900">Connected Providers</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
          {sources.length} source{sources.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Source cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sources.map((src) => (
          <div
            key={src.source.systemId}
            className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-sm ${TRANSITIONS.fast} hover:shadow-md`}
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <SourceBadge source={src.source} />
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900">
                  {src.counts.total}
                </span>
                <span className="text-sm text-slate-600">records</span>
              </div>
            </div>
            <div className="text-sm text-slate-700 leading-relaxed">
              {src.counts.medications > 0 && (
                <span>{src.counts.medications} meds · </span>
              )}
              {src.counts.labResults > 0 && (
                <span>{src.counts.labResults} labs · </span>
              )}
              {src.counts.conditions > 0 && (
                <span>{src.counts.conditions} conditions · </span>
              )}
              {src.counts.vitals > 0 && (
                <span>{src.counts.vitals} vitals · </span>
              )}
              {src.counts.encounters > 0 && (
                <span>{src.counts.encounters} visits</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Conflict summary */}
      {totalConflicts > 0 && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
            criticalConflicts > 0
              ? "bg-red-50 border border-red-200"
              : "bg-amber-50 border border-amber-200"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              criticalConflicts > 0 ? "bg-red-100" : "bg-amber-100"
            }`}
          >
            {criticalConflicts > 0 ? (
              <Shield className="w-4 h-4 text-red-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
          </div>
          <div className="text-sm">
            <span className="font-bold text-slate-900">
              {totalConflicts} difference{totalConflicts !== 1 ? "s" : ""}
            </span>
            <span className="text-slate-600">
              {" "}found between providers
              {criticalConflicts > 0 &&
                ` (${criticalConflicts} need attention)`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceOverview;
