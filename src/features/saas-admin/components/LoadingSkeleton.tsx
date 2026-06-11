export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4 sm:p-5">
      <div className="admin-content-container grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-20 rounded-lg bg-[var(--admin-border)]" />
        ))}
      </div>
      <div className="admin-content-container h-52 rounded-lg bg-[var(--admin-border)]" />
    </div>
  );
}
