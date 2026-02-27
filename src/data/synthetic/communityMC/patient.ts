// -----------------------------------------------------------
// Community Medical Center — Synthetic Patient Identity
// -----------------------------------------------------------
// This is the SAME person as Epic's Camila Lopez, but with a
// different MRN and slightly different registration data.
// The patientMatcher will link these by name + DOB.
//
// AI STORY: Demonstrates that the same patient exists in
// multiple health systems, enabling cross-system aggregation.
// -----------------------------------------------------------

/**
 * FHIR R4 Patient resource as stored at Community Medical Center.
 * Matches Epic sandbox patient Camila Lopez.
 */
export const communityMCPatient = {
  resourceType: "Patient" as const,
  id: "cmc-patient-001",
  identifier: [
    {
      use: "usual",
      type: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v2-0203",
            code: "MR",
            display: "Medical Record Number",
          },
        ],
      },
      system: "urn:oid:2.16.840.1.113883.3.4.5",
      value: "CMC-2024-88421",
    },
  ],
  active: true,
  name: [
    {
      use: "official",
      family: "Lopez",
      given: ["Camila"],
    },
  ],
  telecom: [
    {
      system: "phone",
      value: "469-555-0142",
      use: "mobile",
    },
    {
      system: "email",
      value: "camila.lopez@email.com",
      use: "home",
    },
  ],
  gender: "female",
  birthDate: "1987-09-12",
  address: [
    {
      use: "home",
      line: ["456 Oak Avenue"],
      city: "Garland",
      state: "TX",
      postalCode: "75040",
    },
  ],
};

/**
 * Parsed demographics in our app's format, for use by patientMatcher.
 */
export const communityMCPatientDemographics = {
  id: "cmc-patient-001",
  fullName: "Camila Lopez",
  firstName: "Camila",
  lastName: "Lopez",
  gender: "female",
  birthDate: "1987-09-12",
  age: 38,
  mrn: "CMC-2024-88421",
  phone: "469-555-0142",
  address: "456 Oak Avenue, Garland, TX 75040",
};
