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
import { AdminTable } from "@/features/saas-admin/components/AdminTable";
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
      <div className="space-y-6 p-6">
        {!engagement.dataAvailable ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t.overview.engagementWarning}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title={t.overview.totalAccounts} value={formatNumber(kpis.totalAccounts.value, locale)} source={kpis.totalAccounts.source} />
          <KpiCard title={t.overview.activeAccounts} value={formatNumber(kpis.activeAccounts.value, locale)} source={kpis.activeAccounts.source} />
          <KpiCard title={t.overview.storesCount} value={formatNumber(kpis.storesCount.value, locale)} source={kpis.storesCount.source} />
          <KpiCard title={t.overview.usersCount} value={formatNumber(kpis.usersCount.value, locale)} source={kpis.usersCount.source} />
          <KpiCard title={t.overview.closeoutsThisMonth} value={formatNumber(kpis.closeoutsThisMonth.value, locale)} source={kpis.closeoutsThisMonth.source} />
          <KpiCard title={t.overview.operationsThisMonth} value={formatNumber(kpis.operationsThisMonth.value, locale)} source={kpis.operationsThisMonth.source} />
          <KpiCard title={t.overview.attachmentsCount} value={formatNumber(kpis.attachmentsCount.value, locale)} source={kpis.attachmentsCount.source} />
          <KpiCard title={t.overview.lastActivity} value={formatDateTime(kpis.lastActivityAt.value, locale)} source={kpis.lastActivityAt.source} />
        </section>

        <ChartCard title={t.overview.activity30Days} description={t.overview.activity30DaysDesc} source={activityTrendSource}>
          {activityTrend.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">{t.overview.noActivity}</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="closeouts" name={t.common.closeouts} stroke="#112A46" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="operations" name={t.common.operations} stroke="#F5A623" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-bold text-[var(--admin-primary)]">{t.overview.topActive}</h2>
            <AdminTable
              columns={[t.accounts.colAccount, t.common.closeouts, t.accounts.colLastActivity, t.common.status]}
              empty={topActiveAccounts.length === 0}
            >
              {topActiveAccounts.map((row) => (
                <tr key={row.id} className="hover:bg-[#FAFBFC]">
                  <td className="px-4 py-3">
                    <Link href={`/saas-admin/accounts/${row.id}`} className="font-semibold text-[var(--admin-primary)] hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{formatNumber(row.closeoutsThisMonth, locale)}</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{formatDateTime(row.lastActivityAt, locale)}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </AdminTable>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold text-[var(--admin-primary)]">{t.overview.inactiveAccounts}</h2>
            <AdminTable
              columns={[t.accounts.colAccount, t.accounts.colLastActivity, t.common.status]}
              empty={inactiveAccounts.length === 0}
              emptyMessage={t.overview.noInactive}
            >
              {inactiveAccounts.map((row) => (
                <tr key={row.id} className="hover:bg-[#FAFBFC]">
                  <td className="px-4 py-3">
                    <Link href={`/saas-admin/accounts/${row.id}`} className="font-semibold text-[var(--admin-primary)] hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{formatDateTime(row.lastActivityAt, locale)}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </AdminTable>
          </section>
        </div>

        <ChartCard title={t.overview.systemHealthSummary}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--admin-border)] p-4">
              <p className="text-xs text-[var(--admin-muted)]">{t.overview.database}</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]">
                {systemHealth.database === "healthy" ? t.common.healthy : t.overview.needsReview}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--admin-border)] p-4">
              <p className="text-xs text-[var(--admin-muted)]">{t.overview.api}</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]">
                {systemHealth.api === "healthy" ? t.common.working : t.common.unavailable}
              </p>
            </div>
          </div>
        </ChartCard>
      </div>
    </>
  );
}
