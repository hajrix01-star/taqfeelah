"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
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
import { AdminTable, AdminTableCell } from "@/features/saas-admin/components/AdminTable";
import { ADMIN_CHART_COLORS } from "@/features/saas-admin/components/admin-chart-colors";
import { ChartCard } from "@/features/saas-admin/components/ChartCard";
import { formatDateTime, formatNumber } from "@/features/saas-admin/components/format-utils";
import { KpiCard } from "@/features/saas-admin/components/KpiCard";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import { StatusBadge } from "@/features/saas-admin/components/StatusBadge";
import { fetchSaasUsage } from "@/features/saas-admin/client/saas-admin-api-client";
import { useSaasAdminQuery } from "@/features/saas-admin/client/use-saas-admin-query";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

export default function UsagePage() {
  const { locale, t } = useSaasAdminLocale();
  const { data, error, isLoading } = useSaasAdminQuery(
    ["saas-admin", "usage"],
    () => fetchSaasUsage(6),
  );

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) {
    return (
      <div className="p-6 text-sm text-[var(--admin-danger)]">
        {error instanceof Error ? error.message : t.usage.loadError}
      </div>
    );
  }

  return (
    <>
      <AdminHeader title={t.usage.title} description={t.usage.description} />
      <AdminPageBody>
        <section className="grid gap-3 sm:grid-cols-2">
          <KpiCard
            title={t.usage.avgCloseoutsPerStore}
            value={data.avgCloseoutsPerStore.value !== null ? formatNumber(data.avgCloseoutsPerStore.value, locale) : t.common.unavailable}
            source={data.avgCloseoutsPerStore.source}
          />
          <KpiCard
            title={t.usage.avgOpsPerAccount}
            value={data.avgOperationsPerAccount.value !== null ? formatNumber(data.avgOperationsPerAccount.value, locale) : t.common.unavailable}
            source={data.avgOperationsPerAccount.source}
          />
        </section>

        <ChartCard title={t.usage.monthlyGrowth} description={t.usage.monthlyGrowthDesc} source={data.monthlyTrendSource}>
          {data.monthlyTrend.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">{t.usage.noMonthly}</p>
          ) : (
            <AdminChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={ADMIN_CHART_COLORS.grid} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} width={36} />
                  <Tooltip wrapperStyle={{ maxWidth: "min(100vw - 2rem, 18rem)" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="closeouts" name={t.common.closeouts} stroke={ADMIN_CHART_COLORS.primary} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="operations" name={t.common.operations} stroke={ADMIN_CHART_COLORS.secondary} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="attachments" name={t.common.attachments} stroke={ADMIN_CHART_COLORS.tertiary} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </AdminChartFrame>
          )}
        </ChartCard>

        <ChartCard title={t.usage.topActive}>
          {data.topActiveAccounts.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">{t.usage.noActiveAccounts}</p>
          ) : (
            <AdminChartFrame className="h-56 sm:h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.topActiveAccounts.map((row) => ({
                    name: row.name.length > 12 ? `${row.name.slice(0, 12)}…` : row.name,
                    closeouts: row.closeoutsThisMonth,
                  }))}
                  layout="vertical"
                  margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={ADMIN_CHART_COLORS.grid} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 10 }} />
                  <Tooltip wrapperStyle={{ maxWidth: "min(100vw - 2rem, 18rem)" }} />
                  <Bar dataKey="closeouts" name={t.common.closeouts} fill={ADMIN_CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </AdminChartFrame>
          )}
        </ChartCard>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">{t.usage.inactiveAccounts}</h2>
          <AdminTable
            columns={[t.accounts.colAccount, t.accounts.colOwner, t.accounts.colLastActivity, t.common.status]}
            empty={data.inactiveAccounts.length === 0}
            emptyMessage={t.usage.noInactive}
          >
            {data.inactiveAccounts.map((row) => (
              <tr key={row.id}>
                <AdminTableCell col={0}>
                  <Link href={`/saas-admin/accounts/${row.id}`} className="font-semibold text-[var(--admin-primary)] hover:underline">
                    {row.name}
                  </Link>
                </AdminTableCell>
                <AdminTableCell col={1} className="text-[var(--admin-muted)]">{row.ownerName || "—"}</AdminTableCell>
                <AdminTableCell col={2} className="text-[var(--admin-muted)]">{formatDateTime(row.lastActivityAt, locale)}</AdminTableCell>
                <AdminTableCell col={3}><StatusBadge status={row.status} /></AdminTableCell>
              </tr>
            ))}
          </AdminTable>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">{t.usage.lastActivityPerAccount}</h2>
          <AdminTable
            columns={[t.accounts.colAccount, t.accounts.colLastActivity, t.usage.daysSinceActivity]}
            empty={data.lastActivityByAccount.length === 0}
          >
            {data.lastActivityByAccount.slice(0, 25).map((row) => (
              <tr key={row.id}>
                <AdminTableCell col={0}>
                  <Link href={`/saas-admin/accounts/${row.id}`} className="font-semibold text-[var(--admin-primary)] hover:underline">
                    {row.name}
                  </Link>
                </AdminTableCell>
                <AdminTableCell col={1} className="text-[var(--admin-muted)]">{formatDateTime(row.lastActivityAt, locale)}</AdminTableCell>
                <AdminTableCell col={2}>
                  {row.daysSinceActivity !== null ? formatNumber(row.daysSinceActivity, locale) : "—"}
                </AdminTableCell>
              </tr>
            ))}
          </AdminTable>
        </section>
      </AdminPageBody>
    </>
  );
}
