"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { formatMetricValue, formatNumber } from "@/features/saas-admin/components/format-utils";
import { KpiCard } from "@/features/saas-admin/components/KpiCard";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import { fetchInvestorMetrics } from "@/features/saas-admin/client/saas-admin-api-client";
import type { InvestorMetrics } from "@/features/saas-admin/types";

export default function InvestorMetricsPage() {
  const [data, setData] = useState<InvestorMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvestorMetrics()
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error || !data) {
    return <div className="p-6 text-sm text-[var(--admin-danger)]">{error || "تعذر تحميل المؤشرات"}</div>;
  }

  return (
    <>
      <AdminHeader
        title="مؤشرات المستثمر"
        description="مؤشرات استراتيجية للمنصة"
      />
      <div className="space-y-6 p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {data.disclaimer}
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Active Accounts" value={formatNumber(data.activeAccounts)} subtitle="حسابات نشطة" />
          <KpiCard title="Active Stores" value={formatNumber(data.activeStores)} subtitle="محلات نشطة" />
          <KpiCard title="Monthly Closeouts" value={formatNumber(data.monthlyCloseouts)} subtitle="تقفيلات الشهر" />
          <KpiCard title="Monthly Operations" value={formatNumber(data.monthlyOperations)} subtitle="عمليات الشهر" />
          <KpiCard
            title="Avg Closeouts per Store"
            value={data.avgCloseoutsPerStore !== null ? formatNumber(data.avgCloseoutsPerStore) : "غير متاح"}
          />
          <KpiCard
            title="Attachments per Closeout"
            value={data.attachmentsPerCloseout !== null ? formatNumber(data.attachmentsPerCloseout) : "غير متاح"}
          />
          <KpiCard
            title={data.estimatedMrr.label}
            value={formatMetricValue(data.estimatedMrr.value, data.estimatedMrr.availability, ` ${data.currency}`)}
          />
          <KpiCard
            title={data.estimatedArr.label}
            value={formatMetricValue(data.estimatedArr.value, data.estimatedArr.availability, ` ${data.currency}`)}
          />
          <KpiCard
            title={data.potentialMrr.label}
            value={formatMetricValue(data.potentialMrr.value, data.potentialMrr.availability, ` ${data.currency}`)}
          />
          <KpiCard
            title="Growth Rate"
            value={formatMetricValue(data.growthRate.value, data.growthRate.availability, "%")}
          />
          <KpiCard title="Inactive Accounts" value={formatNumber(data.inactiveAccounts)} />
          <KpiCard
            title="Retention Proxy"
            value={formatMetricValue(data.retentionProxy.value, data.retentionProxy.availability, "%")}
          />
          <KpiCard
            title="Usage Intensity"
            value={formatMetricValue(
              data.usageIntensity.value !== null ? data.usageIntensity.value * 100 : null,
              data.usageIntensity.availability,
              "%",
            )}
          />
        </section>
      </div>
    </>
  );
}
