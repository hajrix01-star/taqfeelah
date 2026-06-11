import type { AccountStatus } from "@/features/saas-admin/types";

const STATUS_STYLES: Record<AccountStatus, string> = {
  trial: "bg-amber-50 text-[var(--admin-warning)] border-amber-200",
  active: "bg-green-50 text-[var(--admin-success)] border-green-200",
  inactive: "bg-gray-50 text-[var(--admin-muted)] border-gray-200",
  suspended: "bg-red-50 text-[var(--admin-danger)] border-red-200",
};

const STATUS_LABELS: Record<AccountStatus, string> = {
  trial: "تجريبي",
  active: "نشط",
  inactive: "غير نشط",
  suspended: "موقوف",
};

type StatusBadgeProps = {
  status: AccountStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
