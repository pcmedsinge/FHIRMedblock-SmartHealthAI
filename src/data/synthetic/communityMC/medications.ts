// -----------------------------------------------------------
// Community Medical Center — Synthetic Medications
// -----------------------------------------------------------
// 6 medications that create rich cross-system AI insights against
// ACTUAL Epic sandbox data for Camila Lopez.
//
// WHAT EPIC ACTUALLY HAS:
//   - 1 med: drospirenone-ethinyl estradiol (birth control for PCOS)
//   - NO antihypertensives (despite 90 elevated BP readings!)
//   - NO metformin (A1C was normal 5.1 in 2019)
//   - NO statins
//
// AI STORIES ENABLED (verified against real Epic data):
//   1. Warfarin → anticoagulant for A-fib (CMC-only). Epic has NO idea
//      she's on a blood thinner. If Epic prescribes NSAIDs → DANGER
//   2. Metformin 1000mg → NEW T2DM management at CMC. Epic's A1C was
//      normal (5.1) in 2019 but CMC found A1C 6.5→7.5. Diabetes is new.
//   3. Amlodipine → Epic has 90 BP readings (avg ~142/79, Stage 1-2 HTN)
//      but ZERO antihypertensive ordered! CMC started Amlodipine.
//   4. Atorvastatin → CMC-only cholesterol management. Epic has no record
//   5. Sumatriptan → ER-prescribed for migraines. Epic PCP doesn't know
//   6. Prednisone → raises blood sugar (she's now diabetic!), causes
//      weight gain, AND may reduce efficacy of Epic's drospirenone
//
// INTERACTION MAP (cross-system):
//   Warfarin + any NSAID = bleeding risk (Epic might prescribe)
//   Prednisone + Metformin = glucose antagonism (CMC internal)
//   Prednisone + drospirenone (Epic) = reduced contraceptive efficacy
//   Prednisone + diabetes = steroid-induced hyperglycemia
//   Sumatriptan + certain SSRIs = serotonin syndrome risk
// -----------------------------------------------------------

