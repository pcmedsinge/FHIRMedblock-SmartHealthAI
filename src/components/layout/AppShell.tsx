// -----------------------------------------------------------
// AppShell — Persistent layout wrapper (Sidebar + Header + Content)
// -----------------------------------------------------------
// Uses React Router's <Outlet> so page content renders inside
// the shell without remounting sidebar/header on navigation.
// Patient banner is now part of the content area (full-width).
// -----------------------------------------------------------

import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import PatientBanner from "../patient/PatientBanner";
import { usePatient } from "../../hooks/usePatient";

const AppShell = () => {
  const { patient } = usePatient();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Skip to content — visible only on focus (keyboard nav) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-white focus:text-emerald-700 focus:font-semibold focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-emerald-500"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header (slim) */}
        <Header />

        {/* Content area — viewport-fit, pages own their scroll behavior */}
        <main id="main-content" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Patient banner — pinned at top, never scrolls */}
          {patient && (
            <div className="shrink-0 px-6 pt-4">
              <div className="max-w-7xl mx-auto">
                <PatientBanner patient={patient} />
              </div>
            </div>
          )}

          {/* Page outlet — fills remaining height, each page manages its own overflow */}
          <div className="flex-1 min-h-0 overflow-hidden px-6 py-4">
            <div className="h-full max-w-7xl mx-auto animate-[fadeIn_0.3s_ease-out]">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
