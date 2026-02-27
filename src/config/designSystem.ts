// -----------------------------------------------------------
// Design System — Shared constants & utility classes
// -----------------------------------------------------------
// Single source of truth for colors, spacing, and severity
// visual language across the app.
//
// WHY CONSTANTS: Tailwind classes are strings — typos are silent.
// By centralizing them here, we get autocomplete & consistency.
// -----------------------------------------------------------

/**
 * Severity visual language — used everywhere conflicts/insights appear.
 * Each severity level has a consistent color story.
 */
export const SEVERITY = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-400",
    borderLeft: "border-l-4 border-l-red-500",
    text: "text-red-800",
    textLight: "text-red-600",
    badge: "bg-red-100 text-red-700",
    icon: "text-red-500",
    dot: "bg-red-500",
  },
  high: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    borderLeft: "border-l-4 border-l-amber-500",
    text: "text-amber-800",
    textLight: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
    icon: "text-amber-500",
    dot: "bg-amber-500",
  },
  medium: {
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    borderLeft: "border-l-4 border-l-yellow-400",
    text: "text-yellow-800",
    textLight: "text-yellow-600",
    badge: "bg-yellow-100 text-yellow-700",
    icon: "text-yellow-500",
    dot: "bg-yellow-500",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    borderLeft: "border-l-4 border-l-blue-400",
    text: "text-blue-800",
    textLight: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
    icon: "text-blue-500",
    dot: "bg-blue-500",
  },
  normal: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    borderLeft: "border-l-4 border-l-emerald-400",
    text: "text-emerald-800",
    textLight: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    icon: "text-emerald-500",
    dot: "bg-emerald-500",
  },
} as const;

export type SeverityLevel = keyof typeof SEVERITY;

/**
 * Source system visual identity — colored badges so users
 * always know which health system data came from.
 */
export const SOURCE_STYLES = {
  "epic-sandbox": {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    dot: "bg-violet-500",
    label: "Epic",
  },
  "community-mc": {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    dot: "bg-teal-500",
    label: "Community MC",
  },
} as const;

export type SourceSystemId = keyof typeof SOURCE_STYLES;

/** Fallback source style for unknown systems */
export const SOURCE_FALLBACK = {
  bg: "bg-slate-50",
  text: "text-slate-600",
  border: "border-slate-200",
  dot: "bg-slate-400",
  label: "Unknown",
};

/**
 * Merge status visual language
 */
export const MERGE_STATUS = {
  "single-source": {
    bg: "bg-slate-100",
    text: "text-slate-600",
    label: "Single Source",
  },
  confirmed: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    label: "Confirmed",
  },
  conflict: {
    bg: "bg-red-100",
    text: "text-red-700",
    label: "Conflict",
  },
} as const;

/**
 * Common transition classes for smooth UI interactions
 */
export const TRANSITIONS = {
  fast: "transition-all duration-150 ease-out",
  normal: "transition-all duration-200 ease-out",
  slow: "transition-all duration-300 ease-out",
  spring: "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
} as const;
