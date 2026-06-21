/** Allow one calendar day ahead of UTC for clients east of UTC (e.g. Asia/Riyadh). */
export const CLOSEOUT_SUBMIT_MAX_CALENDAR_DAYS_AHEAD_OF_UTC = 1;

export function isCloseoutSubmitDateAllowed(date: string, now: Date = new Date()): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof date === "string" ? date.trim() : "");
  if (!match) return false;
  const closeoutDay = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const utcToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const maxAllowedDay = utcToday + (CLOSEOUT_SUBMIT_MAX_CALENDAR_DAYS_AHEAD_OF_UTC * 86400000);
  return closeoutDay <= maxAllowedDay;
}
