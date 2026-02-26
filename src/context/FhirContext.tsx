// -----------------------------------------------------------
// FhirContext — Shares the authenticated FHIR client app-wide
// -----------------------------------------------------------

import { createContext, useState } from "react";
import type Client from "fhirclient/lib/Client";
import type { ReactNode } from "react";

interface FhirContextType {
  client: Client | null;
  setClient: (client: Client | null) => void;
}

export const FhirContext = createContext<FhirContextType | undefined>(undefined);

interface FhirProviderProps {
  children: ReactNode;
}

const FhirProvider = ({ children }: FhirProviderProps) => {
  const [client, setClient] = useState<Client | null>(null);

  return (
    <FhirContext.Provider value={{ client, setClient }}>
      {children}
    </FhirContext.Provider>
  );
};

export default FhirProvider;
