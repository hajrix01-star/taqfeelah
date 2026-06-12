"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AccountLifecycleBar } from "@/features/saas-admin/client/AccountLifecycleBar";
import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { AdminPageBody } from "@/features/saas-admin/components/AdminPageBody";
import { AdminChartFrame } from "@/features/saas-admin/components/AdminChartFrame";
import { AdminCompactTable, AdminCompactTableCell } from "@/features/saas-admin/components/AdminCompactTable";
import { ADMIN_CHART_COLORS } from "@/features/saas-admin/components/admin-chart-colors";
import { AdminCard } from "@/features/saas-admin/components/AdminCard";
import { ChartCard } from "@/features/saas-admin/components/ChartCard";
import {
  formatCloseoutStatus,
  formatEntityStatus,
  formatOperationType,
  formatPlanCode,
} from "@/features/saas-admin/components/admin-display-labels";
import {
  formatBytes,
  formatDateTime,
  formatNumber,
} from "@/features/saas-admin/components/format-utils";
import { KpiCard } from "@/features/saas-admin/components/KpiCard";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import { AccountSetupLinkPanel } from "@/features/saas-admin/client/AccountSetupLinkPanel";
import { AccountTeamSection } from "@/features/saas-admin/client/AccountTeamSection";
import { EditAccountForms } from "@/features/saas-admin/client/EditAccountForms";
import { fetchSaasAccountDetails } from "@/features/saas-admin/client/saas-admin-api-client";
import { useSaasAdminQuery } from "@/features/saas-admin/client/use-saas-admin-query";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type AccountDetailsPageProps = {
  accountId: string;
};

type AccountTab = "overview" | "settings" | "stores" | "team" | "activity";

const ACTIVITY_ROW_LIMIT = 5;

