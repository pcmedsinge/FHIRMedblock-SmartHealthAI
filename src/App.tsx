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

// Layout
import AppShell from "./components/layout/AppShell";

// Pages
import LaunchPage from "./pages/LaunchPage";
import CallbackPage from "./pages/CallbackPage";
import DashboardPage from "./pages/DashboardPage";
import MedicationsPage from "./pages/MedicationsPage";
import LabsTrendsPage from "./pages/LabsTrendsPage";
import PreVisitPage from "./pages/PreVisitPage";
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

      {/* Authenticated routes — always registered so React Router can match them.
          If not authenticated, redirect to root for re-auth. */}
      <Route element={client ? <AppShell /> : <Navigate to="/" replace />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/medications" element={<MedicationsPage />} />
        <Route path="/labs" element={<LabsTrendsPage />} />
        <Route path="/pre-visit" element={<PreVisitPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={client ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />} />
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
