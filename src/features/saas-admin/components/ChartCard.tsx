"use client";

import type { ReactNode } from "react";
import type { MetricSource } from "@/features/saas-admin/types";
import { MetricSourceBadge } from "@/features/saas-admin/components/MetricSourceBadge";

type ChartCardProps = {
  title: string;
  description?: string;
  source?: MetricSource;
  children: ReactNode;
};

export function ChartCard({ title, description, source, children }: ChartCardProps) {
  return (
    <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-sm sm:p-5">
      <header className="mb-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-bold text-[var(--admin-primary)]">{title}</h2>
          {source ? <MetricSourceBadge source={source} /> : null}
        </div>
        {description ? (
          <p className="mt-1 text-sm text-[var(--admin-muted)]">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
