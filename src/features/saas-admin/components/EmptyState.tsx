type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-12 text-center">
      <p className="text-sm font-semibold text-[var(--admin-primary)]">{title}</p>
      {description ? (
        <p className="mt-2 text-sm text-[var(--admin-muted)]">{description}</p>
      ) : null}
    </div>
  );
}
