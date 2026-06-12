"use client";

import type { ReactNode } from "react";
import type { MetricSource } from "@/features/saas-admin/types";
import { AdminCard } from "@/features/saas-admin/components/AdminCard";
import { MetricSourceBadge } from "@/features/saas-admin/components/MetricSourceBadge";

type ChartCardProps = {
  title: string;
  description?: string;
  source?: MetricSource;
  children: ReactNode;
};

export function ChartCard({ title, description, source, children }: ChartCardProps) {
  return (
    <AdminCard as="section" padding="sm">
      <header className="mb-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-bold text-[var(--admin-text)] sm:text-base">{title}</h2>
          {source ? <MetricSourceBadge source={source} /> : null}
        </div>
        {description ? (
          <p className="mt-0.5 text-sm text-[var(--admin-muted)]">{description}</p>
        ) : null}
      </header>
      {children}
    </AdminCard>
  );
}
