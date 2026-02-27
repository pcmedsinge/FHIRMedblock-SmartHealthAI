// -----------------------------------------------------------
// PreVisitPage — AI-Generated Pre-Visit Report
// -----------------------------------------------------------
// The "wow" feature. Generates a comprehensive report patients
// can bring to their next doctor appointment, including:
//   - Cross-system medication reconciliation
//   - Allergy safety alerts
//   - Lab trend highlights
//   - Suggested questions for the provider
//   - Immunization gaps
//
// Phase 4 scaffold — shows the structure with real data.
// Phase 7 will add the actual AI generation (gpt-4o).
// -----------------------------------------------------------

import { useUnifiedData } from "../hooks/useUnifiedData";
import SourceBadge from "../components/ui/SourceBadge";
import { SkeletonCardList, EmptyState } from "../components/ui/Skeleton";
import {
  FileText,
  Printer,
  Download,
  Sparkles,
  ShieldAlert,
  Pill,
  TestTube,
  Syringe,
  MessageCircleQuestion,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
} from "lucide-react";
import { useMemo } from "react";

const PreVisitPage = () => {
  const unified = useUnifiedData();

  // Derive report data from unified state
  const reportData = useMemo(() => {
    if (unified.isLoading) return null;

    const activeMeds = unified.medications.filter((m) => m.status === "active");
    const criticalConflicts = unified.conflicts.filter((c) => c.severity === "critical");
    const highConflicts = unified.conflicts.filter((c) => c.severity === "high");
    const abnormalLabs = unified.labResults.filter(
      (l) =>
        l.interpretation === "abnormal" || l.interpretation === "high" || l.interpretation === "low"
    );

    // Generate suggested questions based on data
    const questions: string[] = [];
    if (criticalConflicts.length > 0) {
      questions.push(
        "I noticed my allergy records differ between my healthcare providers. Can we reconcile my allergy list?"
      );
    }
    if (highConflicts.length > 0) {
      questions.push(
        `I have ${highConflicts.length} medication(s) only recorded at one provider. Are all my doctors aware of all my medications?`
      );
    }
    if (abnormalLabs.length > 0) {
      questions.push(
        `I have ${abnormalLabs.length} lab result(s) flagged as abnormal. What do these mean for my treatment plan?`
      );
    }
    if (activeMeds.length > 3) {
      questions.push(
        "I'm taking multiple medications. Are there any interactions I should be aware of?"
      );
    }
    if (questions.length === 0) {
      questions.push("Are there any preventive screenings I should schedule?");
      questions.push("Is my current medication regimen still the best approach?");
    }

    return {
      activeMeds,
      criticalConflicts,
      highConflicts,
      abnormalLabs,
      questions,
      allConflicts: unified.conflicts,
      immunizations: unified.immunizations,
      conditions: unified.conditions.filter((c) => c.clinicalStatus === "active"),
    };
  }, [unified]);

  if (unified.isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <SkeletonCardList count={4} />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={FileText}
          title="Unable to generate report"
          description="Health data is required to generate your pre-visit report."
        />
      </div>
    );
  }

  const totalAlerts = reportData.criticalConflicts.length + reportData.highConflicts.length;

  return (
    <div className="h-full overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <FileText className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Your Visit Preparation Report</h1>
          </div>
          <p className="text-[15px] text-slate-600">
            Show this to your doctor at your next appointment · Built from{" "}
            {unified.sourceSummary.length} connected provider{unified.sourceSummary.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all shadow-sm cursor-not-allowed opacity-60"
            title="Coming soon"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* AI Generation banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 text-white">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold mb-0.5">Smart Report — Coming Soon</div>
            <div className="text-sm text-emerald-100">
              SmartHealth AI will soon generate a personalized summary of your health,
              explain what each finding means in plain language, and suggest specific topics
              to discuss with your doctor. Below is your current data.
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-yellow-300 shrink-0 animate-pulse" />
        </div>
      </div>

      {/* Alert summary stripe */}
      {totalAlerts > 0 && (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 rounded-2xl">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="text-[15px] font-bold text-red-800">
              {totalAlerts} item{totalAlerts !== 1 ? "s" : ""} to discuss with your doctor
            </div>
            <div className="text-sm text-red-600 mt-0.5">
              {reportData.criticalConflicts.length > 0 &&
                `${reportData.criticalConflicts.length} need immediate attention · `}
              {reportData.highConflicts.length > 0 && `${reportData.highConflicts.length} important`}
            </div>
          </div>
        </div>
      )}

      {/* Report sections */}
      <div className="space-y-4 print:space-y-6">
        {/* Section 1: Active Medications */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-100">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Pill className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-[15px] font-bold text-blue-900">
              Your Medications ({reportData.activeMeds.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {reportData.activeMeds.length === 0 ? (
              <div className="p-4 text-[15px] text-slate-400 text-center">
                No active medications recorded
              </div>
            ) : (
              reportData.activeMeds.map((med) => (
                <div key={med.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium text-slate-900">{med.name}</div>
                    <div className="text-sm text-slate-600">
                      {med.dosageInstruction ?? "No dosage information"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {med.mergeStatus === "conflict" && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">
                        ⚠ CONFLICT
                      </span>
                    )}
                    {med.allSources.map((s) => (
                      <SourceBadge key={s.systemId} source={s} compact />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Section 2: Safety Conflicts */}
        {reportData.allConflicts.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-amber-50 to-amber-100/50 border-b border-amber-100">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-[15px] font-bold text-amber-900">
                Records That Don't Match ({reportData.allConflicts.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {reportData.allConflicts.map((c) => (
                <div key={c.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                        c.severity === "critical"
                          ? "bg-red-100 text-red-700"
                          : c.severity === "high"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {c.severity}
                    </span>
                    <span className="text-sm text-slate-600">
                      {c.sourceA.systemName} ↔ {c.sourceB.systemName}
                    </span>
                  </div>
                  <div className="text-[15px] text-slate-700">{c.description}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Recent Abnormal Labs */}
        {reportData.abnormalLabs.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <TestTube className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-[15px] font-bold text-emerald-900">
                Lab Results Outside Normal Range ({reportData.abnormalLabs.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {reportData.abnormalLabs.map((lab) => (
                <div key={lab.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium text-slate-900">{lab.name}</div>
                    <div className="text-sm text-slate-600">
                      {lab.value} {lab.unit ?? ""}{" "}
                      {lab.referenceRange && (
                        <span className="text-slate-500">(range: {lab.referenceRange})</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">{lab.effectiveDate ?? "N/A"}</div>
                  <SourceBadge source={lab.allSources[0]} compact />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Active Conditions */}
        {reportData.conditions.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-rose-50 to-rose-100/50 border-b border-rose-100">
              <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-[15px] font-bold text-rose-900">
                Your Health Conditions ({reportData.conditions.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {reportData.conditions.map((cond) => (
                <div key={cond.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium text-slate-900">{cond.name}</div>
                    <div className="text-sm text-slate-600">
                      Since {cond.onsetDate ?? "unknown"} · {cond.category ?? "general"}
                    </div>
                  </div>
                  {cond.allSources.map((s) => (
                    <SourceBadge key={s.systemId} source={s} compact />
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 5: Immunizations */}
        {reportData.immunizations.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-teal-50 to-teal-100/50 border-b border-teal-100">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <Syringe className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-[15px] font-bold text-teal-900">
                Your Vaccinations ({reportData.immunizations.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {reportData.immunizations.map((imm) => (
                <div key={imm.id} className="flex items-center gap-3 px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium text-slate-900">{imm.vaccineName}</div>
                    <div className="text-sm text-slate-600">
                      {imm.occurrenceDate ?? "Date unknown"}
                    </div>
                  </div>
                  {imm.allSources.map((s) => (
                    <SourceBadge key={s.systemId} source={s} compact />
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 6: Suggested Questions */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-violet-50 to-violet-100/50 border-b border-violet-100">
            <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
              <MessageCircleQuestion className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-[15px] font-bold text-violet-900">
              Questions to Ask Your Doctor
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {reportData.questions.map((q, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-[15px] text-slate-700 leading-relaxed">{q}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer disclaimer */}
      <div className="text-center pt-4 pb-2 print:pt-8">
        <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <FileText className="w-3.5 h-3.5" />
          SmartHealth AI Pre-Visit Report · Generated{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          This report is for informational purposes only and does not constitute medical advice.
          <br />
          Share this with your healthcare provider for the most complete picture of your health.
        </p>
      </div>
    </div>
  );
};

export default PreVisitPage;
