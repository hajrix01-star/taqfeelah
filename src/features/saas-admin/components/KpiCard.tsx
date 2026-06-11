type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export function KpiCard({ title, value, subtitle }: KpiCardProps) {
  return (
    <article className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-sm">
      <p className="text-sm font-medium text-[var(--admin-muted)]">{title}</p>
      <p className="mt-2 text-2xl font-bold text-[var(--admin-primary)]">{value}</p>
      {subtitle ? (
        <p className="mt-1 text-xs text-[var(--admin-muted)]">{subtitle}</p>
      ) : null}
    </article>
  );
}
