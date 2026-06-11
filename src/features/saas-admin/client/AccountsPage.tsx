"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { AdminTable } from "@/features/saas-admin/components/AdminTable";
import { formatDateTime, formatNumber } from "@/features/saas-admin/components/format-utils";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import { StatusBadge } from "@/features/saas-admin/components/StatusBadge";
import { fetchSaasAccounts } from "@/features/saas-admin/client/saas-admin-api-client";
import { useSaasAdminQuery } from "@/features/saas-admin/client/use-saas-admin-query";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

export default function AccountsPage() {
  const { locale, t } = useSaasAdminLocale();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("");
  const [page, setPage] = useState(1);

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

  return (
    <>
      <AdminHeader
        title={t.accounts.title}
        description={t.accounts.description}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/saas-admin/accounts/new"
              className="rounded-lg bg-[var(--admin-primary)] px-3 py-2 text-sm font-semibold text-white"
            >
              {t.accounts.newAccount}
            </Link>
            <input
              type="search"
              placeholder={t.common.searchByName}
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              className="rounded-lg border border-[var(--admin-border)] bg-white px-3 py-2 text-sm"
            />
            <select
              value={status}
              onChange={(e) => { setPage(1); setStatus(e.target.value); }}
              className="rounded-lg border border-[var(--admin-border)] bg-white px-3 py-2 text-sm"
            >
              <option value="all">{t.common.allStatuses}</option>
              <option value="trial">{t.status.trial}</option>
              <option value="active">{t.status.active}</option>
              <option value="inactive">{t.status.inactive}</option>
              <option value="suspended">{t.status.suspended}</option>
            </select>
            <select
              value={plan}
              onChange={(e) => { setPage(1); setPlan(e.target.value); }}
              className="rounded-lg border border-[var(--admin-border)] bg-white px-3 py-2 text-sm"
            >
              <option value="">{t.common.allPlans}</option>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        )}
      />
      <div className="space-y-4 p-6">
        {isLoading || isFetching ? <LoadingSkeleton /> : null}
        {error ? (
          <p className="text-sm text-[var(--admin-danger)]">
            {error instanceof Error ? error.message : t.accounts.loadError}
          </p>
        ) : null}
        {!isLoading && data ? (
          <>
            <AdminTable
              columns={[
                t.accounts.colAccount,
                t.accounts.colOwner,
                t.accounts.colStores,
                t.accounts.colUsers,
                t.accounts.colCloseoutsMonth,
                t.accounts.colLastActivity,
                t.accounts.colPlan,
                t.accounts.colStatus,
              ]}
              empty={data.accounts.length === 0}
            >
              {data.accounts.map((row) => (
                <tr key={row.id} className="hover:bg-[#FAFBFC]">
                  <td className="px-4 py-3">
                    <Link href={`/saas-admin/accounts/${row.id}`} className="font-semibold text-[var(--admin-primary)] hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{row.ownerName || "—"}</td>
                  <td className="px-4 py-3">{formatNumber(row.storesCount, locale)}</td>
                  <td className="px-4 py-3">{formatNumber(row.usersCount, locale)}</td>
                  <td className="px-4 py-3">{formatNumber(row.closeoutsThisMonth, locale)}</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{formatDateTime(row.lastActivityAt, locale)}</td>
                  <td className="px-4 py-3">{row.planCode || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </AdminTable>
            <div className="flex items-center justify-between text-sm text-[var(--admin-muted)]">
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
                  className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 disabled:opacity-40"
                >
                  {t.common.previous}
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 disabled:opacity-40"
                >
                  {t.common.next}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