export const medicationBundle = {
  resourceType: "Bundle" as const,
  type: "searchset" as const,
  total: 6,
  entry: [
    // -------------------------------------------------------
    // 1. Warfarin 5mg — THE BIG INTERACTION DRUG
    //    Prescribed by cardiologist for atrial fibrillation.
    //    Interacts with NSAIDs, aspirin, certain antibiotics.
    //    AI: "Warfarin interacts with [X] prescribed at Epic"
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "MedicationRequest",
        id: "cmc-med-001",
        status: "active",
        intent: "order",
        medicationCodeableConcept: {
          coding: [
            {
              system: "http://www.nlm.nih.gov/research/umls/rxnorm",
              code: "855332",
              display: "Warfarin Sodium 5 MG Oral Tablet",
            },
          ],
          text: "Warfarin 5mg tablet",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        encounter: { reference: "Encounter/cmc-enc-001" },
        authoredOn: "2025-06-15",
        requester: {
          reference: "Practitioner/cmc-pract-001",
          display: "Dr. Sarah Chen, MD — Cardiology",
        },
        dosageInstruction: [
          {
            text: "Take 1 tablet by mouth once daily in the evening",
            timing: {
              repeat: {
                frequency: 1,
                period: 1,
                periodUnit: "d",
              },
              code: { text: "Once daily in the evening" },
            },
            doseAndRate: [
              {
                doseQuantity: {
                  value: 5,
                  unit: "mg",
                  system: "http://unitsofmeasure.org",
                  code: "mg",
                },
              },
            ],
          },
        ],
        reasonCode: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "49436004",
                display: "Atrial fibrillation",
              },
            ],
            text: "Atrial fibrillation — anticoagulation therapy",
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 2. Metformin 1000mg — NEW T2DM (Epic A1C was normal!)
    //    Epic had A1C of 5.1 (normal) in May 2019.
    //    CMC discovered diabetes in 2025 (A1C 6.5→7.5).
    //    AI: "A1C was normal at Epic in 2019. Now at 7.5 and on
    //          Metformin — diabetes developed between systems."
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "MedicationRequest",
        id: "cmc-med-002",
        status: "active",
        intent: "order",
        medicationCodeableConcept: {
          coding: [
            {
              system: "http://www.nlm.nih.gov/research/umls/rxnorm",
              code: "861007",
              display: "Metformin Hydrochloride 1000 MG Oral Tablet",
            },
          ],
          text: "Metformin 1000mg tablet",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        encounter: { reference: "Encounter/cmc-enc-002" },
        authoredOn: "2025-08-20",
        requester: {
          reference: "Practitioner/cmc-pract-002",
          display: "Dr. James Park, MD — Endocrinology",
        },
        dosageInstruction: [
          {
            text: "Take 1 tablet by mouth twice daily with meals",
            timing: {
              repeat: {
                frequency: 2,
                period: 1,
                periodUnit: "d",
              },
              code: { text: "Twice daily with meals" },
            },
            doseAndRate: [
              {
                doseQuantity: {
                  value: 1000,
                  unit: "mg",
                  system: "http://unitsofmeasure.org",
                  code: "mg",
                },
              },
            ],
          },
        ],
        reasonCode: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "44054006",
                display: "Type 2 diabetes mellitus",
              },
            ],
            text: "Type 2 diabetes — dose increase due to rising A1c",
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 3. Amlodipine 10mg — FILLING EPIC'S TREATMENT GAP
    //    Epic has 90 elevated BP readings (Nov 2020–Feb 2021)
    //    averaging ~142/79 (Stage 1-2 HTN) but prescribed ZERO
    //    antihypertensives! CMC cardiologist started Amlodipine.
    //    AI: "Epic shows 90 high BP readings with no treatment.
    //          Amlodipine started at CMC — is anyone coordinating?"
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "MedicationRequest",
        id: "cmc-med-003",
        status: "active",
        intent: "order",
        medicationCodeableConcept: {
          coding: [
            {
              system: "http://www.nlm.nih.gov/research/umls/rxnorm",
              code: "329528",
              display: "Amlodipine 10 MG Oral Tablet",
            },
          ],
          text: "Amlodipine 10mg tablet",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        encounter: { reference: "Encounter/cmc-enc-001" },
        authoredOn: "2025-06-15",
        requester: {
          reference: "Practitioner/cmc-pract-001",
          display: "Dr. Sarah Chen, MD — Cardiology",
        },
        dosageInstruction: [
          {
            text: "Take 1 tablet by mouth once daily",
            timing: {
              repeat: {
                frequency: 1,
                period: 1,
                periodUnit: "d",
              },
              code: { text: "Once daily" },
            },
            doseAndRate: [
              {
                doseQuantity: {
                  value: 10,
                  unit: "mg",
                  system: "http://unitsofmeasure.org",
                  code: "mg",
                },
              },
            ],
          },
        ],
        reasonCode: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "38341003",
                display: "Hypertensive disorder",
              },
            ],
            text: "Hypertension — calcium channel blocker for BP control",
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 4. Atorvastatin 40mg — HIDDEN SPECIALIST MED
    //    Cardiologist prescribed for hyperlipidemia.
    //    PCP may not know → "specialist prescribed statin"
    //    AI: "Cholesterol improved (245→210) since starting atorvastatin"
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "MedicationRequest",
        id: "cmc-med-004",
        status: "active",
        intent: "order",
        medicationCodeableConcept: {
          coding: [
            {
              system: "http://www.nlm.nih.gov/research/umls/rxnorm",
              code: "259255",
              display: "Atorvastatin 40 MG Oral Tablet",
            },
          ],
          text: "Atorvastatin 40mg tablet",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        encounter: { reference: "Encounter/cmc-enc-001" },
        authoredOn: "2025-06-20",
        requester: {
          reference: "Practitioner/cmc-pract-001",
          display: "Dr. Sarah Chen, MD — Cardiology",
        },
        dosageInstruction: [
          {
            text: "Take 1 tablet by mouth once daily at bedtime",
            timing: {
              repeat: {
                frequency: 1,
                period: 1,
                periodUnit: "d",
              },
              code: { text: "Once daily at bedtime" },
            },
            doseAndRate: [
              {
                doseQuantity: {
                  value: 40,
                  unit: "mg",
                  system: "http://unitsofmeasure.org",
                  code: "mg",
                },
              },
            ],
          },
        ],
        reasonCode: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "55822004",
                display: "Hyperlipidemia",
              },
            ],
            text: "Hyperlipidemia — high-intensity statin therapy",
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 5. Sumatriptan 50mg — ER-PRESCRIBED, PCP DOESN'T KNOW
    //    Prescribed during the secret ER visit for severe migraine.
    //    AI: "Sumatriptan started during ER visit on Oct 3 — inform your PCP"
    //    INTERACTION: Sumatriptan + SSRIs = serotonin syndrome risk
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "MedicationRequest",
        id: "cmc-med-005",
        status: "active",
        intent: "order",
        medicationCodeableConcept: {
          coding: [
            {
              system: "http://www.nlm.nih.gov/research/umls/rxnorm",
              code: "313131",
              display: "Sumatriptan 50 MG Oral Tablet",
            },
          ],
          text: "Sumatriptan 50mg tablet",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        encounter: { reference: "Encounter/cmc-enc-003" },
        authoredOn: "2025-10-03",
        requester: {
          reference: "Practitioner/cmc-pract-003",
          display: "Dr. Mike Rivera, MD — Emergency Medicine",
        },
        dosageInstruction: [
          {
            text: "Take 1 tablet at onset of migraine. May repeat once after 2 hours if needed. Max 200mg/day.",
            doseAndRate: [
              {
                doseQuantity: {
                  value: 50,
                  unit: "mg",
                  system: "http://unitsofmeasure.org",
                  code: "mg",
                },
              },
            ],
          },
        ],
        reasonCode: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "37796009",
                display: "Migraine",
              },
            ],
            text: "Severe migraine — acute treatment",
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 6. Prednisone 20mg — THE SIDE-EFFECT BOMB
    //    Prescribed at Nov 1 cardiology follow-up for pericardial
    //    inflammation. Creates MULTIPLE AI stories:
    //    - Raises blood sugar → dangerous for diabetic patient
    //    - Causes weight gain → correlates with weight gain in vitals
    //    - Can elevate BP → correlates with the ER BP spike
    //    - Interacts with warfarin (increases INR)
    //    - May reduce efficacy of Epic's drospirenone (birth control)
    //    AI: "Prednisone started Nov 1. Since then: weight +13lbs,
    //          A1c rose from 6.8 to 7.5, INR increased to 3.5"
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "MedicationRequest",
        id: "cmc-med-006",
        status: "active",
        intent: "order",
        medicationCodeableConcept: {
          coding: [
            {
              system: "http://www.nlm.nih.gov/research/umls/rxnorm",
              code: "312617",
              display: "Prednisone 20 MG Oral Tablet",
            },
          ],
          text: "Prednisone 20mg tablet",
        },
        subject: { reference: "Patient/cmc-patient-001" },
        encounter: { reference: "Encounter/cmc-enc-004" },
        authoredOn: "2025-11-01",
        requester: {
          reference: "Practitioner/cmc-pract-001",
          display: "Dr. Sarah Chen, MD — Cardiology",
        },
        dosageInstruction: [
          {
            text: "Take 20mg daily for 2 weeks, then taper: 15mg x 5 days, 10mg x 5 days, 5mg x 5 days",
            timing: {
              repeat: {
                frequency: 1,
                period: 1,
                periodUnit: "d",
              },
              code: { text: "Once daily with breakfast — tapering schedule" },
            },
            doseAndRate: [
              {
                doseQuantity: {
                  value: 20,
                  unit: "mg",
                  system: "http://unitsofmeasure.org",
                  code: "mg",
                },
              },
            ],
          },
        ],
        reasonCode: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "128139000",
                display: "Inflammatory disorder",
              },
            ],
            text: "Pericardial inflammation — short course corticosteroid",
          },
        ],
      },
    },
  ],
};
