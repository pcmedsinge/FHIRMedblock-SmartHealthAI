// -----------------------------------------------------------
// AlertBanner — Critical alerts bar at top of views
// -----------------------------------------------------------
// Red/amber gradient bar for safety-critical items:
//   - Drug interactions
//   - Allergy-prescription conflicts
//   - Cross-system gaps
//
// Compact, non-dismissible, always visible when active.
// -----------------------------------------------------------

import { ShieldAlert, AlertTriangle, ChevronRight } from "lucide-react";
import { TRANSITIONS } from "../../config/designSystem";
import type { DrugInteraction, SourceConflictAlert } from "../../ai/types";

interface AlertItem {
  id: string;
  severity: "critical" | "high" | "medium";
  message: string;
}

interface AlertBannerProps {
  /** Drug interactions to show */
  drugInteractions?: DrugInteraction[];
  /** Source conflict alerts to show */
  conflictAlerts?: SourceConflictAlert[];
  /** Custom items */
  items?: AlertItem[];
  /** Click handler for "View details" */
  onViewDetails?: () => void;
}

const AlertBanner = ({
  drugInteractions = [],
  conflictAlerts = [],
  items = [],
  onViewDetails,
}: AlertBannerProps) => {
  // Build alert items from all sources
  const alerts: AlertItem[] = [
    ...drugInteractions
      .filter((d) => d.severity === "critical" || d.severity === "high")
      .map((d) => ({
        id: d.id,
        severity: d.severity as "critical" | "high",
        message: `${d.drugA} + ${d.drugB}: ${d.effect}`,
      })),
    ...conflictAlerts
      .filter((c) => c.severity === "critical" || c.severity === "high")
      .map((c) => ({
        id: c.conflictId,
        severity: c.severity,
        message: c.title,
      })),
    ...items,
  ];

  if (alerts.length === 0) return null;

  const hasCritical = alerts.some((a) => a.severity === "critical");

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden ${TRANSITIONS.normal} ${
        hasCritical
          ? "bg-gradient-to-r from-red-50 to-red-100 border-red-300"
          : "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300"
      }`}
    >
      <div className="px-5 py-3.5 flex items-start gap-3">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            hasCritical ? "bg-red-100" : "bg-amber-100"
          }`}
        >
          {hasCritical ? (
            <ShieldAlert className="w-5 h-5 text-red-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div
            className={`text-[15px] font-bold mb-1 ${
              hasCritical ? "text-red-900" : "text-amber-900"
            }`}
          >
            {alerts.length} safety alert{alerts.length !== 1 ? "s" : ""} need
            your attention
          </div>

          {/* Show up to 3 items inline */}
          <div className="space-y-1">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-center gap-2 text-sm">
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    alert.severity === "critical" ? "bg-red-500" : "bg-amber-500"
                  }`}
                />
                <span
                  className={
                    alert.severity === "critical"
                      ? "text-red-800"
                      : "text-amber-800"
                  }
                >
                  {alert.message}
                </span>
              </div>
            ))}
            {alerts.length > 3 && (
              <span className="text-sm text-slate-600 ml-4">
                +{alerts.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* View details button */}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm font-bold rounded-lg shrink-0 ${TRANSITIONS.fast} ${
              hasCritical
                ? "text-red-700 hover:bg-red-100"
                : "text-amber-700 hover:bg-amber-100"
            }`}
          >
            Details
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertBanner;
