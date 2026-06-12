"use client";

import { useState } from "react";
import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { AdminPageBody } from "@/features/saas-admin/components/AdminPageBody";
import { AdminCard } from "@/features/saas-admin/components/AdminCard";
import { AdminCallout } from "@/features/saas-admin/components/AdminCallout";
import { AdminErrorAlert } from "@/features/saas-admin/components/AdminErrorAlert";
import { ChartCard } from "@/features/saas-admin/components/ChartCard";
import {
  formatBytes,
  formatDateTime,
  formatMetricValue,
} from "@/features/saas-admin/components/format-utils";
import { KpiCard } from "@/features/saas-admin/components/KpiCard";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import {
  fetchSystemHealth,
  runSaasAnalyticsAggregate,
} from "@/features/saas-admin/client/saas-admin-api-client";
import { useSaasAdminQuery } from "@/features/saas-admin/client/use-saas-admin-query";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

export default function SystemHealthPage() {
  const { locale, t } = useSaasAdminLocale();
  const { data, error, isLoading } = useSaasAdminQuery(
    ["saas-admin", "system-health"],
    fetchSystemHealth,
  );
  const [aggregating, setAggregating] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);
  const [maintenanceSuccess, setMaintenanceSuccess] = useState<string | null>(null);

  const metricLabels = {
    unavailable: t.common.unavailable,
    estimated: t.common.estimated,
  };

  async function handleRunMaintenance() {
    setMaintenanceError(null);
    setMaintenanceSuccess(null);
    setAggregating(true);
    try {
      await runSaasAnalyticsAggregate();
      setMaintenanceSuccess(t.systemHealth.maintenanceSuccess);
    } catch (aggregateError) {
      setMaintenanceError(
        aggregateError instanceof Error ? aggregateError.message : t.systemHealth.maintenanceError,
      );
    } finally {
      setAggregating(false);
    }
  }

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
      <AdminPageBody className="space-y-4">
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

        <ChartCard title={t.systemHealth.maintenanceTitle} description={t.systemHealth.maintenanceDescription}>
          {maintenanceError ? <AdminErrorAlert message={maintenanceError} /> : null}
          {maintenanceSuccess ? (
            <AdminCallout tone="info" className="mb-3">
              {maintenanceSuccess}
            </AdminCallout>
          ) : null}
          <button
            type="button"
            disabled={aggregating}
            onClick={() => { void handleRunMaintenance(); }}
            className="rounded-lg bg-[var(--admin-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {aggregating ? t.systemHealth.maintenanceRunning : t.systemHealth.maintenanceAction}
          </button>
        </ChartCard>

        <ChartCard title={t.systemHealth.opsMetrics}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminCard variant="inset" padding="sm">
              <p className="text-xs text-[var(--admin-muted)]">{t.systemHealth.releaseVersion}</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]" dir="ltr">
                {data.release.label}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--admin-muted)]" dir="ltr">
                {data.release.version}
              </p>
            </AdminCard>
            <AdminCard variant="inset" padding="sm">
              <p className="text-xs text-[var(--admin-muted)]">{t.systemHealth.lastDeploy}</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]">
                {data.lastDeploy.availability === "available" && data.lastDeploy.value
                  ? data.lastDeploy.value.slice(0, 8)
                  : t.common.unavailable}
              </p>
            </AdminCard>
            <AdminCard variant="inset" padding="sm">
              <p className="text-xs text-[var(--admin-muted)]">{t.systemHealth.errorCount}</p>
              <p className="mt-1 font-semibold text-[var(--admin-muted)]">
                {formatMetricValue(data.errorCount.value, data.errorCount.availability, "", locale, metricLabels)}
              </p>
            </AdminCard>
            <AdminCard variant="inset" padding="sm">
              <p className="text-xs text-[var(--admin-muted)]">{t.systemHealth.failedRequests}</p>
              <p className="mt-1 font-semibold text-[var(--admin-muted)]">
                {formatMetricValue(data.failedRequests.value, data.failedRequests.availability, "", locale, metricLabels)}
              </p>
            </AdminCard>
            <AdminCard variant="inset" padding="sm">
              <p className="text-xs text-[var(--admin-muted)]">{t.systemHealth.attachmentsSize}</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]">
                {data.attachmentsStorageBytes.availability === "available"
                  ? formatBytes(data.attachmentsStorageBytes.value)
                  : t.common.unavailable}
              </p>
            </AdminCard>
            <AdminCard variant="inset" padding="sm">
              <p className="text-xs text-[var(--admin-muted)]">{t.systemHealth.lastCloseout}</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]">
                {formatDateTime(data.lastCloseoutAt, locale)}
              </p>
            </AdminCard>
            <AdminCard variant="inset" padding="sm">
              <p className="text-xs text-[var(--admin-muted)]">{t.systemHealth.lastAttachment}</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]">
                {formatDateTime(data.lastAttachmentAt, locale)}
              </p>
            </AdminCard>
            <AdminCard variant="inset" padding="sm" className="sm:col-span-2">
              <p className="text-xs text-[var(--admin-muted)]">{t.systemHealth.lastApiUsage}</p>
              <p className="mt-1 font-semibold text-[var(--admin-primary)]">
                {formatDateTime(data.lastApiUsageAt, locale)}
              </p>
            </AdminCard>
          </div>
        </ChartCard>
      </AdminPageBody>
    </>
  );
}
