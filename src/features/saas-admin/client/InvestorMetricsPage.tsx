"use client";

import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { formatMetricValue, formatNumber } from "@/features/saas-admin/components/format-utils";
import { KpiCard } from "@/features/saas-admin/components/KpiCard";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import { fetchInvestorMetrics } from "@/features/saas-admin/client/saas-admin-api-client";
import { useSaasAdminQuery } from "@/features/saas-admin/client/use-saas-admin-query";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

export default function InvestorMetricsPage() {
  const { locale, t } = useSaasAdminLocale();
  const { data, error, isLoading } = useSaasAdminQuery(
    ["saas-admin", "investor-metrics"],
    fetchInvestorMetrics,
  );

  const metricLabels = {
    unavailable: t.common.unavailable,
    estimated: t.common.estimated,
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) {
    return (
      <div className="p-6 text-sm text-[var(--admin-danger)]">
        {error instanceof Error ? error.message : t.investor.loadError}
      </div>
    );
  }

  return (
    <>
      <AdminHeader title={t.investor.title} description={t.investor.description} />
      <div className="space-y-6 p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t.investor.disclaimer}
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title={t.investor.activeAccounts} value={formatNumber(data.activeAccounts, locale)} />
          <KpiCard title={t.investor.activeStores} value={formatNumber(data.activeStores, locale)} />
          <KpiCard title={t.investor.monthlyCloseouts} value={formatNumber(data.monthlyCloseouts, locale)} />
          <KpiCard title={t.investor.monthlyOperations} value={formatNumber(data.monthlyOperations, locale)} />
          <KpiCard
            title={t.investor.avgCloseoutsPerStore}
            value={data.avgCloseoutsPerStore !== null ? formatNumber(data.avgCloseoutsPerStore, locale) : t.common.unavailable}
          />
          <KpiCard
            title={t.investor.attachmentsPerCloseout}
            value={data.attachmentsPerCloseout !== null ? formatNumber(data.attachmentsPerCloseout, locale) : t.common.unavailable}
          />
          <KpiCard
            title={t.investor.estimatedMrr}
            value={formatMetricValue(data.estimatedMrr.value, data.estimatedMrr.availability, ` ${data.currency}`, locale, metricLabels)}
          />
          <KpiCard
            title={t.investor.estimatedArr}
            value={formatMetricValue(data.estimatedArr.value, data.estimatedArr.availability, ` ${data.currency}`, locale, metricLabels)}
          />
          <KpiCard
            title={t.investor.potentialMrr}
            value={formatMetricValue(data.potentialMrr.value, data.potentialMrr.availability, ` ${data.currency}`, locale, metricLabels)}
          />
          <KpiCard
            title={t.investor.growthRate}
            value={formatMetricValue(data.growthRate.value, data.growthRate.availability, "%", locale, metricLabels)}
          />
          <KpiCard title={t.investor.inactiveAccounts} value={formatNumber(data.inactiveAccounts, locale)} />
          <KpiCard
            title={t.investor.retentionProxy}
            value={formatMetricValue(data.retentionProxy.value, data.retentionProxy.availability, "%", locale, metricLabels)}
          />
          <KpiCard
            title={t.investor.usageIntensity}
            value={formatMetricValue(
              data.usageIntensity.value !== null ? data.usageIntensity.value * 100 : null,
              data.usageIntensity.availability,
              "%",
              locale,
              metricLabels,
            )}
          />
        </section>
      </div>
    </>
  );
}
