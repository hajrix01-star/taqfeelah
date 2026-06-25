import type { PrototypeLang } from "./taqfeelah-app-types";
import { isoCalendarDate } from "./taqfeelah-app-notebook";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";

export function nextDayIso(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return isoCalendarDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDateTimeLabel(iso: string, lang: PrototypeLang) {
  if (!iso) return "";
  const datePart = iso.slice(0, 10);
  const time = new Date(iso).toLocaleTimeString(
    lang === "ar" ? "ar-SA-u-nu-latn" : "en-US",
    { hour: "2-digit", minute: "2-digit" },
  );
  return `${formatCalendarDate(datePart, lang)} · ${time}`;
}
