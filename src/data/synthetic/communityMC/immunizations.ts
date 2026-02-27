// -----------------------------------------------------------
// Community Medical Center — Synthetic Immunizations
// -----------------------------------------------------------
// 5 immunizations that create overlap, gap, and dedup stories.
//
// WHAT EPIC ACTUALLY HAS (immunizations):
//   - Tdap — 2023-05-21 (only ONE immunization!)
//
// AI STORIES ENABLED (verified against real Epic data):
//   1. INFLUENZA 2025-2026 — Epic has NO flu shot
//      → "Flu shot given at CMC, not recorded at Epic"
//
//   2. SHINGRIX DOSE 1 — Incomplete series
//      → Care gap: "Shingrix dose 2 overdue"
//
//   3. TDAP — REDUNDANT BOOSTER
//      → CMC: 2024-10-15 (pharmacy visit). Epic: 2023-05-21.
//      → 17 months apart — way too soon (standard is 10 years).
//      → AI: "Tdap given at both systems within 17 months.
//         Standard interval is 10 years. CMC didn't know about
//         the Epic Tdap — this is why cross-system matters."
//
//   4. COVID-19 BOOSTER (Sep 2025) — Epic has no COVID vaccine records
//      → "COVID booster at CMC during endo visit. Not in Epic."
//
//   5. PNEUMOCOCCAL (PCV20) — Epic has no pneumococcal record
//      → "PCV20 given for cardiac patient (A-fib). Not in Epic."
// -----------------------------------------------------------

export const immunizationBundle = {
  resourceType: "Bundle" as const,
  type: "searchset" as const,
  total: 5,
  entry: [
    // -------------------------------------------------------
    // 1. Influenza 2025-2026
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "Immunization",
        id: "cmc-imm-001",
        status: "completed",
        vaccineCode: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/cvx",
              code: "197",
              display: "Influenza, high-dose, quadrivalent",
            },
          ],
          text: "Influenza Vaccine (2025-2026 Season)",
        },
        patient: { reference: "Patient/cmc-patient-001" },
        occurrenceDateTime: "2025-09-15",
        primarySource: true,
        lotNumber: "FLU-2025-7834",
        site: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v3-ActSite",
              code: "LA",
              display: "Left arm",
            },
          ],
          text: "Left arm",
        },
        performer: [
          {
            actor: {
              display: "Community Medical Center — Pharmacy",
            },
          },
        ],
        note: [
          {
            text: "Administered during endocrinology follow-up visit. Patient tolerated well.",
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 2. Shingrix Dose 1 — INCOMPLETE SERIES
    //    Dose 2 should be 2-6 months later → care gap
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "Immunization",
        id: "cmc-imm-002",
        status: "completed",
        vaccineCode: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/cvx",
              code: "187",
              display: "Zoster recombinant (Shingrix)",
            },
          ],
          text: "Shingrix (Zoster Vaccine, Recombinant) — Dose 1 of 2",
        },
        patient: { reference: "Patient/cmc-patient-001" },
        occurrenceDateTime: "2025-07-10",
        primarySource: true,
        lotNumber: "SHX-2025-4421",
        site: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v3-ActSite",
              code: "RA",
              display: "Right arm",
            },
          ],
          text: "Right arm",
        },
        protocolApplied: [
          {
            series: "Shingrix 2-dose series",
            doseNumberPositiveInt: 1,
            seriesDosesPositiveInt: 2,
          },
        ],
        note: [
          {
            text: "Dose 1 of 2-dose Shingrix series. Dose 2 due in 2-6 months (by Jan 2026). Patient advised to schedule dose 2.",
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 3. Tdap — OVERLAP with Epic
    //    CMC date: 2024-10-15 (during pharmacy flu shot season).
    //    Epic date: 2023-05-21. These are 17 months apart.
    //    AI could note: "Tdap given at CMC Oct 2024, but Epic
    //    already had one May 2023 — only 17 months apart.
    //    Standard interval is 10 years."
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "Immunization",
        id: "cmc-imm-003",
        status: "completed",
        vaccineCode: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/cvx",
              code: "115",
              display: "Tdap",
            },
          ],
          text: "Tdap (Tetanus, Diphtheria, Pertussis)",
        },
        patient: { reference: "Patient/cmc-patient-001" },
        occurrenceDateTime: "2024-10-15",
        primarySource: true,
        lotNumber: "TDAP-2024-5578",
        site: {
          text: "Left deltoid",
        },
        performer: [
          {
            actor: {
              display: "Community Medical Center — Pharmacy",
            },
          },
        ],
        note: [
          {
            text: "Tdap booster administered during pharmacy visit. Due for next booster in ~10 years (2034).",
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 4. COVID-19 Booster (2024-2025 formula)
    //    More recent than what Epic may have
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "Immunization",
        id: "cmc-imm-004",
        status: "completed",
        vaccineCode: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/cvx",
              code: "309",
              display: "SARS-COV-2 (COVID-19) vaccine, mRNA, bivalent, 2025-2026",
            },
          ],
          text: "COVID-19 Vaccine (2025-2026 Updated Booster)",
        },
        patient: { reference: "Patient/cmc-patient-001" },
        occurrenceDateTime: "2025-09-15",
        primarySource: true,
        lotNumber: "COV-2025-BA286",
        manufacturer: {
          display: "Moderna",
        },
        site: {
          text: "Left deltoid",
        },
        performer: [
          {
            actor: {
              display: "Community Medical Center — Pharmacy",
            },
          },
        ],
        note: [
          {
            text: "Updated 2025-2026 COVID-19 booster. Administered during endocrinology follow-up visit. Patient tolerated well, mild soreness reported.",
          },
        ],
      },
    },

    // -------------------------------------------------------
    // 5. Pneumococcal PCV20 — Recommended for cardiac patients
    //    Connects to A-fib diagnosis
    // -------------------------------------------------------
    {
      resource: {
        resourceType: "Immunization",
        id: "cmc-imm-005",
        status: "completed",
        vaccineCode: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/cvx",
              code: "216",
              display: "Pneumococcal conjugate PCV 20",
            },
          ],
          text: "Prevnar 20 (Pneumococcal Conjugate Vaccine, PCV20)",
        },
        patient: { reference: "Patient/cmc-patient-001" },
        occurrenceDateTime: "2025-08-20",
        primarySource: true,
        lotNumber: "PCV20-2025-5543",
        site: {
          text: "Right deltoid",
        },
        performer: [
          {
            actor: {
              display: "Community Medical Center — Endocrine Clinic",
            },
          },
        ],
        note: [
          {
            text: "PCV20 administered. Recommended given cardiac history (A-fib) and diabetes. One-dose regimen completed.",
          },
        ],
      },
    },
  ],
};
