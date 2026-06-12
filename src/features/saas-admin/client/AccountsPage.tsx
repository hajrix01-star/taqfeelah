"use client";

import { useCallback, useState, type ReactNode } from "react";
import Link from "next/link";
import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { AdminPageBody } from "@/features/saas-admin/components/AdminPageBody";
import { AdminTable, AdminTableCell } from "@/features/saas-admin/components/AdminTable";
import { formatPlanCode } from "@/features/saas-admin/components/admin-display-labels";
import { formatDateTime, formatNumber } from "@/features/saas-admin/components/format-utils";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import { StatusBadge } from "@/features/saas-admin/components/StatusBadge";
import { fetchSaasAccounts } from "@/features/saas-admin/client/saas-admin-api-client";
import { useSaasAdminQuery } from "@/features/saas-admin/client/use-saas-admin-query";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type AccountFiltersProps = {
  search: string;
  status: string;
  plan: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPlanChange: (value: string) => void;
};

function AccountFilters({
  search,
  status,
  plan,
  onSearchChange,
  onStatusChange,
  onPlanChange,
}: AccountFiltersProps) {
  const { t } = useSaasAdminLocale();

  return (
    <>
      <input
        type="search"
        placeholder={t.common.searchByName}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="admin-filter-field min-w-0 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2.5 text-sm lg:w-52"
      />
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="admin-filter-field rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2.5 text-sm"
      >
        <option value="all">{t.common.allStatuses}</option>
        <option value="trial">{t.status.trial}</option>
        <option value="active">{t.status.active}</option>
        <option value="inactive">{t.status.inactive}</option>
        <option value="suspended">{t.status.suspended}</option>
      </select>
      <select
        value={plan}
        onChange={(e) => onPlanChange(e.target.value)}
        className="admin-filter-field rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2.5 text-sm"
      >
        <option value="">{t.common.allPlans}</option>
        <option value="trial">{t.plans.trial}</option>
        <option value="starter">{t.plans.starter}</option>
        <option value="growth">{t.plans.growth}</option>
        <option value="enterprise">{t.plans.enterprise}</option>
      </select>
    </>
  );
}

function NewAccountButton({ className = "" }: { className?: string }) {
  const { t } = useSaasAdminLocale();
  return (
    <Link
      href="/saas-admin/accounts/new"
      className={`rounded-lg bg-[var(--admin-primary)] px-3 py-2.5 text-center text-sm font-semibold text-white ${className}`.trim()}
    >
      {t.accounts.newAccount}
    </Link>
  );
}

function DesktopHeaderActions({ children }: { children: ReactNode }) {
  return <div className="hidden w-full flex-col gap-2 lg:flex lg:w-auto lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">{children}</div>;
}

export default function AccountsPage() {
  const { locale, t } = useSaasAdminLocale();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("");
  const [page, setPage] = useState(1);

  const resetPage = useCallback(() => setPage(1), []);

  const queryFn = useCallback(
    () => fetchSaasAccounts({
      search: search || undefined,
      status,
      plan: plan || undefined,
      page,
      pageSize: 25,
    }),
    [search, status, plan, page],
  );

  const { data, error, isLoading, isFetching } = useSaasAdminQuery(
    ["saas-admin", "accounts", search, status, plan, page],
    queryFn,
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const tableColumns = [
    t.accounts.colAccount,
    t.accounts.colOwner,
    t.accounts.colStores,
    t.accounts.colUsers,
    t.accounts.colCloseoutsMonth,
    t.accounts.colLastActivity,
    t.accounts.colPlan,
    t.accounts.colStatus,
  ];

  const filters = (
    <AccountFilters
      search={search}
      status={status}
      plan={plan}
      onSearchChange={(value) => { resetPage(); setSearch(value); }}
      onStatusChange={(value) => { resetPage(); setStatus(value); }}
      onPlanChange={(value) => { resetPage(); setPlan(value); }}
    />
  );

  return (
    <>
      <AdminHeader
        title={t.accounts.title}
        description={t.accounts.description}
        actions={(
          <DesktopHeaderActions>
            <NewAccountButton className="w-full lg:w-auto" />
            {filters}
          </DesktopHeaderActions>
        )}
      />
      <AdminPageBody>
        <div className="space-y-2 lg:hidden">
          <NewAccountButton className="block w-full" />
          <div className="grid gap-2">{filters}</div>
        </div>
        {isLoading || isFetching ? <LoadingSkeleton /> : null}
        {error ? (
          <p className="text-sm text-[var(--admin-danger)]">
            {error instanceof Error ? error.message : t.accounts.loadError}
          </p>
        ) : null}
        {!isLoading && data ? (
          <>
            <AdminTable columns={tableColumns} empty={data.accounts.length === 0}>
              {data.accounts.map((row) => (
                <tr key={row.id} className="hover:bg-[var(--admin-hover)]">
                  <AdminTableCell col={0}>
                    <Link href={`/saas-admin/accounts/${row.id}`} className="font-semibold text-[var(--admin-primary)] hover:underline">
                      {row.name}
                    </Link>
                  </AdminTableCell>
                  <AdminTableCell col={1} className="text-[var(--admin-muted)]">{row.ownerName || "—"}</AdminTableCell>
                  <AdminTableCell col={2}>{formatNumber(row.storesCount, locale)}</AdminTableCell>
                  <AdminTableCell col={3}>{formatNumber(row.usersCount, locale)}</AdminTableCell>
                  <AdminTableCell col={4}>{formatNumber(row.closeoutsThisMonth, locale)}</AdminTableCell>
                  <AdminTableCell col={5} className="text-[var(--admin-muted)]">{formatDateTime(row.lastActivityAt, locale)}</AdminTableCell>
                  <AdminTableCell col={6}>{formatPlanCode(row.planCode, t)}</AdminTableCell>
                  <AdminTableCell col={7}><StatusBadge status={row.status} /></AdminTableCell>
                </tr>
              ))}
            </AdminTable>
            <div className="flex flex-col gap-3 text-sm text-[var(--admin-muted)] sm:flex-row sm:items-center sm:justify-between">
              <span>
                {t.common.page}
                {" "}
                {data.page}
                {" "}
                {t.common.of}
                {" "}
                {totalPages}
                {" "}
                —
                {" "}
                {formatNumber(data.total, locale)}
                {" "}
                {t.common.accounts}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex-1 rounded-lg border border-[var(--admin-border)] px-3 py-2 disabled:opacity-40 sm:flex-none"
                >
                  {t.common.previous}
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex-1 rounded-lg border border-[var(--admin-border)] px-3 py-2 disabled:opacity-40 sm:flex-none"
                >
                  {t.common.next}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </AdminPageBody>
    </>
  );
}