export default function AccountDetailsPage({ accountId }: AccountDetailsPageProps) {
  const { locale, t } = useSaasAdminLocale();
  const [activeTab, setActiveTab] = useState<AccountTab>("overview");
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

  const tabs: Array<{ id: AccountTab; label: string }> = [
    { id: "overview", label: t.accountDetails.tabOverview },
    { id: "settings", label: t.accountDetails.tabSettings },
    { id: "stores", label: t.accountDetails.tabStores },
    { id: "team", label: t.accountDetails.tabTeam },
    { id: "activity", label: t.accountDetails.tabActivity },
  ];

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
      <AdminPageBody className="space-y-4">
        <AdminCard padding="md" className="space-y-4">
          <AccountLifecycleBar
            organizationId={accountId}
            organizationStatus={data.organizationStatus}
            displayStatus={data.status}
            planCode={data.planCode}
            onUpdated={() => { void refetch(); }}
          />
          <div className="flex flex-wrap gap-1 border-b border-[var(--admin-border)] pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "bg-[var(--admin-primary)] text-white"
                    : "text-[var(--admin-muted)] hover:bg-[var(--admin-surface-muted)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </AdminCard>

        {activeTab === "overview" ? (
          <div className="space-y-4">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard title={t.accountDetails.lastActivity} value={formatDateTime(data.lastActivityAt, locale)} />
              <KpiCard title={t.common.stores} value={formatNumber(data.storesCount, locale)} />
              <KpiCard title={t.common.users} value={formatNumber(data.usersCount, locale)} />
              <KpiCard title={t.accountDetails.closeoutsMonth} value={formatNumber(data.closeoutsThisMonth, locale)} />
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <AdminCard padding="md" className="space-y-2 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">{t.common.owner}</p>
                <p className="font-semibold text-[var(--admin-text)]">{data.ownerName || "—"}</p>
                <p className="text-xs text-[var(--admin-muted)]" dir="ltr">
                  {data.ownerPhone || data.ownerUsername || "—"}
                </p>
                <p className="text-xs text-[var(--admin-muted)]">
                  {t.common.plan}
                  :
                  {" "}
                  {formatPlanCode(data.planCode, t)}
                </p>
                <p className="text-xs text-[var(--admin-muted)]">
                  {t.accountDetails.createdAt}
                  :
                  {" "}
                  {formatDateTime(data.createdAt, locale)}
                </p>
              </AdminCard>
              <AccountSetupLinkPanel
                organizationId={accountId}
                ownerName={data.ownerName || ""}
                ownerPhone={data.ownerPhone || null}
                organizationName={data.name}
                storeName={data.stores?.[0]?.name || data.name}
              />
            </div>

            <ChartCard title={t.accountDetails.monthlyUsage}>
              {data.monthlyUsage.length === 0 ? (
                <p className="text-sm text-[var(--admin-muted)]">{t.accountDetails.noMonthlyUsage}</p>
              ) : (
                <AdminChartFrame>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlyUsage} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={ADMIN_CHART_COLORS.grid} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10 }} width={36} />
                      <Tooltip wrapperStyle={{ maxWidth: "min(100vw - 2rem, 18rem)" }} />
                      <Bar dataKey="closeouts" name={t.common.closeouts} fill={ADMIN_CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="operations" name={t.common.operations} fill={ADMIN_CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </AdminChartFrame>
              )}
            </ChartCard>
          </div>
        ) : null}

        {activeTab === "settings" ? (
          <EditAccountForms
            organizationId={accountId}
            organizationName={data.name}
            planCode={data.planCode}
            ownerName={data.ownerName}
            ownerUsername={data.ownerUsername}
            onUpdated={() => { void refetch(); }}
          />
        ) : null}

        {activeTab === "stores" ? (
          <AdminCompactTable
            columns={[t.common.name, t.common.status, t.accountDetails.createdAt]}
            empty={data.stores.length === 0}
            emptyMessage={t.common.noData}
          >
            {data.stores.map((row) => (
              <tr key={row.id} className="hover:bg-[var(--admin-hover)]">
                <AdminCompactTableCell col={0} className="font-semibold text-[var(--admin-text)]">
                  {row.name}
                </AdminCompactTableCell>
                <AdminCompactTableCell col={1}>{formatEntityStatus(row.status, t)}</AdminCompactTableCell>
                <AdminCompactTableCell col={2} className="text-[var(--admin-muted)]">
                  {formatDateTime(row.createdAt, locale)}
                </AdminCompactTableCell>
              </tr>
            ))}
          </AdminCompactTable>
        ) : null}

        {activeTab === "team" ? (
          <AccountTeamSection
            organizationId={accountId}
            stores={data.stores}
            users={data.users}
            onUpdated={() => { void refetch(); }}
          />
        ) : null}

        {activeTab === "activity" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--admin-muted)]">
                {t.accountDetails.recentCloseouts}
              </h2>
              <AdminCompactTable
                columns={[t.accountDetails.colStore, t.common.date, t.common.status]}
                empty={data.recentCloseouts.length === 0}
                emptyMessage={t.common.noData}
              >
                {data.recentCloseouts.slice(0, ACTIVITY_ROW_LIMIT).map((row) => (
                  <tr key={row.id}>
                    <AdminCompactTableCell col={0}>{row.storeName}</AdminCompactTableCell>
                    <AdminCompactTableCell col={1}>{row.date}</AdminCompactTableCell>
                    <AdminCompactTableCell col={2}>{formatCloseoutStatus(row.status, t)}</AdminCompactTableCell>
                  </tr>
                ))}
              </AdminCompactTable>
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--admin-muted)]">
                {t.accountDetails.recentOperations}
              </h2>
              <AdminCompactTable
                columns={[t.accountDetails.colStore, t.common.type, t.common.date]}
                empty={data.recentOperations.length === 0}
                emptyMessage={t.common.noData}
              >
                {data.recentOperations.slice(0, ACTIVITY_ROW_LIMIT).map((row) => (
                  <tr key={row.id}>
                    <AdminCompactTableCell col={0}>{row.storeName}</AdminCompactTableCell>
                    <AdminCompactTableCell col={1}>{formatOperationType(row.type, t)}</AdminCompactTableCell>
                    <AdminCompactTableCell col={2}>{row.date}</AdminCompactTableCell>
                  </tr>
                ))}
              </AdminCompactTable>
            </section>

            <section className="space-y-2 lg:col-span-2">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--admin-muted)]">
                {t.accountDetails.recentAttachments}
              </h2>
              <AdminCompactTable
                columns={[t.accountDetails.colStore, t.common.type, t.common.size, t.common.date]}
                empty={data.attachments.length === 0}
                emptyMessage={t.common.noData}
              >
                {data.attachments.slice(0, ACTIVITY_ROW_LIMIT).map((row) => (
                  <tr key={row.id}>
                    <AdminCompactTableCell col={0}>{row.storeName}</AdminCompactTableCell>
                    <AdminCompactTableCell col={1}>{row.mimeType}</AdminCompactTableCell>
                    <AdminCompactTableCell col={2}>{formatBytes(row.sizeBytes)}</AdminCompactTableCell>
                    <AdminCompactTableCell col={3} className="text-[var(--admin-muted)]">
                      {formatDateTime(row.createdAt, locale)}
                    </AdminCompactTableCell>
                  </tr>
                ))}
              </AdminCompactTable>
            </section>
          </div>
        ) : null}
      </AdminPageBody>
    </>
  );
}
