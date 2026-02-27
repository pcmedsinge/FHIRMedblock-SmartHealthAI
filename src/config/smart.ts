// -----------------------------------------------------------
// SMART on FHIR Configuration
// -----------------------------------------------------------
// Centralized Epic / SMART on FHIR settings.
// Override via .env.local:
//   VITE_FHIR_CLIENT_ID=your-client-id
//   VITE_FHIR_ISS=https://your-fhir-server/...
//   VITE_FHIR_REDIRECT_URI=http://localhost:3000
// -----------------------------------------------------------

export const smartConfig = {
  clientId: import.meta.env.VITE_FHIR_CLIENT_ID || "0e79595c-d549-4189-8c85-4916e64e5f1f",

  scope: [
    "openid",
    "fhirUser",
    "launch/patient",
    "patient/Patient.read",
    "patient/MedicationRequest.read",
    "patient/Observation.read",
    "patient/AllergyIntolerance.read",
    "patient/Condition.read",
    "patient/Immunization.read",
    "patient/Encounter.read",
  ].join(" "),

  redirectUri: import.meta.env.VITE_FHIR_REDIRECT_URI || "http://localhost:3000",

  iss: import.meta.env.VITE_FHIR_ISS || "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4",
};
