"use client";

import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { AdminPageBody } from "@/features/saas-admin/components/AdminPageBody";
import { ChartCard } from "@/features/saas-admin/components/ChartCard";
import {
  formatBytes,
  formatDateTime,
  formatMetricValue,
} from "@/features/saas-admin/components/format-utils";
import { KpiCard } from "@/features/saas-admin/components/KpiCard";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import { fetchSystemHealth } from "@/features/saas-admin/client/saas-admin-api-client";
import { useSaasAdminQuery } from "@/features/saas-admin/client/use-saas-admin-query";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

export default function SystemHealthPage() {
  const { locale, t } = useSaasAdminLocale();
  const { data, error, isLoading } = useSaasAdminQuery(
    ["saas-admin", "system-health"],
    fetchSystemHealth,
  );

  const metricLabels = {
    unavailable: t.common.unavailable,
    estimated: t.common.estimated,
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) {
    return (
      <div className="p-6 text-sm text-[var(--admin-danger)]">
        {error instanceof Error ? error.message : t.systemHealth.loadError}
      </div>
    );
  }

  return (
    <>
      <AdminHeader title={t.systemHealth.title} description={t.systemHealth.description} />
      <AdminPageBody>
        <section className="grid gap-4 sm:grid-cols-2">
          <KpiCard
            title={t.systemHealth.apiStatus}
            value={data.api.status === "healthy" ? t.common.working : t.common.unavailable}
            subtitle={t.systemHealth.apiMessage}
          />
          <KpiCard
            title={t.systemHealth.dbStatus}
            value={data.database.status === "healthy" ? t.common.healthy : t.common.unhealthy}
            subtitle={data.database.status === "healthy" ? t.systemHealth.dbHealthy : t.systemHealth.dbUnhealthy}
          />
        </section>

        <ChartCard title={t.systemHealth.opsMetrics}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-[var(--admin-border)] p-4">
              <p className="text-xs text-[var(--admin-muted)]">{t.systemHealth.releaseVersion}</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]" dir="ltr">
                {data.release.label}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--admin-muted)]" dir="ltr">
                {data.release.version}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--admin-border)] p-4">
              <p className="text-xs text-[var(--admin-muted)]">{t.systemHealth.lastDeploy}</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]">
                {data.lastDeploy.availability === "available" && data.lastDeploy.value
                  ? data.lastDeploy.value.slice(0, 8)
                  : t.common.unavailable}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--admin-border)] p-4">
              <p className="text-xs text-[var(--admin-muted)]">{t.systemHealth.errorCount}</p>
              <p className="mt-1 font-semibold text-[var(--admin-muted)]">
                {formatMetricValue(data.errorCount.value, data.errorCount.availability, "", locale, metricLabels)}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--admin-border)] p-4">
              <p className="text-xs text-[var(--admin-muted)]">{t.systemHealth.failedRequests}</p>
              <p className="mt-1 font-semibold text-[var(--admin-muted)]">
                {formatMetricValue(data.failedRequests.value, data.failedRequests.availability, "", locale, metricLabels)}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--admin-border)] p-4">
              <p className="text-xs text-[var(--admin-muted)]">{t.systemHealth.attachmentsSize}</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]">
                {data.attachmentsStorageBytes.availability === "available"
                  ? formatBytes(data.attachmentsStorageBytes.value)
                  : t.common.unavailable}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--admin-border)] p-4">
              <p className="text-xs text-[var(--admin-muted)]">{t.systemHealth.lastCloseout}</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]">
                {formatDateTime(data.lastCloseoutAt, locale)}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--admin-border)] p-4">
              <p className="text-xs text-[var(--admin-muted)]">{t.systemHealth.lastAttachment}</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]">
                {formatDateTime(data.lastAttachmentAt, locale)}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--admin-border)] p-4 sm:col-span-2">
              <p className="text-xs text-[var(--admin-muted)]">{t.systemHealth.lastApiUsage}</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]">
                {formatDateTime(data.lastApiUsageAt, locale)}
              </p>
            </div>
          </div>
        </ChartCard>
      </AdminPageBody>
    </>
  );
}
