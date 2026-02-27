// -----------------------------------------------------------
// Sidebar — Left navigation with section groupings
// -----------------------------------------------------------
// Light, friendly sidebar. Patients need warmth, not admin panels.
// Grouped by purpose: MY HEALTH, MY TOOLS.
// Bigger fonts, clear icons, colored section headers.
// -----------------------------------------------------------

import { NavLink, useLocation } from "react-router-dom";
import {
  BrainCircuit,
  Pill,
  TrendingUp,
  FileText,
  PanelLeftClose,
  PanelLeft,
  Activity,
  Heart,
  AlertTriangle,
  Syringe,
} from "lucide-react";
import { useState } from "react";
import { TRANSITIONS } from "../../config/designSystem";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

interface NavSection {
  title: string;
  color: string;
  icon: React.ElementType;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: "MY HEALTH",
    color: "text-emerald-600",
    icon: Heart,
    items: [
      { to: "/dashboard", icon: BrainCircuit, label: "Overview" },
      { to: "/medications", icon: Pill, label: "Medications" },
      { to: "/labs", icon: TrendingUp, label: "Labs & Vitals" },
    ],
  },
  {
    title: "MY VISIT",
    color: "text-blue-600",
    icon: FileText,
    items: [
      { to: "/pre-visit", icon: FileText, label: "Pre-Visit Report" },
    ],
  },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`${
        collapsed ? "w-[72px]" : "w-60"
      } h-screen bg-white border-r border-slate-200 flex flex-col shrink-0 ${TRANSITIONS.normal} print:hidden`}
    >
      {/* Logo area */}
      <div className="px-4 h-16 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
          <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-slate-900 font-bold text-base tracking-tight leading-none">
              SmartHealth
            </h1>
            <span className="text-emerald-600 text-xs font-semibold tracking-wide">
              AI Health Companion
            </span>
          </div>
        )}
      </div>

      {/* Navigation sections */}
      <nav aria-label="Main navigation" className="flex-1 py-4 px-3 overflow-y-auto space-y-5">
        {SECTIONS.map(({ title, color, items }) => (
          <div key={title}>
            {/* Section header */}
            {!collapsed && (
              <div className={`flex items-center gap-1.5 px-2 mb-2`}>
            <span className={`text-xs font-bold tracking-widest uppercase ${color}`}>
                  {title}
                </span>
              </div>
            )}

            {/* Nav items */}
            <div className="space-y-0.5">
              {items.map(({ to, icon: Icon, label }) => {
                const isActive = location.pathname === to;

                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 ${TRANSITIONS.fast}
                      ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200/60"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }
                      ${collapsed ? "justify-center px-0" : ""}
                    `}
                    title={collapsed ? label : undefined}
                  >
                    <div
                      className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${TRANSITIONS.fast}
                        ${
                          isActive
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                        }
                      `}
                    >
                      <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                    </div>
                    {!collapsed && (
                      <span
                        className={`text-[15px] font-semibold leading-tight ${
                          isActive ? "text-emerald-800" : "text-slate-700 group-hover:text-slate-900"
                        }`}
                      >
                        {label}
                      </span>
                    )}
                    {!collapsed && isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2
            text-slate-400 hover:text-slate-600 hover:bg-slate-50 ${TRANSITIONS.fast} text-sm font-medium`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
