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
import { AdminKpiSection } from "@/features/saas-admin/components/AdminKpiSection";
import { AdminTable, AdminTableCell } from "@/features/saas-admin/components/AdminTable";
import { ADMIN_CHART_COLORS } from "@/features/saas-admin/components/admin-chart-colors";
import { ChartCard } from "@/features/saas-admin/components/ChartCard";
import { formatDateTime, formatNumber } from "@/features/saas-admin/components/format-utils";
import { KpiCard } from "@/features/saas-admin/components/KpiCard";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import { StatusBadge } from "@/features/saas-admin/components/StatusBadge";
import { fetchSaasOverview } from "@/features/saas-admin/client/saas-admin-api-client";
import { useSaasAdminQuery } from "@/features/saas-admin/client/use-saas-admin-query";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

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

  return (
    <>
      <AdminHeader title={t.overview.title} description={t.overview.description} />
      <AdminPageBody>
        {!engagement.dataAvailable ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">
            {t.overview.engagementWarning}
          </div>
        ) : null}

        <AdminKpiSection title={t.overview.kpiSectionAccounts}>
          <KpiCard title={t.overview.totalAccounts} value={formatNumber(kpis.totalAccounts.value, locale)} source={kpis.totalAccounts.source} />
          <KpiCard title={t.overview.activeAccounts} value={formatNumber(kpis.activeAccounts.value, locale)} source={kpis.activeAccounts.source} />
          <KpiCard title={t.overview.storesCount} value={formatNumber(kpis.storesCount.value, locale)} source={kpis.storesCount.source} />
          <KpiCard title={t.overview.usersCount} value={formatNumber(kpis.usersCount.value, locale)} source={kpis.usersCount.source} />
        </AdminKpiSection>

        <AdminKpiSection title={t.overview.kpiSectionActivity}>
          <KpiCard title={t.overview.closeoutsThisMonth} value={formatNumber(kpis.closeoutsThisMonth.value, locale)} source={kpis.closeoutsThisMonth.source} />
          <KpiCard title={t.overview.operationsThisMonth} value={formatNumber(kpis.operationsThisMonth.value, locale)} source={kpis.operationsThisMonth.source} />
          <KpiCard title={t.overview.attachmentsCount} value={formatNumber(kpis.attachmentsCount.value, locale)} source={kpis.attachmentsCount.source} />
          <KpiCard title={t.overview.lastActivity} value={formatDateTime(kpis.lastActivityAt.value, locale)} source={kpis.lastActivityAt.source} />
        </AdminKpiSection>

        <ChartCard title={t.overview.activity30Days} description={t.overview.activity30DaysDesc} source={activityTrendSource}>
          {activityTrend.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">{t.overview.noActivity}</p>
          ) : (
            <AdminChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={ADMIN_CHART_COLORS.grid} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} width={36} />
                  <Tooltip wrapperStyle={{ maxWidth: "min(100vw - 2rem, 18rem)" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="closeouts" name={t.common.closeouts} stroke={ADMIN_CHART_COLORS.primary} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="operations" name={t.common.operations} stroke={ADMIN_CHART_COLORS.secondary} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </AdminChartFrame>
          )}
        </ChartCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">{t.overview.topActive}</h2>
            <AdminTable
              columns={[t.accounts.colAccount, t.common.closeouts, t.accounts.colLastActivity, t.common.status]}
              empty={topActiveAccounts.length === 0}
            >
              {topActiveAccounts.map((row) => (
                <tr key={row.id} className="hover:bg-[var(--admin-hover)]">
                  <AdminTableCell col={0}>
                    <Link href={`/saas-admin/accounts/${row.id}`} className="font-semibold text-[var(--admin-primary)] hover:underline">
                      {row.name}
                    </Link>
                  </AdminTableCell>
                  <AdminTableCell col={1}>{formatNumber(row.closeoutsThisMonth, locale)}</AdminTableCell>
                  <AdminTableCell col={2} className="text-[var(--admin-muted)]">{formatDateTime(row.lastActivityAt, locale)}</AdminTableCell>
                  <AdminTableCell col={3}><StatusBadge status={row.status} /></AdminTableCell>
                </tr>
              ))}
            </AdminTable>
          </section>

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">{t.overview.inactiveAccounts}</h2>
            <AdminTable
              columns={[t.accounts.colAccount, t.accounts.colLastActivity, t.common.status]}
              empty={inactiveAccounts.length === 0}
              emptyMessage={t.overview.noInactive}
            >
              {inactiveAccounts.map((row) => (
                <tr key={row.id} className="hover:bg-[var(--admin-hover)]">
                  <AdminTableCell col={0}>
                    <Link href={`/saas-admin/accounts/${row.id}`} className="font-semibold text-[var(--admin-primary)] hover:underline">
                      {row.name}
                    </Link>
                  </AdminTableCell>
                  <AdminTableCell col={1} className="text-[var(--admin-muted)]">{formatDateTime(row.lastActivityAt, locale)}</AdminTableCell>
                  <AdminTableCell col={2}><StatusBadge status={row.status} /></AdminTableCell>
                </tr>
              ))}
            </AdminTable>
          </section>
        </div>

        <ChartCard title={t.overview.systemHealthSummary}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3.5">
              <p className="text-xs text-[var(--admin-muted)]">{t.overview.database}</p>
              <p className="mt-1 font-semibold text-[var(--admin-text)]">
                {systemHealth.database === "healthy" ? t.common.healthy : t.overview.needsReview}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3.5">
              <p className="text-xs text-[var(--admin-muted)]">{t.overview.api}</p>
              <p className="mt-1 font-semibold text-[var(--admin-text)]">
                {systemHealth.api === "healthy" ? t.common.working : t.common.unavailable}
              </p>
            </div>
          </div>
        </ChartCard>
      </AdminPageBody>
    </>
  );
}
