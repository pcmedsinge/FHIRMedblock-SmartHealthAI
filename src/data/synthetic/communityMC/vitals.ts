// -----------------------------------------------------------
// Community Medical Center — Synthetic Vitals
// -----------------------------------------------------------
// 17 vital sign observations designed for medication-correlation AI stories.
// Vitals are NOT displayed as standalone charts — they're AI fuel.
//
// WHAT EPIC ACTUALLY HAS (vitals):
//   - ~90 Blood Pressure readings (Nov 2020–Feb 2021)
//     Average ~142/79, consistently Stage 1-2 HTN!
//     But ZERO antihypertensive prescribed at Epic.
//   - 7 Temperature readings (some fevers: 38°C, 38.3°C)
//   - 3 Heart Rate readings (72 bpm, Feb 2026)
//   - NO weight, NO BMI, NO SpO2 at Epic
//
// AI STORIES ENABLED (verified against real Epic data):
//   1. BP CROSS-SYSTEM TIMELINE:
//      Epic (2020-2021): avg ~142/79 UNTREATED
//      CMC (2025-2026): 158/95 → 172/102(ER!) → 132/80 (on Amlodipine)
//      → "BP was already elevated at Epic years ago with no treatment.
//         CMC started Amlodipine and BP is now improving."
//
//   2. WEIGHT + PREDNISONE (CMC-only, Epic has NO weight data):
//      165 → 167 → 175 → 178 → 180 lbs
//      → "15lb weight gain since prednisone started Nov 1"
//
//   3. HEART RATE COMPARISON:
//      Epic: 72 bpm (recent, resting)
//      CMC: 88 → 102(ER!) → 78 → 74 bpm
//      → "HR spiked during ER visit, now stabilized"
//
//   4. BMI + A1c COMBINED RISK (CMC-only):
//      27.4 → 28.8 → 29.9 approaching obesity threshold
//
//   5. OXYGEN SAT (ER context): 96% borderline
// -----------------------------------------------------------

