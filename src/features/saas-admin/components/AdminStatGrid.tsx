"use client";

import type { MetricSource } from "@/features/saas-admin/types";
import { AdminCard } from "@/features/saas-admin/components/AdminCard";
import { MetricSourceBadge } from "@/features/saas-admin/components/MetricSourceBadge";

export type AdminStatItem = {
  key: string;
  label: string;
  value: string | number;
  source?: MetricSource;
};

type AdminStatGridProps = {
  items: AdminStatItem[];
};

export function AdminStatGrid({ items }: AdminStatGridProps) {
  return (
    <AdminCard padding="sm">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="min-w-0 rounded-lg bg-[var(--admin-surface-muted)] px-2.5 py-2"
          >
            <div className="flex items-start justify-between gap-1">
              <p className="text-[10px] font-medium leading-tight text-[var(--admin-muted)] sm:text-[11px]">
                {item.label}
              </p>
              {item.source ? <MetricSourceBadge source={item.source} /> : null}
            </div>
            <p className="mt-0.5 truncate text-sm font-bold tabular-nums text-[var(--admin-text)]">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}
