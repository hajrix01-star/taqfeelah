import type { AccountStatus } from "@/features/saas-admin/types";

export function currentMonthRangeUtc(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function lastNDaysRangeUtc(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - (days - 1));
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function resolveAccountStatus(input: {
  organizationStatus: string;
  subscriptionStatus: string | null | undefined;
}): AccountStatus {
  if (input.organizationStatus === "archived") return "archived";
  if (input.organizationStatus === "suspended") return "suspended";
  if (input.subscriptionStatus === "trialing") return "trial";
  if (input.subscriptionStatus === "active") return "active";
  return "inactive";
}

export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];
  const idx = Number(month) - 1;
  return `${months[idx] ?? month} ${year}`;
}
