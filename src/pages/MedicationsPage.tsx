// -----------------------------------------------------------
// MedicationsPage — AI-Powered Medication Intelligence (Phase 6)
// -----------------------------------------------------------
// Single-column layout following Phase 4 design philosophy:
//   - Breathing room, generous spacing
//   - Interaction alerts → AI summary → medication list → doctor Qs
// All Phase 5/6 features preserved: drug interactions, AI summary,
// "Ask AI" per med, doctor questions, source badges.
// -----------------------------------------------------------

import { useUnifiedData } from "../hooks/useUnifiedData";
import { usePatient } from "../hooks/usePatient";
import { useAIAnalysis } from "../hooks/useAIAnalysis";
import MedicationCard from "../components/data/MedicationCard";
import AlertBanner from "../components/data/AlertBanner";
import { SkeletonCardList, EmptyState } from "../components/ui/Skeleton";
import {
  Pill,
  Search,
  Filter,
  BrainCircuit,
  Loader2,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import { useState, useMemo } from "react";

type StatusFilter = "all" | "active" | "stopped" | "unknown";

const MedicationsPage = () => {
  const unified = useUnifiedData();
  const { patient } = usePatient();
  const ai = useAIAnalysis(patient, unified);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showMedSummary, setShowMedSummary] = useState(false);
  const [showDoctorQuestions, setShowDoctorQuestions] = useState(false);

  const filtered = useMemo(() => {
    let meds = unified.medications;
    if (statusFilter !== "all") {
      meds = meds.filter((m) => {
        if (statusFilter === "active") return m.status === "active";
        if (statusFilter === "stopped")
          return m.status === "stopped" || m.status === "completed";
        return (
          m.status !== "active" &&
          m.status !== "stopped" &&
          m.status !== "completed"
        );
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      meds = meds.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.dosageInstruction?.toLowerCase().includes(q) ?? false)
      );
    }
    return meds;
  }, [unified.medications, search, statusFilter]);

  const activeCount = unified.medications.filter(
    (m) => m.status === "active"
  ).length;

  const getInteractionsForMed = (medName: string) => {
    if (!ai.tier1) return [];
    return ai.tier1.drugInteractions.filter(
      (d) =>
        d.drugA.toLowerCase() === medName.toLowerCase() ||
        d.drugB.toLowerCase() === medName.toLowerCase()
    );
  };

  if (unified.isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <SkeletonCardList count={5} />
      </div>
    );
  }

  if (unified.medications.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={Pill}
          title="No medications found"
          description="No medication records were found across connected health systems."
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0">
        <div className="flex items-center gap-2.5 mb-1">
          <Pill className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">Medications</h1>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
            {unified.medications.length} total · {activeCount} active
          </span>
        </div>
        <p className="text-[15px] text-slate-500">
          All medications from all connected health systems
        </p>
      </div>

      {/* ── Search + Filter ── */}
      <div className="shrink-0 flex gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search medications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-slate-400" />
          {(["all", "active", "stopped", "unknown"] as StatusFilter[]).map(
            (f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                  statusFilter === f
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Scrollable content area ── */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
      <div className="space-y-3">
      {/* ── Interaction Alerts ── */}
      {ai.tier1 && ai.tier1.drugInteractions.length > 0 && (
        <AlertBanner drugInteractions={ai.tier1.drugInteractions} />
      )}

      {/* ── AI Medication Summary (collapsible) ── */}
      {ai.tier2.medicationSummary && (
        <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200 overflow-hidden">
          <button
            onClick={() => setShowMedSummary(!showMedSummary)}
            className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-emerald-50 transition-colors"
          >
            <BrainCircuit className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-[15px] font-bold text-emerald-900 flex-1">
              AI Medication Summary
            </span>
            {showMedSummary ? (
              <ChevronUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-emerald-600" />
            )}
          </button>
          {showMedSummary && (
            <div className="px-5 pb-4">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {ai.tier2.medicationSummary.text}
              </p>
              <p className="text-xs text-slate-400 mt-3">
                {ai.disclaimer}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tier 2 loading */}
      {ai.tier2.isLoading && !ai.tier2.medicationSummary && (
        <div className="flex items-center gap-3 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-200/50">
          <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
          <span className="text-[15px] text-slate-600">
            Analyzing your medications...
          </span>
        </div>
      )}

      {/* ── Medication Cards ── */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[15px] text-slate-400 bg-white rounded-2xl border border-slate-200">
            No medications match your criteria
          </div>
        ) : (
          filtered.map((med) => (
            <MedicationCard
              key={med.id}
              medication={med}
              interactions={getInteractionsForMed(med.name)}
              explanation={ai.explanations.get(med.id)}
              isExplaining={ai.explainLoading === med.id}
              onAskAI={ai.askAI}
              aiAvailable={ai.aiAvailable}
            />
          ))
        )}
      </div>

      {/* ── "Ask My Doctor" Button ── */}
      <div className="space-y-3">
        <button
          onClick={() => {
            if (!ai.doctorQuestions) ai.askDoctorAboutMeds();
            setShowDoctorQuestions(!showDoctorQuestions);
          }}
          disabled={ai.doctorQuestionsLoading}
          className={`w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl font-semibold text-[15px] transition-all ${
            ai.doctorQuestionsLoading
              ? "bg-slate-100 text-slate-400 cursor-wait"
              : ai.doctorQuestions
                ? "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100"
                : "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg"
          }`}
        >
          {ai.doctorQuestionsLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating questions...
            </>
          ) : (
            <>
              <Stethoscope className="w-5 h-5" />
              {ai.doctorQuestions
                ? showDoctorQuestions
                  ? "Hide doctor questions"
                  : "Show doctor questions"
                : "What should I ask my doctor about my medications?"}
            </>
          )}
        </button>

        {showDoctorQuestions && ai.doctorQuestions && (
          <div className="bg-violet-50 rounded-2xl border border-violet-200 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-violet-600" />
              <h3 className="text-[15px] font-bold text-violet-900">
                Questions for Your Doctor
              </h3>
            </div>
            <div className="space-y-2.5">
              {ai.doctorQuestions.questions.map((q, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-violet-100"
                >
                  <div className="w-7 h-7 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 text-sm font-bold shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-[15px] text-slate-700 leading-relaxed">
                    {q}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400">{ai.disclaimer}</p>
          </div>
        )}
      </div>

      {/* ── Disclaimer ── */}
      <p className="text-xs text-slate-400 leading-relaxed text-center pt-2">
        {ai.disclaimer}
      </p>
      </div>
      </div>
    </div>
  );
};

export default MedicationsPage;
