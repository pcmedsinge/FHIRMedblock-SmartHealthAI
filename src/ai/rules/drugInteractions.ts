// -----------------------------------------------------------
// Tier 1 Rule: Drug Interaction Lookup
// -----------------------------------------------------------
// Checks all active medications from all sources for known
// drug-drug interactions. Uses a hardcoded table of ~20 common
// clinically significant interactions.
//
// CROSS-SYSTEM VALUE: A drug prescribed by Epic PCP + a drug
// prescribed by Community MC urgent care can interact — neither
// provider may know about the other prescription.
//
// COST: $0 — hardcoded lookup table
// -----------------------------------------------------------

import type { MergedMedication } from "../../types/merged";
import type { DrugInteraction } from "../types";

// -----------------------------------------------------------
// Interaction database — clinically significant pairs
// -----------------------------------------------------------
// Each entry: [drugA pattern, drugB pattern, severity, effect, description]
// Sources: FDA Drug Safety, Clinical Pharmacology databases
// NOTE: Production would use First Databank, Medi-Span, or NLM RxNorm API

interface InteractionEntry {
  drugA: RegExp;
  drugB: RegExp;
  severity: DrugInteraction["severity"];
  effect: string;
  description: string;
}

const INTERACTION_TABLE: InteractionEntry[] = [
  // ---- Critical interactions ----
  {
    drugA: /warfarin|coumadin/i,
    drugB: /aspirin|ibuprofen|naproxen|nsaid|advil|motrin|aleve/i,
    severity: "critical",
    effect: "Increased bleeding risk",
    description:
      "Warfarin combined with NSAIDs or aspirin significantly increases the risk of gastrointestinal and other bleeding. This combination should be used with extreme caution.",
  },
  {
    drugA: /warfarin|coumadin/i,
    drugB: /fluconazole|metronidazole|flagyl/i,
    severity: "critical",
    effect: "Warfarin levels dangerously increased",
    description:
      "These antifungal/antimicrobial agents inhibit warfarin metabolism, potentially causing dangerous elevations in INR and bleeding risk.",
  },
  {
    drugA: /methotrexate/i,
    drugB: /trimethoprim|bactrim|septra|sulfamethoxazole/i,
    severity: "critical",
    effect: "Methotrexate toxicity risk",
    description:
      "Trimethoprim-sulfamethoxazole decreases methotrexate clearance, risking severe bone marrow suppression and organ toxicity.",
  },
  {
    drugA: /lithium/i,
    drugB: /ibuprofen|naproxen|nsaid|diclofenac|meloxicam|ketorolac/i,
    severity: "critical",
    effect: "Lithium toxicity risk",
    description:
      "NSAIDs reduce lithium clearance, potentially causing lithium toxicity (tremor, confusion, seizures). Close monitoring required.",
  },

  // ---- High severity interactions ----
  {
    drugA: /metformin/i,
    drugB: /contrast|iodine/i,
    severity: "high",
    effect: "Lactic acidosis risk",
    description:
      "Metformin should be held before and after iodinated contrast procedures to reduce lactic acidosis risk.",
  },
  {
    drugA: /ace inhibitor|lisinopril|enalapril|ramipril|benazepril/i,
    drugB: /potassium|k-dur|klor-con|spironolactone/i,
    severity: "high",
    effect: "Hyperkalemia risk",
    description:
      "ACE inhibitors with potassium supplements or potassium-sparing diuretics can cause dangerously high potassium levels.",
  },
  {
    drugA: /ssri|sertraline|fluoxetine|paroxetine|citalopram|escitalopram/i,
    drugB: /tramadol|fentanyl|meperidine|maoi|selegiline|linezolid/i,
    severity: "high",
    effect: "Serotonin syndrome risk",
    description:
      "Combining serotonergic medications increases the risk of serotonin syndrome — a potentially life-threatening condition with agitation, hyperthermia, and muscle rigidity.",
  },
  {
    drugA: /statin|atorvastatin|simvastatin|rosuvastatin|lovastatin/i,
    drugB: /clarithromycin|erythromycin|itraconazole|ketoconazole/i,
    severity: "high",
    effect: "Increased statin levels (rhabdomyolysis risk)",
    description:
      "These inhibitors increase statin blood levels, raising the risk of muscle breakdown (rhabdomyolysis). Statin dose adjustment or alternative antibiotic may be needed.",
  },
  {
    drugA: /digoxin/i,
    drugB: /amiodarone|verapamil|quinidine/i,
    severity: "high",
    effect: "Digoxin toxicity risk",
    description:
      "These medications increase digoxin levels, potentially causing toxicity (nausea, vision changes, arrhythmias). Digoxin dose reduction typically needed.",
  },
  {
    drugA: /clopidogrel|plavix/i,
    drugB: /omeprazole|esomeprazole/i,
    severity: "high",
    effect: "Reduced clopidogrel effectiveness",
    description:
      "Omeprazole and esomeprazole inhibit the enzyme that activates clopidogrel, reducing its antiplatelet effect. Consider pantoprazole instead.",
  },

  // ---- Moderate interactions ----
  {
    drugA: /metformin/i,
    drugB: /prednisone|prednisolone|dexamethasone|methylprednisolone/i,
    severity: "moderate",
    effect: "Reduced blood sugar control",
    description:
      "Corticosteroids raise blood sugar, counteracting metformin's glucose-lowering effect. Blood sugar monitoring should be increased.",
  },
  {
    drugA: /levothyroxine|synthroid/i,
    drugB: /calcium|iron|antacid|omeprazole|sucralfate/i,
    severity: "moderate",
    effect: "Reduced thyroid medication absorption",
    description:
      "These medications can reduce levothyroxine absorption. Take levothyroxine 4 hours apart from these drugs.",
  },
  {
    drugA: /beta.?blocker|metoprolol|atenolol|propranolol|carvedilol/i,
    drugB: /verapamil|diltiazem/i,
    severity: "moderate",
    effect: "Excessive heart rate lowering",
    description:
      "Both drugs slow heart rate. Together, they can cause dangerously slow pulse (bradycardia) or heart block.",
  },
  {
    drugA: /amlodipine|nifedipine/i,
    drugB: /simvastatin/i,
    severity: "moderate",
    effect: "Increased simvastatin levels",
    description:
      "Amlodipine increases simvastatin levels. Simvastatin dose should not exceed 20mg when used with amlodipine.",
  },
  {
    drugA: /ciprofloxacin|levofloxacin/i,
    drugB: /antacid|calcium|iron|magnesium|zinc/i,
    severity: "moderate",
    effect: "Reduced antibiotic absorption",
    description:
      "Metal-containing products chelate fluoroquinolones, reducing absorption. Separate by at least 2 hours.",
  },
  {
    drugA: /allopurinol/i,
    drugB: /azathioprine|mercaptopurine/i,
    severity: "high",
    effect: "Severe immunosuppression",
    description:
      "Allopurinol inhibits the breakdown of azathioprine/6-MP, potentially causing life-threatening bone marrow suppression. Dose reduction of 50-75% required.",
  },
  {
    drugA: /insulin/i,
    drugB: /beta.?blocker|metoprolol|atenolol|propranolol/i,
    severity: "moderate",
    effect: "Masked hypoglycemia symptoms",
    description:
      "Beta-blockers can mask the symptoms of low blood sugar (tremor, rapid heartbeat), making hypoglycemia harder to detect.",
  },
  {
    drugA: /ssri|sertraline|fluoxetine|paroxetine|citalopram/i,
    drugB: /nsaid|ibuprofen|naproxen|aspirin/i,
    severity: "moderate",
    effect: "Increased GI bleeding risk",
    description:
      "SSRIs reduce platelet function, and NSAIDs irritate the GI tract. Together, they increase the risk of gastrointestinal bleeding.",
  },
  {
    drugA: /thiazide|hydrochlorothiazide|chlorthalidone/i,
    drugB: /lithium/i,
    severity: "high",
    effect: "Lithium toxicity",
    description:
      "Thiazide diuretics decrease lithium clearance, increasing the risk of lithium toxicity. Requires close monitoring.",
  },
];

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

