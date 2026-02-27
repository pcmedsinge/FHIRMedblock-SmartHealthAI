// -----------------------------------------------------------
// SourceBadge — Shows which health system data came from
// -----------------------------------------------------------
// Small pill that appears next to every data item.
// Consistent color coding: violet for Epic, blue for Community MC.
// -----------------------------------------------------------

import { SOURCE_STYLES, SOURCE_FALLBACK } from "../../config/designSystem";
import type { SourceSystemId } from "../../config/designSystem";
import type { SourceTag } from "../../types/source";

interface SourceBadgeProps {
  source: SourceTag;
  /** Show just the dot, no text (for compact views) */
  compact?: boolean;
}

const SourceBadge = ({ source, compact = false }: SourceBadgeProps) => {
  const style =
    SOURCE_STYLES[source.systemId as SourceSystemId] ?? SOURCE_FALLBACK;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${style.bg} ${style.text} border ${style.border} shrink-0`}
        title={source.systemName}
        aria-label={`Source: ${source.systemName}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        {style.shortLabel}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border} shrink-0`}
      title={source.systemName}
    >
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
};

export default SourceBadge;
