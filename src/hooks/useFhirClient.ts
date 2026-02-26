// -----------------------------------------------------------
// useFhirClient — Access the authenticated FHIR client
// -----------------------------------------------------------

import { useContext } from "react";
import { FhirContext } from "../context/FhirContext";

export const useFhirClient = () => {
  const context = useContext(FhirContext);
  if (!context) {
    throw new Error(
      "useFhirClient must be used within a <FhirProvider>. " +
      "Make sure your component is wrapped in <FhirProvider> in App.tsx."
    );
  }
  return context;
};
