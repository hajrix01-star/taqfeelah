import type { MetricAvailability, MetricSource } from "@/features/saas-admin/types";
import type { PlatformMetric } from "@/features/saas-admin/server/platform-metrics/types";

export function metricAvailability<T>(metric: PlatformMetric<T>): MetricAvailability {
  if (metric.value === null || metric.value === undefined) {
    return "unavailable";
  }
  if (metric.source === "estimated") {
    return "estimated";
  }
  return "available";
}

export function toInvestorField<T>(
  metric: PlatformMetric<T>,
  label?: string,
): {
  value: T;
  source: MetricSource;
  availability: MetricAvailability;
  label?: string;
} {
  return {
    value: metric.value,
    source: metric.source,
    availability: metricAvailability(metric),
    ...(label ? { label } : {}),
  };
}
