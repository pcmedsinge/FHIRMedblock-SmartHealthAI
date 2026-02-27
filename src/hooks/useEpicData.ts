// -----------------------------------------------------------
// useEpicData — Fetch all clinical domains from Epic FHIR
// -----------------------------------------------------------
// Single hook that fetches all 7 clinical domains via Promise.allSettled.
// Module-level cache with 5-min TTL. Each failed domain doesn't break others.

import { useEffect, useState, useCallback, useMemo } from "react";
import { useFhirClient } from "./useFhirClient";
import type { SourceTag } from "../types/source";
import type { Medication } from "../types/medication";
import type { LabResult } from "../types/labResult";
import type { Vital } from "../types/vital";
import type { Allergy } from "../types/allergy";
import type { Condition } from "../types/condition";
import type { Immunization } from "../types/immunization";
import type { Encounter } from "../types/encounter";
import { parseMedicationBundle } from "../utils/medicationParser";
import { parseLabResultBundle } from "../utils/labResultParser";
import { parseVitalBundle } from "../utils/vitalParser";
import { parseAllergyBundle } from "../utils/allergyParser";
import { parseConditionBundle } from "../utils/conditionParser";
import { parseImmunizationBundle } from "../utils/immunizationParser";
import { parseEncounterBundle } from "../utils/encounterParser";

// -----------------------------------------------------------
// Module-level cache — survives React unmount/remount
// -----------------------------------------------------------
interface EpicDataCache {
  medications: Medication[];
  labResults: LabResult[];
  vitals: Vital[];
  allergies: Allergy[];
  conditions: Condition[];
  immunizations: Immunization[];
  encounters: Encounter[];
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cache: EpicDataCache | null = null;

function isCacheValid(): boolean {
  return cache !== null && (Date.now() - cache.timestamp) < CACHE_TTL_MS;
}

// -----------------------------------------------------------
// Epic source tag
// -----------------------------------------------------------
const EPIC_SOURCE: SourceTag = {
  systemName: "Epic MyHealth",
  systemId: "epic-sandbox",
  fetchedAt: "", // Set at fetch time
};

function makeEpicSource(): SourceTag {
  return { ...EPIC_SOURCE, fetchedAt: new Date().toISOString() };
}

// -----------------------------------------------------------
// Hook return type
// -----------------------------------------------------------
export interface EpicDataResult {
  medications: Medication[];
  labResults: LabResult[];
  vitals: Vital[];
  allergies: Allergy[];
  conditions: Condition[];
  immunizations: Immunization[];
  encounters: Encounter[];
  isLoading: boolean;
  error: string | null;
  /** Per-domain fetch status */
  domainErrors: Record<string, string>;
  refetch: () => void;
}

// -----------------------------------------------------------
// Hook
// -----------------------------------------------------------
export function useEpicData(): EpicDataResult {
  const { client } = useFhirClient();
  const [data, setData] = useState<Omit<EpicDataCache, "timestamp"> | null>(
    cache ? {
      medications: cache.medications,
      labResults: cache.labResults,
      vitals: cache.vitals,
      allergies: cache.allergies,
      conditions: cache.conditions,
      immunizations: cache.immunizations,
      encounters: cache.encounters,
    } : null
  );
  const [isLoading, setIsLoading] = useState(!isCacheValid());
  const [error, setError] = useState<string | null>(null);
  const [domainErrors, setDomainErrors] = useState<Record<string, string>>({});
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (!client) {
      setError("Not authenticated. Please connect to Epic first.");
      setIsLoading(false);
      return;
    }

    if (isCacheValid() && fetchKey === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setDomainErrors({});

    const fetchAllDomains = async () => {
      const source = makeEpicSource();
      const patientId = client.patient.id;

      if (!patientId) {
        setError("No patient ID found in the FHIR client context.");
        setIsLoading(false);
        return;
      }

      // Fetch all domains in parallel — each can fail independently
      const results = await Promise.allSettled([
        client.request(`MedicationRequest?patient=${patientId}&_count=100`),
        client.request(`Observation?patient=${patientId}&category=laboratory&_count=100`),
        client.request(`Observation?patient=${patientId}&category=vital-signs&_count=100`),
        client.request(`AllergyIntolerance?patient=${patientId}&_count=100`),
        client.request(`Condition?patient=${patientId}&_count=100`),
        client.request(`Immunization?patient=${patientId}&_count=100`),
        client.request(`Encounter?patient=${patientId}&_count=100`),
      ]);

      const domainNames = [
        "medications", "labResults", "vitals", "allergies",
        "conditions", "immunizations", "encounters",
      ];

      const errors: Record<string, string> = {};
      const bundles = results.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          const errMsg = result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);
          errors[domainNames[index]] = errMsg;
          if (import.meta.env.DEV) {
            console.warn(`⚠️ Failed to fetch ${domainNames[index]}:`, errMsg);
          }
          return null;
        }
      });

      // Parse each bundle through its respective parser
      const medications = bundles[0] ? parseMedicationBundle(bundles[0], source) : [];
      const labResults = bundles[1] ? parseLabResultBundle(bundles[1], source) : [];
      const vitals = bundles[2] ? parseVitalBundle(bundles[2], source) : [];
      const allergies = bundles[3] ? parseAllergyBundle(bundles[3], source) : [];
      const conditions = bundles[4] ? parseConditionBundle(bundles[4], source) : [];
      const immunizations = bundles[5] ? parseImmunizationBundle(bundles[5], source) : [];
      const encounters = bundles[6] ? parseEncounterBundle(bundles[6], source) : [];

      // Update cache
      cache = {
        medications,
        labResults,
        vitals,
        allergies,
        conditions,
        immunizations,
        encounters,
        timestamp: Date.now(),
      };

      setData({ medications, labResults, vitals, allergies, conditions, immunizations, encounters });
      setDomainErrors(errors);

      // Only set global error if ALL domains failed
      const totalFailed = Object.keys(errors).length;
      if (totalFailed === domainNames.length) {
        setError("Failed to fetch any clinical data from Epic.");
      }

      if (import.meta.env.DEV) {
        console.log("✅ Epic data loaded:", {
          medications: medications.length,
          labResults: labResults.length,
          vitals: vitals.length,
          allergies: allergies.length,
          conditions: conditions.length,
          immunizations: immunizations.length,
          encounters: encounters.length,
          failedDomains: Object.keys(errors),
        });
      }

      setIsLoading(false);
    };

    fetchAllDomains().catch((err) => {
      console.error("Unexpected error fetching Epic data:", err);
      setError("An unexpected error occurred while fetching health data.");
      setIsLoading(false);
    });
  }, [client, fetchKey]);

  const refetch = useCallback(() => {
    cache = null;
    setFetchKey((prev) => prev + 1);
  }, []);

  // Memoize return so consumers get a stable reference
  return useMemo<EpicDataResult>(() => ({
    medications: data?.medications ?? [],
    labResults: data?.labResults ?? [],
    vitals: data?.vitals ?? [],
    allergies: data?.allergies ?? [],
    conditions: data?.conditions ?? [],
    immunizations: data?.immunizations ?? [],
    encounters: data?.encounters ?? [],
    isLoading,
    error,
    domainErrors,
    refetch,
  }), [data, isLoading, error, domainErrors, refetch]);
}
