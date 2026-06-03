export const CLOSEOUT_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  REVIEWED: "reviewed",
  RETURNED: "returned",
};

export function closeoutStatusLabel(status, lang = "ar", { reviewWorkflowEnabled = true, autoRecorded = false } = {}) {
  const ar = {
    draft: "جاري الإدخال",
    submitted: "بانتظار المراجعة",
    reviewed: autoRecorded || !reviewWorkflowEnabled ? "تم الإرسال" : "تمت المراجعة",
    returned: "تحتاج تعديل",
  };
  const en = {
    draft: "In progress",
    submitted: "Pending review",
    reviewed: autoRecorded || !reviewWorkflowEnabled ? "Sent" : "Reviewed",
    returned: "Needs edit",
  };
  const map = lang === "ar" ? ar : en;
  return map[status] || status;
}

export function closeoutStatusTone(status) {
  if (status === CLOSEOUT_STATUS.DRAFT) return "muted";
  if (status === CLOSEOUT_STATUS.SUBMITTED) return "pending";
  if (status === CLOSEOUT_STATUS.RETURNED) return "warning";
  return "success";
}