export const vitalBundle = {
  resourceType: "Bundle" as const,
  type: "searchset" as const,
  total: 17,
  entry: [
    // ================= BLOOD PRESSURE SERIES (6 readings) =================

    // BP #1 — Baseline (HIGH — before treatment)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-001",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "85354-9",
              display: "Blood pressure panel with all children optional",
            },
          ],
          text: "Blood Pressure",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-06-15T09:10:00-05:00",
        component: [
          {
            code: {
              coding: [{ system: "http://loinc.org", code: "8480-6", display: "Systolic blood pressure" }],
              text: "Systolic",
            },
            valueQuantity: { value: 158, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
          },
          {
            code: {
              coding: [{ system: "http://loinc.org", code: "8462-4", display: "Diastolic blood pressure" }],
              text: "Diastolic",
            },
            valueQuantity: { value: 95, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
          },
        ],
      },
    },

    // BP #2 — Slightly improved (amlodipine started)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-002",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "85354-9",
              display: "Blood pressure panel with all children optional",
            },
          ],
          text: "Blood Pressure",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-08-20T14:10:00-05:00",
        component: [
          {
            code: {
              coding: [{ system: "http://loinc.org", code: "8480-6", display: "Systolic blood pressure" }],
              text: "Systolic",
            },
            valueQuantity: { value: 148, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
          },
          {
            code: {
              coding: [{ system: "http://loinc.org", code: "8462-4", display: "Diastolic blood pressure" }],
              text: "Diastolic",
            },
            valueQuantity: { value: 88, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
          },
        ],
      },
    },

    // BP #3 — *** ER SPIKE *** (dangerous!)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-003",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "85354-9",
              display: "Blood pressure panel with all children optional",
            },
          ],
          text: "Blood Pressure",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-10-03T22:30:00-05:00",
        component: [
          {
            code: {
              coding: [{ system: "http://loinc.org", code: "8480-6", display: "Systolic blood pressure" }],
              text: "Systolic",
            },
            valueQuantity: { value: 172, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
          },
          {
            code: {
              coding: [{ system: "http://loinc.org", code: "8462-4", display: "Diastolic blood pressure" }],
              text: "Diastolic",
            },
            valueQuantity: { value: 102, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
          },
        ],
      },
    },

    // BP #4 — Post-ER follow-up (improving)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-004",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "85354-9",
              display: "Blood pressure panel with all children optional",
            },
          ],
          text: "Blood Pressure",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-11-01T10:10:00-05:00",
        component: [
          {
            code: {
              coding: [{ system: "http://loinc.org", code: "8480-6", display: "Systolic blood pressure" }],
              text: "Systolic",
            },
            valueQuantity: { value: 140, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
          },
          {
            code: {
              coding: [{ system: "http://loinc.org", code: "8462-4", display: "Diastolic blood pressure" }],
              text: "Diastolic",
            },
            valueQuantity: { value: 84, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
          },
        ],
      },
    },

    // BP #5 — Routine lab visit
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-005",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "85354-9",
              display: "Blood pressure panel with all children optional",
            },
          ],
          text: "Blood Pressure",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-12-15T08:05:00-06:00",
        component: [
          {
            code: {
              coding: [{ system: "http://loinc.org", code: "8480-6", display: "Systolic blood pressure" }],
              text: "Systolic",
            },
            valueQuantity: { value: 135, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
          },
          {
            code: {
              coding: [{ system: "http://loinc.org", code: "8462-4", display: "Diastolic blood pressure" }],
              text: "Diastolic",
            },
            valueQuantity: { value: 82, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
          },
        ],
      },
    },

    // BP #6 — Most recent (good control!)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-006",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "85354-9",
              display: "Blood pressure panel with all children optional",
            },
          ],
          text: "Blood Pressure",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2026-01-10T11:05:00-06:00",
        component: [
          {
            code: {
              coding: [{ system: "http://loinc.org", code: "8480-6", display: "Systolic blood pressure" }],
              text: "Systolic",
            },
            valueQuantity: { value: 132, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
          },
          {
            code: {
              coding: [{ system: "http://loinc.org", code: "8462-4", display: "Diastolic blood pressure" }],
              text: "Diastolic",
            },
            valueQuantity: { value: 80, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
          },
        ],
      },
    },

    // ================= WEIGHT SERIES (5 readings — prednisone story) =================

    // Weight #1 — Baseline
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-007",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [{ system: "http://loinc.org", code: "29463-7", display: "Body weight" }],
          text: "Body Weight",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-06-15T09:05:00-05:00",
        valueQuantity: { value: 165, unit: "lbs", system: "http://unitsofmeasure.org", code: "[lb_av]" },
      },
    },

    // Weight #2 — Stable (before prednisone)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-008",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [{ system: "http://loinc.org", code: "29463-7", display: "Body weight" }],
          text: "Body Weight",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-08-20T14:05:00-05:00",
        valueQuantity: { value: 167, unit: "lbs", system: "http://unitsofmeasure.org", code: "[lb_av]" },
      },
    },

    // Weight #3 — Gaining (prednisone started Nov 1)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-009",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [{ system: "http://loinc.org", code: "29463-7", display: "Body weight" }],
          text: "Body Weight",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-11-01T10:05:00-05:00",
        valueQuantity: { value: 175, unit: "lbs", system: "http://unitsofmeasure.org", code: "[lb_av]" },
      },
    },

    // Weight #4 — Still gaining
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-010",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [{ system: "http://loinc.org", code: "29463-7", display: "Body weight" }],
          text: "Body Weight",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-12-15T08:00:00-06:00",
        valueQuantity: { value: 178, unit: "lbs", system: "http://unitsofmeasure.org", code: "[lb_av]" },
      },
    },

    // Weight #5 — Most recent (continued gain)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-011",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [{ system: "http://loinc.org", code: "29463-7", display: "Body weight" }],
          text: "Body Weight",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2026-01-10T11:00:00-06:00",
        valueQuantity: { value: 180, unit: "lbs", system: "http://unitsofmeasure.org", code: "[lb_av]" },
      },
    },

    // ================= HEART RATE SERIES (4 readings) =================

    // HR #1 — Baseline (slightly elevated)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-012",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }],
          text: "Heart Rate",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-06-15T09:08:00-05:00",
        valueQuantity: { value: 88, unit: "beats/min", system: "http://unitsofmeasure.org", code: "/min" },
      },
    },

    // HR #2 — ER (elevated — stress/pain)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-013",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }],
          text: "Heart Rate",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-10-03T22:25:00-05:00",
        valueQuantity: { value: 102, unit: "beats/min", system: "http://unitsofmeasure.org", code: "/min" },
      },
    },

    // HR #3 — Post-ER (normalizing)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-014",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }],
          text: "Heart Rate",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-11-01T10:08:00-05:00",
        valueQuantity: { value: 78, unit: "beats/min", system: "http://unitsofmeasure.org", code: "/min" },
      },
    },

    // HR #4 — Most recent (well controlled)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-015",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }],
          text: "Heart Rate",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2026-01-10T11:03:00-06:00",
        valueQuantity: { value: 74, unit: "beats/min", system: "http://unitsofmeasure.org", code: "/min" },
      },
    },

    // ================= BMI SERIES (3 readings — metabolic risk) =================

    // BMI #1 — Overweight
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-016",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [{ system: "http://loinc.org", code: "39156-5", display: "Body mass index (BMI) [Ratio]" }],
          text: "BMI",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-06-15T09:06:00-05:00",
        valueQuantity: { value: 27.4, unit: "kg/m2", system: "http://unitsofmeasure.org", code: "kg/m2" },
      },
    },

    // BMI #2 — Rising
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-017",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [{ system: "http://loinc.org", code: "39156-5", display: "Body mass index (BMI) [Ratio]" }],
          text: "BMI",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-11-01T10:06:00-05:00",
        valueQuantity: { value: 28.8, unit: "kg/m2", system: "http://unitsofmeasure.org", code: "kg/m2" },
      },
    },

    // BMI #3 — Nearly obese (combined risk with A1c)
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-018",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [{ system: "http://loinc.org", code: "39156-5", display: "Body mass index (BMI) [Ratio]" }],
          text: "BMI",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2026-01-10T11:01:00-06:00",
        valueQuantity: { value: 29.9, unit: "kg/m2", system: "http://unitsofmeasure.org", code: "kg/m2" },
      },
    },

    // ================= OXYGEN SATURATION (ER context) =================

    // SpO2 at ER — borderline
    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-019",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [{ system: "http://loinc.org", code: "59408-5", display: "Oxygen saturation in Arterial blood by Pulse oximetry" }],
          text: "Oxygen Saturation (SpO2)",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-10-03T22:20:00-05:00",
        valueQuantity: { value: 96, unit: "%", system: "http://unitsofmeasure.org", code: "%" },
      },
    },

    // ================= BODY HEIGHT (needed for BMI context) =================

    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-020",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [{ system: "http://loinc.org", code: "8302-2", display: "Body height" }],
          text: "Body Height",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-06-15T09:04:00-05:00",
        valueQuantity: { value: 65, unit: "in", system: "http://unitsofmeasure.org", code: "[in_i]" },
      },
    },

    // ================= RESPIRATORY RATE (ER context) =================

    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-021",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [{ system: "http://loinc.org", code: "9279-1", display: "Respiratory rate" }],
          text: "Respiratory Rate",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-10-03T22:22:00-05:00",
        valueQuantity: { value: 20, unit: "breaths/min", system: "http://unitsofmeasure.org", code: "/min" },
      },
    },

    // ================= BODY TEMPERATURE (ER context) =================

    {
      resource: {
        resourceType: "Observation",
        id: "cmc-vital-022",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [{ system: "http://loinc.org", code: "8310-5", display: "Body temperature" }],
          text: "Body Temperature",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        effectiveDateTime: "2025-10-03T22:18:00-05:00",
        valueQuantity: { value: 98.9, unit: "degF", system: "http://unitsofmeasure.org", code: "[degF]" },
      },
    },
  ],
};
