import type { CloseoutSyncLang } from "./daily-closeouts-types";

/**
 * Local closeout status vocabulary.
 * Zero-review policy: sent closeouts surface as `reviewed` in UI; `submitted` and
 * `returned` are legacy localStorage inputs normalized upstream to `reviewed`.
 */
export const CLOSEOUT_STATUS = {
  DRAFT: "draft",
  /** Legacy local value — normalized to REVIEWED on read. */
  SUBMITTED: "submitted",
  /** UI label for a sent/approved closeout (not an owner-review queue). */
  REVIEWED: "reviewed",
  /** Legacy local value — normalized to REVIEWED on read. */
  RETURNED: "returned",
} as const;

type CloseoutStatusKey = keyof typeof CLOSEOUT_STATUS;
type CloseoutStatusValue = (typeof CLOSEOUT_STATUS)[CloseoutStatusKey];

export function closeoutStatusLabel(
  status: string | null | undefined,
  lang: CloseoutSyncLang = "ar",
  { autoRecorded = false }: { autoRecorded?: boolean } = {},
): string {
  const ar: Record<string, string> = {
    draft: "مسودة (غير مرسلة)",
    submitted: "تم الإرسال",
    reviewed: autoRecorded ? "تم الإرسال" : "تم الإرسال",
    returned: "تم الإرسال",
  };
  const en: Record<string, string> = {
    draft: "In progress",
    submitted: "Sent",
    reviewed: autoRecorded ? "Sent" : "Sent",
    returned: "Sent",
  };
  const map = lang === "ar" ? ar : en;
  return map[status || ""] || status || "";
}

export function closeoutStatusTone(status: CloseoutStatusValue | string | null | undefined): string {
  if (status === CLOSEOUT_STATUS.DRAFT) return "muted";
  if (status === CLOSEOUT_STATUS.SUBMITTED) return "success";
  if (status === CLOSEOUT_STATUS.RETURNED) return "success";
  return "success";
}
