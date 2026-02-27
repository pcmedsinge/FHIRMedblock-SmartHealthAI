// -----------------------------------------------------------
// Community Medical Center — Synthetic Encounters
// -----------------------------------------------------------
// 6 encounters that build a compelling cross-system timeline.
//
// WHAT EPIC ACTUALLY HAS (encounters):
//   - Surgery (Jun 6, 2023) — EMH Operating Room
//   - 2 Office Visits (EMC Family Medicine)
//   - Outpatient — EMC Cardiology Procedures
//   - Outpatient — EMH X-Ray Imaging
//
// AI STORIES ENABLED (verified against real Epic data):
//   1. Secret ER visit at CMC (Oct 3) → Epic PCP never knew
//   2. Epic chest pain + surgery → CMC A-fib diagnosis (connected!)
//   3. COMBINED TIMELINE: Epic surgery Jun 2023 → CMC cardiology
//      consult Jun 2025 → ER visit Oct 2025 → ongoing follow-ups
//   4. ER visit triggered by BP spike → correlates with vitals
// -----------------------------------------------------------

export const encounterBundle = {
  resourceType: "Bundle" as const,
  type: "searchset" as const,
  total: 6,
  entry: [
    // -------------------------------------------------------
    // 1. Cardiology Initial Consult — 2025-06-15
    //    Story: Referred for chest pains and palpitations.
    //    This visit triggers the A-fib diagnosis and warfarin start.
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "Encounter",
        id: "cmc-enc-001",
        status: "finished",
        class: {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "AMB",
          display: "ambulatory",
        },
        type: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "11429006",
                display: "Consultation",
              },
            ],
            text: "Cardiology Consultation",
          },
        ],
        subject: { reference: "Patient/cmc-patient-001" },
        participant: [
          {
            individual: {
              reference: "Practitioner/cmc-pract-001",
              display: "Dr. Sarah Chen, MD — Cardiology",
            },
          },
        ],
        period: {
          start: "2025-06-15T09:00:00-05:00",
          end: "2025-06-15T10:15:00-05:00",
        },
        reasonCode: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "29857009",
                display: "Chest pain",
              },
            ],
            text: "Chest pain and palpitations — referral from PCP",
          },
        ],
        location: [
          {
            location: {
              display: "Community Medical Center — Cardiology Clinic",
            },
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 2. Endocrinology Follow-up — 2025-08-20
    //    Story: Diabetes management. Epic PCP co-manages but
    //    Community MC endocrinologist adjusts Metformin dose higher.
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "Encounter",
        id: "cmc-enc-002",
        status: "finished",
        class: {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "AMB",
          display: "ambulatory",
        },
        type: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "390906007",
                display: "Follow-up encounter",
              },
            ],
            text: "Endocrinology Follow-up",
          },
        ],
        subject: { reference: "Patient/cmc-patient-001" },
        participant: [
          {
            individual: {
              reference: "Practitioner/cmc-pract-002",
              display: "Dr. James Park, MD — Endocrinology",
            },
          },
        ],
        period: {
          start: "2025-08-20T14:00:00-05:00",
          end: "2025-08-20T14:45:00-05:00",
        },
        reasonCode: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "44054006",
                display: "Type 2 diabetes mellitus",
              },
            ],
            text: "Diabetes management — A1c trending upward",
          },
        ],
        location: [
          {
            location: {
              display: "Community Medical Center — Endocrine Clinic",
            },
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 3. ER Visit — 2025-10-03  *** THE SECRET ER VISIT ***
    //    Story: Severe migraine + dangerously high BP (172/102).
    //    PCP at Epic has NO IDEA this happened.
    //    AI: "You had an ER visit on Oct 3 that your PCP may not know about"
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "Encounter",
        id: "cmc-enc-003",
        status: "finished",
        class: {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "EMER",
          display: "emergency",
        },
        type: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "4525004",
                display: "Emergency department patient visit",
              },
            ],
            text: "Emergency Department Visit",
          },
        ],
        subject: { reference: "Patient/cmc-patient-001" },
        participant: [
          {
            individual: {
              reference: "Practitioner/cmc-pract-003",
              display: "Dr. Mike Rivera, MD — Emergency Medicine",
            },
          },
        ],
        period: {
          start: "2025-10-03T22:15:00-05:00",
          end: "2025-10-04T03:45:00-05:00",
        },
        reasonCode: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "37796009",
                display: "Migraine",
              },
            ],
            text: "Severe migraine with hypertensive urgency (BP 172/102)",
          },
        ],
        location: [
          {
            location: {
              display: "Community Medical Center — Emergency Department",
            },
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 4. Cardiology Follow-up — 2025-11-01
    //    Story: Post-ER cardiac follow-up. Cardiologist reviews
    //    the BP spike and adjusts medications.
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "Encounter",
        id: "cmc-enc-004",
        status: "finished",
        class: {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "AMB",
          display: "ambulatory",
        },
        type: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "390906007",
                display: "Follow-up encounter",
              },
            ],
            text: "Cardiology Follow-up",
          },
        ],
        subject: { reference: "Patient/cmc-patient-001" },
        participant: [
          {
            individual: {
              reference: "Practitioner/cmc-pract-001",
              display: "Dr. Sarah Chen, MD — Cardiology",
            },
          },
        ],
        period: {
          start: "2025-11-01T10:00:00-05:00",
          end: "2025-11-01T10:40:00-05:00",
        },
        reasonCode: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "390906007",
                display: "Follow-up encounter",
              },
            ],
            text: "Post-ER cardiac follow-up — reviewing BP spike and medication adjustments",
          },
        ],
        location: [
          {
            location: {
              display: "Community Medical Center — Cardiology Clinic",
            },
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 5. Lab-Only Visit — 2025-12-15
    //    Story: Routine labs drawn at Community MC's outpatient lab.
    //    Results only at Community MC — Epic doesn't have these.
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "Encounter",
        id: "cmc-enc-005",
        status: "finished",
        class: {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "AMB",
          display: "ambulatory",
        },
        type: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "185349003",
                display: "Encounter for check up",
              },
            ],
            text: "Outpatient Lab Visit",
          },
        ],
        subject: { reference: "Patient/cmc-patient-001" },
        period: {
          start: "2025-12-15T08:00:00-06:00",
          end: "2025-12-15T08:30:00-06:00",
        },
        reasonCode: [
          {
            text: "Routine bloodwork — A1c, lipid panel, metabolic panel, TSH, Vitamin D",
          },
        ],
        location: [
          {
            location: {
              display: "Community Medical Center — Outpatient Laboratory",
            },
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 6. Endocrinology Follow-up — 2026-01-10
    //    Story: A1c recheck shows continued rise. Endo concerned.
    //    This is the MOST RECENT encounter.
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "Encounter",
        id: "cmc-enc-006",
        status: "finished",
        class: {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "AMB",
          display: "ambulatory",
        },
        type: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "390906007",
                display: "Follow-up encounter",
              },
            ],
            text: "Endocrinology Follow-up",
          },
        ],
        subject: { reference: "Patient/cmc-patient-001" },
        participant: [
          {
            individual: {
              reference: "Practitioner/cmc-pract-002",
              display: "Dr. James Park, MD — Endocrinology",
            },
          },
        ],
        period: {
          start: "2026-01-10T11:00:00-06:00",
          end: "2026-01-10T11:45:00-06:00",
        },
        reasonCode: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "44054006",
                display: "Type 2 diabetes mellitus",
              },
            ],
            text: "Diabetes follow-up — A1c recheck, rising trend concerning",
          },
        ],
        location: [
          {
            location: {
              display: "Community Medical Center — Endocrine Clinic",
            },
          },
        ],
      },
    },
  ],
};
