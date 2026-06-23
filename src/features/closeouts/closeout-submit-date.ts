import { isIsoBusinessDateOnOrBefore, todayBusinessDateIso } from "@/core/date/business-date";

export function isCloseoutSubmitDateAllowed(date: string, now: Date = new Date()): boolean {
  const normalizedDate = typeof date === "string" ? date.trim() : "";
  return isIsoBusinessDateOnOrBefore(normalizedDate, todayBusinessDateIso(now));
}
