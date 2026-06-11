"use client";

import { useEffect, useState } from "react";
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
import type { SaasOverview } from "@/features/saas-admin/types";

export default function OverviewPage() {
  const [data, setData] = useState<SaasOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaasOverview()
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error || !data) {
    return (
      <div className="p-6 text-sm text-[var(--admin-danger)]">
        {error || "تعذر تحميل البيانات"}
      </div>
    );
  }

  const { kpis, activityTrend, topActiveAccounts, inactiveAccounts, systemHealth } = data;

  return (
    <>
      <AdminHeader
        title="نظرة عامة"
        description="ملخص المنصة والمؤشرات الرئيسية"
      />
      <div className="space-y-6 p-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="إجمالي الحسابات" value={formatNumber(kpis.totalAccounts)} />
          <KpiCard title="الحسابات النشطة" value={formatNumber(kpis.activeAccounts)} />
          <KpiCard title="عدد المحلات" value={formatNumber(kpis.storesCount)} />
          <KpiCard title="عدد المستخدمين" value={formatNumber(kpis.usersCount)} />
          <KpiCard title="تقفيلات هذا الشهر" value={formatNumber(kpis.closeoutsThisMonth)} />
          <KpiCard title="العمليات هذا الشهر" value={formatNumber(kpis.operationsThisMonth)} />
          <KpiCard title="عدد المرفقات" value={formatNumber(kpis.attachmentsCount)} />
          <KpiCard
            title="آخر نشاط في النظام"
            value={formatDateTime(kpis.lastActivityAt)}
          />
        </section>

        <ChartCard title="نشاط آخر 30 يوم" description="تقفيلات وعمليات يومية">
          {activityTrend.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">لا توجد بيانات نشاط بعد.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="closeouts"
                    name="تقفيلات"
                    stroke="#112A46"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="operations"
                    name="عمليات"
                    stroke="#F5A623"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-bold text-[var(--admin-primary)]">أكثر الحسابات نشاطًا</h2>
            <AdminTable
              columns={["الحساب", "التقفيلات", "آخر نشاط", "الحالة"]}
              empty={topActiveAccounts.length === 0}
            >
              {topActiveAccounts.map((row) => (
                <tr key={row.id} className="hover:bg-[#FAFBFC]">
                  <td className="px-4 py-3">
                    <Link href={`/saas-admin/accounts/${row.id}`} className="font-semibold text-[var(--admin-primary)] hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{formatNumber(row.closeoutsThisMonth)}</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{formatDateTime(row.lastActivityAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </AdminTable>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold text-[var(--admin-primary)]">الحسابات الخاملة</h2>
            <AdminTable
              columns={["الحساب", "آخر نشاط", "الحالة"]}
              empty={inactiveAccounts.length === 0}
              emptyMessage="لا توجد حسابات خاملة حاليًا"
            >
              {inactiveAccounts.map((row) => (
                <tr key={row.id} className="hover:bg-[#FAFBFC]">
                  <td className="px-4 py-3">
                    <Link href={`/saas-admin/accounts/${row.id}`} className="font-semibold text-[var(--admin-primary)] hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{formatDateTime(row.lastActivityAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </AdminTable>
          </section>
        </div>

        <ChartCard title="ملخص سريع لصحة النظام">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--admin-border)] p-4">
              <p className="text-xs text-[var(--admin-muted)]">قاعدة البيانات</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]">
                {systemHealth.database === "healthy" ? "سليمة" : "تحتاج مراجعة"}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--admin-border)] p-4">
              <p className="text-xs text-[var(--admin-muted)]">API</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]">
                {systemHealth.api === "healthy" ? "يعمل" : "غير متاح"}
              </p>
            </div>
          </div>
        </ChartCard>
      </div>
    </>
  );
}
