/**
 * Demo/local closeout status vocabulary.
 * Zero-review policy: sent closeouts surface as `reviewed` in UI; `submitted` and
 * `returned` are legacy localStorage/demo inputs normalized upstream to `reviewed`.
 */
export const CLOSEOUT_STATUS = {
  DRAFT: "draft",
  /** Legacy demo seed value — normalized to REVIEWED on read. */
  SUBMITTED: "submitted",
  /** UI label for a sent/approved closeout (not an owner-review queue). */
  REVIEWED: "reviewed",
  /** Legacy demo seed value — normalized to REVIEWED on read. */
  RETURNED: "returned",
};

export function closeoutStatusLabel(status, lang = "ar", { autoRecorded = false } = {}) {
  const ar = {
    draft: "مسودة (غير مرسلة)",
    submitted: "تم الإرسال",
    reviewed: autoRecorded ? "تم الإرسال" : "تم الإرسال",
    returned: "تم الإرسال",
  };
  const en = {
    draft: "In progress",
    submitted: "Sent",
    reviewed: autoRecorded ? "Sent" : "Sent",
    returned: "Sent",
  };
  const map = lang === "ar" ? ar : en;
  return map[status] || status;
}

export function closeoutStatusTone(status) {
  if (status === CLOSEOUT_STATUS.DRAFT) return "muted";
  if (status === CLOSEOUT_STATUS.SUBMITTED) return "success";
  if (status === CLOSEOUT_STATUS.RETURNED) return "success";
  return "success";
}
