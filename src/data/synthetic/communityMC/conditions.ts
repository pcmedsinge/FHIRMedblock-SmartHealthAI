// -----------------------------------------------------------
// Community Medical Center — Synthetic Conditions
// -----------------------------------------------------------
// 5 conditions designed for cross-system awareness AI stories.
//
// WHAT EPIC ACTUALLY HAS (conditions):
//   - Polycystic ovaries (active, onset 2005) — CMC doesn't know!
//   - Ischemic chest pain x3 — led to CMC cardiology referral
//   - Stomach ache, Pain w/ ADLs — minor
//
// AI STORIES ENABLED (verified against real Epic data):
//   1. ATRIAL FIBRILLATION — diagnosed at CMC, connects to Epic's
//      "ischemic chest pain" episodes. Epic has chest pain + cardiology
//      procedures + surgery → CMC found A-fib. NEITHER system alone
//      shows the whole cardiac journey.
//   2. HYPERLIPIDEMIA — CMC-only. Epic has no lipid conditions.
//      → Links to atorvastatin and cholesterol improvement
//   3. TYPE 2 DIABETES — CMC-only! Epic A1C was 5.1 (normal) in 2019.
//      → "Diabetes developed between systems — Epic doesn't know"
//      → Links to A1c trend 6.5→7.5, metformin, prednisone danger
//   4. SUBCLINICAL HYPOTHYROIDISM — CMC-only finding (TSH 4.8)
//      → "New condition found, not yet treated"
//   5. CHRONIC MIGRAINE — diagnosed at CMC ER visit
//      → "Migraine + Epic's ischemic chest pain = complex picture"
//      → Links to sumatriptan prescription
//
//   HIDDEN FROM CMC: Epic has PCOS + drospirenone (birth control)
//   → "Patient has PCOS managed with hormonal contraceptive at Epic.
//      Drospirenone has cardiovascular risk — matters with A-fib!"
// -----------------------------------------------------------

