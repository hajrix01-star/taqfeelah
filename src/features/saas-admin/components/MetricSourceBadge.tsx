"use client";

import type { MetricSource } from "@/features/saas-admin/types";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

const SOURCE_STYLES: Record<MetricSource, string> = {
  live: "bg-sky-50 text-sky-700 border-sky-200",
  aggregated: "bg-violet-50 text-violet-700 border-violet-200",
  estimated: "bg-amber-50 text-amber-800 border-amber-200",
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
