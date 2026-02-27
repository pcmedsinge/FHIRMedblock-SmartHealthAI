// -----------------------------------------------------------
// Community Medical Center — Synthetic Lab Results
// -----------------------------------------------------------
// 15 lab results designed to create rich trend & insight stories.
//
// WHAT EPIC ACTUALLY HAS (labs):
//   - 1 lab: Hemoglobin A1C = 5.1 (NORMAL!) from May 2019
//   - NO glucose, NO lipids, NO INR, NO kidney function, NO thyroid
//
// AI STORIES ENABLED (verified against real Epic data):
//   1. A1c CROSS-SYSTEM DIVERGENCE:
//      Epic: 5.1 (normal, May 2019) → CMC: 6.5 → 6.8 → 7.2 → 7.5
//      → "A1C was normal at Epic 6 years ago. Now diabetic at CMC."
//      → "Prednisone started Oct 2025 — A1c jumped from 6.8 to 7.5"
//   2. FASTING GLUCOSE HIGH: 126 → 142 mg/dL (confirms A1c story)
//   3. CHOLESTEROL IMPROVING: Total 245→210, LDL 165→130
//      → "Atorvastatin working — LDL down 21%" (CMC-only data)
//   4. INR TRENDING HIGH: 2.8 → 3.5 (warfarin monitoring)
//      → "Prednisone can increase INR — dose needs review"
//      → Epic has NO INR data (doesn't know about warfarin!)
//   5. CREATININE borderline: 1.2 (kidney watch with metformin)
//   6. TSH mildly elevated: 4.8 (subclinical hypothyroidism)
//   7. VITAMIN D LOW: 18 ng/mL — untreated care gap
//   8. HDL LOW: 38 mg/dL — below protective level
//   9. POTASSIUM slightly low: 3.4 — medication monitoring
// -----------------------------------------------------------

