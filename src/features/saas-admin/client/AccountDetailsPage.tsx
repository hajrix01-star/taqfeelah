"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { AdminPageBody } from "@/features/saas-admin/components/AdminPageBody";
import { AdminChartFrame } from "@/features/saas-admin/components/AdminChartFrame";
import { AdminTable, AdminTableCell } from "@/features/saas-admin/components/AdminTable";
import { ChartCard } from "@/features/saas-admin/components/ChartCard";
import {
  formatBytes,
  formatDateTime,
  formatNumber,
} from "@/features/saas-admin/components/format-utils";
import { KpiCard } from "@/features/saas-admin/components/KpiCard";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import { StatusBadge } from "@/features/saas-admin/components/StatusBadge";
import { AddAccountMemberForm } from "@/features/saas-admin/client/AddAccountMemberForm";
import { EditAccountForms } from "@/features/saas-admin/client/EditAccountForms";
import { fetchSaasAccountDetails } from "@/features/saas-admin/client/saas-admin-api-client";
import { useSaasAdminQuery } from "@/features/saas-admin/client/use-saas-admin-query";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type AccountDetailsPageProps = {
  accountId: string;
};

export default function AccountDetailsPage({ accountId }: AccountDetailsPageProps) {
  const { locale, t } = useSaasAdminLocale();
  const { data, error, isLoading, refetch } = useSaasAdminQuery(
    ["saas-admin", "account", accountId],
    () => fetchSaasAccountDetails(accountId),
  );

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) {
    return (
      <div className="p-6 text-sm text-[var(--admin-danger)]">
        {error instanceof Error ? error.message : t.accountDetails.notFound}
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        title={data.name}
        description={t.accountDetails.description}
        actions={(
          <Link
            href="/saas-admin/accounts"
            className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-semibold text-[var(--admin-primary)]"
          >
            {t.common.backToAccounts}
          </Link>
        )}
      />
      <AdminPageBody>
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
          <EditAccountForms
            organizationId={accountId}
            organizationName={data.name}
            organizationStatus={data.status === "suspended" ? "suspended" : "active"}
            ownerName={data.ownerName}
            ownerUsername={data.ownerUsername}
            onUpdated={() => { void refetch(); }}
          />
          <div className="space-y-4">
            <section className="flex flex-wrap items-center gap-3">
          <StatusBadge status={data.status} />
          <span className="text-sm text-[var(--admin-muted)]">
            {t.common.plan}
            :
            {" "}
            {data.planCode || "—"}
          </span>
          <span className="text-sm text-[var(--admin-muted)]">
            {t.common.owner}
            :
            {" "}
            {data.ownerName || "—"}
          </span>
          <span className="text-sm text-[var(--admin-muted)]" dir="ltr">
            {t.newAccount.ownerUsername}
            :
            {" "}
            {data.ownerUsername || "—"}
          </span>
            </section>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title={t.accountDetails.createdAt} value={formatDateTime(data.createdAt, locale)} />
          <KpiCard title={t.accountDetails.lastActivity} value={formatDateTime(data.lastActivityAt, locale)} />
          <KpiCard title={t.common.stores} value={formatNumber(data.storesCount, locale)} />
          <KpiCard title={t.common.users} value={formatNumber(data.usersCount, locale)} />
          <KpiCard title={t.accountDetails.closeoutsMonth} value={formatNumber(data.closeoutsThisMonth, locale)} />
          <KpiCard title={t.accountDetails.operations} value={formatNumber(data.operationsCount, locale)} />
          <KpiCard title={t.common.attachments} value={formatNumber(data.attachmentsCount, locale)} />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-bold text-[var(--admin-primary)]">{t.common.stores}</h2>
            <AdminTable columns={[t.common.name, t.common.status, t.accountDetails.createdAt]} empty={data.stores.length === 0}>
              {data.stores.map((row) => (
                <tr key={row.id}>
                  <AdminTableCell col={0} className="font-semibold">{row.name}</AdminTableCell>
                  <AdminTableCell col={1}>{row.status}</AdminTableCell>
                  <AdminTableCell col={2} className="text-[var(--admin-muted)]">{formatDateTime(row.createdAt, locale)}</AdminTableCell>
                </tr>
              ))}
            </AdminTable>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-bold text-[var(--admin-primary)]">{t.common.users}</h2>
            <AddAccountMemberForm
              organizationId={accountId}
              stores={data.stores}
              onCreated={() => { void refetch(); }}
            />
            <AdminTable columns={[t.common.name, t.common.role, t.common.status]} empty={data.users.length === 0}>
              {data.users.map((row) => (
                <tr key={row.id}>
                  <AdminTableCell col={0} className="font-semibold">{row.name}</AdminTableCell>
                  <AdminTableCell col={1}>{row.role}</AdminTableCell>
                  <AdminTableCell col={2}>{row.status}</AdminTableCell>
                </tr>
              ))}
            </AdminTable>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-bold text-[var(--admin-primary)]">{t.accountDetails.recentCloseouts}</h2>
            <AdminTable columns={[t.accountDetails.colStore, t.common.date, t.common.status]} empty={data.recentCloseouts.length === 0}>
              {data.recentCloseouts.map((row) => (
                <tr key={row.id}>
                  <AdminTableCell col={0}>{row.storeName}</AdminTableCell>
                  <AdminTableCell col={1}>{row.date}</AdminTableCell>
                  <AdminTableCell col={2}>{row.status}</AdminTableCell>
                </tr>
              ))}
            </AdminTable>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold text-[var(--admin-primary)]">{t.accountDetails.recentOperations}</h2>
            <AdminTable columns={[t.accountDetails.colStore, t.common.type, t.common.date]} empty={data.recentOperations.length === 0}>
              {data.recentOperations.map((row) => (
                <tr key={row.id}>
                  <AdminTableCell col={0}>{row.storeName}</AdminTableCell>
                  <AdminTableCell col={1}>{row.type}</AdminTableCell>
                  <AdminTableCell col={2}>{row.date}</AdminTableCell>
                </tr>
              ))}
            </AdminTable>
          </section>
        </div>

        <ChartCard title={t.accountDetails.monthlyUsage}>
          {data.monthlyUsage.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">{t.accountDetails.noMonthlyUsage}</p>
          ) : (
            <AdminChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyUsage} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} width={36} />
                  <Tooltip wrapperStyle={{ maxWidth: "min(100vw - 2rem, 18rem)" }} />
                  <Bar dataKey="closeouts" name={t.common.closeouts} fill="#112A46" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="operations" name={t.common.operations} fill="#F5A623" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </AdminChartFrame>
          )}
        </ChartCard>

        <section>
          <h2 className="mb-3 text-sm font-bold text-[var(--admin-primary)]">{t.accountDetails.recentAttachments}</h2>
          <AdminTable columns={[t.accountDetails.colStore, t.common.type, t.common.size, t.common.date]} empty={data.attachments.length === 0}>
            {data.attachments.map((row) => (
              <tr key={row.id}>
                <AdminTableCell col={0}>{row.storeName}</AdminTableCell>
                <AdminTableCell col={1}>{row.mimeType}</AdminTableCell>
                <AdminTableCell col={2}>{formatBytes(row.sizeBytes)}</AdminTableCell>
                <AdminTableCell col={3} className="text-[var(--admin-muted)]">{formatDateTime(row.createdAt, locale)}</AdminTableCell>
              </tr>
            ))}
          </AdminTable>
        </section>
      </AdminPageBody>
    </>
  );
}
