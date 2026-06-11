"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { ChartCard } from "@/features/saas-admin/components/ChartCard";
import {
  formatBytes,
  formatDateTime,
  formatMetricValue,
} from "@/features/saas-admin/components/format-utils";
import { KpiCard } from "@/features/saas-admin/components/KpiCard";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import { fetchSystemHealth } from "@/features/saas-admin/client/saas-admin-api-client";
import type { SystemHealthReport } from "@/features/saas-admin/types";

function healthLabel(status: string): string {
  if (status === "healthy") return "سليم";
  if (status === "unhealthy") return "غير سليم";
  return "غير متاح";
}

function healthColor(status: string): string {
  if (status === "healthy") return "text-[var(--admin-success)]";
  if (status === "unhealthy") return "text-[var(--admin-danger)]";
  return "text-[var(--admin-muted)]";
}

export default function SystemHealthPage() {
  const [data, setData] = useState<SystemHealthReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemHealth()
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error || !data) {
    return <div className="p-6 text-sm text-[var(--admin-danger)]">{error || "تعذر تحميل صحة النظام"}</div>;
  }

  return (
    <>
      <AdminHeader
        title="صحة النظام"
        description="مؤشرات تشغيلية داخلية"
      />
      <div className="space-y-6 p-6">
        <section className="grid gap-4 sm:grid-cols-2">
          <KpiCard
            title="حالة API"
            value={healthLabel(data.api.status)}
            subtitle={data.api.message}
          />
          <KpiCard
            title="حالة قاعدة البيانات"
            value={healthLabel(data.database.status)}
            subtitle={data.database.message}
          />
        </section>

        <ChartCard title="مؤشرات التشغيل">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-[var(--admin-border)] p-4">
              <p className="text-xs text-[var(--admin-muted)]">آخر deploy</p>
              <p className={`mt-1 font-semibold ${healthColor(data.lastDeploy.availability === "available" ? "healthy" : "unavailable")}`}>
                {data.lastDeploy.availability === "available" && data.lastDeploy.value
                  ? data.lastDeploy.value.slice(0, 8)
                  : "غير متاح"}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--admin-border)] p-4">
              <p className="text-xs text-[var(--admin-muted)]">عدد الأخطاء</p>
              <p className="mt-1 font-semibold text-[var(--admin-muted)]">
                {formatMetricValue(data.errorCount.value, data.errorCount.availability)}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--admin-border)] p-4">
              <p className="text-xs text-[var(--admin-muted)]">الطلبات الفاشلة</p>
              <p className="mt-1 font-semibold text-[var(--admin-muted)]">
                {formatMetricValue(data.failedRequests.value, data.failedRequests.availability)}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--admin-border)] p-4">
              <p className="text-xs text-[var(--admin-muted)]">حجم المرفقات</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]">
                {data.attachmentsStorageBytes.availability === "available"
                  ? formatBytes(data.attachmentsStorageBytes.value)
                  : "غير متاح"}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--admin-border)] p-4">
              <p className="text-xs text-[var(--admin-muted)]">آخر تقفيلة</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]">
                {formatDateTime(data.lastCloseoutAt)}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--admin-border)] p-4">
              <p className="text-xs text-[var(--admin-muted)]">آخر مرفق</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]">
                {formatDateTime(data.lastAttachmentAt)}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--admin-border)] p-4 sm:col-span-2">
              <p className="text-xs text-[var(--admin-muted)]">آخر استخدام API</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]">
                {formatDateTime(data.lastApiUsageAt)}
              </p>
            </div>
          </div>
        </ChartCard>
      </div>
    </>
  );
}
