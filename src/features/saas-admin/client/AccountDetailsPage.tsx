"use client";

import { useEffect, useState } from "react";
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
import { AdminTable } from "@/features/saas-admin/components/AdminTable";
import { ChartCard } from "@/features/saas-admin/components/ChartCard";
import {
  formatBytes,
  formatDateTime,
  formatNumber,
} from "@/features/saas-admin/components/format-utils";
import { KpiCard } from "@/features/saas-admin/components/KpiCard";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import { StatusBadge } from "@/features/saas-admin/components/StatusBadge";
import { fetchSaasAccountDetails } from "@/features/saas-admin/client/saas-admin-api-client";
import type { SaasAccountDetails } from "@/features/saas-admin/types";

type AccountDetailsPageProps = {
  accountId: string;
};

export default function AccountDetailsPage({ accountId }: AccountDetailsPageProps) {
  const [data, setData] = useState<SaasAccountDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaasAccountDetails(accountId)
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [accountId]);

  if (loading) return <LoadingSkeleton />;
  if (error || !data) {
    return <div className="p-6 text-sm text-[var(--admin-danger)]">{error || "الحساب غير موجود"}</div>;
  }

  return (
    <>
      <AdminHeader
        title={data.name}
        description="تفاصيل الحساب — قراءة فقط"
        actions={(
          <Link
            href="/saas-admin/accounts"
            className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-semibold text-[var(--admin-primary)]"
          >
            العودة للحسابات
          </Link>
        )}
      />
      <div className="space-y-6 p-6">
        <section className="flex flex-wrap items-center gap-3">
          <StatusBadge status={data.status} />
          <span className="text-sm text-[var(--admin-muted)]">
            الخطة:
            {" "}
            {data.planCode || "—"}
          </span>
          <span className="text-sm text-[var(--admin-muted)]">
            المالك:
            {" "}
            {data.ownerName || "—"}
          </span>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="تاريخ الإنشاء" value={formatDateTime(data.createdAt)} />
          <KpiCard title="آخر نشاط" value={formatDateTime(data.lastActivityAt)} />
          <KpiCard title="المحلات" value={formatNumber(data.storesCount)} />
          <KpiCard title="المستخدمون" value={formatNumber(data.usersCount)} />
          <KpiCard title="تقفيلات الشهر" value={formatNumber(data.closeoutsThisMonth)} />
          <KpiCard title="العمليات" value={formatNumber(data.operationsCount)} />
          <KpiCard title="المرفقات" value={formatNumber(data.attachmentsCount)} />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-bold text-[var(--admin-primary)]">المحلات</h2>
            <AdminTable columns={["الاسم", "الحالة", "تاريخ الإنشاء"]} empty={data.stores.length === 0}>
              {data.stores.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-semibold">{row.name}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{formatDateTime(row.createdAt)}</td>
                </tr>
              ))}
            </AdminTable>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold text-[var(--admin-primary)]">المستخدمون</h2>
            <AdminTable columns={["الاسم", "الدور", "الحالة"]} empty={data.users.length === 0}>
              {data.users.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-semibold">{row.name}</td>
                  <td className="px-4 py-3">{row.role}</td>
                  <td className="px-4 py-3">{row.status}</td>
                </tr>
              ))}
            </AdminTable>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-bold text-[var(--admin-primary)]">آخر التقفيلات</h2>
            <AdminTable columns={["المحل", "التاريخ", "الحالة"]} empty={data.recentCloseouts.length === 0}>
              {data.recentCloseouts.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">{row.storeName}</td>
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3">{row.status}</td>
                </tr>
              ))}
            </AdminTable>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold text-[var(--admin-primary)]">آخر العمليات</h2>
            <AdminTable columns={["المحل", "النوع", "التاريخ"]} empty={data.recentOperations.length === 0}>
              {data.recentOperations.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">{row.storeName}</td>
                  <td className="px-4 py-3">{row.type}</td>
                  <td className="px-4 py-3">{row.date}</td>
                </tr>
              ))}
            </AdminTable>
          </section>
        </div>

        <ChartCard title="الاستخدام الشهري">
          {data.monthlyUsage.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">لا توجد بيانات استخدام شهرية.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="closeouts" name="تقفيلات" fill="#112A46" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="operations" name="عمليات" fill="#F5A623" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <section>
          <h2 className="mb-3 text-sm font-bold text-[var(--admin-primary)]">المرفقات الأخيرة</h2>
          <AdminTable columns={["المحل", "النوع", "الحجم", "التاريخ"]} empty={data.attachments.length === 0}>
            {data.attachments.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">{row.storeName}</td>
                <td className="px-4 py-3">{row.mimeType}</td>
                <td className="px-4 py-3">{formatBytes(row.sizeBytes)}</td>
                <td className="px-4 py-3 text-[var(--admin-muted)]">{formatDateTime(row.createdAt)}</td>
              </tr>
            ))}
          </AdminTable>
        </section>
      </div>
    </>
  );
}
