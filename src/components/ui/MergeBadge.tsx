// -----------------------------------------------------------
// MergeBadge — Shows merge status of a unified record
// -----------------------------------------------------------

import { Check, AlertTriangle, Database } from "lucide-react";
import { MERGE_STATUS, TRANSITIONS } from "../../config/designSystem";
import type { MergeMetadata } from "../../types/merged";

interface MergeBadgeProps {
  status: MergeMetadata["mergeStatus"];
}

const ICONS = {
  "single-source": Database,
  confirmed: Check,
  conflict: AlertTriangle,
};

const MergeBadge = ({ status }: MergeBadgeProps) => {
  const style = MERGE_STATUS[status];
  const Icon = ICONS[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${style.bg} ${style.text} ${TRANSITIONS.fast} shrink-0`}
    >
      <Icon className="w-3 h-3" />
      {style.label}
    </span>
  );
};

export default MergeBadge;
