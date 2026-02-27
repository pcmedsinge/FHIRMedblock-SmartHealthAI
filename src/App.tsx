// -----------------------------------------------------------
// App.tsx — Root component with routing & auth
// -----------------------------------------------------------

import { useCallback, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type Client from "fhirclient/lib/Client";
import FhirProvider from "./context/FhirContext";
import { ToastProvider } from "./context/ToastContext";
import { useFhirClient } from "./hooks/useFhirClient";
import ToastContainer from "./components/ui/Toast";
import ErrorBoundary from "./components/ui/ErrorBoundary";

// Layout
import AppShell from "./components/layout/AppShell";

// Pages — eagerly loaded (small, always needed)
import LaunchPage from "./pages/LaunchPage";
import CallbackPage from "./pages/CallbackPage";
import NotFoundPage from "./pages/NotFoundPage";

// Pages — lazy loaded (heavy, loaded on demand)
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const MedicationsPage = lazy(() => import("./pages/MedicationsPage"));
const LabsTrendsPage = lazy(() => import("./pages/LabsTrendsPage"));
const PreVisitPage = lazy(() => import("./pages/PreVisitPage"));

// -----------------------------------------------------------
// Lazy-load fallback (lightweight skeleton for page transitions)
// -----------------------------------------------------------
const PageFallback = () => (
  <div className="h-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      <p className="text-sm text-slate-400">Loading…</p>
    </div>
  </div>
);

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
          If not authenticated, redirect to root for re-auth.
          Lazy-loaded pages wrapped in Suspense for code splitting. */}
      <Route element={client ? <AppShell /> : <Navigate to="/" replace />}>
        <Route path="/dashboard" element={<Suspense fallback={<PageFallback />}><ErrorBoundary context="Dashboard"><DashboardPage /></ErrorBoundary></Suspense>} />
        <Route path="/medications" element={<Suspense fallback={<PageFallback />}><ErrorBoundary context="Medications"><MedicationsPage /></ErrorBoundary></Suspense>} />
        <Route path="/labs" element={<Suspense fallback={<PageFallback />}><ErrorBoundary context="Labs & Trends"><LabsTrendsPage /></ErrorBoundary></Suspense>} />
        <Route path="/pre-visit" element={<Suspense fallback={<PageFallback />}><ErrorBoundary context="Pre-Visit Report"><PreVisitPage /></ErrorBoundary></Suspense>} />
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
      <ErrorBoundary context="Application">
      <FhirProvider>
        <ToastProvider>
          <AppRoutes />
          <ToastContainer />
        </ToastProvider>
      </FhirProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;
