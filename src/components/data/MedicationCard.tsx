// -----------------------------------------------------------
// MedicationCard — Single medication with AI features
// -----------------------------------------------------------
// Shows medication name, dosage, status, source badges, and
// provides "Ask AI" button for Tier 3 on-demand explanations.
// Drug interaction warnings appear inline.
// -----------------------------------------------------------

import { useState } from "react";
import {
  Pill,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BrainCircuit,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from "lucide-react";
import SourceBadge from "../ui/SourceBadge";
import MergeBadge from "../ui/MergeBadge";
import { TRANSITIONS } from "../../config/designSystem";
import type { MergedMedication } from "../../types/merged";
import type { DrugInteraction, HealthExplanation } from "../../ai/types";

interface MedicationCardProps {
  medication: MergedMedication;
  /** Any drug interactions involving this medication */
  interactions?: DrugInteraction[];
  /** AI explanation (if already fetched) */
  explanation?: HealthExplanation;
  /** Whether AI explanation is currently loading */
  isExplaining?: boolean;
  /** Callback to request AI explanation */
  onAskAI?: (med: MergedMedication) => void;
  /** Whether AI is available */
  aiAvailable?: boolean;
}

const MedicationCard = ({
  medication,
  interactions = [],
  explanation,
  isExplaining = false,
  onAskAI,
  aiAvailable = false,
}: MedicationCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const isActive = medication.status === "active";
  const isStopped =
    medication.status === "stopped" || medication.status === "completed";

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden ${TRANSITIONS.normal} hover:shadow-md ${
        interactions.length > 0
          ? "border-amber-300 shadow-sm"
          : "border-slate-200"
      }`}
    >
      {/* Main row */}
      <div className="px-4 py-3.5 flex items-center gap-3">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            interactions.length > 0
              ? "bg-amber-100"
              : isActive
                ? "bg-blue-50"
                : "bg-slate-100"
          }`}
        >
          {interactions.length > 0 ? (
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          ) : (
            <Pill
              className={`w-5 h-5 ${isActive ? "text-blue-500" : "text-slate-400"}`}
            />
          )}
        </div>

        {/* Name + dosage */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-slate-900 truncate">
              {medication.name}
            </span>
          </div>
          <div className="text-sm text-slate-600 truncate">
            {medication.dosageInstruction ?? "No dosage information"}
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
            isActive
              ? "bg-emerald-100 text-emerald-700"
              : isStopped
                ? "bg-slate-100 text-slate-500"
                : "bg-amber-100 text-amber-700"
          }`}
        >
          {isActive && <CheckCircle2 className="w-3 h-3" />}
          {isStopped && <Clock className="w-3 h-3" />}
          {medication.status}
        </span>

        {/* Merge status */}
        <MergeBadge status={medication.mergeStatus} />

        {/* Source badges */}
        <div className="flex items-center gap-1 shrink-0">
          {medication.allSources.map((s) => (
            <SourceBadge key={s.systemId} source={s} compact />
          ))}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 ${TRANSITIONS.fast}`}
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Interaction warnings (always visible) */}
      {interactions.length > 0 && (
        <div className="px-4 pb-3">
          {interactions.map((int) => (
            <div
              key={int.id}
              className={`flex items-start gap-2 p-2.5 rounded-xl text-sm ${
                int.severity === "critical"
                  ? "bg-red-50 border border-red-200"
                  : "bg-amber-50 border border-amber-200"
              }`}
            >
              <AlertTriangle
                className={`w-4 h-4 mt-0.5 shrink-0 ${
                  int.severity === "critical" ? "text-red-500" : "text-amber-500"
                }`}
              />
              <div>
                <span
                  className={`font-semibold ${
                    int.severity === "critical"
                      ? "text-red-800"
                      : "text-amber-800"
                  }`}
                >
                  Interaction with {int.drugA === medication.name ? int.drugB : int.drugA}
                </span>
                <span className="text-slate-700 ml-1">{int.effect}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded section — AI explanation + details */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3.5 space-y-3 bg-slate-50/50">
          {/* Prescriber & date */}
          <div className="text-sm text-slate-600 flex items-center gap-4 flex-wrap">
            {medication.prescriber && (
              <span>
                <span className="font-medium text-slate-700">Prescriber:</span>{" "}
                {medication.prescriber}
              </span>
            )}
            {medication.dateWritten && (
              <span>
                <span className="font-medium text-slate-700">Prescribed:</span>{" "}
                {medication.dateWritten}
              </span>
            )}
            <span>
              <span className="font-medium text-slate-700">Sources:</span>{" "}
              {medication.allSources.map((s) => s.systemName).join(", ")}
            </span>
          </div>

          {/* AI Explanation */}
          {explanation && (
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
          )}

          {/* Ask AI button */}
          {!explanation && aiAvailable && onAskAI && (
            <button
              onClick={() => onAskAI(medication)}
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
                  Ask AI: "What does this medication do?"
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicationCard;
