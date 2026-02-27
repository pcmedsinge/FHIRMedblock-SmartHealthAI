// -----------------------------------------------------------
// Community Medical Center — Synthetic Allergies
// -----------------------------------------------------------
// 3 allergies — THE #1 patient safety demo in the entire app.
//
// WHAT EPIC ACTUALLY HAS (allergies):
//   - "Not on File" — LITERALLY ZERO allergies recorded!
//
// This is the most powerful cross-system story:
// CMC has 3 known allergies (including ANAPHYLAXIS).
// Epic says "no allergies". If Epic prescribes penicillin → death risk.
//
// AI STORIES ENABLED (verified against real Epic data):
//   1. PENICILLIN ALLERGY (anaphylaxis!) — Epic has NO allergies on file!
//      → "🔴 CRITICAL SAFETY GAP: Community MC records severe penicillin
//         allergy (anaphylaxis), but Epic shows 'Not on File'.
//         If Epic prescribes amoxicillin without checking, patient is at
//         risk of fatal allergic reaction."
//      → This is the SINGLE BEST demo of why cross-system data matters.
//
//   2. SULFA DRUG ALLERGY → Not in Epic (Epic has NO allergies at all)
//      → "Sulfa allergy at CMC, invisible to Epic. Bactrim could be
//         prescribed without knowing."
//
//   3. IBUPROFEN INTOLERANCE → She's on warfarin (CMC)!
//      → "Triple concern: Ibuprofen intolerance + warfarin (bleeding
//         risk with NSAIDs) + GI upset history. Epic could prescribe
//         ibuprofen thinking she has no contraindications."
// -----------------------------------------------------------

export const allergyBundle = {
  resourceType: "Bundle" as const,
  type: "searchset" as const,
  total: 3,
  entry: [
    // -------------------------------------------------------
    // 1. PENICILLIN — SEVERE (Anaphylaxis!)
    //    THE most important safety data point in the demo.
    //    If Epic has amoxicillin prescribed → instant AI alert.
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "AllergyIntolerance",
        id: "cmc-allergy-001",
        clinicalStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
              code: "active",
              display: "Active",
            },
          ],
        },
        verificationStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
              code: "confirmed",
              display: "Confirmed",
            },
          ],
        },
        type: "allergy",
        category: ["medication"],
        criticality: "high",
        code: {
          coding: [
            {
              system: "http://www.nlm.nih.gov/research/umls/rxnorm",
              code: "7980",
              display: "Penicillin",
            },
            {
              system: "http://snomed.info/sct",
              code: "91936005",
              display: "Allergy to penicillin",
            },
          ],
          text: "Penicillin",
        },
        patient: { reference: "Patient/cmc-patient-001" },
        recordedDate: "2025-06-15",
        recorder: {
          reference: "Practitioner/cmc-pract-001",
          display: "Dr. Sarah Chen, MD — Cardiology",
        },
        reaction: [
          {
            substance: {
              coding: [
                {
                  system: "http://www.nlm.nih.gov/research/umls/rxnorm",
                  code: "7980",
                  display: "Penicillin",
                },
              ],
              text: "Penicillin",
            },
            manifestation: [
              {
                coding: [
                  {
                    system: "http://snomed.info/sct",
                    code: "39579001",
                    display: "Anaphylaxis",
                  },
                ],
                text: "Anaphylaxis",
              },
              {
                coding: [
                  {
                    system: "http://snomed.info/sct",
                    code: "271807003",
                    display: "Skin rash",
                  },
                ],
                text: "Rash",
              },
              {
                text: "Throat swelling",
              },
            ],
            severity: "severe",
            description: "Patient reports severe anaphylactic reaction to penicillin at age 15. Required epinephrine and hospitalization. Confirmed by allergist testing.",
          },
        ],
        note: [
          {
            text: "VERIFIED: Confirmed penicillin allergy with anaphylaxis history. Avoid ALL penicillin-class antibiotics including amoxicillin, ampicillin, and piperacillin.",
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 2. SULFA DRUGS — Moderate (Rash)
    //    Not in Epic → gap in PCP's knowledge
    //    Important for prescribing decisions (e.g., Bactrim)
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "AllergyIntolerance",
        id: "cmc-allergy-002",
        clinicalStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
              code: "active",
              display: "Active",
            },
          ],
        },
        verificationStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
              code: "confirmed",
              display: "Confirmed",
            },
          ],
        },
        type: "allergy",
        category: ["medication"],
        criticality: "low",
        code: {
          coding: [
            {
              system: "http://www.nlm.nih.gov/research/umls/rxnorm",
              code: "10831",
              display: "Sulfamethoxazole",
            },
            {
              system: "http://snomed.info/sct",
              code: "294499007",
              display: "Allergy to sulfonamide",
            },
          ],
          text: "Sulfa Drugs (Sulfonamides)",
        },
        patient: { reference: "Patient/cmc-patient-001" },
        recordedDate: "2025-06-15",
        recorder: {
          reference: "Practitioner/cmc-pract-001",
          display: "Dr. Sarah Chen, MD — Cardiology",
        },
        reaction: [
          {
            manifestation: [
              {
                coding: [
                  {
                    system: "http://snomed.info/sct",
                    code: "271807003",
                    display: "Skin rash",
                  },
                ],
                text: "Diffuse skin rash",
              },
              {
                text: "Itching",
              },
            ],
            severity: "moderate",
            description: "Developed diffuse rash with itching after taking Bactrim (sulfamethoxazole/trimethoprim) for UTI in 2019.",
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 3. IBUPROFEN — Intolerance (GI upset)
    //    Combined with warfarin = major safety story:
    //    NSAIDs + anticoagulants = GI bleeding risk
    //    Plus she already has GI intolerance to NSAIDs
    //    AI: "Avoid NSAIDs — documented intolerance + warfarin interaction"
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "AllergyIntolerance",
        id: "cmc-allergy-003",
        clinicalStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
              code: "active",
              display: "Active",
            },
          ],
        },
        verificationStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
              code: "confirmed",
              display: "Confirmed",
            },
          ],
        },
        type: "intolerance",
        category: ["medication"],
        criticality: "low",
        code: {
          coding: [
            {
              system: "http://www.nlm.nih.gov/research/umls/rxnorm",
              code: "5640",
              display: "Ibuprofen",
            },
            {
              system: "http://snomed.info/sct",
              code: "293619005",
              display: "Allergy to ibuprofen",
            },
          ],
          text: "Ibuprofen (NSAID intolerance)",
        },
        patient: { reference: "Patient/cmc-patient-001" },
        recordedDate: "2025-10-03",
        recorder: {
          reference: "Practitioner/cmc-pract-003",
          display: "Dr. Mike Rivera, MD — Emergency Medicine",
        },
        reaction: [
          {
            manifestation: [
              {
                coding: [
                  {
                    system: "http://snomed.info/sct",
                    code: "271681002",
                    display: "Stomach ache",
                  },
                ],
                text: "Severe stomach pain",
              },
              {
                text: "Nausea",
              },
              {
                text: "GI bleeding episode",
              },
            ],
            severity: "moderate",
            description: "Patient reports GI upset and one episode of GI bleeding while taking ibuprofen. Particularly dangerous given warfarin use — documented during ER visit.",
          },
        ],
        note: [
          {
            text: "Documented during ER visit. Patient is on warfarin for A-fib. NSAIDs are contraindicated due to: (1) documented GI intolerance, (2) increased bleeding risk with warfarin, (3) history of GI bleeding episode.",
          },
        ],
      },
    },
  ],
};
