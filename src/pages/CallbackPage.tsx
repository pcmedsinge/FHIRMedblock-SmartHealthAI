// -----------------------------------------------------------
// CallbackPage — Handles OAuth2 callback from Epic
// -----------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import FHIR from "fhirclient";
import type Client from "fhirclient/lib/Client";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorDisplay from "../components/ui/ErrorDisplay";

interface CallbackPageProps {
  onAuthenticated: (client: Client) => void;
}

const CallbackPage = ({ onAuthenticated }: CallbackPageProps) => {
  const [error, setError] = useState<string | null>(null);
  const authStarted = useRef(false);

  useEffect(() => {
    if (authStarted.current) return;
    authStarted.current = true;

    const completeAuth = async () => {
      try {
        const client = await FHIR.oauth2.ready();
        onAuthenticated(client);
      } catch (err) {
        console.error("OAuth callback failed:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Authentication failed. Please try again."
        );
      }
    };

    completeAuth();
  }, [onAuthenticated]);

  if (error) {
    return (
      <ErrorDisplay
        title="Connection Failed"
        message={error}
        buttonText="Try Again"
      />
    );
  }

  return <LoadingSpinner message="Completing secure connection to Epic..." />;
};

export default CallbackPage;
