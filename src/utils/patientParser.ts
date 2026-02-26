// -----------------------------------------------------------
// patientParser — Converts raw FHIR Patient → PatientDemographics
// -----------------------------------------------------------

import type { PatientDemographics } from "../types/patient";

function calculateAge(birthDateString: string): number {
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function formatBirthDate(birthDateString: string): string {
  if (!birthDateString) return "Not available";
  const date = new Date(birthDateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function capitalizeFirst(text: string): string {
  if (!text) return "Unknown";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parsePatient(fhirPatient: any): PatientDemographics {
  const names = fhirPatient.name ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const officialName = names.find((n: any) => n.use === "official");
  const name = officialName ?? names[0];

  const firstName = name?.given?.[0] ?? "Unknown";
  const lastName = name?.family ?? "Unknown";
  const fullName = `${firstName} ${lastName}`.trim();

  const identifiers = fhirPatient.identifier ?? [];
  const mrnIdentifier = identifiers.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (id: any) =>
      id.type?.coding?.some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (coding: any) => coding.code === "MR"
      )
  );
  const mrn = mrnIdentifier?.value ?? "Not available";

  const telecoms = fhirPatient.telecom ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const phoneEntry = telecoms.find((t: any) => t.system === "phone");
  const phone = phoneEntry?.value;

  const addr = fhirPatient.address?.[0];
  let address: string | undefined;
  if (addr) {
    const parts = [
      addr.line?.join(", "),
      addr.city,
      addr.state,
      addr.postalCode,
    ].filter(Boolean);
    address = parts.length > 0 ? parts.join(", ") : undefined;
  }

  return {
    id: fhirPatient.id ?? "Unknown",
    fullName,
    firstName,
    lastName,
    gender: capitalizeFirst(fhirPatient.gender),
    birthDate: formatBirthDate(fhirPatient.birthDate),
    age: fhirPatient.birthDate ? calculateAge(fhirPatient.birthDate) : 0,
    mrn,
    phone,
    address,
  };
}
