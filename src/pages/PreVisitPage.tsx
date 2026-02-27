// -----------------------------------------------------------
// PreVisitPage — AI-Generated Pre-Visit Report (Phase 7)
// -----------------------------------------------------------
// Content-dense 3-column newspaper-style layout.
// All health data visible immediately — no click-to-reveal.
//  Col 1: Medications · Interactions · Vital Correlations
//  Col 2: Safety Alerts · Abnormal Labs · Care Gaps
//  Col 3: Conditions · Allergies · Vaccinations · Questions
// PDF export via jsPDF text-based (no html2canvas/oklch issue).
// AI narrative via button click only (Tier 3, no useEffect).
// -----------------------------------------------------------

import { useUnifiedData } from "../hooks/useUnifiedData";
import { usePatient } from "../hooks/usePatient";
import { useAIAnalysis } from "../hooks/useAIAnalysis";
import { assemblePreVisitReport } from "../ai/preVisitReport";
import { generatePreVisitNarrative } from "../ai/llm/reportNarrative";
import type { PreVisitReport } from "../ai/preVisitReport";
import type { PreVisitNarrative } from "../ai/llm/reportNarrative";
import { isAIAvailable } from "../ai/aiService";
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
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Brain,
  Loader2,
  Heart,
  ClipboardList,
  Copy,
  Check,
} from "lucide-react";
import { useState, useMemo, useCallback, useRef } from "react";



// -----------------------------------------------------------
// PDF generation — text-based with jsPDF (no html2canvas)
// -----------------------------------------------------------

