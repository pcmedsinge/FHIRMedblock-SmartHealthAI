// -----------------------------------------------------------
// Skeleton Components — Animated loading placeholders
// -----------------------------------------------------------
// Professional apps show structure during loading, not spinners.
// These pulse-animated skeletons mirror the shapes of real content
// so the page feels "nearly ready" even while fetching.
// -----------------------------------------------------------

/** Single animated bar — the building block */
const SkeletonBar = ({
  className = "",
}: {
  className?: string;
}) => (
  <div
    className={`animate-pulse rounded bg-slate-200 ${className}`}
    aria-hidden="true"
  />
);

/** Skeleton version of a card (matches InsightCard shape) */
export const SkeletonCard = () => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
    <div className="flex items-start gap-3">
      <SkeletonBar className="w-9 h-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBar className="h-3 w-24" />
        <SkeletonBar className="h-4 w-3/4" />
        <SkeletonBar className="h-3 w-full" />
        <SkeletonBar className="h-3 w-5/6" />
      </div>
    </div>
    <div className="flex justify-between pt-2 border-t border-slate-100">
      <SkeletonBar className="h-3 w-20" />
      <SkeletonBar className="h-3 w-32" />
    </div>
  </div>
);

/** Skeleton version of a data row (for medication lists, lab tables, etc.) */
export const SkeletonRow = () => (
  <div className="flex items-center gap-3 py-3 px-4">
    <SkeletonBar className="w-6 h-6 rounded shrink-0" />
    <div className="flex-1 space-y-1.5">
      <SkeletonBar className="h-3.5 w-48" />
      <SkeletonBar className="h-3 w-32" />
    </div>
    <SkeletonBar className="h-5 w-16 rounded-full shrink-0" />
    <SkeletonBar className="h-5 w-14 rounded-full shrink-0" />
  </div>
);

/** Multiple skeleton cards stacked */
export const SkeletonCardList = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3" role="status" aria-label="Loading content">
    {Array.from({ length: count }, (_, i) => (
      <SkeletonCard key={i} />
    ))}
    <span className="sr-only">Loading...</span>
  </div>
);

/** Multiple skeleton rows (for table/list views) */
export const SkeletonRowList = ({ count = 5 }: { count?: number }) => (
  <div
    className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden"
    role="status"
    aria-label="Loading content"
  >
    {Array.from({ length: count }, (_, i) => (
      <SkeletonRow key={i} />
    ))}
    <span className="sr-only">Loading...</span>
  </div>
);

/** Skeleton for stats/count cards */
export const SkeletonStatCards = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <SkeletonBar className="w-6 h-6 rounded" />
        <SkeletonBar className="h-7 w-12" />
        <SkeletonBar className="h-3 w-20" />
      </div>
    ))}
  </div>
);

/** Empty state — when there's no data to show */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
      <Icon className="w-7 h-7 text-slate-400" strokeWidth={1.5} />
    </div>
    <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
    <p className="text-sm text-slate-400 max-w-sm">{description}</p>
  </div>
);

export default SkeletonBar;
