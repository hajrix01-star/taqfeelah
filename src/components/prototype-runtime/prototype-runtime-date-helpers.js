import { isoCalendarDate } from "./prototype-runtime-notebook";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";

export function nextDayIso(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return isoCalendarDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDateTimeLabel(iso, lang) {
  if (!iso) return "";
  const datePart = iso.slice(0, 10);
  const time = new Date(iso).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" });
  return `${formatCalendarDate(datePart, lang)} · ${time}`;
}