let interactionCounter = 0;

function makeInteractionId(): string {
  interactionCounter++;
  return `ddi-${interactionCounter}`;
}

/**
 * Normalize medication name for matching.
 */
function normalizeMedName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Check if a medication is "active" (should be considered for interactions).
 */
function isActiveMed(med: MergedMedication): boolean {
  const activeStatuses = ["active", "completed", "on-hold"];
  return activeStatuses.includes(med.status.toLowerCase());
}

// -----------------------------------------------------------
// Main analysis function
// -----------------------------------------------------------

/**
 * Check all active medications for known drug-drug interactions.
 * Compares every pair — especially valuable when medications come
 * from different health systems.
 */
export function detectDrugInteractions(medications: MergedMedication[]): DrugInteraction[] {
  interactionCounter = 0;
  const interactions: DrugInteraction[] = [];
  const seen = new Set<string>(); // Prevent duplicate pairs

  const activeMeds = medications.filter(isActiveMed);

  for (let i = 0; i < activeMeds.length; i++) {
    for (let j = i + 1; j < activeMeds.length; j++) {
      const medA = activeMeds[i];
      const medB = activeMeds[j];
      const nameA = normalizeMedName(medA.name);
      const nameB = normalizeMedName(medB.name);

      for (const entry of INTERACTION_TABLE) {
        const matchAB =
          entry.drugA.test(nameA) && entry.drugB.test(nameB);
        const matchBA =
          entry.drugA.test(nameB) && entry.drugB.test(nameA);

        if (matchAB || matchBA) {
          // Dedup: sort names to create canonical key
          const pairKey = [nameA, nameB].sort().join("|");
          const interactionKey = `${pairKey}:${entry.effect}`;

          if (seen.has(interactionKey)) continue;
          seen.add(interactionKey);

          interactions.push({
            id: makeInteractionId(),
            drugA: matchAB ? medA.name : medB.name,
            drugB: matchAB ? medB.name : medA.name,
            severity: entry.severity,
            description: entry.description,
            effect: entry.effect,
            dataSource: "SmartHealthAI Clinical Rules",
            drugASources: (matchAB ? medA : medB).allSources,
            drugBSources: (matchAB ? medB : medA).allSources,
          });
        }
      }
    }
  }

  // Sort by severity
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    moderate: 2,
    low: 3,
  };
  interactions.sort(
    (a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
  );

  return interactions;
}
