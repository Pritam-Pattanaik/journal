export function SkeletonCard() {
  return (
    <div className="bg-surface rounded-xl border border-border-color p-6 animate-pulse">
      <div className="h-4 bg-surface-hover rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-surface-hover rounded w-2/3 mb-2"></div>
      <div className="h-3 bg-surface-hover rounded w-1/2"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-surface rounded-xl border border-border-color overflow-hidden animate-pulse">
      <div className="h-12 bg-surface-hover/50 border-b border-border-color"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-6 py-4 border-b border-border-color last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 bg-surface-hover rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-surface rounded-xl border border-border-color p-6 animate-pulse">
      <div className="h-4 bg-surface-hover rounded w-1/4 mb-6"></div>
      <div className="h-64 bg-surface-hover rounded"></div>
    </div>
  );
}
