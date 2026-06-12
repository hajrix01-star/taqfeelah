"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminCallout } from "@/features/saas-admin/components/AdminCallout";
import { AdminChartFrame } from "@/features/saas-admin/components/AdminChartFrame";
import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { AdminPageBody } from "@/features/saas-admin/components/AdminPageBody";
import { ADMIN_CHART_COLORS } from "@/features/saas-admin/components/admin-chart-colors";
import { ChartCard } from "@/features/saas-admin/components/ChartCard";
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
  const currencySuffix = ` ${t.common.currencySar}`;

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) {
    return (
      <div className="p-6 text-sm text-[var(--admin-danger)]">
        {error instanceof Error ? error.message : t.investor.loadError}
      </div>
    );
  }

  const accountMix = [
    {
      name: t.investor.activeAccounts,
      value: data.activeAccounts.value,
      color: ADMIN_CHART_COLORS.primary,
    },
    {
      name: t.investor.inactiveAccounts,
      value: data.inactiveAccounts.value,
      color: ADMIN_CHART_COLORS.tertiary,
    },
  ].filter((row) => row.value > 0);

  const revenueOutlook = [
    { label: t.investor.estimatedMrr, value: data.estimatedMrr.value },
    { label: t.investor.potentialMrr, value: data.potentialMrr.value },
  ].flatMap((row) => (row.value === null ? [] : [{ label: row.label, value: row.value }]));

  return (
    <>
      <AdminHeader title={t.investor.title} description={t.investor.description} />
      <AdminPageBody>
        <AdminCallout>{t.investor.disclaimer}</AdminCallout>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title={t.investor.accountMixChart} description={t.investor.accountMixChartDesc}>
            {accountMix.length === 0 ? (
              <p className="text-sm text-[var(--admin-muted)]">{t.common.unavailable}</p>
            ) : (
              <AdminChartFrame className="h-52 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={accountMix}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="52%"
                      outerRadius="78%"
                      paddingAngle={3}
                    >
                      {accountMix.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(Number(value ?? 0), locale)} />
                  </PieChart>
                </ResponsiveContainer>
              </AdminChartFrame>
            )}
          </ChartCard>

          <ChartCard title={t.investor.revenueOutlookChart} description={t.investor.revenueOutlookChartDesc}>
            {revenueOutlook.length === 0 ? (
              <p className="text-sm text-[var(--admin-muted)]">{t.common.unavailable}</p>
            ) : (
              <AdminChartFrame className="h-52 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueOutlook} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} />
                    <YAxis tick={{ fontSize: 10 }} width={48} />
                    <Tooltip formatter={(value) => `${formatNumber(Number(value ?? 0), locale)} ${t.common.currencySar}`} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {revenueOutlook.map((entry, index) => (
                        <Cell
                          key={entry.label}
                          fill={index === 0 ? ADMIN_CHART_COLORS.primary : ADMIN_CHART_COLORS.secondary}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </AdminChartFrame>
            )}
          </ChartCard>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            value={formatInvestorKpi(data.estimatedMrr, locale, metricLabels, currencySuffix)}
            source={data.estimatedMrr.source}
          />
          <KpiCard
            title={t.investor.estimatedArr}
            value={formatInvestorKpi(data.estimatedArr, locale, metricLabels, currencySuffix)}
            source={data.estimatedArr.source}
          />
          <KpiCard
            title={t.investor.potentialMrr}
            value={formatInvestorKpi(data.potentialMrr, locale, metricLabels, currencySuffix)}
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
