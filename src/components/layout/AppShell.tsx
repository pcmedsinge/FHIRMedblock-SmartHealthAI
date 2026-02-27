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
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header (slim) */}
        <Header />

        {/* Content area — viewport-fit, pages own their scroll behavior */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