async function generatePDF(report: PreVisitReport, narrative: PreVisitNarrative | null, questions: string[]) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF("p", "mm", "a4");
  const W = pdf.internal.pageSize.getWidth();
  const margin = 15;
  const maxW = W - margin * 2;
  let y = 15;

  const checkPage = (needed: number) => {
    if (y + needed > pdf.internal.pageSize.getHeight() - 15) {
      pdf.addPage();
      y = 15;
    }
  };

  const heading = (text: string, size = 13) => {
    checkPage(12);
    pdf.setFontSize(size);
    pdf.setFont("helvetica", "bold");
    pdf.text(text, margin, y);
    y += size === 13 ? 7 : 6;
  };

  const body = (text: string) => {
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const lines = pdf.splitTextToSize(text, maxW);
    checkPage(lines.length * 4.5);
    pdf.text(lines, margin, y);
    y += lines.length * 4.5 + 2;
  };

  const bullet = (text: string) => {
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const lines = pdf.splitTextToSize(text, maxW - 5);
    checkPage(lines.length * 4.5);
    pdf.text("•", margin, y);
    pdf.text(lines, margin + 5, y);
    y += lines.length * 4.5 + 1;
  };

  const divider = () => { y += 3; pdf.setDrawColor(200); pdf.line(margin, y, W - margin, y); y += 5; };

  // Title
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("Pre-Visit Health Report", margin, y); y += 8;
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.text(`${report.patient.firstName} ${report.patient.lastName} · ${report.patient.age}yo ${report.patient.gender}`, margin, y); y += 5;
  pdf.setFontSize(9);
  pdf.text(`Generated: ${new Date(report.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, margin, y); y += 3;
  divider();

  // AI Narrative
  if (narrative?.narrative) {
    heading("Health Summary (AI-Generated)");
    body(narrative.narrative);
    divider();
  }

  // Safety alerts
  if (report.safety.totalAlerts > 0) {
    heading(`Safety Alerts (${report.safety.totalAlerts})`);
    [...report.safety.critical, ...report.safety.high, ...report.safety.medium].forEach((a) => {
      bullet(`[${a.severity.toUpperCase()}] ${a.title} — ${a.explanation}`);
    });
    divider();
  }

  // Medications
  heading(`Medications (${report.medications.active.length} active)`);
  if (report.medications.active.length === 0) {
    body("No active medications recorded.");
  } else {
    report.medications.active.forEach((m) => {
      const sources = m.allSources.map((s) => s.systemName).join(", ");
      bullet(`${m.name} — ${m.dosageInstruction ?? "no dosage info"} [${sources}]`);
    });
  }
  if (report.medications.interactions.length > 0) {
    checkPage(8);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(10);
    pdf.text("Drug Interactions:", margin, y); y += 5;
    report.medications.interactions.forEach((di) => {
      bullet(`${di.drugA} + ${di.drugB}: ${di.effect} [${di.severity}]`);
    });
  }
  divider();

  // Labs
  if (report.labs.abnormal.length > 0) {
    heading(`Abnormal Lab Results (${report.labs.abnormal.length})`);
    report.labs.abnormal.forEach((l) => {
      const range = l.referenceRange
        ? typeof l.referenceRange === "object"
          ? `(range: ${l.referenceRange.low ?? "?"}-${l.referenceRange.high ?? "?"})`
          : `(range: ${l.referenceRange})`
        : "";
      bullet(`${l.name}: ${l.value} ${l.unit ?? ""} ${range}`);
    });
    divider();
  }

  // Conditions
  if (report.conditions.length > 0) {
    heading(`Active Conditions (${report.conditions.length})`);
    report.conditions.forEach((c) => bullet(`${c.name} — since ${c.onsetDate ?? "unknown"}`));
    divider();
  }

  // Allergies
  if (report.allergies.length > 0) {
    heading(`Allergies (${report.allergies.length})`);
    report.allergies.forEach((a) => bullet(`${a.substanceName}${a.reaction ? ` (${a.reaction})` : ""}${a.severity ? ` [${a.severity}]` : ""}`));
    divider();
  }

  // Care Gaps
  if (report.careGaps.overdue.length > 0) {
    heading(`Overdue Preventive Care (${report.careGaps.overdue.length})`);
    report.careGaps.overdue.forEach((g) => bullet(`[${g.priority.toUpperCase()}] ${g.recommendation}: ${g.reason}`));
    divider();
  }

  // Immunizations
  if (report.immunizations.length > 0) {
    heading(`Vaccinations (${report.immunizations.length})`);
    report.immunizations.forEach((i) => bullet(`${i.vaccineName} — ${i.occurrenceDate ?? "date unknown"}`));
    divider();
  }

  // Questions
  if (questions.length > 0) {
    heading("Questions to Ask Your Doctor");
    questions.forEach((q, i) => bullet(`${i + 1}. ${q}`));
    divider();
  }

  // Disclaimer
  checkPage(15);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "italic");
  const discLines = pdf.splitTextToSize(report.disclaimer, maxW);
  pdf.text(discLines, margin, y);

  const name = `${report.patient.firstName}_${report.patient.lastName}`;
  pdf.save(`PreVisit_Report_${name}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// -----------------------------------------------------------
// Component
// -----------------------------------------------------------

const PreVisitPage = () => {
  const { patient } = usePatient();
  const unified = useUnifiedData();
  const ai = useAIAnalysis(patient, unified);

  // AI narrative state (Tier 3, on-demand)
  const [narrative, setNarrative] = useState<PreVisitNarrative | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrativeError, setNarrativeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const narrativeGeneratedRef = useRef(false);

  // Structured report (pure assembly, safe in useMemo)
  const report = useMemo<PreVisitReport | null>(() => {
    if (unified.isLoading || !patient || !ai.tier1) return null;
    return assemblePreVisitReport({
      patient,
      medications: unified.medications,
      labResults: unified.labResults,
      conditions: unified.conditions,
      allergies: unified.allergies,
      immunizations: unified.immunizations,
      conflicts: unified.conflicts,
      sourceSummary: unified.sourceSummary,
      tier1: ai.tier1,
    });
  }, [patient, unified.isLoading, unified.medications, unified.labResults,
      unified.conditions, unified.allergies, unified.immunizations,
      unified.conflicts, unified.sourceSummary, ai.tier1]);

  // Generate AI narrative (button click only)
  const handleGenerateNarrative = useCallback(async () => {
    if (!patient || !ai.tier1 || narrativeGeneratedRef.current) return;
    narrativeGeneratedRef.current = true;
    setNarrativeLoading(true);
    setNarrativeError(null);
    try {
      const result = await generatePreVisitNarrative({
        patient,
        medications: unified.medications,
        labResults: unified.labResults,
        conditions: unified.conditions,
        allergies: unified.allergies,
        immunizations: unified.immunizations,
        conflicts: unified.conflicts,
        tier1: ai.tier1,
      });
      if (result) {
        setNarrative(result);
      } else {
        setNarrativeError("AI returned no results. Data-based report is available.");
        narrativeGeneratedRef.current = false;
      }
    } catch (err) {
      console.error("[PreVisit] Narrative generation failed:", err);
      setNarrativeError("AI failed. Data-based report is available.");
      narrativeGeneratedRef.current = false;
    } finally {
      setNarrativeLoading(false);
    }
  }, [patient, ai.tier1, unified.medications, unified.labResults,
      unified.conditions, unified.allergies, unified.immunizations,
      unified.conflicts]);

  // Fallback questions
  const fallbackQuestions = useMemo(() => {
    if (!report) return [];
    const qs: string[] = [];
    if (report.safety.critical.length > 0) qs.push("I noticed my allergy records differ between providers. Can we reconcile my allergy list?");
    if (report.safety.high.length > 0) qs.push(`I have ${report.safety.high.length} medication(s) only at one provider. Are all my doctors aware of all my medications?`);
    if (report.labs.abnormal.length > 0) qs.push(`I have ${report.labs.abnormal.length} abnormal lab result(s). What do these mean for my treatment plan?`);
    if (report.medications.active.length > 3) qs.push("I'm taking multiple medications. Are there any interactions to worry about?");
    if (report.careGaps.overdue.length > 0) qs.push("Are there any preventive screenings I should schedule?");
    if (qs.length === 0) { qs.push("Is my current medication plan still the best approach?"); qs.push("Are there any preventive screenings I should schedule?"); }
    return qs;
  }, [report]);

  const displayQuestions = narrative?.questions ?? fallbackQuestions;

  // Helpers
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!report) return;
    const lines: string[] = [];
    lines.push(`PRE-VISIT HEALTH REPORT — ${report.patient.firstName} ${report.patient.lastName}`);
    lines.push(`Generated: ${new Date(report.generatedAt).toLocaleDateString()}\n`);
    if (narrative?.narrative) { lines.push("=== HEALTH SUMMARY ==="); lines.push(narrative.narrative + "\n"); }
    lines.push(`=== MEDICATIONS (${report.medications.active.length} active) ===`);
    report.medications.active.forEach((m) => lines.push(`• ${m.name} — ${m.dosageInstruction ?? "no dosage"}`));
    lines.push("");
    if (report.safety.totalAlerts > 0) { lines.push(`=== SAFETY ALERTS (${report.safety.totalAlerts}) ===`); [...report.safety.critical, ...report.safety.high].forEach((a) => lines.push(`• [${a.severity.toUpperCase()}] ${a.title}: ${a.explanation}`)); lines.push(""); }
    if (displayQuestions.length > 0) { lines.push("=== QUESTIONS FOR YOUR DOCTOR ==="); displayQuestions.forEach((q, i) => lines.push(`${i + 1}. ${q}`)); lines.push(""); }
    lines.push(report.disclaimer);
    try { await navigator.clipboard.writeText(lines.join("\n")); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* silent */ }
  }, [report, narrative, displayQuestions]);

  // PDF export
  const handleExportPDF = useCallback(async () => {
    if (!report) return;
    try { await generatePDF(report, narrative, displayQuestions); }
    catch (err) { console.error("[PreVisit] PDF export failed:", err); }
  }, [report, narrative, displayQuestions]);

  // --- Loading / empty ---
  if (unified.isLoading) {
    return (<div className="h-full flex flex-col items-center justify-center"><SkeletonCardList count={4} /></div>);
  }
  if (!report) {
    return (<div className="h-full flex items-center justify-center"><EmptyState icon={FileText} title="Unable to generate report" description="Health data is required to generate your pre-visit report." /></div>);
  }

  // Combine all safety items for display
  const allAlerts = [...report.safety.critical, ...report.safety.high, ...report.safety.medium];

  return (
    <div className="h-full flex flex-col overflow-hidden animate-content-reveal">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between shrink-0 pb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          <h1 className="text-lg font-bold text-slate-900">Pre-Visit Report</h1>
          <span className="text-sm text-slate-600 font-medium">
            {report.patient.firstName} {report.patient.lastName} · {report.dataSources.length} provider{report.dataSources.length !== 1 ? "s" : ""} · {new Date(report.generatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* AI Generate */}
          {!narrative && !narrativeLoading && (
            <button
              onClick={handleGenerateNarrative}
              disabled={!isAIAvailable() || !ai.tier1}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Summary
            </button>
          )}
          {narrativeLoading && (
            <span className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-emerald-600">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…
            </span>
          )}
          <button onClick={handleCopy} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* ===== AI NARRATIVE (when generated) ===== */}
      {narrative && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 px-3.5 py-2.5 mb-2 shrink-0">
          <div className="flex items-start gap-2">
            <Brain className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-bold text-emerald-800">AI Health Summary</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">{narrative.narrative}</p>
            </div>
          </div>
        </div>
      )}
      {narrativeError && !narrative && (
        <div className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-2 shrink-0">{narrativeError}</div>
      )}

      {/* ===== 3-COLUMN CONTENT — dense, newspaper-style ===== */}
      <div className="flex-1 min-h-0 grid grid-cols-3 gap-3">

        {/* ── COLUMN 1: Medications ── */}
        <div className="flex flex-col min-h-0 overflow-y-auto scrollbar-hide pr-1">
          {/* Section: Medications */}
          <div className="flex items-center gap-1.5 mb-1.5 sticky top-0 bg-slate-50/95 backdrop-blur-sm py-1 -mx-0.5 px-0.5 z-10">
            <Pill className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Medications</span>
            <span className="text-[11px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full font-bold">{report.medications.active.length}</span>
          </div>
          {report.medications.active.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">No active medications</p>
          ) : (
            <div className="space-y-0.5">
              {report.medications.active.map((med) => (
                <div key={med.id} className="flex items-start gap-1.5 py-1 border-b border-slate-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 leading-tight">{med.name}</div>
                    <div className="text-[11px] text-slate-500 leading-tight">{med.dosageInstruction ?? "No dosage info"}</div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                    {med.mergeStatus === "conflict" && <span className="text-[8px] px-1 py-0.5 rounded bg-red-100 text-red-700 font-bold">CONFLICT</span>}
                    {med.mergeStatus === "single-source" && <span className="text-[8px] px-1 py-0.5 rounded bg-amber-100 text-amber-700">1 src</span>}
                    {med.allSources.map((s) => <SourceBadge key={s.systemId} source={s} compact />)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Drug interactions */}
          {report.medications.interactions.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
              <div className="text-[11px] font-bold text-red-700 uppercase tracking-wide mb-1">⚠ Drug Interactions ({report.medications.interactions.length})</div>
              {report.medications.interactions.map((di) => (
                <div key={di.id} className="text-xs text-red-800 leading-snug mb-1.5 last:mb-0">
                  Taking <span className="font-bold">{di.drugA}</span> with <span className="font-bold">{di.drugB}</span> may cause: <span className="font-semibold">{di.effect}</span>. Discuss with your provider.
                </div>
              ))}
            </div>
          )}

          {/* Vital correlations */}
          {report.vitalCorrelations.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Meds & Vitals</span>
              </div>
              {report.vitalCorrelations.map((vc) => (
                <div key={vc.id} className="text-xs text-slate-700 leading-snug mb-1.5">
                  <span className="font-bold text-slate-800">{vc.vitalName}</span> while taking <span className="font-bold text-slate-800">{vc.medicationName}</span>: {vc.message}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── COLUMN 2: Safety + Labs ── */}
        <div className="flex flex-col min-h-0 overflow-y-auto scrollbar-hide px-1">
          {/* Section: Safety Alerts */}
          <div className="flex items-center gap-1.5 mb-1.5 sticky top-0 bg-slate-50/95 backdrop-blur-sm py-1 -mx-0.5 px-0.5 z-10">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Safety Alerts</span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${allAlerts.length > 0 ? "text-red-700 bg-red-100" : "text-emerald-700 bg-emerald-100"}`}>{allAlerts.length}</span>
          </div>
          {allAlerts.length === 0 ? (
            <p className="text-xs text-emerald-600 font-medium">✓ No safety concerns</p>
          ) : (
            <div className="space-y-1 mb-3">
              {allAlerts.map((a) => (
                <div key={a.id} className="py-1 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className={`text-[9px] px-1 py-0.5 rounded font-bold uppercase ${a.severity === "critical" ? "bg-red-100 text-red-700" : a.severity === "high" ? "bg-amber-100 text-amber-700" : "bg-yellow-100 text-yellow-700"}`}>{a.severity}</span>
                    <span className="text-[11px] text-slate-500 truncate">{a.category}</span>
                  </div>
                  <div className="text-xs text-slate-800 leading-tight font-bold">{a.title}</div>
                  <div className="text-[11px] text-slate-500 leading-tight">{a.explanation}</div>
                </div>
              ))}
            </div>
          )}

          {/* Section: Abnormal Labs */}
          <div className="flex items-center gap-1.5 mb-0.5 sticky top-0 bg-slate-50/95 backdrop-blur-sm py-1 -mx-0.5 px-0.5 z-10 mt-1">
            <TestTube className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Abnormal Labs</span>
            <span className="text-[11px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full font-bold">{report.labs.abnormal.length}</span>
          </div>
          <p className="text-[11px] text-slate-500 italic mb-1.5">Results outside normal range — discuss with your provider</p>
          {report.labs.trendSummaries.length > 0 && (
            <div className="p-1.5 bg-emerald-50 rounded border border-emerald-200 mb-1.5">
              {report.labs.trendSummaries.slice(0, 2).map((t, i) => <p key={i} className="text-[11px] text-emerald-800 leading-tight font-medium">{t}</p>)}
            </div>
          )}
          {report.labs.abnormal.length === 0 ? (
            <p className="text-[11px] text-emerald-600 font-medium">✓ All labs normal</p>
          ) : (
            <div className="space-y-0.5">
              {report.labs.abnormal.map((lab) => (
                <div key={lab.id} className="flex items-start gap-1 py-0.5 border-b border-slate-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-900 leading-tight">{lab.name}</span>
                      {lab.interpretation && lab.interpretation !== "normal" && (
                        <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${lab.interpretation.includes("critical") ? "bg-red-200 text-red-800" : lab.interpretation.includes("high") ? "bg-amber-100 text-amber-700" : lab.interpretation.includes("low") ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {lab.interpretation.includes("high") ? "↑" : lab.interpretation.includes("low") ? "↓" : "!"} {lab.interpretation.toUpperCase().replace("-", " ")}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      <span className="font-bold text-slate-700">{lab.value}</span> {lab.unit ?? ""}
                      {lab.referenceRange && (
                        <span className="text-slate-400"> (normal: {typeof lab.referenceRange === "object" ? `${lab.referenceRange.low ?? "?"}–${lab.referenceRange.high ?? "?"}` : lab.referenceRange})</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">{fmtDate(lab.effectiveDate)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Care Gaps */}
          {report.careGaps.overdue.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-1.5 mb-1">
                <ClipboardList className="w-3.5 h-3.5 text-orange-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Overdue Care</span>
                <span className="text-[11px] text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded-full font-bold">{report.careGaps.overdue.length}</span>
              </div>
              {report.careGaps.overdue.map((g) => (
                <div key={g.id} className="text-xs text-slate-700 leading-tight mb-1">
                  <span className={`text-[9px] px-1 py-0.5 rounded font-bold uppercase mr-1 ${g.priority === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{g.priority}</span>
                  <span className="font-bold">{g.recommendation}</span> — {g.reason}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── COLUMN 3: Conditions + Allergies + Vaccines + Questions ── */}
        <div className="flex flex-col min-h-0 overflow-y-auto scrollbar-hide pl-1">
          {/* Section: Conditions */}
          <div className="flex items-center gap-1.5 mb-1.5 sticky top-0 bg-slate-50/95 backdrop-blur-sm py-1 -mx-0.5 px-0.5 z-10">
            <Heart className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Conditions</span>
            <span className="text-[11px] text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-full font-bold">{report.conditions.length}</span>
          </div>
          {report.conditions.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">None recorded</p>
          ) : (
            <div className="space-y-0.5 mb-3">
              {report.conditions.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5 py-0.5">
                  <span className="text-xs font-bold text-slate-900">{c.name}</span>
                  <span className="text-[10px] text-slate-400">since {c.onsetDate ? fmtDate(c.onsetDate) : "?"}</span>
                  {c.allSources.length > 1 && <span className="text-[9px] text-emerald-600 font-medium">· {c.allSources.length} providers</span>}
                </div>
              ))}
            </div>
          )}

          {/* Section: Allergies */}
          <div className="flex items-center gap-1.5 mb-1.5 sticky top-0 bg-slate-50/95 backdrop-blur-sm py-1 -mx-0.5 px-0.5 z-10">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Allergies</span>
            <span className="text-[11px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full font-bold">{report.allergies.length}</span>
          </div>
          {report.allergies.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">None recorded</p>
          ) : (
            <div className="space-y-0.5 mb-3">
              {report.allergies.map((a) => (
                <div key={a.id} className="flex items-center gap-1.5 py-0.5">
                  <span className="text-xs font-bold text-slate-900">{a.substanceName}</span>
                  {a.reaction && <span className="text-[10px] text-slate-500">({a.reaction})</span>}
                  {a.severity && <span className="text-[10px] text-amber-600 font-bold">[{a.severity}]</span>}
                </div>
              ))}
            </div>
          )}

          {/* Section: Vaccinations */}
          <div className="flex items-center gap-1.5 mb-1.5 sticky top-0 bg-slate-50/95 backdrop-blur-sm py-1 -mx-0.5 px-0.5 z-10">
            <Syringe className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Vaccinations</span>
            <span className="text-[11px] text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded-full font-bold">{report.immunizations.length}</span>
          </div>
          {report.immunizations.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">None recorded</p>
          ) : (
            <div className="space-y-0.5 mb-3">
              {report.immunizations.map((im) => (
                <div key={im.id} className="flex items-center gap-1 py-0.5">
                  <CheckCircle2 className="w-3 h-3 text-teal-500 shrink-0" />
                  <span className="text-xs font-medium text-slate-900">{im.vaccineName}</span>
                  {im.occurrenceDate && <span className="text-[10px] text-slate-400">Received {fmtDate(im.occurrenceDate)}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Section: Questions for Doctor */}
          <div className="flex items-center gap-1.5 mb-1.5 sticky top-0 bg-slate-50/95 backdrop-blur-sm py-1 -mx-0.5 px-0.5 z-10">
            <MessageCircleQuestion className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Questions for Your Visit</span>
            {narrative && <span className="text-[9px] text-violet-600 bg-violet-100 px-1 py-0.5 rounded font-bold">AI</span>}
          </div>
          <div className="space-y-1.5">
            {displayQuestions.map((q, i) => (
              <div key={i} className="flex gap-1.5">
                <span className="w-4 h-4 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-xs text-slate-700 leading-snug">{q}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div className="shrink-0 pt-2 border-t border-slate-200 mt-1.5">
        <p className="text-[11px] text-slate-500 font-medium leading-snug text-center">{report.disclaimer}</p>
      </div>
    </div>
  );
};

export default PreVisitPage;
