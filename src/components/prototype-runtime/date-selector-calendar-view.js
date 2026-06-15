/**
 * Maps an ISO date (yyyy-mm-dd) to calendar grid coordinates.
 * Uses noon local time to avoid DST edge cases around midnight.
 */
export function calendarViewFromIsoDate(isoDate = "") {
  const fallback = new Date();
  const trimmed = String(isoDate || "").trim();
  const parsed = trimmed ? new Date(`${trimmed}T12:00:00`) : fallback;
  if (Number.isNaN(parsed.getTime())) {
    return { year: fallback.getFullYear(), month: fallback.getMonth() };
  }
  return { year: parsed.getFullYear(), month: parsed.getMonth() };
}
