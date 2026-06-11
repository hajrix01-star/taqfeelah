"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { AdminTable } from "@/features/saas-admin/components/AdminTable";
import { formatDateTime, formatNumber } from "@/features/saas-admin/components/format-utils";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import { StatusBadge } from "@/features/saas-admin/components/StatusBadge";
import { fetchSaasAccounts } from "@/features/saas-admin/client/saas-admin-api-client";
import type { SaasAccountsList } from "@/features/saas-admin/types";

const STATUS_OPTIONS = [
  { value: "all", label: "كل الحالات" },
  { value: "trial", label: "تجريبي" },
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
  { value: "suspended", label: "موقوف" },
];

export default function AccountsPage() {
  const [data, setData] = useState<SaasAccountsList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSaasAccounts({
        search: search || undefined,
        status,
        plan: plan || undefined,
        page,
        pageSize: 25,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل الحسابات");
    } finally {
      setLoading(false);
    }
  }, [search, status, plan, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <AdminHeader
        title="الحسابات"
        description="قائمة منظمات المنصة — قراءة فقط"
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              placeholder="بحث بالاسم..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              className="rounded-lg border border-[var(--admin-border)] bg-white px-3 py-2 text-sm"
            />
            <select
              value={status}
              onChange={(e) => { setPage(1); setStatus(e.target.value); }}
              className="rounded-lg border border-[var(--admin-border)] bg-white px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={plan}
              onChange={(e) => { setPage(1); setPlan(e.target.value); }}
              className="rounded-lg border border-[var(--admin-border)] bg-white px-3 py-2 text-sm"
            >
              <option value="">كل الخطط</option>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        )}
      />
      <div className="space-y-4 p-6">
        {loading ? <LoadingSkeleton /> : null}
        {error ? <p className="text-sm text-[var(--admin-danger)]">{error}</p> : null}
        {!loading && data ? (
          <>
            <AdminTable
              columns={[
                "الحساب",
                "المالك",
                "المحلات",
                "المستخدمون",
                "تقفيلات الشهر",
                "آخر نشاط",
                "الخطة",
                "الحالة",
              ]}
              empty={data.accounts.length === 0}
            >
              {data.accounts.map((row) => (
                <tr key={row.id} className="hover:bg-[#FAFBFC]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/saas-admin/accounts/${row.id}`}
                      className="font-semibold text-[var(--admin-primary)] hover:underline"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{row.ownerName || "—"}</td>
                  <td className="px-4 py-3">{formatNumber(row.storesCount)}</td>
                  <td className="px-4 py-3">{formatNumber(row.usersCount)}</td>
                  <td className="px-4 py-3">{formatNumber(row.closeoutsThisMonth)}</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{formatDateTime(row.lastActivityAt)}</td>
                  <td className="px-4 py-3">{row.planCode || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </AdminTable>
            <div className="flex items-center justify-between text-sm text-[var(--admin-muted)]">
              <span>
                صفحة
                {" "}
                {data.page}
                {" "}
                من
                {" "}
                {totalPages}
                {" "}
                —
                {" "}
                {formatNumber(data.total)}
                {" "}
                حساب
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 disabled:opacity-40"
                >
                  السابق
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 disabled:opacity-40"
                >
                  التالي
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
