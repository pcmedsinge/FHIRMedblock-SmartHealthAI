// -----------------------------------------------------------
// PreVisitPage — AI-Generated Pre-Visit Report (Phase 7)
// -----------------------------------------------------------
// Viewport-fit single-screen layout. NO scrolling.
// Card grid with counts + highlights at a glance.
// Detail overlay for drilling into any section.
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
  X,
  ChevronRight,
} from "lucide-react";
import { useState, useMemo, useCallback, useRef } from "react";

// -----------------------------------------------------------
// Section definitions for the card grid
// -----------------------------------------------------------

type SectionKey = "summary" | "meds" | "safety" | "labs" | "gaps" | "conditions" | "allergies" | "immunizations" | "questions";

interface SectionDef {
  key: SectionKey;
  label: string;
  icon: React.ElementType;
  iconBg: string;
  cardBg: string;
}

const SECTIONS: SectionDef[] = [
  { key: "meds",       label: "Medications",   icon: Pill,              iconBg: "bg-blue-500",    cardBg: "bg-blue-50" },
  { key: "safety",     label: "Safety Alerts",  icon: ShieldAlert,       iconBg: "bg-red-500",     cardBg: "bg-red-50" },
  { key: "labs",       label: "Lab Results",    icon: TestTube,          iconBg: "bg-emerald-500", cardBg: "bg-emerald-50" },
  { key: "gaps",       label: "Care Gaps",      icon: ClipboardList,     iconBg: "bg-orange-500",  cardBg: "bg-orange-50" },
  { key: "conditions", label: "Conditions",     icon: Heart,             iconBg: "bg-rose-500",    cardBg: "bg-rose-50" },
  { key: "allergies",  label: "Allergies",      icon: AlertTriangle,     iconBg: "bg-amber-500",   cardBg: "bg-amber-50" },
  { key: "immunizations", label: "Vaccinations", icon: Syringe,          iconBg: "bg-teal-500",    cardBg: "bg-teal-50" },
  { key: "questions",  label: "Doctor Q&A",     icon: MessageCircleQuestion, iconBg: "bg-violet-500", cardBg: "bg-violet-50" },
];

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

  // Detail overlay
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);

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

  // Section count badges
  const sectionCounts = useMemo(() => {
    if (!report) return {} as Record<SectionKey, { count: number; highlight?: string }>;
    return {
      summary: { count: 0 },
      meds: { count: report.medications.active.length, highlight: report.medications.interactions.length > 0 ? `${report.medications.interactions.length} interaction${report.medications.interactions.length !== 1 ? "s" : ""}` : undefined },
      safety: { count: report.safety.totalAlerts, highlight: report.safety.critical.length > 0 ? `${report.safety.critical.length} critical` : undefined },
      labs: { count: report.labs.abnormal.length, highlight: report.labs.trendSummaries.length > 0 ? `${report.labs.trendSummaries.length} trend${report.labs.trendSummaries.length !== 1 ? "s" : ""}` : undefined },
      gaps: { count: report.careGaps.overdue.length, highlight: report.careGaps.overdue.filter((g) => g.priority === "high").length > 0 ? "high priority" : undefined },
      conditions: { count: report.conditions.length },
      allergies: { count: report.allergies.length },
      immunizations: { count: report.immunizations.length },
      questions: { count: displayQuestions.length, highlight: narrative ? "AI-personalized" : undefined },
    } as Record<SectionKey, { count: number; highlight?: string }>;
  }, [report, displayQuestions, narrative]);

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

  // --- Detail overlay content ---
  const renderSectionDetail = (key: SectionKey) => {
    switch (key) {
      case "meds":
        return (
          <div className="space-y-2">
            {report.medications.active.length === 0 ? (
              <p className="text-sm text-slate-400">No active medications</p>
            ) : report.medications.active.map((med) => (
              <div key={med.id} className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900">{med.name}</div>
                  <div className="text-xs text-slate-500">{med.dosageInstruction ?? "No dosage info"}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {med.mergeStatus === "conflict" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">CONFLICT</span>}
                  {med.mergeStatus === "single-source" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">1 source</span>}
                  {med.allSources.map((s) => <SourceBadge key={s.systemId} source={s} compact />)}
                </div>
              </div>
            ))}
            {report.medications.interactions.length > 0 && (
              <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
                <div className="text-xs font-bold text-red-700 uppercase mb-2">Drug Interactions</div>
                {report.medications.interactions.map((di) => (
                  <div key={di.id} className="text-sm text-red-800 mb-1"><span className="font-bold">{di.drugA}</span> + <span className="font-bold">{di.drugB}</span> — {di.effect}</div>
                ))}
              </div>
            )}
          </div>
        );
      case "safety":
        return report.safety.conflicts.length === 0 ? (
          <p className="text-sm text-slate-400">No safety conflicts detected</p>
        ) : (
          <div className="space-y-2">
            {report.safety.conflicts.map((c) => (
              <div key={c.id} className="py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${c.severity === "critical" ? "bg-red-100 text-red-700" : c.severity === "high" ? "bg-amber-100 text-amber-700" : "bg-yellow-100 text-yellow-700"}`}>{c.severity}</span>
                  <span className="text-xs text-slate-500">{c.sourceA.systemName} ↔ {c.sourceB.systemName}</span>
                </div>
                <div className="text-sm text-slate-700">{c.description}</div>
              </div>
            ))}
          </div>
        );
      case "labs":
        return report.labs.abnormal.length === 0 ? (
          <p className="text-sm text-slate-400">No abnormal lab results</p>
        ) : (
          <div className="space-y-2">
            {report.labs.trendSummaries.length > 0 && (
              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 mb-3">
                <div className="text-xs font-bold text-emerald-700 uppercase mb-1">Trends</div>
                {report.labs.trendSummaries.slice(0, 3).map((t, i) => <p key={i} className="text-xs text-emerald-800">{t}</p>)}
              </div>
            )}
            {report.labs.abnormal.map((lab) => (
              <div key={lab.id} className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900">{lab.name}</div>
                  <div className="text-xs text-slate-500">{lab.value} {lab.unit ?? ""} {lab.referenceRange && (<span>(range: {typeof lab.referenceRange === "object" ? `${lab.referenceRange.low ?? "?"}-${lab.referenceRange.high ?? "?"}` : lab.referenceRange})</span>)}</div>
                </div>
                <div className="text-xs text-slate-500">{lab.effectiveDate ?? ""}</div>
              </div>
            ))}
          </div>
        );
      case "gaps":
        return report.careGaps.overdue.length === 0 ? (
          <p className="text-sm text-emerald-600 font-medium">All preventive care is up to date!</p>
        ) : (
          <div className="space-y-2">
            {report.careGaps.overdue.map((g) => (
              <div key={g.id} className="py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${g.priority === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{g.priority}</span>
                  <span className="text-sm font-medium text-slate-900">{g.recommendation}</span>
                </div>
                <div className="text-xs text-slate-600">{g.reason}</div>
              </div>
            ))}
          </div>
        );
      case "conditions":
        return report.conditions.length === 0 ? (
          <p className="text-sm text-slate-400">No active conditions recorded</p>
        ) : (
          <div className="space-y-1">
            {report.conditions.map((c) => (
              <div key={c.id} className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
                <div className="flex-1"><div className="text-sm font-medium text-slate-900">{c.name}</div><div className="text-xs text-slate-500">Since {c.onsetDate ?? "unknown"}</div></div>
                {c.allSources.map((s) => <SourceBadge key={s.systemId} source={s} compact />)}
              </div>
            ))}
          </div>
        );
      case "allergies":
        return report.allergies.length === 0 ? (
          <p className="text-sm text-slate-400">No allergies recorded</p>
        ) : (
          <div className="space-y-1">
            {report.allergies.map((a) => (
              <div key={a.id} className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
                <div className="flex-1"><div className="text-sm font-medium text-slate-900">{a.substanceName}</div><div className="text-xs text-slate-500">{a.reaction ?? "No reaction info"}{a.severity ? ` · ${a.severity}` : ""}</div></div>
                {a.allSources.map((s) => <SourceBadge key={s.systemId} source={s} compact />)}
              </div>
            ))}
          </div>
        );
      case "immunizations":
        return report.immunizations.length === 0 ? (
          <p className="text-sm text-slate-400">No vaccinations recorded</p>
        ) : (
          <div className="space-y-1">
            {report.immunizations.map((im) => (
              <div key={im.id} className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                <div className="flex-1"><div className="text-sm font-medium text-slate-900">{im.vaccineName}</div><div className="text-xs text-slate-500">{im.occurrenceDate ?? "date unknown"}</div></div>
              </div>
            ))}
          </div>
        );
      case "questions":
        return (
          <div className="space-y-2.5">
            {narrative && <div className="text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded-lg font-medium mb-2 inline-block">AI-Personalized Questions</div>}
            {displayQuestions.map((q, i) => (
              <div key={i} className="flex gap-2.5">
                <div className="w-6 h-6 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                <p className="text-sm text-slate-700 leading-relaxed">{q}</p>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ===== HEADER ROW ===== */}
      <div className="flex items-center justify-between shrink-0 pb-3">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-emerald-600" />
          <h1 className="text-xl font-bold text-slate-900">Visit Preparation</h1>
          <span className="text-sm text-slate-500">
            · {report.dataSources.length} provider{report.dataSources.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT — Two columns, viewport-fit ===== */}
      <div className="flex-1 min-h-0 grid grid-cols-[1fr_1fr] gap-3">

        {/* LEFT COLUMN — AI banner + card grid */}
        <div className="flex flex-col gap-3 min-h-0">

          {/* AI Banner (compact) */}
          {!narrative && !narrativeLoading && (
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-3.5 text-white shrink-0">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 shrink-0 opacity-80" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold">AI-Powered Report</div>
                  <div className="text-[11px] text-emerald-100 leading-tight mt-0.5">
                    Generate a health narrative &amp; personalized doctor questions.
                    {narrativeError && <span className="text-amber-200"> {narrativeError}</span>}
                  </div>
                </div>
                <button
                  onClick={handleGenerateNarrative}
                  disabled={!isAIAvailable() || !ai.tier1}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-emerald-700 font-bold text-xs rounded-lg hover:bg-emerald-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Generate
                </button>
              </div>
            </div>
          )}

          {/* AI loading */}
          {narrativeLoading && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-3.5 text-white shrink-0">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin shrink-0" />
                <div><div className="text-xs font-bold">Generating Smart Report…</div><div className="text-[11px] text-emerald-100">Using gpt-4o · may take a few seconds</div></div>
              </div>
            </div>
          )}

          {/* AI Narrative card (generated) */}
          {narrative && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-3.5 shrink-0 max-h-[35%] overflow-y-auto">
              <div className="flex items-center gap-1.5 mb-2">
                <Brain className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-800">AI Health Summary</span>
                <span className="ml-auto text-[10px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">{narrative.model}</span>
              </div>
              <div className="text-xs text-slate-700 leading-relaxed space-y-1.5">
                {narrative.narrative.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </div>
          )}

          {/* Card grid — 2×4 */}
          <div className="flex-1 min-h-0 grid grid-cols-2 gap-2 auto-rows-fr">
            {SECTIONS.map((sec) => {
              const info = sectionCounts[sec.key];
              const count = info?.count ?? 0;
              const isActive = activeSection === sec.key;
              const Icon = sec.icon;
              const hasAlert = sec.key === "safety" && count > 0;

              return (
                <button
                  key={sec.key}
                  onClick={() => setActiveSection(isActive ? null : sec.key)}
                  className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    isActive
                      ? "bg-white border-emerald-300 ring-2 ring-emerald-200 shadow-md"
                      : `${sec.cardBg} border-transparent hover:border-slate-200 hover:shadow-sm`
                  }`}
                >
                  <div className={`w-8 h-8 ${sec.iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 leading-tight">{sec.label}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-lg font-extrabold leading-none ${hasAlert ? "text-red-600" : "text-slate-800"}`}>
                        {count}
                      </span>
                      {info?.highlight && (
                        <span className={`text-[10px] font-medium leading-tight ${hasAlert ? "text-red-500" : "text-slate-500"}`}>
                          {info.highlight}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isActive ? "rotate-90 text-emerald-600" : "group-hover:text-emerald-600"}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN — Detail panel */}
        <div className="flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {activeSection ? (
            <>
              {/* Detail header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 shrink-0 bg-slate-50">
                {(() => { const sec = SECTIONS.find((s) => s.key === activeSection); if (!sec) return null; const Icon = sec.icon; return (<><div className={`w-7 h-7 ${sec.iconBg} rounded-lg flex items-center justify-center`}><Icon className="w-3.5 h-3.5 text-white" /></div><h2 className="text-sm font-bold text-slate-900">{sec.label}</h2></>); })()}
                <button onClick={() => setActiveSection(null)} className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              {/* Detail content */}
              <div className="flex-1 overflow-y-auto p-4">
                {renderSectionDetail(activeSection)}
              </div>
            </>
          ) : (
            /* Empty state — overview */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mb-3">
                <Stethoscope className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Your Visit Report</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[240px] mb-4">
                Select any section to see details.
                Print, export to PDF, or copy to share with your doctor.
              </p>
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-lg font-extrabold text-blue-700">{report.medications.active.length}</div>
                  <div className="text-[10px] text-blue-600 font-medium">Meds</div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded-lg">
                  <div className="text-lg font-extrabold text-red-700">{report.safety.totalAlerts}</div>
                  <div className="text-[10px] text-red-600 font-medium">Alerts</div>
                </div>
                <div className="text-center p-2 bg-emerald-50 rounded-lg">
                  <div className="text-lg font-extrabold text-emerald-700">{report.labs.abnormal.length}</div>
                  <div className="text-[10px] text-emerald-600 font-medium">Abnormal</div>
                </div>
              </div>
              {/* Disclaimer */}
              <p className="text-[10px] text-slate-400 mt-4 leading-relaxed max-w-[280px]">
                {report.disclaimer.slice(0, 120)}…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreVisitPage;
