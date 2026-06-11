"use client";

import type { MetricSource } from "@/features/saas-admin/types";
import { MetricSourceBadge } from "@/features/saas-admin/components/MetricSourceBadge";

type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  source?: MetricSource;
};

export function KpiCard({ title, value, subtitle, source }: KpiCardProps) {
  return (
    <article className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[var(--admin-muted)]">{title}</p>
        {source ? <MetricSourceBadge source={source} /> : null}
      </div>
      <p className="mt-2 text-2xl font-bold text-[var(--admin-primary)]">{value}</p>
      {subtitle ? (
        <p className="mt-1 text-xs text-[var(--admin-muted)]">{subtitle}</p>
      ) : null}
    </article>
  );
}
