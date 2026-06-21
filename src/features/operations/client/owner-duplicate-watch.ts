import { todayIsoDate } from "@/components/prototype-runtime/prototype-runtime-notebook";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";

function isoDaysBefore(referenceDate: string, days: number): string {
  const [year, month, day] = referenceDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - days);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export const OWNER_DUPLICATE_WATCH_DAYS = 14;
export const OWNER_DUPLICATE_WATCH_LIMIT = 120;

export function filterOwnerDuplicateWatchEntries(entries: OperationalEntry[]): OperationalEntry[] {
  return (Array.isArray(entries) ? entries : []).filter((entry) => entry?.type === "summary" && entry?.status !== "voided");
}

export function resolveOwnerDuplicateWatchWindow(referenceDate: string = todayIsoDate()): {
  dateFrom: string;
  dateTo: string;
  limit: number;
} {
  return {
    dateFrom: isoDaysBefore(referenceDate, OWNER_DUPLICATE_WATCH_DAYS),
    dateTo: referenceDate,
    limit: OWNER_DUPLICATE_WATCH_LIMIT,
  };
}
