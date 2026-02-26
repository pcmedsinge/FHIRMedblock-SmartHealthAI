// -----------------------------------------------------------
// App.tsx — Root component with routing & auth
// -----------------------------------------------------------

import { useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type Client from "fhirclient/lib/Client";
import FhirProvider from "./context/FhirContext";
import { ToastProvider } from "./context/ToastContext";
import { useFhirClient } from "./hooks/useFhirClient";
import ToastContainer from "./components/ui/Toast";

// Pages
import LaunchPage from "./pages/LaunchPage";
import CallbackPage from "./pages/CallbackPage";
import DashboardPage from "./pages/DashboardPage";
import NotFoundPage from "./pages/NotFoundPage";

// -----------------------------------------------------------
// AppRoutes — Routing logic based on auth state
// -----------------------------------------------------------
const AppRoutes = () => {
  const { client, setClient } = useFhirClient();

  const handleAuthenticated = useCallback(
    (fhirClient: Client) => {
      setClient(fhirClient);
    },
    [setClient]
  );

  // Check if URL has OAuth callback params
  const params = new URLSearchParams(window.location.search);
  const hasAuthCode = params.has("code") && params.has("state");

  return (
    <Routes>
      {/* Root: show launch page or redirect to dashboard if authenticated */}
      <Route
        path="/"
        element={
          hasAuthCode ? (
            <CallbackPage onAuthenticated={handleAuthenticated} />
          ) : client ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LaunchPage />
          )
        }
      />

      {/* Authenticated routes */}
      {client && (
        <Route path="/dashboard" element={<DashboardPage />} />
      )}

      {/* Catch-all */}
      <Route path="*" element={client ? <NotFoundPage /> : <Navigate to="/" replace />} />
    </Routes>
  );
};

// -----------------------------------------------------------
// App — Wraps everything in providers
// -----------------------------------------------------------
const App = () => {
  return (
    <BrowserRouter>
      <FhirProvider>
        <ToastProvider>
          <AppRoutes />
          <ToastContainer />
        </ToastProvider>
      </FhirProvider>
    </BrowserRouter>
  );
};

export default App;
