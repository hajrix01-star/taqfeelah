import type { ReactNode } from "react";

type AdminKpiSectionProps = {
  title: string;
  children: ReactNode;
};

export function AdminKpiSection({ title, children }: AdminKpiSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  );
}
