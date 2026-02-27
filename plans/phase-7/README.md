# Phase 7 — Pre-Visit Report Generator
**Status: Not Started**

## Goal
Generate a shareable one-page summary patients can bring to their doctor appointment. This is the "Act" pillar — tangible output the user takes to a real-world interaction.

## Tasks

### 7.1 — Report Content Assembly
Create `src/ai/preVisitReport.ts`:

Assembles all data + AI insights into a structured report object:

```typescript
interface PreVisitReport {
  generatedAt: string;
  patient: PatientDemographics;
  
  // Section 1: AI-generated narrative summary
  narrativeSummary: string;
  
  // Section 2: Current medications (all sources)
  medications: {
    list: MergedMedication[];
    interactions: DrugInteraction[];
    sourceNote: string; // "From 2 health systems"
  };
  
  // Section 3: Abnormal lab trends
  labHighlights: {
    abnormalLabs: MergedLabResult[];
    trendNarrative: string;
  };
  
  // Section 4: Active conditions (context, not a page)
  activeConditions: MergedCondition[];
  
  // Section 5: AI-flagged concerns
  concerns: {
    interactions: DrugInteraction[];
    careGaps: CareGap[];
    vitalCorrelations: VitalCorrelation[];
    conflicts: Conflict[];
  };
  
  // Section 6: Suggested questions for the doctor
  suggestedQuestions: string[];
  
  // Footer
  disclaimer: string;
  dataSources: SourceTag[];
}
```

### 7.2 — Report Narrative Generation (Tier 3 — On-Demand)
Create `src/ai/llm/reportNarrative.ts`:
- **Triggered only when user clicks "Generate Report"**
- Uses **gpt-4o** (the only feature that uses the more expensive model — quality matters here)
- Generates:
  - Overall narrative summary (2-3 paragraphs)
  - Suggested questions for the doctor (3-5 specific, contextual questions)
- Cached after first generation (same data = same report)

### 7.3 — Report UI Page
`src/pages/PreVisitPage.tsx`:

**Layout:**
```
┌──────────────────────────────────────────────────┐
│  Pre-Visit Report                                │
│                                                  │
│  "Generate a summary to bring to your next       │
│   doctor appointment"                            │
│                                                  │
│  [ 📄 Generate Report ]    [ 🖨️ Print ]  [ ⬇️ PDF ] │
│                                                  │
├──────────────────────────────────────────────────┤
│  (Report appears here after generation)          │
│                                                  │
│  ┌─ Summary ────────────────────────────────┐   │
│  │ AI narrative of overall health picture     │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌─ Medications ────────────────────────────┐   │
│  │ List with source labels + interactions     │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌─ Lab Trends ─────────────────────────────┐   │
│  │ Abnormal results + trend narrative         │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌─ Concerns ───────────────────────────────┐   │
│  │ Interactions, care gaps, conflicts         │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌─ Questions to Ask ───────────────────────┐   │
│  │ 1. "Given that my A1c has risen to 7.2,   │   │
│  │     should we adjust my Metformin dose?"   │   │
│  │ 2. "I'm on Lisinopril from you and        │   │
│  │     Spironolactone from Dr. Smith —        │   │
│  │     is this combination safe?"             │   │
│  │ 3. ...                                     │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌─ Disclaimer ─────────────────────────────┐   │
│  │ "This report was generated by AI and is    │   │
│  │  not medical advice. Data sourced from:    │   │
│  │  Epic MyHealth, Community Medical Center.  │   │
│  │  Generated on Feb 26, 2026 using gpt-4o." │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 7.4 — Export Options
- **PDF download** — html2canvas + jsPDF (render the report div as PDF)
- **Print-friendly** — CSS `@media print` styles for clean printing
- **Copy to clipboard** — plain text version of the report

## Deliverable
One-click pre-visit report that:
- Assembles all cross-system data and AI insights
- Generates an LLM narrative with contextual doctor questions
- Exports as PDF or print
- Includes full disclaimer and source attribution

## Verification
- "Generate Report" button triggers loading state, then shows report
- Report includes medications from both sources with labels
- Suggested questions are specific to the patient's data (not generic)
- PDF export produces a clean, readable document
- Disclaimer and source info are always present
- Second generation of same report uses cached result
- Report works even if some data domains are empty