export const labResultBundle = {
  resourceType: "Bundle" as const,
  type: "searchset" as const,
  total: 15,
  entry: [
    // ================= A1c SERIES (THE MAIN TREND STORY) =================

    // A1c #1 — Baseline
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-lab-001",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "4548-4",
              display: "Hemoglobin A1c/Hemoglobin.total in Blood",
            },
          ],
          text: "Hemoglobin A1c",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-06-20T10:30:00-05:00",
        valueQuantity: {
          value: 6.5,
          unit: "%",
          system: "http://unitsofmeasure.org",
          code: "%",
        },
        referenceRange: [
          {
            low: { value: 4.0, unit: "%" },
            high: { value: 5.6, unit: "%" },
            text: "Normal: < 5.7%, Pre-diabetes: 5.7-6.4%, Diabetes: >= 6.5%",
          },
        ],
        interpretation: [
          {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "H", display: "High" }],
          },
        ],
      },
    },

    // A1c #2 — Rising
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-lab-002",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "4548-4",
              display: "Hemoglobin A1c/Hemoglobin.total in Blood",
            },
          ],
          text: "Hemoglobin A1c",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-08-20T14:30:00-05:00",
        valueQuantity: {
          value: 6.8,
          unit: "%",
          system: "http://unitsofmeasure.org",
          code: "%",
        },
        referenceRange: [
          {
            low: { value: 4.0, unit: "%" },
            high: { value: 5.6, unit: "%" },
            text: "Normal: < 5.7%, Pre-diabetes: 5.7-6.4%, Diabetes: >= 6.5%",
          },
        ],
        interpretation: [
          {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "H", display: "High" }],
          },
        ],
      },
    },

    // A1c #3 — Higher (post-prednisone period)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-lab-003",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "4548-4",
              display: "Hemoglobin A1c/Hemoglobin.total in Blood",
            },
          ],
          text: "Hemoglobin A1c",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-12-15T08:15:00-06:00",
        valueQuantity: {
          value: 7.2,
          unit: "%",
          system: "http://unitsofmeasure.org",
          code: "%",
        },
        referenceRange: [
          {
            low: { value: 4.0, unit: "%" },
            high: { value: 5.6, unit: "%" },
            text: "Normal: < 5.7%, Pre-diabetes: 5.7-6.4%, Diabetes: >= 6.5%",
          },
        ],
        interpretation: [
          {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "HH", display: "Critical High" }],
          },
        ],
      },
    },

    // A1c #4 — Alarming (most recent)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-lab-004",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "4548-4",
              display: "Hemoglobin A1c/Hemoglobin.total in Blood",
            },
          ],
          text: "Hemoglobin A1c",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2026-01-10T11:30:00-06:00",
        valueQuantity: {
          value: 7.5,
          unit: "%",
          system: "http://unitsofmeasure.org",
          code: "%",
        },
        referenceRange: [
          {
            low: { value: 4.0, unit: "%" },
            high: { value: 5.6, unit: "%" },
            text: "Normal: < 5.7%, Pre-diabetes: 5.7-6.4%, Diabetes: >= 6.5%",
          },
        ],
        interpretation: [
          {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "HH", display: "Critical High" }],
          },
        ],
      },
    },

    // ================= FASTING GLUCOSE (CONFIRMS A1c STORY) =================

    // Glucose #1
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-lab-005",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "1558-6",
              display: "Fasting glucose [Mass/volume] in Serum or Plasma",
            },
          ],
          text: "Fasting Glucose",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-12-15T08:20:00-06:00",
        valueQuantity: {
          value: 126,
          unit: "mg/dL",
          system: "http://unitsofmeasure.org",
          code: "mg/dL",
        },
        referenceRange: [
          {
            low: { value: 70, unit: "mg/dL" },
            high: { value: 99, unit: "mg/dL" },
            text: "Normal: 70-99 mg/dL, Pre-diabetes: 100-125, Diabetes: >= 126",
          },
        ],
        interpretation: [
          {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "H", display: "High" }],
          },
        ],
      },
    },

    // Glucose #2 — Even higher
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-lab-006",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "1558-6",
              display: "Fasting glucose [Mass/volume] in Serum or Plasma",
            },
          ],
          text: "Fasting Glucose",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2026-01-10T11:35:00-06:00",
        valueQuantity: {
          value: 142,
          unit: "mg/dL",
          system: "http://unitsofmeasure.org",
          code: "mg/dL",
        },
        referenceRange: [
          {
            low: { value: 70, unit: "mg/dL" },
            high: { value: 99, unit: "mg/dL" },
            text: "Normal: 70-99 mg/dL",
          },
        ],
        interpretation: [
          {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "HH", display: "Critical High" }],
          },
        ],
      },
    },

    // ================= LIPID PANEL (POSITIVE STATIN STORY) =================

    // Total Cholesterol — Before statin
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-lab-007",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "2093-3",
              display: "Cholesterol [Mass/volume] in Serum or Plasma",
            },
          ],
          text: "Total Cholesterol",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-06-20T10:35:00-05:00",
        valueQuantity: {
          value: 245,
          unit: "mg/dL",
          system: "http://unitsofmeasure.org",
          code: "mg/dL",
        },
        referenceRange: [
          {
            high: { value: 200, unit: "mg/dL" },
            text: "Desirable: < 200, Borderline: 200-239, High: >= 240",
          },
        ],
        interpretation: [
          {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "H", display: "High" }],
          },
        ],
      },
    },

    // Total Cholesterol — After statin (improved!)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-lab-008",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "2093-3",
              display: "Cholesterol [Mass/volume] in Serum or Plasma",
            },
          ],
          text: "Total Cholesterol",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-12-15T08:25:00-06:00",
        valueQuantity: {
          value: 210,
          unit: "mg/dL",
          system: "http://unitsofmeasure.org",
          code: "mg/dL",
        },
        referenceRange: [
          {
            high: { value: 200, unit: "mg/dL" },
            text: "Desirable: < 200, Borderline: 200-239, High: >= 240",
          },
        ],
        interpretation: [
          {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "H", display: "High" }],
          },
        ],
      },
    },

    // LDL — Before statin
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-lab-009",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "2089-1",
              display: "Cholesterol in LDL [Mass/volume] in Serum or Plasma",
            },
          ],
          text: "LDL Cholesterol",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-06-20T10:35:00-05:00",
        valueQuantity: {
          value: 165,
          unit: "mg/dL",
          system: "http://unitsofmeasure.org",
          code: "mg/dL",
        },
        referenceRange: [
          {
            high: { value: 100, unit: "mg/dL" },
            text: "Optimal: < 100, Near optimal: 100-129, Borderline: 130-159, High: >= 160",
          },
        ],
        interpretation: [
          {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "H", display: "High" }],
          },
        ],
      },
    },

    // LDL — After statin (improved!)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-lab-010",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "2089-1",
              display: "Cholesterol in LDL [Mass/volume] in Serum or Plasma",
            },
          ],
          text: "LDL Cholesterol",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-12-15T08:25:00-06:00",
        valueQuantity: {
          value: 130,
          unit: "mg/dL",
          system: "http://unitsofmeasure.org",
          code: "mg/dL",
        },
        referenceRange: [
          {
            high: { value: 100, unit: "mg/dL" },
            text: "Optimal: < 100, Near optimal: 100-129, Borderline: 130-159",
          },
        ],
        interpretation: [
          {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "H", display: "High" }],
          },
        ],
      },
    },

    // HDL — Low (risk factor)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-lab-011",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "2085-9",
              display: "Cholesterol in HDL [Mass/volume] in Serum or Plasma",
            },
          ],
          text: "HDL Cholesterol",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-12-15T08:25:00-06:00",
        valueQuantity: {
          value: 38,
          unit: "mg/dL",
          system: "http://unitsofmeasure.org",
          code: "mg/dL",
        },
        referenceRange: [
          {
            low: { value: 50, unit: "mg/dL" },
            text: "Desirable: >= 60 (protective), Low: < 40 (risk factor)",
          },
        ],
        interpretation: [
          {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "L", display: "Low" }],
          },
        ],
      },
    },

    // ================= INR (WARFARIN MONITORING — DANGER STORY) =================

    // INR #1 — Therapeutic
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-lab-012",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "6301-6",
              display: "INR in Platelet poor plasma by Coagulation assay",
            },
          ],
          text: "INR",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-12-15T08:35:00-06:00",
        valueQuantity: {
          value: 2.8,
          unit: "INR",
          system: "http://unitsofmeasure.org",
          code: "{INR}",
        },
        referenceRange: [
          {
            low: { value: 2.0 },
            high: { value: 3.0 },
            text: "Therapeutic range for A-fib: 2.0 - 3.0",
          },
        ],
        interpretation: [
          {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "N", display: "Normal" }],
          },
        ],
      },
    },

    // INR #2 — TOO HIGH (danger!)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-lab-013",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "6301-6",
              display: "INR in Platelet poor plasma by Coagulation assay",
            },
          ],
          text: "INR",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2026-01-10T11:40:00-06:00",
        valueQuantity: {
          value: 3.5,
          unit: "INR",
          system: "http://unitsofmeasure.org",
          code: "{INR}",
        },
        referenceRange: [
          {
            low: { value: 2.0 },
            high: { value: 3.0 },
            text: "Therapeutic range for A-fib: 2.0 - 3.0",
          },
        ],
        interpretation: [
          {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "H", display: "High" }],
          },
        ],
      },
    },

    // ================= KIDNEY & THYROID & VITAMIN D (NEW FINDINGS) =================

    // Creatinine — Borderline
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-lab-014",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "2160-0",
              display: "Creatinine [Mass/volume] in Serum or Plasma",
            },
          ],
          text: "Creatinine",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-12-15T08:30:00-06:00",
        valueQuantity: {
          value: 1.2,
          unit: "mg/dL",
          system: "http://unitsofmeasure.org",
          code: "mg/dL",
        },
        referenceRange: [
          {
            low: { value: 0.6, unit: "mg/dL" },
            high: { value: 1.1, unit: "mg/dL" },
            text: "Normal female: 0.6 - 1.1 mg/dL",
          },
        ],
        interpretation: [
          {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "H", display: "High" }],
          },
        ],
      },
    },

    // TSH — Mildly elevated (subclinical hypothyroidism)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-lab-015",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "3016-3",
              display: "Thyrotropin [Units/volume] in Serum or Plasma",
            },
          ],
          text: "TSH",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-12-15T08:30:00-06:00",
        valueQuantity: {
          value: 4.8,
          unit: "mIU/L",
          system: "http://unitsofmeasure.org",
          code: "m[IU]/L",
        },
        referenceRange: [
          {
            low: { value: 0.4, unit: "mIU/L" },
            high: { value: 4.0, unit: "mIU/L" },
            text: "Normal: 0.4 - 4.0 mIU/L",
          },
        ],
        interpretation: [
          {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "H", display: "High" }],
          },
        ],
      },
    },

    // Vitamin D — Low
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-lab-016",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "1989-3",
              display: "25-hydroxyvitamin D3 [Mass/volume] in Serum or Plasma",
            },
          ],
          text: "Vitamin D, 25-Hydroxy",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-12-15T08:30:00-06:00",
        valueQuantity: {
          value: 18,
          unit: "ng/mL",
          system: "http://unitsofmeasure.org",
          code: "ng/mL",
        },
        referenceRange: [
          {
            low: { value: 30, unit: "ng/mL" },
            high: { value: 100, unit: "ng/mL" },
            text: "Deficient: < 20, Insufficient: 20-29, Sufficient: 30-100",
          },
        ],
        interpretation: [
          {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "L", display: "Low" }],
          },
        ],
      },
    },

    // Potassium — Slightly low
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-lab-017",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "2823-3",
              display: "Potassium [Moles/volume] in Serum or Plasma",
            },
          ],
          text: "Potassium",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-12-15T08:30:00-06:00",
        valueQuantity: {
          value: 3.4,
          unit: "mmol/L",
          system: "http://unitsofmeasure.org",
          code: "mmol/L",
        },
        referenceRange: [
          {
            low: { value: 3.5, unit: "mmol/L" },
            high: { value: 5.0, unit: "mmol/L" },
            text: "Normal: 3.5 - 5.0 mmol/L",
          },
        ],
        interpretation: [
          {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "L", display: "Low" }],
          },
        ],
      },
    },

    // Triglycerides — Elevated
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-lab-018",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "2571-8",
              display: "Triglycerides [Mass/volume] in Serum or Plasma",
            },
          ],
          text: "Triglycerides",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-12-15T08:25:00-06:00",
        valueQuantity: {
          value: 195,
          unit: "mg/dL",
          system: "http://unitsofmeasure.org",
          code: "mg/dL",
        },
        referenceRange: [
          {
            high: { value: 150, unit: "mg/dL" },
            text: "Normal: < 150, Borderline: 150-199, High: 200-499",
          },
        ],
        interpretation: [
          {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "H", display: "High" }],
          },
        ],
      },
    },
  ],
};
