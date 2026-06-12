"use client";

import type { MetricSource } from "@/features/saas-admin/types";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

const SOURCE_STYLES: Record<MetricSource, string> = {
  live: "bg-[var(--admin-surface-muted)] text-[var(--admin-primary)] border-[var(--admin-border)]",
  aggregated: "bg-[var(--taq-warning-bg)] text-[var(--taq-warning-text)] border-[var(--taq-warning-border)]",
  estimated: "bg-[var(--taq-warning-bg)] text-[var(--taq-warning-text)] border-[var(--taq-warning-border)]",
};

type MetricSourceBadgeProps = {
  source: MetricSource;
};

export function MetricSourceBadge({ source }: MetricSourceBadgeProps) {
  const { t } = useSaasAdminLocale();

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${SOURCE_STYLES[source]}`}
    >
      {t.metricSource[source]}
    </span>
  );
}
