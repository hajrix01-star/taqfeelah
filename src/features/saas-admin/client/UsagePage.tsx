"use client";

import { useEffect, useState } from "react";
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
import { AdminTable } from "@/features/saas-admin/components/AdminTable";
import { ChartCard } from "@/features/saas-admin/components/ChartCard";
import { formatDateTime, formatNumber } from "@/features/saas-admin/components/format-utils";
import { KpiCard } from "@/features/saas-admin/components/KpiCard";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import { StatusBadge } from "@/features/saas-admin/components/StatusBadge";
import { fetchSaasUsage } from "@/features/saas-admin/client/saas-admin-api-client";
import type { SaasUsageReport } from "@/features/saas-admin/types";

export default function UsagePage() {
  const [data, setData] = useState<SaasUsageReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaasUsage(6)
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error || !data) {
    return <div className="p-6 text-sm text-[var(--admin-danger)]">{error || "تعذر تحميل التقرير"}</div>;
  }

  return (
    <>
      <AdminHeader
        title="تقارير الاستخدام"
        description="هل العملاء يستخدمون تقفيلة فعليًا؟"
      />
      <div className="space-y-6 p-6">
        <section className="grid gap-4 sm:grid-cols-2">
          <KpiCard
            title="متوسط التقفيلات لكل محل"
            value={data.avgCloseoutsPerStore !== null ? formatNumber(data.avgCloseoutsPerStore) : "غير متاح"}
          />
          <KpiCard
            title="متوسط العمليات لكل حساب"
            value={data.avgOperationsPerAccount !== null ? formatNumber(data.avgOperationsPerAccount) : "غير متاح"}
          />
        </section>

        <ChartCard title="النمو الشهري" description="تقفيلات وعمليات ومرفقات">
          {data.monthlyTrend.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">لا توجد بيانات شهرية.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="closeouts" name="تقفيلات" stroke="#112A46" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="operations" name="عمليات" stroke="#F5A623" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="attachments" name="مرفقات" stroke="#6B7280" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="أكثر الحسابات نشاطًا">
          {data.topActiveAccounts.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">لا توجد حسابات نشطة.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.topActiveAccounts.map((row) => ({
                    name: row.name.length > 16 ? `${row.name.slice(0, 16)}…` : row.name,
                    closeouts: row.closeoutsThisMonth,
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="closeouts" name="تقفيلات" fill="#112A46" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <section>
          <h2 className="mb-3 text-sm font-bold text-[var(--admin-primary)]">الحسابات الخاملة</h2>
          <AdminTable
            columns={["الحساب", "المالك", "آخر نشاط", "الحالة"]}
            empty={data.inactiveAccounts.length === 0}
            emptyMessage="لا توجد حسابات خاملة"
          >
            {data.inactiveAccounts.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <Link href={`/saas-admin/accounts/${row.id}`} className="font-semibold text-[var(--admin-primary)] hover:underline">
                    {row.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--admin-muted)]">{row.ownerName || "—"}</td>
                <td className="px-4 py-3 text-[var(--admin-muted)]">{formatDateTime(row.lastActivityAt)}</td>
                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </AdminTable>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold text-[var(--admin-primary)]">آخر نشاط لكل حساب</h2>
          <AdminTable
            columns={["الحساب", "آخر نشاط", "أيام منذ النشاط"]}
            empty={data.lastActivityByAccount.length === 0}
          >
            {data.lastActivityByAccount.slice(0, 25).map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <Link href={`/saas-admin/accounts/${row.id}`} className="font-semibold text-[var(--admin-primary)] hover:underline">
                    {row.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--admin-muted)]">{formatDateTime(row.lastActivityAt)}</td>
                <td className="px-4 py-3">
                  {row.daysSinceActivity !== null ? formatNumber(row.daysSinceActivity) : "—"}
                </td>
              </tr>
            ))}
          </AdminTable>
        </section>
      </div>
    </>
  );
}
