export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4 sm:p-5">
      <div className="admin-content-container grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="admin-card h-20 bg-[var(--admin-surface-muted)]" />
        ))}
      </div>
      <div className="admin-content-container admin-card h-52 bg-[var(--admin-surface-muted)]" />
    </div>
  );
}