export const conditionBundle = {
  resourceType: "Bundle" as const,
  type: "searchset" as const,
  total: 5,
  entry: [
    // -------------------------------------------------------
    // 1. Atrial Fibrillation — Cardiologist diagnosis
    //    PCP doesn't know → explains warfarin, explains palpitations
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "Condition",
        id: "cmc-cond-001",
        clinicalStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
              code: "active",
              display: "Active",
            },
          ],
        },
        verificationStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
              code: "confirmed",
              display: "Confirmed",
            },
          ],
        },
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/condition-category",
                code: "problem-list-item",
                display: "Problem List Item",
              },
            ],
          },
        ],
        severity: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "6736007",
              display: "Moderate",
            },
          ],
        },
        code: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "49436004",
              display: "Atrial fibrillation",
            },
            {
              system: "http://hl7.org/fhir/sid/icd-10-cm",
              code: "I48.91",
              display: "Unspecified atrial fibrillation",
            },
          ],
          text: "Atrial Fibrillation",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        onsetDateTime: "2025-06-15",
        recordedDate: "2025-06-15",
        recorder: {
          reference: "Practitioner/cmc-pract-001",
          display: "Dr. Sarah Chen, MD — Cardiology",
        },
        note: [
          {
            text: "Paroxysmal atrial fibrillation detected on initial cardiology consult. Started anticoagulation with warfarin. CHA2DS2-VASc score: 3.",
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 2. Hyperlipidemia — May exist at Epic too (dedup candidate)
    //    Links to atorvastatin and improving cholesterol labs
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "Condition",
        id: "cmc-cond-002",
        clinicalStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
              code: "active",
              display: "Active",
            },
          ],
        },
        verificationStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
              code: "confirmed",
              display: "Confirmed",
            },
          ],
        },
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/condition-category",
                code: "problem-list-item",
                display: "Problem List Item",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "55822004",
              display: "Hyperlipidemia",
            },
            {
              system: "http://hl7.org/fhir/sid/icd-10-cm",
              code: "E78.5",
              display: "Hyperlipidemia, unspecified",
            },
          ],
          text: "Hyperlipidemia",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        onsetDateTime: "2025-06-20",
        recordedDate: "2025-06-20",
        recorder: {
          reference: "Practitioner/cmc-pract-001",
          display: "Dr. Sarah Chen, MD — Cardiology",
        },
        note: [
          {
            text: "Total cholesterol 245, LDL 165 at diagnosis. Started atorvastatin 40mg. Combined cardiac risk factor with A-fib.",
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 3. Type 2 Diabetes Mellitus — Cross-system confirmation
    //    Same condition, links to A1c trend and metformin dose conflict
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "Condition",
        id: "cmc-cond-003",
        clinicalStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
              code: "active",
              display: "Active",
            },
          ],
        },
        verificationStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
              code: "confirmed",
              display: "Confirmed",
            },
          ],
        },
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/condition-category",
                code: "problem-list-item",
                display: "Problem List Item",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "44054006",
              display: "Type 2 diabetes mellitus",
            },
            {
              system: "http://hl7.org/fhir/sid/icd-10-cm",
              code: "E11.9",
              display: "Type 2 diabetes mellitus without complications",
            },
          ],
          text: "Type 2 Diabetes Mellitus",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        onsetDateTime: "2025-06-20",
        recordedDate: "2025-06-20",
        note: [
          {
            text: "Newly diagnosed T2DM. A1c of 6.5% found on initial labs at CMC. Epic A1C was 5.1 (normal) in 2019 — diabetes developed in the interim. Started Metformin 1000mg via endocrinology referral.",
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 4. Subclinical Hypothyroidism — NEW, only at Community MC
    //    Discovered incidentally via lab work. PCP doesn't know.
    //    AP: "TSH 4.8 — new finding not yet treated"
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "Condition",
        id: "cmc-cond-004",
        clinicalStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
              code: "active",
              display: "Active",
            },
          ],
        },
        verificationStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
              code: "provisional",
              display: "Provisional",
            },
          ],
        },
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/condition-category",
                code: "problem-list-item",
                display: "Problem List Item",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "54823002",
              display: "Subclinical hypothyroidism",
            },
            {
              system: "http://hl7.org/fhir/sid/icd-10-cm",
              code: "E02",
              display: "Subclinical iodine-deficiency hypothyroidism",
            },
          ],
          text: "Subclinical Hypothyroidism",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        onsetDateTime: "2025-12-15",
        recordedDate: "2025-12-15",
        note: [
          {
            text: "Incidental finding: TSH 4.8 mIU/L (mild elevation above 4.0 upper limit). Monitoring recommended. May contribute to weight gain and fatigue. Consider levothyroxine if TSH > 10 or symptomatic.",
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 5. Chronic Migraine — Diagnosed at ER visit
    //    PCP doesn't know about the ER visit or this diagnosis.
    //    AI: "Chronic migraine diagnosed Oct 3 at Community MC ER"
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "Condition",
        id: "cmc-cond-005",
        clinicalStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
              code: "active",
              display: "Active",
            },
          ],
        },
        verificationStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
              code: "confirmed",
              display: "Confirmed",
            },
          ],
        },
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/condition-category",
                code: "encounter-diagnosis",
                display: "Encounter Diagnosis",
              },
            ],
          },
        ],
        severity: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "24484000",
              display: "Severe",
            },
          ],
        },
        code: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "37796009",
              display: "Migraine",
            },
            {
              system: "http://hl7.org/fhir/sid/icd-10-cm",
              code: "G43.909",
              display: "Migraine, unspecified, not intractable, without status migrainosus",
            },
          ],
          text: "Chronic Migraine",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        encounter: { reference: "Encounter/cmc-enc-003" },
        onsetDateTime: "2025-10-03",
        recordedDate: "2025-10-03",
        recorder: {
          reference: "Practitioner/cmc-pract-003",
          display: "Dr. Mike Rivera, MD — Emergency Medicine",
        },
        note: [
          {
            text: "Patient reports history of recurrent severe migraines over past year, frequency increasing. This ER visit triggered by worst episode yet. Started sumatriptan for acute treatment. Recommend neurology follow-up.",
          },
        ],
      },
    },
  ],
};
