// -----------------------------------------------------------
// Patient Type Definitions
// -----------------------------------------------------------

export interface PatientDemographics {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  age: number;
  mrn: string;
  phone?: string;
  address?: string;
}
