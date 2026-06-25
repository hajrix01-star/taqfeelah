"use client";

import { useState } from "react";
import { updateSaasAccount } from "@/features/saas-admin/client/saas-admin-api-client";
import { mapSaasAdminApiError } from "@/features/saas-admin/client/api-error";
import { AdminCallout } from "@/features/saas-admin/components/AdminCallout";
import { StatusBadge } from "@/features/saas-admin/components/StatusBadge";
import { formatPlanCode } from "@/features/saas-admin/components/admin-display-labels";
import type { AccountStatus, OrganizationLifecycleStatus } from "@/features/saas-admin/types";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";
import { appConfirm } from "@/lib/ui/app-dialog/app-dialog-bridge";

type AccountLifecycleBarProps = {
  organizationId: string;
  organizationStatus: OrganizationLifecycleStatus;
  displayStatus: AccountStatus;
  planCode: string | null;
  onUpdated: () => void;
};

export function AccountLifecycleBar({
  organizationId,
  organizationStatus,
  displayStatus,
  planCode,
  onUpdated,
}: AccountLifecycleBarProps) {
  const { t, locale } = useSaasAdminLocale();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function applyStatus(nextStatus: "active" | "suspended" | "archived", confirmMessage: string) {
    if (!(await appConfirm({ lang: locale, title: confirmMessage, confirmLabel: t.common.confirm, cancelLabel: t.common.cancel, variant: "danger" }))) return;
    setError(null);
    setSuccess(null);
    setIsProcessing(true);
    try {
      await updateSaasAccount(organizationId, { status: nextStatus });
      setSuccess(t.accountDetails.lifecycleSuccess);
      onUpdated();
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? mapSaasAdminApiError(statusError, t) || t.accountDetails.lifecycleError
          : t.accountDetails.lifecycleError,
      );
    } finally {
      setIsProcessing(false);
    }
  }

  const isActive = organizationStatus === "active" || organizationStatus === "pending_activation";
  const isSuspended = organizationStatus === "suspended";
  const isArchived = organizationStatus === "archived";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={displayStatus} />
        <span className="text-xs text-[var(--admin-muted)]">
          {t.common.plan}
          :
          {" "}
          {formatPlanCode(planCode, t)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {isActive ? (
          <>
            <button
              type="button"
              disabled={isProcessing}
              title={t.accountDetails.suspendHint}
              onClick={() => { void applyStatus("suspended", t.accountDetails.suspendConfirm); }}
              className="rounded-lg border border-[var(--taq-warning-border)] bg-[var(--taq-warning-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-warning)] disabled:opacity-50"
            >
              {isProcessing ? t.accountDetails.lifecycleProcessing : t.accountDetails.suspendAction}
            </button>
            <button
              type="button"
              disabled={isProcessing}
              title={t.accountDetails.archiveHint}
              onClick={() => { void applyStatus("archived", t.accountDetails.archiveConfirm); }}
              className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-muted)] disabled:opacity-50"
            >
              {isProcessing ? t.accountDetails.lifecycleProcessing : t.accountDetails.archiveAction}
            </button>
          </>
        ) : null}
        {isSuspended ? (
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => { void applyStatus("active", t.accountDetails.reactivateConfirm); }}
            className="rounded-lg bg-[var(--admin-primary)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {isProcessing ? t.accountDetails.lifecycleProcessing : t.accountDetails.reactivateAction}
          </button>
        ) : null}
        {isArchived ? (
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => { void applyStatus("active", t.accountDetails.restoreConfirm); }}
            className="rounded-lg bg-[var(--admin-primary)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {isProcessing ? t.accountDetails.lifecycleProcessing : t.accountDetails.restoreAction}
          </button>
        ) : null}
      </div>

      {error ? <AdminCallout tone="danger">{error}</AdminCallout> : null}
      {success ? <AdminCallout tone="info">{success}</AdminCallout> : null}
    </div>
  );
}
