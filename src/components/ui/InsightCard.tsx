// -----------------------------------------------------------
// InsightCard — Patient-friendly health insight component
// -----------------------------------------------------------
// Plain English by default. Never scary, always actionable.
// "View clinical details" toggle for health-literate patients.
//
// Two layers:
//   1. Patient summary: simple words, what to do about it
//   2. Clinical details: original technical description (hidden)
// -----------------------------------------------------------

import { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  FileText,
} from "lucide-react";
import { SEVERITY, TRANSITIONS } from "../../config/designSystem";
import type { SeverityLevel } from "../../config/designSystem";
import SourceBadge from "./SourceBadge";
import type { SourceTag } from "../../types/source";

interface InsightCardProps {
  severity: SeverityLevel;
  /** Plain-English title (e.g., "Your allergy lists don't match") */
  title: string;
  /** Plain-English explanation for patients */
  summary: string;
  /** Technical/clinical details (shown on toggle) */
  clinicalDetails?: string;
  /** What the patient should do about this */
  actionItem?: string;
  sourceA?: SourceTag;
  sourceB?: SourceTag;
  /** Patient-friendly category label */
  category?: string;
}

const SEVERITY_ICONS = {
  critical: ShieldAlert,
  high: AlertTriangle,
  medium: TrendingUp,
  info: Info,
  normal: CheckCircle2,
};

/** Patient-friendly severity labels */
const SEVERITY_LABELS = {
  critical: "Needs attention",
  high: "Important",
  medium: "Good to know",
  info: "For your information",
  normal: "All clear",
};

const InsightCard = ({
  severity,
  title,
  summary,
  clinicalDetails,
  actionItem,
  sourceA,
  sourceB,
  category,
}: InsightCardProps) => {
  const [showClinical, setShowClinical] = useState(false);
  const style = SEVERITY[severity];
  const Icon = SEVERITY_ICONS[severity];

  return (
    <div
      className={`rounded-2xl border-2 ${style.border} ${style.bg} overflow-hidden ${TRANSITIONS.normal} hover:shadow-lg`}
    >
      {/* Main content */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Severity icon — larger, friendlier */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              severity === "critical" ? "bg-red-100" :
              severity === "high" ? "bg-amber-100" :
              severity === "medium" ? "bg-yellow-100" :
              severity === "normal" ? "bg-emerald-100" : "bg-blue-100"
            }`}
          >
            <Icon className={`w-6 h-6 ${style.icon}`} strokeWidth={2} />
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            {/* Category + severity label */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.badge}`}>
                {SEVERITY_LABELS[severity]}
              </span>
              {category && (
                <span className="text-sm font-medium text-slate-500">
                  {category}
                </span>
              )}
            </div>

            {/* Title — large, clear */}
            <h3 className={`text-lg font-bold ${style.text} leading-snug mb-1`}>
              {title}
            </h3>

            {/* Patient-friendly summary */}
            <p className="text-[15px] text-slate-700 leading-relaxed">
              {summary}
            </p>

            {/* Action item */}
            {actionItem && (
              <div className="flex items-start gap-2 mt-3 p-3 bg-white/60 rounded-xl border border-slate-200/60">
                <Stethoscope className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-[15px] font-medium text-slate-700">{actionItem}</p>
              </div>
            )}

            {/* Clinical details (toggle) */}
            {showClinical && clinicalDetails && (
              <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 mb-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Clinical Details
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-[1.75] whitespace-pre-line">
                  {clinicalDetails}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar — sources, toggle, action */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/40">
          {/* Sources */}
          <div className="flex items-center gap-2">
            {sourceA && <SourceBadge source={sourceA} />}
            {sourceB && sourceB.systemId !== sourceA?.systemId && (
              <>
                <span className="text-slate-300 text-xs">↔</span>
                <SourceBadge source={sourceB} />
              </>
            )}
          </div>

          {/* Clinical details toggle */}
          {clinicalDetails && (
            <button
              onClick={() => setShowClinical(!showClinical)}
              className={`flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 ${TRANSITIONS.fast}`}
            >
              {showClinical ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide clinical details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  View clinical details
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightCard;
