import { todayIsoDate } from "@/components/prototype-runtime/prototype-runtime-notebook";

export const OWNER_CLOSEOUTS_FETCH_CAP_DAYS = 90;

function isoDaysBefore(referenceDate: string, days: number): string {
  const [year, month, day] = referenceDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - days);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function resolveOwnerCloseoutsFetchWindow(referenceDate: string = todayIsoDate()): {
  dateFrom: string;
  dateTo: string;
} {
  return {
    dateFrom: isoDaysBefore(referenceDate, OWNER_CLOSEOUTS_FETCH_CAP_DAYS),
    dateTo: referenceDate,
  };
}
