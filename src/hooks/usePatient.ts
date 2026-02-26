// -----------------------------------------------------------
// usePatient — Fetch and cache patient demographics
// -----------------------------------------------------------

import { useEffect, useState, useCallback } from "react";
import { useFhirClient } from "./useFhirClient";
import { parsePatient } from "../utils/patientParser";
import type { PatientDemographics } from "../types/patient";

// Module-level cache — survives React unmount/remount
let cachedPatient: PatientDemographics | null = null;

interface UsePatientResult {
  patient: PatientDemographics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePatient(): UsePatientResult {
  const { client } = useFhirClient();
  const [patient, setPatient] = useState<PatientDemographics | null>(cachedPatient);
  const [isLoading, setIsLoading] = useState(cachedPatient === null);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (!client) {
      setError("Not authenticated. Please connect to Epic first.");
      setIsLoading(false);
      return;
    }

    if (cachedPatient && fetchKey === 0) {
      setPatient(cachedPatient);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const fetchPatient = async () => {
      try {
        const fhirPatient = await client.patient.read();
        const parsed = parsePatient(fhirPatient);
        cachedPatient = parsed;
        setPatient(parsed);

        if (import.meta.env.DEV) {
          console.log("✅ Patient loaded:", parsed.fullName);
        }
      } catch (err) {
        console.error("Failed to fetch patient:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch patient data."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatient();
  }, [client, fetchKey]);

  const refetch = useCallback(() => {
    cachedPatient = null;
    setFetchKey((prev) => prev + 1);
  }, []);

  return { patient, isLoading, error, refetch };
}
