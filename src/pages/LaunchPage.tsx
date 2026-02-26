// -----------------------------------------------------------
// LaunchPage — "Connect to Epic" login screen
// -----------------------------------------------------------

import { useState } from "react";
import FHIR from "fhirclient";
import { smartConfig } from "../config/smart";

const LaunchPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLaunch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await FHIR.oauth2.authorize({
        clientId: smartConfig.clientId,
        scope: smartConfig.scope,
        redirectUri: smartConfig.redirectUri,
        iss: smartConfig.iss,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to Epic");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            SmartHealth AI
          </h1>
          <p className="mt-2 text-gray-600">
            Multi-source health intelligence powered by AI
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleLaunch}
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
        >
          {isLoading ? "Connecting..." : "Connect to Epic"}
        </button>

        <p className="text-center text-sm text-gray-500">
          You will be redirected to Epic's secure login page
        </p>
      </div>
    </div>
  );
};

export default LaunchPage;
