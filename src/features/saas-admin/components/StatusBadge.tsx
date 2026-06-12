"use client";

import type { AccountStatus } from "@/features/saas-admin/types";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

const STATUS_STYLES: Record<AccountStatus, string> = {
  trial: "bg-[var(--taq-warning-bg)] text-[var(--admin-warning)] border-[var(--taq-warning-border)]",
  active: "bg-[var(--taq-success-bg)] text-[var(--admin-success)] border-[var(--taq-border)]",
  inactive: "bg-[var(--admin-surface-muted)] text-[var(--admin-muted)] border-[var(--admin-border)]",
  suspended: "bg-[var(--taq-danger-bg)] text-[var(--admin-danger)] border-[rgba(180,71,71,0.25)]",
};

type StatusBadgeProps = {
  status: AccountStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useSaasAdminLocale();

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {t.status[status]}
    </span>
  );
}
