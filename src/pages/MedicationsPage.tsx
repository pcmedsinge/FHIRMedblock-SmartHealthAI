// -----------------------------------------------------------
// MedicationsPage — AI-Powered Medication Intelligence (Phase 6)
// -----------------------------------------------------------
// Viewport-fit two-column layout. NO scrolling on the outer shell.
// Left: compact med list + AI tools. Right: detail panel.
// All AI features preserved: interactions, summary, Ask AI, Qs.
// -----------------------------------------------------------

import { useUnifiedData } from "../hooks/useUnifiedData";
import { usePatient } from "../hooks/usePatient";
import { useAIAnalysis } from "../hooks/useAIAnalysis";
import SourceBadge from "../components/ui/SourceBadge";
import MergeBadge from "../components/ui/MergeBadge";
import CapsuleIcon from "../components/ui/CapsuleIcon";
import NarrativeText from "../components/ui/NarrativeText";
import { SkeletonCardList, EmptyState } from "../components/ui/Skeleton";
import {
  Pill,
  Search,
  Filter,
  BrainCircuit,
  Loader2,
  Stethoscope,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState, useMemo } from "react";
import type { MergedMedication } from "../types/merged";

type StatusFilter = "all" | "active" | "stopped" | "unknown";

const MedicationsPage = () => {
  const unified = useUnifiedData();
  const { patient } = usePatient();
  const ai = useAIAnalysis(patient, unified);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedMed, setSelectedMed] = useState<MergedMedication | null>(null);
  const [showMedSummary, setShowMedSummary] = useState(false);
  const [showDoctorQuestions, setShowDoctorQuestions] = useState(false);

  const filtered = useMemo(() => {
    let meds = unified.medications;
    if (statusFilter !== "all") {
      meds = meds.filter((m) => {
        if (statusFilter === "active") return m.status === "active";
        if (statusFilter === "stopped")
          return m.status === "stopped" || m.status === "completed";
        return m.status !== "active" && m.status !== "stopped" && m.status !== "completed";
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      meds = meds.filter(
        (m) => m.name.toLowerCase().includes(q) || (m.dosageInstruction?.toLowerCase().includes(q) ?? false)
      );
    }
    return meds;
  }, [unified.medications, search, statusFilter]);

  const activeCount = unified.medications.filter((m) => m.status === "active").length;
  const interactionCount = ai.tier1?.drugInteractions.length ?? 0;

  const getInteractionsForMed = (medName: string) => {
    if (!ai.tier1) return [];
    return ai.tier1.drugInteractions.filter(
      (d) => d.drugA.toLowerCase() === medName.toLowerCase() || d.drugB.toLowerCase() === medName.toLowerCase()
    );
  };

  if (unified.isLoading) {
    return (<div className="h-full flex flex-col items-center justify-center"><SkeletonCardList count={5} /></div>);
  }
  if (unified.medications.length === 0) {
    return (<div className="h-full flex items-center justify-center"><EmptyState icon={Pill} title="No medications found" description="No medication records were found across connected health systems." /></div>);
  }

  const selInteractions = selectedMed ? getInteractionsForMed(selectedMed.name) : [];
  const selExplanation = selectedMed ? ai.explanations.get(selectedMed.id) : undefined;
  const selIsExplaining = selectedMed ? ai.explainLoading === selectedMed.id : false;

  return (
    <div className="h-full flex flex-col overflow-hidden animate-content-reveal">
      {/* ===== HEADER ROW ===== */}
      <div className="flex items-center justify-between shrink-0 pb-2">
        <div className="flex items-center gap-2.5">
          <CapsuleIcon size={32} variant="default" />
          <h1 className="text-2xl font-bold text-slate-900">Medications</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
            {unified.medications.length} total · {activeCount} active
          </span>
          {interactionCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
              {interactionCount} interaction{interactionCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ===== SEARCH + FILTER ===== */}
      <div className="shrink-0 flex gap-2 pb-2">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all" />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          {(["all", "active", "stopped", "unknown"] as StatusFilter[]).map((f) => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === f ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ===== MAIN TWO-COLUMN ===== */}
      <div className="flex-1 min-h-0 grid grid-cols-[1fr_1fr] gap-3">

        {/* LEFT — Compact med list */}
        <div className="flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Interaction alert strip — shows actual drug pairs */}
          {interactionCount > 0 && ai.tier1 && (
            <div className="px-3 py-2 bg-gradient-to-r from-red-50 to-amber-50 border-b border-red-200 shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="text-xs font-bold text-red-800">
                  {interactionCount} Drug Interaction{interactionCount !== 1 ? "s" : ""} Detected
                </span>
              </div>
              {ai.tier1.drugInteractions.map((di) => (
                <div key={di.id} className="flex items-start gap-2 ml-6 mb-0.5 last:mb-0">
                  <span className="text-xs text-red-700">
                    <span className="font-bold">{di.drugA}</span> + <span className="font-bold">{di.drugB}</span>:
                    <span className="text-red-600 ml-1">{di.effect}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Med list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">No medications match</div>
            ) : filtered.map((med) => {
              const isActive = med.status === "active";
              const isStopped = med.status === "stopped" || med.status === "completed";
              const hasInteraction = getInteractionsForMed(med.name).length > 0;
              const isSelected = selectedMed?.id === med.id;

              return (
                <button key={med.id} onClick={() => setSelectedMed(isSelected ? null : med)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left border-b border-slate-100 last:border-0 transition-all ${
                    isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-slate-50 border-l-2 border-l-transparent"
                  }`}>
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    <CapsuleIcon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-slate-900 truncate">{med.name}</div>
                    <div className="text-sm text-slate-500 truncate">{med.dosageInstruction ?? "No dosage info"}</div>
                  </div>
                  {/* Source badges */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {[...new Map(med.allSources.map((s) => [s.systemId, s])).values()].map((s) => (
                      <SourceBadge key={s.systemId} source={s} compact />
                    ))}
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
                    isActive ? "bg-emerald-100 text-emerald-700" : isStopped ? "bg-slate-100 text-slate-500" : "bg-amber-100 text-amber-700"
                  }`}>
                    {med.status}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom bar — AI tools */}
          <div className="shrink-0 border-t border-slate-200 bg-slate-50 p-2 flex gap-1.5">
            {/* AI Summary toggle */}
            {ai.tier2.medicationSummary && (
              <button onClick={() => { setShowMedSummary(!showMedSummary); setSelectedMed(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  showMedSummary ? "bg-emerald-600 text-white shadow-sm" : "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200 hover:from-emerald-100 hover:to-teal-100"
                }`}>
                <BrainCircuit className="w-3.5 h-3.5" /> AI Summary
              </button>
            )}
            {ai.tier2.isLoading && !ai.tier2.medicationSummary && (
              <div className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing…
              </div>
            )}
            {/* Doctor Qs toggle */}
            <button
              onClick={() => { if (!ai.doctorQuestions) ai.askDoctorAboutMeds(); setShowDoctorQuestions(!showDoctorQuestions); setSelectedMed(null); }}
              disabled={ai.doctorQuestionsLoading}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${
                ai.doctorQuestionsLoading ? "bg-slate-100 text-slate-400 cursor-wait"
                  : showDoctorQuestions && ai.doctorQuestions ? "bg-violet-100 text-violet-700"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-violet-50"
              }`}>
              {ai.doctorQuestionsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Stethoscope className="w-3.5 h-3.5" />}
              Visit Topics
            </button>
          </div>
        </div>

        {/* RIGHT — Detail panel */}
        <div className="flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* --- AI Summary overlay --- */}
          {showMedSummary && ai.tier2.medicationSummary ? (
            <>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 shrink-0 bg-emerald-50">
                <BrainCircuit className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-bold text-emerald-900">AI Medication Summary</h2>
                <button onClick={() => setShowMedSummary(false)} className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-emerald-100 transition-colors">
                  <X className="w-4 h-4 text-emerald-600" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <NarrativeText text={ai.tier2.medicationSummary.text} />
                <p className="text-xs text-slate-400 mt-4">{ai.disclaimer}</p>
              </div>
            </>
          ) : showDoctorQuestions && ai.doctorQuestions ? (
            /* --- Doctor Questions overlay --- */
            <>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 shrink-0 bg-violet-50">
                <MessageSquare className="w-5 h-5 text-violet-600" />
                <h2 className="text-sm font-bold text-violet-900">Topics to Discuss at Your Visit</h2>
                <button onClick={() => setShowDoctorQuestions(false)} className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-violet-100 transition-colors">
                  <X className="w-4 h-4 text-violet-600" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {ai.doctorQuestions.questions.map((q, i) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="w-6 h-6 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                    <p className="text-sm text-slate-700 leading-relaxed">{q}</p>
                  </div>
                ))}
                <p className="text-xs text-slate-400 mt-3">{ai.disclaimer}</p>
              </div>
            </>
          ) : selectedMed ? (
            /* --- Med detail --- */
            <>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 shrink-0 bg-slate-50">
                <Pill className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 truncate">{selectedMed.name}</h2>
                <button onClick={() => setSelectedMed(null)} className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Status + merge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                    selectedMed.status === "active" ? "bg-emerald-100 text-emerald-700"
                      : selectedMed.status === "stopped" || selectedMed.status === "completed" ? "bg-slate-100 text-slate-500"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {selectedMed.status === "active" && <CheckCircle2 className="w-3 h-3" />}
                    {(selectedMed.status === "stopped" || selectedMed.status === "completed") && <Clock className="w-3 h-3" />}
                    {selectedMed.status}
                  </span>
                  <MergeBadge status={selectedMed.mergeStatus} />
                  {selectedMed.allSources.map((s) => <SourceBadge key={s.systemId} source={s} compact />)}
                </div>

                {/* Dosage */}
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">Dosage</div>
                  <p className="text-sm text-slate-700">{selectedMed.dosageInstruction ?? "No dosage information"}</p>
                </div>

                {/* Prescriber / date */}
                <div className="flex gap-4 flex-wrap text-sm text-slate-600">
                  {selectedMed.prescriber && <div><span className="font-medium text-slate-700">Prescriber:</span> {selectedMed.prescriber}</div>}
                  {selectedMed.dateWritten && <div><span className="font-medium text-slate-700">Prescribed:</span> {selectedMed.dateWritten}</div>}
                </div>

                {/* Sources detail */}
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">Sources</div>
                  <p className="text-sm text-slate-600">{selectedMed.allSources.map((s) => s.systemName).join(", ")}</p>
                </div>

                {/* Drug interactions */}
                {selInteractions.length > 0 && (
                  <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                    <div className="text-xs font-bold text-red-700 uppercase mb-2">Drug Interactions</div>
                    {selInteractions.map((int) => (
                      <div key={int.id} className="flex items-start gap-2 mb-1.5 last:mb-0">
                        <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${int.severity === "critical" ? "text-red-500" : "text-amber-500"}`} />
                        <div className="text-sm">
                          <span className={`font-semibold ${int.severity === "critical" ? "text-red-800" : "text-amber-800"}`}>
                            {int.drugA === selectedMed.name ? int.drugB : int.drugA}
                          </span>
                          <span className="text-slate-700 ml-1">{int.effect}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI explanation */}
                {selExplanation && (
                  <div className="rounded-xl border-2 border-emerald-300 bg-white overflow-hidden shadow-sm">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500">
                      <BrainCircuit className="w-4 h-4 text-white" />
                      <span className="text-xs font-bold uppercase tracking-wider text-white">AI Insight</span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-[15px] text-slate-900 leading-[1.7] font-medium">{selExplanation.explanation}</p>
                      <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100">Not medical advice — discuss with your provider</p>
                    </div>
                  </div>
                )}

                {/* Ask AI button */}
                {!selExplanation && ai.aiAvailable && (
                  <button onClick={() => ai.askAI(selectedMed)} disabled={selIsExplaining}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                      selIsExplaining ? "bg-slate-100 text-slate-400 cursor-wait" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    }`}>
                    {selIsExplaining ? <><Loader2 className="w-4 h-4 animate-spin" /> Asking AI…</> : <><MessageCircle className="w-4 h-4" /> Ask AI: "What does this do?"</>}
                  </button>
                )}
              </div>
            </>
          ) : (
            /* --- Empty state --- */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-3">
                <Pill className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Medication Details</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[220px] mb-4">
                Select a medication to see dosage, sources, interactions, and AI insights.
              </p>
              <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-lg font-extrabold text-blue-700">{activeCount}</div>
                  <div className="text-xs text-blue-600 font-medium">Active</div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded-lg">
                  <div className="text-lg font-extrabold text-red-700">{interactionCount}</div>
                  <div className="text-xs text-red-600 font-medium">Interactions</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <div className="text-lg font-extrabold text-slate-700">{unified.medications.length}</div>
                  <div className="text-xs text-slate-500 font-medium">Total</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicationsPage;
