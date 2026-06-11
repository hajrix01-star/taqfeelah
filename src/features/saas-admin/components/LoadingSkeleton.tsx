export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl bg-[var(--admin-border)]" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-[var(--admin-border)]" />
    </div>
  );
}
