export const BUSINESS_DATE_TIME_ZONE = "Asia/Riyadh";

export function businessDateInTimeZone(
  now: Date = new Date(),
  timeZone = BUSINESS_DATE_TIME_ZONE,
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function todayBusinessDateIso(now: Date = new Date()): string {
  return businessDateInTimeZone(now, BUSINESS_DATE_TIME_ZONE);
}

export function isIsoBusinessDateOnOrBefore(date: string, maxDate: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{4}-\d{2}-\d{2}$/.test(maxDate) && date <= maxDate;
}
