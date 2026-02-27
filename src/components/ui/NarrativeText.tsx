// -----------------------------------------------------------
// NarrativeText — Renders AI narrative with highlighted key info
// -----------------------------------------------------------
// Parses **bold** markdown and auto-highlights numbers + units.
// Falls back gracefully for plain text (old cached responses).
// -----------------------------------------------------------

import { Fragment } from "react";

interface NarrativeTextProps {
  text: string;
  className?: string;
}

/**
 * Render AI narrative text with:
 * - **bold** → <strong> with emerald highlight
 * - Auto-highlight standalone numbers with units (e.g., "142 mg/dL", "7.5 %", "47.1%")
 */
const NarrativeText = ({ text, className = "" }: NarrativeTextProps) => {
  // Split into paragraphs
  const paragraphs = text.split(/\n\n+/).filter(Boolean);

  return (
    <div className={`space-y-3 ${className}`}>
      {paragraphs.map((para, i) => (
        <p key={i} className="text-sm text-slate-700 leading-relaxed">
          {renderInline(para)}
        </p>
      ))}
    </div>
  );
};

/** Parse a paragraph into styled inline segments */
function renderInline(text: string) {
  // Step 1: Split on **bold** markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    // Bold markdown: **text**
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {inner}
        </strong>
      );
    }

    // Plain text — auto-highlight numbers with units
    return <Fragment key={i}>{highlightValues(part)}</Fragment>;
  });
}

/**
 * Auto-highlight numeric values with units in plain (non-bold) text.
 * Matches: "142 mg/dL", "7.5 %", "3.5 INR", "47.1%", "2-3", "70-99 mg/dL"
 * Only triggers on clinical-looking values — not all numbers.
 */
function highlightValues(text: string) {
  // Match: number (optionally with decimal/range) + optional space + unit
  const valuePattern = /(\d+\.?\d*(?:\s*[-–]\s*\d+\.?\d*)?\s*(?:mg\/dL|%|INR|mIU\/L|ng\/mL|mmol\/L|g\/dL|U\/L|mEq\/L|mcg\/dL|mm Hg|bpm|lbs?|kg))/gi;

  const segments = text.split(valuePattern);

  if (segments.length <= 1) return text;

  return segments.map((seg, i) => {
    if (valuePattern.test(seg)) {
      // Reset regex lastIndex after test
      valuePattern.lastIndex = 0;
      return (
        <span key={i} className="font-medium text-emerald-800 bg-emerald-50/60 px-0.5 rounded">
          {seg}
        </span>
      );
    }
    return seg;
  });
}

export default NarrativeText;
