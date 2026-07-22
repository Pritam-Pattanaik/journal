// Skeleton loaders for the admin panel — use current design tokens throughout.

export function SkeletonCard() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="h-4 bg-surface-2 rounded w-1/3 mb-4" />
      <div className="h-8 bg-surface-2 rounded w-2/3 mb-2" />
      <div className="h-3 bg-surface-2 rounded w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-12 bg-surface-1 border-b border-border" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-6 py-4 border-b border-border last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 bg-surface-2 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="h-4 bg-surface-2 rounded w-1/4 mb-6" />
      <div className="h-64 bg-surface-2 rounded" />
    </div>
  );
}
