"use client";

import type { MetricSource } from "@/features/saas-admin/types";
import { AdminCard } from "@/features/saas-admin/components/AdminCard";
import { MetricSourceBadge } from "@/features/saas-admin/components/MetricSourceBadge";

type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  source?: MetricSource;
};

export function KpiCard({ title, value, subtitle, source }: KpiCardProps) {
  return (
    <AdminCard as="article" padding="sm" className="admin-kpi-card">
      <div className="flex items-start justify-between gap-2 ps-1">
        <p className="text-xs font-semibold text-[var(--admin-muted)] sm:text-sm">{title}</p>
        {source ? <MetricSourceBadge source={source} /> : null}
      </div>
      <p className="mt-1.5 ps-1 text-lg font-bold tabular-nums text-[var(--admin-text)] sm:text-xl">{value}</p>
      {subtitle ? (
        <p className="mt-0.5 ps-1 text-xs text-[var(--admin-muted)]">{subtitle}</p>
      ) : null}
    </AdminCard>
  );
}
