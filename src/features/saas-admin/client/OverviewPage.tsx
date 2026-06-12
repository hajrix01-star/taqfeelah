"use client";

import Link from "next/link";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { AdminPageBody } from "@/features/saas-admin/components/AdminPageBody";
import { AdminChartFrame } from "@/features/saas-admin/components/AdminChartFrame";
import { AdminCompactTable, AdminCompactTableCell } from "@/features/saas-admin/components/AdminCompactTable";
import { ADMIN_CHART_COLORS } from "@/features/saas-admin/components/admin-chart-colors";
import { AdminCallout } from "@/features/saas-admin/components/AdminCallout";
import { AdminCard } from "@/features/saas-admin/components/AdminCard";
import { AdminStatGrid } from "@/features/saas-admin/components/AdminStatGrid";
import { ChartCard } from "@/features/saas-admin/components/ChartCard";
import { formatDateTime, formatNumber } from "@/features/saas-admin/components/format-utils";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import { StatusBadge } from "@/features/saas-admin/components/StatusBadge";
import { fetchSaasOverview } from "@/features/saas-admin/client/saas-admin-api-client";
import { useSaasAdminQuery } from "@/features/saas-admin/client/use-saas-admin-query";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

function HealthPill({
  label,
  healthy,
  healthyLabel,
  unhealthyLabel,
}: {
  label: string;
  healthy: boolean;
  healthyLabel: string;
  unhealthyLabel: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        healthy
          ? "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)]"
          : "border-[var(--admin-danger)]/30 bg-[var(--taq-danger-bg)] text-[var(--admin-danger)]"
      }`}
    >
      <span className="text-[var(--admin-muted)]">{label}</span>
      <span>{healthy ? healthyLabel : unhealthyLabel}</span>
    </span>
  );
}

export default function OverviewPage() {
  const { locale, t } = useSaasAdminLocale();
  const { data, error, isLoading } = useSaasAdminQuery(["saas-admin", "overview"], fetchSaasOverview);

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) {
    return (
      <div className="p-6 text-sm text-[var(--admin-danger)]">
        {error instanceof Error ? error.message : t.common.loadError}
      </div>
    );
  }

  const {
    kpis,
    activityTrend,
    activityTrendSource,
    topActiveAccounts,
    inactiveAccounts,
    systemHealth,
    engagement,
  } = data;

  const statItems = [
    {
      key: "totalAccounts",
      label: t.overview.totalAccounts,
      value: formatNumber(kpis.totalAccounts.value, locale),
      source: kpis.totalAccounts.source,
    },
    {
      key: "activeAccounts",
      label: t.overview.activeAccounts,
      value: formatNumber(kpis.activeAccounts.value, locale),
      source: kpis.activeAccounts.source,
    },
    {
      key: "storesCount",
      label: t.overview.storesCount,
      value: formatNumber(kpis.storesCount.value, locale),
      source: kpis.storesCount.source,
    },
    {
      key: "usersCount",
      label: t.overview.usersCount,
      value: formatNumber(kpis.usersCount.value, locale),
      source: kpis.usersCount.source,
    },
    {
      key: "closeoutsThisMonth",
      label: t.overview.closeoutsThisMonth,
      value: formatNumber(kpis.closeoutsThisMonth.value, locale),
      source: kpis.closeoutsThisMonth.source,
    },
    {
      key: "operationsThisMonth",
      label: t.overview.operationsThisMonth,
      value: formatNumber(kpis.operationsThisMonth.value, locale),
      source: kpis.operationsThisMonth.source,
    },
    {
      key: "attachmentsCount",
      label: t.overview.attachmentsCount,
      value: formatNumber(kpis.attachmentsCount.value, locale),
      source: kpis.attachmentsCount.source,
    },
    {
      key: "lastActivity",
      label: t.overview.lastActivity,
      value: formatDateTime(kpis.lastActivityAt.value, locale),
      source: kpis.lastActivityAt.source,
    },
  ];

  return (
    <>
      <AdminHeader
        title={t.overview.title}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <HealthPill
              label={t.overview.database}
              healthy={systemHealth.database === "healthy"}
              healthyLabel={t.common.healthy}
              unhealthyLabel={t.overview.needsReview}
            />
            <HealthPill
              label={t.overview.api}
              healthy={systemHealth.api === "healthy"}
              healthyLabel={t.common.working}
              unhealthyLabel={t.common.unavailable}
            />
            <Link
              href="/saas-admin/system-health"
              className="text-[11px] font-semibold text-[var(--admin-primary)] hover:underline"
            >
              {t.overview.viewSystemHealth}
            </Link>
          </div>
        )}
      />
      <AdminPageBody className="space-y-3 sm:space-y-4">
        {!engagement.dataAvailable ? (
          <AdminCallout tone="warning">{t.overview.engagementWarning}</AdminCallout>
        ) : null}

        <AdminStatGrid items={statItems} />

        <div className="grid gap-3 lg:grid-cols-12 lg:gap-4">
          <div className="lg:col-span-7">
            <ChartCard
              title={t.overview.activity30Days}
              description={t.overview.activity30DaysDesc}
              source={activityTrendSource}
            >
              {activityTrend.length === 0 ? (
                <p className="text-xs text-[var(--admin-muted)]">{t.overview.noActivity}</p>
              ) : (
                <AdminChartFrame className="h-36 sm:h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={ADMIN_CHART_COLORS.grid} />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveEnd" />
                      <YAxis tick={{ fontSize: 9 }} width={32} />
                      <Tooltip wrapperStyle={{ maxWidth: "min(100vw - 2rem, 16rem)", fontSize: "11px" }} />
                      <Legend wrapperStyle={{ fontSize: "10px" }} />
                      <Line
                        type="monotone"
                        dataKey="closeouts"
                        name={t.common.closeouts}
                        stroke={ADMIN_CHART_COLORS.primary}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="operations"
                        name={t.common.operations}
                        stroke={ADMIN_CHART_COLORS.secondary}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </AdminChartFrame>
              )}
            </ChartCard>
          </div>

          <AdminCard padding="sm" className="space-y-3 lg:col-span-5">
            <section>
              <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                {t.overview.topActive}
              </h2>
              <AdminCompactTable
                columns={[t.accounts.colAccount, t.common.closeouts]}
                empty={topActiveAccounts.length === 0}
              >
                {topActiveAccounts.map((row) => (
                  <tr key={row.id}>
                    <AdminCompactTableCell col={0}>
                      <Link
                        href={`/saas-admin/accounts/${row.id}`}
                        className="block truncate font-semibold text-[var(--admin-primary)] hover:underline"
                      >
                        {row.name}
                      </Link>
                    </AdminCompactTableCell>
                    <AdminCompactTableCell col={1}>
                      {formatNumber(row.closeoutsThisMonth, locale)}
                    </AdminCompactTableCell>
                  </tr>
                ))}
              </AdminCompactTable>
            </section>

            <section>
              <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                {t.overview.inactiveAccounts}
              </h2>
              <AdminCompactTable
                columns={[t.accounts.colAccount, t.common.status]}
                empty={inactiveAccounts.length === 0}
                emptyMessage={t.overview.noInactive}
              >
                {inactiveAccounts.map((row) => (
                  <tr key={row.id}>
                    <AdminCompactTableCell col={0}>
                      <Link
                        href={`/saas-admin/accounts/${row.id}`}
                        className="block truncate font-semibold text-[var(--admin-primary)] hover:underline"
                      >
                        {row.name}
                      </Link>
                    </AdminCompactTableCell>
                    <AdminCompactTableCell col={1}>
                      <StatusBadge status={row.status} />
                    </AdminCompactTableCell>
                  </tr>
                ))}
              </AdminCompactTable>
            </section>
          </AdminCard>
        </div>
      </AdminPageBody>
    </>
  );
}
