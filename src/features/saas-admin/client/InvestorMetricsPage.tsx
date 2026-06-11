"use client";

import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { AdminPageBody } from "@/features/saas-admin/components/AdminPageBody";
import { formatMetricValue, formatNumber } from "@/features/saas-admin/components/format-utils";
import { KpiCard } from "@/features/saas-admin/components/KpiCard";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import { fetchInvestorMetrics } from "@/features/saas-admin/client/saas-admin-api-client";
import { useSaasAdminQuery } from "@/features/saas-admin/client/use-saas-admin-query";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";
import type { InvestorMetricField } from "@/features/saas-admin/types";

function formatInvestorKpi(
  field: InvestorMetricField<number | null>,
  locale: "ar" | "en",
  labels: { unavailable: string; estimated: string },
  suffix = "",
) {
  return formatMetricValue(field.value, field.availability, suffix, locale, labels);
}

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
      <AdminPageBody>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t.investor.disclaimer}
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title={t.investor.activeAccounts} value={formatNumber(data.activeAccounts.value, locale)} source={data.activeAccounts.source} />
          <KpiCard title={t.investor.activeStores} value={formatNumber(data.activeStores.value, locale)} source={data.activeStores.source} />
          <KpiCard title={t.investor.monthlyCloseouts} value={formatNumber(data.monthlyCloseouts.value, locale)} source={data.monthlyCloseouts.source} />
          <KpiCard title={t.investor.monthlyOperations} value={formatNumber(data.monthlyOperations.value, locale)} source={data.monthlyOperations.source} />
          <KpiCard
            title={t.investor.avgCloseoutsPerStore}
            value={formatInvestorKpi(data.avgCloseoutsPerStore, locale, metricLabels)}
            source={data.avgCloseoutsPerStore.source}
          />
          <KpiCard
            title={t.investor.attachmentsPerCloseout}
            value={formatInvestorKpi(data.attachmentsPerCloseout, locale, metricLabels)}
            source={data.attachmentsPerCloseout.source}
          />
          <KpiCard
            title={t.investor.estimatedMrr}
            value={formatInvestorKpi(data.estimatedMrr, locale, metricLabels, ` ${data.currency}`)}
            source={data.estimatedMrr.source}
          />
          <KpiCard
            title={t.investor.estimatedArr}
            value={formatInvestorKpi(data.estimatedArr, locale, metricLabels, ` ${data.currency}`)}
            source={data.estimatedArr.source}
          />
          <KpiCard
            title={t.investor.potentialMrr}
            value={formatInvestorKpi(data.potentialMrr, locale, metricLabels, ` ${data.currency}`)}
            source={data.potentialMrr.source}
          />
          <KpiCard
            title={t.investor.growthRate}
            value={formatInvestorKpi(data.growthRate, locale, metricLabels, "%")}
            source={data.growthRate.source}
          />
          <KpiCard title={t.investor.inactiveAccounts} value={formatNumber(data.inactiveAccounts.value, locale)} source={data.inactiveAccounts.source} />
          <KpiCard
            title={t.investor.retentionProxy}
            value={formatInvestorKpi(
              { ...data.retentionProxy, value: data.retentionProxy.value },
              locale,
              metricLabels,
              "%",
            )}
            source={data.retentionProxy.source}
          />
          <KpiCard
            title={t.investor.usageIntensity}
            value={formatInvestorKpi(
              {
                ...data.usageIntensity,
                value: data.usageIntensity.value !== null ? data.usageIntensity.value * 100 : null,
              },
              locale,
              metricLabels,
              "%",
            )}
            source={data.usageIntensity.source}
          />
        </section>
      </AdminPageBody>
    </>
  );
}
