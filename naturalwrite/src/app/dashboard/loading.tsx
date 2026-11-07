export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your workspace</span>
      <div className="h-28 animate-pulse rounded-card border border-line bg-surface" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-card border border-line bg-surface"
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-card border border-line bg-surface"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-card border border-line bg-surface" />
    </div>
  );
}
