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
    <article className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-[var(--admin-muted)] sm:text-sm">{title}</p>
        {source ? <MetricSourceBadge source={source} /> : null}
      </div>
      <p className="mt-1.5 text-lg font-bold tabular-nums text-[var(--admin-text)] sm:text-xl">{value}</p>
      {subtitle ? (
        <p className="mt-0.5 text-xs text-[var(--admin-muted)]">{subtitle}</p>
      ) : null}
    </article>
  );
}
